(function(){
var G=[['rd','Role: deployments'],['rb','RoleBinding'],['ca','cluster-admin'],['rs','Role: secrets']];
var REQ=[['patch','deployments','shop',true],['get','secrets','shop',false],['patch','deployments','kube-system',false]];
function can(S,r){if(S.ca)return true;if(!S.rb||r[2]!='shop')return false;if(r[1]=='deployments'&&S.rd&&(r[0]=='patch'||r[0]=='get'))return true;if(r[1]=='secrets'&&S.rs&&r[0]=='get')return true;return false}
function good(S){return REQ.every(function(r){return can(S,r)==r[3]})&&!S.ca}
var ROLE=[{t:'kind: Role',tone:'gold'},'metadata: { name: deployer, namespace: shop }','rules:','- apiGroups: ["apps"]','  resources: ["deployments"]',{t:'  verbs: ["get", "list", "patch"]',tone:'green'},{t:'kind: RoleBinding',tone:'gold'},'subjects: [{ kind: ServiceAccount, name: ci-deployer }]','roleRef: { kind: Role, name: deployer }'];
var WHO=['Who is asking?',{t:'users           people, via your SSO / IAM',tone:'gold'},{t:'ServiceAccount  pods, CI, controllers',tone:'gold'},'',{t:'authentication  who are you?',tone:'gold'},{t:'authorization   may you do this? (RBAC)',tone:'green'}];
var KINDS=['RBAC objects',{t:'Role               rules in one namespace',tone:'gold'},{t:'ClusterRole        rules for the whole cluster',tone:'gold'},{t:'RoleBinding        give a role in a namespace',tone:'green'},{t:'ClusterRoleBinding give a role everywhere',tone:'red'},'','RBAC only allows. There are no deny rules:','anything not allowed is denied.'];
var CHART=['mychart/',{t:'  Chart.yaml       name, version',tone:'gold'},{t:'  values.yaml      the knobs',tone:'gold'},{t:'  templates/       YAML with {{ .Values.x }}',tone:'gold'},'','values-prod.yaml:','  replicas: 4','  image: { tag: "1.6" }'];
var HELM=['Helm lifecycle',{t:'helm install shop ./mychart -f values-prod.yaml',tone:'gold'},{t:'helm upgrade shop ./mychart --set image.tag=1.7',tone:'gold'},{t:'helm history shop',tone:'gold'},{t:'helm rollback shop 3',tone:'green'},{t:'helm list -A',tone:'gold'},'','Pin chart versions: --version 4.11.3'];
function test(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;
 REQ.forEach(function(r,i){var ok=can(S,r);L(200+i*700,function(){A.send(['ci','api',r[2]=='shop'?(r[1]=='secrets'?'sec':'dep'):'ks'],{label:r[0],tone:ok?'green':'red',ok:ok,denyAt:'api'})})});
 L(2500,function(){S.ran=true;A.term('term',REQ.map(function(r){var ok=can(S,r);return (ok==r[3]?'✓ ':'! ')+'can-i '+r[0]+' '+r[1]+' -n '+r[2]+': '+(ok?'yes':'no')}).concat(S.ca?['! cluster-admin: ci-deployer can do anything']:[]),true);A.refresh()})}
LESSON('k8s','rbac',{
 title:'RBAC & Helm',sub:'Control who may do what in the cluster with least privilege, and package apps as Helm charts.',time:'16 min',level:'Intermediate',
 S:{rd:false,rb:false,ca:false,rs:false,ran:false},
 legend:[['#3fa456','allowed'],['#e5534b','denied'],['#5a4aa8','service account']],
 hud:[{id:'a',l:'Patch deploy (shop)',v:function(S){return can(S,REQ[0])?'yes':'no'},lv:function(S){return can(S,REQ[0])?'good':'warn'}},{id:'b',l:'Read secrets',v:function(S){return can(S,REQ[1])?'yes':'no'},lv:function(S){return can(S,REQ[1])?'bad':'good'}},{id:'c',l:'kube-system',v:function(S){return can(S,REQ[2])?'yes':'no'},lv:function(S){return can(S,REQ[2])?'bad':'good'}},{id:'d',l:'cluster-admin',v:function(S){return S.ca?'bound':'no'},lv:function(S){return S.ca?'bad':'good'}}],
 nodes:[
  H.tile('ci',70,52,'ci-deployer','ServiceAccount','violet',{w:130}),
  H.box('api',220,30,'API server · RBAC','blue',{center:true,lock:true}),
  H.tile('dep',94,220,'deployments','namespace shop','green',{w:130}),
  H.tile('sec',236,220,'secrets','namespace shop','red',{w:118}),
  H.tile('ks',330,316,'kube-system','namespace','slate',{w:110}),
  H.tile('helm',94,330,'Helm chart','shop 1.7','gold',{w:120}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:186,title:'rbac.yaml',rows:ROLE,fs:8.6},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('ci','api','violet'),H.lk('api','dep','green',{dash:true}),H.lk('api','sec','red',{dash:true}),H.lk('api','ks','slate',{dash:true}),H.lk('helm','dep','gold',{dash:true})],
 controls:{title:'Permissions for CI',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;A.fx('api','pulse');A.refresh()}}}).concat([{label:'auth can-i',wide:true,click:function(S,A){test(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&good(S);if(ok)return [true,'Done. ci-deployer can patch deployments in shop and nothing else: no secrets, no kube-system, no cluster-admin.'];if(S.ran&&S.ca)return [false,'cluster-admin makes every check pass, including the ones that must fail. Remove it and grant only what the pipeline needs.'];return [false,'Goal: the CI pipeline must update deployments in shop, but must not read secrets or touch kube-system. Grant permissions, then check with can-i.']},
 learn:[['Know users vs service accounts',0],['Write Roles and ClusterRoles',1],['Bind roles to subjects',2],['Test with auth can-i',3],['Know Helm charts',4],['Install, upgrade, roll back',5],['Use Helm safely',6]],
 steps:[
  {t:'Who is asking?',b:'Every API call is made by someone: a person through your SSO, or a ServiceAccount used by pods and pipelines. Authentication says who, RBAC decides what they may do.',k:['idea','Key idea','Give every app and pipeline its own ServiceAccount. Never share the default one.'],pill:'setup',tt:'Who',focus:['ci','api'],S:{rd:false,rb:false,ca:false,rs:false,ran:false},
   set:{code:{title:'who',rows:WHO,hl:[2,5]}},termClear:true,term:{term:['$ kubectl create serviceaccount \\','    ci-deployer -n shop','serviceaccount/ci-deployer created']},
   once:[{path:['ci','api'],label:'?',tone:'violet'}]},
  {t:'Roles and ClusterRoles',b:'A Role lists allowed verbs on resources in one namespace: get, list, watch, create, patch, delete. A ClusterRole does the same across the whole cluster.',k:['tip','Remember','RBAC has no deny rules. If nothing allows an action, it is denied.'],pill:'idea',tt:'Roles',focus:['api','dep'],S:{rd:true},
   set:{code:{title:'rbac.yaml',rows:ROLE,hl:[0,3,4,5]}},termClear:true,term:{term:['$ kubectl apply -f role.yaml','role.rbac.../deployer created']}},
  {t:'Bindings',b:'A Role does nothing alone. A RoleBinding gives it to a subject in a namespace. A ClusterRoleBinding gives a role everywhere, so use those rarely.',k:['problem','Watch out','Binding cluster-admin to a CI account means one leaked token can delete the whole cluster.'],pill:'problem',tt:'Bind',focus:['ci','api','dep'],S:{rb:true},
   set:{code:{title:'objects',rows:KINDS,hl:[3,4,6,7]}},termClear:true,term:{term:['$ kubectl create rolebinding deployer \\','    --role deployer -n shop \\','    --serviceaccount shop:ci-deployer']},
   once:[{path:['ci','api','dep'],label:'patch',tone:'green'}]},
  {t:'Test with can-i',b:'kubectl auth can-i answers yes or no for any identity. Use --as to check a ServiceAccount before you hand its token to a pipeline.',k:['tip','Remember','kubectl auth can-i --list --as ... shows everything an identity may do.'],pill:'idea',tt:'can-i',focus:['ci','api','sec','ks'],
   set:{code:{title:'rbac.yaml',rows:ROLE,hl:[7,8]}},termClear:true,term:{term:['$ kubectl auth can-i patch deploy -n shop \\','    --as system:serviceaccount:shop:\\','ci-deployer','yes','$ kubectl auth can-i get secrets -n shop ...','no']},
   once:[{path:['ci','api','sec'],label:'get',tone:'red',ok:false,denyAt:'api'}]},
  {t:'Helm charts',b:'Helm is the package manager for Kubernetes. A chart is a folder of YAML templates plus a values.yaml. Different values files produce dev and prod from the same chart.',k:['idea','Key idea','Helm renders templates with your values, applies them, and remembers each release so it can roll back.'],pill:'idea',tt:'Charts',focus:['helm','dep'],
   set:{code:{title:'chart layout',rows:CHART,hl:[2,3,5]}},termClear:true,term:{term:['$ helm create mychart','Creating mychart','$ helm template shop ./mychart | head -3']}},
  {t:'Install, upgrade, roll back',b:'helm install creates a release, helm upgrade changes it, helm history lists revisions and helm rollback returns to one. Most public software ships as a chart.',k:['tip','Remember','helm upgrade --install works both the first time and every time after, which is ideal for CI.'],pill:'idea',tt:'Lifecycle',focus:['helm','dep'],
   set:{code:{title:'helm',rows:HELM,hl:[1,2,4]}},termClear:true,term:{term:['$ helm upgrade --install shop ./mychart \\','    -f values-prod.yaml','Release "shop" has been upgraded.','$ helm rollback shop 3']},
   once:[{path:['helm','dep'],label:'1.7',tone:'gold'}]},
  {t:'Helm safely',b:'Pin chart versions, keep values files in Git, preview changes with helm diff, and let a GitOps tool like Argo CD apply them so the cluster always matches Git.',k:['problem','Watch out','A chart from the internet runs with the permissions of whoever installs it. Read the values and the templates.'],pill:'idea',tt:'Safe',focus:['helm'],
   set:{code:{title:'helm',rows:HELM,hl:[7]}},termClear:true,term:{term:['$ helm diff upgrade shop ./mychart \\','    -f values-prod.yaml','-   replicas: 3','+   replicas: 4']}},
  {t:'Try it: least privilege for CI',b:'The pipeline deploys with the ci-deployer ServiceAccount. Give it exactly what it needs, then check three actions with can-i.',k:['tip','Challenge','Bind cluster-admin and run can-i. Everything says yes. Why is that a failure?'],pill:'problem',tt:'Try it',S:{rd:false,rb:false,ca:false,rs:false,ran:false},goal:true,focus:null,
   set:{code:{title:'rbac.yaml',rows:ROLE,hl:[]}},termClear:true,term:{term:['$ kubectl -n shop get sa','ci-deployer   0         5m']}},
  {t:'Recap',b:'ServiceAccounts identify workloads, Roles list allowed actions, bindings grant them, can-i verifies. Helm packages apps into charts with values per environment and easy rollbacks.',k:['idea','Next up','CI/CD: build, test and deploy automatically on every push.'],pill:'recap',tt:'Recap',S:{rd:true,rb:true,ca:false,rs:false,ran:true},
   set:{code:{title:'rbac.yaml',rows:ROLE,hl:[]}},termClear:true,term:{term:['✓ deploy in shop ✗ secrets ✗ kube-system']}}
 ]});
})();
