# 自传 Agent 系统

AI 驱动的自传写作助手：主动采访作者、按章节书写、支持精准修改。移动端优先的全栈应用。

## 功能

- **大纲规划**：根据作者背景自动生成 5-8 个章节及采访话题
- **主动采访**：AI 记者逐章提问，追问细节，素材充足后建议写作
- **章节写作**：基于采访记录流式生成第一人称自传正文
- **精准修改**：按段落 patch 修改，diff 预览后确认应用
- **修改历史**：支持查看与回滚历史修改

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 + React + Tailwind CSS |
| 后端 | FastAPI + SQLAlchemy + Alembic |
| Agent | LangGraph + LiteLLM |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |

## 快速开始

### 1. 配置环境变量

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 OPENAI_API_KEY
```

### 2. 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:3000

### Docker 一键启动

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env
docker compose up --build
```

## API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/projects` | 创建自传项目 |
| POST | `/api/projects/{id}/plan` | 生成章节大纲 |
| POST | `/api/chapters/{id}/interview/start` | 开始采访 |
| POST | `/api/chapters/{id}/interview/answer` | 提交回答 |
| GET | `/api/chapters/{id}/write/stream` | SSE 流式写作 |
| POST | `/api/chapters/{id}/edit` | 修改预览 |
| POST | `/api/chapters/{id}/edit/apply` | 确认修改 |
| POST | `/api/chapters/{id}/revisions/{id}/rollback` | 回滚修改 |

完整 API 文档：http://localhost:8000/docs

## 项目结构

```
autobiography_agents_system/
├── backend/          # FastAPI + LangGraph Agent
│   ├── app/
│   │   ├── agents/   # Planner / Interviewer / Writer / Editor
│   │   ├── api/      # REST + SSE 路由
│   │   ├── models/   # SQLAlchemy 模型
│   │   └── services/ # 业务逻辑
│   └── alembic/      # 数据库迁移
├── frontend/         # Next.js 移动端 UI
│   └── src/
│       ├── app/      # 页面路由
│       ├── components/
│       └── lib/      # API 客户端
└── docker-compose.yml
```

## 使用流程

1. 首页点击「新建自传」，输入标题
2. 在项目页填写背景，生成章节大纲
3. 进入「采访」Tab，与 AI 记者对话
4. 素材充足后点击「开始撰写本章」
5. 在「阅读」Tab 查看正文，输入修改指令预览并确认

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `LITELLM_MODEL` | LLM 模型 | `gpt-4o-mini` |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `DATABASE_URL` | 数据库连接 | `sqlite+aiosqlite:///./autobiography.db` |
| `CORS_ORIGINS` | 允许的前端域名 | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | 前端 API 地址 | `http://localhost:8000/api` |

## 开发

```bash
# 后端测试
cd backend && pytest

# 数据库迁移
cd backend && alembic upgrade head

# 前端构建
cd frontend && npm run build
```

## 后续扩展

- 语音采访（Whisper STT）
- PDF / EPUB 导出
- 多用户认证
- 向量检索避免重复提问
