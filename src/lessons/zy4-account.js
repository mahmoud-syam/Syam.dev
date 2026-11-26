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
