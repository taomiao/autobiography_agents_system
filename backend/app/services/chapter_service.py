from collections.abc import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.editor import generate_edit
from app.agents.writer import stream_write_chapter, summarize_chapter, write_chapter
from app.models import Chapter, ChapterStatus, Project, ProjectStatus, Revision
from app.services.patch import patches_to_json


async def get_chapter(db: AsyncSession, chapter_id: str) -> Chapter | None:
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    return result.scalar_one_or_none()


async def list_chapters(db: AsyncSession, project_id: str) -> list[Chapter]:
    result = await db.execute(
        select(Chapter).where(Chapter.project_id == project_id).order_by(Chapter.order)
    )
    return list(result.scalars().all())


async def get_adjacent_summaries(db: AsyncSession, chapter: Chapter) -> tuple[str | None, str | None]:
    result = await db.execute(
        select(Chapter).where(Chapter.project_id == chapter.project_id).order_by(Chapter.order)
    )
    chapters = list(result.scalars().all())
    prev_summary = None
    next_summary = None
    for i, ch in enumerate(chapters):
        if ch.id == chapter.id:
            if i > 0:
                prev_summary = chapters[i - 1].summary
            if i < len(chapters) - 1:
                next_summary = chapters[i + 1].summary
            break
    return prev_summary, next_summary


async def get_interview_messages(db: AsyncSession, chapter: Chapter) -> list[dict[str, str]]:
    from app.models import InterviewMessage, InterviewSession

    result = await db.execute(
        select(InterviewSession).where(InterviewSession.chapter_id == chapter.id).limit(1)
    )
    session = result.scalar_one_or_none()
    if not session:
        return []

    msg_result = await db.execute(
        select(InterviewMessage)
        .where(InterviewMessage.session_id == session.id)
        .order_by(InterviewMessage.created_at)
    )
    messages = msg_result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in messages]


async def write_chapter_content(db: AsyncSession, chapter: Chapter) -> Chapter:
    project_result = await db.execute(select(Project).where(Project.id == chapter.project_id))
    project = project_result.scalar_one()

    messages = await get_interview_messages(db, chapter)
    prev_summary, next_summary = await get_adjacent_summaries(db, chapter)

    chapter.status = ChapterStatus.DRAFTING
    project.status = ProjectStatus.WRITING
    await db.commit()

    content = await write_chapter(
        chapter.title, project.style_notes, messages, prev_summary, next_summary
    )
    summary = await summarize_chapter(content)

    chapter.content_md = content
    chapter.summary = summary
    chapter.status = ChapterStatus.DONE
    project.status = ProjectStatus.REVIEWING
    await db.commit()
    await db.refresh(chapter)
    return chapter


async def stream_write_chapter_content(
    db: AsyncSession, chapter: Chapter
) -> AsyncGenerator[str, None]:
    project_result = await db.execute(select(Project).where(Project.id == chapter.project_id))
    project = project_result.scalar_one()

    messages = await get_interview_messages(db, chapter)
    prev_summary, next_summary = await get_adjacent_summaries(db, chapter)

    chapter.status = ChapterStatus.DRAFTING
    project.status = ProjectStatus.WRITING
    await db.commit()

    full_content = ""
    async for token in stream_write_chapter(
        chapter.title, project.style_notes, messages, prev_summary, next_summary
    ):
        full_content += token
        yield token

    summary = await summarize_chapter(full_content)
    chapter.content_md = full_content
    chapter.summary = summary
    chapter.status = ChapterStatus.DONE
    project.status = ProjectStatus.REVIEWING
    await db.commit()


async def preview_edit(db: AsyncSession, chapter: Chapter, instruction: str) -> Revision:
    content = chapter.content_md or ""
    patches, after, diff_text = await generate_edit(content, instruction)

    revision = Revision(
        chapter_id=chapter.id,
        instruction=instruction,
        diff_json=patches_to_json(patches),
        content_before=content,
        content_after=after,
        applied=False,
    )
    db.add(revision)
    await db.commit()
    await db.refresh(revision)
    revision._diff_text = diff_text  # type: ignore[attr-defined]
    return revision


async def apply_revision(db: AsyncSession, chapter: Chapter, revision: Revision) -> Chapter:
    chapter.content_md = revision.content_after
    if revision.content_after:
        chapter.summary = await summarize_chapter(revision.content_after)
    revision.applied = True
    await db.commit()
    await db.refresh(chapter)
    return chapter


async def rollback_revision(db: AsyncSession, chapter: Chapter, revision: Revision) -> Chapter:
    if revision.content_before is not None:
        chapter.content_md = revision.content_before
        if revision.content_before:
            chapter.summary = await summarize_chapter(revision.content_before)
    revision.applied = False
    await db.commit()
    await db.refresh(chapter)
    return chapter


async def list_revisions(db: AsyncSession, chapter_id: str) -> list[Revision]:
    result = await db.execute(
        select(Revision).where(Revision.chapter_id == chapter_id).order_by(Revision.created_at.desc())
    )
    return list(result.scalars().all())


async def manual_update_chapter(db: AsyncSession, chapter: Chapter, content_md: str) -> Chapter:
    before = chapter.content_md or ""
    content_md = content_md.strip()

    revision = Revision(
        chapter_id=chapter.id,
        instruction="手动编辑",
        diff_json=patches_to_json([]),
        content_before=before,
        content_after=content_md,
        applied=True,
    )
    db.add(revision)

    chapter.content_md = content_md or None
    if content_md:
        chapter.summary = content_md[:200] + ("..." if len(content_md) > 200 else "")
        chapter.status = ChapterStatus.DONE
    await db.commit()
    await db.refresh(chapter)
    return chapter
