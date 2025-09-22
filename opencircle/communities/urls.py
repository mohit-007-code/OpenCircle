from django.urls import path
from .views import (
    create_community, community_detail, edit_community,
    delete_community, leave_community, search_communities
)

urlpatterns = [
    path('create/', create_community, name='create-community'),
    path('<int:community_id>/', community_detail, name='community-detail'),
    path('<int:community_id>/edit/', edit_community, name='edit-community'),
    path('<int:community_id>/delete/', delete_community, name='delete-community'),
    path('<int:community_id>/leave/', leave_community, name='leave-community'),
    path('search/', search_communities, name='search-communities'),
]
