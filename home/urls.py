# home/urls.py
from django.urls import path
from . import views

# Define app_name for namespacing URLs, which is a good practice
app_name = 'home'

urlpatterns = [
    path('', views.home_view, name='index'), # Renamed 'home' to 'index' for clarity
    # New URL pattern for athlete profiles
    # <str:athlete_slug> captures a string from the URL and passes it as 'athlete_slug'
    # to the athlete_profile_view function.
    path('athlete/<str:athlete_slug>/', views.athlete_profile_view, name='athlete_profile'),
]
