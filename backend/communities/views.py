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
