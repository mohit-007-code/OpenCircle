# backend/accounts/views.py
from django.contrib.auth import authenticate, update_session_auth_hash
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    UserUpdateSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Standard email/password registration"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class GoogleAuthView(APIView):
    """Google OAuth authentication endpoint"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
            )
            
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            google_id = idinfo.get('sub')
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + '_' + google_id[:6],
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'created': created,
                'message': 'Login successful' if not created else 'Account created successfully'
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': 'Invalid token', 'details': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Authentication failed', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update authenticated user profile"""
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserProfileSerializer


class LogoutView(APIView):
    """Logout by blacklisting the refresh token"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logout successful'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Invalid token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginView(APIView):
    """Standard email/password login"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old and new passwords are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Current password is incorrect'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)
    
    return Response({'message': 'Password updated successfully'})


# Update the user_stats function in backend/accounts/views.py

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics"""
    from posts.models import Post, Comment
    from communities.models import CommunityMembership
    from .models import Follow
    
    user = request.user
    
    # Get posts grouped by community
    posts = Post.objects.filter(author=user).select_related('community')
    communities_stats = {}
    
    for post in posts:
        community_name = post.community.name
        community_slug = post.community.slug
        if community_slug not in communities_stats:
            communities_stats[community_slug] = {
                'name': community_name,
                'slug': community_slug,
                'post_count': 0
            }
        communities_stats[community_slug]['post_count'] += 1
    
    stats = {
        'total_posts': posts.count(),
        'total_comments': Comment.objects.filter(author=user).count(),
        'communities': list(communities_stats.values()),
        'member_of': CommunityMembership.objects.filter(user=user).count(),
        'followers_count': Follow.objects.filter(following=user).count(),
        'following_count': Follow.objects.filter(follower=user).count(),
    }
    
    return Response(stats)



@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_comments(request):
    """Get user's comments with community info"""
    from posts.models import Comment
    from posts.serializers import CommentSerializer
    
    comments = Comment.objects.filter(
        author=request.user
    ).select_related('post', 'post__community', 'author').order_by('-created_at')
    
    serializer = CommentSerializer(comments, many=True, context={'request': request})
    
    # Add community info to each comment
    data = []
    for comment_data, comment in zip(serializer.data, comments):
        comment_data['community_name'] = comment.post.community.name
        comment_data['community_slug'] = comment.post.community.slug
        comment_data['post_title'] = comment.post.title or comment.post.content[:50]
        data.append(comment_data)
    
    return Response(data)


# Add to backend/accounts/views.py

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, user_id):
    """Follow a user"""
    from .models import Follow
    
    if request.user.id == user_id:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_follow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user_to_follow
    )
    
    if not created:
        # Already following, so unfollow
        follow.delete()
        return Response({'following': False, 'message': 'Unfollowed successfully'})
    
    return Response({'following': True, 'message': 'Followed successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_followers(request, user_id):
    """Get list of user's followers"""
    from .models import Follow
    
    followers = Follow.objects.filter(following_id=user_id).select_related('follower')
    
    data = []
    for follow in followers:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=follow.follower
        ).exists()
        
        data.append({
            'id': follow.follower.id,
            'username': follow.follower.username,
            'first_name': follow.follower.first_name,
            'last_name': follow.follower.last_name,
            'profile_picture': follow.follower.profile_picture.url if follow.follower.profile_picture else None,
            'is_following': is_following,
            'followed_at': follow.created_at
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_following(request, user_id):
    """Get list of users that this user is following"""
    from .models import Follow
    
    following = Follow.objects.filter(follower_id=user_id).select_related('following')
    
    data = []
    for follow in following:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=follow.following
        ).exists()
        
        data.append({
            'id': follow.following.id,
            'username': follow.following.username,
            'first_name': follow.following.first_name,
            'last_name': follow.following.last_name,
            'profile_picture': follow.following.profile_picture.url if follow.following.profile_picture else None,
            'is_following': is_following,
            'followed_at': follow.created_at
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_user_profile(request, user_id):
    """Get public user profile"""
    from .models import Follow
    
    try:
        profile_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()
    
    data = {
        'id': profile_user.id,
        'username': profile_user.username,
        'first_name': profile_user.first_name,
        'last_name': profile_user.last_name,
        'bio': profile_user.bio,
        'profile_picture': profile_user.profile_picture.url if profile_user.profile_picture else None,
        'cover_image': profile_user.cover_image.url if profile_user.cover_image else None,
        'date_joined': profile_user.date_joined,
        'followers_count': Follow.objects.filter(following=profile_user).count(),
        'following_count': Follow.objects.filter(follower=profile_user).count(),
        'is_following': is_following,
        'is_own_profile': request.user.is_authenticated and request.user.id == profile_user.id
    }
    
    return Response(data)

@api_view(['DELETE', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_follower(request, user_id):
    """Remove a user from your followers - they were following you"""
    from .models import Follow
    
    try:
        follower_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Find the Follow relationship where THEY follow YOU
    try:
        follow = Follow.objects.get(
            follower=follower_user,   # They are the follower
            following=request.user     # You are the one being followed
        )
        follow.delete()
        
        return Response({
            'message': 'Follower removed successfully'
        }, status=status.HTTP_200_OK)
        
    except Follow.DoesNotExist:
        return Response({
            'error': 'This user is not following you'
        }, status=status.HTTP_400_BAD_REQUEST)
