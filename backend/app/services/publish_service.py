import secrets
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Chapter, ChapterStatus, Project


def _new_share_token() -> str:
    return secrets.token_urlsafe(16)


def _published_chapters(project: Project) -> list[Chapter]:
    return [
        ch
        for ch in sorted(project.chapters, key=lambda c: c.order)
        if ch.status == ChapterStatus.DONE and ch.content_md
    ]


async def publish_project(db: AsyncSession, project: Project) -> tuple[Project, int]:
    chapters = _published_chapters(project)
    if not chapters:
        raise ValueError("至少完成一个章节后才能发布")

    if not project.share_token:
        project.share_token = _new_share_token()

    project.is_published = True
    project.published_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(project)
    return project, len(chapters)


async def unpublish_project(db: AsyncSession, project: Project) -> Project:
    project.is_published = False
    await db.commit()
    await db.refresh(project)
    return project


async def get_published_by_token(db: AsyncSession, share_token: str) -> Project | None:
    result = await db.execute(
        select(Project)
        .where(Project.share_token == share_token, Project.is_published.is_(True))
        .options(selectinload(Project.chapters))
    )
    return result.scalar_one_or_none()


def to_published_view(project: Project) -> dict:
    chapters = _published_chapters(project)
    return {
        "title": project.title,
        "published_at": project.published_at,
        "chapters": [
            {"order": ch.order, "title": ch.title, "content_md": ch.content_md or ""}
            for ch in chapters
        ],
    }
