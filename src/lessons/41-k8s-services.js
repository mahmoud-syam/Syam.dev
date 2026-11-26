(function(){
function eps(S){return S.sel=='web'?3:0}
function inner(S){return eps(S)>0&&S.tp==8000}
function outer(S){return inner(S)&&S.type=='LoadBalancer'}
var SVC=[{t:'apiVersion: v1',tone:'gold'},'kind: Service','metadata: { name: web, namespace: shop }','spec:',function(S){return {t:'  type: '+S.type,tone:S.type=='LoadBalancer'?'green':undefined}},function(S){return {t:'  selector: { app: '+S.sel+' }',tone:S.sel=='web'?'green':'red'}},'  ports:',function(S){return {t:'    - port: 80   targetPort: '+S.tp,tone:S.tp==8000?'green':'red'}}];
var SV=SVC.map(function(c){return function(S){return typeof c=='function'?c(S):c}});
var PORTS=['Three port numbers',{t:'port         80    what clients call',tone:'gold'},{t:'targetPort   8000  where the pod listens',tone:'gold'},{t:'containerPort 8000 documented in the pod',tone:'gold'},{t:'nodePort     30080 only for NodePort type',tone:'amber'},'',{t:'targetPort must match the app\'s real port.',tone:'red'}];
var DNS=['Service DNS names',{t:'web                        same namespace',tone:'gold'},{t:'web.shop                   other namespace',tone:'gold'},{t:'web.shop.svc.cluster.local full name',tone:'gold'},'','Pods find services by name, never by IP.'];
var TYPES=['Service types',{t:'ClusterIP     inside the cluster only',tone:'gold'},{t:'NodePort      every node opens a port',tone:'amber'},{t:'LoadBalancer  cloud load balancer + public IP',tone:'green'},{t:'headless      no virtual IP, DNS per pod',tone:'gold'},'','For HTTP sites, Ingress (next lesson) puts','many services behind one load balancer.'];
function vis(S,A){var e=eps(S);['p0','p1','p2'].forEach(function(p){A.set(p,{status:e?'run':'sleep'})});A.set('svc',{sub:'endpoints: '+e,status:inner(S)?'run':'#e5534b'});A.set('lb',{show:S.type=='LoadBalancer'});A.set('code',{rows:SV});A.refresh()}
function test(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;var i=inner(S),o=outer(S);
 A.send(['fe','svc'].concat(i?['p1']:[]),{label:'GET',tone:i?'green':'red',ok:i,denyAt:'svc'});
 L(1200,function(){A.send(S.type=='LoadBalancer'?['users','lb','svc']:['users','svc'],{label:'GET',tone:o?'green':'red',ok:o,denyAt:S.type=='LoadBalancer'?'svc':'svc'})});
 L(2400,function(){S.ran=true;S.okIn=i;S.okOut=o;A.term('term',['$ kubectl -n shop get endpoints web','web   '+(eps(S)?'10.42.1.7:'+S.tp+',10.42.2.4:'+S.tp+'...':'<none>'),'$ kubectl exec frontend -- curl -s -m 3 web',i?'<h1>shop</h1>':eps(S)?'! curl: (7) Connection refused':'! curl: (28) timed out: no endpoints','$ curl -s -m 3 http://shop.example.com',o?'<h1>shop</h1>':S.type!='LoadBalancer'?'! no external IP: type is ClusterIP':'! 502: service has no working endpoints'],true);vis(S,A)})}
LESSON('k8s','services',{
 title:'Services & networking',sub:'Give a changing set of pods one stable name and address, and choose who can reach it.',time:'15 min',level:'Intermediate',
 S:{sel:'web-v2',tp:80,type:'ClusterIP',ran:false,okIn:false,okOut:false},
 legend:[['#3fa456','reachable'],['#e5534b','broken'],['#3b82c4','pod not selected']],
 hud:[{id:'e',l:'Endpoints',v:function(S){return String(eps(S))},lv:function(S){return eps(S)?'good':'bad'}},{id:'t',l:'Type',v:function(S){return S.type},lv:'none'},{id:'i',l:'Inside cluster',v:function(S){return !S.ran?'—':S.okIn?'works':'fails'},lv:function(S){return !S.ran?'none':S.okIn?'good':'bad'}},{id:'o',l:'From internet',v:function(S){return !S.ran?'—':S.okOut?'works':'fails'},lv:function(S){return !S.ran?'none':S.okOut?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'users',x:64,y:60,tone:'gold',label:'users',n:2,w:50,anchor:[116,60]},
  H.box('lb',230,30,'cloud LB','amber',{center:true,show:false}),
  H.tile('fe',70,184,'frontend pod','calls "web"','violet',{w:124}),
  H.tile('svc',230,184,'Service web','endpoints: 0','blue',{w:130,status:'#e5534b'}),
  H.tile('p0',74,300,'web pod','app: web :8000','green',{w:114,status:'sleep'}),H.tile('p1',196,300,'web pod','app: web :8000','green',{w:114,status:'sleep'}),H.tile('p2',318,300,'web pod','app: web :8000','green',{w:114,status:'sleep'}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'service.yaml',rows:SV,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('users','lb','gold',{on:function(S){return S.type=='LoadBalancer'}}),H.lk('lb','svc','amber',{on:function(S){return S.type=='LoadBalancer'}}),H.lk('fe','svc','violet'),
  H.lk('svc','p0','green',{dash:true,on:function(S){return eps(S)>0}}),H.lk('svc','p1','green',{dash:true,on:function(S){return eps(S)>0}}),H.lk('svc','p2','green',{dash:true,on:function(S){return eps(S)>0}})],
 controls:{title:'Fix service web',groups:[{name:'selector',items:[{label:'web',wide:true,on:function(S){return S.sel=='web'},click:function(S,A){S.sel='web';S.ran=false;vis(S,A)}},{label:'web-v2',wide:true,on:function(S){return S.sel=='web-v2'},click:function(S,A){S.sel='web-v2';S.ran=false;vis(S,A)}}]},
  {name:'targetPort',items:[{label:'80',wide:true,on:function(S){return S.tp==80},click:function(S,A){S.tp=80;S.ran=false;vis(S,A)}},{label:'8000',wide:true,on:function(S){return S.tp==8000},click:function(S,A){S.tp=8000;S.ran=false;vis(S,A)}}]},
  {name:'type',items:[{label:'ClusterIP',wide:true,on:function(S){return S.type=='ClusterIP'},click:function(S,A){S.type='ClusterIP';S.ran=false;vis(S,A)}},{label:'LB',wide:true,on:function(S){return S.type=='LoadBalancer'},click:function(S,A){S.type='LoadBalancer';S.ran=false;vis(S,A)}}]},
  {items:[{label:'test both paths',wide:true,click:function(S,A){test(S,A)}}]}]},
 goal:function(S){var ok=S.ran&&S.okIn&&S.okOut;return [ok,ok?'Done. The selector matches the pod labels, targetPort hits the real app port, and the LoadBalancer type gives users a way in.':'Goal: the frontend must reach web inside the cluster, and users must reach it from the internet. Run the test and read each error.']},
 learn:[['Know why services exist',0],['Select pods with labels',1],['Map port and targetPort',2],['Use service DNS names',3],['Pick a service type',4],['Know how traffic is balanced',5],['Debug with endpoints',6]],
 steps:[
  {t:'Pods come and go',b:'Every new pod gets a new IP address. During a rollout or after a crash, the IPs change. Nothing should depend on a pod IP.',k:['idea','Key idea','A Service is a stable front for a changing group of pods.'],pill:'setup',tt:'Why',focus:['p0','p1','p2'],S:{sel:'web',tp:8000,type:'ClusterIP',ran:false,okIn:false,okOut:false},
   set:{p0:{status:'run'},p1:{status:'run'},p2:{status:'run'},svc:{sub:'endpoints: 3',status:'run'},lb:{show:false},code:{title:'service.yaml',rows:SV,hl:[]}},termClear:true,term:{term:['$ kubectl get pods -o wide -l app=web','web-a1  10.42.1.7','web-b2  10.42.2.4','web-c3  10.42.3.9   # new after restart']}},
  {t:'Selectors and endpoints',b:'A Service selects pods by label, like app: web. Kubernetes keeps a list of the matching, ready pods: the endpoints. Traffic only goes to those.',k:['problem','Watch out','One typo in the selector and the Service has zero endpoints. It exists, it has an IP, and it sends nowhere.'],pill:'problem',tt:'Selector',focus:['svc','p0','p1','p2'],
   set:{code:{rows:SV,hl:[5]}},termClear:true,term:{term:['$ kubectl get endpoints web','NAME  ENDPOINTS','web   10.42.1.7:8000,10.42.2.4:8000,...']},
   once:[{path:['svc','p0'],label:'',tone:'green'},{path:['svc','p2'],label:'',tone:'green',delay:400}]},
  {t:'port and targetPort',b:'port is what clients call on the Service. targetPort is where the container actually listens. They can differ: clients call 80, the app listens on 8000.',k:['tip','Remember','Wrong targetPort gives "connection refused": the pod is reached, but nothing listens on that port.'],pill:'idea',tt:'Ports',focus:['svc','p1'],
   set:{code:{title:'ports',rows:PORTS,hl:[1,2,6]}},termClear:true,term:{term:['$ kubectl exec frontend -- curl -s web','<h1>shop</h1>','# :80 on the service → :8000 in the pod']},
   once:[{path:['fe','svc','p1'],label:'80',wide:true,tone:'green'}]},
  {t:'Service DNS',b:'Each Service gets a DNS name. In the same namespace just use web. From another namespace use web.shop. The full name is web.shop.svc.cluster.local.',k:['idea','Key idea','This is how microservices find each other: by name, through cluster DNS.'],pill:'idea',tt:'DNS',focus:['fe','svc'],
   set:{code:{title:'DNS',rows:DNS,hl:[1,2,3]}},termClear:true,term:{term:['$ kubectl exec frontend -- nslookup web.shop','Name:    web.shop.svc.cluster.local','Address: 10.96.14.20']}},
  {t:'Service types',b:'ClusterIP, the default, is reachable only inside the cluster. NodePort opens a port on every node. LoadBalancer asks the cloud for a real load balancer with a public address.',k:['problem','Watch out','Every LoadBalancer service costs a cloud load balancer. Many sites share one through Ingress instead.'],pill:'idea',tt:'Types',focus:['users','lb','svc'],S:{type:'LoadBalancer'},
   set:{lb:{show:true},code:{title:'types',rows:TYPES,hl:[1,3]}},termClear:true,term:{term:['$ kubectl get svc web','NAME  TYPE          EXTERNAL-IP','web   LoadBalancer  a1b2.elb.amazonaws.com']},
   once:[{path:['users','lb','svc'],label:'GET',tone:'green'}]},
  {t:'How traffic is spread',b:'kube-proxy programs every node so that the Service IP spreads connections across the endpoints. A headless Service skips the virtual IP and returns each pod\'s address, used by StatefulSets.',k:['tip','Remember','Only ready pods are endpoints. That is why readiness probes matter for zero-downtime rollouts.'],pill:'idea',tt:'Balance',focus:['svc','p0','p1','p2'],
   set:{code:{title:'types',rows:TYPES,hl:[4]}},termClear:true,term:{term:['$ for i in 1 2 3; do curl -s web/host; done','web-a1','web-c3','web-b2']},
   flows:[{path:['svc','p0'],label:'',tone:'green'},{path:['svc','p1'],label:'',tone:'green'},{path:['svc','p2'],label:'',tone:'green'}]},
  {t:'Debugging services',b:'If a Service does not answer: check endpoints first, then labels and targetPort, then the pod itself. kubectl port-forward lets you test a service from your laptop.',k:['tip','Remember','No endpoints → selector or readiness. Refused → targetPort. Timeout → network policy or the app.'],pill:'problem',tt:'Debug',focus:['svc','p1'],
   set:{code:{title:'service.yaml',rows:SV,hl:[5,7]}},termClear:true,term:{term:['$ kubectl get endpoints web','web   <none>','$ kubectl get pods --show-labels | head -2','web-a1  app=web,pod-template-hash=7d4b9','$ kubectl port-forward svc/web 8080:80']}},
  {t:'Try it: fix the service',b:'service web is broken in three ways. Fix the selector, the target port and the type, then test from inside the cluster and from the internet.',k:['tip','Challenge','Change one thing at a time and test after each. Each error message points to one setting.'],pill:'problem',tt:'Try it',S:{sel:'web-v2',tp:80,type:'ClusterIP',ran:false,okIn:false,okOut:false},goal:true,focus:null,
   set:{p0:{status:'sleep'},p1:{status:'sleep'},p2:{status:'sleep'},svc:{sub:'endpoints: 0',status:'#e5534b'},lb:{show:false},code:{title:'service.yaml',rows:SV,hl:[]}},termClear:true,term:{term:['$ kubectl get svc web','web   ClusterIP   10.96.14.20']}},
  {t:'Recap',b:'A Service gives pods a stable name and IP, selects them by label, maps port to targetPort, and its type decides who can reach it. Endpoints are the first thing to check.',k:['idea','Next up','Ingress and DNS: route many websites through one load balancer.'],pill:'recap',tt:'Recap',S:{sel:'web',tp:8000,type:'LoadBalancer',ran:true,okIn:true,okOut:true},
   set:{p0:{status:'run'},p1:{status:'run'},p2:{status:'run'},svc:{sub:'endpoints: 3',status:'run'},lb:{show:true},code:{title:'service.yaml',rows:SV,hl:[]}},termClear:true,term:{term:['✓ selector ✓ targetPort ✓ LoadBalancer']}}
 ]});
})();
