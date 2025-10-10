# backend/posts/views.py
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Post, PostLike, Comment, CommentLike
from .serializers import PostSerializer, PostCreateSerializer, CommentSerializer
from communities.models import Community, CommunityMembership


class FeedPostsView(generics.ListAPIView):
    """GET: Get all posts from all communities (feed)"""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        return Post.objects.all().select_related('author', 'community').order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CommunityPostListCreateView(generics.ListCreateAPIView):
    """
    GET: List all posts in a community
    POST: Create a new post (members only)
    """
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        slug = self.kwargs.get('slug')
        community = get_object_or_404(Community, slug=slug)
        return Post.objects.filter(community=community).select_related('author', 'community')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        slug = self.kwargs.get('slug')
        community = get_object_or_404(Community, slug=slug)
        
        if not CommunityMembership.objects.filter(
            user=self.request.user,
            community=community
        ).exists():
            raise PermissionDenied('You must be a member to post in this community')
        
        serializer.save(author=self.request.user, community=community)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a post
    PUT/PATCH: Update post (author only)
    DELETE: Delete post (author or community creator)
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        return get_object_or_404(
            Post.objects.select_related('author', 'community'),
            id=self.kwargs.get('pk')
        )
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            raise PermissionDenied('You can only edit your own posts')
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user and post.community.creator != request.user:
            raise PermissionDenied('You can only delete your own posts or posts in your community')
        return super().destroy(request, *args, **kwargs)


class PostLikeToggleView(APIView):
    """POST: Toggle like on a post"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        post = get_object_or_404(Post, id=pk)
        
        like, created = PostLike.objects.get_or_create(
            post=post,
            user=request.user
        )
        
        if not created:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=['likes_count'])
            return Response({'liked': False, 'likes_count': post.likes_count})
        else:
            post.likes_count += 1
            post.save(update_fields=['likes_count'])
            return Response({'liked': True, 'likes_count': post.likes_count})


class PostCommentListCreateView(generics.ListCreateAPIView):
    """
    GET: List comments on a post
    POST: Create a comment (authenticated users only)
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None
    
    def get_queryset(self):
        post_id = self.kwargs.get('pk')
        return Comment.objects.filter(post_id=post_id).select_related('author')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs.get('pk'))
        serializer.save(author=self.request.user, post=post)
        
        # Update comment count
        post.comments_count = post.comments.count()
        post.save(update_fields=['comments_count'])


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a comment
    PUT/PATCH: Update comment (author only)
    DELETE: Delete comment (author, post author, or community creator)
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            raise PermissionDenied('You can only edit your own comments')
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if (comment.author != request.user and 
            comment.post.author != request.user and 
            comment.post.community.creator != request.user):
            raise PermissionDenied('You do not have permission to delete this comment')
        
        post = comment.post
        self.perform_destroy(comment)
        post.comments_count = max(0, post.comments.count())
        post.save(update_fields=['comments_count'])
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentLikeToggleView(APIView):
    """POST: Toggle like on a comment"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        comment = get_object_or_404(Comment, id=pk)
        
        like, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user
        )
        
        if not created:
            like.delete()
            comment.likes_count = max(0, comment.likes_count - 1)
            comment.save(update_fields=['likes_count'])
            return Response({'liked': False, 'likes_count': comment.likes_count})
        else:
            comment.likes_count += 1
            comment.save(update_fields=['likes_count'])
            return Response({'liked': True, 'likes_count': comment.likes_count})


class CommentRepliesView(generics.ListAPIView):
    """GET: List replies to a comment"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        comment_id = self.kwargs.get('pk')
        return Comment.objects.filter(parent_id=comment_id).select_related('author')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserPostsView(generics.ListAPIView):
    """GET: List all posts by a user"""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Post.objects.filter(author_id=user_id).select_related('author', 'community')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
