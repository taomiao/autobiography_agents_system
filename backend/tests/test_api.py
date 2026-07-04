import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_and_plan_project():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_res = await client.post("/api/projects", json={"title": "测试自传"})
        assert create_res.status_code == 200
        project = create_res.json()
        project_id = project["id"]

        plan_res = await client.post(
            f"/api/projects/{project_id}/plan",
            json={"author_background": "测试作者"},
        )
        assert plan_res.status_code == 200
        planned = plan_res.json()
        assert len(planned["chapters"]) >= 5

        get_res = await client.get(f"/api/projects/{project_id}")
        assert get_res.status_code == 200
