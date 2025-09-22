// Function to handle likes
function handleLike(postId) {
    fetch(`/posts/like/${postId}/`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            const likeIcon = likeBtn.querySelector('i');
            const likeCount = document.querySelector(`#post-${postId} .like-count`);
            
            if (data.liked) {
                likeBtn.classList.add('liked');
                likeIcon.classList.remove('bi-heart');
                likeIcon.classList.add('bi-heart-fill');
            } else {
                likeBtn.classList.remove('liked');
                likeIcon.classList.remove('bi-heart-fill');
                likeIcon.classList.add('bi-heart');
            }
            
            // Update like count
            likeCount.textContent = data.likes_count;
        }
    });
}

// Function to toggle comments section
function toggleComments(postId) {
    const commentsSection = document.querySelector(`#comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

// Function to submit a comment
function submitComment(postId) {
    const commentText = document.querySelector(`#comment-text-${postId}`).value;
    if (!commentText.trim()) return;

    fetch(`/posts/comment/${postId}/`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `content=${encodeURIComponent(commentText)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Add new comment to the list
            const commentsList = document.querySelector(`#comments-list-${postId}`);
            const newComment = document.createElement('div');
            newComment.className = 'comment-item';
            newComment.innerHTML = `
                <div class="comment-user">
                    <strong>${data.comment.user}</strong>
                    <span class="comment-time">just now</span>
                </div>
                <div class="comment-content">${data.comment.content}</div>
            `;
            commentsList.appendChild(newComment);
            
            // Clear the input
            document.querySelector(`#comment-text-${postId}`).value = '';
            
            // Update comment count
            const commentCount = document.querySelector(`#post-${postId} .comment-count`);
            commentCount.textContent = data.comments_count;
        }
    });
}

// Function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add CSRF token to all AJAX requests
document.addEventListener('DOMContentLoaded', function() {
    // Add CSRF token to AJAX requests
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
        const requestHeaders = new Headers({
            'X-CSRFToken': csrftoken,
        });
    }
});