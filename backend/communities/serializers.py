# backend/communities/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Community, CommunityMembership

User = get_user_model()


class CommunityCreatorSerializer(serializers.ModelSerializer):
    """Serializer for community creator information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture']


class CommunityListSerializer(serializers.ModelSerializer):
    """Serializer for listing communities"""
    creator = CommunityCreatorSerializer(read_only=True)
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description',
            'display_picture', 'cover_image',
            'creator', 'member_count', 'created_at',
            'is_member'
        ]
    
    def get_is_member(self, obj):
        """Check if current user is a member"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommunityMembership.objects.filter(
                user=request.user,
                community=obj
            ).exists()
        return False


class CommunityDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single community"""
    creator = CommunityCreatorSerializer(read_only=True)
    is_member = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description',
            'display_picture', 'cover_image',
            'creator', 'member_count', 'created_at', 'updated_at',
            'is_member', 'is_creator', 'user_role'
        ]
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommunityMembership.objects.filter(
                user=request.user,
                community=obj
            ).exists()
        return False
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator == request.user
        return False
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = CommunityMembership.objects.filter(
                user=request.user,
                community=obj
            ).first()
            return membership.role if membership else None
        return None


class CommunityCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating communities"""
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description',
            'display_picture', 'cover_image',
            'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']
    
    def validate_name(self, value):
        """Ensure community name is unique"""
        community_id = self.instance.id if self.instance else None
        if Community.objects.filter(name=value).exclude(id=community_id).exists():
            raise serializers.ValidationError("A community with this name already exists.")
        return value
    
    def create(self, validated_data):
        """Create community and add creator as admin member"""
        request = self.context.get('request')
        
        # Create the community
        community = Community.objects.create(
            creator=request.user,
            **validated_data
        )
        
        # Add creator as admin member
        CommunityMembership.objects.create(
            user=request.user,
            community=community,
            role='admin'
        )
        
        # Update member count
        community.update_member_count()
        
        return community


class CommunityMembershipSerializer(serializers.ModelSerializer):
    """Serializer for membership information"""
    user = CommunityCreatorSerializer(read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = CommunityMembership
        fields = ['id', 'user', 'community_name', 'role', 'joined_at']
