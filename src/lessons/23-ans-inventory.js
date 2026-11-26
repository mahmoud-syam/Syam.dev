(function(){
var HS=[['web1',['web','prod']],['web2',['web','prod']],['web3',['web','staging']],['db1',['db','prod']]];
var PAT={all:function(g){return true},web:function(g){return g.indexOf('web')>=0},prod:function(g){return g.indexOf('prod')>=0},'web:&prod':function(g){return g.indexOf('web')>=0&&g.indexOf('prod')>=0},'web:!prod':function(g){return g.indexOf('web')>=0&&g.indexOf('prod')<0}};
function hit(p){return p?HS.filter(function(h){return PAT[p](h[1])}).map(function(h){return h[0]}):[]}
var INV=[{t:'[web]',tone:'gold'},'web1 ansible_host=10.0.1.11','web2 ansible_host=10.0.1.12','web3 ansible_host=10.0.2.13',{t:'[db]',tone:'gold'},'db1  ansible_host=10.0.1.21',{t:'[prod]',tone:'gold'},'web1','web2','db1',{t:'[staging]',tone:'gold'},'web3'];
var INVV=[0,1,2,3,4,5,6,7].map(function(i){var r=['[web]','web1 ansible_host=10.0.1.11','web2 ansible_host=10.0.1.12','web3 ansible_host=10.0.2.13','[db]','db1  ansible_host=10.0.1.21','[prod]  web1 web2 db1','[staging]  web3'][i];return r.charAt(0)=='['?{t:r,tone:'gold'}:r});
var PATS=[{t:'all          every host',tone:'gold'},{t:'web          one group',tone:'gold'},{t:'web:db       web OR db',tone:'gold'},{t:'web:&prod    web AND prod',tone:'green'},{t:'web:!prod    web but NOT prod',tone:'amber'},{t:'web1         one host',tone:'gold'},'','ansible web:&prod -m ping'];
var CFG=[{t:'# ansible.cfg (project folder)',tone:'gold'},'[defaults]','inventory         = inventory.ini','remote_user       = deploy','host_key_checking = True','','[privilege_escalation]','become = False'];
function run(S,A,p){S.p=p;var h=hit(p);HS.forEach(function(x){A.set(x[0],{status:'none'})});
 h.forEach(function(n,i){A.after(150+i*260,function(){A.send(['ctl',n],{label:'ssh',tone:'blue',ok:true})});A.after(1100+i*260,function(){A.set(n,{status:'run'})})});
 A.term('term',['$ ansible \''+p+'\' -b -m service \\','    -a "name=nginx state=restarted"'].concat(h.map(function(n){return n+' | CHANGED => restarted'})),true);A.after(1400,function(){A.refresh()})}
function T(h,y){return H.tile(h[0],310,y,h[0],h[1].join(' · '),h[1][0]=='db'?'violet':'blue',{w:124,status:'none'})}
LESSON('ansible','inventory',{
 title:'Inventory & ad-hoc commands',sub:'Ansible reaches your servers over SSH, using an inventory that groups them. One command, many hosts.',time:'13 min',level:'Beginner',
 S:{p:null},
 legend:[['#3b82c4','SSH from the control node'],['#3fa456','task ran'],['#bdb4a8','not targeted']],
 hud:[{id:'p',l:'Pattern',v:function(S){return S.p||'—'},lv:'none'},{id:'n',l:'Hosts hit',v:function(S){return S.p?hit(S.p).length+' of 4':'—'},lv:function(S){return S.p=='web:&prod'?'good':S.p?'warn':'none'}},{id:'ag',l:'Agent needed',v:'none',lv:'good'},{id:'tr',l:'Transport',v:'SSH',lv:'none'}],
 nodes:[
  H.box('ctl',84,44,'control node','gold',{center:true}),
  T(HS[0],46),T(HS[1],124),T(HS[2],202),T(HS[3],280),
  {t:'crowd',id:'you',x:84,y:300,tone:'gold',label:'you',n:1,w:48,anchor:[132,300]},
  {t:'panel',id:'inv',x:392,y:14,w:316,h:170,title:'inventory.ini',rows:INVV,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:HS.map(function(h){return H.lk('ctl',h[0],'blue',{dash:true})}).concat([H.lk('you','ctl','gold')]),
 controls:{title:'Restart nginx on…',groups:[{items:Object.keys(PAT).map(function(p){return {label:p,wide:true,on:function(S){return S.p==p},click:function(S,A){run(S,A,p)}}})}]},
 goal:function(S){var ok=S.p=='web:&prod';return [ok,ok?'Done. web:&prod hits only web1 and web2: web servers that are also in prod. web3 (staging) and db1 were left alone.':'Goal: restart nginx only on production web servers. Try each pattern and watch which hosts it reaches.']},
 learn:[['Know the agentless model',0],['Write an inventory',1],['Test hosts with ping',2],['Run ad-hoc commands',3],['Understand idempotent modules',4],['Target hosts with patterns',5],['Configure ansible.cfg',6]],
 steps:[
  {t:'Agentless automation',b:'Ansible runs on one machine, the control node. It connects to your servers over plain SSH and runs small Python programs there. Nothing to install on the servers.',k:['idea','Key idea','If you can SSH to a server and it has Python, Ansible can manage it.'],pill:'setup',tt:'Model',focus:['ctl','web1','web2','web3','db1'],S:{p:null},
   set:{web1:{status:'none'},web2:{status:'none'},web3:{status:'none'},db1:{status:'none'},inv:{title:'inventory.ini',rows:INVV,hl:[]}},termClear:true,term:{term:['$ pip install ansible','$ ansible --version | head -1','ansible [core 2.17.5]']},
   once:HS.map(function(h,i){return {path:['ctl',h[0]],label:'ssh',tone:'blue',delay:i*300}})},
  {t:'The inventory',b:'The inventory lists your hosts and puts them in groups: by role like web and db, by environment like prod and staging. A host can be in several groups.',k:['tip','Remember','ansible-inventory --graph draws the groups as a tree. Use it to check what you wrote.'],pill:'idea',tt:'Inventory',focus:['ctl','web1','web2','web3','db1'],
   set:{inv:{rows:INVV,hl:[0,4,6,7]}},termClear:true,term:{term:['$ ansible-inventory --graph','@all:','  |--@web:','  |  |--web1','  |  |--web2','  |  |--web3','  |--@db:','  |  |--db1']}},
  {t:'ping: can I reach them?',b:'The ping module is not ICMP ping. It logs in over SSH and checks that Python works: the full path Ansible needs.',k:['problem','Watch out','UNREACHABLE means SSH failed: wrong user, key or host key. Fix SSH first, then retry.'],pill:'idea',tt:'ping',focus:['ctl','web1','web2','web3','db1'],
   set:{web1:{status:'run'},web2:{status:'run'},web3:{status:'run'},db1:{status:'run'}},termClear:true,term:{term:['$ ansible all -m ping','web1 | SUCCESS => "ping": "pong"','web2 | SUCCESS => "ping": "pong"','web3 | SUCCESS => "ping": "pong"','db1  | SUCCESS => "ping": "pong"']},
   once:HS.map(function(h,i){return {path:['ctl',h[0]],label:'ping',tone:'green',delay:i*250}})},
  {t:'Ad-hoc commands',b:'An ad-hoc command runs one module on many hosts right now: ansible <hosts> -m <module> -a "<args>". -b (become) runs it with sudo.',k:['tip','Remember','Ad-hoc is for quick one-off jobs. Anything you will repeat belongs in a playbook.'],pill:'idea',tt:'Ad-hoc',focus:['ctl','web1','web2','web3'],
   set:{web1:{status:'none'},web2:{status:'none'},web3:{status:'none'},db1:{status:'none'}},termClear:true,term:{term:['$ ansible web -a "uptime"','web1 | CHANGED | rc=0 >>',' 10:02 up 41 days, load 0.12','$ ansible web -b -m apt \\','    -a "name=htop state=present"']},
   once:['web1','web2','web3'].map(function(h,i){return {path:['ctl',h],label:'cmd',tone:'blue',delay:i*250}})},
  {t:'Modules are idempotent',b:'Modules describe the state you want, not the steps. state=present installs htop only if it is missing. Run it again and Ansible reports ok instead of changed.',k:['idea','Key idea','Idempotent means: running it twice gives the same result as running it once. That makes reruns safe.'],pill:'idea',tt:'Idempotent',focus:['ctl','web1'],
   set:{web1:{status:'run'}},termClear:true,term:{term:['$ ansible web1 -b -m apt \\','    -a "name=htop state=present"','web1 | CHANGED => "changed": true','$ # the same command again','web1 | SUCCESS => "changed": false']},
   once:[{path:['ctl','web1'],label:'1',tone:'amber'},{path:['ctl','web1'],label:'2',tone:'green',delay:1400}]},
  {t:'Host patterns',b:'The first argument picks the hosts: a group, a host, or a combination. : means OR, :& means AND, :! means NOT. Quote patterns with ! so the shell leaves them alone.',k:['problem','Watch out','A pattern that is too wide restarts more than you meant. Use --list-hosts to preview the targets first.'],pill:'problem',tt:'Patterns',focus:['ctl','web1','web2'],S:{p:'web:&prod'},
   set:{web1:{status:'run'},web2:{status:'run'},inv:{title:'patterns',rows:PATS,hl:[3,4]}},termClear:true,term:{term:["$ ansible 'web:&prod' --list-hosts",'  hosts (2):','    web1','    web2']}},
  {t:'ansible.cfg',b:'An ansible.cfg in the project folder sets defaults: which inventory, which SSH user, whether to check host keys. Teammates who clone the repo get the same settings.',k:['tip','Remember','--check shows what would change without changing it. Add --diff to see file changes line by line.'],pill:'idea',tt:'Config',focus:['ctl'],S:{p:null},
   set:{web1:{status:'none'},web2:{status:'none'},inv:{title:'ansible.cfg',rows:CFG,hl:[2,3,4]}},termClear:true,term:{term:['$ ansible-config dump --only-changed','DEFAULT_HOST_LIST = inventory.ini','DEFAULT_REMOTE_USER = deploy']}},
  {t:'Try it: hit the right hosts',b:'nginx needs a restart, but only on production web servers. Choose a pattern and watch which hosts Ansible reaches.',k:['tip','Challenge','Try web and prod first. Count the hosts each one hits. Which pattern means both?'],pill:'problem',tt:'Try it',S:{p:null},goal:true,focus:null,
   set:{web1:{status:'none'},web2:{status:'none'},web3:{status:'none'},db1:{status:'none'},inv:{title:'inventory.ini',rows:INVV,hl:[]}},termClear:true,term:{term:['$ ansible all --list-hosts | head -1','  hosts (4):']}},
  {t:'Recap',b:'Ansible connects over SSH from one control node. The inventory groups hosts, patterns choose them, and idempotent modules make every run safe to repeat.',k:['idea','Next up','Playbooks and modules: write the desired state down and apply it every time.'],pill:'recap',tt:'Recap',S:{p:'web:&prod'},
   set:{web1:{status:'run'},web2:{status:'run'},web3:{status:'none'},db1:{status:'none'},inv:{title:'inventory.ini',rows:INVV,hl:[]}},termClear:true,term:{term:["$ ansible 'web:&prod' -m ping"]}}
 ]});
})();
