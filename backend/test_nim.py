import os
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage

os.environ["NVIDIA_API_KEY"] = "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"
llm = ChatNVIDIA(model="meta/llama-3.1-70b-instruct")
try:
    print(llm.invoke([HumanMessage(content="Hello")]).content)
except Exception as e:
    print(f"Error: {e}")
