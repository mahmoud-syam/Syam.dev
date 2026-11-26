(function(){
var REQ=2000000,BAD=1600;
var T={'99':0.01,'99.9':0.001,'99.99':0.0001};
function allowed(S){return Math.round(REQ*T[S.slo])}
function used(S){return Math.round(BAD/allowed(S)*100)}
function fmt(x){return x.toLocaleString('en-US')}
var DEF=['Three words',{t:'SLI  what you measure',tone:'gold'},'     good requests / valid requests',{t:'SLO  the target you aim for',tone:'gold'},'     99.9% of requests OK over 30 days',{t:'SLA  the promise in a contract',tone:'gold'},'     looser than the SLO, with penalties','',{t:'SLO = internal goal. SLA = legal promise.',tone:'green'}];
var NINES=['Downtime allowed per 30 days',{t:'99%       7 h 12 m',tone:'gold'},{t:'99.9%     43 m',tone:'gold'},{t:'99.95%    21 m',tone:'gold'},{t:'99.99%    4 m 19 s',tone:'gold'},'','Each extra nine costs a lot more:','redundancy, automation, on-call.',{t:'Your SLO can\'t beat your dependencies.',tone:'red'}];
var POL=['Error budget policy (agreed with product)',{t:'budget < 50% used   ship normally',tone:'green'},{t:'50-75% used         ship, but review risk',tone:'gold'},{t:'over 75% used       freeze features:',tone:'red'},{t:'                    reliability work only',tone:'red'},{t:'budget gone         stop all but fixes',tone:'red'},'','Decided before the incident, not during it.'];
var BURN=['Burn-rate alert',{t:'- alert: ErrorBudgetFastBurn',tone:'gold'},'  expr: |','    sum(rate(http_requests_total{status=~"5.."}[1h]))','    / sum(rate(http_requests_total[1h]))','    > 14.4 * 0.001',{t:'  labels: { severity: page }',tone:'green'},'14.4x for 1 h burns 2% of a 30-day budget.','Slow burns (6 h, 3 days) open a ticket.'];
function rows(S){var u=used(S);return ['SLO '+S.slo+'%  over 30 days',{t:'requests so far    '+fmt(REQ),tone:'gold'},{t:'failed so far      '+fmt(BAD),tone:'gold'},{t:'budget (failures)  '+fmt(allowed(S)),tone:'gold'},{t:'budget used        '+u+' %',tone:u>75?'red':u>50?'gold':'green'},'','day 20 of 30']}
function setslo(S,A,k){S.slo=k;S.dec=null;var u=used(S);A.set('info',{title:'error budget',rows:rows(S),hl:[4]});A.set('budget',{title:u+'% used',sub:fmt(BAD)+' of '+fmt(allowed(S)),status:u>75?'fail':u>50?'stop':'run'});
 A.term('term',['$ slo-report --service checkout --slo '+k,'budget '+fmt(allowed(S))+' failed requests / 30 d',(u>75?'! ':'')+'used '+u+'% after 20 days'],true);A.refresh()}
function decide(S,A,d){S.dec=d;var u=used(S),need=u>75?'freeze':'ship',ok=d==need;
 if(S.slo=='99.9'&&ok)S.done=true;
 A.set('rel',{status:d=='ship'?'run':'stop',sub:d=='ship'?'deploying':'on hold'});
 if(d=='ship')A.send(['dev','rel','web'],{label:'v2.0',tone:ok?'green':'red',ok:ok});
 A.set('info',{title:'policy',rows:POL,hl:[u>75?3:u>50?2:1]});
 A.term('term',[(ok?'✓ ':'! ')+(d=='ship'?'ship v2.0':'freeze features')+' with '+u+'% of the budget used',ok?(d=='ship'?'# within budget: users can take the risk':'# reliability work first: fix the cause'):(d=='ship'?'# policy says freeze above 75%':'# budget is fine: no need to freeze'),S.slo!='99.9'?'! but the SLO agreed with product is 99.9%':''].filter(Boolean),true);A.refresh()}
LESSON('sre','slo',{
 title:'SLI, SLO & error budgets',sub:'Decide how reliable is reliable enough, measure it, and use the gap to balance speed and stability.',time:'15 min',level:'Intermediate',
 S:{slo:'99.9',dec:null,done:false},
 legend:[['#3fa456','within budget'],['#e8a33a','watch'],['#e5534b','budget burning']],
 hud:[{id:'s',l:'SLO',v:function(S){return S.slo+'%'},lv:'none'},{id:'u',l:'Budget used',v:function(S){return used(S)+'%'},lv:function(S){var u=used(S);return u>75?'bad':u>50?'warn':'good'}},{id:'d',l:'Window',v:'day 20 / 30',lv:'none'},{id:'r',l:'Decision',v:function(S){return S.dec||'—'},lv:function(S){return !S.dec?'none':S.done?'good':'warn'}}],
 nodes:[
  {t:'crowd',id:'users',x:96,y:60,tone:'green',label:'users',n:3,w:64,anchor:[96,80]},
  H.tile('web',262,48,'checkout','2.0 M requests','green',{w:128,status:'run'}),
  H.tile('sli',262,138,'SLI 99.92%','good / valid','blue',{w:128}),
  H.tile('budget',262,228,'80% used',' ','red',{w:128,status:'fail'}),
  {t:'crowd',id:'dev',x:96,y:310,tone:'violet',label:'dev team',n:3,w:64,anchor:[96,330]},
  H.tile('rel',262,330,'release v2.0','waiting','gold',{w:128,status:'none'}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'definitions',rows:DEF,fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('users','web','green'),H.lk('web','sli','blue',{dash:true}),H.lk('sli','budget','blue',{dash:true}),H.lk('dev','rel','violet'),H.lk('budget','rel','red',{dash:true})],
 controls:{title:'Spend the error budget',groups:[{name:'SLO',items:['99','99.9','99.99'].map(function(k){return {label:k+'%',wide:true,on:function(S){return S.slo==k},click:function(S,A){setslo(S,A,k)}}})},{name:'Decision',items:[['ship','ship v2.0'],['freeze','freeze']].map(function(x){return {label:x[1],wide:true,on:function(S){return S.dec==x[0]},click:function(S,A){decide(S,A,x[0])}}})}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. At 99.9% the team has used 80% of the budget with 10 days left. The policy says freeze features and fix reliability first.':'Goal: product agreed on 99.9%. Check the budget, compare it with the policy, and decide: ship v2.0 this week, or freeze?']},
 learn:[['Know why 100% is wrong',0],['Choose an SLI',1],['Set an SLO',2],['Tell SLO from SLA',3],['Use the error budget',4],['Alert on burn rate',5],['Follow a budget policy',6]],
 steps:[
  {t:'100% is the wrong target',b:'Users cannot tell 99.99% from 100%, but chasing 100% stops every release. SRE picks a target that keeps users happy and leaves room to change things.',k:['idea','Key idea','Reliability is a feature. You decide how much of it to build, like any other feature.'],pill:'setup',tt:'Why',focus:['users','web'],S:{slo:'99.9',dec:null,done:false},
   set:{info:{title:'definitions',rows:DEF,hl:[]},budget:{title:'80% used',sub:'1,600 of 2,000',status:'fail'},rel:{status:'none',sub:'waiting'}},termClear:true,term:{term:['# every change is a risk','# no change at all = no new features']},
   flows:[{path:['users','web'],label:'requests',tone:'green'}]},
  {t:'SLI: measure what users feel',b:'A service level indicator is a ratio: good events divided by valid events. For a web service: requests that succeed and are fast enough, measured at the load balancer.',k:['tip','Remember','Measure close to the user. A healthy pod behind a broken load balancer is still an outage.'],pill:'idea',tt:'SLI',focus:['web','sli'],
   set:{info:{title:'definitions',rows:DEF,hl:[1,2]}},termClear:true,term:{term:['# availability SLI','good  = status < 500','valid = all requests (not health checks)','# latency SLI: share faster than 300 ms']},
   once:[{path:['web','sli'],label:'good/valid',tone:'blue'}]},
  {t:'SLO: the target',b:'A service level objective is the target for an SLI over a window, like 99.9% of requests OK over 30 days. Each extra nine allows ten times less failure.',k:['problem','Watch out','If checkout calls bank-api at 99.95%, checkout cannot promise 99.99%.'],pill:'idea',tt:'SLO',focus:['sli'],
   set:{info:{title:'the nines',rows:NINES,hl:[2,8]}},termClear:true,term:{term:['# 30 days = 43,200 minutes','# 99.9% → 0.1% = 43.2 minutes']}},
  {t:'SLA: the promise',b:'A service level agreement is a contract with customers, with refunds or penalties when it is missed. It is set looser than the SLO, so you notice and fix problems first.',k:['tip','Remember','Example: SLO 99.9% internally, SLA 99.5% to customers.'],pill:'idea',tt:'SLA',focus:['users'],
   set:{info:{title:'definitions',rows:DEF,hl:[5,6,8]}},termClear:true,term:{term:['# SLA 99.5%  → credit if missed','# SLO 99.9%  → team acts long before']}},
  {t:'Error budget',b:'The error budget is 100% minus the SLO. At 99.9% with 2 million requests, 2,000 may fail this month. The team spends the budget on releases, experiments and maintenance.',k:['idea','Key idea','The budget turns "dev wants speed, ops wants stability" into one shared number.'],pill:'idea',tt:'Budget',focus:['sli','budget'],
   set:{info:{title:'error budget',rows:rows({slo:'99.9'}),hl:[3,4]}},termClear:true,term:{term:['$ slo-report --service checkout --slo 99.9','budget 2,000 failed requests / 30 d','! used 80% after 20 days']}},
  {t:'Burn-rate alerts',b:'Do not page on every error. Page when the budget burns fast: an error rate 14.4 times the allowed rate for an hour eats 2% of the month\'s budget.',k:['tip','Remember','Fast burn pages someone. Slow burn opens a ticket for working hours.'],pill:'idea',tt:'Burn',focus:['budget'],
   set:{info:{title:'burn rate',rows:BURN,hl:[1,5,7]}},termClear:true,term:{term:['# allowed error rate   0.1%','# 1 h at 1.44% errors  → page','# 6 h at 0.6% errors   → ticket']}},
  {t:'Error budget policy',b:'Agree with product what happens as the budget runs out, before an incident. Usually: ship freely, then slow down, then freeze features until reliability is back.',k:['problem','Watch out','A policy written during an outage is a fight. Write it on a calm day.'],pill:'idea',tt:'Policy',focus:['budget','rel','dev'],
   set:{info:{title:'policy',rows:POL,hl:[1,2,3,5]}},termClear:true,term:{term:['# policy reviewed every quarter','# signed by engineering + product']}},
  {t:'Try it: ship or freeze?',b:'It is day 20 of 30. Release v2.0 is ready. Try each SLO to see how the budget changes, then set the agreed 99.9% and make the call.',k:['tip','Challenge','At 99.99% the same 1,600 failures are 800% of the budget. What does that say about picking too many nines?'],pill:'problem',tt:'Try it',S:{slo:'99.9',dec:null,done:false},goal:true,focus:null,
   set:{info:{title:'error budget',rows:rows({slo:'99.9'}),hl:[4]},budget:{title:'80% used',sub:'1,600 of 2,000',status:'fail'},rel:{status:'none',sub:'waiting'}},termClear:true,term:{term:['# release v2.0 ready to deploy']}},
  {t:'Recap',b:'Pick an SLI users feel, set an SLO below 100%, keep the SLA looser, spend the error budget on change, page on fast burn, and follow the policy you agreed in advance.',k:['idea','Next up','Incident response: what to do when the pager goes off.'],pill:'recap',tt:'Recap',S:{slo:'99.9',dec:'freeze',done:true},
   set:{info:{title:'policy',rows:POL,hl:[3,4]},rel:{status:'stop',sub:'on hold'}},termClear:true,term:{term:['✓ SLO 99.9%  budget 80% used  → freeze','# reliability work until the budget recovers']}}
 ]});
})();
