(function(){
var G=[['order','deps before code'],['slim','slim base image'],['multi','multi-stage build'],['ign','.dockerignore'],['user','non-root USER']];
function size(S){return (S.slim?125:1010)+45+(S.multi?0:180)+(S.ign?0:240)}
function rebuild(S){return S.order||S.multi?6:95}
function n(S){return G.filter(function(g){return S[g[0]]}).length}
function df(S){var L=[];if(S.multi){L.push({t:'FROM python:3.12'+(S.slim?'-slim':'')+' AS build',tone:'green'},'RUN apt-get update && apt-get install -y gcc','COPY requirements.txt .','RUN pip wheel -r requirements.txt -w /w',{t:'FROM python:3.12'+(S.slim?'-slim':''),tone:'green'},'COPY --from=build /w /w','RUN pip install /w/*')}
 else{L.push({t:'FROM python:3.12'+(S.slim?'-slim':''),tone:S.slim?'green':'amber'},'RUN apt-get update && apt-get install -y gcc');if(S.order)L.push({t:'COPY requirements.txt .',tone:'green'},{t:'RUN pip install -r requirements.txt',tone:'green'})}
 L.push('COPY . /app');if(!S.order&&!S.multi)L.push({t:'RUN pip install -r /app/requirements.txt',tone:'amber'});if(S.user)L.push({t:'USER app',tone:'green'});L.push('CMD ["python", "/app/main.py"]');return L}
var DV=[0,1,2,3,4,5,6,7,8,9].map(function(i){return function(S){return df(S)[i]||''}});
var LAY=['An image is a stack of layers',{t:'CMD           metadata',tone:'gold'},{t:'COPY . /app   3 MB   your code',tone:'gold'},{t:'RUN pip ...   40 MB  dependencies',tone:'gold'},{t:'FROM slim     125 MB base OS + python',tone:'gold'},'','Layers are read-only and shared.','A container adds one thin writable layer.'];
var CACHE=['Build cache',{t:'Each step is cached until its input changes.',tone:'gold'},{t:'A change invalidates that step AND every',tone:'red'},{t:'step after it.',tone:'red'},'',{t:'Put rarely changing steps first:',tone:'green'},{t:'base → system packages → deps → code',tone:'green'}];
var IGN=['.dockerignore',{t:'.git/',tone:'gold'},{t:'node_modules/',tone:'gold'},{t:'__pycache__/',tone:'gold'},{t:'.env          # never ship secrets',tone:'red'},{t:'data/  *.log',tone:'gold'},'','Smaller context = faster, safer builds.'];
var SECU=['Image security',{t:'✓ run as a non-root USER',tone:'green'},{t:'✓ no secrets in layers: they stay forever',tone:'green'},{t:'✓ scan: docker scout cves · trivy image',tone:'green'},{t:'✓ HEALTHCHECK CMD curl -f localhost/health',tone:'green'},{t:'✓ pin versions: python:3.12.7-slim',tone:'green'},'',{t:'"latest" is not a version.',tone:'red'}];
function build(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.built=false;
 A.send(['df','bk'],{label:'build',tone:'blue',ok:true});L(900,function(){A.send(['bk','img'],{label:size(S)+'MB',tone:size(S)<=200?'green':'amber',ok:true})});
 L(1700,function(){S.built=true;A.set('img',{sub:size(S)+' MB',status:size(S)<=200?'run':'#e8a33a'});A.term('term',['$ docker build -t app:1.5 .','$ docker images app:1.5','app  1.5  '+size(S)+'MB','$ # change one line of code, rebuild:','built in '+rebuild(S)+' s'+(S.order||S.multi?' (deps from cache)':' (deps reinstalled)'),'$ docker run --rm app:1.5 whoami',S.user?'app':'! root'],true);A.refresh()})}
LESSON('docker','images',{
 title:'Images & the Dockerfile',sub:'Build your own image: layers, the build cache, small images, multi-stage builds and running as non-root.',time:'16 min',level:'Intermediate',
 S:{order:false,slim:false,multi:false,ign:false,user:false,built:false},
 legend:[['#3fa456','meets target'],['#e8a33a','too big / slow'],['#e5534b','runs as root']],
 hud:[{id:'s',l:'Image size',v:function(S){return size(S)+' MB'},lv:function(S){return size(S)<=200?'good':'warn'}},{id:'r',l:'Rebuild after code edit',v:function(S){return rebuild(S)+' s'},lv:function(S){return rebuild(S)<=10?'good':'warn'}},{id:'u',l:'Runs as',v:function(S){return S.user?'app':'root'},lv:function(S){return S.user?'good':'bad'}},{id:'n',l:'Fixes',v:function(S){return n(S)+' / 5'},lv:'none'}],
 nodes:[
  H.tile('df',70,46,'Dockerfile','+ code','gold',{w:118}),
  H.box('bk',204,34,'docker build','blue',{center:true}),
  H.tile('img',330,150,'app:1.5','— MB','teal',{w:110,status:'none'}),
  H.tile('ctx',70,190,'build context','sent to builder','slate',{w:130}),
  H.tile('reg',330,300,'registry','push app:1.5','violet',{w:112}),
  H.tile('ctr',150,330,'container','app:1.5 running','green',{w:132}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:186,title:'Dockerfile',rows:DV,fs:9},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('df','bk','gold'),H.lk('ctx','bk','slate',{dash:true}),H.lk('bk','img','blue'),H.lk('img','reg','violet',{dash:true}),H.lk('img','ctr','green',{dash:true})],
 controls:{title:'Improve the Dockerfile',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.built=false;S.rid=(S.rid||0)+1;A.set('code',{title:'Dockerfile',rows:DV,hl:[]});A.fx('df','pulse');A.refresh()}}}).concat([{label:'docker build',wide:true,click:function(S,A){build(S,A)}}])}]},
 goal:function(S){var ok=S.built&&size(S)<=200&&rebuild(S)<=10&&S.user;return [ok,ok?'Done. '+size(S)+' MB instead of 1475, rebuilds in seconds, and the app does not run as root.':'Goal: an image under 200 MB that rebuilds in under 10 s after a code change and does not run as root. Build it bare first.']},
 learn:[['Know images are layers',0],['Write a Dockerfile',1],['Use the build cache',2],['Keep images small',3],['Use multi-stage builds',4],['Secure your images',5],['Tag images properly',6]],
 steps:[
  {t:'Images are layers',b:'Each Dockerfile instruction creates a layer. Layers are read-only and shared between images, so two images on the same base store that base only once.',k:['idea','Key idea','A running container adds one thin writable layer on top. Delete the container and that layer is gone.'],pill:'setup',tt:'Layers',focus:['df','bk','img'],S:{order:false,slim:false,multi:false,ign:false,user:false,built:false},
   set:{img:{sub:'— MB',status:'none'},code:{title:'layers',rows:LAY,hl:[1,2,3,4]}},termClear:true,term:{term:['$ docker history app:1.4 --format \\','    "{{.Size}}\\t{{.CreatedBy}}"','3MB    COPY . /app','40MB   RUN pip install -r ...','125MB  FROM python:3.12-slim']}},
  {t:'The Dockerfile',b:'FROM picks the base image, WORKDIR sets the folder, COPY adds files, RUN runs commands at build time, CMD is what runs when the container starts.',k:['tip','Remember','RUN happens once, while building. CMD happens every time a container starts.'],pill:'idea',tt:'Dockerfile',focus:['df','bk'],
   set:{code:{title:'Dockerfile',rows:DV,hl:[0,3,5]}},termClear:true,term:{term:['$ docker build -t app:1.5 .','[+] Building 96.3s (8/8) FINISHED','$ docker images app','app  1.5  1475MB']},
   once:[{path:['df','bk','img'],label:'build',tone:'blue'}]},
  {t:'The build cache',b:'Docker reuses a layer if its instruction and inputs did not change. But a change breaks the cache for every step after it. So copy the requirements and install them before copying your code.',k:['problem','Watch out','COPY . before pip install means every code edit reinstalls every dependency. That is the slow build everyone has.'],pill:'problem',tt:'Cache',focus:['df','bk'],S:{order:true},
   set:{code:{title:'build cache',rows:CACHE,hl:[2,3,5,6]}},termClear:true,term:{term:['$ docker build -t app:1.5 .',' => CACHED [3/6] COPY requirements.txt',' => CACHED [4/6] RUN pip install ...',' => [5/6] COPY . /app','[+] Building 6.1s FINISHED']}},
  {t:'Small images',b:'Big images are slow to push and pull and carry more vulnerabilities. Use a slim base, and a .dockerignore so .git, node_modules and local data never reach the build.',k:['problem','Watch out','Alpine is tiny but uses a different C library. Some Python packages then compile slowly or behave differently. slim is the safe default.'],pill:'idea',tt:'Small',focus:['ctx','bk','img'],S:{slim:true,ign:true},
   set:{code:{title:'.dockerignore',rows:IGN,hl:[1,2,4]}},termClear:true,term:{term:['$ du -sh .git node_modules data','210M .git','28M  node_modules','2M   data']}},
  {t:'Multi-stage builds',b:'Build in one stage with compilers and tools, then copy only the result into a clean final stage. The build tools never reach production.',k:['idea','Key idea','FROM ... AS build, then COPY --from=build. The final image only contains what the app needs to run.'],pill:'idea',tt:'Multi-stage',focus:['df','bk','img'],S:{multi:true},
   set:{img:{sub:'170 MB',status:'run'},code:{title:'Dockerfile',rows:DV,hl:[0,4,5]}},termClear:true,term:{term:['$ docker build -t app:1.5 .','$ docker images app:1.5','app  1.5  170MB']},
   once:[{path:['bk','img'],label:'170',tone:'green'}]},
  {t:'Security',b:'Run the app as a normal user, keep secrets out of the image, scan for known vulnerabilities and add a HEALTHCHECK so Docker knows when the app is really up.',k:['problem','Watch out','A secret copied in one layer and deleted in the next is still in the image history. Never COPY .env.'],pill:'problem',tt:'Security',focus:['img','ctr'],S:{user:true},
   set:{code:{title:'security',rows:SECU,hl:[1,2,3]}},termClear:true,term:{term:['$ docker scout cves app:1.5 | tail -2','  0C  0H  2M  5L','$ docker run --rm app:1.5 whoami','app']}},
  {t:'Tags',b:'A tag names a version: app:1.5. Tag every build with a real version or the Git commit, and deploy that exact tag. latest is just a default name, not "the newest".',k:['tip','Remember','For full certainty, deploy by digest: app@sha256:3f2a... can never change.'],pill:'idea',tt:'Tags',focus:['img','reg'],
   set:{code:{title:'security',rows:SECU,hl:[5,7]}},termClear:true,term:{term:['$ docker tag app:1.5 ghcr.io/syam/app:1.5','$ docker tag app:1.5 ghcr.io/syam/app:3f2a9c1','$ docker push ghcr.io/syam/app:1.5']},
   once:[{path:['img','reg'],label:'push',tone:'violet'}]},
  {t:'Try it: a better image',b:'The current image is 1.5 GB, rebuilds in 95 seconds after any code change and runs as root. Apply fixes, build, and watch the numbers.',k:['tip','Challenge','Build once with no fixes. Then add one fix at a time and see which number each one moves.'],pill:'problem',tt:'Try it',S:{order:false,slim:false,multi:false,ign:false,user:false,built:false},goal:true,focus:null,
   set:{img:{sub:'— MB',status:'none'},code:{title:'Dockerfile',rows:DV,hl:[]}},termClear:true,term:{term:['$ cat Dockerfile | head -2','FROM python:3.12','RUN apt-get update && apt-get install -y gcc']}},
  {t:'Recap',b:'Order steps for the cache, start from a slim base, ignore what you do not ship, build in stages, run as non-root, and tag every image with a real version.',k:['idea','Next up','Volumes and networks: keep data and connect containers.'],pill:'recap',tt:'Recap',S:{order:true,slim:true,multi:true,ign:true,user:true,built:true},
   set:{img:{sub:'170 MB',status:'run'},code:{title:'Dockerfile',rows:DV,hl:[]}},termClear:true,term:{term:['$ docker images app:1.5','app  1.5  170MB']}}
 ]});
})();
