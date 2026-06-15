from pydantic_settings import BaseSettings, SettingsConfigDict

# Populate os.environ from .env so modules using os.getenv() (e.g. the Google
# Calendar service) see the same values pydantic loads into Settings.
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App metadata
    app_name: str = "Amazon Now"
    version: str = "1.0.0"

    # NVIDIA AI Endpoints — LangChain (used by NowSpeak / chat)
    nvidia_api_key: str = ""
    nvidia_model_id: str = "z-ai/glm-5.1"
    nvidia_temperature: float = 1.0
    nvidia_top_p: float = 1.0
    nvidia_max_tokens: int = 16384

    # NVIDIA NIM — OpenAI-compatible (used by AI Shopping Agents)
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.1-8b-instruct"
    nvidia_vision_model: str = "microsoft/phi-3.5-vision-instruct"

    # AWS (DynamoDB only)
    aws_region: str = "us-east-1"
    dynamodb_products_table: str = "amazon-now-products"
    dynamodb_orders_table: str = "amazon-now-orders"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Google Calendar — Service Account
    google_service_account_json: str = ""
    google_calendar_id: str = ""

    # Google OAuth2
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/auth/google-callback"


settings = Settings()


def get_settings() -> Settings:
    return settings
