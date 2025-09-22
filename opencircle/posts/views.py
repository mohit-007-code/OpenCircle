from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Post, Like, Comment, Share
from communities.models import Community

# ------------------------
# Create Post
# ------------------------
@login_required(login_url='/accounts/login/')  # Redirect if not logged in
def create_post(request):
    communities = Community.objects.all()
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")
        community_id = request.POST.get("community")
        community = get_object_or_404(Community, id=community_id)
        
        # Check if user is a member of the community
        if not (request.user == community.creator or request.user in community.members.all()):
            messages.error(request, "You must be a member of the community to post.")
            return redirect("community-detail", community_id=community_id)
            
        # Create post with optional image
        post = Post(title=title, content=content, user=request.user, community=community)
        if 'image' in request.FILES:
            post.image = request.FILES['image']
        post.save()
        
        messages.success(request, "Post created successfully!")
        return redirect("community-detail", community_id=community_id)
    return render(request, "posts/create.html", {"communities": communities})


from django.http import JsonResponse

# ------------------------
# Like Post
# ------------------------
@login_required(login_url='/accounts/login/')
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like_obj, created = Like.objects.get_or_create(post=post, user=request.user)

    if not created:
        # Already liked, so unlike
        like_obj.delete()
        liked = False
        message = "Post unliked"
    else:
        liked = True
        message = "Post liked"

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'liked': liked,
            'likes_count': post.likes.count(),
            'message': message
        })
    
    return redirect(request.META.get('HTTP_REFERER', 'home'))



# ------------------------
# Comment Post
# ------------------------
@login_required(login_url='/accounts/login/')
def comment_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if request.method == "POST":
        content = request.POST.get("content")
        if content:
            comment = Comment.objects.create(post=post, user=request.user, content=content)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'comment': {
                        'id': comment.id,
                        'content': comment.content,
                        'user': comment.user.username,
                        'created_at': comment.created_at.strftime('%b %d, %Y %H:%M'),
                    },
                    'comments_count': post.comments.count()
                })
    return redirect(request.META.get('HTTP_REFERER', 'home'))


# ------------------------
# Share Post
# ------------------------
@login_required(login_url='/accounts/login/')
def share_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    Share.objects.create(post=post, user=request.user)
    messages.success(request, "Post shared!")
    return redirect(request.META.get('HTTP_REFERER', 'home'))

@login_required
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    community = post.community

    if request.user != post.user and request.user != community.creator:
        messages.error(request, "You cannot delete this post.")
        return redirect("community-detail", community_id=community.id)

    if request.method == "POST":
        post.delete()
        messages.success(request, "Post deleted successfully!")
        return redirect("community-detail", community_id=community.id)

    return render(request, "posts/delete_confirm.html", {"post": post})

@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    community = post.community

    if request.user != post.user and request.user != community.creator:
        messages.error(request, "You cannot edit this post.")
        return redirect("community-detail", community_id=community.id)

    if request.method == "POST":
        post.title = request.POST.get("title", post.title)
        post.content = request.POST.get("content", post.content)
        post.save()
        messages.success(request, "Post updated successfully!")
        return redirect("community-detail", community_id=community.id)

    return render(request, "posts/edit_post.html", {"post": post})



