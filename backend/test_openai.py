import asyncio
from app.agents.intent_agent import intent_agent


async def main():
    res = await intent_agent.classify_intent("Make a pasta")
    print("Result:", res)


if __name__ == "__main__":
    asyncio.run(main())
