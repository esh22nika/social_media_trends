document.addEventListener('DOMContentLoaded', () => {
    let timelineChart;

    const colors = ['#7c3aed', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

    async function init() {
        try {
            const res = await fetch('/api/trend-analysis');
            const { success, data } = await res.json();
            if (!success) throw new Error('Failed to fetch analysis data');
            
            // KPIs
            document.getElementById('kpi-active').textContent = data.kpis.activeTrends;
            document.getElementById('kpi-peak').textContent = data.kpis.peakThisWeek;
            document.getElementById('kpi-emerging').textContent = data.kpis.emergingTrends;
            document.getElementById('kpi-declining').textContent = data.kpis.declining;

            // Chart
            const ctx = document.getElementById('timeline-chart').getContext('2d');
            const { labels, datasets } = processTimelineData(data.timeline);
            
            if (timelineChart) timelineChart.destroy();
            timelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#cbd5e1' }}},
                    scales: {
                        x: { ticks: { color: '#94a3b8' }},
                        y: { 
                            ticks: { color: '#94a3b8' },
                            stacked: true 
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.3,
                            fill: 'start'
                        }
                    }
                }
            });

        } catch (error) {
            console.error(error);
            document.getElementById('timeline-chart').innerHTML = `<p style="color:var(--bad)">${error.message}</p>`;
        }
    }

    function processTimelineData(timelineData) {
        if (!timelineData || timelineData.length === 0) return { labels: [], datasets: []};
        
        const labels = [...new Set(timelineData.map(d => d.date.split('T')[0]))].sort();
        const topics = [...new Set(timelineData.flatMap(d => Object.keys(d).filter(k => k !== 'date')))];
        
        const datasets = topics.map((topic, i) => {
            return {
                label: topic,
                data: labels.map(label => {
                    const dayData = timelineData.find(d => d.date.split('T')[0] === label);
                    return dayData ? dayData[topic] || 0 : 0;
                }),
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '40', // Add alpha for fill
                fill: true,
            };
        });

        return { labels, datasets };
    }

    init();
});
