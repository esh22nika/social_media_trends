document.addEventListener('DOMContentLoaded', () => {
    const trendsList = document.getElementById('trends-list');
    const interestsList = document.getElementById('interests-list');
    
    // Modal elements
    const manageInterestsBtn = document.getElementById('manage-interests-btn');
    const interestsModal = document.getElementById('interests-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-interests-btn');
    const saveBtn = document.getElementById('save-interests-btn');
    const modalBody = document.getElementById('modal-body');

    let dashboardData = null;

    // Updated platform colors
    const platformColors = {
        youtube: '#FF0000',  // Red
        reddit: '#FFB000',   // Yellow/Orange
        bluesky: '#1DA1F2',  // Blue
    };

    // Helper to format large numbers for display
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
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
                    <a href="${item.url}" target="_blank" style="font-size:12px; color:var(--muted);">View Original</a>
                </div>
                <h4 class="trend-card-title">${item.topic}</h4>
                <div style="font-size:12px; color:var(--muted); margin-bottom: 8px;">Relevance: ${item.relevanceScore}%</div>
                <div class="trend-card-relevance"><div class="relevance-bar" style="width:${item.relevanceScore}%;"></div></div>
                
                <div class="trend-card-metrics" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0;">
                    <div style="background: #1f2937; border-radius: 8px; padding: 8px; text-align: center;">
                        <div style="font-size: 16px; font-weight: 600;">${formatNumber(item.likes)}</div>
                        <div style="font-size: 11px; color: var(--muted);">Likes</div>
                    </div>
                    <div style="background: #1f2937; border-radius: 8px; padding: 8px; text-align: center;">
                        <div style="font-size: 16px; font-weight: 600;">${formatNumber(item.comments)}</div>
                        <div style="font-size: 11px; color: var(--muted);">Comments</div>
                    </div>
                    <div style="background: #1f2937; border-radius: 8px; padding: 8px; text-align: center;">
                        <div style="font-size: 16px; font-weight: 600;">${formatNumber(item.shares)}</div>
                        <div style="font-size: 11px; color: var(--muted);">Shares/Score</div>
                    </div>
                    <div style="background: #1f2937; border-radius: 8px; padding: 8px; text-align: center; color: ${sentimentColor};">
                        <div style="font-size: 16px; font-weight: 600;">${item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}</div>
                        <div style="font-size: 11px; color: var(--muted);">Sentiment</div>
                    </div>
                </div>

                <div class="trend-card-tags">
                    ${item.tags.slice(0, 4).map(tag => `<span class="tm-chip">${tag}</span>`).join('')}
                </div>
            </div>`;
    }

    function renderTrends(type) {
        trendsList.innerHTML = '<p>Loading...</p>';
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
        if (Object.keys(interests).length === 0) {
            interestsList.innerHTML = '<p style="font-size:14px; color:var(--muted); text-align:center; padding: 10px 0;">No posts match your selected interests. Try adding more interests!</p>';
            return;
        }
        
        for (const [topic, count] of Object.entries(interests)) {
            const percentage = Math.max((count / total * 100), 5); // min width 5%
            interestsList.innerHTML += `
                <div class="interest-item" title="${count} posts">
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${topic}</span>
                    <div class="interest-bar-bg">
                        <div class="interest-bar-fill" style="width:${percentage}%"></div>
                    </div>
                    <span>${count}</span>
                </div>`;
        }
    }
    
    async function loadDashboard() {
        trendsList.innerHTML = '<div class="tm-card" style="text-align: center; padding: 40px;">Loading dashboard data...</div>';
        interestsList.innerHTML = '';
        try {
            const res = await fetch('/api/dashboard');
            const { success, data } = await res.json();
            if (!success) throw new Error('Failed to fetch dashboard data');
            
            dashboardData = data;

            document.getElementById('kpi-tracked').textContent = data.kpis.trendsTracked.toLocaleString();
            document.getElementById('kpi-topics').textContent = data.kpis.activeTopics.toLocaleString();
            document.getElementById('kpi-today').textContent = data.kpis.updatesToday.toLocaleString();
            document.getElementById('kpi-relevance').textContent = `${data.kpis.relevanceScore}%`;

            renderTrends('foryou');
            renderInterests();

        } catch (error) {
            console.error(error);
            trendsList.innerHTML = '<p style="color:var(--bad);">Could not load dashboard data.</p>';
        }
    }

    // --- Modal Logic ---
    function openModal() { interestsModal.classList.remove('hidden'); }
    function closeModal() { interestsModal.classList.add('hidden'); }

    async function populateModal() {
        modalBody.innerHTML = '<p>Loading available topics...</p>';
        try {
            const res = await fetch('/api/interests');
            const { success, data } = await res.json();
            if (!success) throw new Error('Could not fetch topics.');

            const { currentUserInterests, availableTopics } = data;
            modalBody.innerHTML = '';
            
            if(availableTopics.length === 0) {
                modalBody.innerHTML = '<p style="color:var(--muted);">No topics available to select. Data might still be processing.</p>';
                return;
            }

            availableTopics.forEach(topic => {
                const isChecked = currentUserInterests.includes(topic);
                modalBody.innerHTML += `
                    <label class="checkbox-item">
                        <input type="checkbox" value="${topic}" ${isChecked ? 'checked' : ''}>
                        <span>${topic}</span>
                    </label>
                `;
            });
        } catch (error) {
            modalBody.innerHTML = `<p style="color:var(--bad);">${error.message}</p>`;
        }
    }
    
    async function handleSaveInterests() {
        const selectedInterests = Array.from(modalBody.querySelectorAll('input[type="checkbox"]:checked'))
            .map(input => input.value);
        
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        cancelBtn.disabled = true;

        try {
            const res = await fetch('/api/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interests: selectedInterests })
            });
            const { success } = await res.json();
            if (!success) throw new Error('Failed to save interests.');

            closeModal();
            await loadDashboard(); // Refresh the whole dashboard with new interests
        } catch (error) {
            alert(error.message); // Simple alert for error feedback
        } finally {
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    manageInterestsBtn.addEventListener('click', () => {
        openModal();
        populateModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    interestsModal.addEventListener('click', (e) => {
        if (e.target === interestsModal) closeModal();
    });

    saveBtn.addEventListener('click', handleSaveInterests);

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

    // Initial load
    loadDashboard();
});