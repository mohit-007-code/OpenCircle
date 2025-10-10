# backend/communities/views.py
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Community, CommunityMembership
from .serializers import (
    CommunityListSerializer,
    CommunityDetailSerializer,
    CommunityCreateUpdateSerializer,
    CommunityMembershipSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class CommunityListCreateView(generics.ListCreateAPIView):
    """
    GET: List all communities
    POST: Create a new community (authenticated users only)
    """
    queryset = Community.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommunityCreateUpdateSerializer
        return CommunityListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_serializer_context(self):
        """Pass request to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CommunityDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve a single community by slug
    """
    queryset = Community.objects.all()
    serializer_class = CommunityDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class CommunityUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve community
    PUT/PATCH: Update community (creator only)
    DELETE: Delete community (creator only)
    """
    queryset = Community.objects.all()
    serializer_class = CommunityCreateUpdateSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Only allow creators to update/delete their communities"""
        return Community.objects.filter(creator=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        community = self.get_object()
        community_name = community.name
        self.perform_destroy(community)
        return Response(
            {'message': f'Community "{community_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )


class JoinCommunityView(APIView):
    """
    POST: Join a community
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        
        # Check if already a member
        if CommunityMembership.objects.filter(
            user=request.user,
            community=community
        ).exists():
            return Response(
                {'error': 'You are already a member of this community'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        membership = CommunityMembership.objects.create(
            user=request.user,
            community=community,
            role='member'
        )
        
        # Update member count
        community.update_member_count()
        
        return Response(
            {
                'message': f'Successfully joined {community.name}',
                'membership': CommunityMembershipSerializer(membership).data
            },
            status=status.HTTP_201_CREATED
        )


class LeaveCommunityView(APIView):
    """
    POST: Leave a community
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        
        # Prevent creator from leaving their own community
        if community.creator == request.user:
            return Response(
                {'error': 'Creators cannot leave their own community. Delete it instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if member
        try:
            membership = CommunityMembership.objects.get(
                user=request.user,
                community=community
            )
            membership.delete()
            
            # Update member count
            community.update_member_count()
            
            return Response(
                {'message': f'Successfully left {community.name}'},
                status=status.HTTP_200_OK
            )
        except CommunityMembership.DoesNotExist:
            return Response(
                {'error': 'You are not a member of this community'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MyCommunitiesView(generics.ListAPIView):
    """
    GET: List communities the current user is a member of
    """
    serializer_class = CommunityListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        memberships = CommunityMembership.objects.filter(
            user=self.request.user
        ).values_list('community_id', flat=True)
        return Community.objects.filter(id__in=memberships)


class CommunityMembersView(generics.ListAPIView):
    """
    GET: List all members of a community
    """
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        slug = self.kwargs.get('slug')
        community = get_object_or_404(Community, slug=slug)
        return CommunityMembership.objects.filter(community=community)
    
# backend/communities/views.py
# Add these new views at the end of the file

class PromoteMemberView(APIView):
    """
    POST: Promote a member to moderator (admin/creator only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, slug, user_id):
        community = get_object_or_404(Community, slug=slug)
        target_user = get_object_or_404(User, id=user_id)
        
        # Check if requester is admin or creator
        requester_membership = CommunityMembership.objects.filter(
            user=request.user,
            community=community
        ).first()
        
        if not requester_membership or (requester_membership.role not in ['admin'] and community.creator != request.user):
            return Response(
                {'error': 'Only admins can promote members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get target membership
        target_membership = CommunityMembership.objects.filter(
            user=target_user,
            community=community
        ).first()
        
        if not target_membership:
            return Response(
                {'error': 'User is not a member of this community'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_membership.role == 'moderator':
            return Response(
                {'error': 'User is already a moderator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Promote to moderator
        target_membership.role = 'moderator'
        target_membership.save()
        
        return Response(
            {
                'message': f'{target_user.username} promoted to moderator',
                'membership': CommunityMembershipSerializer(target_membership).data
            },
            status=status.HTTP_200_OK
        )


class DemoteMemberView(APIView):
    """
    POST: Demote a moderator to member (admin/creator only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, slug, user_id):
        community = get_object_or_404(Community, slug=slug)
        target_user = get_object_or_404(User, id=user_id)
        
        # Check if requester is admin or creator
        requester_membership = CommunityMembership.objects.filter(
            user=request.user,
            community=community
        ).first()
        
        if not requester_membership or (requester_membership.role not in ['admin'] and community.creator != request.user):
            return Response(
                {'error': 'Only admins can demote members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get target membership
        target_membership = CommunityMembership.objects.filter(
            user=target_user,
            community=community
        ).first()
        
        if not target_membership:
            return Response(
                {'error': 'User is not a member of this community'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_membership.role != 'moderator':
            return Response(
                {'error': 'User is not a moderator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cannot demote creator
        if community.creator == target_user:
            return Response(
                {'error': 'Cannot demote community creator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Demote to member
        target_membership.role = 'member'
        target_membership.save()
        
        return Response(
            {
                'message': f'{target_user.username} demoted to member',
                'membership': CommunityMembershipSerializer(target_membership).data
            },
            status=status.HTTP_200_OK
        )


class KickMemberView(APIView):
    """
    POST: Remove a member from community (moderator/admin/creator only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, slug, user_id):
        community = get_object_or_404(Community, slug=slug)
        target_user = get_object_or_404(User, id=user_id)
        
        # Check if requester has permission
        requester_membership = CommunityMembership.objects.filter(
            user=request.user,
            community=community
        ).first()
        
        if not requester_membership or (requester_membership.role not in ['admin', 'moderator'] and community.creator != request.user):
            return Response(
                {'error': 'Only moderators and admins can kick members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Cannot kick creator
        if community.creator == target_user:
            return Response(
                {'error': 'Cannot kick community creator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cannot kick yourself
        if request.user == target_user:
            return Response(
                {'error': 'Cannot kick yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get target membership
        target_membership = CommunityMembership.objects.filter(
            user=target_user,
            community=community
        ).first()
        
        if not target_membership:
            return Response(
                {'error': 'User is not a member of this community'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Moderators cannot kick other moderators or admins
        if requester_membership.role == 'moderator' and target_membership.role in ['admin', 'moderator']:
            return Response(
                {'error': 'Moderators cannot kick other moderators or admins'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete membership
        username = target_user.username
        target_membership.delete()
        
        # Update member count
        community.update_member_count()
        
        return Response(
            {'message': f'{username} has been removed from the community'},
            status=status.HTTP_200_OK
        )

