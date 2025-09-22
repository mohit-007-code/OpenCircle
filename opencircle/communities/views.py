from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from .models import Community
from .forms import CommunityForm
from posts.models import Post
from django.contrib import messages

@login_required
def create_community(request):
    if request.method == "POST":
        form = CommunityForm(request.POST)
        if form.is_valid():
            community = form.save(commit=False)
            community.creator = request.user  # assign logged-in user
            community.save()
            community.members.add(request.user)  # creator joins automatically
            messages.success(request, "Community created successfully!")
            return redirect("community-detail", community_id=community.id)
    else:
        form = CommunityForm()
    return render(request, "communities/create_community.html", {"form": form})


def community_detail(request, community_id):
    community = get_object_or_404(Community, id=community_id)
    posts = community.posts.select_related('user').all().order_by('-created_at')
    total_members = community.members.count()

    # Check if user is authenticated and member status
    is_authenticated = request.user.is_authenticated
    is_member = is_authenticated and request.user in community.members.all()
    is_creator = is_authenticated and request.user == community.creator

    # Handle POST actions
    if request.method == "POST":
        # Join community
        if "join_community" in request.POST:
            if not request.user.is_authenticated:
                messages.error(request, "You need to login or register to join the community.")
                return redirect("login")
            community.members.add(request.user)
            messages.success(request, "You joined the community!")
            return redirect("community-detail", community_id=community.id)

        # Create post
        elif "post_content" in request.POST:
            if not request.user.is_authenticated:
                messages.error(request, "You need to login or register to post.")
                return redirect("login")
            
            # Check if user is member or creator
            if not (request.user == community.creator or request.user in community.members.all()):
                messages.error(request, "You must be a member of the community to post.")
                return redirect("community-detail", community_id=community_id)
                
            title = request.POST.get("title")
            content = request.POST.get("content")
            
            # Create post
            post = Post(title=title, content=content, user=request.user, community=community)
            
            # Handle image upload
            if 'image' in request.FILES:
                post.image = request.FILES['image']
                
            post.save()
            messages.success(request, "Post created successfully!")
            return redirect("community-detail", community_id=community.id)

    # Check if user is authenticated and their status
    is_authenticated = request.user.is_authenticated
    is_creator = is_authenticated and request.user == community.creator
    is_member = is_authenticated and request.user in community.members.all()

    return render(request, "communities/detail.html", {
        "community": community,
        "posts": posts,
        "total_members": total_members,
        "is_member": is_member,
        "is_creator": is_creator,
        "user_can_post": is_member or is_creator
    })


@login_required
def edit_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    # Only the creator can edit
    if request.user != community.creator:
        messages.error(request, "You are not allowed to edit this community.")
        return redirect("community-detail", community_id=community.id)

    if request.method == "POST":
        form = CommunityForm(request.POST, instance=community)
        if form.is_valid():
            form.save()
            messages.success(request, "Community updated successfully!")
            return redirect("community-detail", community_id=community.id)
    else:
        form = CommunityForm(instance=community)

    return render(request, "communities/edit_community.html", {"form": form, "community": community})


@login_required
def delete_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    # Only the creator can delete
    if request.user != community.creator:
        messages.error(request, "You are not allowed to delete this community.")
        return redirect("community-detail", community_id=community.id)

    if request.method == "POST":
        community.delete()
        messages.success(request, "Community deleted successfully!")
        return redirect("home")

    return render(request, "communities/delete_community.html", {"community": community})


def search_communities(request):
    query = request.GET.get('q', '').strip()
    print(f"Search query received: {query}")  # Debug print
    
    try:
        if query and len(query) >= 2:
            communities = Community.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            ).values('id', 'name', 'description')[:5]
            results = list(communities)
            print(f"Found {len(results)} communities")  # Debug print
            return JsonResponse({
                'status': 'success',
                'results': results
            })
        return JsonResponse({
            'status': 'success',
            'results': []
        })
    except Exception as e:
        print(f"Error in search: {str(e)}")  # Debug print
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


def search_communities(request):
    query = request.GET.get('q', '')
    print(f"Search query received: {query}")  # Debug print
    
    try:
        if query:
            communities = Community.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            ).values('id', 'name', 'description')[:5]
            results = list(communities)
            print(f"Found {len(results)} communities")  # Debug print
            return JsonResponse({
                'status': 'success',
                'results': results
            })
        return JsonResponse({
            'status': 'success',
            'results': []
        })
    except Exception as e:
        print(f"Error in search: {str(e)}")  # Debug print
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while searching'
        }, status=500)


@login_required
def leave_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)
    
    # Check if user is actually a member
    if request.user not in community.members.all():
        messages.error(request, "You are not a member of this community.")
        return redirect("community-detail", community_id=community.id)
    
    # Prevent creator from leaving
    if request.user == community.creator:
        messages.error(request, "As the creator, you cannot leave the community.")
        return redirect("community-detail", community_id=community.id)
    
    if request.method == "POST":
        community.members.remove(request.user)
        messages.success(request, f"You have left the community: {community.name}")
        return redirect("home")
    
    return render(request, "communities/leave_community.html", {"community": community})