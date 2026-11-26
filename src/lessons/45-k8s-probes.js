(function(){
var G=[['ready','readiness probe'],['live','liveness probe'],['req','requests + limits'],['hpa','HPA 2–10 @ 60%']];
function n(S){return G.filter(function(g){return S[g[0]]}).length}
var EV=[['09:00 rollout, pods warm up 20 s','ready','no traffic until ready: 0 errors','traffic hit cold pods: 502 errors'],['11:30 web-2 deadlocks','live','liveness failed → container restarted','stuck pod kept getting traffic for hours'],['13:00 traffic ×5','hpa','HPA scaled 2 → 8 pods','2 pods at 100% CPU: slow site'],['15:00 memory leak in web-3','req','limit hit → only web-3 OOMKilled','leak ate the node: neighbours evicted']];
function res(S,i){var e=EV[i],k=e[1],ok=!!S[k];if(k=='hpa'&&S.hpa&&!S.req)return [false,'HPA: missing request for cpu, cannot scale'];return [ok,ok?e[2]:e[3]]}
var PRB=[{t:'readinessProbe:',tone:'gold'},'  httpGet: { path: /ready, port: 8000 }','  periodSeconds: 5',{t:'livenessProbe:',tone:'gold'},'  httpGet: { path: /healthz, port: 8000 }','  failureThreshold: 3',{t:'startupProbe:',tone:'gold'},'  httpGet: { path: /healthz, port: 8000 }','  failureThreshold: 30   # 30 × 10 s to boot'];
var RES=[{t:'resources:',tone:'gold'},'  requests: { cpu: 250m, memory: 256Mi }','  limits:   { memory: 512Mi }','',{t:'requests  what the scheduler reserves',tone:'green'},{t:'limits    the hard ceiling',tone:'green'},'over memory limit → OOMKilled','over CPU limit → throttled (slower)'];
var HPA=[{t:'kind: HorizontalPodAutoscaler',tone:'gold'},'spec:','  scaleTargetRef: { kind: Deployment, name: web }','  minReplicas: 2','  maxReplicas: 10','  metrics:','  - type: Resource','    resource:','      name: cpu',{t:'      target: { type: Utilization, averageUtilization: 60 }',tone:'green'}];
var DIFF=['Three probes, three questions',{t:'startup    has the app finished booting?',tone:'gold'},{t:'readiness  can it take traffic right now?',tone:'gold'},'           no → removed from Service endpoints',{t:'liveness   is it stuck?',tone:'gold'},'           no → container restarted','',{t:'Do not check the database in liveness:',tone:'red'},{t:'a DB outage would restart every pod.',tone:'red'}];
function sim(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;
 L(100,function(){A.send(['svc','p3'],{label:'GET',tone:S.ready?'green':'red',ok:!!S.ready,denyAt:'p3'})});
 L(900,function(){A.set('p2',{status:'dead'});if(S.live)L(700,function(){A.set('p2',{status:'run'});A.fx('p2','ok')})});
 L(1800,function(){if(res(S,2)[0]){A.set('p4',{show:true});A.set('p5',{show:true});A.send(['hpa','svc'],{label:'+6',tone:'green',ok:true})}else A.fx('p1','no')});
 L(2600,function(){if(S.req){A.set('p3',{status:'dead'});L(500,function(){A.set('p3',{status:'run'})})}else{A.set('p1',{status:'dead'});A.set('p2',{status:'dead'});A.set('p3',{status:'dead'})}});
 L(3400,function(){S.ran=true;S.score=[0,1,2,3].filter(function(i){return res(S,i)[0]}).length;var Lx=['# one day in production'];[0,1,2,3].forEach(function(i){var r=res(S,i);Lx.push((r[0]?'✓ ':'! ')+EV[i][0]);Lx.push((r[0]?'    ':'!   ')+r[1])});A.term('term',Lx,true);A.refresh()})}
function reset(S,A){['p1','p2','p3'].forEach(function(p){A.set(p,{status:'run'})});A.set('p4',{show:false});A.set('p5',{show:false});A.refresh()}
LESSON('k8s','probes',{
 title:'Probes, resources & autoscaling',sub:'Tell Kubernetes when a pod is ready and when it is stuck, size it with requests and limits, and scale it automatically.',time:'16 min',level:'Intermediate',
 S:{ready:false,live:false,req:false,hpa:false,ran:false,score:0},
 legend:[['#3fa456','healthy pod'],['#e5534b','failed / restarting'],['#3b82c4','added by HPA']],
 hud:[{id:'n',l:'Safeguards',v:function(S){return n(S)+' / 4'},lv:function(S){return n(S)==4?'good':'warn'}},{id:'p',l:'Pods',v:function(S){return S.ran&&res(S,2)[0]?'8':'3'},lv:'none'},{id:'r',l:'Requests set',v:function(S){return S.req?'yes':'no'},lv:function(S){return S.req?'good':'warn'}},{id:'d',l:'Day result',v:function(S){return !S.ran?'—':S.score==4?'no incidents':(4-S.score)+' incidents'},lv:function(S){return !S.ran?'none':S.score==4?'good':'bad'}}],
 nodes:[
  H.box('svc',200,30,'Service web','blue',{center:true}),
  H.tile('p1',74,170,'web-1','ready','green',{w:100,status:'run'}),H.tile('p2',190,170,'web-2','ready','green',{w:100,status:'run'}),H.tile('p3',306,170,'web-3','new, warming','green',{w:110,status:'run'}),
  H.tile('p4',132,250,'web-4','added','blue',{w:100,status:'run',show:false}),H.tile('p5',248,250,'web-5..8','added','blue',{w:110,status:'run',show:false}),
  H.tile('hpa',74,350,'HPA','cpu target 60%','violet',{w:118}),
  H.tile('ms',250,350,'metrics-server','CPU per pod','slate',{w:134}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:202,title:'probes',rows:PRB,fs:8.4},
  {t:'term',id:'term',x:392,y:228,w:316,h:222,title:'events'}],
 links:[H.lk('svc','p1','blue'),H.lk('svc','p2','blue'),H.lk('svc','p3','blue',{dash:true}),H.lk('ms','hpa','slate',{dash:true}),H.lk('hpa','p4','violet',{dash:true})],
 controls:{title:'Harden deployment web',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;reset(S,A)}}}).concat([{label:'simulate a day',wide:true,click:function(S,A){reset(S,A);sim(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&S.score==4;return [ok,ok?'Done. Readiness kept traffic off cold pods, liveness restarted the stuck one, requests let the HPA scale and limits contained the leak.':S.ran&&S.hpa&&!S.req?'Notice the HPA failed: CPU utilization is measured against the request. No request, no autoscaling.':'Goal: get through a day with no incidents. Simulate with nothing turned on and read what breaks.']},
 learn:[['Use readiness probes',0],['Use liveness and startup probes',1],['Set requests and limits',2],['Know what OOMKilled means',3],['Autoscale with the HPA',4],['Avoid probe mistakes',5],['Scale nodes too',6]],
 steps:[
  {t:'Readiness: ready for traffic?',b:'A readiness probe asks the pod "can you serve now?". Until it says yes, the pod gets no traffic. During rollouts this is what makes them zero-downtime.',k:['idea','Key idea','Failing readiness never restarts a pod. It just takes it out of the Service until it recovers.'],pill:'setup',tt:'Ready',focus:['svc','p3'],S:{ready:false,live:false,req:false,hpa:false,ran:false,score:0},
   set:{p1:{status:'run'},p2:{status:'run'},p3:{status:'run'},p4:{show:false},p5:{show:false},code:{title:'probes',rows:PRB,hl:[0,1,2]}},termClear:true,term:{term:['$ kubectl get pods','web-3  0/1  Running   # not ready yet','$ kubectl get endpoints web | wc -w','4   # web-3 not in the list']},
   once:[{path:['svc','p3'],label:'GET',tone:'amber',ok:false,denyAt:'p3'}]},
  {t:'Liveness and startup',b:'A liveness probe asks "are you stuck?". After a few failures the kubelet restarts the container. A startup probe gives slow apps time to boot before liveness starts checking.',k:['problem','Watch out','A liveness probe that is too strict restarts healthy but busy pods in a loop.'],pill:'idea',tt:'Live',focus:['p2'],S:{ready:true,live:true},
   set:{code:{title:'probes',rows:PRB,hl:[3,4,5,6,8]}},termClear:true,term:{term:['Warning  Unhealthy  Liveness probe failed:','  HTTP probe failed with statuscode: 500','Normal Killing: web will be restarted']},
   timed:[{at:300,set:{p2:{status:'dead'}}},{at:1500,set:{p2:{status:'run'}}}]},
  {t:'Requests and limits',b:'requests are what the scheduler reserves on a node for the pod. limits are the ceiling. Above the memory limit the container is killed, above the CPU limit it is slowed down.',k:['tip','Remember','Always set requests. Many teams set a memory limit but no CPU limit, to avoid needless throttling.'],pill:'idea',tt:'Resources',focus:['p1','p2','p3'],S:{req:true},
   set:{code:{title:'resources',rows:RES,hl:[1,2,4,5]}},termClear:true,term:{term:['$ kubectl top pods','web-1   120m   210Mi','web-2   135m   198Mi','web-3   480m   509Mi']}},
  {t:'OOMKilled',b:'When a container goes over its memory limit, the kernel kills it and the pod shows OOMKilled. Without limits, one leaking pod can starve every other pod on the node.',k:['problem','Watch out','Repeated OOMKilled means raise the limit or fix the leak. Check kubectl describe for "Last State".'],pill:'problem',tt:'OOM',focus:['p3'],
   set:{code:{title:'resources',rows:RES,hl:[6]}},termClear:true,term:{term:['$ kubectl describe pod web-3','    Last State: Terminated','      Reason:   OOMKilled','      Exit Code: 137']},
   timed:[{at:300,set:{p3:{status:'dead'}}},{at:1600,set:{p3:{status:'run'}}}]},
  {t:'The Horizontal Pod Autoscaler',b:'The HPA reads CPU from metrics-server and changes the replica count to keep average usage near the target, here 60% of the CPU request, between 2 and 10 pods.',k:['idea','Key idea','Utilization is relative to the request. That is why HPA does nothing for pods without requests.'],pill:'idea',tt:'HPA',focus:['hpa','ms','p4','p5'],S:{hpa:true},
   set:{p4:{show:true},p5:{show:true},code:{title:'hpa',rows:HPA,hl:[3,4,9]}},termClear:true,term:{term:['$ kubectl get hpa web','NAME  TARGETS  MINPODS  MAXPODS  REPLICAS','web   58%/60%  2        10       8']},
   once:[{path:['ms','hpa'],label:'cpu',tone:'slate'},{path:['hpa','p4'],label:'+',tone:'violet',delay:800}]},
  {t:'Common probe mistakes',b:'Keep liveness cheap and local: is this process alive? Put dependency checks, like the database, in readiness at most. Otherwise one database blip restarts your whole fleet.',k:['tip','Remember','Use separate endpoints: /healthz for liveness, /ready for readiness.'],pill:'problem',tt:'Mistakes',focus:['p1','p2','p3'],
   set:{p4:{show:false},p5:{show:false},code:{title:'probe types',rows:DIFF,hl:[1,2,4,7,8]}},termClear:true,term:{term:['# DB down for 30 s, liveness checks the DB:','! all 3 pods restarted at once']}},
  {t:'Scaling the nodes',b:'The HPA adds pods, but pods need room. The Cluster Autoscaler or Karpenter adds nodes when pods are Pending for lack of CPU or memory, and removes empty ones.',k:['tip','Remember','Pods Pending with "Insufficient cpu" is the signal for node scaling. Requests again decide everything.'],pill:'idea',tt:'Nodes',focus:['hpa'],
   set:{code:{title:'hpa',rows:HPA,hl:[]}},termClear:true,term:{term:['$ kubectl get pods | grep Pending','web-9  0/1  Pending','# Karpenter: launching 1 node (m7i.large)']}},
  {t:'Try it: a day in production',b:'Choose your safeguards, then simulate a day with a slow-starting rollout, a deadlock, a traffic spike and a memory leak.',k:['tip','Challenge','Turn on the HPA without requests and limits. Why does it still fail?'],pill:'problem',tt:'Try it',S:{ready:false,live:false,req:false,hpa:false,ran:false,score:0},goal:true,focus:null,
   set:{p1:{status:'run'},p2:{status:'run'},p3:{status:'run'},p4:{show:false},p5:{show:false},code:{title:'probes',rows:PRB,hl:[]}},termClear:true,term:{term:['$ kubectl get deploy web','web   3/3    3           3']}},
  {t:'Recap',b:'Readiness controls traffic, liveness restarts stuck containers, startup protects slow boots. Requests and limits size pods, and the HPA scales them using those requests.',k:['idea','Next up','RBAC and Helm: who may change the cluster, and packaging apps.'],pill:'recap',tt:'Recap',S:{ready:true,live:true,req:true,hpa:true,ran:true,score:4},
   set:{p4:{show:true},p5:{show:true},code:{title:'probes',rows:PRB,hl:[]}},termClear:true,term:{term:['✓ ready ✓ live ✓ resources ✓ HPA']}}
 ]});
})();
