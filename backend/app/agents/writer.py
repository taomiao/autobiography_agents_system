from app.services.llm import llm_complete_text, llm_stream_text


WRITER_SYSTEM = """你是一位优秀的自传作家。根据采访素材，以第一人称撰写自传章节。

要求：
- 语言真实、有温度，符合口述历史风格
- 结构清晰，有叙事弧线（开端-发展-高潮-感悟）
- 保留作者原话中的细节和情感
- 使用 Markdown 格式，段落之间空一行
- 800-1500 字
- 不要添加采访者提问，只写正文
"""


async def write_chapter(
    chapter_title: str,
    style_notes: str | None,
    messages: list[dict[str, str]],
    prev_summary: str | None,
    next_summary: str | None,
) -> str:
    interview_text = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
    user_content = f"""章节标题：{chapter_title}
风格偏好：{style_notes or '真实、温情、第一人称'}

上一章摘要：{prev_summary or '（第一章）'}
下一章摘要：{next_summary or '（待定）'}

采访记录：
{interview_text}

请撰写这一章的自传正文。"""

    return await llm_complete_text(
        [
            {"role": "system", "content": WRITER_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0.8,
    )


async def stream_write_chapter(
    chapter_title: str,
    style_notes: str | None,
    messages: list[dict[str, str]],
    prev_summary: str | None,
    next_summary: str | None,
):
    interview_text = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
    user_content = f"""章节标题：{chapter_title}
风格偏好：{style_notes or '真实、温情、第一人称'}

上一章摘要：{prev_summary or '（第一章）'}
下一章摘要：{next_summary or '（待定）'}

采访记录：
{interview_text}

请撰写这一章的自传正文。"""

    async for token in llm_stream_text(
        [
            {"role": "system", "content": WRITER_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0.8,
    ):
        yield token


SUMMARY_SYSTEM = "请用 2-3 句话概括以下自传章节的核心内容，用于后续章节的上下文衔接。只输出摘要，不要其他内容。"


async def summarize_chapter(content: str) -> str:
    return await llm_complete_text(
        [
            {"role": "system", "content": SUMMARY_SYSTEM},
            {"role": "user", "content": content[:4000]},
        ],
        temperature=0.3,
    )
