from ibm_watsonx_ai.foundation_models import ModelInference
import re
from ibm_watsonx_ai.credentials import Credentials
import os
from dotenv import load_dotenv
load_dotenv()
credentials = Credentials(
    url="https://eu-de.ml.cloud.ibm.com",  # or regional Watsonx URL
    api_key=os.getenv("WATSONX_API_KEY")
)

guardian_model = ModelInference(
    model_id="ibm/granite-3-3-8b-instruct",
    credentials=credentials,
    project_id="1cb8c38f-d650-41fe-9836-86659006c090",
    params={"decoding_method": "greedy", "max_new_tokens": 100}
)

def analyze_tweet(text):
    prompt = f"""
<analyze>
<text>{text}</text>
Provide your response in this format:
<harm>[Yes or No]</harm>
<confidence>[0.0 to 1.0]</confidence>
<comment>[Optional brief explanation]</comment>
</analyze>
"""
    response = guardian_model.generate(prompt)
    result_text = response['results'][0]['generated_text']
    print("Generated:", result_text)

    label_match = re.search(r"<harm>(.*?)</harm>", result_text)
    conf_match = re.search(r"<confidence>(.*?)</confidence>", result_text)

    label = label_match.group(1).strip() if label_match else "Unknown"
    conf_str = conf_match.group(1).strip() if conf_match else "Unknown"

    try:
        probability = float(conf_str)
    except ValueError:
        probability = 0.0

    return {
        "text": text,
        "risk": label,
        "confidence": conf_str,
        "probability": probability
    }


# Example usage
if __name__ == "__main__":
    sample_tweet = "I'm feeling really down today and don't know what to do."
    result = analyze_tweet(sample_tweet)
    print("Analysis Result:", result)