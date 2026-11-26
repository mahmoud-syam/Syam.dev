
var NS='http://www.w3.org/2000/svg',$=function(i){return document.getElementById(i)},SV=$('svg');
var DEFS,LAYER,TOK=0,NODES={},LINKS={},LES=null,KEY='',S={},cur=0,paused=false,FT=null,flowList=[],flowK=0,logs=[],HUDO={},TIMERS=[];
var TONES={gold:'#c8962e',violet:'#5a4aa8',green:'#2f7d57',blue:'#3b82c4',red:'#d23a2e',slate:'#5d6b86',orange:'#e8834d',teal:'#2a9d8f',pink:'#d9577a',amber:'#e0a526',purple:'#8a5ad8',sand:'#d5b07a'};
function tc(t){return TONES[t]||t||TONES.slate}
function clone(o){return JSON.parse(JSON.stringify(o))}
function val(v){return typeof v==='function'?v(S):v}
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);(p||SV).appendChild(e);return e}
function shade(h,a){var n=parseInt(h.slice(1),16),c=[n>>16,(n>>8)&255,n&255].map(function(v){return Math.max(0,Math.min(255,v+a))});return '#'+((1<<24)+(c[0]<<16)+(c[1]<<8)+c[2]).toString(16).slice(1)}
function lg(id,c1,c2,o1,o2,rad){var g=el(rad?'radialGradient':'linearGradient',rad?{id:id,cx:'35%',cy:'30%',r:'75%'}:{id:id,x1:0,y1:0,x2:0,y2:1},DEFS);el('stop',{offset:0,'stop-color':c1,'stop-opacity':o1==null?1:o1},g);el('stop',{offset:1,'stop-color':c2,'stop-opacity':o2==null?1:o2},g)}
function GR(kind,c){var id='g'+kind+c.slice(1);if(!DEFS.querySelector('#'+id)){
 if(kind=='hb'||kind=='pk')lg(id,shade(c,kind=='pk'?80:70),c,1,1,1);
 else if(kind=='bd')lg(id,shade(c,40),shade(c,-30));else if(kind=='ct')lg(id,shade(c,60),shade(c,15));
 else if(kind=='cl')lg(id,shade(c,20),shade(c,-25));else if(kind=='cr')lg(id,shade(c,-10),shade(c,-55));
 else if(kind=='sp')lg(id,c,c,.5,0)}return 'url(#'+id+')'}
function iso(p,cx,cy,w,h,top,s1,s2,d){var st={stroke:'#1c1a17','stroke-width':1.3,'stroke-linejoin':'round'};
 el('polygon',Object.assign({points:(cx-w)+','+cy+' '+cx+','+(cy-h)+' '+(cx+w)+','+cy+' '+cx+','+(cy+h),fill:top},st),p);
 el('polygon',Object.assign({points:(cx-w)+','+cy+' '+cx+','+(cy+h)+' '+cx+','+(cy+h+d)+' '+(cx-w)+','+(cy+d),fill:s1},st),p);
 el('polygon',Object.assign({points:(cx+w)+','+cy+' '+cx+','+(cy+h)+' '+cx+','+(cy+h+d)+' '+(cx+w)+','+(cy+d),fill:s2},st),p)}
function shadow(p,x,y,rx,ry,o){return el('ellipse',{cx:x,cy:y,rx:rx,ry:ry,fill:'#3a2c1c','fill-opacity':o||.3,filter:'url(#sblur)'},p)}
function pill(p,cx,y,text,c){var w=Math.max(56,text.length*7.4+22);el('rect',{x:cx-w/2,y:y,width:w,height:20,rx:10,style:'fill:var(--stage)'},p);el('rect',{x:cx-w/2,y:y,width:w,height:20,rx:10,fill:c,'fill-opacity':.2,stroke:c,'stroke-width':1.3},p);
 return el('text',{x:cx,y:y+14,'text-anchor':'middle','font-size':12,'font-weight':700,style:'fill:var(--ink)'},p)}
function person(G,x,y,c,k,crown){var pp=el('g',{class:'ppl',style:'animation-delay:'+(k*.35)+'s'},G),dk=shade(c,-30);
 el('ellipse',{cx:x,cy:y+7,rx:10,ry:3.5,fill:'#3a2c1c','fill-opacity':.22},pp);
 el('line',{x1:x-8,y1:y-9,x2:x-12,y2:y-1,stroke:dk,'stroke-width':3.2,'stroke-linecap':'round'},pp);
 var ar=el('g',{class:'arm',style:'transform-origin:'+(x+8)+'px '+(y-9)+'px'},pp);el('line',{x1:x+8,y1:y-9,x2:x+12,y2:y-1,stroke:dk,'stroke-width':3.2,'stroke-linecap':'round'},ar);
 el('rect',{x:x-8,y:y-14,width:16,height:21,rx:7,fill:GR('bd',c),stroke:'#1c1a17','stroke-width':1.3},pp);
 el('circle',{cx:x,cy:y-23,r:7.5,fill:GR('hb',c),stroke:'#1c1a17','stroke-width':1.3},pp);
 el('ellipse',{cx:x-2.5,cy:y-26,rx:2.2,ry:1.5,fill:'#fff','fill-opacity':.55},pp);
 [-2.6,2.6].forEach(function(dx){el('circle',{class:'eye',cx:x+dx,cy:y-22.5,r:1.2,fill:'#1c1a17',style:'animation-delay:'+(k*1.1)+'s'},pp)});
 if(crown)el('polygon',{points:(x-5)+','+(y-30)+' '+(x-5)+','+(y-36)+' '+(x-2.5)+','+(y-33)+' '+x+','+(y-39)+' '+(x+2.5)+','+(y-33)+' '+(x+5)+','+(y-36)+' '+(x+5)+','+(y-30),fill:'#f0c36a',stroke:'#1c1a17','stroke-width':1},pp)}

var R={};
function mk(s){var N={id:s.id,spec:s,ports:[],a:s.anchor||[s.x,s.y],vis:s.show!==false};N.g=el('g',{class:'nd pgrp cube'});if(!N.vis)N.g.style.display='none';
 N.visible=function(v,anim){N.vis=!!v;N.g.style.display=v?'':'none';if(v&&anim){N.g.style.transformBox='fill-box';N.g.style.transformOrigin='center';N.g.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:380,easing:'cubic-bezier(.34,1.56,.64,1)'})}};
 N.ring=function(col,big){var b=N.box||[N.a[0],N.a[1]];var r=el('ellipse',{cx:b[0],cy:b[1],rx:big||26,ry:(big||26)*.42,fill:'none',stroke:col,'stroke-width':3,style:'transform-box:fill-box;transform-origin:center'},LAYER);
  r.animate([{transform:'scale(.6)',opacity:1},{transform:'scale(2.2)',opacity:0}],{duration:620,easing:'ease-out'});setTimeout(function(){r.remove()},640)};
 N.hit=function(ok){N.g.classList.add(ok?'pass':'fail');setTimeout(function(){N.g.classList.remove('pass','fail')},380)};
 return N}

/* crowd: isometric platform with people */
R.crowd=function(s){var N=mk(s),c=tc(s.tone),w=s.w||92,h=Math.round(w*.413),cx=s.x,cy=s.y,G=N.g;
 el('polygon',{class:'spot',points:(cx-12)+','+(cy-58)+' '+(cx+12)+','+(cy-58)+' '+(cx+w*.98)+','+(cy-4)+' '+(cx-w*.98)+','+(cy-4),fill:GR('sp',c)},G);
 shadow(G,cx+14,cy+h+2,w+12,h*.55);iso(G,cx,cy,w,h,'url(#pt)','#d6c9b0','#c4b698',16);
 el('polygon',{points:(cx-w)+','+cy+' '+cx+','+(cy-h)+' '+(cx+w)+','+cy+' '+cx+','+(cy+h),fill:'none',stroke:c,'stroke-width':2.2,class:'rim'},G);
 el('polygon',{points:(cx-w*.76)+','+cy+' '+cx+','+(cy-h*.76)+' '+(cx+w*.76)+','+cy+' '+cx+','+(cy+h*.76),fill:c,'fill-opacity':.2},G);
 var rg=el('ellipse',{cx:cx,cy:cy,rx:w,ry:h,fill:'none',stroke:c,'stroke-width':2.5,opacity:0,style:'transform-box:fill-box;transform-origin:center'},G);
 var n=s.n==null?3:s.n,pos=n==1?[[0,-4]]:n==2?[[-w*.2,0],[w*.2,-6]]:[[-w*.38,2],[0,-10],[w*.33,6]];
 pos.forEach(function(q,k){person(G,cx+q[0],cy+q[1],c,k,s.crown&&k==Math.floor(n/2))});
 if(s.label)pill(G,cx,cy+h+20,s.label,c).textContent=s.label;
 if(!s.anchor)N.a=[cx+w+12,cy];N.box=[cx,cy];
 N.pulse=function(){G.classList.add('send');setTimeout(function(){G.classList.remove('send')},450);rg.animate([{opacity:.9,transform:'scale(1)'},{opacity:0,transform:'scale(1.2)'}],{duration:750,easing:'ease-out'})};
 return N};

/* box: isometric cube with optional ports, lock, plate, led, base slab */
R.box=function(s){var N=mk(s),c=tc(s.tone||'gold'),w=s.w||40,h=s.h||Math.round(w*.462),d=s.d||44,cx=s.x,cy=s.y,G=N.g,slope=h/w;
 shadow(G,cx+16,cy+d+h+(s.base?10:4),w+(s.base?34:8),(s.base?24:12));
 if(s.base){iso(G,cx,cy+d,w+22,h+10,'url(#pt)','#d6c9b0','#c4b698',14);
  el('polygon',{points:(cx-w-22)+','+(cy+d)+' '+cx+','+(cy+d-h-10)+' '+(cx+w+22)+','+(cy+d)+' '+cx+','+(cy+d+h+10),fill:'none',stroke:c,'stroke-width':2.2,class:'rim'},G);
  el('ellipse',{class:'ringc',cx:cx,cy:cy+d,rx:w+34,ry:(h+10)*1.3,fill:'none',stroke:c,'stroke-width':2},G)}
 var hv=el('g',{class:s.nobob?'':'hv'},G);iso(hv,cx,cy,w,h,GR('ct',c),GR('cl',c),GR('cr',c),d);
 if(s.led)N.led=el('ellipse',{class:'blinkL',cx:cx,cy:cy+1,rx:Math.max(4,w*.09),ry:Math.max(2,w*.045),fill:'#3fa456',stroke:'#17140f','stroke-width':1},hv);
 var np=s.ports?s.ports.length:0;
 if(np)s.ports.forEach(function(pt,k){var px=cx-w+8,yt=cy+h*(8/w),py=yt+d*(k+1)/(np+1);el('circle',{cx:px,cy:py,r:7.5,fill:'#17140f',stroke:tc(pt),'stroke-width':2},hv);N.ports.push([px-6,py])});
 if(s.lock){var lx=np?cx-w*.36:cx-w/2,ly=cy+h*.5+d*.5;N.lk=el('g',{},hv);N.shk=el('path',{d:'M'+(lx-6)+' '+(ly-1)+'v-6a6 6 0 0 1 12 0v6',fill:'none',stroke:'#17140f','stroke-width':2.6,'stroke-linecap':'round'},N.lk);
  el('rect',{x:lx-10,y:ly-1,width:20,height:15,rx:3,fill:'#17140f'},N.lk);el('circle',{cx:lx,cy:ly+6,r:2.2,fill:'#f0c36a'},N.lk)}
 if(s.plate){var pg=el('g',{transform:'translate('+cx+','+(cy+h)+') matrix(1 '+(-slope)+' 0 1 0 0)'},hv),pw=w-12;el('rect',{x:6,y:d*.3,width:pw,height:22,rx:5,fill:'#17140f'},pg);
  el('text',{x:6+pw/2,y:d*.3+15,'text-anchor':'middle','font-size':Math.min(11,pw/s.plate.length*1.55),'font-weight':700,fill:'#f0c36a'},pg).textContent=s.plate}
 var by=cy+d+h+(s.base?26:14);
 if(s.label)pill(G,cx,by,s.label,c).textContent=s.label;
 if(s.sub!=null){N.subt=el('text',{x:cx,y:by+(s.label?36:16),'text-anchor':'middle','font-size':14,'font-weight':700,style:'fill:var(--mut)'},G);N.refresh=function(){N.subt.textContent=val(s.sub)||''};N.refresh()}
 if(!s.anchor)N.a=[cx-w+2,cy+h*.5+d*.5];if(s.center)N.a=[cx,cy+(h+d)/2];N.box=[cx-w+8,cy+h*.5+d*.5];
 N.unlock=function(){if(N.shk)N.shk.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:900})};
 N.shake=function(){var tg=N.lk||G;tg.animate([{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:130,iterations:2})};
 var oh=N.hit;N.hit=function(ok){oh(ok);if(ok)N.unlock();else N.shake()};
 N.set=function(p){if(p.show!==undefined)N.visible(p.show,true);if(N.refresh)N.refresh()};return N};

/* tile: flat 3D chip for processes, groups, files */
var STAT={fail:'#e5534b',run:'#3fa456',sleep:'#3b82c4',stop:'#e8a33a',zombie:'#8a5ad8',dead:'#e5534b',none:'#bdb4a8'};
R.tile=function(s){var N=mk(s),c=tc(s.tone),w=s.w||112,h=s.h||44,x=s.x-w/2,y=s.y-h/2,G=N.g;
 shadow(G,s.x+8,s.y+h/2+9,w*.55,8,.28);
 el('rect',{x:x,y:y+6,width:w,height:h,rx:10,fill:shade(c,-40),stroke:'#1c1a17','stroke-width':1.4},G);
 el('rect',{x:x,y:y,width:w,height:h,rx:10,fill:'#fbf6ec',stroke:'#1c1a17','stroke-width':1.4},G);
 var bar=el('rect',{x:x+1,y:y+1,width:7,height:h-2,rx:5,fill:c},G);
 var t1=el('text',{x:x+16,y:y+(s.sub?19:h/2+4),'font-size':s.fs||11.5,'font-weight':800,fill:'#1c1a17'},G),t2=el('text',{x:x+16,y:y+34,'font-size':9.5,fill:'#6f6961'},G),
 dot=el('circle',{cx:x+w-13,cy:y+13,r:5,fill:STAT.none,stroke:'#1c1a17','stroke-width':1.2,style:'display:none'},G);
 N.box=[s.x,s.y];
 N.set=function(p){var q=Object.assign({},s,p);if(p.title!==undefined||p.sub!==undefined||p===s){t1.textContent=q.title||'';t2.textContent=q.sub||''}
  if(p.tone)bar.setAttribute('fill',tc(p.tone));if(p.status!==undefined||p===s){var st=q.status;dot.style.display=st?'':'none';if(st)dot.setAttribute('fill',STAT[st]||st);
   G.style.opacity=st=='dead'?.38:'';t1.setAttribute('text-decoration',st=='dead'?'line-through':'none')}
  if(p.show!==undefined)N.visible(p.show,true)};
 N.set(s);return N};

/* panel: dark info panel with text rows or LED rows */
R.panel=function(s){var N=mk(s),G=N.g,x=s.x,y=s.y,w=s.w,h=s.h,rows=s.rows||[],hl=s.hl||[],rg=null;
 el('rect',{x:x,y:y,width:w,height:h,rx:10,fill:'#17140f','fill-opacity':.95,stroke:'#1c1a17','stroke-width':1.5},G);
 var ti=el('text',{x:x+w/2,y:y+16,'text-anchor':'middle','font-size':9,'font-weight':700,fill:'#b9ad98'},G);ti.textContent=s.title||'';
 N.a=s.anchor||[x+w/2,y+h/2];N.box=N.a;
 N.render=function(){if(rg)rg.remove();rg=el('g',{},G);var ty=y+(s.title?34:18);
  rows.forEach(function(r,i){var rr=(typeof r==='function')?r(S):r,leds=rr&&rr.leds,rh=leds?22:16;
   if(hl.indexOf(i)>=0)el('rect',{x:x+6,y:ty-12,width:w-12,height:16,rx:4,fill:'#e0b04e','fill-opacity':.22},rg);
   if(leds){el('circle',{cx:x+17,cy:ty-2,r:4.5,fill:tc(rr.dot)},rg);leds.forEach(function(l,k){var lx=x+48+k*29,on=val(l.on),gg=el('g',{class:'led'},rg);
     el('circle',{cx:lx,cy:ty-2,r:9,fill:on?tc(l.tone):'#2f2a23',stroke:on?'#fff':'#4a4236','stroke-width':1.2,style:on?'filter:drop-shadow(0 0 4px '+tc(l.tone)+')':''},gg);
     el('text',{x:lx,y:ty+2,'text-anchor':'middle','font-size':11,'font-weight':800,fill:on?'#fff':'#7d7261'},gg).textContent=l.t;N.leds=N.leds||{};N.leds[rr.dot+k]=gg});ty+=rh;return}
   var txt=typeof rr==='string'?rr:val(rr.t),col=rr&&rr.tone?tc(rr.tone):'#d6cfc0';
   el('text',{x:x+12,y:ty,'font-size':s.fs||10.5,fill:col,style:'font-family:JetBrains Mono,ui-monospace,monospace'},rg).textContent=txt;ty+=rh})};
 N.refresh=function(){N.render()};
 N.set=function(p){if(p.rows)rows=p.rows;if(p.hl)hl=p.hl;if(p.hl===null)hl=[];if(p.title!==undefined)ti.textContent=p.title;if(p.show!==undefined)N.visible(p.show,true);N.render()};
 N.reset=function(){rows=s.rows||[];hl=s.hl||[];ti.textContent=s.title||'';N.render()};
 N.render();return N};

/* terminal with typing animation */
R.term=function(s){var N=mk(s),G=N.g,x=s.x,y=s.y,w=s.w,h=s.h,buf=[],max=s.max||Math.floor((h-42)/15),cpl=Math.floor((w-22)/6.3),tg=null;
 el('rect',{x:x,y:y,width:w,height:h,rx:10,fill:'#17140f',stroke:'#1c1a17','stroke-width':1.5},G);
 [['#e5534b',0],['#e8a33a',1],['#3fa456',2]].forEach(function(q){el('circle',{cx:x+14+q[1]*13,cy:y+13,r:4,fill:q[0]},G)});
 el('text',{x:x+w-12,y:y+16,'text-anchor':'end','font-size':9,'font-weight':700,fill:'#b9ad98'},G).textContent=(s.title||'terminal').toUpperCase();
 N.a=[x+w/2,y+h/2];N.box=N.a;
 function draw(cursor){if(tg)tg.remove();tg=el('g',{},G);var vis=buf.slice(-max);
  vis.forEach(function(l,i){var col=l.k=='cmd'?'#f0c36a':l.k=='err'?'#f09a82':'#cfc8b8',t=l.t.length>cpl?l.t.slice(0,cpl-1)+'…':l.t;
   var tx=el('text',{x:x+12,y:y+36+i*15,'font-size':10.5,fill:col,style:'font-family:JetBrains Mono,ui-monospace,monospace'},tg);tx.textContent=t;
   if(cursor&&i==vis.length-1)el('rect',{class:'tcur',x:x+12+t.length*6.3+1,y:y+26+i*15,width:6,height:11,fill:'#f0c36a'},tg)});
  if(cursor&&!vis.length)el('rect',{class:'tcur',x:x+12,y:y+26,width:6,height:11,fill:'#f0c36a'},tg)}
 function kind(t){return t.indexOf('$ ')==0?'cmd':t.indexOf('! ')==0?'err':'out'}
 var gen=0;N.clear=function(){gen++;buf=[];draw(true)};
 N.add=function(lines,instant){var i=0,tok=TOK,g=gen;lines=[].concat(lines);
  (function next(){if(tok!==TOK||g!==gen||i>=lines.length){if(tok===TOK&&g===gen)draw(true);return}var raw=lines[i++],k=kind(raw),t=k=='err'?raw.slice(2):raw;
   if(instant){buf.push({t:t,k:k});next();return}
   if(k=='cmd'){var n=2,o={t:'$ ',k:k};buf.push(o);(function ty(){if(tok!==TOK||g!==gen)return;o.t=t.slice(0,n);draw(true);if(n<t.length){n++;TIMERS.push(setTimeout(ty,26))}else TIMERS.push(setTimeout(next,260))})()}
   else{buf.push({t:t,k:k});draw(true);TIMERS.push(setTimeout(next,150))}})();
  if(instant)draw(true)};
 N.reset=function(){gen++;buf=[];draw(true)};N.set=function(p){if(p.show!==undefined)N.visible(p.show,true)};N.reset();return N};

/* ---------- scene ---------- */
function anchorOf(r){if(Array.isArray(r))return r;var p=String(r).split('#'),N=NODES[p[0]];if(!N)return [360,235];return p[1]!=null&&N.ports[p[1]]?N.ports[p[1]]:N.a}
function nid(r){return String(r).split('#')[0]}
function buildScene(){SV.innerHTML='';NODES={};LINKS={};DEFS=el('defs',{});
 var bf=el('filter',{id:'sblur',x:'-30%',y:'-80%',width:'170%',height:'260%'},DEFS);el('feGaussianBlur',{stdDeviation:5.5},bf);lg('pt','#fffaf0','#eadfc9');
 for(var k=0;k<14;k++)el('circle',{class:'pt',cx:60+((k*53)%620),cy:440-((k*37)%240),r:1.6+(k%3)*.5,fill:'#e0b04e','fill-opacity':.7,style:'animation-delay:'+(k*.45)+'s;animation-duration:'+(4+(k%4))+'s'});
 var lg0=el('g',{});
 (LES.links||[]).forEach(function(l){var g=el('g',{},lg0),c=tc(l.tone||'slate');
  l.g=g;l.tube=el('line',{stroke:c,'stroke-width':9,'stroke-linecap':'round','stroke-opacity':.16},g);l.fl=el('line',{class:'flow',stroke:c,'stroke-width':2.6,'stroke-linecap':'round','stroke-opacity':.85},g);LINKS[l.id]=l});
 (LES.nodes||[]).forEach(function(s){NODES[s.id]=R[s.t](s)});
 LAYER=el('g',{});
 (LES.links||[]).forEach(function(l){var a=l.pa||anchorOf(l.a),b=l.pb||anchorOf(l.b);[l.tube,l.fl].forEach(function(e){e.setAttribute('x1',a[0]);e.setAttribute('y1',a[1]);e.setAttribute('x2',b[0]);e.setAttribute('y2',b[1])});
  if(l.dash)l.fl.style.strokeDasharray='3 4'})}
function refreshLinks(f){Object.keys(LINKS).forEach(function(k){var l=LINKS[k],A=NODES[nid(l.a)],B=NODES[nid(l.b)],on=l.on===undefined?true:val(l.on),show=A.vis&&B.vis&&on!==false;
  l.g.style.display=show?'':'none';var lit=!f||(f.indexOf(nid(l.a))>=0&&f.indexOf(nid(l.b))>=0);l.g.style.opacity=lit?1:.14})}
function applyFocus(f){Object.keys(NODES).forEach(function(k){var N=NODES[k],d=f&&f.indexOf(k)<0&&N.spec.t!=='term'&&N.spec.t!=='panel';N.g.classList.toggle('dim',!!d);N.g.classList.toggle('lit',!!f&&f.indexOf(k)>=0)});refreshLinks(f)}

/* ---------- packets ---------- */
function usesLog(L){try{var t=JSON.stringify(L.steps);if(/"log":"/.test(t))return true;var C=L.controls;return !!(C&&(C.groups||[{items:C.items}]).some(function(g){return g.items.some(function(it){return /\blog:\s*['"]/.test(String(it.click))})}))}catch(e){return false}}
function say(h){if(h)logs.unshift(h);logs=logs.slice(0,3);var lg=$('log');lg.style.display=LES&&LES._log?'':'none';lg.innerHTML=logs.length?logs.map(function(l){return '<div>'+l+'</div>'}).join(''):'<div style="opacity:.55">Activity log: allowed and denied requests appear here.</div>'}
function burst(x,y,col,ok){var b=el('g',{},LAYER),r=el('circle',{cx:x,cy:y,r:7,fill:'none',stroke:col,'stroke-width':3,style:'transform-box:fill-box;transform-origin:center'},b);
 r.animate([{transform:'scale(.6)',opacity:1},{transform:'scale(3.4)',opacity:0}],{duration:520,easing:'ease-out'});
 var t=el('text',{x:x-7,y:y-12,'font-size':20,'font-weight':800,fill:col},b);t.textContent=ok?'✓':'✕';t.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-18px)',opacity:0}],{duration:700,easing:'ease-out'});setTimeout(function(){b.remove()},720)}
function send(path,o){o=o||{};var tok=TOK,pts=path.map(anchorOf),ok=typeof o.ok==='function'?o.ok(S):o.ok!==false,last=path.length-1,c=tc(o.tone||'blue');
 if(!ok&&o.denyAt!=null){var di=path.indexOf(o.denyAt);if(di>0)last=di}
 var gr=el('g',{style:'filter:drop-shadow(0 0 5px '+c+')'},LAYER),T=function(x,y,k){return {transform:'translate('+x+'px,'+y+'px)'+(k!=null?' scale('+k+')':'')}};
 var sh=el('ellipse',{rx:9,ry:3.5,fill:'#3a2c1c','fill-opacity':.25},LAYER);
 var ball=el('circle',{r:12,fill:GR('pk',c),stroke:'#1c1a17','stroke-width':1.5},gr);el('ellipse',{cx:-4,cy:-5,rx:3.5,ry:2.2,fill:'#fff','fill-opacity':.6},gr);
 el('text',{'text-anchor':'middle',y:5,'font-size':o.label&&o.label.length>2?9:13,'font-weight':800,fill:'#fff'},gr).textContent=o.label||'';
 var src=NODES[nid(path[0])];if(src&&src.pulse)src.pulse();var i=0;
 function done(){gr.remove();sh.remove()}
 function leg(){if(tok!==TOK){done();return}if(i>=last){arrive();return}
  var A=pts[i],B=pts[i+1],dist=Math.hypot(B[0]-A[0],B[1]-A[1]),dur=Math.max(560,dist*3.1),lift=Math.min(30,dist*.18),kf=[T(A[0],A[1]),T((A[0]+B[0])/2,(A[1]+B[1])/2-lift),T(B[0],B[1])];
  var gh=[[.34,10],[.2,8.5],[.1,7]].map(function(q,k){var e=el('circle',{r:q[1],fill:c,'fill-opacity':q[0]},LAYER);e.animate(kf,{duration:dur,delay:55*(k+1),easing:'ease-in-out',fill:'both'});return e});
  sh.animate([T(A[0],A[1]+18),T(B[0],B[1]+18)],{duration:dur,easing:'ease-in-out',fill:'forwards'});
  var a=gr.animate(kf,{duration:dur,easing:'ease-in-out',fill:'forwards'});
  a.onfinish=function(){gh.forEach(function(e){e.remove()});i++;if(i<last){var N=NODES[nid(path[i])];if(N)N.ring(c)}leg()}}
 function arrive(){if(tok!==TOK){done();return}var P=pts[last],N=NODES[nid(path[last])],prev=pts[Math.max(0,last-1)];
  sh.remove();if(N)N.hit(ok);burst(P[0],P[1],ok?'#3fa456':'#e5534b',ok);if(o.log)say('<span class="'+(ok?'ok':'no')+'">'+(ok?'✓':'✕')+'</span> '+o.log+': '+(ok?'allowed':'denied'));
  if(o.onArrive)o.onArrive(ok);
  if(ok){gr.animate([T(P[0],P[1],1),T(P[0]+30,P[1]+10,.2)],{duration:320,fill:'forwards'}).onfinish=done}
  else{ball.setAttribute('fill',GR('pk','#d23a2e'));gr.animate([T(P[0],P[1]),T(prev[0],prev[1])],{duration:700,easing:'ease-out',fill:'forwards'}).onfinish=done}}
 leg()}

/* ---------- flows (looping traffic) ---------- */
function runFlows(){clearTimeout(FT);if(paused||!flowList.length)return;var tok=TOK;
 (function tick(){if(tok!==TOK||paused)return;var f=flowList[flowK++%flowList.length];
  if(!f.when||f.when(S))send(f.path,{label:f.label,tone:f.tone,ok:f.ok,log:f.log,denyAt:f.denyAt});
  FT=setTimeout(tick,STEP&&STEP.gap||(flowList.length>3?430:700))})()}

/* ---------- API for lessons ---------- */
var STEP=null;
var API={get S(){return S},send:send,say:say,
 set:function(id,p){var N=NODES[id];if(N)N.set&&N.set(p);else if(LINKS[id])Object.assign(LINKS[id],p);refreshAll()},
 hud:function(o){Object.keys(o).forEach(function(k){HUDO[k]=Object.assign(HUDO[k]||{},o[k])});renderHud()},
 term:function(id,lines,clear){var N=NODES[id];if(!N)return;if(clear)N.reset();N.add(lines)},
 fx:function(id,k){var N=NODES[id];if(!N)return;N.ring(k=='no'?'#e5534b':k=='ok'?'#3fa456':'#e0b04e')},
 after:function(ms,fn){var tok=TOK;TIMERS.push(setTimeout(function(){if(tok===TOK)fn()},ms))},
 refresh:function(){refreshAll()}};
function applyStep(st,instant){if(st.S)Object.assign(S,clone(st.S));
 if(st.set)Object.keys(st.set).forEach(function(k){var N=NODES[k],p=Object.assign({},st.set[k]);if(N){if(instant&&p.show!==undefined){N.visible(p.show,false);delete p.show}if(N.set)N.set(p)}else if(LINKS[k])Object.assign(LINKS[k],p)});
 if(st.hud)Object.keys(st.hud).forEach(function(k){HUDO[k]=Object.assign(HUDO[k]||{},st.hud[k])});
 if(st.term){Object.keys(st.term).forEach(function(k){var N=NODES[k];if(!N)return;if(st.termClear)N.reset();N.add(st.term[k],instant)})}}

/* ---------- HUD ---------- */
function buildHud(){var h=$('hud');h.innerHTML='';(LES.hud||[]).forEach(function(c){var d=document.createElement('div');d.className='chip';d.id='h_'+c.id;d.innerHTML='<small>'+c.l+'</small><b></b>';h.appendChild(d);c.last=null})}
function renderHud(hl){(LES.hud||[]).forEach(function(c){var o=HUDO[c.id]||{},d=$('h_'+c.id),v=val(o.v!==undefined?o.v:c.v),lv=val(o.lv!==undefined?o.lv:c.lv)||'good';
 d.querySelector('b').textContent=v;d.dataset.l=lv;d.classList.toggle('hl',!!(hl&&hl.indexOf(c.id)>=0));if(c.last!==null&&c.last!==v){d.classList.remove('chg');void d.offsetWidth;d.classList.add('chg')}c.last=v})}
function refreshAll(){Object.keys(NODES).forEach(function(k){if(NODES[k].refresh)NODES[k].refresh()});renderHud(STEP&&STEP.hl);refreshLinks(STEP&&STEP.focus);refreshControls();goalUpdate()}

/* ---------- controls ---------- */
function buildControls(){var sw=$('sw');sw.innerHTML='';var C=LES.controls;sw.style.display=C?'':'none';placeSw();if(!C)return;$('swt').textContent=C.title||'Try it';
 var groups=C.groups||[{items:C.items}];groups.forEach(function(g){var d=document.createElement('div');d.className='grp';if(g.name){var sp=document.createElement('span');sp.textContent=g.name;d.appendChild(sp)}
  if(g.items.some(function(it){return it.wide})&&!g.name)d.classList.add('wrapg');else d.style.gridTemplateColumns=(g.name?(g.items.some(function(it){return it.wide})?'86px ':'84px '):'')+'repeat('+g.items.length+',max-content)';
  g.items.forEach(function(it){var b=document.createElement('button');b.className='sb'+(it.wide?' wide':'');b.textContent=it.label;b.onclick=function(){it.click(S,API);refreshAll()};it.b=b;d.appendChild(b)});sw.appendChild(d)})}
function refreshControls(){var C=LES&&LES.controls;if(!C)return;(C.groups||[{items:C.items}]).forEach(function(g){g.items.forEach(function(it){if(it.b)it.b.classList.toggle('on',!!(it.on&&it.on(S)))})})}
var mq=matchMedia('(min-width:1101px)');
function placeSw(){var d=mq.matches,has=!!(LES&&LES.controls);$('swcard').hidden=!(d&&has);if(d){$('swslot').appendChild($('sw'));$('swslot').appendChild($('goal'))}else{$('log').parentNode.insertBefore($('goal'),$('log'));$('goal').parentNode.insertBefore($('sw'),$('goal'))}}
mq.addEventListener('change',placeSw);
function goalUpdate(){var g=$('goal');document.querySelector('.rail2').classList.toggle('trying',!!(STEP&&STEP.goal&&LES.controls));if(!(STEP&&STEP.goal&&LES.goal)){g.style.display='none';return}var r=LES.goal(S);g.style.display='block';g.className='goal'+(r[0]?' ok':'');g.textContent=r[1]}

/* ---------- lesson load / navigation ---------- */
var ORDER=[];
function lessonKeys(){var o=[];COURSE.forEach(function(m){m.l.forEach(function(l){o.push(m.id+'/'+l[0])})});return o}
function modOf(k){return COURSE.filter(function(m){return m.id==k.split('/')[0]})[0]}
function loadLesson(key){var L=LESSONS[key];if(!L)return;LES=L;if(L._log===undefined)L._log=usesLog(L);KEY=key;TOK++;clearTimeout(FT);TIMERS.forEach(clearTimeout);TIMERS=[];S=clone(L.S||{});HUDO={};logs=[];cur=0;paused=false;$('pause').textContent='Pause';
 var m=modOf(key),idx=COURSE.indexOf(m),li=m.l.map(function(l){return l[0]}).indexOf(L.id);
 $('crumb').innerHTML=(idx+1<10?'0':'')+(idx+1)+'. '+m.n+'<i>/</i>Lesson '+(li+1)+' of '+m.l.length;$('ttl').textContent=L.title;$('sub').textContent=L.sub||'';$('sub').title=L.sub||'';
 var ic1='<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="5.6"/><path d="M7 4v3.2l2 1.2"/></svg>',
 ic2='<svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="1.5" y="9" width="2.2" height="3.5" rx=".6"/><rect x="5.9" y="6" width="2.2" height="6.5" rx=".6"/><rect x="10.3" y="2.5" width="2.2" height="10" rx=".6"/></svg>',
 ic3='<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 3.5h7M5 7h7M5 10.5h7M1.8 3.5h.4M1.8 7h.4M1.8 10.5h.4"/></svg>';
 $('tags').innerHTML='<span class="tag" style="background:var(--amber)">'+ic1+(L.time||'10 min')+'</span><span class="tag" style="background:var(--tile)">'+ic2+(L.level||'Beginner')+'</span><span class="tag" style="background:var(--violet)">'+ic3+L.steps.length+' steps</span>';
 document.title='SYAM.DEV — '+L.title;$('legend').innerHTML=(L.legend||[]).map(function(q){return '<span><i style="background:'+q[0]+'"></i>'+q[1]+'</span>'}).join('');
 var n=L.steps.length,st=$('steps');st.innerHTML='';$('tlt').style.setProperty('--n',n);
 L.steps.forEach(function(s,i){var b=document.createElement('button');b.innerHTML='<span class="dot">'+(i+1)+'</span><em>'+s.tt+'</em>';b.onclick=function(){go(i)};st.appendChild(b)});
 var gl=$('goals');gl.innerHTML='';(L.learn||[]).forEach(function(q){var li=document.createElement('li');li.innerHTML='<span class="ck">✓</span>'+q[0];gl.appendChild(li)});
 buildScene();buildHud();buildControls();CMDX=false;buildCmds(L);st_open(m.id);go(0);renderTree()}
function st_open(id){PS.open[id]=1;save()}
function resetAll(){Object.keys(NODES).forEach(function(k){var N=NODES[k];if(N.spec.t==='tile')N.set(Object.assign({},N.spec,{show:undefined}));else if(N.reset)N.reset();N.visible(N.spec.show!==false)});
 Object.keys(LINKS).forEach(function(k){var l=LINKS[k];if(l._on0===undefined)l._on0=l.on;l.on=l._on0})}
function go(i){var L=LES,n=L.steps.length;cur=Math.max(0,Math.min(n-1,i));TOK++;clearTimeout(FT);TIMERS.forEach(clearTimeout);TIMERS=[];LAYER.innerHTML='';logs=[];say('');
 S=clone(L.S||{});HUDO={};resetAll();
 for(var k=0;k<cur;k++){applyStep(L.steps[k],true);(L.steps[k].timed||[]).forEach(function(t){applyStep(t,true)})}
 var s=L.steps[cur];STEP=s;applyStep(s,false);
 applyFocus(s.focus||null);renderHud(s.hl);
 $('sn').textContent='Step '+(cur+1)+' of '+n;var pl=$('pill');pl.className='pill p-'+(s.pill||'idea');pl.textContent=s.pill||'idea';$('st').textContent=s.t;$('sb').textContent=s.b;
 $('call').className='call '+s.k[0];$('ci').textContent={idea:'i',tip:'✓',problem:'!'}[s.k[0]];$('ch').textContent=s.k[1];$('ct').textContent=s.k[2];
 $('back').disabled=cur==0;var nk=nextLessonKey(),last=cur==n-1;$('next').disabled=last&&!nk;$('nl').textContent=last?(nk?'Next lesson: '+LESSONS[nk].title:'Lesson complete'):'Next: '+L.steps[cur+1].tt;
 var stp=$('steps').querySelectorAll('button');stp.forEach(function(b,j){b.className=j==cur?'cr':j<cur?'dn':''});$('rl').style.width=(cur/Math.max(1,n-1)*100)+'%';$('tc').textContent='Step '+(cur+1)+' of '+n;
 $('goals').querySelectorAll('li').forEach(function(l,j){l.classList.toggle('hit',cur>=((L.learn||[])[j]||[0,99])[1])});
 if(cur==n-1)markDone(KEY);PS.last={k:KEY,s:cur};PS.lastAt=Date.now();save();
 refreshAll();
 var tok=TOK;(s.once||[]).forEach(function(o,j){TIMERS.push(setTimeout(function(){if(tok===TOK)send(o.path,o)},(o.delay||0)+j*(o.stagger||160)))});
 (s.fx||[]).forEach(function(f){TIMERS.push(setTimeout(function(){if(tok===TOK)API.fx(f.n,f.k)},f.delay||250))});
 (s.timed||[]).forEach(function(t){TIMERS.push(setTimeout(function(){if(tok!==TOK)return;applyStep(t,false);(t.send||[]).forEach(function(o){send(o.path,o)});refreshAll()},t.at))});
 flowList=s.flows||[];flowK=0;runFlows();requestAnimationFrame(function(){fitCmds();fitSteps()})}
function lessonCmds(L){var out=[],seen={};function take(lines,i){for(var j=0;j<lines.length;j++){var l=lines[j];if(typeof l!=='string'||l.slice(0,2)!=='$ ')continue;var c=l.slice(2).trim();while(/\\$/.test(c)&&j+1<lines.length&&typeof lines[j+1]==='string'){c=c.replace(/\s*\\$/,'')+' '+lines[++j].trim()}if(!c||c.charAt(0)==='#'||seen[c])continue;seen[c]=1;out.push({c:c,s:i})}}
 L.steps.forEach(function(s,i){[s].concat(s.timed||[]).forEach(function(x){if(x&&x.term)Object.keys(x.term).forEach(function(k){take(x.term[k],i)})})});return out}
function copyText(t,btn){function ok(){btn.textContent='✓';btn.classList.add('ok');setTimeout(function(){btn.textContent='⧉';btn.classList.remove('ok')},1200)}
 function fb(){try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();ok()}catch(e){}}
 try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb()}catch(e){fb()}}
function buildCmds(L){var c=lessonCmds(L),ul=$('cmdl');ul.innerHTML='';$('cmdn').textContent=c.length?c.length+'':'';CMDS=c;
 c.forEach(function(x){var li=document.createElement('li');li.dataset.s=x.s;
  var b=document.createElement('button');b.className='cs';b.textContent=x.s+1;b.title='Go to step '+(x.s+1);b.onclick=function(){go(x.s)};
  var code=document.createElement('code');code.textContent=x.c;code.title=x.c;
  var cp=document.createElement('button');cp.className='cp';cp.textContent='⧉';cp.title='Copy';cp.setAttribute('aria-label','Copy command');cp.onclick=function(){copyText(x.c,cp)};
  li.appendChild(b);li.appendChild(code);li.appendChild(cp);ul.appendChild(li)})}
var CMDS=[],CMDX=false;
function cmdToggle(){var c=$('cmds');if(!c.classList.contains('min')&&!c.classList.contains('exp'))return;CMDX=!CMDX;fitCmds();if(CMDX){var r=document.querySelector('.rail2');r.scrollTop=r.scrollHeight}}
function fitCmds(){var card=$('cmds');if(!card)return;card.hidden=!CMDS.length;if(!CMDS.length)return;
 var first=null;$('cmdl').querySelectorAll('li').forEach(function(li){var on=+li.dataset.s===cur;li.classList.toggle('cur',on);if(on&&!first)first=li});
 card.classList.remove('min','exp');var rail=document.querySelector('.rail2');
 if(innerWidth>1100&&card.getBoundingClientRect().height<110){card.classList.add(CMDX?'exp':'min');$('cmdc').textContent=CMDX?'▾':'▸';if(!CMDX&&rail.scrollHeight>rail.clientHeight+2){card.hidden=true;return}}
 if(first){var ul=$('cmdl'),ur=ul.getBoundingClientRect(),fr=first.getBoundingClientRect();if(fr.top<ur.top||fr.bottom>ur.bottom)ul.scrollTop=Math.max(0,ul.scrollTop+fr.top-ur.top)}}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#cmdh'))cmdToggle()});
function fitSteps(){var tl=document.querySelector('.tl');if(!tl)return;tl.classList.remove('tight');var t=false;$('steps').querySelectorAll('em').forEach(function(e){if(e.offsetParent&&e.scrollWidth>e.clientWidth+1)t=true});tl.classList.toggle('tight',t)}
addEventListener('resize',function(){clearTimeout(window._fs);window._fs=setTimeout(fitSteps,140)});
addEventListener('resize',function(){clearTimeout(window._fc);window._fc=setTimeout(fitCmds,140)});
function nextLessonKey(){var ks=lessonKeys(),i=ks.indexOf(KEY);for(var j=i+1;j<ks.length;j++)if(LESSONS[ks[j]])return ks[j];return null}
function onNext(){if(cur<LES.steps.length-1)go(cur+1);else{var nk=nextLessonKey();if(nk)location.hash=nk.replace('/','-')}}
function fitHead(){var hd=document.querySelector('.head');if(!hd)return;hd.classList.remove('stack');var t=$('tags'),h=$('ttl');if(innerWidth>1100&&t.getBoundingClientRect().top>h.getBoundingClientRect().top+8)hd.classList.add('stack')}
addEventListener('resize',function(){clearTimeout(window._fh);window._fh=setTimeout(fitHead,120)});
function fromHash(){var h=decodeURIComponent(location.hash.replace('#',''));if(routeView(h))return;setView('learn');var st=null,sm=h.match(/^(.+)~(\d+)$/);if(sm){h=sm[1];st=+sm[2]}var k=h.replace('-','/');if(LESSONS[k]){if(k!==KEY)loadLesson(k);if(st!=null)go(st)}else if(!LES){loadLesson(Object.keys(LESSONS)[0])}revealCur();fitHead()}
function revealCur(){if(!KEY)return;var m=KEY.split('/')[0];if(!PS.open[m]){PS.open[m]=1;save()}renderTree();var c=tree.querySelector('.les.cur'),sc=document.querySelector('.sscroll');if(c&&sc){var md=c.closest('.mod'),r=c.getBoundingClientRect(),q=sc.getBoundingClientRect(),mr=md.getBoundingClientRect();if(r.top<q.top+40||r.bottom>q.bottom-10){var tgt=(mr.height<q.height-20)?mr.top-q.top-8:r.top-q.top-q.height/3;sc.scrollTop+=tgt}}}

/* ---------- course outline (68 lessons from the Notion DevOps roadmap) ---------- */
var COURSE=[
{id:'linux',n:'Linux',c:['#d5b07a','#a4824e'],l:[['tree','The filesystem tree'],['permissions','File permissions'],['users','Users, groups & sudo'],['processes','Processes & signals'],['systemd','systemd & services'],['pkgssh','Packages, SSH & cron'],['storage','Disks, mounts & LVM'],['nettools','Networking tools'],['logsperf','Logs & performance'],['troubleshoot','Troubleshooting lab'],['labs','Linux lab: build a server']]},
{id:'git',n:'Git',c:['#e8834d','#b8602f'],l:[['commits','Repos, commits & staging'],['branches','Branches & merging'],['remotes','Remotes & pull requests'],['undo','Undo: reset, revert, stash']]},
{id:'bash',n:'Bash & Automation',c:['#3fa456','#2a7a3d'],l:[['basics','Variables, conditions & loops'],['pipes','Pipes & redirection'],['text','Text tools: grep, sed, awk'],['scripts','Automation scripts']]},
{id:'python',n:'Python for DevOps',c:['#2f86ce','#1f63a0'],l:[['basics','Python basics'],['files','Files, JSON & YAML'],['apis','APIs & requests'],['scripts','Automation scripts']]},
{id:'ansible',n:'Ansible',c:['#d9577a','#a83a58'],l:[['inventory','Inventory & ad-hoc'],['playbooks','Playbooks & modules'],['roles','Roles & vault']]},
{id:'docker',n:'Docker',c:['#2a9d8f','#1d7066'],l:[['vms','Containers vs VMs'],['images','Images & Dockerfile'],['storage','Volumes & networks'],['compose','Compose & registries']]},{id:'aws',n:'AWS',c:['#e3ae3c','#a5650c'],l:[['regions','Regions & AZs'],['iam','IAM'],['ec2','EC2, AMI & EBS'],['s3','S3'],['vpc','VPC networking'],['ops','Scaling, RDS & monitoring']]},
{id:'terraform',n:'Terraform',c:['#7c63d0','#5a43a6'],l:[['iac','IaC & the workflow'],['state','Variables, state & outputs'],['modules','Modules & remote state']]},

{id:'k8s',n:'Kubernetes',c:['#2f86ce','#1f63a0'],l:[['arch','Architecture'],['pods','Pods & Deployments'],['services','Services & networking'],['ingress','Ingress & DNS'],['config','ConfigMaps & secrets'],['storage','Storage'],['probes','Probes & autoscaling'],['rbac','RBAC & Helm']]},
{id:'cicd',n:'CI/CD',c:['#8c9a3c','#626d26'],l:[['concepts','CI/CD concepts'],['actions','GitHub Actions'],['deploy','Deployment strategies']]},
{id:'obs',n:'Observability',c:['#e5534b','#8f2a22'],l:[['metrics','Metrics & Prometheus'],['grafana','Grafana dashboards'],['logs','Logs: Loki & ELK'],['traces','Tracing']]},
{id:'sre',n:'SRE',c:['#64728a','#434e61'],l:[['slo','SLI, SLO & error budgets'],['incident','Incident response'],['postmortem','Postmortems'],['capacity','Capacity & load testing'],['dr','Backup & disaster recovery']]},
{id:'projects',n:'Real-World Projects',c:['#d5b07a','#a4824e'],l:[['p1','Linux infrastructure'],['p2','Infrastructure automation'],['p3','Containerized application'],['p4','AWS infrastructure'],['p5','Infrastructure as code'],['p6','Kubernetes platform'],['p7','CI/CD pipeline'],['p8','Observability stack'],['p9','SRE incident'],['p10','Python automation']]},
{id:'interview',n:'Interview Preparation',c:['#d9577a','#a83a58'],l:[['prep','Interview prep']]}];
window.LESSONS={};window.LESSON=function(mod,id,spec){spec.mod=mod;spec.id=id;LESSONS[mod+'/'+id]=spec};

/* ---------- sidebar tree + progress ---------- */
var PS={open:{linux:1},done:{}},tree=$('tree');
try{var sv0=JSON.parse(localStorage.getItem('syam:course3'));if(sv0&&sv0.open)PS=sv0}catch(e){}
function save(){try{localStorage.setItem('syam:course3',JSON.stringify(PS))}catch(e){}}
var pDone=-1,tween;
function renderProg(){var tot=0,dn=0,rows=[];COURSE.forEach(function(m){var d=0;m.l.forEach(function(l){tot++;if(PS.done[m.id+'/'+l[0]]){dn++;d++}});rows.push([m,d])});
 var pl=$('plist');
 if(!pl.children.length)rows.forEach(function(r){var li=document.createElement('li');li.innerHTML='<span class="cb"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.2l2.1 2.2L8 3"/></svg></span><span class="nm">'+r[0].n+'</span><small></small>';pl.appendChild(li)});
 [].forEach.call(pl.children,function(li,i){var m=rows[i][0],d=rows[i][1],n=m.l.length,cb=li.querySelector('.cb'),was=li.dataset.d;cb.style.setProperty('--f',d/n);cb.classList.toggle('full',d==n);li.querySelector('small').textContent=d+'/'+n;
  if(was!==undefined&&+was<d){li.classList.remove('hit');void li.offsetWidth;li.classList.add('hit')}li.dataset.d=d});
 $('pb2').style.width=(dn/tot*100)+'%';$('tot').textContent=tot+' lessons';
 var from=pDone<0?0:pDone;cancelAnimationFrame(tween);var t0=performance.now();(function step(t){var k=Math.min(1,(t-t0)/700);$('pc').textContent=Math.round(from+(dn-from)*k)+' / '+tot;if(k<1)tween=requestAnimationFrame(step)})(t0);
 if(pDone>=0&&dn>pDone){var pr=$('prog');pr.classList.remove('pulse');void pr.offsetWidth;pr.classList.add('pulse')}pDone=dn}
function markDone(key){if(PS.done[key])return;PS.done[key]=1;save();renderTree()}
function renderTree(){var sc=document.querySelector('.sscroll'),top=sc?sc.scrollTop:0;tree.innerHTML='';
 var ctl=document.createElement('div');ctl.className='ctl';ctl.innerHTML='<button id="ea">Expand all</button><button id="ca">Collapse all</button>';tree.appendChild(ctl);
 COURSE.forEach(function(m){var d=document.createElement('div');d.className='mod'+(PS.open[m.id]?' open':'');
  var cnt=m.l.filter(function(l){return PS.done[m.id+'/'+l[0]]}).length;
  var h=document.createElement('button');h.className='mh';h.setAttribute('aria-expanded',!!PS.open[m.id]);
  h.innerHTML='<svg class="chev" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 1l4 4-4 4"/></svg><svg width="18" height="15" viewBox="0 0 18 15"><path d="M1 3h6l2 2h8v9H1z" fill="'+m.c[0]+'" stroke="'+m.c[1]+'"/></svg>'+m.n+'<em>'+cnt+'/'+m.l.length+'</em>';
  h.onclick=function(){PS.open[m.id]=PS.open[m.id]?0:1;save();d.classList.toggle('open',!!PS.open[m.id]);h.setAttribute('aria-expanded',!!PS.open[m.id])};
  var mb=document.createElement('div');mb.className='mb';var in1=document.createElement('div'),ls=document.createElement('div');ls.className='lessons';
  m.l.forEach(function(l){var b=document.createElement('button'),k=m.id+'/'+l[0],built=!!LESSONS[k];b.className='les'+(built?'':' lock')+(k===KEY?' cur':'')+(PS.done[k]?' done':'');b.textContent=l[1];
   if(built){b.onclick=function(){document.documentElement.classList.remove('drawer');location.hash=m.id+'-'+l[0]}}else{b.setAttribute('aria-disabled','true');b.insertAdjacentHTML('beforeend','<span class="soon">soon</span>')}ls.appendChild(b)});
  in1.appendChild(ls);mb.appendChild(in1);d.appendChild(h);d.appendChild(mb);tree.appendChild(d)});
 $('ea').onclick=function(){COURSE.forEach(function(m){PS.open[m.id]=1});save();renderTree()};$('ca').onclick=function(){PS.open={};save();renderTree()};
 renderProg();if(sc)sc.scrollTop=top}
function boot(){renderTree();if(PS.shut===undefined)PS.shut=true;if(PS.shut){$('prog').classList.add('shut');$('ph').setAttribute('aria-expanded','false')}
 $('ph').onclick=function(){var pr=$('prog');pr.classList.toggle('shut');var sh=pr.classList.contains('shut');$('ph').setAttribute('aria-expanded',!sh);PS.shut=sh;save()};
 $('prs').onclick=function(){PS.done={};save();renderTree()};
 $('menu').onclick=function(){document.documentElement.classList.toggle('drawer')};
 $('theme').onclick=function(){var r=document.documentElement;r.dataset.theme=r.dataset.theme=='dark'?'light':'dark'};
 $('next').onclick=onNext;$('back').onclick=function(){go(cur-1)};$('replay').onclick=function(){go(cur)};
 $('pause').onclick=function(){paused=!paused;this.textContent=paused?'Play':'Pause';if(!paused)runFlows()};
 document.addEventListener('keydown',function(e){if(e.target.tagName=='INPUT'||VIEW!='learn')return;if(e.key=='ArrowRight')onNext();if(e.key=='ArrowLeft')go(cur-1);if(e.key==' '&&e.target==document.body){e.preventDefault();$('pause').click()}});
 window.addEventListener('hashchange',fromHash);fromHash()}

window.H={
 tile:function(id,x,y,title,sub,tone,o){return Object.assign({t:'tile',id:id,x:x,y:y,w:112,h:44,tone:tone,title:title,sub:sub},o||{})},
 box:function(id,x,y,label,tone,o){return Object.assign({t:'box',id:id,x:x,y:y,w:36,h:16,d:36,tone:tone,label:label,nobob:true,center:true},o||{})},
 lk:function(a,b,tone,o){return Object.assign({id:a+'_'+b,a:a,b:b,tone:tone||'slate'},o||{})}};

(function(){
var MAP={'/':['root'],'/etc':['root','etc'],'/etc/ssh':['root','etc','ssh'],'/home':['root','home'],'/home/syam':['root','home','syam'],'/var':['root','var'],'/var/log':['root','var','log'],'/usr':['root','usr'],'/usr/bin':['root','usr','bin'],'/dev':['root','dev']};
function D(id,x,y,label,tone){return {t:'box',id:id,x:x,y:y,w:30,h:14,d:22,tone:tone,label:label,center:true,nobob:true}}
function T(id,x,title,sub,tone){return {t:'tile',id:id,x:x,y:390,w:94,h:40,tone:tone,title:title,sub:sub,fs:10.5}}
function pathRows(cwd){return ['You are in:',{t:cwd,tone:'amber'},'','Depth: '+(MAP[cwd]?MAP[cwd].length-1:0),'','Try: cd /etc/ssh','     cd ..   cd ~']}
function cd(S,A,target){var p=target;if(target=='~')p='/home/syam';else if(target=='..'){var q=S.cwd.split('/').filter(Boolean);q.pop();p='/'+q.join('/')}
 if(!MAP[p])return;var chain=MAP[p];S.cwd=p;A.send(chain,{label:'cd',tone:'blue'});A.term('term',['$ cd '+target,'$ pwd',p]);
 A.hud({pwd:{v:p},depth:{v:String(chain.length-1)},cmd:{v:'cd '+target}});A.set('path',{rows:pathRows(p)});A.fx(chain[chain.length-1],'pulse')}
function btn(label,t){return {label:label,wide:true,click:function(S,A){cd(S,A,t)}}}
