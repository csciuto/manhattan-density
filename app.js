// Draws the oblique 3D island on a canvas. Data: tracts.js; bands and findings: density.js.
const T=enrich(TRACTS);
const {same,up,down:dn,max20,pw10,pw20}=findings(T);
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmt=n=>Math.round(n).toLocaleString('en-US');
document.getElementById('facts').innerHTML=[
 [`${same} / 310`,'tracts stay in the same density band from 2010 to 2020.'],
 [`${up} up · ${dn} down`,'tracts that cross a band line. Most of the movers sit near a boundary and nudge across it.'],
 [`${fmt(max20.d20)}`,`persons per hectare in the densest tract (${max20.id}, ${max20.nta}). In 1910, parts of the Lower East Side ran 1,200–2,400 (Angel & Lamson-Hall).`],
 [`${fmt(pw10)} → ${fmt(pw20)}`,'population-weighted density, p/ha: the density the typical resident lives at. Up '+((pw20/pw10-1)*100).toFixed(1)+'%.']
].map(f=>`<div class="fact"><div class="n">${f[0]}</div><p>${f[1]}</p></div>`).join('');

const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
let W=0,H=0,DPR=1,az=95*Math.PI/180,EL=34*Math.PI/180,mode='20',scale=1,ox=0,oy=0,hScale=1,colors={};
function readColors(){[...BANDS,...CH].forEach(b=>colors[b[2]]=css(b[2]));colors.ground=css('--ground');colors.fg=css('--fg');colors.muted=css('--muted');colors.bg=css('--bg');}
function size(){
  const w=stage.clientWidth; W=w; H=Math.round(Math.max(340,Math.min(w*0.62,720)));
  DPR=Math.min(window.devicePixelRatio||1,2); cv.width=W*DPR; cv.height=H*DPR; cv.style.height=H+'px'; fit(); draw();
}
const rot=(x,y)=>[x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az)];
function fit(){
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  T.forEach(t=>t.rings.forEach(r=>r.forEach(p=>{const[X,Y]=rot(p[0],p[1]);x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);})));
  const sy=Math.sin(EL);
  hScale=H*0.30/2400; // px per p/ha at full: the 1910 ceiling uses 30% of the frame
  scale=Math.min((W-24)/(x1-x0),(H*0.66)/((y1-y0)*sy));
  ox=W/2-(x0+x1)/2*scale; oy=H*0.60+(y0+y1)/2*scale*sy;
}
const P=(X,Y,z)=>[ox+X*scale, oy-Y*scale*Math.sin(EL)-z*hScale*Math.cos(EL)];
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;return `rgb(${r*k|0},${g*k|0},${b*k|0})`;}
function colorOf(t){ if(mode==='ch') return colors[CH.find(c=>t.dd>=c[0]&&t.dd<c[1])[2]]; const d=mode==='10'?t.d10:t.d20; return colors[BANDS[band(d)][2]]; }
let order=[],tops=[];
function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
  const items=T.map(t=>{const[X,Y]=rot(t.cx,t.cy);return{t,Y}}).sort((a,b)=>b.Y-a.Y);
  tops=[];
  // ground pass
  ctx.fillStyle=colors.ground; ctx.strokeStyle=colors.ground; ctx.lineWidth=1;
  items.forEach(({t})=>t.rings.forEach(r=>{ctx.beginPath();r.forEach((p,i)=>{const[X,Y]=rot(p[0],p[1]);const[s,u]=P(X,Y,0);i?ctx.lineTo(s,u):ctx.moveTo(s,u)});ctx.closePath();ctx.fill();ctx.stroke();}));
  items.forEach(({t})=>{
    const col=colorOf(t), z=Math.max(t.h,6);
    t.rings.forEach(r=>{
      const R=r.map(p=>rot(p[0],p[1]));
      const walls=[];
      for(let i=0;i<R.length;i++){const a=R[i],b=R[(i+1)%R.length];walls.push({a,b,m:(a[1]+b[1])/2});}
      walls.sort((p,q)=>q.m-p.m);
      walls.forEach(({a,b})=>{
        const nx=b[1]-a[1],ny=-(b[0]-a[0]);const L=Math.hypot(nx,ny)||1;
        const k=0.55+0.3*Math.abs((nx*0.8-ny*0.6)/L);
        const A0=P(a[0],a[1],0),B0=P(b[0],b[1],0),A1=P(a[0],a[1],z),B1=P(b[0],b[1],z);
        ctx.beginPath();ctx.moveTo(...A0);ctx.lineTo(...B0);ctx.lineTo(...B1);ctx.lineTo(...A1);ctx.closePath();
        ctx.fillStyle=shade(col,k);ctx.fill();ctx.strokeStyle=shade(col,k);ctx.lineWidth=.6;ctx.stroke();
      });
      const top=R.map(p=>P(p[0],p[1],z));
      ctx.beginPath();top.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=shade(col,0.7);ctx.lineWidth=.5;ctx.stroke();
      tops.push({t,poly:top});
    });
  });
  drawRuler();
}
function drawRuler(){
  // vertical scale stick in the empty upper-right, same height scale as the bars
  const x=W-92, base=H*0.40, cz=Math.cos(EL);
  ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='right';ctx.textBaseline='middle';
  if(W<520) return;
  BANDS.forEach((b,i)=>{const y0=base-b[0]*hScale*cz,y1=base-Math.min(b[1],2400)*hScale*cz;ctx.fillStyle=colors[b[2]];ctx.fillRect(x,y1,10,y0-y1);});
  ctx.fillStyle=colors.muted;[0,300,600,1200,2400].forEach(v=>{const y=base-v*hScale*cz;ctx.fillRect(x-4,y,4,1);ctx.fillText(fmt(v),x-7,y);});
  ctx.textAlign='center';ctx.fillText('p/ha',x+5,base+14);
  const y=base-max20.d20*hScale*cz;ctx.fillStyle=colors.fg;ctx.fillRect(x-4,y,18,1.5);ctx.textAlign='left';ctx.fillText('← 2020 max',x+16,y);
}
function legend(){
  const L=mode==='ch'?CH:BANDS;
  document.getElementById('legend').innerHTML=`<div class="t">${mode==='ch'?'Change, persons per hectare':'Residential density<br>(persons per hectare)'}</div>`+L.map(b=>`<div class="r"><i style="background:var(${b[2]})"></i>${b[3]}</div>`).join('');
  document.getElementById('yr').textContent=mode==='ch'?'2010→2020':(mode==='10'?'2010':'2020');
}
// tween heights
let anim=null;
function setMode(m){
  mode=m; ['10','20','ch'].forEach(k=>document.getElementById('v'+(k==='ch'?'ch':k)).setAttribute('aria-pressed',k===m));
  legend(); const from=T.map(t=>t.h), to=T.map(t=>m==='10'?t.d10:t.d20);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, dur=reduce?0:700, t0=performance.now();
  cancelAnimationFrame(anim);
  const step=now=>{const k=dur?Math.min(1,(now-t0)/dur):1,e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;T.forEach((t,i)=>t.h=from[i]+(to[i]-from[i])*e);draw();if(k<1)anim=requestAnimationFrame(step);};
  anim=requestAnimationFrame(step);
}
document.getElementById('v10').onclick=()=>setMode('10');
document.getElementById('v20').onclick=()=>setMode('20');
document.getElementById('vch').onclick=()=>setMode('ch');
// drag to rotate
let dragX=null;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;dragX=e.clientX;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointerup',()=>{dragX=null;cv.classList.remove('drag')});
const tip=document.getElementById('tip');
function inside(pt,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[c2,d]=poly[j];if((b>pt[1])!==(d>pt[1])&&pt[0]<(c2-a)*(pt[1]-b)/(d-b)+a)c=!c;}return c;}
cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect(),pt=[e.clientX-r.left,e.clientY-r.top];
  if(dragX!==null){az+=(e.clientX-dragX)*0.006;dragX=e.clientX;fit();draw();tip.hidden=true;return;}
  let hit=null;for(let i=tops.length-1;i>=0;i--){if(inside(pt,tops[i].poly)){hit=tops[i].t;break;}}
  if(!hit){tip.hidden=true;return;}
  tip.innerHTML=`<b>Tract ${hit.id}</b><span>${hit.nta}</span><table><tr><td></td><td>2010</td><td>2020</td></tr><tr><td>Pop</td><td>${fmt(hit.p10)}</td><td>${fmt(hit.p20)}</td></tr><tr><td>p/ha</td><td>${fmt(hit.d10)}</td><td>${fmt(hit.d20)}</td></tr></table>`;
  tip.hidden=false; const sr=stage.getBoundingClientRect();
  let lx=e.clientX-sr.left+14, ly=e.clientY-sr.top+14; if(lx+250>sr.width) lx-=270; tip.style.left=lx+'px'; tip.style.top=ly+'px';
});
cv.addEventListener('pointerleave',()=>tip.hidden=true);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{readColors();draw();});
new MutationObserver(()=>{readColors();draw();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
readColors(); legend(); new ResizeObserver(size).observe(stage); size();
document.fonts&&document.fonts.ready.then(draw);
