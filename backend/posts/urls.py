# backend/posts/urls.py
from django.urls import path
from .views import (
    CommunityPostListCreateView,
    PostDetailView,
    PostLikeToggleView,
    PostCommentListCreateView,
    CommentDetailView,
    CommentLikeToggleView,
    CommentRepliesView,
    UserPostsView,
    FeedPostsView,
)

app_name = 'posts'

urlpatterns = [
    # Feed
    path('feed/', FeedPostsView.as_view(), name='feed'),
    
    # Community Posts
    path('community/<slug:slug>/', CommunityPostListCreateView.as_view(), name='community-posts'),
    
    # Post CRUD
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/like/', PostLikeToggleView.as_view(), name='post-like'),
    
    # Comments
    path('<int:pk>/comments/', PostCommentListCreateView.as_view(), name='post-comments'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    path('comments/<int:pk>/like/', CommentLikeToggleView.as_view(), name='comment-like'),
    path('comments/<int:pk>/replies/', CommentRepliesView.as_view(), name='comment-replies'),
    
    # User Posts
    path('user/<int:user_id>/', UserPostsView.as_view(), name='user-posts'),
]
