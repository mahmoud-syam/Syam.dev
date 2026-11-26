(function(){
function eff(S){return S.mode=='env'?S.podEnv:(S.fileSynced?S.cm:S.podEnv)}
var CMY=[{t:'apiVersion: v1',tone:'gold'},'kind: ConfigMap','metadata: { name: app-config }','data:',function(S){return {t:'  LOG_LEVEL: "'+S.cm+'"',tone:S.cm=='debug'?'amber':undefined}},'  FEATURE_CART: "true"','',function(S){return S.mode=='env'?{t:'# pod: envFrom configMapRef app-config',tone:'green'}:{t:'# pod: volume → /etc/app/config',tone:'green'}}];
var CV=CMY.map(function(c){return function(S){return typeof c=='function'?c(S):c}});
var SEC=[{t:'kind: Secret',tone:'gold'},'type: Opaque','data:',{t:'  DB_PASSWORD: UzNjcjN0IQ==',tone:'amber'},'',{t:'$ echo UzNjcjN0IQ== | base64 -d',tone:'red'},{t:'S3cr3t!',tone:'red'},'','base64 is encoding, not encryption.'];
var PROT=['Protecting Secrets',{t:'✓ RBAC: few people can read secrets',tone:'green'},{t:'✓ encryption at rest for etcd (KMS)',tone:'green'},{t:'✓ External Secrets Operator: pull from',tone:'green'},{t:'  AWS Secrets Manager or Vault',tone:'green'},{t:'✓ Sealed Secrets: safe to commit',tone:'green'},'',{t:'Never commit a plain Secret YAML to Git.',tone:'red'}];
var USE=['Two ways to use config',{t:'env var   read once, at container start',tone:'gold'},'          change needs a pod restart',{t:'volume    a file per key',tone:'gold'},'          kubelet updates it (~1 min)','          the app must re-read the file','',{t:'kubectl rollout restart deploy/web',tone:'green'}];
function vis(S,A){var e=eff(S);A.set('cm',{sub:'LOG_LEVEL='+S.cm,status:S.cm=='debug'?'stop':'run'});A.set('pod',{sub:'sees LOG_LEVEL='+e,status:e=='debug'?'run':'sleep'});A.set('code',{rows:CV});A.refresh()}
function act(S,A,a){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
 if(a=='env'||a=='file'){S.mode=a;S.podEnv=S.cm;S.fileSynced=false;A.term('term',['# pod recreated, mode: '+(a=='env'?'env var':'mounted file')],true)}
 if(a=='edit'){S.cm=S.cm=='debug'?'info':'debug';S.fileSynced=false;A.send(['you','cm'],{label:'edit',tone:'gold',ok:true});A.term('term',['$ kubectl edit configmap app-config','configmap/app-config edited','# LOG_LEVEL: "'+S.cm+'"'],true);
  if(S.mode=='file')L(2200,function(){S.fileSynced=true;A.send(['cm','pod'],{label:'sync',tone:'blue',ok:true});vis(S,A);A.term('term',['# kubelet updated /etc/app/config/LOG_LEVEL'])})}
 if(a=='restart'){S.podEnv=S.cm;S.fileSynced=false;S.restarted=true;A.send(['you','pod'],{label:'restart',tone:'green',ok:true});A.term('term',['$ kubectl rollout restart deploy/web','deployment.apps/web restarted'],true)}
 if(a=='check'){var e=eff(S);if(e=='debug')S.seen=true;A.term('term',['$ kubectl exec web-a1 -- printenv LOG_LEVEL',S.mode=='env'?e:'info','$ kubectl exec web-a1 -- cat \\','    /etc/app/config/LOG_LEVEL',S.mode=='file'?e:'(not mounted)'],true)}
 if(a=='decode'){S.dec=true;A.send(['sec','you'],{label:'b64',tone:'red',ok:true});A.set('code',{title:'secret db-creds',rows:SEC,hl:[3,5,6]});A.term('term',['$ kubectl get secret db-creds -o \\','    jsonpath="{.data.DB_PASSWORD}" | base64 -d','S3cr3t!'],true);return}
 vis(S,A)}
LESSON('k8s','config',{
 title:'ConfigMaps & Secrets',sub:'Keep configuration out of the image, understand how changes reach pods, and why Secrets need extra protection.',time:'15 min',level:'Intermediate',
 S:{mode:'env',cm:'info',podEnv:'info',fileSynced:false,restarted:false,seen:false,dec:false},
 legend:[['#3fa456','pod sees the new value'],['#3b82c4','pod has the old value'],['#e5534b','secret exposed']],
 hud:[{id:'c',l:'ConfigMap',v:function(S){return S.cm},lv:'none'},{id:'p',l:'Pod sees',v:function(S){return eff(S)},lv:function(S){return eff(S)==S.cm?'good':'warn'}},{id:'m',l:'Mode',v:function(S){return S.mode=='env'?'env var':'file'},lv:'none'},{id:'s',l:'Secret',v:function(S){return S.dec?'decoded!':'base64'},lv:function(S){return S.dec?'bad':'warn'}}],
 nodes:[
  {t:'crowd',id:'you',x:62,y:60,tone:'gold',label:'kubectl',n:1,w:44,anchor:[106,60]},
  H.tile('cm',224,60,'ConfigMap','LOG_LEVEL=info','amber',{w:136,status:'run'}),
  H.tile('sec',70,196,'Secret db-creds','base64 encoded','red',{w:134}),
  H.tile('pod',224,196,'pod web','sees LOG_LEVEL=info','green',{w:150,status:'sleep'}),
  H.tile('img',224,316,'image app:1.6','same in dev + prod','slate',{w:150}),
  H.tile('ext',70,316,'External Secrets','AWS Secrets Manager','violet',{w:140}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'configmap app-config',rows:CV,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','cm','gold'),H.lk('cm','pod','amber'),H.lk('sec','pod','red',{dash:true}),H.lk('img','pod','slate'),H.lk('ext','sec','violet',{dash:true})],
 controls:{title:'Change LOG_LEVEL',groups:[{name:'mode',items:[{label:'env var',wide:true,on:function(S){return S.mode=='env'},click:function(S,A){act(S,A,'env')}},{label:'file',wide:true,on:function(S){return S.mode=='file'},click:function(S,A){act(S,A,'file')}}]},
  {items:[['edit','edit ConfigMap'],['check','check the pod'],['restart','rollout restart'],['decode','decode the Secret']].map(function(g){return {label:g[1],wide:true,click:function(S,A){act(S,A,g[0])}}})}]},
 goal:function(S){var ok=S.seen&&S.dec;return [ok,ok?'Done. The env var only changed after a restart, a mounted file updates by itself, and anyone who can read a Secret can decode it.':'Goal: switch LOG_LEVEL to debug and get the pod to actually use it, then see what a Secret really protects. Check the pod after each step.']},
 learn:[['Keep config out of images',0],['Create a ConfigMap',1],['Use config as env or files',2],['Roll out config changes',3],['Know what Secrets are',4],['Protect Secrets properly',5],['Use immutable config',6]],
 steps:[
  {t:'Config outside the image',b:'Build one image and run it everywhere. What changes between dev and prod, like log level, URLs and feature flags, comes from outside: ConfigMaps for settings, Secrets for passwords.',k:['idea','Key idea','If you rebuild the image to change a setting, the setting is in the wrong place.'],pill:'setup',tt:'Why',focus:['img','cm','pod'],S:{mode:'env',cm:'info',podEnv:'info',fileSynced:false,restarted:false,seen:false,dec:false},
   set:{cm:{sub:'LOG_LEVEL=info',status:'run'},pod:{sub:'sees LOG_LEVEL=info',status:'sleep'},code:{title:'configmap app-config',rows:CV,hl:[]}},termClear:true,term:{term:['$ docker inspect app:1.6 | grep -c LOG_LEVEL','0   # good: not baked in']}},
  {t:'Creating a ConfigMap',b:'A ConfigMap is a set of key-value pairs, or whole files. Create it from YAML, from literals, or from a config file.',k:['tip','Remember','Keep ConfigMap YAML in Git next to the Deployment. It is part of the app.'],pill:'idea',tt:'ConfigMap',focus:['you','cm'],
   set:{code:{rows:CV,hl:[3,4,5]}},termClear:true,term:{term:['$ kubectl create configmap app-config \\','    --from-literal=LOG_LEVEL=info \\','    --dry-run=client -o yaml > config.yaml']},
   once:[{path:['you','cm'],label:'yaml',tone:'gold'}]},
  {t:'Env vars or files',b:'Inject keys as environment variables, or mount the ConfigMap as a folder where each key is a file. Files suit whole config files like nginx.conf.',k:['problem','Watch out','Env vars are read once at startup. The running app will not notice a ConfigMap change.'],pill:'idea',tt:'Use',focus:['cm','pod'],
   set:{code:{title:'env or file',rows:USE,hl:[1,2,3,4]}},termClear:true,term:{term:['$ kubectl exec web-a1 -- printenv LOG_LEVEL','info']},
   once:[{path:['cm','pod'],label:'env',tone:'amber'}]},
  {t:'Rolling out a change',b:'After editing a ConfigMap used as env vars, restart the Deployment so new pods read the new value. Helm and Kustomize can do this automatically with a hash in the name or an annotation.',k:['tip','Remember','A rollout restart is a normal rolling update: no downtime if your probes are right.'],pill:'idea',tt:'Restart',focus:['you','pod'],S:{cm:'debug',podEnv:'debug'},
   set:{cm:{sub:'LOG_LEVEL=debug',status:'stop'},pod:{sub:'sees LOG_LEVEL=debug',status:'run'},code:{title:'env or file',rows:USE,hl:[7]}},termClear:true,term:{term:['$ kubectl rollout restart deploy/web','$ kubectl exec web-a1 -- printenv LOG_LEVEL','debug']},
   once:[{path:['you','pod'],label:'restart',tone:'green'}]},
  {t:'Secrets are only base64',b:'A Secret looks like a ConfigMap, but values are base64 encoded. That keeps binary data safe in YAML. It is not encryption: anyone who can read the Secret can decode it.',k:['problem','Watch out','kubectl get secret -o yaml plus base64 -d reveals the password. Access to Secrets must be tightly limited.'],pill:'problem',tt:'Secrets',focus:['sec','pod'],
   set:{code:{title:'secret db-creds',rows:SEC,hl:[3,5,6,8]}},termClear:true,term:{term:['$ kubectl get secret db-creds -o yaml','  DB_PASSWORD: UzNjcjN0IQ==','$ echo UzNjcjN0IQ== | base64 -d','S3cr3t!']},
   once:[{path:['sec','you'],label:'b64',tone:'red'}]},
  {t:'Protecting Secrets',b:'Limit who can read Secrets with RBAC, encrypt etcd at rest, and keep the real values in a secret manager. External Secrets Operator syncs them into the cluster.',k:['tip','Remember','On EKS, turn on envelope encryption with KMS and use IAM roles for service accounts instead of keys.'],pill:'idea',tt:'Protect',focus:['ext','sec'],
   set:{code:{title:'protect',rows:PROT,hl:[1,2,3,7]}},termClear:true,term:{term:['$ kubectl get externalsecret db-creds','NAME      STORE           STATUS','db-creds  aws-secrets-mgr SecretSynced']},
   once:[{path:['ext','sec'],label:'sync',tone:'violet'}]},
  {t:'Immutable config',b:'Mark a ConfigMap or Secret immutable: true and it can never change, so nobody edits production by accident. To change it, create a new one with a new name and roll out.',k:['idea','Key idea','A new name per version (app-config-v7) makes every config change a normal, reversible rollout.'],pill:'idea',tt:'Immutable',focus:['cm'],
   set:{code:{title:'configmap app-config',rows:CV,hl:[]}},termClear:true,term:{term:['$ kubectl edit cm app-config-v7','! field is immutable when `immutable` is set']}},
  {t:'Try it: make the change stick',b:'Switch LOG_LEVEL to debug and make the running pod actually use it. Then look at what the Secret really protects.',k:['tip','Challenge','In env var mode, edit and check without restarting. Then try file mode and wait a moment before checking.'],pill:'problem',tt:'Try it',S:{mode:'env',cm:'info',podEnv:'info',fileSynced:false,restarted:false,seen:false,dec:false},goal:true,focus:null,
   set:{cm:{sub:'LOG_LEVEL=info',status:'run'},pod:{sub:'sees LOG_LEVEL=info',status:'sleep'},code:{title:'configmap app-config',rows:CV,hl:[]}},termClear:true,term:{term:['$ kubectl get cm,secret','configmap/app-config   2','secret/db-creds        1']}},
  {t:'Recap',b:'ConfigMaps and Secrets keep settings out of images. Env vars need a restart to change, mounted files update on their own. Secrets are encoded, not encrypted, so protect them.',k:['idea','Next up','Storage: volumes that outlive pods.'],pill:'recap',tt:'Recap',S:{mode:'env',cm:'debug',podEnv:'debug',restarted:true,seen:true,dec:true},
   set:{cm:{sub:'LOG_LEVEL=debug',status:'stop'},pod:{sub:'sees LOG_LEVEL=debug',status:'run'},code:{title:'protect',rows:PROT,hl:[]}},termClear:true,term:{term:['$ kubectl rollout restart deploy/web']}}
 ]});
})();
