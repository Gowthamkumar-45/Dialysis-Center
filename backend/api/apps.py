from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        # Import signal handlers so they get registered on app start.
        from . import signals  # noqa: F401
