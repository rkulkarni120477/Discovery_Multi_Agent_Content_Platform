"""Thin wrapper around the LLM so every node calls the model the same way.

Two helpers are exposed:
  * ``ask_text``       — free-form prose output (used for drafting content/rationale).
  * ``ask_structured`` — JSON output validated against a Pydantic schema (used for every
                         extraction/analysis step so downstream nodes get typed data, not prose
                         to re-parse).
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Type, TypeVar

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

SYSTEM_PREAMBLE = (
    "You are part of a multi-agent instructional design workflow for Discovery Education. "
    "You are producing one specific artifact in a longer pipeline that revises a K-12 science "
    "lesson to integrate a literacy strategy. Follow the requested output format exactly. "
    "Be concrete and evidence-based: cite specific lesson text rather than generic statements."
)


@lru_cache(maxsize=1)
def _model():
    # Reads OPENAI_API_KEY from the environment automatically.
    return ChatOpenAI(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
        temperature=0.2,
        max_tokens=4096,
        timeout=120,
    )


def ask_text(prompt: str, *, system: str | None = None, max_tokens: int | None = None) -> str:
    model = _model()
    if max_tokens:
        model = model.bind(max_tokens=max_tokens)
    messages = [
        SystemMessage(content=system or SYSTEM_PREAMBLE),
        HumanMessage(content=prompt),
    ]
    response = model.invoke(messages)
    return response.content if isinstance(response.content, str) else str(response.content)


def ask_structured(prompt: str, schema: Type[T], *, system: str | None = None) -> T:
    model = _model().with_structured_output(schema)
    messages = [
        SystemMessage(content=system or SYSTEM_PREAMBLE),
        HumanMessage(content=prompt),
    ]
    result = model.invoke(messages)
    if isinstance(result, schema):
        return result
    return schema.model_validate(result)
