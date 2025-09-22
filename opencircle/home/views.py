from django.shortcuts import render
from django.db.models import Count
from django.contrib.auth import get_user_model
from posts.models import Post
from communities.models import Community

User = get_user_model()

def home(request):
    # Show all posts, regardless of login status
    posts = Post.objects.all().order_by('-created_at').select_related('user', 'community')
    
    # Get top communities by member count
    top_communities = Community.objects.annotate(member_count=Count('members')).order_by('-member_count')[:5]
    
    # Get followers if user is authenticated
    followers = []
    if request.user.is_authenticated:
        followers = request.user.followers.all()
    
    return render(request, "home/home.html", {
        "posts": posts,
        "top_communities": top_communities,
        "followers": followers,
    })
