document.addEventListener('DOMContentLoaded', () => {
    const patternsList = document.getElementById('patterns-list');
    const detailsContainer = document.getElementById('pattern-details');
    let patternData = null;

    function createRuleCard(rule, index) {
        const liftFormatted = rule.lift.toFixed(2);
        const supportFormatted = (rule.support * 100).toFixed(1);
        const confidenceFormatted = (rule.confidence * 100).toFixed(0);

        return `
            <div class="rule-card" data-index="${index}" data-type="rule">
                <div class="rule-flow">
                    <span class="tm-chip">${rule.antecedent.join(', ')}</span>
                    <span>→</span>
                    <span class="tm-chip">${rule.consequent.join(', ')}</span>
                </div>
                <div class="rule-metrics">
                    <div><strong>${supportFormatted}%</strong><span>Support</span></div>
                    <div><strong>${confidenceFormatted}%</strong><span>Confidence</span></div>
                    <div><strong>${liftFormatted}x</strong><span>Lift</span></div>
                </div>
            </div>
        `;
    }

    function createItemsetCard(itemset, index) {
        return `
             <div class="rule-card" data-index="${index}" data-type="itemset">
                <div class="rule-flow">
                     ${itemset.items.map(item => `<span class="tm-chip">${item}</span>`).join('')}
                </div>
                <div class="rule-metrics">
                    <div><strong>${(itemset.support * 100).toFixed(2)}%</strong><span>Support</span></div>
                </div>
            </div>
        `;
    }

    function renderPatterns(type) {
        patternsList.innerHTML = '';
        detailsContainer.innerHTML = '<p style="text-align:center; color:var(--muted); padding: 40px 0;">Select an item to view details</p>';
        let items = [];
        if (type === 'rules') {
            items = patternData.association_rules.map(createRuleCard);
        } else if (type === 'itemsets') {
            items = patternData.frequent_itemsets.map(createItemsetCard);
        } else {
            // Placeholder for sequential patterns
            patternsList.innerHTML = '<p>Sequential patterns view is not yet implemented.</p>';
            return;
        }

        if (items.length > 0) {
            patternsList.innerHTML = items.join('');
        } else {
            patternsList.innerHTML = `<p>No ${type} found.</p>`;
        }
    }

    async function init() {
        try {
            const res = await fetch('/api/pattern-mining');
            const { success, data } = await res.json();
            if (!success) throw new Error('Failed to fetch patterns');
            
            patternData = data;
            
            document.getElementById('kpi-rules').textContent = data.kpis.rules;
            document.getElementById('kpi-itemsets').textContent = data.kpis.itemsets;
            document.getElementById('kpi-patterns').textContent = data.kpis.patterns;

            renderPatterns('rules');

        } catch (error) {
            console.error(error);
            patternsList.innerHTML = `<p style="color:var(--bad);">${error.message}</p>`;
        }
    }

    patternsList.addEventListener('click', (e) => {
        const card = e.target.closest('.rule-card');
        if (!card) return;

        const { index, type } = card.dataset;
        if (type === 'rule') {
            const rule = patternData.association_rules[index];
            detailsContainer.innerHTML = `
                <h4>Association Rule Details</h4>
                <p><strong>If a post contains {${rule.antecedent.join(', ')}}, it's ${rule.lift.toFixed(1)}x more likely to also contain {${rule.consequent.join(', ')}}.</strong></p>
                <p>This rule appears in <strong>${(rule.support * 100).toFixed(2)}%</strong> of all posts. When the antecedent appears, the consequent follows in <strong>${(rule.confidence * 100).toFixed(0)}%</strong> of cases.</p>
            `;
        } else {
             const itemset = patternData.frequent_itemsets[index];
             detailsContainer.innerHTML = `
                <h4>Frequent Itemset Details</h4>
                <p>The combination of <strong>{${itemset.items.join(', ')}}</strong> frequently appears together.</p>
                <p>It is found in <strong>${(itemset.support * 100).toFixed(2)}%</strong> of the total posts analyzed.</p>
            `;
        }
    });

    document.getElementById('tab-rules').addEventListener('click', (e) => {
        document.querySelector('.tm-tabs .active').classList.remove('active');
        e.target.classList.add('active');
        renderPatterns('rules');
    });
    document.getElementById('tab-itemsets').addEventListener('click', (e) => {
        document.querySelector('.tm-tabs .active').classList.remove('active');
        e.target.classList.add('active');
        renderPatterns('itemsets');
    });
    document.getElementById('tab-patterns').addEventListener('click', (e) => {
        document.querySelector('.tm-tabs .active').classList.remove('active');
        e.target.classList.add('active');
        renderPatterns('patterns');
    });

    init();
});