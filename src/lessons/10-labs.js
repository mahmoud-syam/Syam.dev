(function(){
function done(S){return ['user','key','pkg','svc','fw','cron'].filter(function(k){return S[k]}).length}
function row(S,k,txt){return {t:(S[k]?'✓ ':'○ ')+txt,tone:S[k]?'green':'amber'}}
var BRIEF=['Lab: build prod-01','1  Create user deploy (sudo)','2  SSH key login','3  Install nginx','4  Start + enable nginx','5  Firewall: allow SSH + 80','6  Nightly backup (cron)','7  Verify from outside'];
var CHK=['Lab checklist',function(S){return row(S,'user','1  user deploy + sudo')},function(S){return row(S,'key','2  SSH key login')},function(S){return row(S,'pkg','3  nginx installed')},function(S){return row(S,'svc','4  nginx running + enabled')},function(S){return row(S,'fw','5  firewall: SSH + 80')},function(S){return row(S,'cron','6  nightly backup')},function(S){return row(S,'ver','7  verified from outside')}];
var RULES=['Safe-order rules','1 Add your key BEFORE you','  disable password login.','2 Allow SSH BEFORE you','  enable the firewall.','3 Keep a 2nd SSH session','  open while you test.','4 Back up a file before','  you edit it (cp f f.bak).'];
function need(A,msg,id){A.term('term',['! '+msg]);A.fx(id||'srv','no')}
function ver(S){return S.svc&&S.fw}
LESSON('linux','labs',{
 title:'Linux lab: build a server',sub:'Put the whole module together: users, SSH, packages, services, firewall and backups.',time:'20 min',level:'Intermediate',
 S:{user:false,key:false,pkg:false,svc:false,fw:false,cron:false,ver:false},
 legend:[['#3fa456','done'],['#e8a33a','to do'],['#e5534b','blocked']],
 hud:[{id:'t',l:'Tasks done',v:function(S){return done(S)+' / 6'},lv:function(S){return done(S)==6?'good':'warn'}},{id:'ssh',l:'SSH',v:function(S){return S.key?'key login':'password'},lv:function(S){return S.key?'good':'warn'}},{id:'web',l:'HTTP',v:function(S){return S.ver?'200 OK':S.svc?'filtered':'down'},lv:function(S){return S.ver?'good':'warn'}},{id:'bk',l:'Backup',v:function(S){return S.cron?'02:00':'none'},lv:function(S){return S.cron?'good':'none'}}],
 nodes:[
  H.box('srv',190,30,'prod-01','green',{center:true,led:true}),
  H.tile('user',70,216,'deploy','sudo user','gold',{w:104,show:false,status:'run'}),
  H.tile('key',190,216,'sshd','key login','blue',{w:104,show:false,status:'run'}),
  H.tile('pkg',310,216,'nginx','installed','green',{w:104,show:false,status:'sleep'}),
  H.tile('fw',70,296,'ufw','22 + 80','amber',{w:104,show:false,status:'run'}),
  H.tile('cron',190,296,'cron','backup 02:00','violet',{w:104,show:false,status:'run'}),
  {t:'crowd',id:'me',x:310,y:370,tone:'gold',label:'outside',n:1,w:48,anchor:[260,370]},
  {t:'panel',id:'ck',x:392,y:14,w:316,h:170,title:'checklist',rows:BRIEF,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('srv','user','gold'),H.lk('srv','key','blue'),H.lk('srv','pkg','green'),H.lk('srv','fw','amber'),H.lk('srv','cron','violet'),H.lk('me','fw','gold',{dash:true})],
 controls:{title:'Build prod-01',groups:[{items:[
  {label:'adduser + sudo',wide:true,on:function(S){return S.user},click:function(S,A){S.user=true;A.set('user',{show:true});A.send(['srv','user'],{label:'user',tone:'gold',ok:true});A.term('term',['$ sudo adduser deploy','$ sudo usermod -aG sudo deploy','$ id deploy','uid=1001 groups=sudo'])}},
  {label:'ssh-copy-id',wide:true,on:function(S){return S.key},click:function(S,A){if(!S.user)return need(A,'create the user first','user');S.key=true;A.set('key',{show:true});A.send(['srv','key'],{label:'key',tone:'blue',ok:true});A.term('term',['$ ssh-copy-id deploy@prod-01','Number of keys added: 1','$ ssh deploy@prod-01','deploy@prod-01:~$'])}},
  {label:'apt install nginx',wide:true,on:function(S){return S.pkg},click:function(S,A){S.pkg=true;A.set('pkg',{show:true,status:'sleep'});A.send(['srv','pkg'],{label:'pkg',tone:'green',ok:true});A.term('term',['$ sudo apt update','$ sudo apt install -y nginx','Setting up nginx ...'])}},
  {label:'enable --now nginx',wide:true,on:function(S){return S.svc},click:function(S,A){if(!S.pkg)return need(A,'install nginx first','pkg');S.svc=true;A.set('pkg',{status:'run',sub:'running'});A.term('term',['$ sudo systemctl enable --now nginx','Created symlink …/nginx.service','$ systemctl is-active nginx','active'])}},
  {label:'ufw allow SSH + 80',wide:true,on:function(S){return S.fw},click:function(S,A){S.fw=true;A.set('fw',{show:true});A.send(['srv','fw'],{label:'fw',tone:'amber',ok:true});A.term('term',['$ sudo ufw allow OpenSSH','$ sudo ufw allow 80/tcp','$ sudo ufw enable','Firewall is active'])}},
  {label:'cron backup',wide:true,on:function(S){return S.cron},click:function(S,A){if(!S.user)return need(A,'create the user first','user');S.cron=true;A.set('cron',{show:true});A.send(['srv','cron'],{label:'02:00',tone:'violet',ok:true});A.term('term',['$ crontab -e   # as deploy','0 2 * * * /opt/backup.sh','$ crontab -l','0 2 * * * /opt/backup.sh'])}},
  {label:'curl from outside',wide:true,on:function(S){return S.ver},click:function(S,A){var ok=ver(S);S.ver=ok;A.send(['me','fw','srv'],{label:'GET',tone:'blue',ok:ok,denyAt:S.fw?'srv':'fw'});A.term('term',ok?['$ curl -I http://prod-01','HTTP/1.1 200 OK']:S.svc?['$ curl -m 5 http://prod-01','! timed out: open the firewall']:['$ curl http://prod-01','! Connection refused: start nginx'])}}]}]},
 goal:function(S){var ok=done(S)==6&&S.ver;return [ok,ok?'Done. prod-01 is built: user, key login, nginx running, firewall open, backups scheduled, verified.':'Goal: finish all six tasks, then verify from outside. Some steps need an earlier one first.']},
 learn:[['Plan a build in the right order',1],['Apply the safe-order rules',2],['Build a server end to end',3],['Verify from outside',4]],
 steps:[
  {t:'The lab: build prod-01',b:'You will build a small web server from scratch using everything in this module: a user, SSH keys, a package, a service, a firewall and a backup.',k:['idea','Key idea','Real work is rarely one command. It is a sequence where each step depends on the one before.'],pill:'setup',tt:'Brief',focus:['srv','ck'],S:{user:false,key:false,pkg:false,svc:false,fw:false,cron:false,ver:false},
   set:{user:{show:false},key:{show:false},pkg:{show:false,status:'sleep',sub:'installed'},fw:{show:false},cron:{show:false},ck:{title:'checklist',rows:BRIEF,hl:[]}},termClear:true,term:{term:['$ hostnamectl --static','prod-01','# empty server, nothing set up']},
   fx:[{n:'srv',k:'pulse'}]},
  {t:'Plan the order',b:'Users come first because SSH keys and cron both belong to a user. The package comes before the service. The firewall comes before you verify.',k:['tip','Remember','Draw the dependencies before you start. It prevents most mistakes.'],pill:'idea',tt:'Plan',focus:['srv','user','key','pkg','fw','cron'],S:{user:true,key:true,pkg:true,svc:true,fw:true,cron:true},
   set:{user:{show:false},key:{show:false},pkg:{show:false},fw:{show:false},cron:{show:false},ck:{title:'order of work',rows:BRIEF,hl:[1,2,3,4,5,6]}},termClear:true,term:{term:['$ # user → key','$ # package → service','$ # firewall → verify']},
   timed:[{at:300,set:{user:{show:true}}},{at:800,set:{key:{show:true}}},{at:1300,set:{pkg:{show:true}}},{at:1800,set:{fw:{show:true}}},{at:2300,set:{cron:{show:true}}}],
   once:[{path:['srv','user'],label:'1',tone:'gold',delay:300},{path:['srv','key'],label:'2',tone:'blue',delay:800},{path:['srv','pkg'],label:'3',tone:'green',delay:1300}]},
  {t:'Safe-order rules',b:'Some orders lock you out. Disable passwords before your key works and you cannot log in. Enable the firewall before allowing SSH and the connection drops.',k:['problem','Watch out','Keep a second SSH session open while you change SSH or the firewall. If it breaks, you can still undo it.'],pill:'problem',tt:'Safety',focus:['key','fw','srv'],S:{user:true,key:true,pkg:true,svc:true,fw:true,cron:true},
   set:{user:{show:true},key:{show:true},pkg:{show:true,status:'run'},fw:{show:true},cron:{show:true},ck:{title:'safe-order rules',rows:RULES,hl:[1,3]}},termClear:true,term:{term:['$ sudo ufw allow OpenSSH','$ sudo ufw enable','# SSH allowed first: safe','$ cp sshd_config sshd_config.bak']},
   once:[{path:['srv','fw'],label:'22',tone:'amber'}]},
  {t:'Do the lab',b:'Build prod-01 with the buttons. Some actions refuse to run until their prerequisite is done, just like on a real server.',k:['tip','Challenge','Try ssh-copy-id before adding the user, and curl before the firewall. See how each fails.'],pill:'problem',tt:'Build',S:{user:false,key:false,pkg:false,svc:false,fw:false,cron:false,ver:false},goal:true,focus:['srv','user','key','pkg','fw','cron'],
   set:{user:{show:false},key:{show:false},pkg:{show:false,status:'sleep',sub:'installed'},fw:{show:false},cron:{show:false},ck:{title:'checklist',rows:CHK,hl:[]}},termClear:true,term:{term:['$ # build prod-01']}},
  {t:'Check your work',b:'A build is not done until it is verified from where the users are. curl from outside tests the user path: DNS, firewall, service and app together.',k:['idea','Key idea','Never verify only from the server itself. localhost skips the firewall and the network.'],pill:'idea',tt:'Verify',focus:['me','fw','srv','pkg'],S:{user:true,key:true,pkg:true,svc:true,fw:true,cron:true,ver:true},
   set:{user:{show:true},key:{show:true},pkg:{show:true,status:'run',sub:'running'},fw:{show:true},cron:{show:true},ck:{title:'checklist',rows:CHK,hl:[]}},termClear:true,term:{term:['$ curl -I http://prod-01','HTTP/1.1 200 OK','$ ssh deploy@prod-01 true && echo ok','ok','$ sudo ufw status | head -3']},
   once:[{path:['me','fw','srv'],label:'GET',tone:'green',ok:true}]},
  {t:'Recap',b:'You used users and permissions, processes and systemd, packages and SSH, storage, networking and logs together. That is the Linux foundation for DevOps.',k:['idea','Next up','Git: track every change to code and configuration, and collaborate safely.'],pill:'recap',tt:'Recap',S:{user:true,key:true,pkg:true,svc:true,fw:true,cron:true,ver:true},
   set:{user:{show:true},key:{show:true},pkg:{show:true,status:'run',sub:'running'},fw:{show:true},cron:{show:true},ck:{title:'checklist',rows:CHK,hl:[]}},termClear:true,term:{term:['$ # Linux module complete']}}
 ]});
})();
