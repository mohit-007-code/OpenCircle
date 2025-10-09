# backend/posts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, PostLike, Comment
from communities.models import CommunityMembership

User = get_user_model()


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for user information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture', 'first_name', 'last_name']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments"""
    author = AuthorSerializer(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author',
            'created_at', 'updated_at',
            'can_edit', 'can_delete'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Author, post author, or community creator can delete
            return (obj.author == request.user or 
                    obj.post.author == request.user or 
                    obj.post.community.creator == request.user)
        return False


class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts"""
    author = AuthorSerializer(read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    community_slug = serializers.CharField(source='community.slug', read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'content', 'image', 'author',
            'community_name', 'community_slug',
            'created_at', 'updated_at',
            'likes_count', 'comments_count',
            'can_edit', 'can_delete', 'is_liked',
            'comments'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'likes_count', 'comments_count']
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Author or community creator can delete
            return obj.author == request.user or obj.community.creator == request.user
        return False
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=request.user).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    class Meta:
        model = Post
        fields = ['content', 'image']
    
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty")
        return value
