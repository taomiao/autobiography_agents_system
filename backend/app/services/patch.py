import difflib
import json
import re
from typing import Any


def split_paragraphs(content: str) -> list[str]:
    if not content.strip():
        return []
    parts = re.split(r"\n\s*\n", content.strip())
    return [p.strip() for p in parts if p.strip()]


def number_paragraphs(content: str) -> tuple[str, dict[str, str]]:
    paragraphs = split_paragraphs(content)
    mapping: dict[str, str] = {}
    numbered_lines: list[str] = []
    for idx, paragraph in enumerate(paragraphs, start=1):
        pid = f"P{idx}"
        mapping[pid] = paragraph
        numbered_lines.append(f"[{pid}] {paragraph}")
    return "\n\n".join(numbered_lines), mapping


def apply_patches(content: str, patches: list[dict[str, Any]]) -> str:
    _, mapping = number_paragraphs(content)
    paragraphs = split_paragraphs(content)
    if not mapping:
        paragraphs = []

    pid_to_index = {f"P{i + 1}": i for i in range(len(paragraphs))}

    for patch in patches:
        pid = patch.get("paragraph_id", "")
        operation = patch.get("operation", "replace")
        new_text = patch.get("new_text", "")

        if operation == "delete":
            if pid in pid_to_index:
                paragraphs.pop(pid_to_index[pid])
                pid_to_index = {f"P{i + 1}": i for i in range(len(paragraphs))}
        elif operation == "insert_after":
            if pid in pid_to_index and new_text:
                insert_at = pid_to_index[pid] + 1
                paragraphs.insert(insert_at, new_text.strip())
                pid_to_index = {f"P{i + 1}": i for i in range(len(paragraphs))}
        elif operation == "replace":
            if pid in pid_to_index and new_text is not None:
                paragraphs[pid_to_index[pid]] = new_text.strip()
        elif operation == "append":
            if new_text:
                paragraphs.append(new_text.strip())

    return "\n\n".join(paragraphs)


def unified_diff(before: str, after: str) -> str:
    before_lines = before.splitlines(keepends=True)
    after_lines = after.splitlines(keepends=True)
    diff = difflib.unified_diff(before_lines, after_lines, lineterm="")
    return "".join(diff)


def patches_to_json(patches: list[dict[str, Any]]) -> str:
    return json.dumps({"patches": patches}, ensure_ascii=False)
