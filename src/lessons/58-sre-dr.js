(function(){
var ST={backup:['backup + restore','hours','hours','$',false,'RTO 6 h 10 m, RPO 20 h',360,1200],pilot:['pilot light','minutes','~1 h','$$',true,'RTO 41 min, RPO 2 min',41,2],warm:['warm standby','seconds','minutes','$$$',true,'RTO 9 min, RPO 10 s',9,0.2],active:['active-active','~0','~0','$$$$',true,'RTO 0, RPO ~0',0,0]};
var KEYS=['backup','pilot','warm','active'];
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s}
function tbl(hl){return ['need: RPO ≤ 15 min, RTO ≤ 1 h, low cost',{t:'strategy          RPO       RTO      cost',tone:'gold'}].concat(KEYS.map(function(k){var x=ST[k];return {t:pad(x[0],18)+pad(x[1],10)+pad(x[2],9)+x[3],tone:hl==k?(k=='pilot'?'green':'red'):'gold'}}),['','RPO: how much data you can lose','RTO: how long you can be down'])}
var RPO=['Two numbers drive everything',{t:'RPO  recovery point objective',tone:'gold'},'     max data loss, measured in time',{t:'RTO  recovery time objective',tone:'gold'},'     max time until service is back','',{t:'nightly backup only → RPO up to 24 h',tone:'red'},{t:'replication → RPO seconds to minutes',tone:'green'}];
var B321=['The 3-2-1 rule',{t:'3  copies of the data',tone:'gold'},{t:'2  different kinds of storage',tone:'gold'},{t:'1  copy off-site (other region/account)',tone:'gold'},'',{t:'+ immutable: nobody can delete it, not',tone:'green'},{t:'  even an admin or ransomware',tone:'green'},{t:'A snapshot in the same account is not enough.',tone:'red'}];
function vis(S,A){var k=S.st;A.set('dbB',{show:k!='backup'&&!!k,status:'run',sub:k=='active'?'read-write':'replica'});A.set('appB',{show:k=='warm'||k=='active'||k=='pilot',status:k=='pilot'?'none':'run',sub:k=='pilot'?'scaled to 0':k=='warm'?'2 small pods':'full size'})}
function pick(S,A,k){S.st=k;S.drill=false;S.done=false;vis(S,A);A.set('appA',{status:'run'});A.set('dbA',{status:'run'});A.set('info',{title:'strategies',rows:tbl(k),hl:[KEYS.indexOf(k)+2]});
 var x=ST[k];A.term('term',['# '+x[0]+'   cost '+x[3],'# RPO '+x[1]+', RTO '+x[2],k=='backup'?'! too slow: restoring takes hours':k=='pilot'?'# data replicated, servers start on failover':k=='warm'?'# fits, but you pay for a running copy':'# fits, but doubles the cost','# now prove it: run a DR drill'],true);
 if(k!='backup')A.send(['dbA','dbB'],{label:'replicate',tone:'blue',ok:true});A.refresh()}
function drill(S,A){if(!S.st){A.term('term',['! pick a strategy first'],true);return}var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
 var x=ST[S.st];A.term('term',['$ ./dr-drill.sh --fail eu-west-1'],true);A.set('appA',{status:'fail'});A.set('dbA',{status:'fail'});
 L(700,function(){A.term('term',['# region eu-west-1 marked down']);if(S.st=='backup')A.send(['vault','dbB'],{label:'restore',tone:'amber',ok:true});A.set('dbB',{show:true,status:'run',sub:'primary now'})});
 L(1500,function(){A.set('appB',{show:true,status:'run',sub:'serving'});A.send(['dns','appB'],{label:'failover',tone:'green',ok:true});A.term('term',['# DNS failover → eu-central-1'])});
 L(2400,function(){S.drill=true;var ok=x[6]<=60&&x[7]<=15;S.done=ok&&S.st=='pilot';A.term('term',[(ok?'':'! ')+'measured '+x[5],S.done?'✓ meets RPO and RTO at the lowest cost':ok?'! meets target, but costs more than needed':'! misses RTO 1 h and RPO 15 min']);A.refresh()})}
LESSON('sre','dr',{
 title:'Backup & disaster recovery',sub:'Decide how much data and time you can afford to lose, pick a recovery strategy that fits, and prove it with drills.',time:'15 min',level:'Intermediate',
 S:{st:null,drill:false,done:false},
 legend:[['#3fa456','running'],['#e5534b','failed'],['#3b82c4','replication'],['#e8a33a','backup']],
 hud:[{id:'s',l:'Strategy',v:function(S){return S.st?ST[S.st][0].split(' ')[0]:'—'},lv:'none'},{id:'o',l:'RTO',v:function(S){return S.drill?(ST[S.st][6]>=60?Math.round(ST[S.st][6]/60)+' h':ST[S.st][6]+' min'):'?'},lv:function(S){return !S.drill?'none':ST[S.st][6]<=60?'good':'bad'}},{id:'p',l:'RPO',v:function(S){if(!S.drill)return '?';var r=ST[S.st][7];return r>=60?Math.round(r/60)+' h':r==0?'~0':r<1?Math.round(r*60)+' s':r+' min'},lv:function(S){return !S.drill?'none':ST[S.st][7]<=15?'good':'bad'}},{id:'c',l:'Cost',v:function(S){return S.st?ST[S.st][3]:'—'},lv:'none'}],
 nodes:[
  H.box('dns',196,30,'DNS','violet',{center:true}),
  H.tile('appA',90,150,'app','eu-west-1','green',{w:124,status:'run'}),
  H.tile('dbA',90,236,'database','primary','green',{w:124,status:'run'}),
  H.tile('appB',300,150,'app DR','scaled to 0','green',{w:124,status:'none',show:false}),
  H.tile('dbB',300,236,'database DR','replica','blue',{w:124,status:'run',show:false}),
  H.tile('vault',196,336,'backup vault','other account, immutable','amber',{w:180}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'strategies',rows:tbl(null),fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('dns','appA','violet'),H.lk('dns','appB','violet',{dash:true}),H.lk('appA','dbA','green'),H.lk('appB','dbB','green'),H.lk('dbA','dbB','blue',{dash:true}),H.lk('dbA','vault','amber',{dash:true}),H.lk('vault','dbB','amber',{dash:true})],
 controls:{title:'Plan recovery for checkout',groups:[{items:KEYS.map(function(k){return {label:ST[k][0],wide:true,on:function(S){return S.st==k},click:function(S,A){pick(S,A,k)}}})},{items:[{label:'run DR drill',wide:true,click:function(S,A){drill(S,A)}}]}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. Pilot light keeps the data replicated and starts servers on failover: 41 minutes, 2 minutes of data lost, at a fraction of the cost of a second live site.':'Goal: checkout needs RPO ≤ 15 min and RTO ≤ 1 h at the lowest cost. Pick a strategy, then run a DR drill to prove it.']},
 learn:[['Know what can go wrong',0],['Set RPO and RTO',1],['Follow the 3-2-1 rule',2],['Test your restores',3],['Choose a DR strategy',4],['Automate the recovery',5],['Run DR drills',6]],
 steps:[
  {t:'What can go wrong',b:'Someone drops a table, ransomware encrypts the servers, or a whole cloud region goes down. Disaster recovery is the plan for getting back from each of these.',k:['idea','Key idea','High availability survives a failed server. Disaster recovery survives losing much more.'],pill:'setup',tt:'Risks',focus:['appA','dbA'],S:{st:null,drill:false,done:false},
   set:{info:{title:'strategies',rows:tbl(null),hl:[]},appA:{status:'run'},dbA:{status:'run'},appB:{show:false},dbB:{show:false}},termClear:true,term:{term:['# DROP TABLE orders;   -- wrong terminal','# region eu-west-1: degraded','# files encrypted: pay 2 BTC']}},
  {t:'RPO and RTO',b:'RPO is how much data you can afford to lose, measured in time. RTO is how long you can be down. The business sets them, and they decide the design and the cost.',k:['tip','Remember','Lower RPO and RTO always cost more. Agree on them per system, not one number for everything.'],pill:'idea',tt:'RPO/RTO',focus:['dbA'],
   set:{info:{title:'RPO and RTO',rows:RPO,hl:[1,3,6,7]}},termClear:true,term:{term:['# checkout:  RPO 15 min, RTO 1 h','# reports:   RPO 24 h,   RTO 2 days']}},
  {t:'Backups: 3-2-1',b:'Keep three copies on two kinds of storage, with one off-site. Make at least one immutable, so an attacker with admin rights still cannot delete it.',k:['problem','Watch out','Snapshots in the same account die with the account. Copy backups to a separate account or provider.'],pill:'idea',tt:'3-2-1',focus:['dbA','vault'],
   set:{info:{title:'3-2-1',rows:B321,hl:[1,2,3,5,7]}},termClear:true,term:{term:['$ aws backup start-backup-job \\','    --backup-vault-name dr-vault-locked \\','    --resource-arn arn:aws:rds:...:db/orders']},
   once:[{path:['dbA','vault'],label:'backup',tone:'amber'}]},
  {t:'Test restores',b:'A backup you have never restored is only a hope. Restore regularly to a test environment, check the data, and time how long it takes.',k:['tip','Remember','Automate a monthly restore test and alert if it fails or runs longer than the RTO.'],pill:'idea',tt:'Restore',focus:['vault','dbB'],
   set:{info:{title:'3-2-1',rows:B321,hl:[]},dbB:{show:true,status:'run',sub:'restore test'}},termClear:true,term:{term:['$ ./restore-test.sh orders 2026-11-25','# restored 48 GB in 2 h 05 m','# row count matches  ✓']},
   once:[{path:['vault','dbB'],label:'restore',tone:'amber'}]},
  {t:'DR strategies',b:'From cheap to expensive: backup and restore, pilot light with replicated data, warm standby with a small running copy, and active-active in two regions.',k:['idea','Key idea','Pick the cheapest strategy that meets the RPO and RTO. Not every system needs active-active.'],pill:'idea',tt:'Strategies',focus:['appB','dbB'],
   set:{info:{title:'strategies',rows:tbl(null),hl:[2,3,4,5]},dbB:{show:true,status:'run',sub:'replica'},appB:{show:true,status:'none',sub:'scaled to 0'}},termClear:true,term:{term:['# cost grows with every step','# so do RPO and RTO improvements']},
   flows:[{path:['dbA','dbB'],label:'replicate',tone:'blue'}]},
  {t:'Automate the recovery',b:'Rebuild the DR site with the same Terraform code, keep a runbook, and use DNS health checks to fail over. Manual steps at 3 am are slow and error-prone.',k:['tip','Remember','The DR region needs quotas, AMIs, secrets and certificates too. Check them before you need them.'],pill:'idea',tt:'Automate',focus:['dns','appB'],
   set:{info:{title:'runbook',rows:['DR runbook: region failover',{t:'1 promote database DR to primary',tone:'gold'},{t:'2 terraform apply -var region=dr',tone:'gold'},{t:'3 scale app DR to full size',tone:'gold'},{t:'4 DNS health check fails over',tone:'gold'},{t:'5 verify checkout, post status',tone:'gold'},'','Same code builds prod and DR.'],hl:[1,2,4]}},termClear:true,term:{term:['$ terraform workspace select dr','$ terraform apply -var="app_count=6"']}},
  {t:'DR drills',b:'Practise the failover on a schedule, ideally in production during a quiet hour. Measure the real RTO and RPO and fix what was slow.',k:['problem','Watch out','An untested DR plan usually fails at the first missing permission or expired secret.'],pill:'idea',tt:'Drills',focus:['dns','appA','appB'],
   set:{info:{title:'strategies',rows:tbl(null),hl:[]}},termClear:true,term:{term:['# game day: every quarter','# last drill: RTO 41 min, RPO 2 min']}},
  {t:'Try it: plan recovery for checkout',b:'Checkout needs RPO ≤ 15 minutes and RTO ≤ 1 hour, at the lowest cost. Pick a strategy, then run a drill that takes the main region down.',k:['tip','Challenge','Run the drill with backup + restore. How long are customers unable to pay?'],pill:'problem',tt:'Try it',S:{st:null,drill:false,done:false},goal:true,focus:null,
   set:{info:{title:'strategies',rows:tbl(null),hl:[]},appA:{status:'run'},dbA:{status:'run'},appB:{show:false},dbB:{show:false}},termClear:true,term:{term:['# checkout: RPO 15 min, RTO 1 h']}},
  {t:'Recap',b:'Set RPO and RTO per system, keep 3-2-1 immutable backups, test restores, pick the cheapest strategy that meets the targets, automate it, and drill it.',k:['idea','Next up','Real-world projects: put the whole course together.'],pill:'recap',tt:'Recap',S:{st:'pilot',drill:true,done:true},
   set:{info:{title:'strategies',rows:tbl('pilot'),hl:[3]},appA:{status:'run'},dbA:{status:'run'},appB:{show:true,status:'none',sub:'scaled to 0'},dbB:{show:true,status:'run',sub:'replica'}},termClear:true,term:{term:['✓ pilot light: RTO 41 min, RPO 2 min']}}
 ]});
})();
