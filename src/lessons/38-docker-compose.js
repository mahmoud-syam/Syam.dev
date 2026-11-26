(function(){
var YML=[{t:'services:',tone:'gold'},'  web:','    image: ghcr.io/syam/app:1.6','    ports: ["8080:8000"]',{t:'    depends_on: { db: { condition: service_healthy } }',tone:'green'},'  db:','    image: postgres:16','    volumes: [pgdata:/var/lib/postgresql/data]',{t:'    healthcheck: { test: ["CMD", "pg_isready"] }',tone:'green'},{t:'volumes: { pgdata: {} }',tone:'gold'}];
var CMDS=['Everyday Compose',{t:'docker compose up -d       start the stack',tone:'gold'},{t:'docker compose ps          what is running',tone:'gold'},{t:'docker compose logs -f web follow logs',tone:'gold'},{t:'docker compose down        stop + remove',tone:'gold'},{t:'docker compose down -v     ...and volumes!',tone:'red'},'','No "version:" line needed any more.'];
var ENVF=[{t:'# .env (not in Git)',tone:'gold'},'APP_TAG=1.6','DB_PASSWORD=...','',{t:'# compose.yaml',tone:'gold'},'    image: ghcr.io/syam/app:${APP_TAG}','',{t:'compose.override.yaml is merged in',tone:'green'},{t:'automatically: dev-only settings live there.',tone:'green'}];
var REG=['Registries',{t:'Docker Hub   docker.io/user/app',tone:'gold'},{t:'GitHub       ghcr.io/user/app',tone:'gold'},{t:'AWS ECR      1234.dkr.ecr.eu-west-1...',tone:'gold'},'','The image name says where it lives:',{t:'registry/namespace/name:tag',tone:'green'}];
var STEPS=[['build','docker build'],['tag','docker tag'],['login','docker login ghcr.io'],['push','docker push'],['deploy','deploy on server']];
function act(S,A,a){var E=function(l){A.term('term',l,true);A.fx(a=='deploy'?'srv':'reg','no')};
 if(a=='build'){S.built=true;A.send(['you','img'],{label:'build',tone:'blue',ok:true});A.term('term',['$ docker build -t app:1.6 .','=> naming to docker.io/library/app:1.6'],true)}
 if(a=='tag'){if(!S.built)return E(['$ docker tag app:1.6 ghcr.io/syam/app:1.6','! No such image: app:1.6']);S.tagged=true;A.fx('img','ok');A.term('term',['$ docker tag app:1.6 ghcr.io/syam/app:1.6','$ docker tag app:1.6 ghcr.io/syam/app:3f2a9c1'],true)}
 if(a=='login'){S.logged=true;A.send(['you','reg'],{label:'token',tone:'gold',ok:true});A.term('term',['$ echo "$CR_PAT" | docker login ghcr.io \\','    -u syam --password-stdin','Login Succeeded'],true)}
 if(a=='push'){if(!S.tagged)return E(['$ docker push ghcr.io/syam/app:1.6','! An image does not exist locally with','! the tag: ghcr.io/syam/app']);if(!S.logged)return E(['$ docker push ghcr.io/syam/app:1.6','! unauthorized: authentication required']);
  S.pushed=true;A.send(['img','reg'],{label:'push',tone:'violet',ok:true});A.term('term',['$ docker push ghcr.io/syam/app:1.6','1.6: digest: sha256:3f2a9c1e… size: 1784'],true)}
 if(a=='deploy'){if(!S.pushed)return E(['$ ssh prod "docker compose pull"','! manifest unknown: ghcr.io/syam/app:1.6']);S.deployed=true;A.send(['reg','srv'],{label:'pull',tone:'violet',ok:true});A.after(900,function(){A.send(['srv','stack'],{label:'up',tone:'green',ok:true});A.set('stack',{status:'run',sub:'app 1.6 running'});A.refresh()});
  A.term('term',['$ ssh prod "cd /srv/app && \\','    docker compose pull && \\','    docker compose up -d"','Container app-db-1   Healthy','Container app-web-1  Started'],true)}
 A.refresh()}
LESSON('docker','compose',{
 title:'Compose & registries',sub:'Describe the whole stack in one file, push images to a registry, and deploy the same image to a server.',time:'15 min',level:'Intermediate',
 S:{built:false,tagged:false,logged:false,pushed:false,deployed:false},
 legend:[['#3b82c4','your laptop'],['#5a4aa8','registry'],['#3fa456','running in prod']],
 hud:[{id:'b',l:'Image built',v:function(S){return S.built?'app:1.6':'no'},lv:function(S){return S.built?'good':'none'}},{id:'p',l:'In registry',v:function(S){return S.pushed?'yes':'no'},lv:function(S){return S.pushed?'good':'none'}},{id:'d',l:'Prod runs',v:function(S){return S.deployed?'1.6':'1.5'},lv:function(S){return S.deployed?'good':'none'}},{id:'l',l:'Logged in',v:function(S){return S.logged?'yes':'no'},lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:64,y:60,tone:'gold',label:'laptop',n:1,w:46,anchor:[110,60]},
  H.tile('img',66,190,'app:1.6','local image','blue',{w:110}),
  H.tile('yml',66,290,'compose.yaml','web + db','gold',{w:120}),
  H.box('reg',240,34,'ghcr.io','violet',{center:true}),
  H.box('srv',300,206,'prod server','slate',{center:true,led:true}),
  H.tile('stack',300,370,'web · db','app 1.5 running','green',{w:132,status:'sleep'}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:202,title:'compose.yaml',rows:YML,fs:8.6},
  {t:'term',id:'term',x:392,y:228,w:316,h:222,title:'terminal'}],
 links:[H.lk('you','img','blue'),H.lk('img','reg','violet',{dash:true}),H.lk('reg','srv','violet',{dash:true}),H.lk('srv','stack','green'),H.lk('yml','srv','gold',{dash:true})],
 controls:{title:'Ship app 1.6 to prod',groups:[{items:STEPS.map(function(g){return {label:g[1],wide:true,on:function(S){return S[{build:'built',tag:'tagged',login:'logged',push:'pushed',deploy:'deployed'}[g[0]]]},click:function(S,A){act(S,A,g[0])}}})}]},
 goal:function(S){var ok=S.deployed;return [ok,ok?'Done. Built once, tagged for the registry, pushed with a token, and prod pulled that exact image. Rolling back is just deploying 1.5 again.':'Goal: get app 1.6 running on the prod server. Each step needs the one before it.']},
 learn:[['Describe a stack in Compose',0],['Run and inspect it',1],['Order startup with health checks',2],['Use .env and overrides',3],['Know the registries',4],['Tag, log in and push',5],['Deploy and roll back',6]],
 steps:[
  {t:'One file for the stack',b:'compose.yaml lists your services, volumes and networks. Compose creates a network for the project, so services reach each other by name: web connects to db.',k:['idea','Key idea','Everything from the last lesson, written down once instead of typed as long docker run commands.'],pill:'setup',tt:'Compose',focus:['yml','srv'],S:{built:false,tagged:false,logged:false,pushed:false,deployed:false},
   set:{stack:{status:'sleep',sub:'app 1.5 running'},code:{title:'compose.yaml',rows:YML,hl:[0,1,5,9]}},termClear:true,term:{term:['$ docker compose config --services','web','db']}},
  {t:'Run it',b:'docker compose up -d starts everything in the right order, ps shows the state, logs follows output, down removes it all again.',k:['problem','Watch out','down -v also deletes the volumes, which means the database data. Use it only on purpose.'],pill:'idea',tt:'up',focus:['yml','srv','stack'],
   set:{code:{title:'commands',rows:CMDS,hl:[1,3,5]}},termClear:true,term:{term:['$ docker compose up -d','Container app-db-1   Started','Container app-web-1  Started','$ docker compose ps','app-db-1   Up 3 seconds (healthy)']}},
  {t:'Start order and health',b:'depends_on alone only waits for the container to start. With condition: service_healthy, web waits until the database healthcheck passes.',k:['tip','Remember','The app should still retry its database connection. Health checks reduce startup races, they do not remove them.'],pill:'idea',tt:'Health',focus:['stack'],
   set:{code:{title:'compose.yaml',rows:YML,hl:[4,8]}},termClear:true,term:{term:['Container app-db-1   Waiting','Container app-db-1   Healthy','Container app-web-1  Starting']}},
  {t:'.env and overrides',b:'Compose reads a .env file for ${VARIABLES} in the YAML, like the image tag. A compose.override.yaml adds dev-only settings without changing the main file.',k:['problem','Watch out','Keep .env out of Git. Commit a .env.example with placeholder values instead.'],pill:'idea',tt:'.env',focus:['yml'],
   set:{code:{title:'.env + overrides',rows:ENVF,hl:[1,5,7]}},termClear:true,term:{term:['$ export APP_TAG=1.6','$ docker compose config | grep image','    image: ghcr.io/syam/app:1.6']}},
  {t:'Registries',b:'A registry stores images so servers can pull them: Docker Hub, GitHub Container Registry, AWS ECR. The image name includes the registry address.',k:['tip','Remember','Use a private registry for company code. Servers pull with a read-only token.'],pill:'idea',tt:'Registry',focus:['reg'],
   set:{code:{title:'registries',rows:REG,hl:[2,6]}},termClear:true,term:{term:['$ docker pull ghcr.io/syam/app:1.5','1.5: Pulling from syam/app','Status: Downloaded newer image']}},
  {t:'Tag, log in, push',b:'Tag the local image with the registry name, log in with a token, then push. Tag both a version and the Git commit, so every image traces back to its code.',k:['problem','Watch out','Use --password-stdin with a token. A password on the command line ends up in shell history.'],pill:'idea',tt:'Push',focus:['you','img','reg'],S:{built:true,tagged:true,logged:true,pushed:true},
   set:{code:{title:'registries',rows:REG,hl:[6]}},termClear:true,term:{term:['$ docker tag app:1.6 ghcr.io/syam/app:1.6','$ docker push ghcr.io/syam/app:1.6','1.6: digest: sha256:3f2a9c1e… size: 1784']},
   once:[{path:['img','reg'],label:'push',tone:'violet'}]},
  {t:'Deploy and roll back',b:'On the server, pull the new tag and run up -d: Compose replaces only what changed. To roll back, set the tag to the old version and run up -d again.',k:['idea','Key idea','Compose is great for one server. For many servers, self-healing and rolling updates, the next step is Kubernetes.'],pill:'idea',tt:'Deploy',focus:['reg','srv','stack'],S:{deployed:true},
   set:{stack:{status:'run',sub:'app 1.6 running'},code:{title:'compose.yaml',rows:YML,hl:[2]}},termClear:true,term:{term:['$ APP_TAG=1.6 docker compose up -d','Container app-web-1  Recreated','$ APP_TAG=1.5 docker compose up -d  # rollback']},
   once:[{path:['reg','srv','stack'],label:'pull',tone:'violet'}]},
  {t:'Try it: ship 1.6',b:'Version 1.6 is ready on your laptop. Get it running on the prod server. Use the buttons in any order and read the errors.',k:['tip','Challenge','Try push before tag and before login, and deploy before push. Each error tells you the missing step.'],pill:'problem',tt:'Try it',S:{built:false,tagged:false,logged:false,pushed:false,deployed:false},goal:true,focus:null,
   set:{stack:{status:'sleep',sub:'app 1.5 running'},code:{title:'compose.yaml',rows:YML,hl:[]}},termClear:true,term:{term:['$ git log --oneline -1','3f2a9c1 release 1.6']}},
  {t:'Recap',b:'Compose describes and runs a whole stack. Images go to a registry with real tags, servers pull exactly that image, and a rollback is just the previous tag.',k:['idea','Next up','AWS: regions, IAM, EC2, S3 and VPC networking.'],pill:'recap',tt:'Recap',S:{built:true,tagged:true,logged:true,pushed:true,deployed:true},
   set:{stack:{status:'run',sub:'app 1.6 running'},code:{title:'compose.yaml',rows:YML,hl:[]}},termClear:true,term:{term:['$ build → tag → push → pull → up -d']}}
 ]});
})();
