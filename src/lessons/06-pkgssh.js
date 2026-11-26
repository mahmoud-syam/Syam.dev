(function(){
var SRC=['deb deb.debian.org/debian bookworm main','deb security.debian.org bookworm-security main','','# the index = list of known packages','# apt update refreshes it'];
var SSHD=['# /etc/ssh/sshd_config','Port 22',function(S){return {t:'PasswordAuthentication '+(S.nopw?'no':'yes'),tone:S.nopw?'green':'amber'}},function(S){return {t:'PermitRootLogin '+(S.nopw?'no':'yes'),tone:S.nopw?'green':'amber'}},'PubkeyAuthentication yes'];
var CRON=['# m  h  dom mon dow  command','0  2  *   *   *    /opt/backup.sh','','# minute hour day month weekday','# 0 2 * * *  = every day at 02:00'];
var KEYS=['~/.ssh/id_ed25519      (private, secret)','~/.ssh/id_ed25519.pub  (public, shareable)','','server: ~/.ssh/authorized_keys','  ← your public key goes here'];
function pw(S){return S.nopw?'key only':S.key?'key + password':'password'}
function upd(S,A){S.upd=true;A.send(['server','repo'],{label:'apt',tone:'blue',ok:true});A.term('term',['$ sudo apt update','Get:1 deb.debian.org bookworm InRelease','Reading package lists... Done'])}
function inst(S,A){if(!S.upd){A.send(['server','repo'],{label:'?',tone:'red',ok:false,denyAt:'repo'});A.term('term',['$ sudo apt install nginx','! E: Unable to locate package nginx','$ sudo apt update   # refresh the index first']);return}
 S.inst=true;A.send(['repo','server'],{label:'pkg',tone:'green',ok:true});A.term('term',['$ sudo apt install -y nginx','Unpacking nginx ...','Setting up nginx ...']);A.after(1300,function(){A.set('pkg',{show:true,status:'run'});A.refresh()})}
LESSON('linux','pkgssh',{
 title:'Packages, SSH & cron',sub:'Install software, log in remotely with keys, and run jobs on a schedule.',time:'14 min',level:'Beginner',
 S:{upd:false,inst:false,key:false,nopw:false,cron:false},
 legend:[['#3fa456','installed / safe'],['#e8a33a','weak / stale'],['#e5534b','denied']],
 hud:[{id:'idx',l:'Package index',v:function(S){return S.upd?'fresh':'stale'},lv:function(S){return S.upd?'good':'warn'}},{id:'ng',l:'nginx',v:function(S){return S.inst?'installed':'missing'},lv:function(S){return S.inst?'good':'none'}},{id:'ssh',l:'SSH login',v:pw,lv:function(S){return S.nopw?'good':'warn'}},{id:'cr',l:'Cron job',v:function(S){return S.cron?'02:00 daily':'none'},lv:function(S){return S.cron?'good':'none'}}],
 nodes:[
  {t:'crowd',id:'you',x:70,y:120,tone:'gold',label:'you',n:1,w:56,anchor:[130,120]},
  H.box('repo',290,40,'apt repo','blue',{center:true}),
  H.box('server',290,190,'server','green',{center:true,lock:true}),
  H.tile('pkg',290,334,'nginx','installed','green',{w:120,show:false,status:'run'}),
  H.tile('job',104,334,'backup.sh','cron 02:00','amber',{w:124,show:false,status:'sleep'}),
  {t:'panel',id:'unit',x:392,y:14,w:316,h:170,title:'/etc/apt/sources.list',rows:SRC,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('server','repo','blue'),H.lk('you','server','gold'),H.lk('server','pkg','green'),H.lk('server','job','amber')],
 controls:{title:'Manage the server',groups:[{items:[
  {label:'apt update',wide:true,on:function(S){return S.upd},click:function(S,A){upd(S,A)}},
  {label:'apt install nginx',wide:true,on:function(S){return S.inst},click:function(S,A){inst(S,A)}},
  {label:'ssh-copy-id',wide:true,on:function(S){return S.key},click:function(S,A){S.key=true;A.send(['you','server'],{label:'key',tone:'green',ok:true});A.term('term',['$ ssh-copy-id syam@10.0.0.5','Number of keys added: 1']);A.set('unit',{title:'keys',rows:KEYS})}},
  {label:'PasswordAuth no',wide:true,on:function(S){return S.nopw},click:function(S,A){if(!S.key){A.term('term',['$ # no key yet!','! You would lock yourself out.','$ ssh-copy-id first']);A.fx('server','no');return}
   S.nopw=true;A.set('unit',{title:'/etc/ssh/sshd_config',rows:SSHD});A.term('term',['$ sudo systemctl reload ssh','$ ssh -o PubkeyAuthentication=no syam@10.0.0.5','! Permission denied (publickey).']);A.send(['you','server'],{label:'pw',tone:'red',ok:false,denyAt:'server'})}},
  {label:'add cron job',wide:true,on:function(S){return S.cron},click:function(S,A){S.cron=true;A.set('unit',{title:'crontab -l',rows:CRON});A.term('term',['$ crontab -l','0 2 * * * /opt/backup.sh']);A.set('job',{show:true,status:'sleep'})}}]}]},
 goal:function(S){var ok=S.inst&&S.key&&S.nopw&&S.cron;return [ok,ok?'Done. nginx installed, SSH is key-only, and the backup runs every night.':'Goal: install nginx (update first!), switch SSH to keys only, and schedule the backup. Order matters: the key before disabling passwords.']},
 learn:[['Install software with apt',1],['Update and remove packages',2],['Log in with SSH',3],['Use keys, not passwords',4],['Schedule a cron job',6]],
 steps:[
  {t:'Packages and repositories',b:'Linux installs software from repositories: servers that hold signed packages. The package manager keeps an index (a list of what is available) on your machine.',k:['idea','Key idea','Debian and Ubuntu use apt. RHEL, Rocky and Alma use dnf. The idea is identical.'],pill:'setup',tt:'Packages',focus:['server','repo'],S:{upd:false,inst:false,key:false,nopw:false,cron:false},
   set:{pkg:{show:false},job:{show:false},unit:{title:'/etc/apt/sources.list',rows:SRC,hl:[]}},termClear:true,term:{term:['$ cat /etc/apt/sources.list | head -2','deb deb.debian.org/debian bookworm main','deb security.debian.org bookworm-security main']},
   flows:[{path:['server','repo'],label:'apt',tone:'blue',gap:1}]},
  {t:'Install a package',b:'First refresh the index with apt update, then install. Without a fresh index apt may say it cannot find the package.',k:['tip','Remember','update refreshes the list. upgrade installs newer versions. They are two different commands.'],pill:'idea',tt:'Install',focus:['server','repo','pkg'],S:{upd:true,inst:true},
   set:{unit:{title:'/etc/apt/sources.list',rows:SRC,hl:[4]}},termClear:true,term:{term:['$ sudo apt update','Reading package lists... Done','$ sudo apt install -y nginx','Setting up nginx ...','$ dpkg -l nginx | tail -1','ii  nginx  1.22.1  amd64']},
   once:[{path:['server','repo'],label:'apt',tone:'blue'},{path:['repo','server'],label:'pkg',tone:'green',delay:1400}],timed:[{at:2800,set:{pkg:{show:true,status:'run'}}}]},
  {t:'Upgrade and remove',b:'apt upgrade brings installed packages to their newest versions. apt remove deletes a package but keeps its config files. apt purge deletes the config too.',k:['problem','Watch out','Always read the list apt shows before you type y. A remove can pull other packages with it.'],pill:'problem',tt:'Maintain',focus:['server','repo','pkg'],S:{upd:true,inst:true},
   set:{pkg:{show:true,status:'run'}},termClear:true,term:{term:['$ sudo apt upgrade','0 upgraded, 0 newly installed','$ sudo apt remove nginx','# keeps /etc/nginx','$ sudo apt purge nginx','# removes config too']},
   flows:[{path:['repo','server'],label:'pkg',tone:'green',gap:1}]},
  {t:'SSH: log in remotely',b:'SSH gives you a shell on another machine over an encrypted connection. The server listens on port 22.',k:['idea','Key idea','Everything you type travels encrypted. Nobody on the network can read it or change it.'],pill:'idea',tt:'SSH',focus:['you','server'],S:{upd:true,inst:true},
   set:{unit:{title:'/etc/ssh/sshd_config',rows:SSHD,hl:[1]}},termClear:true,term:{term:['$ ssh syam@10.0.0.5',"syam@10.0.0.5's password: ••••••",'syam@server:~$ hostname','server']},
   once:[{path:['you','server'],label:'ssh',tone:'gold'}]},
  {t:'Keys beat passwords',b:'An SSH key is a pair: a private key stays with you, a public key goes onto the server. Logging in proves you hold the private key, and nothing secret crosses the wire.',k:['tip','Remember','ssh-keygen -t ed25519 creates the pair. ssh-copy-id installs the public half on the server.'],pill:'idea',tt:'Keys',focus:['you','server'],S:{upd:true,inst:true,key:true},
   set:{unit:{title:'keys',rows:KEYS,hl:[]}},termClear:true,term:{term:['$ ssh-keygen -t ed25519','Your public key has been saved in','  ~/.ssh/id_ed25519.pub','$ ssh-copy-id syam@10.0.0.5','Number of keys added: 1']},
   once:[{path:['you','server'],label:'key',tone:'green'}]},
  {t:'Lock the door: no passwords',b:'Once your key works, turn off password login so bots guessing passwords get nowhere. Set PasswordAuthentication no, and PermitRootLogin no.',k:['problem','Watch out','Keep one SSH session open while you test. If you break the config you can still fix it. On RHEL the service is called sshd.'],pill:'problem',tt:'Harden',focus:['you','server'],S:{upd:true,inst:true,key:true,nopw:true},
   set:{unit:{title:'/etc/ssh/sshd_config',rows:SSHD,hl:[2,3]}},termClear:true,term:{term:['$ sudo sshd -t   # test the config','$ sudo systemctl reload ssh','$ ssh bot@10.0.0.5','! Permission denied (publickey).']},
   once:[{path:['you','server'],label:'pw',tone:'red',ok:false,denyAt:'server'}]},
  {t:'cron: run jobs on a schedule',b:'cron runs commands at set times. A line has five time fields and then the command. 0 2 * * * means 02:00 every day.',k:['idea','Key idea','The fields are: minute, hour, day of month, month, day of week. A star means every.'],pill:'idea',tt:'cron',focus:['server','job'],S:{upd:true,inst:true,key:true,nopw:true,cron:true},
   set:{unit:{title:'crontab -l',rows:CRON,hl:[1]},job:{show:true,status:'sleep'}},termClear:true,term:{term:['$ crontab -e','$ crontab -l','0 2 * * * /opt/backup.sh','$ journalctl -u cron -n 1','CRON: (syam) CMD (/opt/backup.sh)']},
   once:[{path:['server','job'],label:'02:00',tone:'amber'}],timed:[{at:1300,set:{job:{status:'run'}}},{at:3000,set:{job:{status:'sleep'}}}]},
  {t:'Try it: set up the server',b:'Do the whole job: install nginx, switch SSH to keys only, and schedule the backup. Use the buttons.',k:['tip','Challenge','Try apt install first. It fails. Then try turning passwords off before adding a key.'],pill:'problem',tt:'Try it',S:{upd:false,inst:false,key:false,nopw:false,cron:false},goal:true,focus:['you','repo','server'],
   set:{pkg:{show:false},job:{show:false},unit:{title:'/etc/apt/sources.list',rows:SRC,hl:[]}},termClear:true,term:{term:['$ # fresh server, nothing done yet']}},
  {t:'Recap',b:'apt installs from repositories, SSH keys protect remote logins, and cron runs jobs on schedule. Together they are the daily toolkit of a Linux admin.',k:['idea','Next up','Disks, mounts and LVM: where the data actually lives.'],pill:'recap',tt:'Recap',S:{upd:true,inst:true,key:true,nopw:true,cron:true},
   set:{pkg:{show:true,status:'run'},job:{show:true,status:'sleep'},unit:{title:'crontab -l',rows:CRON,hl:[]}},termClear:true,term:{term:['$ apt install · ssh-copy-id · crontab -e']}}
 ]});
})();
