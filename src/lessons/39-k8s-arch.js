(function(){
var NODES=['n1','n2','n3'];
function alive(S){return NODES.filter(function(n){return S.down.indexOf(n)<0})}
function place(S){var cnt={};alive(S).forEach(function(n){cnt[n]=0});S.pods=S.pods.filter(function(p){return S.down.indexOf(p)<0});S.pods.forEach(function(p){cnt[p]++});
 while(S.pods.length<S.want&&alive(S).length){var best=alive(S).sort(function(a,b){return cnt[a]-cnt[b]})[0];S.pods.push(best);cnt[best]++}while(S.pods.length>S.want)S.pods.pop()}
function cnt(S,n){return S.pods.filter(function(p){return p==n}).length}
var CP=['Control plane',{t:'kube-apiserver   the front door, all calls',tone:'gold'},{t:'etcd             stores the desired state',tone:'gold'},{t:'scheduler        picks a node for new pods',tone:'gold'},{t:'controllers      fix differences, forever',tone:'gold'},'','Worker node',{t:'kubelet · container runtime · kube-proxy',tone:'green'}];
var LOOP=['The reconciliation loop',{t:'1 you declare: replicas: 3',tone:'gold'},{t:'2 a controller observes: 2 running',tone:'amber'},{t:'3 it acts: create 1 pod',tone:'green'},{t:'4 repeat, forever',tone:'gold'},'','You never say "start a pod on node 2".','You say what should exist.'];
var CTX=[{t:'kubectl config get-contexts',tone:'gold'},'  CURRENT  NAME       NAMESPACE','  *        prod-eks   web','           kind-dev   default','',{t:'kubectl get pods -n web',tone:'gold'},{t:'kubectl config use-context kind-dev',tone:'green'},'',{t:'Always check the context before you apply.',tone:'red'}];
var WHERE=['Where to run Kubernetes',{t:'learn    kind, minikube, k3d on a laptop',tone:'gold'},{t:'small    k3s on a few VMs',tone:'gold'},{t:'cloud    EKS, AKS, GKE: managed control',tone:'green'},{t:'         plane, you run the nodes',tone:'green'},'','Same kubectl and YAML everywhere.'];
function vis(S,A){NODES.forEach(function(n){var d=S.down.indexOf(n)>=0,c=cnt(S,n);A.set(n,{status:d?'dead':c?'run':'sleep',sub:d?'NotReady':c+' pod'+(c==1?'':'s')+' '+'●'.repeat(c)})});A.refresh()}
function act(S,A,a){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
 if(a=='apply'){S.applied=true;S.want=3;A.send(['you','api','etcd'],{label:'yaml',tone:'gold',ok:true});L(1100,function(){A.send(['sched','api'],{label:'bind',tone:'blue',ok:true})});L(1800,function(){var before=S.pods.slice();place(S);S.pods.forEach(function(p,i){if(i>=before.length)A.send(['api',p],{label:'pod',tone:'green',ok:true})});vis(S,A)});
  A.term('term',['$ kubectl apply -f web.yaml','deployment.apps/web created','$ kubectl get pods --no-headers | wc -l','3'],true)}
 if(a=='kill'){if(!S.applied){A.term('term',['# apply the deployment first'],true);return}if(S.down.length){A.term('term',['# n2 is already down'],true);return}S.down=['n2'];S.killed=true;S.pods=S.pods.filter(function(x){return x!='n2'});A.fx('n2','no');vis(S,A);
  A.term('term',['# node n2 lost power','$ kubectl get nodes','n1  Ready','n2  NotReady','n3  Ready'],true);L(1600,function(){A.send(['cm','api'],{label:'2<3',tone:'amber',ok:true})});L(2400,function(){place(S);A.send(['api',S.pods[S.pods.length-1]],{label:'pod',tone:'green',ok:true});vis(S,A);A.term('term',['# controller: want '+S.want+', had '+(S.want-1)+' → create 1','$ kubectl get pods | grep -c Running','3'])})}
 if(a=='scale'){if(!S.applied){A.term('term',['# apply the deployment first'],true);return}S.want=S.want==5?3:5;A.send(['you','api'],{label:'scale',tone:'gold',ok:true});L(900,function(){place(S);vis(S,A)});A.term('term',['$ kubectl scale deploy/web --replicas='+S.want,'deployment.apps/web scaled'],true)}
 if(a=='heal'){if(!S.down.length){A.term('term',['# all nodes are healthy'],true);return}S.down=[];vis(S,A);A.term('term',['# n2 back: Ready','# pods are NOT moved back automatically'],true)}}
LESSON('k8s','arch',{
 title:'Kubernetes architecture',sub:'The control plane, the worker nodes, and the loop that keeps reality equal to what you declared.',time:'15 min',level:'Intermediate',
 S:{applied:false,want:0,pods:[],down:[],killed:false},
 legend:[['#3fa456','node running pods'],['#3b82c4','node idle'],['#e5534b','node down']],
 hud:[{id:'w',l:'Desired',v:function(S){return String(S.want)},lv:'none'},{id:'r',l:'Running',v:function(S){return String(S.pods.length)},lv:function(S){return S.pods.length==S.want?'good':'warn'}},{id:'n',l:'Nodes ready',v:function(S){return alive(S).length+' / 3'},lv:function(S){return S.down.length?'warn':'good'}},{id:'c',l:'Context',v:'kind-dev',lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:62,y:60,tone:'gold',label:'kubectl',n:1,w:44,anchor:[106,60]},
  H.box('api',210,30,'API server','blue',{center:true}),
  H.tile('etcd',332,46,'etcd','desired state','violet',{w:104}),
  H.tile('sched',332,128,'scheduler','places pods','blue',{w:110}),
  H.tile('cm',70,152,'controllers','watch and fix','amber',{w:120}),
  H.tile('n1',70,280,'node n1','0 pods','green',{w:112,status:'sleep'}),H.tile('n2',196,280,'node n2','0 pods','green',{w:112,status:'sleep'}),H.tile('n3',322,280,'node n3','0 pods','green',{w:112,status:'sleep'}),
  H.tile('kub',196,384,'kubelet on each node','runs the containers','slate',{w:174}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'components',rows:CP,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','api','gold'),H.lk('api','etcd','violet'),H.lk('api','sched','blue'),H.lk('cm','api','amber'),H.lk('api','n1','green',{dash:true}),H.lk('api','n2','green',{dash:true}),H.lk('api','n3','green',{dash:true}),H.lk('n2','kub','slate',{dash:true})],
 controls:{title:'Operate the cluster',groups:[{items:[['apply','kubectl apply (3 replicas)'],['kill','power off node n2'],['scale','scale 3 ↔ 5'],['heal','bring n2 back']].map(function(g){return {label:g[1],wide:true,click:function(S,A){act(S,A,g[0])}}})}]},
 goal:function(S){var ok=S.killed&&S.pods.length==S.want&&S.want>0;return [ok,ok?'Done. A node died, the controller saw 2 of 3, and the scheduler started a replacement on a healthy node. Nobody ran a command.':'Goal: deploy 3 replicas, power off a node, and watch the cluster heal itself.']},
 learn:[['Know why orchestration',0],['Name the control plane parts',1],['Name the node parts',2],['Understand reconciliation',3],['Talk to the API with kubectl',4],['Use namespaces and contexts',5],['Choose where to run it',6]],
 steps:[
  {t:'Why an orchestrator',b:'Docker runs containers on one machine. With many machines you need something to place containers, restart them, scale them and roll out new versions. That is Kubernetes.',k:['idea','Key idea','You describe what should run. Kubernetes decides where, and keeps it that way.'],pill:'setup',tt:'Why',focus:['n1','n2','n3'],S:{applied:false,want:0,pods:[],down:[],killed:false},
   set:{n1:{status:'sleep',sub:'0 pods'},n2:{status:'sleep',sub:'0 pods'},n3:{status:'sleep',sub:'0 pods'},info:{title:'components',rows:CP,hl:[]}},termClear:true,term:{term:['$ kubectl get nodes','NAME  STATUS  ROLES','n1    Ready   <none>','n2    Ready   <none>','n3    Ready   <none>']}},
  {t:'The control plane',b:'The API server is the only entry point. etcd stores every object. The scheduler picks a node for each new pod. Controllers compare desired and actual state and fix differences.',k:['tip','Remember','On EKS, AKS or GKE the cloud runs the control plane for you. You still need to know what each part does.'],pill:'idea',tt:'Control',focus:['api','etcd','sched','cm'],
   set:{info:{rows:CP,hl:[1,2,3,4]}},termClear:true,term:{term:['$ kubectl get --raw /readyz','ok','$ kubectl -n kube-system get pods | head -3']},
   once:[{path:['api','etcd'],label:'',tone:'violet'},{path:['cm','api'],label:'',tone:'amber',delay:500},{path:['api','sched'],label:'',tone:'blue',delay:1000}]},
  {t:'Worker nodes',b:'Every worker runs the kubelet, which starts the containers it is told to run, a container runtime like containerd, and kube-proxy for service networking.',k:['idea','Key idea','Nodes are cattle, not pets. If one dies, its pods are recreated elsewhere.'],pill:'idea',tt:'Nodes',focus:['n1','n2','n3','kub'],
   set:{info:{rows:CP,hl:[6,7]}},termClear:true,term:{term:['$ kubectl describe node n2 | grep -i runtime','Container Runtime Version: containerd://1.7.22']}},
  {t:'Desired state and reconciliation',b:'You store desired state through the API: "3 replicas of web". Controllers watch and act until reality matches. That loop never stops, which is why the cluster heals itself.',k:['tip','Remember','If something "comes back by itself" after you delete it, a controller is doing its job. Change the desired state instead.'],pill:'idea',tt:'Loop',focus:['cm','api','n1','n2','n3'],S:{applied:true,want:3,pods:['n1','n2','n3']},
   set:{n1:{status:'run',sub:'1 pod ●'},n2:{status:'run',sub:'1 pod ●'},n3:{status:'run',sub:'1 pod ●'},info:{title:'reconciliation',rows:LOOP,hl:[1,2,3]}},termClear:true,term:{term:['$ kubectl delete pod web-7d4b9-x2kq','pod "web-7d4b9-x2kq" deleted','$ kubectl get pods | grep -c Running','3   # a new one already started']},
   once:[{path:['cm','api','n2'],label:'+1',tone:'green'}]},
  {t:'kubectl and the API',b:'kubectl sends your YAML to the API server. get lists objects, describe shows details and events, logs shows container output, apply creates or updates from a file.',k:['tip','Remember','kubectl describe is the first stop when anything is stuck: the Events at the bottom say why.'],pill:'idea',tt:'kubectl',focus:['you','api'],
   set:{info:{title:'components',rows:CP,hl:[1]}},termClear:true,term:{term:['$ kubectl get deploy web','NAME  READY  UP-TO-DATE  AVAILABLE','web   3/3    3           3','$ kubectl describe pod web-7d4b9-a1b2']},
   once:[{path:['you','api'],label:'get',tone:'gold'}]},
  {t:'Namespaces and contexts',b:'Namespaces split one cluster into areas, like web and monitoring. A context is a cluster plus user plus default namespace. kubectl acts on the current context.',k:['problem','Watch out','Applying to the wrong context means changing prod when you meant dev. Show the context in your prompt.'],pill:'problem',tt:'Context',focus:['you','api'],
   set:{info:{title:'contexts',rows:CTX,hl:[2,8]}},termClear:true,term:{term:['$ kubectl config current-context','kind-dev','$ kubectl get ns','default  kube-system  web']}},
  {t:'Where to run it',b:'Learn on a laptop with kind or minikube. Run small clusters with k3s. In production most teams use a managed service like EKS, where the cloud runs the control plane.',k:['tip','Remember','kind create cluster gives you a working cluster in about a minute, inside Docker.'],pill:'idea',tt:'Where',focus:['api'],
   set:{info:{title:'where to run',rows:WHERE,hl:[1,3]}},termClear:true,term:{term:['$ kind create cluster --name dev','Creating cluster "dev" ...',' ✓ Ensuring node image','Set kubectl context to "kind-dev"']}},
  {t:'Try it: lose a node',b:'Deploy three replicas of web, then power off node n2. Watch what the control plane does without any help from you.',k:['tip','Challenge','After it heals, bring n2 back. Do the pods move back to it? Why not?'],pill:'problem',tt:'Try it',S:{applied:false,want:0,pods:[],down:[],killed:false},goal:true,focus:null,
   set:{n1:{status:'sleep',sub:'0 pods'},n2:{status:'sleep',sub:'0 pods'},n3:{status:'sleep',sub:'0 pods'},info:{title:'reconciliation',rows:LOOP,hl:[]}},termClear:true,term:{term:['$ kubectl get deploy','No resources found in default namespace.']}},
  {t:'Recap',b:'The API server is the front door, etcd stores desired state, the scheduler places pods, controllers reconcile, and kubelets run containers on the nodes. You declare, the cluster converges.',k:['idea','Next up','Pods and Deployments: the objects you will write most.'],pill:'recap',tt:'Recap',S:{applied:true,want:3,pods:['n1','n3','n1'],down:['n2'],killed:true},
   set:{n1:{status:'run',sub:'2 pods ●●'},n2:{status:'dead',sub:'NotReady'},n3:{status:'run',sub:'1 pod ●'},info:{title:'components',rows:CP,hl:[]}},termClear:true,term:{term:['$ kubectl get deploy web','web   3/3    3           3']}}
 ]});
})();
