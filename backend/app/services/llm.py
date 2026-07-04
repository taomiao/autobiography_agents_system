import json
import logging
from typing import Any

from litellm import acompletion

from app.config import settings

logger = logging.getLogger(__name__)


def _build_kwargs(
    *,
    stream: bool,
    temperature: float,
    response_format: dict[str, Any] | None,
) -> dict[str, Any]:
    model = settings.resolved_model
    kwargs: dict[str, Any] = {
        "model": model,
        "stream": stream,
        "temperature": temperature,
    }

    if settings.is_deepseek:
        api_key = settings.effective_deepseek_api_key
        if not api_key:
            raise ValueError("未配置 DEEPSEEK_API_KEY，请在 backend/.env 中设置")
        kwargs["api_key"] = api_key
        kwargs["api_base"] = "https://api.deepseek.com"
    elif settings.effective_openai_api_key:
        kwargs["api_key"] = settings.effective_openai_api_key

    if response_format:
        kwargs["response_format"] = response_format

    return kwargs


async def llm_complete(
    messages: list[dict[str, str]],
    *,
    stream: bool = False,
    temperature: float = 0.7,
    response_format: dict[str, Any] | None = None,
) -> Any:
    kwargs = _build_kwargs(stream=stream, temperature=temperature, response_format=response_format)
    kwargs["messages"] = messages
    try:
        return await acompletion(**kwargs)
    except Exception:
        logger.exception("LLM call failed: model=%s", kwargs.get("model"))
        raise


async def llm_complete_text(messages: list[dict[str, str]], **kwargs: Any) -> str:
    response = await llm_complete(messages, stream=False, **kwargs)
    return response.choices[0].message.content or ""


async def llm_complete_json(messages: list[dict[str, str]], **kwargs: Any) -> dict[str, Any]:
    response = await llm_complete(
        messages,
        stream=False,
        response_format={"type": "json_object"},
        **kwargs,
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


async def llm_stream_text(messages: list[dict[str, str]], **kwargs: Any):
    response = await llm_complete(messages, stream=True, **kwargs)
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
