// ---------- Account sync (Cloudflare Access + Worker API on learn.mahmoud-syam.me) ----------
// Works only where the API exists; on GitHub Pages or a local file the course stays local-only.
var ACCT={on:/^learn\.mahmoud-syam\.me$/.test(location.hostname),email:null,state:'idle',at:0,t:null};
function acctPush(){if(!ACCT.email)return;clearTimeout(ACCT.t);ACCT.t=setTimeout(function(){ACCT.state='saving';acctPaint();
 fetch('/api/progress',{method:'PUT',credentials:'same-origin',redirect:'manual',headers:{'content-type':'application/json'},body:JSON.stringify(PS)})
 .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){ACCT.state='saved';ACCT.at=j.updated_at||Date.now();acctPaint()})
 .catch(function(){ACCT.state='offline';acctPaint()})},1500)}
function acctPull(){return fetch('/api/progress',{credentials:'same-origin',redirect:'manual'}).then(function(r){if(!r.ok)throw 0;return r.json()})
 .then(function(j){if(j&&j.data)syncMerge({ps:j.data,recent:[]});ACCT.state='saved';ACCT.at=j.updated_at||Date.now();acctPush();acctPaint()})}
function acctStart(){if(!ACCT.on)return;
 fetch('/api/me',{credentials:'same-origin',redirect:'manual'}).then(function(r){if(!r.ok)throw 0;return r.json()})
 .then(function(j){ACCT.email=j.email;ACCT.state='syncing';acctPaint();return acctPull()})
 .catch(function(){ACCT.email=null;ACCT.state='idle';acctPaint()})}
function acctAgo(t){var s=Math.round((Date.now()-t)/1000);return s<60?'just now':s<3600?Math.round(s/60)+' min ago':Math.round(s/3600)+' h ago'}
function acctPaint(){var el=$('hacct');if(!el)return;var h;
 if(!ACCT.on)h='<b>Your account</b><p>Accounts work on <b>learn.mahmoud-syam.me</b>. Sign in there and your progress follows you to every device.</p>';
 else if(!ACCT.email)h='<b>Your account</b><p>Sign in to save your progress online and keep it in sync on your phone and computer.</p><div class="hbtns"><a class="pbtn" href="/api/login">Sign in</a></div>';
 else{var st={syncing:'Syncing…',saving:'Saving…',saved:'✓ Saved '+acctAgo(ACCT.at),offline:'Offline. Will save when you are back.'}[ACCT.state]||'';
  h='<b>Your account</b><p>Signed in as <b>'+esc(ACCT.email)+'</b></p><span class="hok'+(ACCT.state=='offline'?' warn':'')+'">'+st+'</span><div class="hbtns"><a class="pbtn alt" href="/api/logout">Sign out</a></div>'}
 el.innerHTML=h}
(function(){var _save=save;save=function(){_save();acctPush()};
 var _rs=renderSync;renderSync=function(){_rs();var el=$('hsync');if(el&&!$('hacct')){var c=document.createElement('div');c.className='hcard';c.id='hacct';el.insertBefore(c,el.firstChild)}acctPaint()};
 addEventListener('online',acctPush);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState=='visible'&&ACCT.email)acctPull().catch(function(){})});
 acctStart()})();
// ---------- Profile menu in the top bar ----------
if(PS.name===undefined&&!ACCT.on)PS.name='Mahmoud';
function profInitials(){var n=(PS.name||'').trim();if(n){var w=n.split(/\s+/);return (w[0][0]+(w[1]?w[1][0]:'')).toUpperCase()}return ACCT.email?ACCT.email[0].toUpperCase():''}
function profIcon(){return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="8" cy="5.6" r="2.8"/><path d="M2.8 14c.6-2.8 2.7-4.3 5.2-4.3s4.6 1.5 5.2 4.3"/></svg>'}
function profPaintAvatar(){var b=$('pav');if(!b)return;var t=profInitials();b.innerHTML=t?esc(t):profIcon();b.classList.toggle('in',!!ACCT.email);b.title=ACCT.email?(PS.name?PS.name+' · ':'')+ACCT.email:'Profile'}
function profPaint(){profPaintAvatar();var m=$('pmenu');if(!m||m.hidden)return;
 var ks=lessonKeys().filter(function(k){return LESSONS[k]}),done=ks.filter(function(k){return PS.done[k]}).length,pct=ks.length?Math.round(done/ks.length*100):0,s=streak(),due=rvDue().length;
 var st={syncing:'Syncing…',saving:'Saving…',saved:'Saved '+acctAgo(ACCT.at),offline:'Offline · will save later'}[ACCT.state]||'';
 var h='<div class="pmh"><span class="pav big'+(ACCT.email?' in':'')+'">'+(profInitials()?esc(profInitials()):profIcon())+'</span><div class="pmid">'
  +'<div class="pmname" id="pmname">'+(PS.name?esc(PS.name):'<i>Add your name</i>')+'<button class="pmedit" id="pmedit" aria-label="Edit name" title="Edit name"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8.2 1.8l2 2L4 10H2V8z"/></svg></button></div>'
  +'<small>'+(ACCT.email?esc(ACCT.email):ACCT.on?'Not signed in':'Local profile · this browser only')+'</small></div></div>'
  +'<div class="pmsec"><div class="pmrow"><span>Lessons</span><b>'+done+' / '+ks.length+'</b></div><div class="pmbar"><i style="width:'+pct+'%"></i></div>'
  +'<div class="pmrow"><span>Study streak</span><b>'+(s?s+' day'+(s==1?'':'s'):'—')+'</b></div><div class="pmrow"><span>Review due</span><b>'+(due||'none')+'</b></div>'
  +(ACCT.email?'<div class="pmrow"><span>Cloud save</span><b class="'+(ACCT.state=='offline'?'warn':'ok')+'">'+st+'</b></div>':'')+'</div>'
  +'<div class="pmsec pmlinks"><a href="#home" data-pm>My progress</a><a href="#practice'+(due?'-review':'')+'" data-pm>'+(due?'Review now':'Practice')+'</a><button id="pmexp" data-pm>Export progress</button></div>'
  +'<div class="pmsec pmlinks">'+(ACCT.email?'<a href="/api/logout" class="pmout">Sign out</a>':ACCT.on?'<a href="/api/login">Sign in</a>':'<a href="https://learn.mahmoud-syam.me" target="_blank" rel="noopener">Open the academy ↗</a>')+'</div>';
 m.innerHTML=h;
 $('pmedit').onclick=function(e){e.stopPropagation();var n=$('pmname');n.innerHTML='<input id="pmin" maxlength="40" placeholder="Your name" value="'+esc(PS.name||'')+'">';var i=$('pmin');i.focus();i.select();
  var fin=0;function done(ok){if(fin)return;fin=1;if(ok){PS.name=i.value.trim();PS.nameAt=Date.now();save();if(VIEW=='home')renderHome()}profPaint()}
  i.onkeydown=function(e){if(e.key=='Enter')done(true);if(e.key=='Escape'){e.stopPropagation();done(false)}};i.onblur=function(){done(true)}};
 $('pmexp').onclick=function(){profClose();syncExport()};
 m.querySelectorAll('a[data-pm]').forEach(function(a){a.onclick=profClose})}
function profOpen(){var m=$('pmenu');m.hidden=false;$('pav').setAttribute('aria-expanded','true');profPaint()}
function profClose(){var m=$('pmenu');if(!m||m.hidden)return;m.hidden=true;$('pav').setAttribute('aria-expanded','false')}
(function(){var top=document.querySelector('.top');if(!top||$('prof'))return;
 var w=document.createElement('div');w.className='prof';w.id='prof';w.innerHTML='<button class="pav" id="pav" aria-haspopup="true" aria-expanded="false" aria-label="Profile"></button><div class="pmenu" id="pmenu" role="dialog" aria-label="Profile" hidden></div>';top.appendChild(w);
 $('pav').onclick=function(e){e.stopPropagation();$('pmenu').hidden?profOpen():profClose()};
 $('pmenu').addEventListener('click',function(e){e.stopPropagation()});
 document.addEventListener('click',profClose);
 document.addEventListener('keydown',function(e){if(e.key=='Escape')profClose()});
 var _ap=acctPaint;acctPaint=function(){_ap();profPaint()};
 var _sv=save;save=function(){_sv();profPaintAvatar()};
 profPaint()})();
