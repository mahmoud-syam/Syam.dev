(function(){
var G=[['asg','Auto Scaling 2–6'],['hc','ALB health checks'],['maz','RDS Multi-AZ'],['bk','RDS backups 7d'],['al','CloudWatch alarm']];
var EV=[['20:00 traffic ×4','asg','ASG scaled 2 → 5 instances','2 instances at 100% CPU: timeouts'],['21:30 web2 crashes','hc','ALB skipped web2, ASG replaced it','users still sent to dead web2: errors'],['22:15 AZ-a db outage','maz','failover to standby in ~2 min','database down until AZ-a recovers'],['23:10 table deleted','bk','point-in-time restore to 23:09','data gone: no backup'],['all night','al','on-call paged within 2 minutes','nobody knew until users complained']];
function n(S){return G.filter(function(g){return S[g[0]]}).length}
var ASG=['Auto Scaling group web-asg',{t:'launch template  web-v12 (AMI + type)',tone:'gold'},{t:'min 2   desired 2   max 6',tone:'gold'},{t:'subnets  eu-west-1a, eu-west-1b',tone:'gold'},{t:'policy   keep average CPU at 50%',tone:'green'},{t:'health   ELB check, replace if unhealthy',tone:'green'}];
var RDS=['RDS PostgreSQL (managed)',{t:'Multi-AZ   sync standby, auto failover',tone:'gold'},{t:'replica    async copy for reads',tone:'gold'},{t:'backups    daily + logs, 7-35 days',tone:'gold'},{t:'PITR       restore to any second',tone:'green'},{t:'patching   in your maintenance window',tone:'gold'},'','Multi-AZ = availability, replica = scale'];
var CW=['CloudWatch',{t:'metrics  CPUUtilization, 5XX, latency',tone:'gold'},{t:'logs     app and system logs',tone:'gold'},{t:'alarm    5XX > 1% for 3 min',tone:'red'},{t:'         → SNS → email / Slack / pager',tone:'red'},'','CloudTrail: who called which API, when',{t:'"who deleted the table?" → CloudTrail',tone:'green'}];
var COST=['Cost awareness',{t:'✓ AWS Budgets alert at 80% of plan',tone:'green'},{t:'✓ tag everything: env, team, app',tone:'green'},{t:'✓ right-size: check CPU before buying',tone:'green'},{t:'✓ stop dev at night (schedule)',tone:'green'},{t:'! watch NAT and data transfer costs',tone:'amber'},{t:'! delete unattached EBS and old snapshots',tone:'amber'}];
function sim(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;
 L(100,function(){A.send(['users','alb','e1'],{label:'×4',tone:S.asg?'green':'red',ok:!!S.asg});if(S.asg){A.set('e3',{show:true});A.set('e4',{show:true})}});
 L(900,function(){A.set('e2',{status:'dead'});A.send(['alb','e2'],{label:'GET',tone:S.hc?'green':'red',ok:false,denyAt:'e2'})});
 L(1700,function(){A.set('db',{status:'dead'});if(S.maz)A.set('sb',{status:'run',sub:'now primary'});A.send(['e1',S.maz?'sb':'db'],{label:'SQL',tone:S.maz?'green':'red',ok:!!S.maz})});
 L(2500,function(){if(S.al)A.send(['cw','oncall'],{label:'!',tone:'red',ok:true})});
 L(3300,function(){S.ran=true;var L2=['# simulated night'];EV.forEach(function(e){var ok=!!S[e[1]];L2.push((ok?'✓ ':'! ')+e[0]);L2.push((ok?'    ':'!   ')+(ok?e[2]:e[3]))});A.term('term',L2,true);A.refresh()})}
function reset(S,A){A.set('e2',{status:'run'});A.set('e3',{show:false});A.set('e4',{show:false});A.set('db',{status:'run'});A.set('sb',{show:!!S.maz,status:'sleep',sub:'standby AZ-b'});A.refresh()}
LESSON('aws','ops',{
 title:'Scaling, RDS & monitoring',sub:'Load balancers, Auto Scaling, managed databases, alarms and costs: what keeps an app alive at 2 am.',time:'16 min',level:'Intermediate',
 S:{asg:false,hc:false,maz:false,bk:false,al:false,ran:false},
 legend:[['#3fa456','healthy'],['#e5534b','failed'],['#3b82c4','standby']],
 hud:[{id:'n',l:'Safeguards',v:function(S){return n(S)+' / 5'},lv:function(S){return n(S)==5?'good':'warn'}},{id:'w',l:'Web instances',v:function(S){return S.asg?'2–6 (auto)':'2 (fixed)'},lv:'none'},{id:'d',l:'Database',v:function(S){return S.maz?'Multi-AZ':'single AZ'},lv:function(S){return S.maz?'good':'warn'}},{id:'r',l:'Night result',v:function(S){return !S.ran?'—':n(S)==5?'no impact':(5-n(S))+' incidents'},lv:function(S){return !S.ran?'none':n(S)==5?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'users',x:64,y:56,tone:'gold',label:'users',n:3,w:56,anchor:[120,56]},
  H.box('alb',224,30,'ALB','green',{center:true}),
  H.tile('e1',62,190,'web1','AZ-a','green',{w:84,status:'run'}),H.tile('e2',154,190,'web2','AZ-b','green',{w:84,status:'run'}),
  H.tile('e3',246,190,'web3','auto','green',{w:84,status:'run',show:false}),H.tile('e4',338,190,'web4','auto','green',{w:84,status:'run',show:false}),
  H.tile('db',110,296,'RDS primary','AZ-a','violet',{w:124,status:'run'}),
  H.tile('sb',272,296,'RDS standby','standby AZ-b','blue',{w:124,status:'sleep',show:false}),
  H.tile('cw',110,392,'CloudWatch','alarms → SNS','amber',{w:124}),
  {t:'crowd',id:'oncall',x:290,y:404,tone:'red',label:'on-call',n:1,w:44,anchor:[290,380]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'web-asg',rows:ASG,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'events'}],
 links:[H.lk('users','alb','gold'),H.lk('alb','e1','green'),H.lk('alb','e2','green'),H.lk('alb','e3','green'),H.lk('alb','e4','green'),H.lk('e1','db','violet',{dash:true}),H.lk('db','sb','blue',{dash:true}),H.lk('cw','oncall','red',{dash:true,on:function(S){return S.al}})],
 controls:{title:'Prepare for the night',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;reset(S,A)}}}).concat([{label:'simulate the night',wide:true,click:function(S,A){reset(S,A);sim(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&n(S)==5;return [ok,ok?'Done. Spike, crash, zone outage and a deleted table, and users barely noticed. That is what managed services and alarms buy you.':S.ran?'The night had incidents. Read each ✗ line and add the safeguard that prevents it.':'Goal: get through a bad night with no user impact. Simulate it bare first and read what breaks.']},
 learn:[['Spread load with an ALB',0],['Scale with Auto Scaling',1],['Run databases on RDS',2],['Back up and restore',3],['Alarm with CloudWatch',4],['Audit with CloudTrail',5],['Keep costs under control',6]],
 steps:[
  {t:'Application Load Balancer',b:'An ALB is the single front door. It spreads requests over healthy instances in several AZs, checks their health, and can handle HTTPS for you.',k:['idea','Key idea','Users talk to the ALB DNS name, never to an instance IP. Instances can come and go freely behind it.'],pill:'setup',tt:'ALB',focus:['users','alb','e1','e2'],S:{asg:false,hc:false,maz:false,bk:false,al:false,ran:false},
   set:{e2:{status:'run'},e3:{show:false},e4:{show:false},db:{status:'run'},sb:{show:false},info:{title:'web-asg',rows:ASG,hl:[]}},termClear:true,term:{term:['$ curl -sI https://app-alb-123.eu-west-1.\\','elb.amazonaws.com | head -1','HTTP/2 200']},
   flows:[{path:['users','alb','e1'],label:'',tone:'green'},{path:['users','alb','e2'],label:'',tone:'green'}]},
  {t:'Auto Scaling',b:'An Auto Scaling group keeps between min and max instances from a launch template. With target tracking it adds instances when CPU rises and removes them when it falls.',k:['tip','Remember','The ASG also replaces instances that fail health checks. It heals as well as scales.'],pill:'idea',tt:'ASG',focus:['alb','e1','e2','e3','e4'],S:{asg:true,hc:true},
   set:{e3:{show:true},e4:{show:true},info:{title:'web-asg',rows:ASG,hl:[2,4,5]}},termClear:true,term:{term:['$ aws autoscaling \\','  describe-scaling-activities \\','  --auto-scaling-group-name web-asg','"Launching a new EC2 instance: i-0e3"','"Launching a new EC2 instance: i-0e4"']},
   once:[{path:['alb','e3'],label:'+',tone:'green'},{path:['alb','e4'],label:'+',tone:'green',delay:600}]},
  {t:'RDS: managed databases',b:'RDS runs PostgreSQL, MySQL and others for you: patching, backups and failover included. Multi-AZ keeps a synchronous standby in another AZ that takes over automatically.',k:['problem','Watch out','Multi-AZ is for availability. A read replica is for read scaling and is asynchronous. They are different tools.'],pill:'idea',tt:'RDS',focus:['e1','db','sb'],S:{maz:true},
   set:{sb:{show:true,status:'sleep',sub:'standby AZ-b'},info:{title:'RDS',rows:RDS,hl:[1,2,7]}},termClear:true,term:{term:['$ aws rds describe-db-instances \\','    --query "DBInstances[].MultiAZ"','[true]']},
   once:[{path:['db','sb'],label:'sync',tone:'blue'}]},
  {t:'Backups and point-in-time restore',b:'RDS takes daily backups and keeps transaction logs, so you can restore to any second in the retention window. A restore creates a new database next to the old one.',k:['tip','Remember','Test a restore regularly. Knowing it takes 20 minutes is part of your recovery plan.'],pill:'idea',tt:'Backups',focus:['db'],S:{bk:true},
   set:{info:{title:'RDS',rows:RDS,hl:[3,4]}},termClear:true,term:{term:['$ aws rds \\','  restore-db-instance-to-point-in-time \\','  --source-db-instance-identifier app-db \\','  --target-db-instance-identifier db-fix \\','  --restore-time 2026-11-26T23:09:00Z']}},
  {t:'CloudWatch alarms',b:'CloudWatch collects metrics and logs. An alarm watches a metric, like 5XX errors above 1% for 3 minutes, and sends a notification through SNS to email, Slack or a pager.',k:['idea','Key idea','Alarm on what users feel: errors and latency. CPU alone does not tell you if the site works.'],pill:'idea',tt:'Alarms',focus:['cw','oncall'],S:{al:true},
   set:{info:{title:'CloudWatch',rows:CW,hl:[3,4]}},termClear:true,term:{term:['$ aws cloudwatch describe-alarms \\','    --state-value ALARM','"AlarmName": "web-5xx-high"']},
   once:[{path:['cw','oncall'],label:'!',tone:'red'}]},
  {t:'CloudTrail: who did what',b:'CloudTrail records every API call in your account: who, what, when and from where. When something disappears, it tells you who deleted it.',k:['tip','Remember','Turn CloudTrail on for all regions and store its logs in a separate, locked-down account if you can.'],pill:'idea',tt:'Audit',focus:['cw'],
   set:{info:{title:'CloudWatch',rows:CW,hl:[6,7]}},termClear:true,term:{term:['$ aws cloudtrail lookup-events \\','    --lookup-attributes \\','    AttributeKey=EventName,AttributeValue=\\','DeleteDBInstance']}},
  {t:'Cost awareness',b:'The cloud bills by the second, so mistakes cost money quickly. Set budgets with alerts, tag resources, right-size instances and switch off what you do not use.',k:['problem','Watch out','NAT gateway data, forgotten EBS volumes and old snapshots are the classic surprise items on a bill.'],pill:'problem',tt:'Cost',focus:['alb','e1','e2','db'],
   set:{info:{title:'cost',rows:COST,hl:[1,5,6]}},termClear:true,term:{term:['$ aws ce get-cost-and-usage \\','  --time-period \\','  Start=2026-11-01,End=2026-11-26 \\','  --granularity MONTHLY \\','  --metrics UnblendedCost','"Amount": "412.37"']}},
  {t:'Try it: survive the night',b:'Choose your safeguards, then simulate a night with a traffic spike, a crashed server, a database zone outage and a deleted table.',k:['tip','Challenge','Simulate with nothing turned on and count the incidents. Then remove them one safeguard at a time.'],pill:'problem',tt:'Try it',S:{asg:false,hc:false,maz:false,bk:false,al:false,ran:false},goal:true,focus:null,
   set:{e2:{status:'run'},e3:{show:false},e4:{show:false},db:{status:'run'},sb:{show:false},info:{title:'web-asg',rows:ASG,hl:[]}},termClear:true,term:{term:['# 2 web servers, 1 database, no alarms']}},
  {t:'Recap',b:'ALB in front, Auto Scaling across AZs, RDS Multi-AZ with backups, alarms on what users feel, CloudTrail for audit, budgets for cost. That is a production-ready AWS setup.',k:['idea','Next up','Terraform: build all of this from code instead of clicks.'],pill:'recap',tt:'Recap',S:{asg:true,hc:true,maz:true,bk:true,al:true,ran:true},
   set:{e3:{show:true},e4:{show:true},sb:{show:true,status:'sleep',sub:'standby AZ-b'},info:{title:'web-asg',rows:ASG,hl:[]}},termClear:true,term:{term:['✓ spike ✓ crash ✓ AZ ✓ restore ✓ alarm']}}
 ]});
})();
