(function(){
var PL={aa:['both in eu-west-1a',['a','a']],ab:['eu-west-1a + 1b',['a','b']],ar:['eu-west-1a + us-east-1a',['a','u']]};
function alive(S){if(!S.place)return null;var z=PL[S.place][1];return z.filter(function(x){return !(S.out&&x=='a')}).length}
var GLOB=['AWS global infrastructure',{t:'Region   a geographic area     eu-west-1',tone:'gold'},{t:'AZ       1+ data centers       eu-west-1a',tone:'gold'},{t:'         own power, cooling, network',tone:'gold'},{t:'Edge     cache close to users  CloudFront',tone:'gold'},'','30+ regions, each with 3+ AZs','AZs in a region: low-latency links'];
var PICK=['How to choose a region',{t:'1 latency     close to your users',tone:'gold'},{t:'2 data laws   where data may live',tone:'gold'},{t:'3 price       differs per region',tone:'gold'},{t:'4 services    not all are everywhere',tone:'gold'},'','Measure it: test latency from where','your users are, before you decide.'];
var SCOPE=['Where resources live',{t:'regional   EC2, VPC, RDS, Lambda',tone:'gold'},{t:'zonal      a subnet, an EBS volume',tone:'gold'},{t:'global     IAM, Route 53, CloudFront',tone:'green'},'',{t:'"My instance is gone!" → check the',tone:'red'},{t:'region selector first.',tone:'red'}];
function paint(S,A){var z=S.place?PL[S.place][1]:[];['a','b','c','u'].forEach(function(k){var n=z.filter(function(x){return x==k}).length;var down=S.out&&k=='a';A.set('az'+k,{status:down?'dead':n?'run':'none',sub:down?'OUTAGE':n?n+' server'+(n>1?'s':''):'empty'})});A.refresh()}
LESSON('aws','regions',{
 title:'Regions & Availability Zones',sub:'Where AWS runs your servers, and how spreading them across zones keeps a site up when a data center fails.',time:'12 min',level:'Beginner',
 S:{place:null,out:false},
 legend:[['#3fa456','servers running'],['#e5534b','zone outage'],['#bdb4a8','empty zone']],
 hud:[{id:'r',l:'Region',v:'eu-west-1',lv:'none'},{id:'p',l:'Placement',v:function(S){return S.place?S.place.toUpperCase():'—'},lv:'none'},{id:'a',l:'Servers alive',v:function(S){var a=alive(S);return a==null?'—':a+' / 2'},lv:function(S){var a=alive(S);return a==null?'none':a==2?'good':a==1?'warn':'bad'}},{id:'s',l:'Site',v:function(S){var a=alive(S);return a==null?'—':a?'UP':'DOWN'},lv:function(S){var a=alive(S);return a==null?'none':a?'good':'bad'}}],
 nodes:[
  H.tile('reg',200,36,'eu-west-1','Ireland region','gold',{w:150}),
  H.tile('aza',80,130,'eu-west-1a','empty','blue',{w:118,status:'none'}),H.tile('azb',200,130,'eu-west-1b','empty','blue',{w:118,status:'none'}),H.tile('azc',320,130,'eu-west-1c','empty','blue',{w:118,status:'none'}),
  H.tile('reg2',90,262,'us-east-1','N. Virginia','gold',{w:126}),H.tile('azu',90,340,'us-east-1a','empty','slate',{w:118,status:'none'}),
  H.box('lb',262,222,'load balancer','green',{center:true}),
  {t:'crowd',id:'users',x:300,y:386,tone:'gold',label:'users',n:3,w:58,anchor:[300,360]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'global infrastructure',rows:GLOB,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'aws cli'}],
 links:[H.lk('reg','aza','gold'),H.lk('reg','azb','gold'),H.lk('reg','azc','gold'),H.lk('reg2','azu','gold'),H.lk('lb','aza','green',{dash:true}),H.lk('lb','azb','green',{dash:true}),H.lk('lb','azu','slate',{dash:true,on:function(S){return S.place=='ar'}}),H.lk('users','lb','gold')],
 controls:{title:'Place two web servers',groups:[{items:Object.keys(PL).map(function(k){return {label:PL[k][0],wide:true,on:function(S){return S.place==k},click:function(S,A){S.place=k;S.out=false;S.sim=false;paint(S,A);var z=PL[k][1];z.forEach(function(x,i){A.send(['lb','az'+x],{label:'web'+(i+1),tone:'blue',ok:true})});
   A.term('term',['$ aws ec2 run-instances --count 1 \\','    --placement AvailabilityZone=...',k=='ar'?'# 2nd server in another region:':'# 2 instances launched',k=='ar'?'# needs its own VPC, AMI copy, data sync':''].filter(Boolean),true)}}}).concat([
  {label:'simulate eu-west-1a outage',wide:true,click:function(S,A){if(!S.place){A.term('term',['! place the servers first'],true);return}S.out=true;S.sim=true;paint(S,A);A.fx('aza','no');var a=alive(S);
   A.send(['users','lb'],{label:'GET',tone:a?'green':'red',ok:!!a});A.term('term',['# eu-west-1a: power failure','$ curl -s -o /dev/null -w "%{http_code}" site',a?'200':'! 503 Service Unavailable',a?'# load balancer sent traffic to healthy zone':'# both servers were in the failed zone'],true)}}])}]},
 goal:function(S){var a=alive(S);if(!S.sim)return [false,'Goal: place two web servers so the site survives the loss of one data center, then simulate the eu-west-1a outage.'];
  if(S.place=='ab')return [true,'Done. Two AZs in one region: one zone failed, the load balancer moved traffic, and users never noticed.'];
  if(S.place=='ar')return [false,'It survived, but a second region is overkill here: another VPC, copied AMIs, data replication and latency. Multi-AZ gives high availability inside one region.'];
  return [false,'The site went down: both servers shared one AZ. Spread them across zones.']},
 learn:[['Know regions, AZs and edges',0],['Know what an AZ protects against',1],['Choose a region',2],['Design for multi-AZ',3],['See a zone failure',4],['Know global vs regional services',5],['Set the region in the CLI',6]],
 steps:[
  {t:'Regions, zones and edges',b:'AWS is split into regions, like eu-west-1 in Ireland. Each region has three or more Availability Zones: separate data centers with their own power and network.',k:['idea','Key idea','Region = where. AZ = which building. Spreading across AZs protects you from one building failing.'],pill:'setup',tt:'Global',focus:['reg','aza','azb','azc','reg2'],S:{place:null,out:false},
   set:{aza:{status:'none',sub:'empty'},azb:{status:'none',sub:'empty'},azc:{status:'none',sub:'empty'},azu:{status:'none',sub:'empty'},info:{title:'global infrastructure',rows:GLOB,hl:[1,2]}},termClear:true,term:{term:['$ aws ec2 describe-availability-zones \\','    --region eu-west-1 --query \\','    "AvailabilityZones[].ZoneName"','["eu-west-1a", "eu-west-1b", "eu-west-1c"]']}},
  {t:'Availability Zones',b:'AZs in a region are kilometres apart and joined by fast private links, so they fail independently but talk with very low latency. That makes them perfect for redundancy.',k:['tip','Remember','A subnet and an EBS volume live in exactly one AZ. Plan placement when you create them.'],pill:'idea',tt:'AZs',focus:['aza','azb','azc'],
   set:{info:{rows:GLOB,hl:[2,3,7]}},termClear:true,term:{term:['$ # eu-west-1a ↔ eu-west-1b: ~1-2 ms','$ # eu-west-1 ↔ us-east-1: ~70 ms']},
   once:[{path:['aza','azb','azc'],label:'',tone:'blue'}]},
  {t:'Choosing a region',b:'Pick the region by latency to your users, laws about where data may be stored, price, and whether the services you need exist there.',k:['problem','Watch out','Prices and available services differ between regions. Check before you design around one.'],pill:'idea',tt:'Choose',focus:['reg','reg2','users'],
   set:{info:{title:'choosing a region',rows:PICK,hl:[1,2]}},termClear:true,term:{term:['$ aws configure get region','eu-west-1']}},
  {t:'Multi-AZ design',b:'Run at least two copies of everything important, in different AZs, behind a load balancer. If one zone fails, the healthy copy keeps serving.',k:['idea','Key idea','High availability inside a region = multi-AZ. Disaster recovery across regions is a bigger, separate decision.'],pill:'idea',tt:'Multi-AZ',focus:['lb','aza','azb','users'],S:{place:'ab',out:false},
   set:{aza:{status:'run',sub:'1 server'},azb:{status:'run',sub:'1 server'}},termClear:true,term:{term:['# web1 → eu-west-1a','# web2 → eu-west-1b','# ALB spans both zones']},
   flows:[{path:['users','lb','aza'],label:'',tone:'green'},{path:['users','lb','azb'],label:'',tone:'green'}]},
  {t:'When a zone fails',b:'Zone outages are rare but real: power, cooling or network problems. The load balancer health checks notice in seconds and stop sending traffic to the broken zone.',k:['problem','Watch out','Two servers in the same AZ are one failure away from an outage. Count zones, not servers.'],pill:'problem',tt:'Outage',focus:['lb','aza','azb'],S:{place:'ab',out:true},
   set:{aza:{status:'dead',sub:'OUTAGE'},azb:{status:'run',sub:'1 server'}},termClear:true,term:{term:['# eu-west-1a unhealthy','# ALB: target web1 unhealthy, draining','$ curl -s -o /dev/null -w "%{http_code}" site','200']},
   flows:[{path:['users','lb','azb'],label:'',tone:'green'}]},
  {t:'Global vs regional',b:'Most services are regional: an EC2 instance in Ireland is invisible from the Virginia console. A few, like IAM and Route 53, are global.',k:['problem','Watch out','"My instance disappeared!" is almost always the console looking at a different region.'],pill:'idea',tt:'Scope',focus:['reg','reg2'],S:{place:null,out:false},
   set:{aza:{status:'none',sub:'empty'},azb:{status:'none',sub:'empty'},info:{title:'scope',rows:SCOPE,hl:[1,3,5,6]}},termClear:true,term:{term:['$ aws ec2 describe-instances \\','    --region us-east-1','{"Reservations": []}','$ # it is in eu-west-1, not here']}},
  {t:'The region in the CLI',b:'aws configure stores a default region. Override it per command with --region, or per shell with AWS_REGION. Scripts should always set it explicitly.',k:['tip','Remember','A script that relies on someone\'s default region will one day create resources in the wrong place.'],pill:'idea',tt:'CLI',focus:['reg'],
   set:{info:{title:'scope',rows:SCOPE,hl:[1]}},termClear:true,term:{term:['$ aws configure','Default region name [None]: eu-west-1','$ export AWS_REGION=eu-west-1','$ aws ec2 describe-instances \\','    --region us-east-1']}},
  {t:'Try it: survive a zone outage',b:'Place two web servers behind the load balancer, then simulate a power failure in eu-west-1a. Does the site stay up?',k:['tip','Challenge','Try both in one zone first. Then compare multi-AZ with a second region: both survive, but which is the right design?'],pill:'problem',tt:'Try it',S:{place:null,out:false,sim:false},goal:true,focus:null,
   set:{aza:{status:'none',sub:'empty'},azb:{status:'none',sub:'empty'},azc:{status:'none',sub:'empty'},azu:{status:'none',sub:'empty'},info:{title:'global infrastructure',rows:GLOB,hl:[]}},termClear:true,term:{term:['$ # two servers, one load balancer']}},
  {t:'Recap',b:'Regions are places, AZs are independent data centers inside them. Run important things in at least two AZs behind a load balancer, and always know which region you are in.',k:['idea','Next up','IAM: who can do what in your AWS account.'],pill:'recap',tt:'Recap',S:{place:'ab',out:true,sim:true},
   set:{aza:{status:'dead',sub:'OUTAGE'},azb:{status:'run',sub:'1 server'},azc:{status:'none',sub:'empty'},info:{title:'global infrastructure',rows:GLOB,hl:[]}},termClear:true,term:{term:['# multi-AZ: one zone down, site up']}}
 ]});
})();
