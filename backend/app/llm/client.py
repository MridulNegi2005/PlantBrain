"""Minimal OpenAI-compatible chat client.

Points at LLM_BASE_URL (Groq free tier by default; a local Ollama at
http://localhost:11434/v1 works with no code change). Kept dependency-free (httpx
only) so swapping providers is purely configuration.
"""

from __future__ import annotations

import json

import httpx

from app.core.config import settings


class LLMError(RuntimeError):
    pass


def available() -> bool:
    return settings.llm_enabled


def chat(messages: list[dict], *, temperature: float = 0.2, max_tokens: int = 1024,
         json_mode: bool = False, timeout: float = 60.0) -> str:
    if not settings.llm_enabled:
        raise LLMError("LLM not configured — set LLM_API_KEY in .env")

    payload: dict = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        resp = httpx.post(
            f"{settings.llm_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise LLMError(f"LLM HTTP {exc.response.status_code}: {exc.response.text[:200]}") from exc
    except httpx.HTTPError as exc:
        raise LLMError(f"LLM request failed: {exc}") from exc

    return resp.json()["choices"][0]["message"]["content"]


def chat_json(messages: list[dict], **kwargs) -> dict:
    """Chat in JSON mode and parse the result; raises LLMError on invalid JSON."""
    content = chat(messages, json_mode=True, **kwargs)
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMError(f"LLM returned invalid JSON: {content[:200]}") from exc
