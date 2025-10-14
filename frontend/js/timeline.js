let popChart;

async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

function renderPopularity(pop){
  const ctx = document.getElementById('popChart');
  if(popChart) popChart.destroy();
  const labels = pop.map(d=>d.date);
  const counts = pop.map(d=>d.count);
  const engagement = pop.map(d=>d.engagement);
  popChart = new Chart(ctx,{type:'line',data:{labels,datasets:[
    {label:'Mentions',data:counts,borderColor:'#22d3ee',tension:.3,yAxisID:'y'},
    {label:'Engagement',data:engagement,borderColor:'#7c3aed',tension:.3,yAxisID:'y1'}
  ]},options:{plugins:{legend:{labels:{color:'#cbd5e1'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'},position:'left'},y1:{ticks:{color:'#94a3b8'},position:'right',grid:{drawOnChartArea:false}}}}});
}

function renderPeaks(peaks){
  const tb = document.getElementById('peaks');
  tb.innerHTML='';
  peaks.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.date}</td><td>${p.count||0}</td><td>${Math.round(p.engagement||0)}</td>`;
    tb.appendChild(tr);
  })
}

function renderClusters(clusters){
  const root = document.getElementById('clusters');
  root.innerHTML = '';
  clusters.forEach(c=>{
    const el = document.createElement('div');
    el.className = 'tm-chip';
    el.textContent = `${c.items.join(' • ')}  (support ${(c.support*100).toFixed(1)}%)`;
    root.appendChild(el);
  });
}

async function loadTimeline(){
  const t = document.getElementById('topic').value.trim();
  if(!t) return;
  const {data} = await fetchJSON(`/api/timeline?topic=${encodeURIComponent(t)}`);
  renderPopularity(data.popularity||[]);
  renderPeaks(data.peaks||[]);
  renderClusters(data.clusters||[]);
}


