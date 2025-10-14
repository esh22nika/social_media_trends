document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const feedContainer = document.getElementById('feed-container');
    const relatedTopicsContainer = document.getElementById('related-topics');
    const topContributorsContainer = document.getElementById('top-contributors');

    const platformColors = {
        youtube: '#FF0000',
        reddit: '#FF4500',
        bluesky: '#1DA1F2',
    };

    function createFeedCard(item) {
        return `
            <div class="trend-card">
                <div class="trend-card-header">
                    <span class="trend-card-platform" style="background:${platformColors[item.platform] || '#6B7280'}; color:white;">
                        ${item.platform.toUpperCase()}
                    </span>
                     <a href="${item.url}" target="_blank" style="font-size:12px; color:var(--muted);">View Original</a>
                </div>
                <p style="font-size:14px; color:var(--muted); margin: 0 0 8px 0;">@${item.author}</p>
                <p class="trend-card-title" style="font-size:15px;">${item.topic}</p>
                <div class="trend-card-metrics">
                    <span>❤️ ${item.likes.toLocaleString()}</span>
                    <span>💬 ${item.comments.toLocaleString()}</span>
                    <span>🔗 ${item.shares.toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    async function searchTopic(query) {
        feedContainer.innerHTML = '<p>Loading...</p>';
        try {
            const res = await fetch(`/api/explore?q=${encodeURIComponent(query)}`);
            const { success, data } = await res.json();

            if (!success || !data) throw new Error('Failed to fetch data');

            // Render Feed
            if (data.feed && data.feed.length > 0) {
                feedContainer.innerHTML = data.feed.map(createFeedCard).join('');
            } else {
                feedContainer.innerHTML = '<p>No results found for this topic.</p>';
            }

            // Render Related Topics
            relatedTopicsContainer.innerHTML = '';
            const topics = data.relatedTopics || {};
            if (Object.keys(topics).length > 0) {
                 for (const [topic, count] of Object.entries(topics)) {
                    relatedTopicsContainer.innerHTML += `<div class="interest-item"><span>${topic}</span> <span>${count} posts</span></div>`;
                }
            } else {
                relatedTopicsContainer.innerHTML = '<p>No related topics.</p>';
            }

            // Render Top Contributors
            topContributorsContainer.innerHTML = '';
             const contributors = data.topContributors || {};
            if (Object.keys(contributors).length > 0) {
                 for (const [author, count] of Object.entries(contributors)) {
                    topContributorsContainer.innerHTML += `<div class="interest-item"><span>@${author}</span> <span>${count} posts</span></div>`;
                }
            } else {
                topContributorsContainer.innerHTML = '<p>No top contributors.</p>';
            }

        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = `<p style="color:var(--bad);">Error: ${error.message}</p>`;
        }
    }
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchTopic(query);
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Initial search
    searchTopic('AI');
});