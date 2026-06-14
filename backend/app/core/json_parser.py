"""Robust JSON parser for AI model responses."""
import json
import re
from typing import Any, Optional


def safe_parse_json(text: str, agent_name: str = "unknown", model_name: str = "unknown") -> Optional[Any]:
    """Safely extract and parse JSON from an AI model response."""
    if not text:
        print(f"[{agent_name}] ERROR: Empty response from {model_name}")
        return None

    raw_text = text.strip()
    print(f"[{agent_name}] MODEL: {model_name}")
    print(f"[{agent_name}] RAW RESPONSE ({len(raw_text)} chars): {raw_text[:300]}{'...' if len(raw_text) > 300 else ''}")

    # Try direct parse
    parsed = _try_parse(raw_text)
    if parsed is not None:
        print(f"[{agent_name}] JSON PARSE SUCCESS (direct)")
        return parsed

    # Extract from markdown code blocks
    for pattern in [r'```json\s*\n?(.*?)\n?\s*```', r'```\s*\n?(.*?)\n?\s*```']:
        matches = re.findall(pattern, raw_text, re.DOTALL)
        for match in matches:
            parsed = _try_parse(match.strip())
            if parsed is not None:
                print(f"[{agent_name}] JSON PARSE SUCCESS (code block)")
                return parsed

    # Find first JSON structure
    first_brace = raw_text.find('{')
    first_bracket = raw_text.find('[')

    if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
        parsed = _extract_json_array(raw_text)
        if parsed is not None:
            print(f"[{agent_name}] JSON PARSE SUCCESS (array extraction)")
            return parsed
        parsed = _extract_json_object(raw_text)
        if parsed is not None:
            print(f"[{agent_name}] JSON PARSE SUCCESS (object extraction)")
            return parsed
    else:
        parsed = _extract_json_object(raw_text)
        if parsed is not None:
            print(f"[{agent_name}] JSON PARSE SUCCESS (object extraction)")
            return parsed
        parsed = _extract_json_array(raw_text)
        if parsed is not None:
            print(f"[{agent_name}] JSON PARSE SUCCESS (array extraction)")
            return parsed

    # Try fixing trailing commas
    fixed = re.sub(r',\s*([}\]])', r'\1', raw_text)
    parsed = _try_parse(fixed)
    if parsed is not None:
        print(f"[{agent_name}] JSON PARSE SUCCESS (trailing comma fix)")
        return parsed

    print(f"[{agent_name}] JSON PARSE FAILED")
    return None


def _try_parse(text: str) -> Optional[Any]:
    if not text:
        return None
    try:
        result = json.loads(text)
        return result if isinstance(result, (dict, list)) else None
    except (json.JSONDecodeError, ValueError):
        return None


def _extract_json_object(text: str) -> Optional[dict]:
    start = text.find('{')
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                candidate = text[start:i + 1]
                parsed = _try_parse(candidate)
                if parsed is not None:
                    return parsed
                fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
                return _try_parse(fixed)
    return None


def _extract_json_array(text: str) -> Optional[list]:
    start = text.find('[')
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '[':
            depth += 1
        elif text[i] == ']':
            depth -= 1
            if depth == 0:
                candidate = text[start:i + 1]
                parsed = _try_parse(candidate)
                if parsed is not None:
                    return parsed
                fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
                return _try_parse(fixed)
    return None
