import json
import os
import anthropic
from .prompt_builder import STATIC_SYSTEM_PROMPT, build_dynamic_brief_message

# Pricing per million tokens (claude-sonnet-4-6)
INPUT_PRICE_PER_M = 3.00
OUTPUT_PRICE_PER_M = 15.00
CACHE_WRITE_PRICE_PER_M = 3.75
CACHE_READ_PRICE_PER_M = 0.30


def calculate_cost(usage: dict) -> float:
    input_cost = usage.get("input_tokens", 0) * INPUT_PRICE_PER_M / 1_000_000
    output_cost = usage.get("output_tokens", 0) * OUTPUT_PRICE_PER_M / 1_000_000
    cache_write_cost = usage.get("cache_creation_input_tokens", 0) * CACHE_WRITE_PRICE_PER_M / 1_000_000
    cache_read_cost = usage.get("cache_read_input_tokens", 0) * CACHE_READ_PRICE_PER_M / 1_000_000
    return round(input_cost + output_cost + cache_write_cost + cache_read_cost, 6)


async def generate_content(brief_data: dict) -> tuple[dict, dict]:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    user_message = build_dynamic_brief_message(brief_data)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=[
            {
                "type": "text",
                "text": STATIC_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )

    raw_usage = {
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
        "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
    }
    raw_usage["estimated_cost"] = calculate_cost(raw_usage)

    cache_read = raw_usage["cache_read_input_tokens"]
    cache_creation = raw_usage["cache_creation_input_tokens"]
    total_input = raw_usage["input_tokens"] + cache_read + cache_creation
    cache_hit = cache_read > 0

    print(f"\n{'='*50}")
    print(f"PROMPT CACHE REPORT")
    print(f"{'='*50}")
    print(f"  Input tokens:          {raw_usage['input_tokens']}")
    print(f"  Output tokens:         {raw_usage['output_tokens']}")
    print(f"  Cache read tokens:     {cache_read}")
    print(f"  Cache creation tokens: {cache_creation}")
    print(f"  Cache HIT:             {'YES' if cache_hit else 'NO'}")
    if total_input > 0:
        print(f"  Cache hit rate:        {cache_read / total_input * 100:.1f}%")
    print(f"  Estimated cost:        ${raw_usage['estimated_cost']:.4f}")
    print(f"{'='*50}\n")

    text_content = response.content[0].text

    try:
        result = json.loads(text_content)
    except json.JSONDecodeError:
        start = text_content.find("{")
        end = text_content.rfind("}") + 1
        if start != -1 and end > start:
            result = json.loads(text_content[start:end])
        else:
            raise ValueError("Claude did not return valid JSON output")

    return result, raw_usage


async def regenerate_section(brief_data: dict, section: str, current_content: dict) -> tuple[dict, dict]:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    section_prompt = f"""Based on this brand brief, regenerate ONLY the "{section}" section.
Keep all other sections the same. Return the complete JSON with the regenerated section.

{build_dynamic_brief_message(brief_data)}

Current content for context (regenerate only the "{section}" field):
{json.dumps(current_content, indent=2)}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=[
            {
                "type": "text",
                "text": STATIC_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": section_prompt}],
    )

    raw_usage = {
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
        "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
    }
    raw_usage["estimated_cost"] = calculate_cost(raw_usage)

    cache_hit = raw_usage["cache_read_input_tokens"] > 0
    print(f"[Regenerate {section}] Cache HIT: {'YES' if cache_hit else 'NO'} | Cost: ${raw_usage['estimated_cost']:.4f}")

    text_content = response.content[0].text
    try:
        result = json.loads(text_content)
    except json.JSONDecodeError:
        start = text_content.find("{")
        end = text_content.rfind("}") + 1
        if start != -1 and end > start:
            result = json.loads(text_content[start:end])
        else:
            raise ValueError("Claude did not return valid JSON for regeneration")

    return result, raw_usage
