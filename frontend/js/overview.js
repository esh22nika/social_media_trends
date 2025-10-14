document.addEventListener('DOMContentLoaded', () => {
    const trendsList = document.getElementById('trends-list');
    const interestsList = document.getElementById('interests-list');
    let dashboardData = null;

    const platformColors = {
        youtube: '#FF0000',
        reddit: '#FF4500',
        bluesky: '#1DA1F2',
    };

    function createTrendCard(item) {
        const sentimentColor = {
            positive: 'var(--ok)',
            neutral: 'var(--muted)',
            negative: 'var(--bad)'
        }[item.sentiment];

        return `
            <div class="trend-card">
                <div class="trend-card-header">
                    <span class="trend-card-platform" style="background:${platformColors[item.platform] || '#6B7280'}; color:white;">
                        ${item.platform.toUpperCase()}
                    </span>
                    <span style="font-size:12px; color:var(--muted);">${new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h4 class="trend-card-title">${item.topic}</h4>
                <div style="font-size:12px; color:var(--muted);">Relevance: ${item.relevanceScore}%</div>
                <div class="trend-card-relevance">
                    <div class="relevance-bar" style="width:${item.relevanceScore}%;"></div>
                </div>
                <div class="trend-card-metrics">
                    <span>❤️ ${item.likes.toLocaleString()}</span>
                    <span>💬 ${item.comments.toLocaleString()}</span>
                    <span>🔗 ${item.shares.toLocaleString()}</span>
                </div>
                <div class="trend-card-tags">
                    ${item.tags.slice(0, 4).map(tag => `<span class="tm-chip">${tag}</span>`).join('')}
                </div>
                <div class="trend-card-sentiment" style="color:${sentimentColor};">
                    Sentiment: ${item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                </div>
            </div>
        `;
    }

    function renderTrends(type) {
        trendsList.innerHTML = '';
        const trends = type === 'foryou' ? dashboardData.recommendations : dashboardData.trending;
        if (trends && trends.length > 0) {
            trendsList.innerHTML = trends.map(createTrendCard).join('');
        } else {
            trendsList.innerHTML = '<p>No trends to show.</p>';
        }
    }

    function renderInterests() {
        interestsList.innerHTML = '';
        const interests = dashboardData.userInterests || {};
        const total = Object.values(interests).reduce((a, b) => a + b, 0);
        if (total === 0) {
            interestsList.innerHTML = '<p>No interest data available.</p>';
            return;
        }
        for (const [topic, count] of Object.entries(interests)) {
            const percentage = (count / total * 100).toFixed(0);
            interestsList.innerHTML += `
                <div class="interest-item">
                    <span>${topic}</span>
                    <div class="interest-bar-bg">
                        <div class="interest-bar-fill" style="width:${percentage}%"></div>
                    </div>
                    <span>${count}</span>
                </div>
            `;
        }
    }
    
    async function init() {
        try {
            const res = await fetch('/api/dashboard');
            const { success, data } = await res.json();
            if (!success) throw new Error('Failed to fetch dashboard data');
            
            dashboardData = data;

            // Populate KPIs
            document.getElementById('kpi-tracked').textContent = data.kpis.trendsTracked.toLocaleString();
            document.getElementById('kpi-topics').textContent = data.kpis.activeTopics.toLocaleString();
            document.getElementById('kpi-today').textContent = data.kpis.updatesToday.toLocaleString();
            document.getElementById('kpi-relevance').textContent = `${data.kpis.relevanceScore}%`;

            // Initial render
            renderTrends('foryou');
            renderInterests();

        } catch (error) {
            console.error(error);
            trendsList.innerHTML = '<p style="color:var(--bad);">Could not load dashboard data.</p>';
        }
    }

    document.getElementById('tab-foryou').addEventListener('click', (e) => {
        document.getElementById('tab-trending').classList.remove('active');
        e.target.classList.add('active');
        renderTrends('foryou');
    });

    document.getElementById('tab-trending').addEventListener('click', (e) => {
        document.getElementById('tab-foryou').classList.remove('active');
        e.target.classList.add('active');
        renderTrends('trending');
    });

    init();
});