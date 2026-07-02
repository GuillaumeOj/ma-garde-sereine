"""Root URL configuration for the planning-nounou backend."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("tracking.urls")),
]
