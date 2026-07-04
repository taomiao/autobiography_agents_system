import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.planner import plan_outline, plan_outline_fallback, topics_to_text
from app.models import Chapter, ChapterStatus, Project, ProjectStatus, User


async def get_or_create_default_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(name="默认用户")
    db.add(user)
    await db.flush()
    return user


async def create_project(db: AsyncSession, title: str, style_notes: str | None) -> Project:
    user = await get_or_create_default_user(db)
    project = Project(user_id=user.id, title=title, style_notes=style_notes)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def list_projects(db: AsyncSession) -> list[Project]:
    result = await db.execute(select(Project).order_by(Project.updated_at.desc()))
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: str) -> Project | None:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.chapters))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def update_project(
    db: AsyncSession, project: Project, title: str | None, style_notes: str | None
) -> Project:
    if title is not None:
        project.title = title
    if style_notes is not None:
        project.style_notes = style_notes
    await db.commit()
    await db.refresh(project)
    return project


async def plan_project_outline(
    db: AsyncSession, project: Project, author_background: str
) -> list[Chapter]:
    try:
        outline = await plan_outline(project.title, author_background, project.style_notes)
        if not outline.chapters:
            outline = await plan_outline_fallback(project.title)
    except Exception:
        outline = await plan_outline_fallback(project.title)

    for existing in list(project.chapters):
        await db.delete(existing)
    await db.flush()

    chapters: list[Chapter] = []
    for item in outline.chapters:
        chapter = Chapter(
            project_id=project.id,
            order=item.order,
            title=item.title,
            interview_topics=topics_to_text(item.interview_topics),
            status=ChapterStatus.PENDING,
        )
        db.add(chapter)
        chapters.append(chapter)

    project.status = ProjectStatus.INTERVIEWING
    await db.commit()

    result = await db.execute(
        select(Chapter).where(Chapter.project_id == project.id).order_by(Chapter.order)
    )
    return list(result.scalars().all())
