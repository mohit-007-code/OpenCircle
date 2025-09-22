from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from posts.models import Post
from communities.serializers import UserPostSerializer
from .serializers import UserRegisterSerializer
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash

User = get_user_model()

# ------------------------------
# Template-based Views (HTML forms)
# ------------------------------

from .forms import CustomUserCreationForm

def register_view(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful!")
            return redirect("home")
        else:
            messages.error(request, "Please fix the errors below.")
    else:
        form = CustomUserCreationForm()
    return render(request, "accounts/register.html", {"form": form})



def login_view(request):
    """Template-based login for sidebar form"""
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, "Logged in successfully!")
            return redirect("home")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, "accounts/login.html", {"form": form})


def logout_view(request):
    """View for logging out users"""
    logout(request)
    messages.success(request, "Logged out successfully!")
    return redirect("home")


@login_required
def profile_view(request, **kwargs):
    """View for user profile
    Can be accessed via:
    - /profile/ (own profile)
    - /profile/<username>/ (other user's profile)
    """
    username = kwargs.get('username')
    if username:
        # Viewing another user's profile
        profile_user = get_object_or_404(User, username=username)
    else:
        # Viewing own profile
        profile_user = request.user

    # Get user's posts
    posts = Post.objects.filter(user=profile_user).select_related('community').order_by('-created_at')
    
    # Check if the logged-in user is following this profile
    is_following = False
    if request.user != profile_user:
        is_following = request.user.following.filter(id=profile_user.id).exists()
    
    # Get communities created by the user
    created_communities = profile_user.created_communities.all()
    # Get communities joined by the user (excluding created ones)
    joined_communities = profile_user.joined_communities.all()
    
    context = {
        'profile_user': profile_user,
        'posts': posts,
        'followers_count': profile_user.followers.count(),
        'following_count': profile_user.following.count(),
        'is_following': is_following,
        'is_own_profile': request.user == profile_user,
        'created_communities': created_communities,
        'joined_communities': joined_communities
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def edit_profile(request):
    """View for editing user profile"""
    user = request.user
    if request.method == "POST":
        user.username = request.POST.get("username", user.username)
        user.bio = request.POST.get("bio", user.bio)
        user.social_links = request.POST.get("social_links", user.social_links)
        if request.FILES.get("profile_picture"):
            user.profile_picture = request.FILES["profile_picture"]
        if request.POST.get("password"):
            user.set_password(request.POST["password"])
            update_session_auth_hash(request, user)  # keeps user logged in

        user.save()
        messages.success(request, "Profile updated successfully!")
        return redirect("profile_view")  # redirect to their profile page

    return render(request, "accounts/edit_profile.html", {"user": user})



@login_required
def follow_user(request, username):
    """View for following a user"""
    user_to_follow = get_object_or_404(User, username=username)
    
    if request.user == user_to_follow:
        messages.error(request, "You cannot follow yourself.")
        return redirect('view_profile', username=username)
    
    if request.method == "POST":
        if request.user.following.filter(id=user_to_follow.id).exists():
            # Unfollow
            request.user.following.remove(user_to_follow)
            action = 'unfollowed'
        else:
            # Follow
            request.user.following.add(user_to_follow)
            action = 'followed'
            
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'action': action,
                'followers_count': user_to_follow.followers.count(),
                'following_count': user_to_follow.following.count()
            })
            
    return redirect('view_profile', username=username)




# ------------------------------
# DRF API Views (for REST clients)
# ------------------------------

class RegisterAPIView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer


class LoginAPIView(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        posts = Post.objects.filter(user=user).select_related("community").order_by("-created_at")
        serializer = UserPostSerializer(posts, many=True)

        data = {
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
            "social_links": user.social_links,
            "followers_count": user.total_followers(),
            "following_count": user.total_following(),
            "total_posts": posts.count(),
            "posts": serializer.data
        }
        return Response(data)
