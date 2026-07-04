import json
import logging

from app.services.llm import llm_complete_json

logger = logging.getLogger(__name__)


INTERVIEWER_SYSTEM = """你是一位温和专业的自传采访记者。你的任务是通过采访收集素材，用于撰写自传章节。

规则：
1. 每次只问一个问题，问题要具体、开放、有温度
2. 结合已有对话，追问细节：时间、地点、人物、情感、影响
3. 避免重复已问过的话题
4. 当本章信息已足够撰写（通常 5-8 轮有效问答后），建议开始写作

输出 JSON：
{
  "question": "你的问题",
  "intent": "追问细节|探索情感|确认事实|过渡话题",
  "suggested_action": "continue|write_chapter",
  "reason": "简要说明"
}
"""


async def generate_question(
    chapter_title: str,
    interview_topics: list[str],
    messages: list[dict[str, str]],
    chapter_summaries: list[str],
) -> dict:
    history_text = "\n".join(f"{m['role']}: {m['content']}" for m in messages[-20:])
    topics_text = "\n".join(f"- {t}" for t in interview_topics)
    context_text = "\n".join(f"- {s}" for s in chapter_summaries if s)

    user_content = f"""当前章节：{chapter_title}

待采访话题：
{topics_text}

已完成章节摘要：
{context_text or '（暂无）'}

对话历史：
{history_text or '（刚开始采访）'}

请生成下一个采访问题。"""

    try:
        return await llm_complete_json(
            [
                {"role": "system", "content": INTERVIEWER_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
        )
    except Exception as exc:
        logger.warning("LLM interview question failed, using fallback: %s", exc)
        unanswered = _find_unanswered_topic(interview_topics, messages)
        return {
            "question": f"关于「{unanswered}」，能跟我多讲讲吗？比如具体发生了什么，您当时是什么感受？",
            "intent": "追问细节",
            "suggested_action": "continue" if len(messages) < 10 else "write_chapter",
            "reason": "fallback question",
        }


def _find_unanswered_topic(topics: list[str], messages: list[dict[str, str]]) -> str:
    user_text = " ".join(m["content"] for m in messages if m["role"] == "user")
    for topic in topics:
        if topic not in user_text:
            return topic
    return topics[0] if topics else "这一章中您最想分享的故事"


def parse_topics(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) for x in data]
    except json.JSONDecodeError:
        pass
    return [line.strip() for line in raw.split("\n") if line.strip()]
