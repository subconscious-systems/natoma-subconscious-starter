# Wrap the agent in a Streamlit chat UI

Once the CLI agent works (`uv run python agent.py`), you can give it a web UI in about 30 lines of code. Same `graph.py`, new front door.

## 1. Add Streamlit

```bash
uv add streamlit
```

## 2. Create `ui.py` at the project root

```python
# python/ui.py
import asyncio

import streamlit as st
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from src.graph import build_agent

load_dotenv()

st.set_page_config(page_title="Natoma × Subconscious", layout="centered")
st.title("Natoma × Subconscious agent")


@st.cache_resource(show_spinner="Loading agent…")
def get_agent():
    agent, _ = asyncio.run(build_agent())
    return agent


if "messages" not in st.session_state:
    st.session_state.messages = []

agent = get_agent()

for msg in st.session_state.messages:
    if isinstance(msg, HumanMessage):
        with st.chat_message("user"):
            st.write(msg.content)
    elif isinstance(msg, AIMessage) and msg.content:
        with st.chat_message("assistant"):
            st.write(msg.content)
    elif isinstance(msg, ToolMessage):
        with st.expander(f"tool result: {msg.name}", expanded=False):
            st.code(str(msg.content)[:2000])

if user_input := st.chat_input("Ask me something…"):
    st.session_state.messages.append(HumanMessage(content=user_input))
    with st.chat_message("user"):
        st.write(user_input)
    with st.chat_message("assistant"):
        with st.spinner("Thinking…"):
            result = asyncio.run(
                agent.ainvoke({"messages": st.session_state.messages})
            )
            st.session_state.messages = result["messages"]
            st.write(result["messages"][-1].content)
```

## 3. Run it

```bash
uv run streamlit run ui.py
```

Open <http://localhost:8501>.

## Gotchas

- **`asyncio.run` re-creates the event loop each turn.** Fine for hackathon scale. If you do this at production scale, use `nest-asyncio` or move to async-aware Streamlit components.
- **`@st.cache_resource` keeps the agent and its MCP connections alive across reruns.** Streamlit reruns the whole script on every interaction; without caching, you'd reconnect to every MCP on every keystroke.
- **Tool output rendering.** This example shows tool results in collapsed `st.expander` blocks — swap for whatever feels right (markdown tables, image previews from `image_url` fields, etc.).

## What to build next

- **Token streaming.** Replace `agent.ainvoke` with `agent.astream_events` and `st.write_stream` to stream tokens as they arrive.
- **Image upload.** `st.file_uploader` → base64-encode → pass as an `image_url` content block in the `HumanMessage`.
- **Session selector.** Add `st.sidebar` with a list of past conversations stored via a LangGraph checkpointer.
