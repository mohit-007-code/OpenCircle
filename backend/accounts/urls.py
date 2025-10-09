# backend/accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    GoogleAuthView, 
    UserProfileView, 
    LogoutView
)

app_name = 'accounts'

urlpatterns = [
    # Registration and Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Profile Management
    path('profile/', UserProfileView.as_view(), name='profile'),
]
