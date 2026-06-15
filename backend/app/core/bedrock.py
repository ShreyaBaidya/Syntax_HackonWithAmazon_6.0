"""Boto3 Bedrock runtime client and low-level helpers."""

import json
import boto3

from app.core.config import settings

bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)


def invoke_sync(
    model_id: str,
    messages: list[dict],
    system: str,
    max_tokens: int = 512,
) -> str:
    """Non-streaming Bedrock invocation — returns full text content."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system,
        "messages": messages,
    }
    response = bedrock.invoke_model(
        modelId=model_id,
        body=json.dumps(body),
        contentType="application/json",
    )
    result = json.loads(response["body"].read())
    text_blocks = [
        c["text"] for c in result.get("content", []) if c.get("type") == "text"
    ]
    return "".join(text_blocks)
