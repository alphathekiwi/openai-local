from django.urls import path
from chatgpt_clone import views

urlpatterns = [
    path("", views.home),
]