// ---------- Study streak, spaced review, focus mode ----------
if(!PS.days)PS.days={};if(!PS.rv)PS.rv={};if(!PS.doneAt)PS.doneAt={};
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function trackDay(){var k=dayKey();PS.days[k]=(PS.days[k]||0)+1}
function streak(){var d=new Date(),n=0;if(!PS.days[dayKey(d)])d.setDate(d.getDate()-1);while(PS.days[dayKey(d)]){n++;d.setDate(d.getDate()-1)}return n}
function bestStreak(){var ks=Object.keys(PS.days).sort(),best=0,run=0,prev=null;ks.forEach(function(k){var t=new Date(k+'T12:00:00');if(prev&&Math.round((t-prev)/864e5)==1)run++;else run=1;best=Math.max(best,run);prev=t});return best}
// Spaced review (Leitner boxes): wrong → back tomorrow; right → 3, 7, 14, 30 days.
var RVGAP=[1,3,7,14,30];
function rvKey(q){return q.m+'|'+q.q}
function rvDue(){var now=Date.now(),out=[];PQB.forEach(function(q,i){var r=PS.rv[rvKey(q)];if(r&&r.due<=now&&r.box<RVGAP.length)out.push(i)});return out}
function rvUpdate(qi,right,inReview){var q=PQB[qi],k=rvKey(q),r=PS.rv[k];
 if(!right){PS.rv[k]={box:0,due:Date.now()+RVGAP[0]*864e5};save();return}
 if(!r)return;if(!inReview&&r.due>Date.now())return;r.box++;r.due=Date.now()+(RVGAP[r.box]||RVGAP[RVGAP.length-1])*864e5;save()}
// Focus mode: hide the course tree so the lesson gets the width (desktop).
function setFocus(on){PS.focus=!!on;document.documentElement.classList.toggle('focus',PS.focus);var b=$('focus');if(b){b.textContent=PS.focus?'Exit focus':'Focus';b.setAttribute('aria-pressed',PS.focus)}save();requestAnimationFrame(function(){if(typeof fitHead=='function'){fitHead();fitSteps();fitCmds()}})}
function renderExtras(){var st=$('hstats');if(!st)return;var s=streak(),due=rvDue().length,nums=st.querySelector('.hnums');
 if(nums){nums.insertAdjacentHTML('afterbegin','<div><span>Study streak</span><b>'+(s?s+' day'+(s==1?'':'s'):'start today')+'</b></div>');
  nums.insertAdjacentHTML('beforeend','<div><span>Review due</span><b>'+(due?'<a href="#practice-review" style="color:inherit">'+due+' question'+(due==1?'':'s')+'</a>':'none')+'</b></div>')}
 var cells='',d=new Date();d.setDate(d.getDate()-27);for(var i=0;i<28;i++){var k=dayKey(d),n=PS.days[k]||0,lv=n==0?0:n<5?1:n<15?2:3;cells+='<i class="l'+lv+'" title="'+k+': '+n+' step'+(n==1?'':'s')+'"></i>';d.setDate(d.getDate()+1)}
 st.insertAdjacentHTML('beforeend','<div class="hdays"><small>Last 4 weeks · best streak '+bestStreak()+' day'+(bestStreak()==1?'':'s')+'</small><div class="hgrid28">'+cells+'</div></div>');
}
(function(){var _rh=renderHome;renderHome=function(){_rh();renderExtras()};
 var tools=document.querySelector('.tools');if(tools&&!$('focus')){var b=document.createElement('button');b.className='tool focusb';b.id='focus';b.title='Focus mode (F)';b.textContent='Focus';b.onclick=function(){setFocus(!PS.focus)};tools.insertBefore(b,tools.firstChild)}
 if(PS.focus)setFocus(true);
 document.addEventListener('keydown',function(e){if(VIEW!='learn'||/INPUT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if((e.key||'').toLowerCase()=='f'){e.preventDefault();setFocus(!PS.focus)}})})();
