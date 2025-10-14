async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

function drawGraph(data){
  const container = document.getElementById('graph');
  container.innerHTML = '';
  const width = container.clientWidth || 1000;
  const height = container.clientHeight || 360;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const nodes = (data.nodes||[]).map(n=> ({...n, x: Math.random()*width, y: Math.random()*height, vx:0, vy:0}));
  const edges = data.edges||[];
  const idx = Object.fromEntries(nodes.map((n,i)=>[n.id,i]));

  canvas.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let nearest=null, dmin=30;
    nodes.forEach(n=>{ const d=Math.hypot(n.x-mx,n.y-my); if(d<dmin){ dmin=d; nearest=n; }});
    canvas.title = nearest? `${nearest.id}\nposts: ${nearest.size}`: '';
  });

  function tick(){
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i], b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y; let d=Math.hypot(dx,dy)||1; const f= (40)/(d*d);
        a.vx += (dx/d)*f; a.vy += (dy/d)*f; b.vx -= (dx/d)*f; b.vy -= (dy/d)*f;
      }
    }
    edges.forEach(e=>{
      const a=nodes[idx[e.source]], b=nodes[idx[e.target]]; if(!a||!b) return;
      const dx=b.x-a.x, dy=b.y-a.y; const d=Math.hypot(dx,dy)||1; const k=0.02; const diff=(d-120)*k;
      const nx=dx/d, ny=dy/d; a.vx += nx*diff; a.vy += ny*diff; b.vx -= nx*diff; b.vy -= ny*diff;
    });
    nodes.forEach(n=>{ n.x+=n.vx; n.y+=n.vy; n.vx*=0.9; n.vy*=0.9; n.x=Math.max(20,Math.min(width-20,n.x)); n.y=Math.max(20,Math.min(height-20,n.y)); });
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle="#243047"; ctx.lineWidth=1; edges.forEach(e=>{ const a=nodes[idx[e.source]], b=nodes[idx[e.target]]; if(!a||!b) return; ctx.globalAlpha=Math.min(0.9,0.1+e.weight/15); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });
    ctx.globalAlpha=1; nodes.forEach(n=>{ ctx.beginPath(); ctx.fillStyle='#7c3aed'; const r=4+Math.min(12,(n.size||1)); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill(); });
    requestAnimationFrame(tick);
  }
  tick();
}

async function loadGraph(){
  const p = document.getElementById('platform').value;
  const s = document.getElementById('start').value;
  const e = document.getElementById('end').value;
  const qs = new URLSearchParams();
  if(p && p!=='all') qs.set('platform', p);
  if(s) qs.set('start', s);
  if(e) qs.set('end', e);
  const {data} = await fetchJSON(`/api/network?${qs.toString()}`);
  drawGraph(data);
}

loadGraph();


