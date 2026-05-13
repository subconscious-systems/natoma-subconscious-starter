"""Interactive REPL for the Natoma × Subconscious starter agent."""
import asyncio
import json

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from src.graph import build_agent


def _print_new_messages(messages, start_index: int) -> None:
    for msg in messages[start_index:]:
        if isinstance(msg, AIMessage):
            for tc in msg.tool_calls or []:
                args = json.dumps(tc.get("args", {}), default=str)
                if len(args) > 120:
                    args = args[:120] + "…"
                print(f"  [tool] {tc['name']}({args})")
            if msg.content:
                print(f"agent > {msg.content}")
        elif isinstance(msg, ToolMessage):
            output = str(msg.content)
            if len(output) > 240:
                output = output[:240] + "…"
            print(f"  [tool result] {output}")


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
        start = len(messages)
        result = await agent.ainvoke({"messages": messages})
        messages = result["messages"]
        _print_new_messages(messages, start)
        print()


async def main() -> None:
    load_dotenv()
    print("Loading agent…")
    agent, _mcp_client = await build_agent()
    print()
    await chat_loop(agent)


if __name__ == "__main__":
    asyncio.run(main())
