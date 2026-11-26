// ---------- Views: Learn / Practice / Cheatsheets, and the app-style drawer ----------
var VIEW='learn';
function closeDrawer(){document.documentElement.classList.remove('drawer')}
function setView(v,arg){VIEW=v;var b=document.querySelector('.body');b.classList.toggle('v-practice',v=='practice');b.classList.toggle('v-cheat',v=='cheat');b.classList.toggle('v-home',v=='home');
 $('vpractice').hidden=v!='practice';$('vcheat').hidden=v!='cheat';$('vhome').hidden=v!='home';
 if(v=='home'){document.title='SYAM.DEV — Home';renderHome()}
 document.querySelectorAll('#nav [data-v],#dnav [data-v]').forEach(function(x){x.classList.toggle('on',x.dataset.v==v)});
 closeDrawer();
 if(v=='practice'){document.title='SYAM.DEV — Practice';if(!PQ||(arg&&arg!==PQ.mod))pqStart(arg||'mix');else pqRender();pqChips();pqStats()}
 if(v=='cheat'){document.title='SYAM.DEV — Cheatsheets';csBuild();csFilter(arg||CSM)}
 if(v=='learn'&&LES){document.title='SYAM.DEV — '+LES.title;requestAnimationFrame(function(){fitHead();fitCmds();fitSteps()})}}
function goView(v){if(v=='learn'){var l=PS.last&&LESSONS[PS.last.k]?PS.last:null;location.hash=l?l.k.replace('/','-')+'~'+l.s:(KEY||lessonKeys()[0]).replace('/','-')}else location.hash={practice:'practice',cheat:'cheatsheets',home:'home'}[v]}
function routeView(h){if(h===''||h==='home'){setView('home');renderTree();return true}var m=h.match(/^(practice|cheatsheets)(?:-(\w+))?$/);if(!m)return false;setView(m[1]=='practice'?'practice':'cheat',m[2]);renderTree();return true}
function modName(id){var m=COURSE.filter(function(c){return c.id==id})[0];return m?m.n:id}
var SHORTN={bash:'Bash',python:'Python',projects:'Projects',interview:'Interview'};function modShort(id){return SHORTN[id]||modName(id)}
function modColor(id){var m=COURSE.filter(function(c){return c.id==id})[0];return m?m.c[0]:'#999'}
function lessonLink(key,step){return '#'+key.replace('/','-')+(step!=null?'~'+step:'')}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
// ---------- Practice ----------
var PQ=null;if(!PS.pq)PS.pq={};
function pqMods(){var seen={},out=[];PQB.forEach(function(q){if(!seen[q.m]){seen[q.m]=1;out.push(q.m)}});return COURSE.map(function(c){return c.id}).filter(function(id){return seen[id]})}
function pqStart(mod){var pool=[];if(mod=='review')pool=rvDue();else PQB.forEach(function(q,i){if(mod=='mix'||q.m==mod)pool.push(i)});if(!pool.length&&mod=='review'){PQ=null;$('pcard').innerHTML='<div class="pmeta"><span>Review</span></div><h2>Nothing to review right now.</h2><p>Questions you get wrong come back here after a day, then after 3, 7, 14 and 30 days until you know them.</p><div class="pnav"><a class="pbtn" href="#practice">Mixed 10</a></div>';pqChips();pqStats();return}if(!pool.length){mod='mix';PQB.forEach(function(q,i){pool.push(i)})}
 shuffle(pool);if(mod=='mix')pool=pool.slice(0,10);
 PQ={mod:mod,list:pool,ord:pool.map(function(i){return shuffle(PQB[i].o.map(function(_,k){return k}))}),i:0,pick:null,right:0,wrong:[],done:false};pqRender();pqChips();pqStats()}
function pqChips(){var c=$('pchips');c.innerHTML='';var nd=rvDue().length,items=(nd?[['review','Review · '+nd+' due']]:[]).concat([['mix','Mixed · 10']]).concat(pqMods().map(function(id){return [id,modShort(id)]}));
 items.forEach(function(it){var b=document.createElement('button');b.className='pchip'+(PQ&&PQ.mod==it[0]?' on':'');var best=PS.pq[it[0]];
  b.innerHTML=(it[0]=='mix'||it[0]=='review'?'':'<i style="background:'+modColor(it[0])+'"></i>')+esc(it[1])+(best?'<small>'+best.r+'/'+best.t+'</small>':'');
  b.onclick=function(){location.hash=it[0]=='mix'?'practice':'practice-'+it[0]};c.appendChild(b)})}
function pqRender(){var c=$('pcard');if(!PQ)return;var n=PQ.list.length,title=PQ.mod=='mix'?'Mixed':PQ.mod=='review'?'Review':modName(PQ.mod);
 if(PQ.done){var pct=Math.round(PQ.right/n*100),msg=pct==100?'Perfect. You know this module.':pct>=70?'Good. Review the ones you missed below.':'Worth another pass: review the lessons below, then try again.';
  c.innerHTML='<div class="pmeta"><span>'+esc(title)+' · result</span><span>'+pct+'%</span></div><div class="pbar"><i style="width:'+pct+'%"></i></div><div class="pscore">'+PQ.right+' / '+n+'</div><p>'+msg+'</p>'+
   (PQ.wrong.length?'<ul class="pwrong">'+PQ.wrong.map(function(i){var q=PQB[i],L=LESSONS[q.l];return '<li><b>'+esc(q.q)+'</b><br>Answer: '+esc(q.o[q.a])+'<br><a href="'+lessonLink(q.l)+'">Review: '+esc(L?L.title:q.l)+'</a></li>'}).join('')+'</ul>':'')+
   '<div class="pnav"><button class="pbtn alt" id="pmix">Mixed 10</button><button class="pbtn" id="pagain">Try again</button></div>';
  $('pagain').onclick=function(){pqStart(PQ.mod)};$('pmix').onclick=function(){if(PQ.mod=='mix')pqStart('mix');else location.hash='practice'};return}
 var qi=PQ.list[PQ.i],q=PQB[qi],ord=PQ.ord[PQ.i],picked=PQ.pick;
 var h='<div class="pmeta"><span>'+esc(title)+' · question '+(PQ.i+1)+' of '+n+'</span><span>score '+PQ.right+'</span></div><div class="pbar"><i style="width:'+(PQ.i/n*100)+'%"></i></div><h2>'+esc(q.q)+'</h2><div class="popts">';
 ord.forEach(function(k,j){var cls='popt';if(picked!=null){if(k==q.a)cls+=' ok';else if(k==picked)cls+=' bad';else cls+=' dim'}h+='<button class="'+cls+'" data-k="'+k+'"'+(picked!=null?' disabled':'')+'><b>'+'ABCD'[j]+'</b><span>'+esc(q.o[k])+'</span></button>'});
 h+='</div>';
 if(picked!=null){var L=LESSONS[q.l];h+='<div class="pexp"><strong>'+(picked==q.a?'✓ Correct.':'✗ Not quite.')+'</strong>'+esc(q.e)+(L?'<br><a href="'+lessonLink(q.l)+'">Review: '+esc(L.title)+'</a>':'')+'</div><div class="pnav"><button class="pbtn" id="pnext">'+(PQ.i==n-1?'See result':'Next question')+'  →</button></div>'}
 c.innerHTML=h;
 c.querySelectorAll('.popt').forEach(function(b){b.onclick=function(){pqPick(+b.dataset.k)}});
 if($('pnext'))$('pnext').onclick=pqNext}
function pqPick(k){if(!PQ||PQ.pick!=null||PQ.done)return;var qi=PQ.list[PQ.i];PQ.pick=k;rvUpdate(qi,k==PQB[qi].a,PQ.mod=='review');if(k==PQB[qi].a)PQ.right++;else PQ.wrong.push(qi);pqRender();var nb=$('pnext');if(nb)nb.focus({preventScroll:true})}
function pqNext(){if(!PQ||PQ.pick==null)return;if(PQ.i<PQ.list.length-1){PQ.i++;PQ.pick=null}else{PQ.done=true;var b=PS.pq[PQ.mod];if(PQ.mod=='review'){}else if(!b||PQ.right/PQ.list.length>=b.r/b.t)PS.pq[PQ.mod]={r:PQ.right,t:PQ.list.length};save();pqChips();pqStats()}pqRender();$('pcard').scrollIntoView({block:'nearest'})}
function pqStats(){var s=$('pstats'),mods=pqMods(),done=mods.filter(function(m){return PS.pq[m]}).length;
 var h='<h3>Your best scores</h3>';mods.forEach(function(m){var b=PS.pq[m],p=b?Math.round(b.r/b.t*100):0;h+='<div class="prow"><span>'+esc(modName(m))+'</span><span>'+(b?b.r+'/'+b.t:'—')+'</span><u><i style="width:'+p+'%;background:'+(p>=70?'var(--green)':'var(--amber)')+'"></i></u></div>'});
 h+='<div class="ptip">'+done+' of '+mods.length+' modules practised. Keys: 1-4 to answer, Enter for next.</div>';s.innerHTML=h}
document.addEventListener('keydown',function(e){if(VIEW!='practice'||!PQ||e.target.tagName=='INPUT')return;var n=parseInt(e.key,10);
 if(n>=1&&n<=4&&PQ.pick==null&&!PQ.done){var o=PQ.ord[PQ.i];if(o[n-1]!=null)pqPick(o[n-1])}
 if(e.key=='Enter'&&PQ.pick!=null&&!PQ.done&&document.activeElement.id!='pnext'){e.preventDefault();pqNext()}});
// ---------- Cheatsheets ----------
var CSB=false,CSM='all';
function csBuild(){if(CSB)return;CSB=true;var list=$('clist'),html='';
 COURSE.forEach(function(m,mi){var groups=[];m.l.forEach(function(l){var k=m.id+'/'+l[0],L=LESSONS[k];if(!L)return;var c=lessonCmds(L);if(c.length)groups.push([k,L,c])});if(!groups.length)return;
  var tot=groups.reduce(function(a,g){return a+g[2].length},0);
  html+='<section class="cmod" data-m="'+m.id+'"><h2><i style="background:'+m.c[0]+'"></i>'+(mi+1<10?'0':'')+(mi+1)+' · '+esc(m.n)+'<small>'+tot+' commands</small></h2>';
  groups.forEach(function(g){html+='<div class="cles" data-t="'+esc(g[1].title.toLowerCase())+'"><h3><a href="'+lessonLink(g[0])+'">'+esc(g[1].title)+'</a></h3>';
   g[2].forEach(function(x){html+='<div class="crow" data-c="'+esc(x.c.toLowerCase())+'"><button class="cs" title="Open step '+(x.s+1)+'" data-h="'+lessonLink(g[0],x.s)+'">'+(x.s+1)+'</button><code>'+esc(x.c)+'</code><button class="cp" title="Copy" aria-label="Copy command">⧉</button></div>'});html+='</div>'});
  html+='</section>'});
 list.innerHTML=html;
 list.addEventListener('click',function(e){var t=e.target;if(t.classList.contains('cs')){location.hash=t.dataset.h.slice(1)}else if(t.classList.contains('cp')){copyText(t.parentNode.querySelector('code').textContent,t)}});
 var cc=$('cchips'),mods=[['all','All modules']].concat(COURSE.filter(function(m){return list.querySelector('[data-m="'+m.id+'"]')}).map(function(m){return [m.id,modShort(m.id)]}));
 mods.forEach(function(it){var b=document.createElement('button');b.className='pchip';b.dataset.m=it[0];b.innerHTML=(it[0]=='all'?'':'<i style="background:'+modColor(it[0])+'"></i>')+esc(it[1]);b.onclick=function(){location.hash=it[0]=='all'?'cheatsheets':'cheatsheets-'+it[0]};cc.appendChild(b)});
 $('cq').addEventListener('input',function(){csFilter(CSM)})}
function csFilter(mod){CSM=mod||'all';var q=$('cq').value.trim().toLowerCase(),n=0;
 document.querySelectorAll('#cchips .pchip').forEach(function(b){b.classList.toggle('on',b.dataset.m==CSM)});
 document.querySelectorAll('#clist .cmod').forEach(function(sec){var showM=CSM=='all'||sec.dataset.m==CSM,any=false;
  sec.querySelectorAll('.cles').forEach(function(g){var tm=q&&g.dataset.t.indexOf(q)>=0,ga=false;
   g.querySelectorAll('.crow').forEach(function(r){var ok=showM&&(!q||tm||r.dataset.c.indexOf(q)>=0);r.hidden=!ok;if(ok){ga=true;n++}
    var code=r.querySelector('code'),raw=code.textContent;code.innerHTML=q&&ok&&!tm?esc(raw).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[&<>"]/g,function(c){return esc(c)}),'gi'),function(x){return '<mark>'+x+'</mark>'}):esc(raw)});
   g.hidden=!ga;if(ga)any=true});sec.hidden=!any});
 $('ccount').textContent=n+' command'+(n==1?'':'s');
 var e=$('clist').querySelector('.cempty');if(!n){if(!e){e=document.createElement('div');e.className='cempty';$('clist').appendChild(e)}e.textContent='No command matches "'+$('cq').value+'".'}else if(e)e.remove()}

// ---------- Home ----------
function firstOpen(m){for(var i=0;i<m.l.length;i++){var k=m.id+'/'+m.l[i][0];if(LESSONS[k]&&!PS.done[k])return k}return m.id+'/'+m.l[0][0]}
function renderHome(){var tot=0,dn=0,mdone=0;COURSE.forEach(function(m){var d=0;m.l.forEach(function(l){tot++;if(PS.done[m.id+'/'+l[0]]){dn++;d++}});if(d==m.l.length)mdone++});
 var last=PS.last&&LESSONS[PS.last.k]?PS.last:null,started=dn>0||!!last;
 $('hhi').textContent=(started?'Welcome back':'Welcome')+(PS.name?', '+PS.name:'');
 $('hsub').textContent=dn+' of '+tot+' lessons done · '+mdone+' of '+COURSE.length+' modules complete. '+(started?'Pick up where you left off.':'Start with Linux, or jump to any module below.');
 var h='';
 if(last){var L=LESSONS[last.k],m=modOf(last.k),n=L.steps.length,s=Math.min(last.s,n-1),pct=Math.round((s+1)/n*100),fin=PS.done[last.k];
  var nk=null,ks=lessonKeys(),ix=ks.indexOf(last.k);for(var j=ix+1;j<ks.length;j++)if(LESSONS[ks[j]]){nk=ks[j];break}
  if(fin&&s==n-1&&nk){var L2=LESSONS[nk],m2=modOf(nk);h='<small>Up next</small><h2>'+esc(L2.title)+'</h2><p>You finished '+esc(L.title)+'. Next in '+esc(m2.n)+'.</p><div class="hmeta"><span><i style="background:'+m2.c[0]+'"></i>'+esc(m2.n)+'</span><span>'+esc(L2.time||'')+'</span><span>'+L2.steps.length+' steps</span></div><div class="hbtns"><a class="pbtn" href="#'+nk.replace('/','-')+'">Start lesson  →</a><a class="pbtn alt" href="#'+last.k.replace('/','-')+'">Review last</a></div>'}
  else h='<small>Continue where you left off</small><h2>'+esc(L.title)+'</h2><p>Step '+(s+1)+' of '+n+': '+esc(L.steps[s].t)+'</p><div class="hmeta"><span><i style="background:'+m.c[0]+'"></i>'+esc(m.n)+'</span><span>'+esc(L.time||'')+'</span><span>'+esc(L.level||'')+'</span></div><div class="hbar"><i style="width:'+pct+'%"></i></div><div class="hbtns"><a class="pbtn" href="#'+last.k.replace('/','-')+'~'+s+'">Continue  →</a><a class="pbtn alt" href="#'+last.k.replace('/','-')+'">Restart lesson</a></div>'}
 else{var fk=lessonKeys()[0],F=LESSONS[fk];h='<small>Start here</small><h2>'+esc(F.title)+'</h2><p>'+esc(F.sub||'')+'</p><div class="hbtns"><a class="pbtn" href="#'+fk.replace('/','-')+'">Start course  →</a><a class="pbtn alt" href="#practice">Quick self-test</a></div>'}
 $('hcont').innerHTML=h;
 var pm=pqMods(),pd=pm.filter(function(x){return PS.pq[x]}),avg=pd.length?Math.round(pd.reduce(function(a,x){return a+PS.pq[x].r/PS.pq[x].t},0)/pd.length*100):null,pct=Math.round(dn/tot*100),C=2*Math.PI*40;
 var ncmd=0;try{ncmd=kIndex().filter(function(x){return x.t=='cmd'}).length}catch(e){}
 $('hstats').innerHTML='<small>Your progress</small><div class="hring"><svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="48" cy="48" r="40" fill="none" stroke="var(--green)" stroke-width="9" stroke-linecap="'+(pct?'round':'butt')+'" stroke-dasharray="'+(C*pct/100).toFixed(1)+' '+C.toFixed(1)+'"/></svg><b>'+pct+'%</b></div><div class="hnums"><div><span>Lessons</span><b>'+dn+' / '+tot+'</b></div><div><span>Modules done</span><b>'+mdone+' / '+COURSE.length+'</b></div><div><span>Practice</span><b>'+(avg==null?'not started':avg+'% · '+pd.length+' / '+pm.length)+'</b></div><div><span>Commands</span><b><a href="#cheatsheets" style="color:inherit">'+ncmd+'</a></b></div></div>';
 var g='';COURSE.forEach(function(m,mi){var d=0,n=m.l.length;m.l.forEach(function(l){if(PS.done[m.id+'/'+l[0]])d++});var p=Math.round(d/n*100),lab=d==n?'Review ✓':d?'Continue':'Start';
  g+='<button class="hmod'+(d==n?' done':'')+'" data-k="'+firstOpen(m)+'"><span class="ht"><i style="background:'+m.c[0]+'"></i>'+esc(m.n)+'<em>'+(mi+1<10?'0':'')+(mi+1)+'</em></span><span class="hbar"><i style="width:'+p+'%"></i></span><span class="hn"><span>'+d+' / '+n+' lesson'+(n==1?'':'s')+'</span><b>'+lab+'</b></span></button>'});
 $('hmods').innerHTML=g;$('hmods').querySelectorAll('.hmod').forEach(function(b){b.onclick=function(){location.hash=b.dataset.k.replace('/','-')}});
 $('hkeys').innerHTML='<span><kbd>'+(/Mac|iPhone|iPad/.test(navigator.platform||'')?'⌘':'Ctrl')+'</kbd><kbd>K</kbd> search everything</span><span><kbd>←</kbd><kbd>→</kbd> previous / next step</span><span><kbd>Space</kbd> pause the animation</span><span><kbd>1</kbd>-<kbd>4</kbd> answer in Practice</span>'}
$('brand').onclick=function(){location.hash='home'};$('brand').onkeydown=function(e){if(e.key=='Enter'){location.hash='home'}};
document.querySelector('.dhead .brand').onclick=function(){location.hash='home'};document.querySelector('.dhead .brand').style.cursor='pointer';
// ---------- wiring ----------
document.querySelectorAll('#nav [data-v],#dnav [data-v]').forEach(function(x){x.addEventListener('click',function(){goView(x.dataset.v)});x.addEventListener('keydown',function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();goView(x.dataset.v)}})});
$('scrim').onclick=closeDrawer;$('dclose').onclick=closeDrawer;
document.addEventListener('keydown',function(e){if(e.key=='Escape')closeDrawer()});
