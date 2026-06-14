from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # NVIDIA AI Endpoints (LangChain)
    nvidia_api_key: str = ""
    nvidia_model_id: str = "z-ai/glm-5.1"
    nvidia_temperature: float = 1.0
    nvidia_top_p: float = 1.0
    nvidia_max_tokens: int = 16384

    # AWS (DynamoDB only — Bedrock replaced by NVIDIA)
    aws_region: str = "us-east-1"
    dynamodb_products_table: str = "amazon-now-products"
    dynamodb_orders_table: str = "amazon-now-orders"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Google Calendar — Service Account (Option B, no user login required)
    google_service_account_json: str = ""   # path to JSON key file OR raw JSON string
    google_calendar_id: str = ""            # e.g. abc@group.calendar.google.com

    # Google OAuth2 (Option A, user-specific calendar)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/auth/google-callback"


settings = Settings()
