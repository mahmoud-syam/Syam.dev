// ---------- Search palette (Ctrl K / ⌘K / "/") ----------
var KX=null,KSEL=0,KITEMS=[];
var KICO={lesson:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2.5 3.5c2-1 4-1 5.5.5 1.5-1.5 3.5-1.5 5.5-.5v9c-2-1-4-1-5.5.5-1.5-1.5-3.5-1.5-5.5-.5z"/><path d="M8 4v9"/></svg>',
 step:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5V8l1.8 1.2" stroke-linecap="round"/></svg>',
 cmd:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5l3 3-3 3M8 11.5h5"/></svg>',
 module:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2 4.5h4l1.5 1.5H14v6.5H2z"/></svg>',
 page:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2.5l1.6 3.4 3.7.4-2.8 2.5.8 3.7L8 10.6l-3.3 1.9.8-3.7L2.7 6.3l3.7-.4z"/></svg>',
 recent:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8a5 5 0 1 0 1.5-3.5M3 3v2.5h2.5"/><path d="M8 5.5V8l1.6 1"/></svg>'};
function kIndex(){if(KX)return KX;KX=[];
 KX.push({t:'page',title:'Practice',sub:'Test yourself with short questions for every module',hay:'practice quiz test questions exam',href:'practice'});
 KX.push({t:'page',title:'Cheatsheets',sub:'Every command from every lesson, searchable',hay:'cheatsheets commands cheat sheet reference',href:'cheatsheets'});
 COURSE.forEach(function(m,mi){var first=null,num=(mi+1<10?'0':'')+(mi+1);
  m.l.forEach(function(l){var k=m.id+'/'+l[0],L=LESSONS[k];if(!L)return;if(!first)first=k;
   KX.push({t:'lesson',title:L.title,sub:num+' '+m.n+' · '+L.steps.length+' steps · '+(L.time||''),hay:(L.title+' '+(L.sub||'')+' '+m.n+' '+(L.learn||[]).map(function(x){return x[0]}).join(' ')).toLowerCase(),href:k.replace('/','-')});
   L.steps.forEach(function(s,i){KX.push({t:'step',title:s.t,sub:L.title+' · step '+(i+1),hay:(s.t+' '+s.b+' '+(s.k?s.k[2]:'')).toLowerCase(),href:k.replace('/','-')+'~'+i})});
   lessonCmds(L).forEach(function(c){KX.push({t:'cmd',title:c.c,sub:L.title+' · step '+(c.s+1),hay:(c.c+' '+L.title).toLowerCase(),href:k.replace('/','-')+'~'+c.s,cmd:c.c})})});
  if(first)KX.push({t:'module',title:m.n,sub:'Module '+num+' · '+m.l.length+' lessons',hay:(m.n+' module').toLowerCase(),href:first.replace('/','-')});
  if(typeof PQB!=='undefined'&&PQB.some(function(q){return q.m==m.id}))KX.push({t:'page',title:'Practice: '+m.n,sub:'Questions for this module',hay:('practice quiz '+m.n).toLowerCase(),href:'practice-'+m.id})});
 return KX}
function kScore(it,toks){var tl=it.title.toLowerCase(),sc=0;
 for(var i=0;i<toks.length;i++){var t=toks[i];if(it.hay.indexOf(t)<0&&tl.indexOf(t)<0)return -1;
  if(tl.indexOf(t)==0)sc+=30;else if(new RegExp('(^|[^a-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(tl))sc+=18;else if(tl.indexOf(t)>=0)sc+=10;else sc+=2}
 return sc+({module:12,page:9,lesson:8,cmd:3,step:0}[it.t]||0)-Math.min(tl.length,80)/40}
function kMark(text,toks){var h=esc(text);toks.forEach(function(t){if(!t)return;var e=esc(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');h=h.replace(new RegExp('('+e+')(?![^<]*>)','gi'),'<mark>$1</mark>')});return h}
function kRecent(){try{return JSON.parse(localStorage.getItem('syam:recent'))||[]}catch(e){return []}}
function kSaveRecent(q){q=q.trim();if(q.length<2)return;try{var r=kRecent().filter(function(x){return x!==q});r.unshift(q);localStorage.setItem('syam:recent',JSON.stringify(r.slice(0,5)))}catch(e){}}
function kRun(){var q=$('kq').value.trim().toLowerCase(),toks=q.split(/\s+/).filter(Boolean),groups=[];
 if(!toks.length){var g1=[];if(KEY&&LESSONS[KEY])g1.push({t:'lesson',title:'Continue: '+LESSONS[KEY].title,sub:'Step '+(cur+1)+' of '+LESSONS[KEY].steps.length,href:KEY.replace('/','-')+'~'+cur});
  g1.push(kIndex()[0],kIndex()[1]);groups.push(['Jump to',g1]);
  var rc=kRecent();if(rc.length)groups.push(['Recent searches',rc.map(function(r){return {t:'recent',title:r,sub:'Search again',recent:r}})])}
 else{var all=kIndex().map(function(it){return [kScore(it,toks),it]}).filter(function(x){return x[0]>=0}).sort(function(a,b){return b[0]-a[0]});
  function pick(types,n){return all.filter(function(x){return types.indexOf(x[1].t)>=0}).slice(0,n).map(function(x){return x[1]})}
  var top=pick(['module','page'],3),les=pick(['lesson'],6),st=pick(['step'],5),cm=pick(['cmd'],8);
  if(top.length)groups.push(['Modules & pages',top]);if(les.length)groups.push(['Lessons',les]);if(cm.length)groups.push(['Commands',cm]);if(st.length)groups.push(['Lesson steps',st]);
  $('kcount').textContent=all.length+' result'+(all.length==1?'':'s')}
 if(!toks.length)$('kcount').textContent='';
 KITEMS=[];var h='';groups.forEach(function(g){h+='<div class="kgrp">'+g[0]+'</div>';g[1].forEach(function(it){var i=KITEMS.length;KITEMS.push(it);
  h+='<div class="kit" role="option" data-i="'+i+'"><span class="kic">'+KICO[it.t]+'</span><span class="ktx">'+(it.t=='cmd'?'<b><code>'+kMark(it.title,toks)+'</code></b>':'<b>'+kMark(it.title,toks)+'</b>')+'<small>'+esc(it.sub)+'</small></span>'+(it.t=='cmd'?'<button class="kcp" title="Copy" aria-label="Copy command" data-i="'+i+'">⧉</button>':'')+'<span class="kgo">↵</span></div>'})});
 if(!KITEMS.length)h='<div class="kempty">No results for "'+esc($('kq').value.trim())+'".<br>Try a tool name like <b>docker</b>, a command like <b>git reset</b>, or a topic like <b>DNS</b>.</div>';
 $('kres').innerHTML=h;KSEL=0;kSel(0)}
function kSel(i){var els=$('kres').querySelectorAll('.kit');if(!els.length)return;KSEL=(i+els.length)%els.length;els.forEach(function(e,j){e.classList.toggle('sel',j==KSEL);e.setAttribute('aria-selected',j==KSEL)});var e=els[KSEL],r=$('kres');
 if(e.offsetTop<r.scrollTop+30)r.scrollTop=Math.max(0,e.offsetTop-34);else if(e.offsetTop+e.offsetHeight>r.scrollTop+r.clientHeight)r.scrollTop=e.offsetTop+e.offsetHeight-r.clientHeight+6}
function kOpenItem(i){var it=KITEMS[i];if(!it)return;if(it.recent){$('kq').value=it.recent;kRun();return}kSaveRecent($('kq').value);kClose();closeDrawer();location.hash=it.href}
function kOpen(){var k=$('kbar');if(!k.hidden)return;k.hidden=false;document.documentElement.classList.add('kopen');$('kq').value='';kRun();$('kq').focus()}
function kClose(){$('kbar').hidden=true;document.documentElement.classList.remove('kopen')}
(function(){var mac=/Mac|iPhone|iPad/.test(navigator.platform||'');if(mac)$('kbdk').textContent='⌘ K';
 $('search').onclick=kOpen;$('search').onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();kOpen()}};$('sbtn').onclick=kOpen;
 $('kq').addEventListener('input',kRun);
 $('kq').addEventListener('keydown',function(e){if(e.key=='ArrowDown'){e.preventDefault();kSel(KSEL+1)}else if(e.key=='ArrowUp'){e.preventDefault();kSel(KSEL-1)}else if(e.key=='Enter'){e.preventDefault();kOpenItem(KSEL)}else if(e.key=='Escape'){e.preventDefault();e.stopPropagation();kClose()}});
 $('kres').addEventListener('mousemove',function(e){var it=e.target.closest('.kit');if(it&&+it.dataset.i!==KSEL)kSel(+it.dataset.i)});
 $('kres').addEventListener('click',function(e){var cp=e.target.closest('.kcp');if(cp){e.stopPropagation();copyText(KITEMS[+cp.dataset.i].cmd,cp);return}var it=e.target.closest('.kit');if(it)kOpenItem(+it.dataset.i)});
 $('kbar').addEventListener('mousedown',function(e){if(e.target===$('kbar'))kClose()});
 document.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k=='k'){e.preventDefault();if($('kbar').hidden)kOpen();else kClose();return}
  if(k=='/'&&$('kbar').hidden&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();kOpen()}
  if(k=='escape'&&!$('kbar').hidden)kClose()},true)})();
