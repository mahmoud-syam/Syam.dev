(function(){
function row(txt,ok){return {t:txt+(ok?'  ✓':'  ✗'),tone:ok?'green':'red'}}
var LAD=['Debug ladder (top to bottom)',function(S){return row('1 IP and route   ',true)},function(S){return row('2 ping           ',true)},function(S){return row('3 DNS name→IP    ',true)},function(S){return row('4 port listening ',S.svc)},function(S){return row('5 firewall open   ',S.fwopen)},'','Stop at the first ✗.'];
function curl(S,A){var ok=S.fwopen&&S.svc;
 A.send(['you','fw','server'],{label:'GET',tone:'blue',ok:ok,denyAt:!S.fwopen?'fw':'server'});
 A.term('term',ok?['$ curl -I http://app.local','HTTP/1.1 200 OK','Server: nginx']:!S.fwopen?['$ curl -m 5 http://app.local','! curl: (28) Connection timed out']:['$ curl http://app.local','! curl: (7) Connection refused']);
 A.hud({res:{v:ok?'200 OK':!S.fwopen?'timeout':'refused',lv:ok?'good':'bad'}})}
LESSON('linux','nettools',{
 title:'Networking tools',sub:'IPs, ports, DNS and a step-by-step ladder to debug a broken connection.',time:'15 min',level:'Intermediate',
 S:{svc:true,fwopen:false},
 legend:[['#3fa456','reachable'],['#e8a33a','filtered'],['#e5534b','refused / timeout']],
 hud:[{id:'ip',l:'Server IP',v:'10.0.0.5',lv:'none'},{id:'port',l:'Port 80',v:function(S){return S.svc?'listening':'closed'},lv:function(S){return S.svc?'good':'bad'}},{id:'fw',l:'Firewall',v:function(S){return S.fwopen?'allows 80':'blocks 80'},lv:function(S){return S.fwopen?'good':'warn'}},{id:'res',l:'curl result',v:'—',lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:66,y:160,tone:'gold',label:'you',n:1,w:52,anchor:[122,160]},
  H.box('dns',234,34,'DNS','violet',{center:true}),
  H.tile('fw',196,244,'firewall','port filter','amber',{w:104}),
  H.box('server',330,160,'web server','green',{center:true,ports:['green']}),
  H.tile('app',318,350,'nginx',':80','green',{w:104,status:'run'}),
  {t:'panel',id:'lad',x:392,y:14,w:316,h:170,title:'debug ladder',rows:LAD,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','dns','violet',{dash:true}),H.lk('you','fw','gold'),H.lk('fw','server','green'),H.lk('server','app','green')],
 controls:{title:'Debug app.local',groups:[{items:[
  {label:'ping',wide:true,click:function(S,A){A.send(['you','server'],{label:'icmp',tone:'green',ok:true});A.term('term',['$ ping -c1 10.0.0.5','64 bytes from 10.0.0.5 time=0.4 ms'])}},
  {label:'dig app.local',wide:true,click:function(S,A){A.send(['you','dns'],{label:'A?',tone:'violet',ok:true});A.term('term',['$ dig +short app.local','10.0.0.5'])}},
  {label:'ss -tlnp',wide:true,click:function(S,A){A.fx('app',S.svc?'ok':'no');A.term('term',S.svc?['$ sudo ss -tlnp | grep :80','LISTEN 0 511 0.0.0.0:80 nginx']:['$ sudo ss -tlnp | grep :80','# nothing is listening on 80'])}},
  {label:'curl',wide:true,click:function(S,A){curl(S,A)}},
  {label:'stop nginx',wide:true,on:function(S){return !S.svc},click:function(S,A){S.svc=false;A.set('app',{status:'dead'});A.term('term',['$ sudo systemctl stop nginx'])}},
  {label:'start nginx',wide:true,on:function(S){return S.svc},click:function(S,A){S.svc=true;A.set('app',{status:'run'});A.term('term',['$ sudo systemctl start nginx'])}},
  {label:'ufw allow 80',wide:true,on:function(S){return S.fwopen},click:function(S,A){S.fwopen=true;A.fx('fw','ok');A.set('fw',{sub:'80 allowed'});A.term('term',['$ sudo ufw allow 80/tcp','Rule added'])}}]}]},
 goal:function(S){var ok=S.fwopen&&S.svc;return [ok,ok?'Done. Port 80 is listening and the firewall lets it through. curl now works.':'Goal: make curl return 200. curl times out. Work down the ladder: ping, dig, ss, then the firewall.']},
 learn:[['Read IP and routes',0],['Test reachability with ping',1],['Resolve names with dig',2],['List listening ports with ss',3],['Tell refused from timeout',4],['Open a firewall port',5]],
 steps:[
  {t:'Every machine has an address',b:'An IP address says who you are on the network, and the default route says where to send traffic that is not local. ip shows both.',k:['idea','Key idea','Use ip addr for addresses and ip route for the gateway. ifconfig is the old tool.'],pill:'setup',tt:'IP',focus:['you','server'],S:{svc:true,fwopen:false},
   set:{app:{status:'run'},fw:{sub:'port filter'},lad:{rows:LAD,hl:[1]}},termClear:true,term:{term:['$ ip -br addr','eth0  UP  10.0.0.5/24','$ ip route','default via 10.0.0.1 dev eth0']},
   fx:[{n:'server',k:'pulse'}]},
  {t:'ping: is it alive?',b:'ping sends a tiny echo request and waits for the reply. A reply proves the machine is reachable. It does not prove the application works.',k:['problem','Watch out','Some firewalls block ping on purpose. No reply does not always mean the host is down.'],pill:'problem',tt:'ping',focus:['you','server'],S:{svc:true,fwopen:false},
   set:{lad:{rows:LAD,hl:[2]}},termClear:true,term:{term:['$ ping -c2 10.0.0.5','64 bytes from 10.0.0.5 time=0.4 ms','64 bytes from 10.0.0.5 time=0.5 ms','2 packets, 0% loss']},
   flows:[{path:['you','server'],label:'icmp',tone:'green'}]},
  {t:'DNS: names to numbers',b:'People type names, networks need IPs. DNS translates one into the other. When a name fails but the IP works, the problem is DNS.',k:['tip','Remember','dig app.local asks the resolver. The resolver address is in /etc/resolv.conf.'],pill:'idea',tt:'DNS',focus:['you','dns'],S:{svc:true,fwopen:false},
   set:{lad:{rows:LAD,hl:[3]}},termClear:true,term:{term:['$ dig +short app.local','10.0.0.5','$ cat /etc/resolv.conf','nameserver 10.0.0.2']},
   once:[{path:['you','dns'],label:'A?',tone:'violet'},{path:['dns','you'],label:'IP',tone:'green',delay:1200}]},
  {t:'Ports: which door?',b:'An IP finds the machine. A port finds the program on it: 80 for HTTP, 443 for HTTPS, 22 for SSH. ss lists what is listening.',k:['idea','Key idea','0.0.0.0:80 listens on every interface. 127.0.0.1:80 listens only on the machine itself.'],pill:'idea',tt:'Ports',focus:['server','app'],S:{svc:true,fwopen:false},
   set:{lad:{rows:LAD,hl:[4]}},termClear:true,term:{term:['$ sudo ss -tlnp','LISTEN 0.0.0.0:22  sshd','LISTEN 0.0.0.0:80  nginx','LISTEN 127.0.0.1:5432 postgres']},
   fx:[{n:'app',k:'ok'}]},
  {t:'curl: talk to the service',b:'curl speaks HTTP, so it tests the real thing. The error tells you the layer. Connection refused means the host answered but nothing listens. Timed out means packets vanish.',k:['problem','Watch out','Timeout usually means a firewall is silently dropping packets. Refused means nothing is listening.'],pill:'problem',tt:'curl',focus:['you','fw','server'],S:{svc:true,fwopen:false},
   set:{lad:{rows:LAD,hl:[]}},termClear:true,term:{term:['$ curl -m 5 http://app.local','! curl: (28) Connection timed out','$ sudo systemctl stop nginx','$ curl http://app.local','! curl: (7) Connection refused']},
   once:[{path:['you','fw','server'],label:'GET',tone:'blue',ok:false,denyAt:'fw'}],timed:[{at:2600,set:{app:{status:'dead'}}}]},
  {t:'Firewalls',b:'A firewall decides which ports are reachable from outside. A service can be running and still be unreachable because the port is closed.',k:['tip','Remember','Ubuntu: ufw allow 80/tcp. RHEL family: firewall-cmd --add-service=http --permanent, then --reload.'],pill:'idea',tt:'Firewall',focus:['fw','server'],S:{svc:true,fwopen:true},
   set:{app:{status:'run'},fw:{sub:'80 allowed'},lad:{rows:LAD,hl:[5]}},termClear:true,term:{term:['$ sudo ufw status','80/tcp  ALLOW  Anywhere','$ curl -I http://app.local','HTTP/1.1 200 OK']},
   once:[{path:['you','fw','server'],label:'GET',tone:'green',ok:true}]},
  {t:'The debug ladder',b:'Do not guess. Go down the ladder: address, ping, DNS, port listening, firewall. The first failing rung is your problem.',k:['idea','Key idea','Each rung rules out one whole layer. This is the same method for Docker, Kubernetes and the cloud.'],pill:'idea',tt:'Method',focus:['you','dns','fw','server','app'],S:{svc:true,fwopen:true},
   set:{lad:{rows:LAD,hl:[1,2,3,4,5]}},termClear:true,term:{term:['$ ip -br addr; ping -c1 gw','$ dig +short app.local','$ ss -tlnp | grep :80','$ curl -I app.local']},
   once:[{path:['you','dns'],label:'1',tone:'violet'},{path:['you','server'],label:'2',tone:'green',delay:900},{path:['you','fw','server'],label:'3',tone:'blue',delay:1900}]},
  {t:'Try it: the page will not load',b:'Users say app.local times out. Find the cause with the buttons, then fix it.',k:['tip','Challenge','Run ping, dig and ss first. They all look fine. Which rung is left?'],pill:'problem',tt:'Try it',S:{svc:true,fwopen:false},goal:true,focus:['you','dns','fw','server'],
   set:{app:{status:'run'},fw:{sub:'port filter'},lad:{rows:LAD,hl:[]}},hud:{res:{v:'—',lv:'none'}},termClear:true,term:{term:['$ # app.local is unreachable']}},
  {t:'Recap',b:'IP finds the machine, DNS finds the IP, a port finds the program, a firewall guards the door. Debug in that order.',k:['idea','Next up','Logs and performance: reading what the system tells you, and finding the bottleneck.'],pill:'recap',tt:'Recap',S:{svc:true,fwopen:true},
   set:{app:{status:'run'},fw:{sub:'80 allowed'},lad:{rows:LAD,hl:[]}},termClear:true,term:{term:['$ ip · ping · dig · ss · curl']}}
 ]});
})();
