import json

from app.schemas import OutlineChapterPlan, OutlinePlanResult
from app.services.llm import llm_complete_json


PLANNER_SYSTEM = """你是一位专业的自传策划编辑。根据作者背景，规划自传章节大纲。
输出 JSON 格式：
{
  "chapters": [
    {
      "order": 1,
      "title": "章节标题",
      "interview_topics": ["采访话题1", "采访话题2"]
    }
  ]
}
要求：
- 章节 5-8 个，按时间或主题递进
- 每章 3-5 个采访话题，具体可问
- 使用中文
"""


async def plan_outline(title: str, author_background: str, style_notes: str | None) -> OutlinePlanResult:
    user_content = f"自传标题：{title}\n作者背景：{author_background or '未提供'}\n风格偏好：{style_notes or '真实、温情、第一人称'}"
    data = await llm_complete_json(
        [
            {"role": "system", "content": PLANNER_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0.5,
    )
    return OutlinePlanResult.model_validate(data)


async def plan_outline_fallback(title: str) -> OutlinePlanResult:
    _ = title
    return OutlinePlanResult(
        chapters=[
            OutlineChapterPlan(
                order=1,
                title="童年记忆",
                interview_topics=["最早的记忆", "家庭环境", "童年玩伴", "影响最深的人"],
            ),
            OutlineChapterPlan(
                order=2,
                title="求学之路",
                interview_topics=["求学经历", "重要老师", "转折点", "青春梦想"],
            ),
            OutlineChapterPlan(
                order=3,
                title="初入社会",
                interview_topics=["第一份工作", "遇到的困难", "成长收获", "重要决定"],
            ),
            OutlineChapterPlan(
                order=4,
                title="事业篇章",
                interview_topics=["职业高光", "失败与挫折", "关键人物", "成就与遗憾"],
            ),
            OutlineChapterPlan(
                order=5,
                title="家庭与情感",
                interview_topics=["爱情故事", "亲子关系", "家庭变化", "情感感悟"],
            ),
            OutlineChapterPlan(
                order=6,
                title="人生感悟",
                interview_topics=["价值观", "给后辈的话", "未完成的梦", "最想留下的话"],
            ),
        ]
    )


def topics_to_text(topics: list[str]) -> str:
    return json.dumps(topics, ensure_ascii=False)
