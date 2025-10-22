const feedContainer = document.getElementById('feed-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const relatedTopicsEl = document.getElementById('related-topics');
const topContributorsEl = document.getElementById('top-contributors');

const platformColors = {
    youtube: '#FF0000',
    reddit: '#FFB000',
    bluesky: '#1DA1F2'
};

const formatNumber = (num) => {
    const n = parseInt(num) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
};

function createPostCard(item) {
    const sentimentColor = {
        positive: 'var(--ok)',
        neutral: 'var(--muted)',
        negative: 'var(--bad)'
    }[item.sentiment] || 'var(--muted)';

    return `
        <div class="tm-card" style="padding:20px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:${platformColors[item.platform]};display:flex;align-items:center;justify-content:center;color:white;font-weight:600;">
                        ${item.platform.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight:600;">${item.author || 'Anonymous'}</div>
                        <div style="font-size:12px;color:var(--muted);">${item.platform}</div>
                    </div>
                </div>
                <span style="font-size:12px;color:var(--muted);">${timeAgo(item.created_at)}</span>
            </div>

            <h4 style="margin-bottom:12px;line-height:1.4;">${item.topic}</h4>

            <div style="display:flex;gap:16px;margin-bottom:12px;color:var(--muted);font-size:14px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    ${formatNumber(item.likes)}
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ${formatNumber(item.comments)}
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    ${formatNumber(item.shares)}
                </div>
                <div style="margin-left:auto;color:${sentimentColor};">
                    ${item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                ${(item.tags || []).slice(0, 4).map(tag => 
                    `<span class="tm-chip">${tag}</span>`
                ).join('')}
            </div>

            <a href="${item.url}" target="_blank" style="color:var(--accent);font-size:14px;text-decoration:none;">
                View Original →
            </a>
        </div>
    `;
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
}

async function searchTopics(query) {
    feedContainer.innerHTML = '<div class="tm-card" style="text-align:center;padding:40px;">Searching...</div>';
    
    try {
        const res = await fetch(`/api/explore?q=${encodeURIComponent(query)}`);
        const { success, data } = await res.json();
        
        if (!success || !data.feed || data.feed.length === 0) {
            feedContainer.innerHTML = '<div class="tm-card" style="text-align:center;padding:40px;color:var(--muted);">No results found. Try a different search term.</div>';
            return;
        }

        // Render feed
        feedContainer.innerHTML = data.feed.map(createPostCard).join('');

        // Render related topics
        if (data.relatedTopics) {
            relatedTopicsEl.innerHTML = Object.entries(data.relatedTopics)
                .slice(0, 6)
                .map(([topic, count]) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1f2937;border-radius:8px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#1f2937'" onclick="document.getElementById('search-input').value='${topic}';searchTopics('${topic}');">
                        <span style="font-weight:500;">${topic}</span>
                        <span style="color:var(--muted);font-size:14px;">${count} posts</span>
                    </div>
                `).join('');
        }

        // Render top contributors
        if (data.topContributors) {
            topContributorsEl.innerHTML = Object.entries(data.topContributors)
                .slice(0, 5)
                .map(([author, count]) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1f2937;border-radius:8px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;">
                                ${author.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight:500;">${author}</span>
                        </div>
                        <span style="color:var(--muted);font-size:14px;">${count} posts</span>
                    </div>
                `).join('');
        }

    } catch (error) {
        console.error('Search error:', error);
        feedContainer.innerHTML = '<div class="tm-card" style="text-align:center;padding:40px;color:var(--bad);">Error loading results. Please try again.</div>';
    }
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) searchTopics(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) searchTopics(query);
    }
});

// Initial load with default search
searchTopics('AI');