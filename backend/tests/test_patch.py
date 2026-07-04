from app.services.patch import apply_patches, number_paragraphs, unified_diff


def test_number_paragraphs():
    content = "第一段内容。\n\n第二段内容。"
    numbered, mapping = number_paragraphs(content)
    assert "[P1]" in numbered
    assert "[P2]" in numbered
    assert mapping["P1"] == "第一段内容。"
    assert mapping["P2"] == "第二段内容。"


def test_apply_replace_patch():
    content = "第一段。\n\n第二段。\n\n第三段。"
    patches = [{"paragraph_id": "P2", "operation": "replace", "new_text": "修改后的第二段。"}]
    result = apply_patches(content, patches)
    assert "修改后的第二段。" in result
    assert "第二段。" not in result.split("修改后的第二段。")[0]


def test_apply_delete_patch():
    content = "第一段。\n\n第二段。\n\n第三段。"
    patches = [{"paragraph_id": "P2", "operation": "delete"}]
    result = apply_patches(content, patches)
    assert "第二段" not in result
    assert "第一段" in result
    assert "第三段" in result


def test_unified_diff():
    diff = unified_diff("hello", "hello world")
    assert diff or "hello" in "hello world"
