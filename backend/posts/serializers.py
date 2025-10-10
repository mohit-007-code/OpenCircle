# backend/posts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, PostLike, Comment, CommentLike
from communities.models import CommunityMembership

User = get_user_model()


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for user information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture', 'first_name', 'last_name']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments with nested replies support"""
    author = AuthorSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'parent', 'content', 'author',
            'likes_count', 'is_liked', 'replies_count',
            'created_at', 'updated_at', 'can_delete'
        ]
        read_only_fields = ['id', 'post', 'author', 'created_at', 'updated_at', 'likes_count']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentLike.objects.filter(comment=obj, user=request.user).exists()
        return False
    
    def get_replies_count(self, obj):
        return obj.replies.count()
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return (obj.author == request.user or 
                    obj.post.author == request.user or 
                    obj.post.community.creator == request.user)
        return False


class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts"""
    author = AuthorSerializer(read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    community_slug = serializers.CharField(source='community.slug', read_only=True)
    is_liked = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'image', 'author',
            'community', 'community_name', 'community_slug',
            'created_at', 'updated_at',
            'likes_count', 'comments_count',
            'is_liked', 'can_delete'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'likes_count', 'comments_count']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=request.user).exists()
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user or obj.community.creator == request.user
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    class Meta:
        model = Post
        fields = ['title', 'content', 'image']
    
    def validate(self, data):
        if not data.get('content') or not data.get('content').strip():
            raise serializers.ValidationError({"content": "Content cannot be empty"})
        return data
