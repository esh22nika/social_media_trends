let freqChart, sentChart;

async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

function ensureCharts(timeseries, sentiment){
  const fctx = document.getElementById('freqChart');
  const labels = timeseries.map(d=>d.date);
  const data = timeseries.map(d=>d.count);
  if(freqChart) freqChart.destroy();
  freqChart = new Chart(fctx,{type:'line',data:{labels,datasets:[{label:'Mentions',data,borderColor:'#22d3ee',tension:.3}]},options:{plugins:{legend:{labels:{color:'#cbd5e1'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});

  const sctx = document.getElementById('sentChart');
  if(sentChart) sentChart.destroy();
  sentChart = new Chart(sctx,{type:'doughnut',data:{labels:['Positive','Neutral','Negative'],datasets:[{data:[sentiment.positive||0,sentiment.neutral||0,sentiment.negative||0],backgroundColor:['#10b981','#64748b','#ef4444']}]},options:{plugins:{legend:{labels:{color:'#cbd5e1'}}}}});
}

function renderRelated(tags){
  const root = document.getElementById('related');
  root.innerHTML='';
  tags.forEach(t=>{
    const b = document.createElement('button');
    b.className='tm-chip';
    b.textContent = `${t.tag} (${t.count})`;
    b.onclick = ()=>{
      document.getElementById('q').value = t.tag;
      search();
    };
    root.appendChild(b);
  });
}

function renderSamples(items){
  const tb = document.getElementById('samples');
  tb.innerHTML = '';
  items.forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.platform}</td><td><a href="${it.url}" target="_blank" rel="noreferrer">${it.title||''}</a></td><td>${Math.round(it.engagement)}</td>`;
    tb.appendChild(tr);
  });
}

async function search(){
  const q = document.getElementById('q').value.trim();
  if(!q) return;
  const {data} = await fetchJSON(`/api/trend/metrics?q=${encodeURIComponent(q)}`);
  ensureCharts(data.timeseries||[], data.sentiment||{});
  renderRelated(data.relatedTags||[]);
  renderSamples(data.samples||[]);
}

// optional: search on Enter
document.getElementById('q').addEventListener('keydown', (e)=>{ if(e.key==='Enter') search(); });


