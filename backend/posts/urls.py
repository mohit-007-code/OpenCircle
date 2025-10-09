# backend/posts/urls.py
from django.urls import path
from .views import (
    CommunityPostListCreateView,
    PostDetailView,
    PostLikeToggleView,
    PostCommentListCreateView,
    CommentDetailView,
    UserPostsView,
    FeedPostsView,  # Add this import
)

app_name = 'posts'

urlpatterns = [
    # Feed - ALL posts from all communities
    path('feed/', FeedPostsView.as_view(), name='feed'),  # Add this line
    
    # Community Posts
    path('community/<slug:slug>/', CommunityPostListCreateView.as_view(), name='community-posts'),
    
    # Post CRUD
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/like/', PostLikeToggleView.as_view(), name='post-like'),
    
    # Comments
    path('<int:pk>/comments/', PostCommentListCreateView.as_view(), name='post-comments'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    
    # User Posts
    path('user/<int:user_id>/', UserPostsView.as_view(), name='user-posts'),
]
