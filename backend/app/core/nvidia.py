from __future__ import annotations

"""
NVIDIA AI Endpoints client (LangChain).
Replaces Amazon Bedrock for all LLM calls in this project.

Model: z-ai/glm-5.1 via NVIDIA NIM
"""
from langchain_nvidia_ai_endpoints import ChatNVIDIA

from app.core.config import settings


def get_llm(
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> ChatNVIDIA:
    """Factory — returns a configured ChatNVIDIA instance."""
    return ChatNVIDIA(
        model=settings.nvidia_model_id,
        api_key=settings.nvidia_api_key,
        temperature=temperature
        if temperature is not None
        else settings.nvidia_temperature,
        top_p=settings.nvidia_top_p,
        max_tokens=max_tokens if max_tokens is not None else settings.nvidia_max_tokens,
    )


# Module-level singleton — lazily created on first use to avoid blocking
# startup when the NVIDIA API is temporarily unreachable.
_llm: ChatNVIDIA | None = None


def get_singleton_llm() -> ChatNVIDIA:
    global _llm
    if _llm is None:
        _llm = get_llm(temperature=0.7, max_tokens=512)
    return _llm


# Keep the `llm` name for backwards-compatibility with other modules that
# do `from app.core.nvidia import llm`.  We use a lazy proxy so the network
# call only happens the first time `llm` is *called*, not at import time.
class _LazyLLM:
    """Thin proxy that forwards all attribute access to the real singleton."""

    def __getattr__(self, name: str):
        return getattr(get_singleton_llm(), name)

    def __call__(self, *args, **kwargs):
        return get_singleton_llm()(*args, **kwargs)


llm = _LazyLLM()
