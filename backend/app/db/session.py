from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_db() -> None:
    from app.models import (  # noqa: F401
        agent_run,
        chapter,
        interview,
        project,
        revision,
        user,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_schema)


def _migrate_schema(connection) -> None:
    if connection.dialect.name != "sqlite":
        return
    cols = {
        row[1]
        for row in connection.exec_driver_sql("PRAGMA table_info(projects)").fetchall()
    }
    if "is_published" not in cols:
        connection.exec_driver_sql(
            "ALTER TABLE projects ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT 0"
        )
    if "share_token" not in cols:
        connection.exec_driver_sql("ALTER TABLE projects ADD COLUMN share_token VARCHAR(64)")
    if "published_at" not in cols:
        connection.exec_driver_sql("ALTER TABLE projects ADD COLUMN published_at DATETIME")
