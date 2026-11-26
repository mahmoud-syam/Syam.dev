(function(){
var G=[['vol','db: named volume'],['net','user network appnet'],['pApp','publish app 8080'],['pDb','publish db 5432']];
function T(S){return [['db data survives recreate',!!S.vol,true],['app → db by name "db"',!!S.net,true],['browser → localhost:8080',!!S.pApp,true],['internet → db :5432',!!S.pDb,false]]}
function good(S){return T(S).every(function(t){return t[1]==t[2]})}
function cmds(S){return [{t:'docker network create appnet',tone:S.net?'green':'slate'},{t:'docker volume create pgdata',tone:S.vol?'green':'slate'},'docker run -d --name db \\',S.net?'  --network appnet \\':null,S.vol?{t:'  -v pgdata:/var/lib/postgresql/data \\',tone:'green'}:null,S.pDb?{t:'  -p 5432:5432 \\',tone:'red'}:null,'  -e POSTGRES_PASSWORD_FILE=/run/secrets/pw postgres:16','docker run -d --name app'+(S.net?' --network appnet':'')+(S.pApp?' -p 8080:8000':''),'  -e DB_HOST=db app:1.5'].filter(function(x){return x!==null})}
var CV=[0,1,2,3,4,5,6,7,8].map(function(i){return function(S){var c=cmds(S)[i];return c===undefined?'':c}});
var MNT=['Three ways to keep data',{t:'named volume  -v pgdata:/var/lib/...',tone:'green'},'              Docker manages it, survives rm',{t:'bind mount    -v /srv/conf:/etc/app:ro',tone:'gold'},'              a host folder, good for config',{t:'tmpfs         --tmpfs /tmp',tone:'gold'},'              memory only, gone on stop','',{t:'The container\'s own layer dies with it.',tone:'red'}];
var NETS=['Docker networks',{t:'bridge (default)  no DNS by name',tone:'amber'},{t:'user bridge       DNS: reach "db" by name',tone:'green'},{t:'host              share the host network',tone:'gold'},{t:'none              no network at all',tone:'gold'},'','Containers on the same user network can',{t:'talk freely. Publish only what users need.',tone:'green'}];
var ENV=[{t:'-e KEY=value        one variable',tone:'gold'},{t:'--env-file .env     many from a file',tone:'gold'},'',{t:'docker inspect shows env in plain text.',tone:'red'},{t:'For secrets prefer files: _FILE variables,',tone:'green'},{t:'Docker/Compose secrets, or a vault.',tone:'green'}];
function test(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;var t=T(S);
 L(100,function(){A.set('db',{status:'none'});A.fx('db','pulse')});L(700,function(){A.set('db',{status:'run'});A.send(['db','vol'],{label:'data',tone:t[0][1]?'green':'red',ok:t[0][1]})});
 L(1400,function(){A.send(['app','db'],{label:'db?',tone:t[1][1]?'green':'red',ok:t[1][1]})});L(2100,function(){A.send(['you','app'],{label:'8080',tone:t[2][1]?'green':'red',ok:t[2][1]})});
 L(2800,function(){A.send(['bad','db'],{label:'5432',tone:t[3][1]?'red':'green',ok:t[3][1],denyAt:'db'})});
 L(3500,function(){S.ran=true;A.term('term',['$ docker rm -f db && <run db again>','$ # then test the setup'].concat(t.map(function(x){var ok=x[1]==x[2];return (ok?'✓ ':'! ')+x[0]+': '+(x[1]?'yes':'no')})).concat(!S.net?['! app: could not translate host "db"']:[]),true);A.refresh()})}
LESSON('docker','storage',{
 title:'Volumes & networks',sub:'Containers are disposable: keep data in volumes, connect containers on networks, and publish only the ports users need.',time:'15 min',level:'Intermediate',
 S:{vol:false,net:false,pApp:false,pDb:false,ran:false},
 legend:[['#3fa456','works as intended'],['#e5534b','broken or exposed'],['#3b82c4','network']],
 hud:[{id:'v',l:'DB data',v:function(S){return S.vol?'in volume':'in container'},lv:function(S){return S.vol?'good':'warn'}},{id:'n',l:'Network',v:function(S){return S.net?'appnet':'default'},lv:function(S){return S.net?'good':'warn'}},{id:'p',l:'Published',v:function(S){return [S.pApp?'8080':'',S.pDb?'5432':''].filter(Boolean).join(', ')||'none'},lv:function(S){return S.pDb?'bad':'none'}},{id:'r',l:'Tests',v:function(S){return !S.ran?'—':T(S).filter(function(x){return x[1]==x[2]}).length+' / 4'},lv:function(S){return !S.ran?'none':good(S)?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'you',x:64,y:64,tone:'gold',label:'browser',n:1,w:46,anchor:[110,64]},
  H.tile('app',214,60,'app','python :8000','green',{w:112,status:'run'}),
  H.tile('db',214,200,'db','postgres :5432','violet',{w:124,status:'run'}),
  H.tile('vol',214,320,'pgdata','named volume','blue',{w:118}),
  H.tile('net',66,200,'appnet','user network','blue',{w:110}),
  {t:'crowd',id:'bad',x:338,y:396,tone:'red',label:'internet',n:1,w:42,anchor:[310,376]},
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'commands',rows:CV,fs:8.6},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','app','gold',{on:function(S){return S.pApp}}),H.lk('app','db','violet',{on:function(S){return S.net}}),H.lk('db','vol','blue',{on:function(S){return S.vol}}),H.lk('net','app','blue',{dash:true,on:function(S){return S.net}}),H.lk('net','db','blue',{dash:true,on:function(S){return S.net}}),H.lk('bad','db','red',{dash:true,on:function(S){return S.pDb}})],
 controls:{title:'Run app + database',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;A.set('code',{title:'commands',rows:CV});A.refresh()}}}).concat([{label:'recreate db + test',wide:true,click:function(S,A){test(S,A)}}])}]},
 goal:function(S){if(S.ran&&good(S))return [true,'Done. The data outlived the container, app found db by name on appnet, users reach port 8080, and the database is not published.'];return [false,'Goal: the database keeps its data when recreated, the app reaches it by the name db, users reach the app on 8080, and nobody outside reaches the database.']},
 learn:[['Know containers are disposable',0],['Use named volumes',1],['Use bind mounts and tmpfs',2],['Connect with user networks',3],['Publish ports deliberately',4],['Pass configuration safely',5],['Inspect and clean up',6]],
 steps:[
  {t:'Containers are disposable',b:'A container\'s files live in its writable layer. Remove the container and they are gone. That is a feature: you replace containers, you do not repair them.',k:['problem','Watch out','A database in a container without a volume loses everything on docker rm. That is the classic first Docker incident.'],pill:'setup',tt:'Disposable',focus:['db'],S:{vol:false,net:false,pApp:false,pDb:false,ran:false},
   set:{code:{title:'commands',rows:CV,hl:[]}},termClear:true,term:{term:['$ docker rm -f db','$ docker run -d --name db postgres:16','$ psql -c "select count(*) from orders"','! relation "orders" does not exist']},
   once:[{path:['db','vol'],label:'data',tone:'red',ok:false}]},
  {t:'Named volumes',b:'A named volume is storage Docker manages outside any container. Mount it where the app writes data, and it survives docker rm, upgrades and recreation.',k:['tip','Remember','docker volume ls lists volumes. Removing a container never removes its named volume.'],pill:'idea',tt:'Volumes',focus:['db','vol'],S:{vol:true},
   set:{code:{title:'storage options',rows:MNT,hl:[1,2]}},termClear:true,term:{term:['$ docker volume create pgdata','$ docker run -d --name db \\','    -v pgdata:/var/lib/postgresql/data \\','    postgres:16','$ docker volume ls','local  pgdata']},
   once:[{path:['db','vol'],label:'data',tone:'green'}]},
  {t:'Bind mounts and tmpfs',b:'A bind mount maps a host folder into the container, handy for config files or live code in development. tmpfs keeps files in memory only.',k:['tip','Remember','Add :ro to mount config read-only, so the container cannot change it.'],pill:'idea',tt:'Mounts',focus:['app'],
   set:{code:{title:'storage options',rows:MNT,hl:[3,5,8]}},termClear:true,term:{term:['$ docker run -d \\','  -v /srv/app/config.yml:/app/config.yml:ro \\','    app:1.5']}},
  {t:'User-defined networks',b:'On the default bridge, containers cannot find each other by name. Create your own network and Docker adds DNS: the app reaches the database simply as db.',k:['idea','Key idea','Never hard-code container IPs. They change every time a container is recreated. Names stay.'],pill:'idea',tt:'Networks',focus:['net','app','db'],S:{net:true},
   set:{code:{title:'networks',rows:NETS,hl:[1,2]}},termClear:true,term:{term:['$ docker network create appnet','$ docker exec app getent hosts db','172.19.0.2   db']},
   once:[{path:['app','db'],label:'db?',tone:'green'}]},
  {t:'Publishing ports',b:'-p 8080:8000 maps host port 8080 to the container\'s port 8000. Publish only what users must reach. The database talks to the app over the private network.',k:['problem','Watch out','Published ports can bypass ufw on Linux, because Docker writes its own iptables rules. Do not publish databases.'],pill:'problem',tt:'Ports',focus:['you','app','db','bad'],S:{pApp:true},
   set:{code:{title:'commands',rows:CV,hl:[7]}},termClear:true,term:{term:['$ docker port app','8000/tcp -> 0.0.0.0:8080','$ curl -sI localhost:8080 | head -1','HTTP/1.1 200 OK']},
   once:[{path:['you','app'],label:'8080',tone:'green'},{path:['bad','db'],label:'5432',tone:'green',ok:false,denyAt:'db',delay:1000}]},
  {t:'Configuration and secrets',b:'Pass settings with -e or --env-file. For passwords, prefer files: many official images read POSTGRES_PASSWORD_FILE, and Compose has secrets.',k:['problem','Watch out','docker inspect prints environment variables in plain text to anyone with Docker access.'],pill:'problem',tt:'Config',focus:['app','db'],
   set:{code:{title:'configuration',rows:ENV,hl:[3,4]}},termClear:true,term:{term:['$ docker inspect db --format \\','    "{{.Config.Env}}"','[POSTGRES_PASSWORD_FILE=/run/secrets/pw ...]']}},
  {t:'Inspect and clean up',b:'docker inspect shows mounts, networks and settings. docker system df shows what uses disk, and prune removes stopped containers, unused images and networks.',k:['problem','Watch out','docker volume prune deletes unused volumes, which can include data you still need. Read the list first.'],pill:'idea',tt:'Clean',focus:['vol','db'],
   set:{code:{title:'commands',rows:CV,hl:[]}},termClear:true,term:{term:['$ docker system df','Images   12   3.1GB  (2.2GB reclaimable)','$ docker image prune -a','Total reclaimed space: 2.2GB']}},
  {t:'Try it: app and database',b:'Set up the database and app with the right volume, network and ports. The test recreates the database container, then checks four things.',k:['tip','Challenge','Publish 5432 and see which test fails. Then run without the network and read the app error.'],pill:'problem',tt:'Try it',S:{vol:false,net:false,pApp:false,pDb:false,ran:false},goal:true,focus:null,
   set:{code:{title:'commands',rows:CV,hl:[]}},termClear:true,term:{term:['$ docker ps --format "{{.Names}}"','app','db']}},
  {t:'Recap',b:'Keep data in named volumes, connect containers on user networks by name, publish only user-facing ports, and pass secrets as files, not plain variables.',k:['idea','Next up','Compose and registries: describe the whole stack in one file and ship images.'],pill:'recap',tt:'Recap',S:{vol:true,net:true,pApp:true,pDb:false,ran:true},
   set:{code:{title:'commands',rows:CV,hl:[]}},termClear:true,term:{term:['✓ volume ✓ network ✓ 8080 ✓ db private']}}
 ]});
})();
