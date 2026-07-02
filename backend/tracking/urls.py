from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "tracking"

router = DefaultRouter()
router.register("nannies", views.NannyViewSet, basename="nanny")

urlpatterns = [
    path("health/", views.health, name="health"),
    *router.urls,
]
