from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Amazon Neighborhood AI"
    version: str = "1.0.0"

    # NVIDIA NIM API (OpenAI-compatible)
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.1-8b-instruct"
    nvidia_vision_model: str = "microsoft/phi-3.5-vision-instruct"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]


settings = Settings()


def get_settings() -> Settings:
    return settings
