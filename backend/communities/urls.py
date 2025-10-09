# backend/communities/urls.py
from django.urls import path
from .views import (
    CommunityListCreateView,
    CommunityDetailView,
    CommunityUpdateDeleteView,
    JoinCommunityView,
    LeaveCommunityView,
    MyCommunitiesView,
    CommunityMembersView
)

app_name = 'communities'

urlpatterns = [
    # Community CRUD
    path('', CommunityListCreateView.as_view(), name='community-list-create'),
    path('my/', MyCommunitiesView.as_view(), name='my-communities'),
    path('<slug:slug>/', CommunityDetailView.as_view(), name='community-detail'),
    path('<slug:slug>/edit/', CommunityUpdateDeleteView.as_view(), name='community-update-delete'),
    
    # Membership
    path('<slug:slug>/join/', JoinCommunityView.as_view(), name='join-community'),
    path('<slug:slug>/leave/', LeaveCommunityView.as_view(), name='leave-community'),
    path('<slug:slug>/members/', CommunityMembersView.as_view(), name='community-members'),
]
