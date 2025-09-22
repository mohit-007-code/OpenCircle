document.addEventListener('DOMContentLoaded', function() {
    // Handle follow/unfollow functionality
    const followForms = document.querySelectorAll('.follow-form');
    
    followForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = form.querySelector('.follow-btn').dataset.username;
            const followBtn = form.querySelector('.follow-btn');
            const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
            
            fetch(`/accounts/profile/${username}/follow/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update button text
                    followBtn.textContent = data.action === 'followed' ? 'Unfollow' : 'Follow';
                    
                    // Update follower count with animation
                    const followerCount = document.querySelector('.followers-count');
                    if (followerCount) {
                        followerCount.textContent = data.followers_count;
                        followerCount.classList.add('updated');
                        setTimeout(() => {
                            followerCount.classList.remove('updated');
                        }, 1000);
                    }

                    // Update following count on user's own profile if available
                    const followingCount = document.querySelector('.following-count');
                    if (followingCount) {
                        followingCount.textContent = data.following_count;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });

    // Make all usernames clickable
    document.querySelectorAll('.username-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const username = this.textContent.trim();
            window.location.href = `/accounts/profile/${username}/`;
        });
    });
});