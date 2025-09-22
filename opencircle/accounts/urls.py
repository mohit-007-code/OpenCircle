from django.urls import path
from .views import (
    register_view, login_view, logout_view, edit_profile, profile_view,
    follow_user, RegisterAPIView, LoginAPIView, LogoutAPIView, UserProfileAPIView
)

urlpatterns = [
    # Template-based
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile_view'),
    path('profile/<str:username>/', profile_view, name='view_profile'),
    path('profile/<str:username>/follow/', follow_user, name='follow_user'),
    path('edit-profile/', edit_profile, name='edit-profile'),

    # DRF API
    path('api/register/', RegisterAPIView.as_view(), name='api-register'),
    path('api/login/', LoginAPIView.as_view(), name='api-login'),
    path('api/logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('api/profile/', UserProfileAPIView.as_view(), name='api-profile'),
]
