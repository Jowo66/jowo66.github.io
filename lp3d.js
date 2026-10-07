/* lp3d.js: a tiny flat-shaded low-poly engine for the 2D canvas (no libraries).
   World: x right, y DOWN, z forward. Models are lists of boxes ("parts") with y UP from the feet. */
(function(g){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex=h=>{const v=parseInt(h.slice(1),16);return[v>>16,(v>>8)&255,v&255]};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
const FACES=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];

/* ---------- model builders ---------- */
/* part: p=[x,y,z] bottom-centre, s=[w,h,d], c colour, tp top taper, e emissive, sw swing amp, ph phase,
   ak 'L'|'R' arm key (poseable; any key name works), pk+pv parent joint (child limb: elbow/knee), sp spin, bn bounce amplitude, ya yaw offset */
function human(o,dz){
  dz=dz||0;const L=[];
  const pant=o.pant||'#15101f',coat=o.coat||'#1a1f3a',skin=o.skin||'#c98f6b',hair=o.hair||'#0d0a14',lg=o.legW||.16;
  L.push({p:[-.11,0,dz],s:[lg,.82,.18],c:pant,sw:o.legSw||.55,ph:0,tp:o.legTp});
  L.push({p:[.11,0,dz],s:[lg,.82,.18],c:pant,sw:o.legSw||.55,ph:Math.PI,tp:o.legTp});
  L.push({p:[0,.78,dz],s:[.46,.72,.26],c:coat,tp:.88});
  if(o.long)L.push({p:[0,.3,dz],s:[.5,.62,.3],c:coat,tp:.82});
  const as=o.armSw||.5;
  L.push({p:[-.3,.76,dz],s:[.12,.72,.14],c:o.armL||coat,sw:as,ph:Math.PI,ak:'L',e:!!o.armLe});
  L.push({p:[.3,.76,dz],s:[.12,.72,.14],c:o.armR||coat,sw:as,ph:0,ak:'R',e:!!o.armRe});
  L.push({p:[0,1.5,dz],s:[.22,.26,.22],c:skin,tp:.82});
  if(o.hat==='fedora'){L.push({p:[0,1.72,dz],s:[.44,.04,.44],c:o.hatC||'#3a3028'});L.push({p:[0,1.74,dz],s:[.26,.15,.26],c:o.hatC||'#3a3028',tp:.85})}
  else if(o.hat==='cap'){L.push({p:[0,1.72,dz],s:[.25,.1,.25],c:o.hatC||'#d6246e'});L.push({p:[0,1.72,dz+.16],s:[.22,.03,.14],c:o.hatC||'#d6246e'})}
  else if(o.hat==='wide'){L.push({p:[0,1.72,dz],s:[.52,.04,.52],c:o.hatC||'#222'});L.push({p:[0,1.74,dz],s:[.3,.16,.3],c:o.hatC||'#222',tp:.8})}
  else L.push({p:[0,1.74,dz],s:[.25,.09,.25],c:hair,tp:.9});
  return L;
}
/* a person on a chair, facing +z */
function seated(o){
  const L=[];const pant=o.pant||'#15101f',coat=o.coat||'#1a1f3a',skin=o.skin||'#c98f6b',hair=o.hair||'#0d0a14';
  [-.11,.11].forEach(x=>{L.push({p:[x,.5,.27],s:[.16,.16,.54],c:pant});L.push({p:[x,0,.52],s:[.15,.5,.16],c:pant})});
  L.push({p:[0,.5,0],s:[.48,.72,.27],c:coat,tp:.88});
  L.push({p:[-.3,.5,0],s:[.12,.72,.14],c:coat,ak:'L'});
  L.push({p:[.3,.5,0],s:[.12,.72,.14],c:coat,ak:'R'});
  L.push({p:[0,1.24,0],s:[.22,.26,.22],c:skin,tp:.82});
  const hs=o.hs||'short';
  if(hs==='mohawk')L.push({p:[0,1.5,0],s:[.07,.2,.26],c:hair});
  else if(hs==='bun'){L.push({p:[0,1.48,0],s:[.25,.09,.25],c:hair,tp:.9});L.push({p:[0,1.56,-.04],s:[.1,.1,.1],c:hair})}
  else if(hs==='long'){L.push({p:[0,1.48,0],s:[.26,.09,.26],c:hair,tp:.9});L.push({p:[0,.82,-.1],s:[.24,.68,.08],c:hair})}
  else if(hs==='hood'){L.push({p:[0,1.2,-.02],s:[.3,.34,.28],c:coat,tp:.8})}
  else L.push({p:[0,1.48,0],s:[.25,.09,.25],c:hair,tp:.9});
  if(o.visor)L.push({p:[0,1.34,.11],s:[.21,.06,.04],c:o.acc||'#19e3ff',e:true});
  return L;
}
const M={};
M.umbrella=()=>{const L=human({coat:'#202a52',long:true,hair:'#15101f'});
  L.push({p:[.3,.8,0],s:[.03,.95,.03],c:'#8a8a99'});L.push({p:[.3,1.75,0],s:[1.2,.26,1.2],c:'#d6246e',tp:.1});
  L.push({p:[.3,1.74,0],s:[1.24,.03,1.24],c:'#ff7ab6',e:true});return{parts:L,sp:[1.1,1.9],h:2.1,bub:['…','雨','Rain.','Дождь','비']}};
M.courier=()=>{const L=human({coat:'#0e1d2a',armRe:true,armR:'#19e3ff',pant:'#0a0a12',hair:'#ff2e88'});
  L.push({p:[0,1.55,.11],s:[.2,.07,.05],c:'#19e3ff',e:true});L.push({p:[0,.9,-.19],s:[.36,.5,.16],c:'#222338'});
  L.push({p:[0,1.2,-.28],s:[.3,.05,.02],c:'#ffb347',e:true});return{parts:L,sp:[1.6,2.4],h:1.9,bub:['配達!','Move!','Быстро!','빨리!']}};
M.kimono=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.55,1.1,.42],c:'#7d1330',tp:.55,sw:.04,ph:0});L.push({p:[0,.85,0],s:[.52,.2,.42],c:'#ffb347',e:true});
  L.push({p:[0,1.3,0],s:[.38,.18,.28],c:'#7d1330',tp:.7});
  L.push({p:[0,1.42,0],s:[.2,.25,.2],c:'#ece8f4',tp:.85});L.push({p:[0,1.65,0],s:[.26,.16,.26],c:'#0d0a14',tp:.7});
  L.push({p:[0,1.5,.1],s:[.1,.03,.02],c:'#19e3ff',e:true});
  L.push({p:[.34,.75,0],s:[.025,.9,.025],c:'#6a5a4a'});L.push({p:[.34,1.6,0],s:[1.0,.22,1.0],c:'#e0352b',tp:.08});
  return{parts:L,sp:[.5,.9],h:2.0,bub:['あら','Ara?','Oh…']}};
M.dog=()=>{const L=[];
  L.push({p:[0,.36,0],s:[.3,.26,.74],c:'#6b7390',tp:.9});L.push({p:[0,.46,.45],s:[.2,.2,.26],c:'#4b516a',tp:.8});
  L.push({p:[0,.55,.58],s:[.12,.05,.03],c:'#ff2a2a',e:true});
  [[-.1,.28,0],[.1,.28,Math.PI],[-.1,-.28,Math.PI],[.1,-.28,0]].forEach(q=>L.push({p:[q[0],0,q[1]],s:[.07,.4,.07],c:'#2a2d3d',sw:.7,ph:q[2]}));
  L.push({p:[0,.6,-.4],s:[.02,.34,.02],c:'#19e3ff',e:true});return{parts:L,sp:[1.5,2.4],h:.9,bub:['WOOF.EXE','ワン','ГАВ','멍']}};
M.drone=()=>{const L=[];
  L.push({p:[0,0,0],s:[.42,.16,.42],c:'#30344a',tp:.6});L.push({p:[0,-.04,0],s:[.14,.05,.14],c:'#ffb347',e:true});
  [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(q=>{L.push({p:[q[0],.13,q[1]],s:[.3,.02,.07],c:'#99aadd',sp:1});L.push({p:[q[0]*.5,.05,q[1]*.5],s:[.05,.05,.05],c:'#222'})});
  return{parts:L,sp:[.8,1.5],h:.3,fly:true,bub:['BZZT','ビビ','ЖЖЖ']}};
M.ramen=()=>{const L=[];
  L.push({p:[0,.4,0],s:[.95,.55,.6],c:'#5a3a22'});L.push({p:[0,.95,0],s:[1.1,.3,.75],c:'#20161a',tp:.7});
  L.push({p:[.58,.85,0],s:[.2,.3,.2],c:'#ff3a2a',e:true});L.push({p:[-.58,.85,0],s:[.2,.3,.2],c:'#ffb347',e:true});
  L.push({p:[-.5,0,0],s:[.06,.38,.38],c:'#15101a'});L.push({p:[.5,0,0],s:[.06,.38,.38],c:'#15101a'});
  L.push({p:[0,.7,.31],s:[.7,.1,.02],c:'#19e3ff',e:true});
  return{parts:L.concat(human({coat:'#e8e4ee',pant:'#222',hair:'#e8e4ee'},-.75)),sp:[.3,.5],h:2.0,bub:['ラーメン!','Ramen!','Рамен!','라멘!','ราเมน!','Nri ọhụrụ!']}};
M.dealer=()=>{const L=human({coat:'#2a2030',long:true,hat:'wide',hatC:'#17121d',armR:'#ff2a3a',armRe:true,hair:'#111'});
  L.push({p:[0,.95,.14],s:[.3,.4,.02],c:'#ff2e88',e:true});L.push({p:[0,1.52,.12],s:[.2,.05,.03],c:'#ff2a3a',e:true});
  L.push({p:[-.14,.55,.15],s:[.06,.06,.02],c:'#19e3ff',e:true});L.push({p:[.0,.55,.15],s:[.06,.06,.02],c:'#ffb347',e:true});
  return{parts:L,sp:[0,0],h:1.9,stat:true,bub:['Psst…','チップ?','Чипы?','칩 팔아요','شريحة؟','Chips?']}};
M.preacher=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.6,1.3,.4],c:'#d8d0c0',tp:.6});L.push({p:[0,1.3,0],s:[.46,.2,.3],c:'#d8d0c0',tp:.8});
  L.push({p:[-.34,.9,0],s:[.12,.55,.14],c:'#d8d0c0',ak:'L'});L.push({p:[.34,.9,0],s:[.12,.55,.14],c:'#d8d0c0',ak:'R'});
  L.push({p:[0,1.45,0],s:[.22,.26,.22],c:'#b88a6a',tp:.82});L.push({p:[0,1.62,0],s:[.28,.1,.28],c:'#d8d0c0',tp:.8});
  L.push({p:[.4,.2,.2],s:[.04,1.7,.04],c:'#6a5a4a'});L.push({p:[.4,1.5,.2],s:[.7,.5,.04],c:'#e8e4ee'});
  L.push({p:[.4,1.62,.23],s:[.55,.07,.02],c:'#ff2a2a',e:true});L.push({p:[.4,1.5,.23],s:[.4,.05,.02],c:'#ff2a2a',e:true});
  return{parts:L,sp:[0,0],h:2.1,stat:true,bub:['機械を信じるな','NO MACHINES','Никаких машин','기계는 거짓','لا للآلات','मशीनें झूठ']}};
M.robocop=()=>{const L=[];
  L.push({p:[-.14,0,0],s:[.22,.85,.24],c:'#3a4560',sw:.45,ph:0});L.push({p:[.14,0,0],s:[.22,.85,.24],c:'#3a4560',sw:.45,ph:Math.PI});
  L.push({p:[0,.8,0],s:[.7,.8,.38],c:'#46567a',tp:.82});L.push({p:[0,1.38,0],s:[.9,.12,.4],c:'#2e3852'});
  L.push({p:[-.46,.72,0],s:[.16,.7,.18],c:'#3a4560',ak:'L',sw:.35,ph:Math.PI});L.push({p:[.46,.72,0],s:[.16,.7,.18],c:'#3a4560',ak:'R',sw:.35,ph:0});
  L.push({p:[0,1.48,0],s:[.32,.32,.32],c:'#56688e',tp:.9});L.push({p:[0,1.58,.17],s:[.26,.08,.02],c:'#ffb347',e:true});
  L.push({p:[.18,1.1,.2],s:[.1,.08,.02],c:'#19e3ff',e:true});L.push({p:[-.3,.62,.1],s:[.05,.5,.05],c:'#222'});
  return{parts:L,sp:[.5,.9],h:2.0,age:[2,9],ageUnit:' (serial yrs)',bub:['STOP!','止まれ','СТОЙ!','멈춰!','قف!','Halt.']}};
M.oldlady=()=>{const L=human({coat:'#5b7a52',pant:'#3a3030',skin:'#d8b090',hair:'#e8e4ee',long:true,legSw:.3,armSw:.2});
  L.push({p:[0,1.74,0],s:[.28,.1,.28],c:'#7d3a6a',tp:.9});
  L.push({p:[.36,.3,.05],s:[.24,.34,.18],c:'#c8a46a'});L.push({p:[.36,.62,.05],s:[.04,.2,.04],c:'#4cc54a'});L.push({p:[.4,.62,.05],s:[.05,.14,.04],c:'#e8a23a'});
  L.push({p:[-.36,.35,.05],s:[.2,.3,.18],c:'#c8a46a'});
  return{parts:L,sp:[.4,.7],h:1.8,sc:.88,age:[68,93],bub:['あらまぁ','My knees…','Ох уж…','아이고','يا ساتر','उफ़']}};
M.mascot=()=>{const L=[];
  L.push({p:[-.13,0,0],s:[.18,.55,.2],c:'#c8283c',sw:.5,ph:0});L.push({p:[.13,0,0],s:[.18,.55,.2],c:'#c8283c',sw:.5,ph:Math.PI});
  L.push({p:[0,.5,0],s:[.5,.55,.3],c:'#ffd42a',tp:.9});
  L.push({p:[-.34,.52,0],s:[.14,.5,.15],c:'#ffd42a',ak:'L',sw:.3,ph:Math.PI});L.push({p:[.34,.52,0],s:[.14,.5,.15],c:'#ffd42a',ak:'R',sw:.3,ph:0});
  /* burger head, tilted forward and down */
  L.push({p:[0,.95,.12],s:[.9,.2,.82],c:'#d89a3a',tp:.82});L.push({p:[0,1.12,.12],s:[.96,.1,.9],c:'#4cc54a'});
  L.push({p:[0,1.2,.12],s:[.92,.16,.86],c:'#6a3a22'});L.push({p:[0,1.34,.12],s:[.9,.28,.82],c:'#e8a23a',tp:.7});
  L.push({p:[-.2,1.18,.54],s:[.14,.14,.02],c:'#fff',e:true});L.push({p:[.2,1.18,.54],s:[.14,.14,.02],c:'#fff',e:true});
  L.push({p:[0,1.0,.55],s:[.4,.05,.02],c:'#c8283c',e:true});
  return{parts:L,sp:[.5,.8],h:1.8,bub:['I\'m lovin\' it…','バーガー…','Бургер…','버거…','برغر…']}};
M.kidball=()=>{const L=human({coat:'#2b6fd6',pant:'#222',hair:'#111',hat:'cap',hatC:'#e0352b',legSw:.7,armSw:.6});
  L.push({p:[.34,.0,.38],s:[.2,.2,.2],c:'#ff8a2a',bn:.55,tp:.85});
  return{parts:L,sp:[.6,1.0],h:1.1,sc:.62,age:[8,12],bub:['バスケ!','Swish!','Мяч!','농구!']}};
M.detective=()=>{const L=human({coat:'#8a7a5a',pant:'#2a2620',long:true,hat:'fedora',hatC:'#4a3a2a',armR:'#8a7a5a'});
  L.push({p:[.36,.52,.2],s:[.14,.2,.03],c:'#e8e4d0'});L.push({p:[0,1.44,.12],s:[.2,.04,.02],c:'#19e3ff',e:true});
  return{parts:L,sp:[.6,1.0],h:1.9,det:true,bub:['Seen this face?','この顔を?','Вы видели?','본 적 있나요?','هل رأيته؟','¿La viste?']}};
M.samurai=()=>{const L=human({coat:'#eae6f0',pant:'#eae6f0',legW:.26,legTp:.9,hair:'#0d0a14',skin:'#d0a07a'});
  L.push({p:[0,.74,0],s:[.5,.14,.3],c:'#15101a'});L.push({p:[0,1.74,-.04],s:[.1,.14,.1],c:'#0d0a14'});
  L.push({p:[.36,.55,.28],s:[.05,1.05,.05],c:'#a9763c',ya:0});L.push({p:[.36,.62,.28],s:[.16,.04,.04],c:'#2a1a10'});
  return{parts:L,sp:[.7,1.1],h:1.9,arms:{R:-.9},bub:['道','Honor.','Честь','도','شرف']}};
M.sage=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.66,1.3,.44],c:'#4f6a8c',tp:.62});L.push({p:[0,1.3,0],s:[.5,.2,.32],c:'#4f6a8c',tp:.8});
  L.push({p:[-.36,.9,0],s:[.12,.55,.14],c:'#4f6a8c',ak:'L'});L.push({p:[.36,.9,0],s:[.12,.55,.14],c:'#4f6a8c',ak:'R'});
  L.push({p:[0,1.45,0],s:[.22,.26,.22],c:'#d8b090',tp:.82});L.push({p:[0,1.62,0],s:[.32,.14,.32],c:'#4f6a8c',tp:.8});
  L.push({p:[0,1.12,.13],s:[.2,.42,.08],c:'#f2f2f6',tp:.4});L.push({p:[0,1.62,.12],s:[.22,.04,.04],c:'#f2f2f6'});
  L.push({p:[.46,0,.12],s:[.04,1.95,.04],c:'#6a4a2a'});L.push({p:[.46,1.9,.12],s:[.15,.15,.15],c:'#19e3ff',e:true});
  return{parts:L,sp:[0,0],h:2.1,stat:true,age:[84,420],bub:['Hmm…','ふむ','Хм…','음…']}};
M.sageF=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.7,1.25,.46],c:'#7a4f8a',tp:.6});L.push({p:[0,1.25,0],s:[.56,.22,.34],c:'#a07ab0',tp:.8});
  L.push({p:[-.36,.9,0],s:[.12,.55,.14],c:'#7a4f8a',ak:'L'});L.push({p:[.36,.9,0],s:[.12,.55,.14],c:'#7a4f8a',ak:'R'});
  L.push({p:[0,1.42,0],s:[.22,.26,.22],c:'#c89a78',tp:.82});L.push({p:[0,1.62,0],s:[.26,.1,.26],c:'#f2f2f6',tp:.85});L.push({p:[0,1.72,-.03],s:[.14,.12,.14],c:'#f2f2f6'});
  L.push({p:[0,1.52,.12],s:[.2,.05,.03],c:'#ffb347',e:true});
  L.push({p:[.44,0,.12],s:[.04,1.1,.04],c:'#6a4a2a'});L.push({p:[.44,1.05,.12],s:[.13,.18,.13],c:'#ffb347',e:true});
  return{parts:L,sp:[0,0],h:2.0,stat:true,age:[84,420],bub:['Ah…','あらあら','Ох…','어이구']}};
M.kidrun=()=>{const L=human({coat:'#ffd42a',pant:'#2a3a6a',hair:'#3a2418',legSw:1.1,armSw:1.0,legW:.18});
  L.push({p:[0,.9,-.17],s:[.26,.3,.1],c:'#ffd42a'});
  return{parts:L,sp:[5,6.5],h:1.1,sc:.62,age:[7,11],run:true,bub:['速っ!','Zoom!','Бегу!','달려!']}};

/* ---------- compile + build ---------- */
function compile(parts){return parts.map(p=>Object.assign({},p,{rgb:hex(p.c)}))}
function build(ent,cam){
  const polys=[],glows=[];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  const cos=Math.cos(ent.yaw||0),sin=Math.sin(ent.yaw||0),sc=ent.sc||1,zc=ent.z,P=cam.P;
  const fogk=cam.fogK?cam.fogK(zc):0,fc=cam.fogC||[0,0,0],holo=ent.holo,tint=ent.tint;
  const baseY=ent.y==null?cam.floorY:ent.y,mir=ent.mir,el=(ent.elev||0)+(ent.bob||0),clock=ent.clock||0;
  const arms=ent.arms||{};
  ent.parts.forEach(pt=>{
    const px=pt.p[0],py=pt.p[1],pz=pt.p[2],w=pt.s[0],h=pt.s[1],d=pt.s[2],tp=pt.tp==null?1:pt.tp;
    const vs=[];
    let by=0;if(pt.bn)by=Math.abs(Math.sin(clock*7))*pt.bn;
    for(let k=0;k<8;k++){
      const top=k>=4,q=k&3,sx=(q===0||q===3)?-1:1,sz=q<2?-1:1;
      let x=sx*(top?w*tp:w)/2,y=top?h:0,z=sz*(top?d*tp:d)/2;
      x+=px;y+=py+by;z+=pz;
      let a=0;
      if(pt.ak&&arms[pt.ak]!=null)a=arms[pt.ak];else if(pt.sw)a=Math.sin((ent.ph||0)+pt.ph)*pt.sw;
      if(a){const pv=py+h,yy=y-pv,zz=z-pz;y=pv+yy*Math.cos(a)-zz*Math.sin(a);z=pz+yy*Math.sin(a)+zz*Math.cos(a)}
      if(pt.pk&&arms[pt.pk]!=null){const a1=arms[pt.pk],pv1=pt.pv[0],pz1=pt.pv[1],y1=y-pv1,z1=z-pz1;y=pv1+y1*Math.cos(a1)-z1*Math.sin(a1);z=pz1+y1*Math.sin(a1)+z1*Math.cos(a1)}
      if(pt.sp){const a2=clock*25,xx=x-px,zz=z-pz;x=px+xx*Math.cos(a2)-zz*Math.sin(a2);z=pz+xx*Math.sin(a2)+zz*Math.cos(a2)}
      const X=x*cos+z*sin,Z=-x*sin+z*cos;
      vs.push([ent.x+X*sc,mir?(baseY+(y+el)*sc):(baseY-(y+el)*sc),zc+Z*sc]);
    }
    if(vs.some(v=>v[2]<.35))return;
    const cen=vs.reduce((a,v)=>[a[0]+v[0]/8,a[1]+v[1]/8,a[2]+v[2]/8],[0,0,0]);
    FACES.forEach(fi=>{
      const v0=vs[fi[0]],v1=vs[fi[1]],v2=vs[fi[2]],v3=vs[fi[3]];
      const fc2=[(v0[0]+v2[0])/2,(v0[1]+v2[1])/2,(v0[2]+v2[2])/2];
      let n=nrm(cross(sub(v1,v0),sub(v2,v0)));
      if(dot(n,sub(fc2,cen))<0)n=[-n[0],-n[1],-n[2]];
      if(!mir&&!holo&&dot(n,fc2)>=0)return;
      const pts=fi.map(i=>P(vs[i][0],vs[i][1],vs[i][2]));
      for(const p of pts){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}
      const zz=(v0[2]+v1[2]+v2[2]+v3[2])/4;
      if(holo){polys.push({z:zz,pts,holo:true});return}
      let r,gg,b;
      if(pt.e){r=pt.rgb[0];gg=pt.rgb[1];b=pt.rgb[2]}
      else{
        const m=(cam.amb||[.16,.16,.2]).slice();
        for(const Lg of cam.lights){const dd=Math.max(0,dot(n,Lg.d))*Lg.k;m[0]+=dd*Lg.c[0]/255;m[1]+=dd*Lg.c[1]/255;m[2]+=dd*Lg.c[2]/255}
        r=pt.rgb[0]*m[0];gg=pt.rgb[1]*m[1];b=pt.rgb[2]*m[2];
      }
      if(tint){r+=(tint[0]-r)*tint[3];gg+=(tint[1]-gg)*tint[3];b+=(tint[2]-b)*tint[3]}
      r+=(fc[0]-r)*fogk;gg+=(fc[1]-gg)*fogk;b+=(fc[2]-b)*fogk;
      polys.push({z:zz,pts,col:`rgb(${r|0},${gg|0},${b|0})`});
    });
    if(pt.e&&!mir){const pp=P(ent.x+(px*cos+pz*sin)*sc,baseY-(py+h/2+el)*sc,zc+(-px*sin+pz*cos)*sc);glows.push([pp,pt.rgb,Math.max(w,h,d)*sc*cam.f/zc])}
  });
  polys.sort((a,b)=>b.z-a.z);
  return{polys,glows,bb:[x0,y0,x1,y1]};
}
function drawEnt(c,ent,cam,alpha){
  const B=build(ent,cam);
  c.globalAlpha=alpha;
  if(ent.holo){
    const H=ent.holo;
    for(const p of B.polys){
      c.beginPath();c.moveTo(p.pts[0][0],p.pts[0][1]);for(let i=1;i<4;i++)c.lineTo(p.pts[i][0],p.pts[i][1]);c.closePath();
      c.fillStyle=`rgba(${H[0]},${H[1]},${H[2]},${H[3]})`;c.fill();
      c.strokeStyle=`rgba(${Math.min(255,H[0]+70)},${Math.min(255,H[1]+70)},${Math.min(255,H[2]+70)},.85)`;c.lineWidth=1;c.stroke();
    }
    c.globalAlpha=1;return B;
  }
  for(const p of B.polys){
    c.fillStyle=p.col;c.strokeStyle=p.col;c.lineWidth=.6;
    c.beginPath();c.moveTo(p.pts[0][0],p.pts[0][1]);for(let i=1;i<4;i++)c.lineTo(p.pts[i][0],p.pts[i][1]);c.closePath();c.fill();c.stroke();
  }
  c.globalAlpha=1;
  if(!ent.mir&&B.glows.length){
    c.globalCompositeOperation='lighter';
    for(const gl of B.glows){const r=gl[2]*2.6+3,gr=c.createRadialGradient(gl[0][0],gl[0][1],0,gl[0][0],gl[0][1],r);
      gr.addColorStop(0,`rgba(${gl[1][0]},${gl[1][1]},${gl[1][2]},.45)`);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(gl[0][0]-r,gl[0][1]-r,r*2,r*2)}
    c.globalCompositeOperation='source-over';
  }
  return B;
}
/* manga speech bubble in screen space */
function bubble(c,x,y,text,s,kind){
  s=s||1;c.save();
  const wis=kind==='wisdom';
  c.font=`${wis?'italic ':''}700 ${Math.round((wis?14:15)*s)}px "Share Tech Mono","Noto Sans",sans-serif`;
  /* word-wrap long text */
  const lines=[];const maxW=(wis?210:170)*s;
  if(c.measureText(text).width<=maxW)lines.push(text);
  else{let cur='';text.split(' ').forEach(wd=>{const t=cur?cur+' '+wd:wd;if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd}else cur=t});if(cur)lines.push(cur)}
  const lh=18*s,tw=Math.max(...lines.map(l=>c.measureText(l).width));
  const w=Math.max(34*s,tw+18*s),h=Math.max(24*s,lines.length*lh+8*s),irate=kind==='irate',r=irate?4:(lines.length>1?10*s:h/2);
  const bx=x-w/2,by=y-h-10*s;
  c.fillStyle=irate?'#fff1f0':(wis?'#f1e6c8':'#f4efe4');c.strokeStyle='#0a0612';c.lineWidth=2.2*s;
  c.beginPath();
  if(irate){
    const n=14;for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,rr=i%2?.8:1.1,px=x+Math.cos(a)*(w/2+4*s)*rr,py=by+h/2+Math.sin(a)*(h/2+6*s)*rr;i?c.lineTo(px,py):c.moveTo(px,py)}
    c.closePath();
  }else{
    c.moveTo(bx+r,by);c.arcTo(bx+w,by,bx+w,by+h,r);c.arcTo(bx+w,by+h,bx,by+h,r);c.arcTo(bx,by+h,bx,by,r);c.arcTo(bx,by,bx+w,by,r);c.closePath();
  }
  c.fill();c.stroke();
  if(!irate){const f=wis?'#f1e6c8':'#f4efe4';c.beginPath();c.moveTo(x-5*s,by+h-1);c.lineTo(x,by+h+9*s);c.lineTo(x+5*s,by+h-1);c.closePath();c.fillStyle=f;c.fill();c.stroke();c.beginPath();c.moveTo(x-5*s,by+h);c.lineTo(x+5*s,by+h);c.strokeStyle=f;c.lineWidth=3*s;c.stroke()}
  c.fillStyle=irate?'#c8102e':(wis?'#3a2410':'#0a0612');c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,i)=>c.fillText(l,x,by+h/2+(i-(lines.length-1)/2)*lh+1));
  if(irate){
    const vx=x+w/2-4*s,vy=by-2*s;c.strokeStyle='#e0152b';c.lineWidth=2.4*s;c.lineCap='round';
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>{c.beginPath();c.moveTo(vx+q[0]*3*s,vy+q[1]*3*s);c.lineTo(vx+q[0]*8*s,vy+q[1]*8*s);c.stroke()});
  }
  c.restore();
}
g.LP={hex,human,seated,MODELS:M,compile,build,drawEnt,bubble};
})(typeof window!=='undefined'?window:globalThis);
