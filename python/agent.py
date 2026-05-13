"""Interactive REPL for the Natoma × Subconscious starter agent."""
import asyncio
import time

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage

from src.graph import build_agent


async def chat_loop(agent) -> None:
    print("Subconscious × Natoma agent. Type 'exit' or Ctrl-D to quit.\n")
    messages: list = []
    while True:
        try:
            user_input = input("you > ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            return

        messages.append(HumanMessage(content=user_input))

        t0 = time.perf_counter()
        streaming_text = False
        pending_tool_calls: dict[str, dict] = {}

        async for event in agent.astream_events(
            {"messages": messages}, version="v2"
        ):
            kind = event["event"]
            elapsed = f"[{time.perf_counter() - t0:.1f}s]"

            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    if not streaming_text:
                        print(f"\nagent > ", end="", flush=True)
                        streaming_text = True
                    print(chunk.content, end="", flush=True)
                for tc_chunk in chunk.tool_call_chunks or []:
                    idx = tc_chunk.get("index", tc_chunk.get("id", 0))
                    if idx not in pending_tool_calls:
                        pending_tool_calls[idx] = {"name": "", "args": ""}
                    if tc_chunk.get("name"):
                        pending_tool_calls[idx]["name"] += tc_chunk["name"]
                    if tc_chunk.get("args"):
                        pending_tool_calls[idx]["args"] += tc_chunk["args"]

            elif kind == "on_chat_model_end":
                if streaming_text:
                    print(flush=True)
                    streaming_text = False
                for tc in pending_tool_calls.values():
                    args = tc["args"]
                    if len(args) > 120:
                        args = args[:120] + "…"
                    print(f"  {elapsed} [calling] {tc['name']}({args})",
                          flush=True)
                pending_tool_calls.clear()

            elif kind == "on_tool_start":
                name = event.get("name", "?")
                print(f"  {elapsed} [tool start] {name}", flush=True)

            elif kind == "on_tool_end":
                name = event.get("name", "?")
                output = str(event["data"].get("output", ""))
                if len(output) > 240:
                    output = output[:240] + "…"
                print(f"  {elapsed} [tool done]  {name} → {output}",
                      flush=True)

            elif kind == "on_chain_end" and event.get("name") == "LangGraph":
                final_output = event["data"].get("output", {})
                if isinstance(final_output, dict) and "messages" in final_output:
                    messages = final_output["messages"]

        total = time.perf_counter() - t0
        print(f"  [{total:.1f}s total]\n", flush=True)


async def main() -> None:
    load_dotenv()
    print("Loading agent…")
    agent, _mcp_client = await build_agent()
    print()
    await chat_loop(agent)


if __name__ == "__main__":
    asyncio.run(main())
