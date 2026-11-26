// ---------- Academy: tracks → courses → modules → lessons (video, reading, lab, link) ----------
// Content comes from the Worker API (/api/catalog), per-user state from /api/my.
var ACAD={ok:ACCT.on,cat:null,my:{},admin:false,T:{},C:{},M:{},L:{},CM:{},ML:{},CL:{},loading:null,err:''};
var AC_TYPES={video:'Video',reading:'Reading',lab:'Lab',link:'Link',quiz:'Quiz'};
var AC_PROV={youtube:'YouTube',udemy:'Udemy','microsoft-learn':'Microsoft Learn',coursera:'Coursera','aws-skill-builder':'AWS Skill Builder',book:'Book',other:'Other'};
var AC_ICON={video:'<path d="M3 3.5h10v9H3z"/><path d="M7 6l3 2-3 2z" fill="currentColor"/>',reading:'<path d="M3 3h4.5c.8 0 1.5.7 1.5 1.5V13c0-.6-.5-1-1-1H3zM13 3H8.5C7.7 3 7 3.7 7 4.5V13c0-.6.5-1 1-1h5z"/>',lab:'<path d="M6 2.5v4L3 12.5c-.3.6.1 1 .7 1h8.6c.6 0 1-.4.7-1L10 6.5v-4M5 2.5h6"/>',link:'<path d="M7 9a2.5 2.5 0 003.5 0l2-2A2.5 2.5 0 009 3.5l-.7.7M9 7a2.5 2.5 0 00-3.5 0l-2 2A2.5 2.5 0 007 12.5l.7-.7"/>',quiz:'<circle cx="8" cy="8" r="5.5"/><path d="M6.6 6.4a1.5 1.5 0 112.1 1.4c-.5.2-.7.6-.7 1.1M8 11h0"/>'};
function acIcon(t){return '<svg class="aci" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+(AC_ICON[t]||AC_ICON.link)+'</svg>'}
function acApi(method,path,body){return fetch(path,{method:method,credentials:'same-origin',redirect:'manual',headers:body!==undefined?{'content-type':'application/json'}:{},body:body!==undefined?JSON.stringify(body):undefined})
 .then(function(r){if(r.type=='opaqueredirect'||r.status==0)throw new Error('Your session ended. Reload the page to sign in again.');return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw new Error(j.error||('Request failed ('+r.status+')'));return j})})}
function acToast(msg,bad){var t=$('actoast');if(!t){t=document.createElement('div');t.id='actoast';t.className='actoast';document.body.appendChild(t)}t.textContent=msg;t.className='actoast on'+(bad?' bad':'');clearTimeout(t._h);t._h=setTimeout(function(){t.className='actoast'},2600)}
function acMins(m){m=Math.round(m||0);if(!m)return '';var h=Math.floor(m/60),r=m%60;return h?(h+'h'+(r?' '+r+'m':'')):r+'m'}
function acLocal(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
// ---------- Data ----------
function acIndex(cat){ACAD.cat=cat;var T={},C={},M={},L={},CM={},ML={},CL={};
 cat.tracks.forEach(function(t){T[t.id]=t});cat.courses.forEach(function(c){C[c.id]=c;CM[c.id]=[];CL[c.id]=[]});
 cat.modules.forEach(function(m){if(!C[m.course_id])return;M[m.id]=m;ML[m.id]=[];CM[m.course_id].push(m)});
 cat.lessons.forEach(function(l){var m=M[l.module_id];if(!m)return;L[l.id]=l;ML[m.id].push(l)});
 Object.keys(CM).forEach(function(cid){CM[cid].forEach(function(m){ML[m.id].forEach(function(l){CL[cid].push(l)})})});
 ACAD.T=T;ACAD.C=C;ACAD.M=M;ACAD.L=L;ACAD.CM=CM;ACAD.ML=ML;ACAD.CL=CL;if(typeof KX!='undefined')KX=null}
function acCourseOf(lid){var l=ACAD.L[lid];return l&&ACAD.M[l.module_id]?ACAD.C[ACAD.M[l.module_id].course_id]:null}
function acStats(cid){var ls=ACAD.CL[cid]||[],d=0,min=0;ls.forEach(function(l){min+=l.minutes||0;if(ACAD.my[l.id]&&ACAD.my[l.id].done)d++});return {n:ls.length,done:d,min:min,pct:ls.length?Math.round(d/ls.length*100):0}}
function acNextLesson(cid){var ls=ACAD.CL[cid]||[];for(var i=0;i<ls.length;i++)if(!(ACAD.my[ls[i].id]&&ACAD.my[ls[i].id].done))return ls[i];return ls[0]||null}
function acLoad(force){if(!ACAD.ok)return Promise.resolve();if(ACAD.loading&&!force)return ACAD.loading;
 if(!ACAD.cat){var c=acLocal('syam:acad');if(c&&c.cat){acIndex(c.cat);ACAD.my=c.my||{};ACAD.admin=!!c.admin}}
 ACAD.loading=Promise.all([acApi('GET','/api/catalog'),acApi('GET','/api/my'),acApi('GET','/api/me')]).then(function(r){
  acIndex(r[0]);var my={};(r[1].lessons||[]).forEach(function(x){my[x.lesson_id]=x});
  var q=acLocal('syam:acadq')||{};Object.keys(q).forEach(function(id){my[id]=Object.assign(my[id]||{},q[id])});
  ACAD.my=my;ACAD.admin=!!r[2].admin;ACAD.err='';acLocal('syam:acad',{cat:r[0],my:my,admin:ACAD.admin});acFlush();acAfterLoad()})
 .catch(function(e){ACAD.err=e.message;acAfterLoad()});return ACAD.loading}
function acAfterLoad(){if(VIEW=='courses')acRender(ACAD.view);if(VIEW=='home')renderHome();if(typeof profPaint=='function')profPaint();if(typeof adAfterLoad=='function')adAfterLoad()}
function acSaveLocal(){acLocal('syam:acad',{cat:ACAD.cat,my:ACAD.my,admin:ACAD.admin})}
function acPut(id,patch){var cur=ACAD.my[id]||{lesson_id:id,done:0,note:'',saved:0,position:0};Object.keys(patch).forEach(function(k){cur[k]=typeof patch[k]=='boolean'?(patch[k]?1:0):patch[k]});ACAD.my[id]=cur;acSaveLocal();
 var q=acLocal('syam:acadq')||{};q[id]=Object.assign(q[id]||{},patch);acLocal('syam:acadq',q);return acFlush()}
var AC_FLUSH=null;
function acFlush(){if(AC_FLUSH)return AC_FLUSH;var q=acLocal('syam:acadq')||{},ids=Object.keys(q);if(!ids.length||!ACAD.ok)return Promise.resolve(true);
 AC_FLUSH=ids.reduce(function(p,id){return p.then(function(){var body=q[id];return acApi('PUT','/api/my/lessons/'+id,body).then(function(){var cur=acLocal('syam:acadq')||{};if(JSON.stringify(cur[id])==JSON.stringify(body)){delete cur[id];acLocal('syam:acadq',cur)}},function(e){if(/not found/i.test(e.message)){var cur=acLocal('syam:acadq')||{};delete cur[id];acLocal('syam:acadq',cur);return}throw e})})},Promise.resolve())
  .then(function(){AC_FLUSH=null;return true},function(){AC_FLUSH=null;return false});return AC_FLUSH}
addEventListener('online',function(){acFlush()});
// ---------- Tiny, safe Markdown ----------
function acInline(s){s=esc(s);
 s=s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<i>$2</i>');
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
 s=s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>');return s}
function acMd(src){var out=[],lines=String(src||'').replace(/\r/g,'').split('\n'),i=0,list=null,para=[];
 function flushP(){if(para.length){out.push('<p>'+acInline(para.join(' '))+'</p>');para=[]}}
 function flushL(){if(list){out.push('</'+list+'>');list=null}}
 while(i<lines.length){var ln=lines[i],m;
  if(/^```/.test(ln)){flushP();flushL();var code=[];i++;while(i<lines.length&&!/^```/.test(lines[i])){code.push(lines[i]);i++}out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');i++;continue}
  if((m=ln.match(/^(#{1,3})\s+(.*)/))){flushP();flushL();var h=m[1].length+2;out.push('<h'+h+'>'+acInline(m[2])+'</h'+h+'>');i++;continue}
  if((m=ln.match(/^\s*[-*]\s+(.*)/))){flushP();if(list!='ul'){flushL();out.push('<ul>');list='ul'}out.push('<li>'+acInline(m[1])+'</li>');i++;continue}
  if((m=ln.match(/^\s*\d+[.)]\s+(.*)/))){flushP();if(list!='ol'){flushL();out.push('<ol>');list='ol'}out.push('<li>'+acInline(m[1])+'</li>');i++;continue}
  if((m=ln.match(/^>\s?(.*)/))){flushP();flushL();out.push('<blockquote>'+acInline(m[1])+'</blockquote>');i++;continue}
  if(!ln.trim()){flushP();flushL();i++;continue}
  flushL();para.push(ln.trim());i++}
 flushP();flushL();return out.join('')}
// ---------- YouTube ----------
function acYtId(u){if(!u)return null;var m=u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:null}
var AC_YT={api:null,player:null,timer:null};
function acYtApi(){if(AC_YT.api)return AC_YT.api;AC_YT.api=new Promise(function(res,rej){if(window.YT&&YT.Player)return res();var prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=function(){if(prev)prev();res()};
 var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=function(){AC_YT.api=null;rej()};document.head.appendChild(s);setTimeout(function(){rej()},8000)});return AC_YT.api}
function acYtStop(){clearInterval(AC_YT.timer);AC_YT.timer=null;if(AC_YT.player&&AC_YT.player.destroy){try{AC_YT.player.destroy()}catch(e){}}AC_YT.player=null}
function acYtMount(lesson){var vid=acYtId(lesson.url),box=$('acplayer');if(!vid||!box)return;var st=ACAD.my[lesson.id],start=st&&st.position>10?st.position:0;
 acYtApi().then(function(){if(!$('acplayer')||ACAD.view.id!==lesson.id)return;var lastSaved=start;
  AC_YT.player=new YT.Player('acplayer',{videoId:vid,host:'https://www.youtube-nocookie.com',playerVars:{start:Math.floor(start),rel:0,modestbranding:1,playsinline:1},events:{onStateChange:function(e){
   clearInterval(AC_YT.timer);if(e.data===1){AC_YT.timer=setInterval(function(){var p=AC_YT.player;if(!p||!p.getCurrentTime)return;var t=p.getCurrentTime(),d=p.getDuration()||0;
    if(Math.abs(t-lastSaved)>=15){lastSaved=t;acPut(lesson.id,{position:Math.floor(t)})}
    if(d>60&&t/d>0.92&&!(ACAD.my[lesson.id]&&ACAD.my[lesson.id].done)){acPut(lesson.id,{done:true,position:0});acToast('Marked as done');acPaintLessonState(lesson)}},4000)}
   if(e.data===0&&!(ACAD.my[lesson.id]&&ACAD.my[lesson.id].done)){acPut(lesson.id,{done:true,position:0});acToast('Marked as done');acPaintLessonState(lesson)}}}})
 }).catch(function(){if(!$('acplayer'))return;$('acplayer').outerHTML='<iframe class="acframe" src="https://www.youtube-nocookie.com/embed/'+vid+(start?'?start='+Math.floor(start):'')+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="'+esc(lesson.title)+'"></iframe>'})}
// ---------- Views ----------
function acSection(){var s=$('vcourses');if(s)return s;s=document.createElement('section');s.className='view acv';s.id='vcourses';s.hidden=true;$('vcheat').after(s);return s}
function acSetLast(cid,lid){var m=acLocal('syam:acadlast')||{};m[cid]={l:lid,at:Date.now()};acLocal('syam:acadlast',m)}
function acRender(arg){ACAD.view=arg||{page:'catalog'};var s=acSection();acYtStop();
 if(!ACAD.ok){s.innerHTML='<div class="vhead"><div class="crumb">Courses</div><h1>Courses</h1><p class="sub">Your video courses, readings and labs live on the academy site. Open <b>learn.mahmoud-syam.me</b> to see them.</p></div><div class="hbtns"><a class="pbtn" href="https://learn.mahmoud-syam.me/#courses">Open the academy</a></div>';return}
 if(!ACAD.cat){s.innerHTML='<div class="vhead"><div class="crumb">Courses</div><h1>Courses</h1><p class="sub">'+(ACAD.err?esc(ACAD.err):'Loading your courses…')+'</p></div>'+(ACAD.err?'<div class="hbtns"><button class="pbtn" onclick="acLoad(true)">Try again</button></div>':'<div class="acskel"><i></i><i></i><i></i></div>');acLoad();return}
 var p=ACAD.view.page;if(p=='course')return acCourse(ACAD.view.id);if(p=='lesson')return acLesson(ACAD.view.id);acCatalog()}
function acBuiltin(){var tot=0,dn=0;COURSE.forEach(function(m){m.l.forEach(function(l){if(LESSONS[m.id+'/'+l[0]]){tot++;if(PS.done[m.id+'/'+l[0]])dn++}})});return {n:tot,done:dn,pct:tot?Math.round(dn/tot*100):0}}
function acCard(c){var st=acStats(c.id),t=ACAD.T[c.track_id]||{},col=t.color||'#2f86ce';
 return '<a class="accard" href="#course:'+c.id+'" style="--tc:'+esc(col)+'"><span class="acband"></span><span class="acprov">'+esc(AC_PROV[c.provider]||'Other')+(c.level?' · '+esc(c.level):'')+(c.published?'':' · <b>Hidden</b>')+'</span><b class="act">'+esc(c.title)+'</b>'+(c.description?'<span class="acd">'+esc(c.description)+'</span>':'')+
  '<span class="acfoot"><span>'+st.n+' lesson'+(st.n==1?'':'s')+(st.min?' · '+acMins(st.min):'')+'</span><span>'+(st.done?st.pct+'%':'')+'</span></span><u class="acbar"><i style="width:'+st.pct+'%"></i></u></a>'}
function acCatalog(){var s=acSection(),cat=ACAD.cat,f=ACAD.filter||'all',q=(ACAD.q||'').toLowerCase();document.title='SYAM.DEV — Courses';
 var h='<div class="vhead"><div class="crumb">Courses</div><div class="achead"><h1>Courses</h1>'+(ACAD.admin?'<a class="pbtn alt" href="#admin">Manage courses</a>':'')+'</div><p class="sub">Your learning library: interactive lessons, video courses, readings and labs, with your progress and notes saved to your account.</p></div>';
 h+='<div class="acbar2"><div class="acchips"><button class="pchip'+(f=='all'?' on':'')+'" data-f="all">All</button>'+cat.tracks.map(function(t){return '<button class="pchip'+(f==t.id?' on':'')+'" data-f="'+t.id+'"><i style="background:'+esc(t.color)+'"></i>'+esc(t.title)+'</button>'}).join('')+'</div><input class="acq" id="acq" type="search" placeholder="Filter courses…" value="'+esc(ACAD.q||'')+'"></div>';
 var any=false;
 cat.tracks.forEach(function(t){if(f!='all'&&f!=t.id)return;
  var cs=cat.courses.filter(function(c){return c.track_id==t.id&&(!q||(c.title+' '+c.description+' '+(AC_PROV[c.provider]||'')).toLowerCase().indexOf(q)>=0)});
  var builtin=t.id=='devops'&&(!q||'devops interactive linux git docker kubernetes terraform aws'.indexOf(q)>=0);
  if(!cs.length&&!builtin&&q)return;any=true;
  h+='<div class="acsec"><div class="acsh"><i style="background:'+esc(t.color)+'"></i><div><h3>'+esc(t.title)+'</h3>'+(t.description?'<p>'+esc(t.description)+'</p>':'')+'</div></div><div class="acgrid">';
  if(builtin){var b=acBuiltin();h+='<a class="accard star" href="#" data-learn="1" style="--tc:'+esc(t.color)+'"><span class="acband"></span><span class="acprov">Interactive · built in</span><b class="act">DevOps interactive course</b><span class="acd">Animated, hands-on lessons from Linux to Kubernetes, CI/CD, observability and SRE, with projects and interview prep.</span><span class="acfoot"><span>'+b.n+' lessons</span><span>'+(b.done?b.pct+'%':'')+'</span></span><u class="acbar"><i style="width:'+b.pct+'%"></i></u></a>'}
  h+=cs.map(acCard).join('');
  if(!cs.length&&!builtin)h+='<div class="acempty">No courses in this track yet.'+(ACAD.admin?' <a href="#admin">Add one</a>.':'')+'</div>';
  h+='</div></div>'});
 if(!any)h+='<div class="acempty big">No courses match “'+esc(ACAD.q)+'”.</div>';
 s.innerHTML=h;
 s.querySelectorAll('[data-f]').forEach(function(b){b.onclick=function(){ACAD.filter=b.dataset.f;acCatalog()}});
 var qi=$('acq');qi.oninput=function(){ACAD.q=qi.value;var pos=qi.selectionStart;acCatalog();var n=$('acq');n.focus();n.setSelectionRange(pos,pos)};
 s.querySelectorAll('[data-learn]').forEach(function(a){a.onclick=function(e){e.preventDefault();goView('learn')}})}
function acCourse(cid){var s=acSection(),c=ACAD.C[cid];if(!c){s.innerHTML='<div class="vhead"><div class="crumb"><a href="#courses">Courses</a></div><h1>Course not found</h1><p class="sub">It may have been removed or hidden.</p></div>';return}
 var t=ACAD.T[c.track_id]||{},st=acStats(cid),nx=acNextLesson(cid),started=st.done>0||((acLocal('syam:acadlast')||{})[cid]);document.title='SYAM.DEV — '+c.title;
 var h='<div class="vhead"><div class="crumb"><a href="#courses">Courses</a><i>/</i>'+esc(t.title||'')+'</div><div class="achead"><h1>'+esc(c.title)+'</h1>'+(ACAD.admin?'<a class="pbtn alt" href="#admin:course:'+cid+'">Edit</a>':'')+'</div>'+(c.description?'<p class="sub">'+esc(c.description)+'</p>':'')+'</div>';
 h+='<div class="acstat" style="--tc:'+esc(t.color||'#2f86ce')+'"><div class="acsl"><div class="acnums"><b>'+st.pct+'%</b><span>'+st.done+' of '+st.n+' lessons done'+(st.min?' · '+acMins(st.min)+' in total':'')+'</span></div><u class="acbar big"><i style="width:'+st.pct+'%"></i></u><div class="acmeta"><span class="acchip">'+esc(AC_PROV[c.provider]||'Other')+'</span>'+(c.level?'<span class="acchip">'+esc(c.level)+'</span>':'')+(c.published?'':'<span class="acchip warn">Hidden from learners</span>')+'</div></div><div class="hbtns">'+(nx?'<a class="pbtn" href="#lesson:'+nx.id+'">'+(st.done==st.n&&st.n?'Review':started?'Continue':'Start')+' →</a>':'')+(c.url?'<a class="pbtn alt" href="'+esc(c.url)+'" target="_blank" rel="noopener">Open on '+esc(AC_PROV[c.provider]||'site')+' ↗</a>':'')+'</div></div>';
 var mods=ACAD.CM[cid]||[];if(!mods.length)h+='<div class="acempty big">This course has no lessons yet.'+(ACAD.admin?' <a href="#admin:course:'+cid+'">Add the first lesson</a>.':'')+'</div>';
 h+='<div class="acmods">'+mods.map(function(m,mi){var ls=ACAD.ML[m.id],d=ls.filter(function(l){return ACAD.my[l.id]&&ACAD.my[l.id].done}).length,min=ls.reduce(function(a,l){return a+(l.minutes||0)},0);
  return '<details class="acmod"'+(d<ls.length||mods.length<4?' open':'')+'><summary><span class="acmn">'+(mi+1<10?'0':'')+(mi+1)+'</span><b>'+esc(m.title)+'</b><span class="acmc">'+d+'/'+ls.length+(min?' · '+acMins(min):'')+'</span></summary><ul>'+
   ls.map(function(l){var u=ACAD.my[l.id]||{};return '<li><a href="#lesson:'+l.id+'" class="'+(u.done?'done':'')+'"><span class="acck">'+(u.done?'✓':'')+'</span>'+acIcon(l.type)+'<span class="aclt">'+esc(l.title)+(l.published?'':' <em>hidden</em>')+'</span>'+(u.saved?'<span class="acsv" title="Saved">★</span>':'')+(u.note?'<span class="acnt" title="Has notes">✎</span>':'')+'<span class="acmin">'+acMins(l.minutes)+'</span></a></li>'}).join('')+'</ul></details>'}).join('')+'</div>';
 s.innerHTML=h}
function acLesson(lid){var s=acSection(),l=ACAD.L[lid],c=acCourseOf(lid);if(!l||!c){s.innerHTML='<div class="vhead"><div class="crumb"><a href="#courses">Courses</a></div><h1>Lesson not found</h1><p class="sub">It may have been removed or hidden.</p></div>';return}
 var m=ACAD.M[l.module_id],ls=ACAD.CL[c.id],i=ls.indexOf(l),prev=ls[i-1],next=ls[i+1],mi=(ACAD.CM[c.id]||[]).indexOf(m),u=ACAD.my[lid]||{},vid=l.type=='video'&&acYtId(l.url),host='';
 try{host=l.url?new URL(l.url).hostname.replace(/^www\./,''):''}catch(e){}
 document.title='SYAM.DEV — '+l.title;acSetLast(c.id,lid);
 var h='<div class="vhead"><div class="crumb"><a href="#courses">Courses</a><i>/</i><a href="#course:'+c.id+'">'+esc(c.title)+'</a><i>/</i>'+esc(m.title)+'</div><div class="achead"><h1>'+esc(l.title)+'</h1>'+(ACAD.admin?'<button class="pbtn alt" id="acedit">Edit</button>':'')+'</div>'+
  '<div class="acmeta"><span class="acchip">'+acIcon(l.type)+esc(AC_TYPES[l.type]||'Lesson')+'</span>'+(l.minutes?'<span class="acchip">'+acMins(l.minutes)+'</span>':'')+'<span class="acchip">Section '+(mi+1)+' · lesson '+(i+1)+' of '+ls.length+'</span>'+(l.published?'':'<span class="acchip warn">Hidden from learners</span>')+'</div></div>';
 if(vid)h+='<div class="acvideo"><div id="acplayer"></div></div>';
 else if(l.url)h+='<a class="acext" href="'+esc(l.url)+'" target="_blank" rel="noopener"><span class="acexi">'+acIcon(l.type)+'</span><span><b>Open '+(l.type=='video'?'the video':'this lesson')+' on '+esc(host)+' ↗</b><small>It opens in a new tab. Come back here to mark it done and keep your notes.</small></span></a>';
 h+='<div class="acact" id="acact"></div>';
 if(l.body)h+='<div class="acbody">'+acMd(l.body)+'</div>';
 if(l.links&&l.links.length)h+='<div class="aclinks"><h3>Links</h3>'+l.links.map(function(x){var hs='';try{hs=new URL(x.url).hostname.replace(/^www\./,'')}catch(e){}return '<a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+acIcon('link')+'<span>'+esc(x.title||x.url)+'</span><small>'+esc(hs)+'</small></a>'}).join('')+'</div>';
 h+='<div class="acnotes"><div class="acnh"><h3>My notes</h3><span id="acns"></span></div><textarea id="acnote" placeholder="Write what you learned, commands to remember, questions to look up…">'+esc(u.note||'')+'</textarea><small>Saved to your account automatically. Only you can see your notes.</small></div>';
 var rest=ACAD.ML[m.id].slice(ACAD.ML[m.id].indexOf(l)+1,ACAD.ML[m.id].indexOf(l)+6);
 if(rest.length)h+='<div class="acnext"><h3>Up next in this section</h3>'+rest.map(function(x){var ux=ACAD.my[x.id]||{};return '<a href="#lesson:'+x.id+'" class="'+(ux.done?'done':'')+'"><span class="acck">'+(ux.done?'✓':'')+'</span>'+acIcon(x.type)+'<span class="aclt">'+esc(x.title)+'</span><span class="acmin">'+acMins(x.minutes)+'</span></a>'}).join('')+'</div>';
 s.innerHTML=h;s.scrollTop=0;acPaintLessonState(l,prev,next);
 if($('acedit'))$('acedit').onclick=function(){if(typeof adEditLesson=='function')adEditLesson(l.id,function(){acRender(ACAD.view)})};
 var ta=$('acnote'),ns=$('acns'),tm=null;ta.oninput=function(){ns.textContent='Saving…';ns.className='';clearTimeout(tm);tm=setTimeout(function(){acPut(lid,{note:ta.value}).then(function(ok){ns.textContent=ok?'Saved':'Offline · kept on this device';ns.className=ok?'ok':'warn'})},900)};
 if(vid)acYtMount(l)}
function acPaintLessonState(l,prev,next){var a=$('acact');if(!a||ACAD.view.id!==l.id)return;var u=ACAD.my[l.id]||{};
 if(prev===undefined){var ls=ACAD.CL[(acCourseOf(l.id)||{}).id]||[],i=ls.indexOf(l);prev=ls[i-1];next=ls[i+1]}
 a.innerHTML='<button class="pbtn'+(u.done?' alt acdone':'')+'" id="acdn">'+(u.done?'✓ Done':'Mark as done')+'</button><button class="pbtn alt" id="acsv" aria-pressed="'+(!!u.saved)+'">'+(u.saved?'★ Saved':'☆ Save for later')+'</button><span class="acsp"></span>'+(prev?'<a class="pbtn alt" href="#lesson:'+prev.id+'" title="'+esc(prev.title)+'">← Previous</a>':'')+(next?'<a class="pbtn" href="#lesson:'+next.id+'" title="'+esc(next.title)+'">Next →</a>':'<a class="pbtn" href="#course:'+(acCourseOf(l.id)||{}).id+'">Back to course</a>');
 $('acdn').onclick=function(){var d=!(ACAD.my[l.id]&&ACAD.my[l.id].done);acPut(l.id,{done:d});trackDay();save();acPaintLessonState(l,prev,next);if(d){acToast('Nice, lesson done');if(next&&AC_YT.player==null){}}};
 $('acsv').onclick=function(){var v=!(ACAD.my[l.id]&&ACAD.my[l.id].saved);acPut(l.id,{saved:v});acPaintLessonState(l,prev,next);acToast(v?'Saved for later':'Removed from saved')}}
// ---------- Home: continue your courses ----------
function acHome(){var el=$('hacad');if(!el){var mods=$('hmods');if(!mods)return;var sec=document.createElement('div');sec.className='hsec';sec.innerHTML='<h3>Your courses</h3><div id="hacad"></div>';mods.closest('.hsec').before(sec);el=$('hacad')}
 if(!ACAD.ok){el.closest('.hsec').hidden=true;return}
 if(!ACAD.cat){el.innerHTML='<p class="acmuted">Loading your courses…</p>';acLoad();return}
 var last=acLocal('syam:acadlast')||{},ids=ACAD.cat.courses.map(function(c){return c.id}).filter(function(id){return last[id]||acStats(id).done}).sort(function(a,b){return ((last[b]||{}).at||0)-((last[a]||{}).at||0)}).slice(0,4);
 var saved=Object.keys(ACAD.my).filter(function(id){return ACAD.my[id].saved&&ACAD.L[id]}).slice(0,6);
 var h='';if(ids.length)h+='<div class="acgrid">'+ids.map(function(id){var c=ACAD.C[id],st=acStats(id),nx=acNextLesson(id),t=ACAD.T[c.track_id]||{};
  return '<a class="accard" href="#lesson:'+(last[id]&&ACAD.L[last[id].l]&&!(ACAD.my[last[id].l]&&ACAD.my[last[id].l].done)?last[id].l:(nx||{}).id||'')+'" style="--tc:'+esc(t.color||'#2f86ce')+'"><span class="acband"></span><span class="acprov">'+esc(t.title||'')+' · '+st.pct+'%</span><b class="act">'+esc(c.title)+'</b><span class="acd">Next: '+esc(nx?nx.title:'all done')+'</span><u class="acbar"><i style="width:'+st.pct+'%"></i></u></a>'}).join('')+'</div>';
 else h+='<div class="acempty">'+(ACAD.cat.courses.length?'You have not started a course yet. <a href="#courses">Browse '+ACAD.cat.courses.length+' course'+(ACAD.cat.courses.length==1?'':'s')+'</a>.':'No courses yet.'+(ACAD.admin?' <a href="#admin">Add your first course</a>.':''))+'</div>';
 if(saved.length)h+='<div class="acsaved"><small>Saved for later</small>'+saved.map(function(id){var l=ACAD.L[id];return '<a href="#lesson:'+id+'">'+acIcon(l.type)+esc(l.title)+'</a>'}).join('')+'</div>';
 el.innerHTML=h}
// ---------- Wiring ----------
(function(){
 var nav=$('nav'),dnav=$('dnav');
 if(nav&&!nav.querySelector('[data-v=courses]')){var sp=document.createElement('span');sp.dataset.v='courses';sp.setAttribute('role','button');sp.tabIndex=0;sp.textContent='Courses';nav.children[0].after(sp);sp.onclick=function(){goView('courses')};sp.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();goView('courses')}}}
 if(dnav&&!dnav.querySelector('[data-v=courses]')){var b=document.createElement('button');b.dataset.v='courses';b.textContent='Courses';dnav.querySelector('[data-v=learn]').after(b);b.onclick=function(){goView('courses')}}
 acSection();
 var _sv=setView;setView=function(v,arg){if(v!=='courses')acYtStop();_sv(v,arg);var bd=document.querySelector('.body');bd.classList.toggle('v-courses',v=='courses');$('vcourses').hidden=v!='courses';if(v=='courses'){acRender(arg);$('vcourses').scrollTop=0}};
 var _gv=goView;goView=function(v){if(v=='courses'){location.hash='courses';return}_gv(v)};
 var _rv=routeView;routeView=function(h){var m;if(h=='courses'){setView('courses',{page:'catalog'});renderTree();return true}
  if((m=h.match(/^(course|lesson):([\w-]+)$/))){setView('courses',{page:m[1],id:m[2]});renderTree();return true}return _rv(h)};
 var _rh=renderHome;renderHome=function(){_rh();acHome()};
 if(typeof kIndex=='function'){var _ki=kIndex;kIndex=function(){var fresh=!KX,r=_ki();if(fresh&&ACAD.cat){ACAD.cat.courses.forEach(function(c){r.push({t:'page',title:c.title,sub:'Course · '+(AC_PROV[c.provider]||'')+' · '+(ACAD.CL[c.id]||[]).length+' lessons',hay:(c.title+' '+c.description+' course').toLowerCase(),href:'course:'+c.id})});
   ACAD.cat.lessons.forEach(function(l){var c=acCourseOf(l.id);if(!c)return;r.push({t:'lesson',title:l.title,sub:c.title+' · '+(AC_TYPES[l.type]||''),hay:(l.title+' '+c.title+' '+(l.body||'').slice(0,400)+' '+((ACAD.my[l.id]||{}).note||'')).toLowerCase(),href:'lesson:'+l.id})})}return r}}
 if(ACAD.ok&&ACCT.on)acLoad();
})();
