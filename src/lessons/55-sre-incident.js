(function(){
var ACT={ack:['acknowledge page',2],open:['open incident',3],status:['post status update',2],rc:['dig for root cause',40],rb:['roll back to v1.6',6],ver:['verify recovery',4],res:['resolve',1]};
var KEYS=['ack','open','status','rc','rb','ver','res'];
function need(S,k){if(k=='ack')return null;if(!S.d.ack)return 'acknowledge the page first';
 if(k=='open')return null;if(!S.d.open)return 'open the incident first: who is in charge?';
 if(k=='ver'&&!S.d.rb)return 'nothing to verify yet: mitigate first';
 if(k=='res'&&!S.d.ver)return 'verify recovery before resolving';
 if(k=='res'&&!S.d.status)return 'users and support have heard nothing yet';return null}
var SEV=['Severity levels',{t:'SEV1  many users down, money or data at risk',tone:'red'},'      all hands, updates every 30 min',{t:'SEV2  a feature broken or badly slow',tone:'gold'},'      on-call + owner team',{t:'SEV3  minor, workaround exists',tone:'green'},'      fix in working hours','','When unsure, pick the higher one.'];
var ROLES=['Incident roles',{t:'IC    Incident Commander: decides,',tone:'gold'},'      keeps order, does not debug',{t:'Ops   hands on keyboard: mitigates',tone:'gold'},{t:'Comms status page, support, managers',tone:'gold'},{t:'Scribe keeps the timeline',tone:'gold'},'','One channel: #inc-2311-checkout',{t:'Small team? One person can hold two roles.',tone:'green'}];
var MIT=['Mitigate first',{t:'roll back the last deploy',tone:'gold'},{t:'turn off a feature flag',tone:'gold'},{t:'fail over to the other region / replica',tone:'gold'},{t:'scale out, shed load, rate limit',tone:'gold'},'',{t:'Stop the bleeding, then find the cause.',tone:'green'},{t:'Root cause can wait for the postmortem.',tone:'red'}];
var COMM=['Status update template',{t:'[Investigating] 14:09',tone:'gold'},'Some customers cannot complete checkout.',"We are investigating. Next update 14:40.",{t:'[Mitigated] 14:24',tone:'gold'},'We rolled back a change. Checkout works.','We are monitoring.','',{t:'Plain words, impact first, next update time.',tone:'green'}];
function tl(S){var r=['timeline  (alert 14:02)'];S.log.forEach(function(x){r.push({t:x[0],tone:x[1]})});if(r.length==1)r.push('waiting for on-call…');return r.slice(0,1).concat(r.slice(1).slice(-8))}
function hm(m){var t=842+m,h=Math.floor(t/60),mm=t%60;return h+':'+(mm<10?'0':'')+mm}
function act(S,A,k){if(S.d.res)return;var why=need(S,k);if(why){A.term('term',['! '+why]);return}
 if(S.d[k]&&k!='rc'){A.term('term',['# already done: '+ACT[k][0]]);return}
 S.m+=ACT[k][1];S.d[k]=true;var bad=k=='rc'&&!S.d.rb;if(bad)S.rcFirst=true;
 S.log.push([hm(S.m)+' '+ACT[k][0]+(bad?'  (users still down)':''),bad?'red':k=='res'?'green':'gold']);
 if(k=='ack')A.send(['pager','oncall'],{label:'ack',tone:'red',ok:true});
 if(k=='open')A.send(['oncall','chan'],{label:'#inc',tone:'violet',ok:true});
 if(k=='status')A.send(['chan','status','users'],{label:'update',tone:'blue',ok:true});
 if(k=='rb'){A.send(['oncall','dep','web'],{label:'v1.6',tone:'green',ok:true});A.set('web',{status:'run',sub:'errors 0.2%'});A.set('dep',{title:'v1.6',sub:'rolled back'})}
 if(k=='res'){S.done=!S.rcFirst&&S.m<=30}
 A.set('info',{title:'timeline',rows:tl(S),hl:[]});
 var msg={ack:'# you own it now. Next: open the incident',open:'# IC: you. Channel #inc-2311-checkout. SEV1',status:'# status page: investigating, next 14:40',rc:S.d.rb?'# good: now there is time to dig':'! 40 min reading code while checkout is down',rb:'# deployed v1.6. Error rate falling…',ver:'# 5xx 0.2%, p95 290 ms: back to normal',res:S.done?'✓ resolved in '+S.m+' min. Postmortem next.':'! resolved, but '+S.m+' min: users waited too long'}[k];
 A.term('term',['$ '+ACT[k][0],msg],true);A.refresh()}
function reset(S,A){S.m=0;S.d={};S.log=[];S.rcFirst=false;S.done=false;A.set('web',{status:'fail',sub:'errors 38%'});A.set('dep',{title:'v1.7 (14:00)',sub:'last deploy'});A.set('info',{title:'timeline',rows:tl(S),hl:[]});A.term('term',['FIRING  CheckoutErrorBudgetFastBurn','# 5xx 38%  since 14:02'],true);A.refresh()}
var S0=function(){return {m:0,d:{},log:[],rcFirst:false,done:false}};
LESSON('sre','incident',{
 title:'Incident response',sub:'When the pager goes off: take charge, stop the damage first, keep people informed, then hand over to the postmortem.',time:'14 min',level:'Intermediate',
 S:S0(),
 legend:[['#e5534b','broken'],['#3fa456','healthy'],['#5a4aa8','incident channel'],['#3b82c4','status update']],
 hud:[{id:'t',l:'Elapsed',v:function(S){return S.m+' min'},lv:function(S){return S.m>30?'bad':S.m>15?'warn':'none'}},{id:'u',l:'Users',v:function(S){return S.d.rb?'OK':'failing'},lv:function(S){return S.d.rb?'good':'bad'}},{id:'s',l:'Status page',v:function(S){return S.d.status?'updated':'silent'},lv:function(S){return S.d.status?'good':'warn'}},{id:'p',l:'Phase',v:function(S){return S.d.res?'resolved':S.d.rb?'mitigated':S.d.ack?'responding':'alerting'},lv:function(S){return S.d.res?'good':S.d.rb?'warn':'bad'}}],
 nodes:[
  H.tile('pager',84,44,'PagerDuty','CheckoutErrors','red',{w:124,status:'fail'}),
  {t:'crowd',id:'oncall',x:262,y:60,tone:'violet',label:'on-call',n:1,w:44,anchor:[262,80]},
  H.tile('chan',84,140,'#inc-2311','incident channel','violet',{w:124}),
  H.tile('dep',262,160,'v1.7 (14:00)','last deploy','gold',{w:124}),
  H.tile('web',262,256,'checkout','errors 38%','red',{w:124,status:'fail'}),
  H.tile('status',84,236,'status page','status.shop.io','blue',{w:124}),
  {t:'crowd',id:'users',x:96,y:350,tone:'green',label:'users',n:3,w:64,anchor:[96,370]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'timeline',rows:['timeline  (alert 14:02)','waiting for on-call…'],fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'incident bot'}],
 links:[H.lk('pager','oncall','red'),H.lk('oncall','chan','violet',{dash:true}),H.lk('oncall','dep','gold',{dash:true}),H.lk('dep','web','gold'),H.lk('chan','status','blue',{dash:true}),H.lk('status','users','blue',{dash:true}),H.lk('users','web','green')],
 controls:{title:'Run the incident',groups:[{items:KEYS.map(function(k){return {label:ACT[k][0],wide:true,on:function(S){return !!S.d[k]},click:function(S,A){act(S,A,k)}}}).concat([{label:'start over',wide:true,click:function(S,A){reset(S,A)}}])}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. Owned, declared, communicated, rolled back, verified: users were back in '+S.m+' minutes. The root cause goes to the postmortem.':'Goal: checkout is failing since the 14:00 deploy. Get users working again within 30 minutes, keep them informed, then resolve.']},
 learn:[['Acknowledge fast',0],['Set the severity',1],['Assign roles',2],['Mitigate before root cause',3],['Communicate clearly',4],['Use runbooks',5],['Resolve and hand over',6]],
 steps:[
  {t:'The pager goes off',b:'An alert fires at 14:02: checkout errors burn the error budget fast. The on-call engineer acknowledges within minutes, so the alert does not escalate to the next person.',k:['idea','Key idea','Acknowledging says "I own this now". It does not mean you know the fix.'],pill:'setup',tt:'Page',focus:['pager','oncall','web'],S:S0(),
   set:{info:{title:'timeline',rows:['timeline  (alert 14:02)','waiting for on-call…'],hl:[]},web:{status:'fail',sub:'errors 38%'},dep:{title:'v1.7 (14:00)',sub:'last deploy'}},termClear:true,term:{term:['FIRING  CheckoutErrorBudgetFastBurn','# 5xx 38%  since 14:02','# escalates in 5 min if not acknowledged']},
   flows:[{path:['pager','oncall'],label:'page',tone:'red'}]},
  {t:'Severity',b:'Set a severity early. It decides who joins, how often you update, and how loud the response is. Many users unable to pay is SEV1.',k:['tip','Remember','Raising severity later is fine. Never wait for certainty to declare.'],pill:'idea',tt:'Severity',focus:['web','users'],
   set:{info:{title:'severity',rows:SEV,hl:[1,2,8]}},termClear:true,term:{term:['$ /incident declare sev1 "checkout 5xx"','# channel #inc-2311-checkout created']}},
  {t:'Roles',b:'The Incident Commander runs the response and makes decisions but does not debug. Ops works the fix, Comms talks to users and managers, a scribe writes the timeline.',k:['problem','Watch out','Ten people debugging in one chat with nobody in charge makes incidents longer.'],pill:'idea',tt:'Roles',focus:['oncall','chan'],
   set:{info:{title:'roles',rows:ROLES,hl:[1,3,4,5]}},termClear:true,term:{term:['# IC:    mahmoud','# Ops:   sara','# Comms: support-lead']},
   once:[{path:['oncall','chan'],label:'#inc',tone:'violet'}]},
  {t:'Mitigate first',b:'The first goal is to stop user pain, not to understand it. A deploy at 14:00 and errors at 14:02: roll back first, ask why later.',k:['idea','Key idea','"What changed?" is the most useful question in an incident. Check deploys, config and traffic.'],pill:'idea',tt:'Mitigate',focus:['dep','web'],
   set:{info:{title:'mitigate',rows:MIT,hl:[1,6,7]}},termClear:true,term:{term:['$ kubectl rollout history deploy/checkout','REVISION  CHANGE','41        v1.6','42        v1.7   ← 14:00']}},
  {t:'Communicate',b:'Post short, regular updates to the status page and stakeholders: what users see, what you are doing, when the next update comes. Silence makes people assume the worst.',k:['tip','Remember','Give a next-update time, and keep it even when nothing changed.'],pill:'idea',tt:'Comms',focus:['chan','status','users'],
   set:{info:{title:'status update',rows:COMM,hl:[1,2,3,8]}},termClear:true,term:{term:['$ statuspage incident create \\','    --status investigating \\','    --component checkout']},
   flows:[{path:['chan','status','users'],label:'update',tone:'blue'}]},
  {t:'Runbooks',b:'Every alert should link to a runbook: what it means, how to check, how to mitigate. At 3 am a clear checklist beats memory.',k:['tip','Remember','After each incident, update the runbook with what you wish it had said.'],pill:'idea',tt:'Runbooks',focus:['pager'],
   set:{info:{title:'runbook',rows:['runbook: CheckoutErrorBudgetFastBurn',{t:'1 check recent deploys (rollout history)',tone:'gold'},{t:'2 if a deploy < 1 h ago → roll back',tone:'gold'},{t:'3 check bank-api status page',tone:'gold'},{t:'4 check DB connections dashboard',tone:'gold'},{t:'5 escalate to payments team',tone:'gold'},'','link: wiki/runbooks/checkout-errors'],hl:[1,2]}},termClear:true,term:{term:['# alert annotation:','runbook_url: wiki/runbooks/checkout-errors']}},
  {t:'Resolve and hand over',b:'When metrics are back to normal and stay there, resolve the incident, post a final update, and schedule the postmortem while memories are fresh.',k:['problem','Watch out','Resolving too early: watch the graphs for 10-15 minutes after the fix.'],pill:'idea',tt:'Resolve',focus:['web','chan'],
   set:{info:{title:'timeline',rows:['timeline  (alert 14:02)',{t:'14:04 acknowledged',tone:'gold'},{t:'14:07 SEV1 declared, IC assigned',tone:'gold'},{t:'14:09 status: investigating',tone:'gold'},{t:'14:15 rolled back to v1.6',tone:'gold'},{t:'14:19 errors back to 0.2%',tone:'gold'},{t:'14:20 resolved, postmortem booked',tone:'green'}],hl:[6]}},termClear:true,term:{term:['$ /incident resolve','# postmortem doc created, due in 5 days']}},
  {t:'Try it: run the incident',b:'Checkout fails since the 14:00 deploy. You are on call. Take the actions in a sensible order and get users working again within 30 minutes.',k:['tip','Challenge','Try "dig for root cause" before rolling back. Watch the clock.'],pill:'problem',tt:'Try it',S:S0(),goal:true,focus:null,
   set:{info:{title:'timeline',rows:['timeline  (alert 14:02)','waiting for on-call…'],hl:[]},web:{status:'fail',sub:'errors 38%'},dep:{title:'v1.7 (14:00)',sub:'last deploy'}},termClear:true,term:{term:['FIRING  CheckoutErrorBudgetFastBurn','# 5xx 38%  since 14:02']}},
  {t:'Recap',b:'Acknowledge, declare a severity, assign an IC, mitigate before digging, update users on a schedule, verify, resolve, and book the postmortem.',k:['idea','Next up','Postmortems: learn from the incident without blaming anyone.'],pill:'recap',tt:'Recap',S:{m:18,d:{ack:1,open:1,status:1,rb:1,ver:1,res:1},log:[],rcFirst:false,done:true},
   set:{info:{title:'mitigate',rows:MIT,hl:[6,7]},web:{status:'run',sub:'errors 0.2%'},dep:{title:'v1.6',sub:'rolled back'}},termClear:true,term:{term:['✓ users back in 18 min','# root cause → postmortem']}}
 ]});
})();
