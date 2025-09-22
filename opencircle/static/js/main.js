document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('communitySearch');
    const searchResults = document.getElementById('searchResults');
    let debounceTimer;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = this.value.trim();
            
            // Toggle search results visibility
            if (query.length === 0) {
                searchResults.style.display = 'none';
                return;
            }

            // Debounce search requests
            debounceTimer = setTimeout(() => {
                if (query.length >= 2) {
                    searchResults.style.display = 'block';
                    fetchSearchResults(query);
                }
            }, 300);
        });

        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // Communities popup functionality
    const communitiesCollapse = document.getElementById('communitiesCollapse');
    if (communitiesCollapse) {
        communitiesCollapse.addEventListener('show.bs.collapse', function() {
            const icon = this.previousElementSibling.querySelector('.bi-chevron-right');
            icon.style.transform = 'rotate(90deg)';
        });

        communitiesCollapse.addEventListener('hide.bs.collapse', function() {
            const icon = this.previousElementSibling.querySelector('.bi-chevron-right');
            icon.style.transform = 'rotate(0deg)';
        });
    }
});

// Function to fetch search results
function fetchSearchResults(query) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="searching">Searching...</div>';

    fetch(`/communities/search/?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Search response:', data);
            
            if (data.status === 'success') {
                if (data.results && data.results.length > 0) {
                    const resultsHTML = data.results.map(community => `
                        <a href="/communities/${community.id}/" class="search-result-item">
                            <div class="result-content">
                                <h5>${escapeHtml(community.name)}</h5>
                                ${community.description ? 
                                    `<p>${escapeHtml(community.description.substring(0, 100))}${community.description.length > 100 ? '...' : ''}</p>` 
                                    : ''}
                            </div>
                        </a>
                    `).join('');
                    searchResults.innerHTML = resultsHTML;
                } else {
                    searchResults.innerHTML = '<div class="no-results">No communities found</div>';
                }
            } else {
                searchResults.innerHTML = '<div class="no-results">Error: ' + (data.message || 'Unknown error') + '</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
            searchResults.innerHTML = '<div class="no-results">Error fetching results</div>';
        });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
