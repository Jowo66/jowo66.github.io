(function(){
'use strict';
const $=s=>document.querySelector(s);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- clock ---------- */
function tick(){
  const d=new Date();
  $('#clock').textContent=d.toLocaleTimeString('en-GB',{hour12:false});
  $('#date').textContent=d.toLocaleDateString('en-CA');
}
tick();setInterval(tick,1000);

/* ---------- boot ---------- */
(function(){
  const lines=['<b>NEO-EDO OS</b>','mounting /district ........ ok','loading neon ............. ok','tuning rain .............. ok','waking the cabaret ....... ok','waking the dojo .......... ok','welcome, visitor.'];
  const pre=$('#bootText');let i=0;
  const hide=()=>{$('#boot').classList.add('gone');openApp('about');if(innerWidth>760)openApp('map')};
  let done=false;const fin=()=>{if(done)return;done=true;hide()};
  if(reduce){setTimeout(fin,0);return}
  const next=()=>{if(done)return;if(i<lines.length){pre.innerHTML+=lines[i++]+'\n';setTimeout(next,i===1?350:170)}else{pre.innerHTML+='<small>click anywhere to skip</small>';setTimeout(fin,500)}};
  next();
  addEventListener('pointerdown',fin,{once:true});addEventListener('keydown',fin,{once:true});
})();

/* ---------- 3D alley ---------- */
(function(){
  const cv=$('#alley'),c=cv.getContext('2d');
  let W,H,f,mx=0,my=0,smx=0,smy=0,scroll=0;
  const SEG=3,NSEG=16,WALL=2.4,FLOOR=1.3,TOP=-7;
  const KANJI='酒夜龍雨電猫麺薬魚湯宿';
  const NEON=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a'];
  function size(){const s=Math.min(devicePixelRatio||1,1.5)*.8;W=cv.width=Math.floor(innerWidth*s);H=cv.height=Math.floor(innerHeight*s);f=H*.95}
  size();addEventListener('resize',size);
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
  const hash=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  let cx,cy;
  const P=(x,y,z)=>[cx+x*f/z,cy+y*f/z];
  function quad(a,b,c2,d){c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(c2[0],c2[1]);c.lineTo(d[0],d[1]);c.closePath()}
  const rain=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),l:.03+Math.random()*.05,s:.9+Math.random()*.9}));
  function wall(side,id,z1,z2){
    const x=side*WALL,fog=clamp(1-z1/(SEG*NSEG),0,1);
    const h=hash(id*2+(side>0?1:0));
    const tone=Math.floor(10+h*14);
    c.fillStyle=`rgb(${tone+8},${tone},${tone+22})`;
    quad(P(x,TOP,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,TOP,z2));c.fill();
    /* windows */
    const cols=3,rows=7;
    for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){
      const lit=hash(id*31+r*7+k*3+(side>0?5:0));
      if(lit<.45)continue;
      const zz=z1+(k+.25)*(z2-z1)/cols,zw=(z2-z1)/cols*.5,y0=-5.4+r*.62,y1=y0+.36;
      c.fillStyle=lit>.85?'#ff2e88':lit>.7?'#19e3ff':'#ffb347';
      c.globalAlpha=(.25+.55*fog)*(lit>.7?.9:.6);
      quad(P(x,y0,zz),P(x,y1,zz),P(x,y1,zz+zw),P(x,y0,zz+zw));c.fill();
    }
    c.globalAlpha=1;
    /* dark ledge */
    c.fillStyle='rgba(0,0,0,.45)';
    quad(P(x,FLOOR-.35,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,FLOOR-.35,z2));c.fill();
    /* neon sign */
    const sg=hash(id*13+(side>0?9:2));
    if(sg>.5){
      const col=NEON[Math.floor(hash(id*5+side)*NEON.length)],zc=z1+(z2-z1)*.5,sy0=-3.8+hash(id)*1.2,sy1=sy0+1.6,zw=.28;
      const p0=P(x-side*.04,sy0,zc-zw),p1=P(x-side*.04,sy1,zc-zw),p2=P(x-side*.04,sy1,zc+zw),p3=P(x-side*.04,sy0,zc+zw);
      c.fillStyle='#0a0612';quad(p0,p1,p2,p3);c.fill();
      c.strokeStyle=col;c.lineWidth=Math.max(1,f/zc*.03);c.globalAlpha=.35+.65*fog;
      c.shadowColor=col;c.shadowBlur=fog>.4?10:0;quad(p0,p1,p2,p3);c.stroke();c.shadowBlur=0;
      const m=P(x-side*.05,(sy0+sy1)/2,zc),fs=f/zc*.42;
      if(fs>7){c.fillStyle=col;c.font=`900 ${fs}px "Zen Kaku Gothic New",sans-serif`;c.textAlign='center';c.textBaseline='middle';
        c.fillText(KANJI[Math.floor(hash(id*3+side)*KANJI.length)],m[0],m[1])}
      c.globalAlpha=1;
      /* reflection on wet floor */
      c.fillStyle=col;c.globalAlpha=.07+.09*fog;
      quad(P(x,FLOOR,zc-zw),P(x,FLOOR,zc+zw),P(side*.4,FLOOR,zc+zw*2.4),P(side*.4,FLOOR,zc-zw*2.4));c.fill();c.globalAlpha=1;
    }
  }
  function lantern(id,z){
    const y=-2.3+hash(id)*.4;
    const a=P(-WALL,y-.6,z),b=P(WALL,y-.6,z);
    c.strokeStyle='rgba(255,179,71,.35)';c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]);
    c.quadraticCurveTo((a[0]+b[0])/2,a[1]+f/z*.35,b[0],b[1]);c.stroke();
    for(let k=-1;k<=1;k++){
      const p=P(k*1.3,y+Math.abs(k)*.0+.12,z),r=f/z*.17;
      const g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],r*3.2);
      g.addColorStop(0,'rgba(255,120,60,.55)');g.addColorStop(1,'rgba(255,60,60,0)');
      c.fillStyle=g;c.fillRect(p[0]-r*3.2,p[1]-r*3.2,r*6.4,r*6.4);
      c.fillStyle='#e0352b';c.beginPath();c.ellipse(p[0],p[1],r*.7,r,0,0,7);c.fill();
      c.fillStyle='#ffb347';c.fillRect(p[0]-r*.5,p[1]-r*.1,r,r*.2);
    }
  }
  function frame(t){
    smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
    cx=W/2-smx*W*.1;cy=H*.44-smy*H*.05;
    /* sky */
    const sk=c.createLinearGradient(0,0,0,cy+H*.1);
    sk.addColorStop(0,'#0a0612');sk.addColorStop(.7,'#3a0f4a');sk.addColorStop(1,'#ff2e88');
    c.fillStyle=sk;c.fillRect(0,0,W,H);
    const gl=c.createRadialGradient(cx,cy,0,cx,cy,H*.5);gl.addColorStop(0,'rgba(255,200,120,.55)');gl.addColorStop(1,'rgba(255,46,136,0)');
    c.fillStyle=gl;c.fillRect(0,0,W,H);
    /* floor */
    const fl=c.createLinearGradient(0,cy,0,H);fl.addColorStop(0,'#2a0f3a');fl.addColorStop(1,'#07030d');
    c.fillStyle=fl;quad(P(-WALL,FLOOR,1),P(WALL,FLOOR,1),P(WALL,FLOOR,SEG*NSEG),P(-WALL,FLOOR,SEG*NSEG));c.fill();
    /* walls, far to near */
    const base=Math.floor(scroll/SEG),off=scroll-base*SEG;
    for(let k=NSEG;k>=0;k--){
      const z1=Math.max(.8,k*SEG-off),z2=(k+1)*SEG-off;if(z2<=.8)continue;
      const id=base+k;wall(-1,id,z1,z2);wall(1,id,z1,z2);
      if((id&1)===0)lantern(id,z1+SEG*.5);
    }
    /* distance fog */
    const fg=c.createRadialGradient(cx,cy,0,cx,cy,H*.35);fg.addColorStop(0,'rgba(255,140,170,.5)');fg.addColorStop(1,'rgba(255,46,136,0)');
    c.fillStyle=fg;c.fillRect(0,0,W,H);
    /* rain */
    c.strokeStyle='rgba(190,220,255,.35)';c.lineWidth=1;c.beginPath();
    for(const r of rain){const x=r.x*W,y=r.y*H;c.moveTo(x,y);c.lineTo(x-r.l*W*.08,y+r.l*H);
      if(!reduce){r.y+=r.s*.016;r.x-=r.s*.002;if(r.y>1){r.y=-.05;r.x=Math.random()*1.1}}}
    c.stroke();
  }
  let last=0;
  function loop(t){
    const dt=Math.min((t-last)/1000||0,.05);last=t;
    scroll+=dt*.9;frame(t);
    if(!reduce)requestAnimationFrame(loop);
  }
  if(reduce){scroll=2;frame(0)}else requestAnimationFrame(loop);
  addEventListener('resize',()=>{if(reduce)frame(0)});
})();

/* ---------- window manager ---------- */
const apps={
  about:{jp:'我',t:'ABOUT',w:420,x:.03,y:62},
  skills:{jp:'技',t:'SKILLS',w:420},
  map:{jp:'地',t:'DISTRICT MAP',w:null,init:initMap,x:.4,y:80,w:600},
  contact:{jp:'連',t:'CONTACT',w:380},
  cabaret:{jp:'酒',t:'THE RUSTY KOI CABARET',frame:'future.html?embed',cls:'app-win',ar:1.6},
  dojo:{jp:'相',t:'THE DOJO',frame:'sumo.html?embed',cls:'app-win',ar:1.3}
};
const open={};let zTop=100,n=0;
function openApp(id){
  const a=apps[id];if(!a)return;
  if(open[id]){front(open[id]);return}
  const w=document.createElement('div');w.className='win '+(a.cls||'');
  w.innerHTML=`<div class="bar"><span class="jp">${a.jp}</span><span class="t">${a.t}</span><button aria-label="Close">×</button></div><div class="body"></div>`;
  const body=w.querySelector('.body');
  if(a.frame){const ifr=document.createElement('iframe');ifr.className='frame';ifr.src=a.frame;ifr.title=a.t;ifr.loading='lazy';ifr.style.setProperty('--ar',a.ar||1.78);ifr.style.aspectRatio=String(a.ar||1.78);body.appendChild(ifr)}
  else body.appendChild(document.getElementById('t-'+id).content.cloneNode(true));
  if(a.w)w.style.width=a.w+'px';
  document.body.appendChild(w);
  const k=n++%5;
  w.style.left=clamp(innerWidth*(a.x??.08)+(a.x==null?k*34:0),8,Math.max(8,innerWidth-w.offsetWidth-8))+'px';
  w.style.top=clamp((a.y??60+k*30),48,Math.max(48,innerHeight-w.offsetHeight-90))+'px';
  open[id]=w;front(w);syncDock();
  w.addEventListener('pointerdown',()=>front(w));
  w.querySelector('button').onclick=()=>{w.classList.add('closing');setTimeout(()=>{w.remove();delete open[id];syncDock()},150)};
  drag(w,w.querySelector('.bar'));
  if(a.init)a.init(w);
}
function front(w){document.querySelectorAll('.win').forEach(x=>x.classList.remove('front'));w.style.zIndex=++zTop;w.classList.add('front')}
function syncDock(){document.querySelectorAll('.app').forEach(b=>b.classList.toggle('on',!!open[b.dataset.app]))}
function drag(w,h){
  h.addEventListener('pointerdown',e=>{
    if(e.target.tagName==='BUTTON'||innerWidth<=760)return;
    const r=w.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    h.setPointerCapture(e.pointerId);
    const mv=ev=>{w.style.left=clamp(ev.clientX-dx,-r.width+80,innerWidth-80)+'px';w.style.top=clamp(ev.clientY-dy,40,innerHeight-100)+'px'};
    const up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up)};
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);
  });
}
document.querySelectorAll('.app').forEach(b=>b.addEventListener('click',()=>openApp(b.dataset.app)));
addEventListener('keydown',e=>{if(e.key==='Escape'){const ws=[...document.querySelectorAll('.win')];const t=ws.sort((a,b)=>b.style.zIndex-a.style.zIndex)[0];if(t)t.querySelector('button').click()}});

/* ---------- isometric pixel district ---------- */
function initMap(win){
  const cv=win.querySelector('#map'),c=cv.getContext('2d'),cap=win.querySelector('#cap');
  const TW=46,TH=23,OX=180,OY=50,N=7;
  const iso=(gx,gy,z=0)=>[OX+(gx-gy)*TW/2,OY+(gx+gy)*TH/2-z];
  const B=[
    {n:'The Rusty Koi Cabaret',d:'OPEN: a chrome singer, five tables, and something behind the curtains.',gx:1,gy:1,w:2,dd:2,h:49,col:'#7a1f4d',app:'cabaret',glow:'#ff2e88',sign:'酒'},
    {n:'The Dojo',d:'OPEN: endless sumo bouts. Win streaks tilt the odds, but never lock them.',gx:4,gy:1,w:2,dd:2,h:38,col:'#8a3a22',app:'dojo',glow:'#ffb347',sign:'相'},
    {n:'About Tower',d:'OPEN: who I am.',gx:1,gy:4,w:1,dd:2,h:67,col:'#243a6a',app:'about',glow:'#19e3ff',sign:'我'},
    {n:'Lot 01',d:'Reserved for a future project.',gx:3,gy:4,w:1,dd:1,h:17,col:'#2c2440',lot:1},
    {n:'Lot 02',d:'Reserved for a future project.',gx:5,gy:4,w:1,dd:2,h:23,col:'#2c2440',lot:1},
    {n:'Lot 03',d:'Reserved for a future project.',gx:3,gy:5,w:1,dd:1,h:14,col:'#2c2440',lot:1}
  ];
  const cars=[{p:0,s:.5,c:'#ff2e88'},{p:.5,s:.35,c:'#19e3ff'}];
  let hover=null,t=0;
  const poly=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}};
  const shade=(hex,k)=>{const v=parseInt(hex.slice(1),16);const r=clamp((v>>16)*k,0,255)|0,g=clamp(((v>>8)&255)*k,0,255)|0,b=clamp((v&255)*k,0,255)|0;return`rgb(${r},${g},${b})`};
  function shapes(b){
    const x0=b.gx,y0=b.gy,x1=b.gx+b.w,y1=b.gy+b.dd,h=b.h;
    return{top:[iso(x0,y0,h),iso(x1,y0,h),iso(x1,y1,h),iso(x0,y1,h)],
      left:[iso(x0,y1,h),iso(x1,y1,h),iso(x1,y1,0),iso(x0,y1,0)],
      right:[iso(x1,y0,h),iso(x1,y1,h),iso(x1,y1,0),iso(x1,y0,0)]};
  }
  function inPoly(p,pts){let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ins=!ins}return ins}
  function draw(){
    c.fillStyle='#0b0716';c.fillRect(0,0,360,260);
    /* tiles */
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const road=(x===3||y===3);
      poly([iso(x,y),iso(x+1,y),iso(x+1,y+1),iso(x,y+1)],road?'#1b1530':((x+y)&1?'#171027':'#1d1530'),null);
    }
    /* road dashes */
    c.fillStyle='#ffb347';for(let i=0;i<N;i++){const a=iso(3.5,i+.45),b=iso(i+.45,3.5);c.fillRect(a[0]-1,a[1]-1,2,1);c.fillRect(b[0]-1,b[1]-1,2,1)}
    /* sort by depth */
    const list=B.slice().sort((a,b)=>(a.gx+a.gy+a.w+a.dd)-(b.gx+b.gy+b.w+b.dd));
    /* cars before buildings that they pass behind is fine at this scale */
    cars.forEach(k=>{const q=((k.p+t*k.s*.06)%1);const along=q*N;const p=iso(3.5,along);const l=Math.floor(along*3)&0;
      c.fillStyle='#000';c.fillRect(p[0]-3,p[1]-1,7,3);c.fillStyle=k.c;c.fillRect(p[0]-3,p[1]-3,6,3);c.fillStyle='#fff';c.fillRect(p[0]+2,p[1]-3,1,1)});
    list.forEach(b=>{
      const s=shapes(b),hv=hover===b;
      const lift=hv?-4:0;
      const mv=pts=>pts.map(p=>[p[0],p[1]+lift]);
      poly(mv(s.left),shade(b.col,.75),'#000');poly(mv(s.right),shade(b.col,.5),'#000');poly(mv(s.top),shade(b.col,hv?1.5:1.15),'#000');
      /* windows */
      if(!b.lot){
        for(let r=0;r<Math.floor(b.h/13)-0;r++)for(let k=0;k<b.dd*2;k++){
          const on=((r*7+k*3+Math.floor(t*.4+r))%5)>1;const gx=b.gx+b.w,gy=b.gy+(k+.3)/2,z=7+r*13;
          const p=iso(gx,gy,z);c.fillStyle=on?b.glow:'#140c22';c.fillRect(p[0]-1,p[1]+lift,2,3);
        }
        const tp=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h+13);
        const blink=(Math.floor(t*1.5)%7)!==0;
        c.fillStyle=blink?b.glow:'#333';c.font='bold 10px "Zen Kaku Gothic New",sans-serif';c.textAlign='center';c.fillText(b.sign,tp[0],tp[1]+lift);
        c.fillStyle=b.glow;c.globalAlpha=.25;c.fillRect(tp[0]-5,tp[1]+3+lift,10,1);c.globalAlpha=1;
      }else{
        c.strokeStyle='#ffb347';c.setLineDash([2,2]);poly(mv(s.top),null,'#ffb347');c.setLineDash([]);
      }
      b._s=s;
    });
    if(hover&&hover._s){
      const all=[].concat(hover._s.top,hover._s.left,hover._s.right);
      const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]-4);
      const pad=4+Math.sin(t*6)*1.2,x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-pad,y1=Math.max(...ys)+pad,L=7;
      c.strokeStyle='#19e3ff';c.lineWidth=1;c.beginPath();
      [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(q=>{c.moveTo(q[0]+q[2]*L,q[1]);c.lineTo(q[0],q[1]);c.lineTo(q[0],q[1]+q[3]*L)});c.stroke();
      c.globalAlpha=.25;c.fillStyle='#19e3ff';const sy=y0+((t*40)%(y1-y0));c.fillRect(x0,sy,x1-x0,1);c.globalAlpha=1;
      c.fillStyle='#19e3ff';c.font='6px "Share Tech Mono",monospace';c.textAlign='left';
      c.fillText('LOCK '+(hover.app?'// OPEN':'// VACANT'),x0,y0-3);
    }
    if(hover){c.fillStyle='rgba(255,255,255,.9)';c.font='8px "Share Tech Mono",monospace';c.textAlign='center';const p=iso(hover.gx+hover.w/2,hover.gy+hover.dd/2,hover.h+30);
      c.fillStyle='#000';c.fillRect(p[0]-hover.n.length*2.4-3,p[1]-7,hover.n.length*4.8+6,10);c.fillStyle='#ffb347';c.fillText(hover.n,p[0],p[1])}
  }
  function pick(e){
    const r=cv.getBoundingClientRect(),p=[(e.clientX-r.left)*360/r.width,(e.clientY-r.top)*260/r.height];
    const order=B.slice().sort((a,b)=>(b.gx+b.gy+b.w+b.dd)-(a.gx+a.gy+a.w+a.dd));
    return order.find(b=>b._s&&(inPoly(p,b._s.top)||inPoly(p,b._s.left)||inPoly(p,b._s.right)))||null;
  }
  cv.addEventListener('pointermove',e=>{const b=pick(e);if(b!==hover){hover=b;cap.textContent=b?b.n+': '+b.d:'Hover a building. The lit ones are open; empty lots are reserved for future projects.';cv.style.cursor=b&&b.app?'pointer':'crosshair'}});
  cv.addEventListener('pointerleave',()=>{hover=null});
  cv.addEventListener('click',e=>{const b=pick(e);if(b&&b.app)openApp(b.app)});
  let raf;function loop(){t+=.016;draw();if(!document.body.contains(win)){cancelAnimationFrame(raf);return}if(!reduce)raf=requestAnimationFrame(loop)}
  draw();if(!reduce)loop();
}

/* ---------- system readout ---------- */
(function(){
  const t0=performance.now(),hex=$('#hex'),up=$('#up'),wn=$('#wn'),cur=$('#cur'),tg=$('#tg');
  const rows=[];const rh=()=>Array.from({length:6},()=>Math.floor(Math.random()*65535).toString(16).padStart(4,'0')).join(' ');
  for(let i=0;i<7;i++)rows.push(rh());
  addEventListener('pointermove',e=>{cur.textContent=String(Math.round(e.clientX)).padStart(4,'0')+','+String(Math.round(e.clientY)).padStart(4,'0')});
  setInterval(()=>{
    const s=Math.floor((performance.now()-t0)/1000);
    up.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    wn.textContent=Object.keys(open).length;
    tg.textContent=(Object.keys(open).pop()||'none').toUpperCase();
    if(!reduce){rows.shift();rows.push(rh())}
    hex.textContent=rows.join('\n');
  },600);
})();
window.openApp=openApp;
})();
