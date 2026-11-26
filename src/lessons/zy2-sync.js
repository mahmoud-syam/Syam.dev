// ---------- Move progress between devices + install as an app ----------
var INSTALL_EVT=null;
function syncData(){return {v:1,app:'syam-course',at:new Date().toISOString(),ps:PS,recent:kRecent()}}
function syncCode(){return 'SYAM1.'+btoa(unescape(encodeURIComponent(JSON.stringify(syncData()))))}
function syncParse(t){t=(t||'').trim();if(!t)throw new Error('Paste a code or choose a file first.');
 var j;try{if(t.indexOf('SYAM1.')===0)j=JSON.parse(decodeURIComponent(escape(atob(t.slice(6).replace(/\s+/g,'')))));else j=JSON.parse(t)}catch(e){throw new Error('This is not a valid progress code or file.')}
 if(!j||j.app!=='syam-course'||!j.ps||typeof j.ps!=='object')throw new Error('This code is not from this course.');return j}
function syncMerge(inc){var a=PS,b=inc.ps,n0=Object.keys(a.done||{}).length,pq0=Object.keys(a.pq||{}).length;
 a.done=a.done||{};Object.keys(b.done||{}).forEach(function(k){if(LESSONS[k])a.done[k]=1});
 a.open=a.open||{};Object.keys(b.open||{}).forEach(function(k){a.open[k]=1});
 a.pq=a.pq||{};Object.keys(b.pq||{}).forEach(function(m){var x=b.pq[m],y=a.pq[m];if(x&&x.t&&(!y||x.r/x.t>y.r/y.t))a.pq[m]={r:x.r,t:x.t}});
 a.days=a.days||{};Object.keys(b.days||{}).forEach(function(d){a.days[d]=Math.max(a.days[d]||0,b.days[d]||0)});
 a.doneAt=a.doneAt||{};Object.keys(b.doneAt||{}).forEach(function(k){if(!a.doneAt[k]||b.doneAt[k]<a.doneAt[k])a.doneAt[k]=b.doneAt[k]});
 a.rv=a.rv||{};Object.keys(b.rv||{}).forEach(function(k){var x=b.rv[k],y=a.rv[k];if(!y||x.box>y.box||(x.box==y.box&&x.due>y.due))a.rv[k]=x});
 if(!a.name&&b.name)a.name=b.name;
 if(b.last&&LESSONS[b.last.k]&&(!a.last||(b.lastAt||0)>(a.lastAt||0))){a.last={k:b.last.k,s:b.last.s};a.lastAt=b.lastAt||Date.now()}
 try{var r=kRecent();(inc.recent||[]).forEach(function(q){if(r.indexOf(q)<0)r.push(q)});localStorage.setItem('syam:recent',JSON.stringify(r.slice(0,5)))}catch(e){}
 save();renderTree();if(VIEW=='home')renderHome();if(VIEW=='practice'){pqChips();pqStats()}
 return {lessons:Object.keys(a.done).length-n0,scores:Object.keys(a.pq).length-pq0,total:Object.keys(a.done).length}}
function mdlOpen(title,html){$('mdlt').textContent=title;$('mbody').innerHTML=html;$('mdl').hidden=false}
function mdlClose(){$('mdl').hidden=true}
function syncExport(){var code=syncCode(),n=Object.keys(PS.done||{}).length;
 mdlOpen('Export your progress','<p>Send this code to your other device (WhatsApp, Telegram or email), then open the course there and choose <b>Import</b>. It holds '+n+' finished lesson'+(n==1?'':'s')+', your practice scores and where you stopped.</p><textarea id="scode" readonly>'+esc(code)+'</textarea><div class="hbtns"><button class="pbtn" id="scopy">Copy code</button>'+(/github\.io$|localhost|^learn\.mahmoud-syam\.me$/.test(location.hostname)||location.protocol=='file:'?'<button class="pbtn alt" id="sfile">Download file</button>':'')+'</div>');
 $('scode').onclick=function(){this.select()};
 $('scopy').onclick=function(){copyText(code,this);var b=this;setTimeout(function(){b.textContent='Copy code'},1300)};
 if($('sfile'))$('sfile').onclick=function(){var blob=new Blob([JSON.stringify(syncData(),null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='syam-progress-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}}
function syncImport(){mdlOpen('Import progress','<p>Paste the code from your other device, or choose the progress file. Nothing is lost: lessons you finished here stay finished, and the best practice score is kept.</p><textarea id="sin" placeholder="SYAM1.…"></textarea><input type="file" id="sinf" accept=".json,application/json,text/plain"><div class="hbtns"><button class="pbtn" id="sgo">Import</button></div><div id="smsg"></div>');
 $('sinf').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){$('sin').value=rd.result};rd.readAsText(f)};
 $('sgo').onclick=function(){var m=$('smsg');try{var r=syncMerge(syncParse($('sin').value));m.className='mmsg good';m.textContent='Imported. '+(r.lessons?r.lessons+' new finished lesson'+(r.lessons==1?'':'s')+', ':'')+(r.scores?r.scores+' new practice score'+(r.scores==1?'':'s')+', ':'')+r.total+' lesson'+(r.total==1?'':'s')+' done in total.'}catch(e){m.className='mmsg bad';m.textContent=e.message}}}
function isStandalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
function renderSync(){var el=$('hsync');if(!el)return;var ios=/iPhone|iPad|iPod/.test(navigator.userAgent),inst;
 if(isStandalone())inst='<span class="hok">✓ Installed. You are using the app.</span>';
 else if(INSTALL_EVT)inst='<div class="hbtns"><button class="pbtn" id="sinst">Install app</button></div>';
 else if(ios)inst='<p>On iPhone or iPad: open this site in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>';
 else if(location.protocol!=='https:'||!/github\.io$|localhost|^learn\.mahmoud-syam\.me$/.test(location.hostname))inst='<p>Open the live site to install it:<br><b>learn.mahmoud-syam.me</b></p>';
 else inst='<p>In Chrome or Edge: open the browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>';
 el.innerHTML='<div class="hcard"><b>Move your progress</b><p>Progress is saved in this browser only. Export it here and import it on your phone or another computer.</p><div class="hbtns"><button class="pbtn" id="sexp">Export</button><button class="pbtn alt" id="simp">Import</button></div></div><div class="hcard"><b>Install as an app</b><p>Open the course from your home screen, full screen, and keep studying when you are offline.</p>'+inst+'</div>';
 $('sexp').onclick=syncExport;$('simp').onclick=syncImport;
 if($('sinst'))$('sinst').onclick=function(){var e=INSTALL_EVT;if(!e)return;e.prompt();e.userChoice.then(function(){INSTALL_EVT=null;renderSync()})}}
addEventListener('beforeinstallprompt',function(e){e.preventDefault();INSTALL_EVT=e;renderSync()});
addEventListener('appinstalled',function(){INSTALL_EVT=null;renderSync()});
$('mdlx').onclick=mdlClose;$('pexp').onclick=syncExport;$('pimp').onclick=syncImport;$('mdl').addEventListener('mousedown',function(e){if(e.target===$('mdl'))mdlClose()});
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&!$('mdl').hidden)mdlClose()});
(function(){var _rh=renderHome;renderHome=function(){_rh();renderSync()}})();
if('serviceWorker' in navigator&&location.protocol==='https:'&&/github\.io$|^learn\.mahmoud-syam\.me$/.test(location.hostname)){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
