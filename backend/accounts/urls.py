# backend/accounts/urls.py
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    GoogleAuthView,
    UserProfileView,
    change_password,
    user_stats,
    user_comments,
    follow_user,
    user_followers,
    user_following,
    public_user_profile,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', change_password, name='change-password'),
    path('stats/', user_stats, name='user-stats'),
    path('comments/', user_comments, name='user-comments'),
    
    # Follow system
    path('users/<int:user_id>/follow/', follow_user, name='follow-user'),
    path('users/<int:user_id>/followers/', user_followers, name='user-followers'),
    path('users/<int:user_id>/following/', user_following, name='user-following'),
    path('users/<int:user_id>/', public_user_profile, name='public-user-profile'),
]
