import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_publish_and_public_share():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_res = await client.post("/api/projects", json={"title": "发布测试"})
        project_id = create_res.json()["id"]
        await client.post(
            f"/api/projects/{project_id}/plan",
            json={"author_background": "测试"},
        )
        project = (await client.get(f"/api/projects/{project_id}")).json()
        chapter_id = project["chapters"][0]["id"]

        fail_res = await client.post(f"/api/projects/{project_id}/publish")
        assert fail_res.status_code == 400

        await client.patch(
            f"/api/chapters/{chapter_id}",
            json={"content_md": "第一章公开内容。"},
        )

        pub_res = await client.post(f"/api/projects/{project_id}/publish")
        assert pub_res.status_code == 200
        token = pub_res.json()["share_token"]
        assert token

        public_res = await client.get(f"/api/public/share/{token}")
        assert public_res.status_code == 200
        data = public_res.json()
        assert data["title"] == "发布测试"
        assert len(data["chapters"]) == 1
        assert "公开内容" in data["chapters"][0]["content_md"]

        await client.post(f"/api/projects/{project_id}/unpublish")
        hidden = await client.get(f"/api/public/share/{token}")
        assert hidden.status_code == 404
