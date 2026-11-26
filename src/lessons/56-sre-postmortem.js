(function(){
var IT={vague:['be more careful',false,'vague: nobody can do or check it'],blame:['find who did it',false,'blame: people hide mistakes next time'],canary:['canary + rollback',true,'OPS-412  sara   due 15 Dec'],ci:['CI config check',true,'OPS-413  ali    due 8 Dec'],load:['load test',true,'OPS-414  mona   due 20 Dec'],dash:['more dashboards',false,'vague: which question would it answer?']};
var KEYS=Object.keys(IT);
function sel(S){return KEYS.filter(function(k){return S.s.indexOf(k)>=0})}
function good(S){var x=sel(S);return x.length==3&&x.every(function(k){return IT[k][1]})}
var DOC=['Postmortem INC-2311 (blameless)',{t:'Summary   checkout failed 18 min',tone:'gold'},{t:'Impact    ~4,100 failed payments, SEV1',tone:'gold'},{t:'Timeline  14:00 deploy … 14:20 resolved',tone:'gold'},{t:'Root cause + contributing factors',tone:'gold'},{t:'What went well / what went badly',tone:'gold'},{t:'Action items  owner + due date + ticket',tone:'gold'},'','Written within 5 days, shared widely.'];
var BL=['Blameless',{t:'not: "Ali broke production"',tone:'red'},{t:'but: "a one-character config change',tone:'green'},{t:'      reached all users unchecked"',tone:'green'},'','People act on what the system lets them do.','Fix the system, and the next person','cannot make the same mistake.'];
var TL=['Timeline (UTC+2)',{t:'14:00  v1.7 deployed to 100%',tone:'gold'},{t:'14:02  burn-rate alert fires',tone:'gold'},{t:'14:04  on-call acknowledges',tone:'gold'},{t:'14:07  SEV1, IC assigned',tone:'gold'},{t:'14:15  rollback to v1.6',tone:'gold'},{t:'14:19  error rate normal',tone:'green'},{t:'14:20  resolved',tone:'green'},'Detect 2 min · mitigate 15 min'];
function tbl(S){var r=['Action items'];sel(S).forEach(function(k){r.push({t:(IT[k][1]?'✓ ':'✗ ')+IT[k][0],tone:IT[k][1]?'green':'red'});r.push('    '+IT[k][2])});if(r.length==1)r.push('pick the items to add to the report');return r.slice(0,9)}
function tog(S,A,k){var i=S.s.indexOf(k);if(i>=0)S.s.splice(i,1);else S.s.push(k);
 var g=sel(S).filter(function(x){return IT[x][1]}).length,b=sel(S).length-g;
 A.set('act',{title:g+' good, '+b+' weak',sub:good(S)?'ready for review':'pick the fixes',status:good(S)?'run':b?'fail':'stop'});A.set('info',{title:'action items',rows:tbl(S),hl:[]});
 if(i<0)A.send([IT[k][1]?'w5':'w1','act'],{label:IT[k][1]?'fix':'?',tone:IT[k][1]?'green':'red',ok:IT[k][1]});
 A.term('term',[good(S)?'✓ 3 action items, each owned and dated':'# '+g+' good, '+b+' weak'].concat(sel(S).filter(function(x){return !IT[x][1]}).map(function(x){return '! '+IT[x][0]+': '+IT[x][2].split(':')[0]})),true);A.refresh()}
LESSON('sre','postmortem',{
 title:'Postmortems',sub:'Learn from every incident without blame, find what really allowed it, and make sure it cannot happen the same way twice.',time:'13 min',level:'Intermediate',
 S:{s:[]},
 legend:[['#e5534b','symptom'],['#e8a33a','cause'],['#3fa456','fix']],
 hud:[{id:'i',l:'Incident',v:'INC-2311',lv:'none'},{id:'w',l:'Whys asked',v:'5',lv:'none'},{id:'g',l:'Good actions',v:function(S){return sel(S).filter(function(k){return IT[k][1]}).length+' / 3'},lv:function(S){return good(S)?'good':'warn'}},{id:'b',l:'Weak',v:function(S){return String(sel(S).filter(function(k){return !IT[k][1]}).length)},lv:function(S){return sel(S).some(function(k){return !IT[k][1]})?'bad':'good'}}],
 nodes:[
  H.tile('w1',190,30,'1  checkout 5xx 38%','payment calls to bank-api time out','red',{w:300}),
  H.tile('w2',190,100,'2  requests queue for a connection','only 5 connections open to bank-api','gold',{w:300}),
  H.tile('w3',190,170,'3  pool size changed 50 → 5','typo in the v1.7 values.yaml','gold',{w:300}),
  H.tile('w4',190,240,'4  not caught before production','staging traffic too low, no load test','gold',{w:300}),
  H.tile('w5',190,310,'5  every user got v1.7 at once','no canary, no automatic rollback','gold',{w:300}),
  H.tile('act',190,392,'action items','pick the fixes','green',{w:200,status:'none'}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'the report',rows:DOC,fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'review'}],
 links:[H.lk('w1','w2','red',{dash:true}),H.lk('w2','w3','gold',{dash:true}),H.lk('w3','w4','gold',{dash:true}),H.lk('w4','w5','gold',{dash:true}),H.lk('w5','act','green')],
 controls:{title:'Choose the action items',groups:[{items:KEYS.map(function(k){return {label:IT[k][0],wide:true,on:function(S){return S.s.indexOf(k)>=0},click:function(S,A){tog(S,A,k)}}})}]},
 goal:function(S){var ok=good(S);return [ok,ok?'Done. Each fix closes a gap from the five whys, has an owner and a date, and is tracked as a ticket.':'Goal: pick the action items that would stop this incident from happening again. Leave out anything vague or blaming.']},
 learn:[['Know why postmortems matter',0],['Keep them blameless',1],['Use a clear structure',2],['Build the timeline',3],['Ask five whys',4],['Write good action items',5],['Follow up',6]],
 steps:[
  {t:'Why write a postmortem',b:'An incident is expensive. The postmortem turns that cost into learning: what happened, why the system allowed it, and what changes so it does not repeat.',k:['idea','Key idea','The goal is not a document. The goal is the changes the document leads to.'],pill:'setup',tt:'Why',focus:['w1'],S:{s:[]},
   set:{info:{title:'the report',rows:DOC,hl:[]},act:{title:'action items',sub:'pick the fixes',status:'none'}},termClear:true,term:{term:['# INC-2311 resolved 14:20','# postmortem due in 5 days']}},
  {t:'Blameless',b:'Ask how the system let this happen, not who did it. If people fear blame they hide details, and the same failure comes back.',k:['problem','Watch out','"Human error" is never a root cause. It is where the investigation starts.'],pill:'idea',tt:'Blameless',focus:['w3'],
   set:{info:{title:'blameless',rows:BL,hl:[1,2,3]}},termClear:true,term:{term:['# focus on: what made the typo easy','# and what let it reach every user']}},
  {t:'Structure',b:'A postmortem has a summary, user impact, a timeline, root cause and contributing factors, what went well and badly, and action items with owners.',k:['tip','Remember','Use the same template every time so readers know where to look.'],pill:'idea',tt:'Template',focus:null,
   set:{info:{title:'the report',rows:DOC,hl:[1,2,3,4,5,6]}},termClear:true,term:{term:['$ cp templates/postmortem.md \\','    postmortems/2026-11-inc-2311.md']}},
  {t:'Timeline',b:'Rebuild the timeline from the incident channel, alerts and deploy logs. Exact times show how long it took to detect and to mitigate.',k:['tip','Remember','Track time to detect and time to mitigate across incidents. They show whether you are improving.'],pill:'idea',tt:'Timeline',focus:null,
   set:{info:{title:'timeline',rows:TL,hl:[1,2,5,8]}},termClear:true,term:{term:['# sources: #inc-2311 chat, alert history,','# kubectl rollout history, status page']}},
  {t:'Five whys',b:'Start from the symptom and ask why until you reach something you can change. Here the typo is one cause, but the bigger gaps are no load test and no canary.',k:['idea','Key idea','Most incidents have several contributing factors. List them all, not just the last one.'],pill:'idea',tt:'Whys',focus:['w1','w2','w3','w4','w5'],
   set:{info:{title:'the report',rows:DOC,hl:[4]}},termClear:true,term:{term:['# root cause: config change reduced the','#   bank-api pool from 50 to 5','# contributing: no load test, no canary']},
   flows:[{path:['w1','w2','w3','w4','w5'],label:'why?',tone:'gold'}]},
  {t:'Good action items',b:'A good action item is specific, has one owner and a due date, and is tracked as a ticket. It should prevent the problem, or detect it faster, or limit the damage.',k:['problem','Watch out','"Be more careful" is not an action item. Nobody can do it, and nobody can check it was done.'],pill:'idea',tt:'Actions',focus:['w5','act'],
   set:{info:{title:'action items',rows:['Action items that work',{t:'prevent   CI check on config values',tone:'green'},{t:'detect    alert on connection pool full',tone:'green'},{t:'limit     canary 5% with auto-rollback',tone:'green'},'','each one: owner · due date · ticket','',{t:'Avoid: vague promises, blame, "more docs"',tone:'red'}],hl:[1,2,3,5]}},termClear:true,term:{term:['$ jira create OPS-412 \\','    "canary + auto-rollback for checkout"']}},
  {t:'Share and follow up',b:'Share the postmortem widely, review it in a meeting, and track the action items until they are closed. Unfinished action items mean the incident can repeat.',k:['tip','Remember','A short monthly review of open postmortem items keeps them from being forgotten.'],pill:'idea',tt:'Follow up',focus:['act'],
   set:{info:{title:'the report',rows:DOC,hl:[6,8]}},termClear:true,term:{term:['# open postmortem actions: 3','# overdue: 0']}},
  {t:'Try it: pick the action items',b:'You have the five whys. Choose the action items that go into the report. Each should close one of the gaps you found.',k:['tip','Challenge','For each item ask: who does it, by when, and how would we know it is done?'],pill:'problem',tt:'Try it',S:{s:[]},goal:true,focus:null,
   set:{info:{title:'action items',rows:tbl({s:[]}),hl:[]},act:{title:'action items',sub:'pick the fixes',status:'none'}},termClear:true,term:{term:['# draft: postmortem INC-2311']}},
  {t:'Recap',b:'Write postmortems without blame, rebuild the timeline, ask why until you find what the system allowed, and turn it into owned, dated, tracked action items.',k:['idea','Next up','Capacity and load testing: know your limits before users find them.'],pill:'recap',tt:'Recap',S:{s:['canary','ci','load']},
   set:{info:{title:'action items',rows:tbl({s:['canary','ci','load']}),hl:[]},act:{title:'3 good, 0 weak',sub:'ready for review',status:'run'}},termClear:true,term:{term:['✓ 3 action items, each owned and dated']}}
 ]});
})();
