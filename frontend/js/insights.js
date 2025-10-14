let heatChart, matrixChart;

async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

function renderTop(terms){
  const tb = document.getElementById('top');
  tb.innerHTML='';
  terms.forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${t.term}</td><td>${t.count}</td>`;
    tb.appendChild(tr);
  })
}

function renderHeatmap(heatmap){
  const ctx = document.getElementById('heat');
  const platforms = Object.keys(heatmap||{});
  const labels = Array.from(new Set(platforms.flatMap(p=> (heatmap[p]||[]).map(x=>x.week)))).sort();
  const datasets = platforms.map((p,i)=>({
    label:p,
    data: labels.map(l=> (heatmap[p]||[]).find(x=>x.week===l)?.engagement || 0),
    borderColor:['#FF0000','#FF4500','#22d3ee','#7c3aed','#10b981'][i%5],
    tension:.3
  }));
  if(heatChart) heatChart.destroy();
  heatChart = new Chart(ctx,{type:'line',data:{labels,datasets},options:{plugins:{legend:{labels:{color:'#cbd5e1'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
}

function renderMatrix(labels, matrix){
  const ctx = document.getElementById('matrix');
  if(matrixChart) matrixChart.destroy();
  matrixChart = new Chart(ctx,{type:'bar',data:{labels,datasets: matrix.map((row,i)=>({label: labels[i],data: row, backgroundColor: 'rgba(124,58,237,0.35)'}))},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
}

(async function init(){
  const {data} = await fetchJSON('/api/insights');
  renderTop(data.topTerms||[]);
  document.getElementById('density').textContent = (data.patternDensity||0).toFixed(2);
  renderHeatmap(data.heatmap||{});
  renderMatrix(data.matrixLabels||[], data.cooccurrenceMatrix||[]);
})();


