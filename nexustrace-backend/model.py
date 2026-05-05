import google.generativeai as genai

genai.configure(api_key="AIzaSyChIfug_zVW7h6vikY1-fccLeIFIrJQpj4")

for model in genai.list_models():
    print(model.name, model.supported_generation_methods)