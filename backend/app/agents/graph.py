from typing import TypedDict

from langgraph.graph import END, StateGraph


class AutobiographyState(TypedDict, total=False):
    project_id: str
    current_chapter_id: str
    phase: str
    outline: list[dict]
    interview_history: list[dict]
    chapter_drafts: dict[str, str]
    pending_edit_request: str
    last_agent_output: dict


def route_phase(state: AutobiographyState) -> str:
    phase = state.get("phase", "planning")
    mapping = {
        "planning": "planner",
        "interviewing": "interviewer",
        "writing": "writer",
        "editing": "editor",
    }
    return mapping.get(phase, END)


def build_graph() -> StateGraph:
    graph = StateGraph(AutobiographyState)

    async def planner_node(state: AutobiographyState) -> AutobiographyState:
        return {**state, "phase": "interviewing", "last_agent_output": {"agent": "planner"}}

    async def interviewer_node(state: AutobiographyState) -> AutobiographyState:
        return {**state, "last_agent_output": {"agent": "interviewer"}}

    async def writer_node(state: AutobiographyState) -> AutobiographyState:
        return {**state, "phase": "reviewing", "last_agent_output": {"agent": "writer"}}

    async def editor_node(state: AutobiographyState) -> AutobiographyState:
        return {**state, "phase": "reviewing", "last_agent_output": {"agent": "editor"}}

    graph.add_node("planner", planner_node)
    graph.add_node("interviewer", interviewer_node)
    graph.add_node("writer", writer_node)
    graph.add_node("editor", editor_node)

    graph.set_conditional_entry_point(route_phase)
    graph.add_edge("planner", END)
    graph.add_edge("interviewer", END)
    graph.add_edge("writer", END)
    graph.add_edge("editor", END)

    return graph.compile()
