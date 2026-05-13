"""Subconscious chat model — OpenAI-compatible API with a custom auth header."""
import os

from langchain_openai import ChatOpenAI


def build_model() -> ChatOpenAI:
    api_key = os.environ.get("SUBCONSCIOUS_API_KEY")
    if not api_key or api_key.startswith("sky_REPLACE"):
        raise RuntimeError(
            "SUBCONSCIOUS_API_KEY is missing. Copy .env.example to .env "
            "and paste your key from https://subconscious.dev."
        )

    base_url = os.environ.get(
        "SUBCONSCIOUS_BASE_URL", "https://api.subconscious.dev/v1"
    )
    model = os.environ.get(
        "SUBCONSCIOUS_MODEL", "subconscious/tim-qwen3.6-27b"
    )

    # Subconscious authenticates with "Authorization: Api-Key <key>", not the
    # OpenAI default "Bearer <key>". Override via default_headers and pass a
    # placeholder api_key (the SDK requires it but our header takes precedence).
    #
    # `extra_body.chat_template_kwargs.enable_thinking=False` disables the
    # model's internal thinking step by default. Set SUBCONSCIOUS_ENABLE_THINKING=1
    # to turn it back on.
    enable_thinking = os.environ.get("SUBCONSCIOUS_ENABLE_THINKING", "").lower() in {
        "1", "true", "yes"
    }
    return ChatOpenAI(
        model=model,
        api_key="not-used",
        base_url=base_url,
        default_headers={"Authorization": f"Api-Key {api_key}"},
        streaming=True,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": enable_thinking},
        },
    )
