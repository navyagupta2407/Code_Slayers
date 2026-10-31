from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    supabase_publishable_key: str
    supabase_jwt_audience: str = "authenticated"
    cors_origins: str = "http://localhost:5173"
    ai_service_url: str = ""
    ai_service_token: str = ""
    worker_token: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self):
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

settings = Settings()
