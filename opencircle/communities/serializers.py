from posts.models import Post
from rest_framework import serializers
from accounts.models import User

class UserPostSerializer(serializers.ModelSerializer):
    community_name = serializers.CharField(source='community.name', read_only=True)
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'community_name', 'created_at']
