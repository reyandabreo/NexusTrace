import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(__file__).resolve().with_name(".env"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

genai.configure(api_key=api_key)

for model in genai.list_models():
    print(model.name, model.supported_generation_methods)