from django.urls import path

from . import views

app_name = "tracking"

urlpatterns = [
    path("health/", views.health, name="health"),
    # Domain endpoints (families, nannies, work entries) will be added here once
    # the data model is finalized.
]
