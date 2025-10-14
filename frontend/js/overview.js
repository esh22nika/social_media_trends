async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

function createTopPlatformCards(topByPlatform){
  const root = document.getElementById('top-platforms');
  root.innerHTML = '';
  const platforms = Object.keys(topByPlatform || {});
  platforms.forEach(p =>{
    const sec = document.createElement('section');
    sec.className = 'tm-card';
    const title = p.charAt(0).toUpperCase()+p.slice(1);
    sec.innerHTML = `<h3>${title} • Top Trends</h3>`;
    const list = document.createElement('div');
    list.className = 'tm-grid';
    (topByPlatform[p]||[]).forEach(item =>{
      const chip = document.createElement('div');
      chip.className = 'tm-chip';
      chip.innerHTML = `<span>${item.name}</span><span style="color:#94a3b8">${item.engagementPct}%</span><span class="tm-chip ok">+${item.growthRate}%</span>`;
      list.appendChild(chip);
    });
    sec.appendChild(list);
    root.appendChild(sec);
  });
}

function renderSparkline(overview){
  const ctx = document.getElementById('spark');
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const rnd = ()=> labels.map(()=> Math.floor(Math.random()*100)+20);
  const datasets = Object.keys(overview.topByPlatform||{}).slice(0,3).map((p,i)=>({
    label: p,
    data: rnd(),
    borderColor: ['#FF0000','#FF4500','#1DA1F2','#22d3ee','#7c3aed'][i%5],
    borderWidth: 2,
    tension: .3,
    fill:false
  }));
  new Chart(ctx,{type:'line',data:{labels,datasets},options:{plugins:{legend:{labels:{color:'#cbd5e1'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
}

function renderMiniNetwork(preview){
  const container = document.getElementById('mini-network');
  container.innerHTML = '';
  // simple canvas force layout (small preview)
  const width = container.clientWidth || 900;
  const height = container.clientHeight || 260;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const nodes = (preview.nodes||[]).map(n=> ({...n, x: Math.random()*width, y: Math.random()*height, vx:0, vy:0}));
  const edges = preview.edges||[];
  const nodeIndex = Object.fromEntries(nodes.map((n,i)=>[n.id,i]));
  function tick(){
    // simple repulsion
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i], b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y; let d=Math.hypot(dx,dy)||1; const f= (20)/(d*d);
        a.vx += (dx/d)*f; a.vy += (dy/d)*f; b.vx -= (dx/d)*f; b.vy -= (dy/d)*f;
      }
    }
    // spring edges
    edges.forEach(e=>{
      const a=nodes[nodeIndex[e.source]], b=nodes[nodeIndex[e.target]]; if(!a||!b) return;
      const dx=b.x-a.x, dy=b.y-a.y; const d=Math.hypot(dx,dy)||1; const k=0.02; const diff = (d-80)*k;
      const nx=dx/d, ny=dy/d; a.vx += nx*diff; a.vy += ny*diff; b.vx -= nx*diff; b.vy -= ny*diff;
    });
    // integrate
    nodes.forEach(n=>{ n.x += n.vx; n.y += n.vy; n.vx*=0.9; n.vy*=0.9; n.x=Math.max(20,Math.min(width-20,n.x)); n.y=Math.max(20,Math.min(height-20,n.y)); });
    // draw
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle='#243047'; ctx.lineWidth=1; edges.forEach(e=>{ const a=nodes[nodeIndex[e.source]], b=nodes[nodeIndex[e.target]]; if(!a||!b) return; ctx.globalAlpha=Math.min(0.9,0.2+e.weight/10); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();});
    ctx.globalAlpha=1; nodes.forEach(n=>{ ctx.beginPath(); ctx.fillStyle='#22d3ee'; const r=4+Math.min(10,(n.size||1)); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();});
    requestAnimationFrame(tick);
  }
  tick();
}

(async function init(){
  try{
    const {data} = await fetchJSON('/api/overview');
    document.getElementById('kpi-rise').textContent = `${data.globalRisePct>0?'+':''}${data.globalRisePct}%`;
    if(data.emergingPattern){
      const e = data.emergingPattern;
      document.getElementById('emerging').innerHTML = `<div class="tm-row wrap gap-8"><span class="tm-chip">${e.antecedent} → ${e.consequent}</span><span class="tm-chip ok">lift ${e.lift.toFixed(2)}</span><span class="tm-chip">support ${(e.support*100).toFixed(1)}%</span></div>`;
    }
    createTopPlatformCards(data.topByPlatform);
    renderSparkline(data);
    renderMiniNetwork(data.networkPreview||{nodes:[],edges:[]});
  }catch(e){
    console.error(e);
  }
})();


