(function(){
var LOC={def:'roles/app/defaults',gv:'group_vars/prod/vault.yml',hv:'host_vars/web1.yml',pb:'playbook vars:'};
var TASKS=[{v:'app_port: 8080',why:'a default every environment can override',best:'def'},{v:'db_password: S3cr3t!',why:'a production secret',best:'gv'},{v:'max_conn: 4096',why:'only web1, the biggest server',best:'hv'}];
var WRONG={0:{gv:'! a vault is for secrets, and group_vars/prod',hv:'! host_vars applies to one host only',pb:'! play vars beat group_vars: no env could override'},
 1:{def:'! defaults are plain text and shared by all envs',hv:'! web1 only, and still unencrypted',pb:'! a password in plain YAML ends up in Git'},
 2:{def:'! defaults would give every host 4096',gv:'! that changes all prod hosts, not just web1',pb:'! the playbook applies to every host in the play'}};
var TREE=[{t:'roles/nginx/',tone:'gold'},'  tasks/main.yml       what to do','  handlers/main.yml    restarts','  templates/           *.j2 files','  files/               static files','  defaults/main.yml    default variables','  vars/main.yml        fixed variables','  meta/main.yml        dependencies'];
var SITE=[{t:'# site.yml',tone:'gold'},'- hosts: all','  roles: [common]','- hosts: web','  roles: [nginx, app]','- hosts: db','  roles: [postgres]','','$ ansible-galaxy init roles/app'];
var PREC=['Variable precedence (low → high)',{t:'1 role defaults        easy to override',tone:'gold'},{t:'2 group_vars/all',tone:'gold'},{t:'3 group_vars/<group>   per environment',tone:'gold'},{t:'4 host_vars/<host>     one machine',tone:'gold'},{t:'5 play vars / role vars',tone:'gold'},{t:'6 -e extra vars        always win',tone:'red'}];
var GV=['inventory.ini',{t:'group_vars/',tone:'gold'},'  all.yml          ntp_server: pool.ntp.org','  prod/vars.yml    log_level: warn',{t:'  prod/vault.yml   (encrypted)',tone:'violet'},'  staging/vars.yml log_level: debug',{t:'host_vars/',tone:'gold'},'  web1.yml         max_conn: 4096'];
var VAULT=[{t:'$ANSIBLE_VAULT;1.1;AES256',tone:'violet'},'6231383964363131646563356561643637356235','3837613465613962653461366565383133396531','3332376630306365636336393865386264313663','','# readable only with the vault password','# safe to commit to Git'];
function place(S,A,loc){if(S.task>=3){A.term('term',['# all variables placed'],true);return}var t=TASKS[S.task];
 if(loc!=t.best){A.send(['you',loc],{label:'?',tone:'red',ok:false});A.term('term',['# '+t.v+'  →  '+LOC[loc],WRONG[S.task][loc]],true);return}
 A.send(['you',loc],{label:'var',tone:loc=='gv'?'violet':'green',ok:true});
 A.term('term',S.task==1?['$ ansible-vault encrypt_string \'S3cr3t!\' \\','    --name db_password \\','    >> group_vars/prod/vault.yml','Encryption successful']:['$ echo "'+t.v+'" >> '+LOC[loc],'# ✓ '+t.why],true);
 S.task++;A.after(900,function(){A.refresh()})}
LESSON('ansible','roles',{
 title:'Roles & Vault',sub:'Package playbooks into reusable roles, put variables in the right place, and encrypt secrets.',time:'15 min',level:'Intermediate',
 S:{task:0},
 legend:[['#3fa456','plain variables'],['#5a4aa8','encrypted (vault)'],['#e5534b','wrong place']],
 hud:[{id:'t',l:'Variable',v:function(S){return S.task>=3?'all placed':(S.task+1)+'/3 '+TASKS[S.task].v.split(':')[0]},lv:function(S){return S.task>=3?'good':'none'}},{id:'r',l:'Roles',v:'3',lv:'none'},{id:'s',l:'Secrets in plain text',v:function(S){return S.task>=2?'0':'1'},lv:function(S){return S.task>=2?'good':'bad'}},{id:'g',l:'Commit safe',v:function(S){return S.task>=2?'yes':'no'},lv:function(S){return S.task>=2?'good':'warn'}}],
 nodes:[
  H.box('def',62,40,'role defaults','green',{center:true}),
  H.box('gv',190,40,'group_vars','violet',{center:true,lock:true}),
  H.box('hv',318,40,'host_vars','blue',{center:true}),
  H.tile('pb',190,230,'site.yml','play vars','slate',{w:112}),
  {t:'crowd',id:'you',x:70,y:330,tone:'gold',label:'you',n:1,w:48,anchor:[118,330]},
  H.tile('web1',318,330,'web1','prod · biggest','green',{w:118}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'role layout',rows:TREE,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','def','gold',{dash:true}),H.lk('you','gv','gold',{dash:true}),H.lk('you','hv','gold',{dash:true}),H.lk('you','pb','gold',{dash:true}),H.lk('hv','web1','blue')],
 controls:{title:'Where does it go?',groups:[{items:[['def','role defaults'],['gv','group_vars/prod vault'],['hv','host_vars/web1'],['pb','playbook vars']].map(function(g){return {label:g[1],wide:true,click:function(S,A){place(S,A,g[0])}}})}]},
 goal:function(S){if(S.task>=3)return [true,'Done. Defaults stay overridable, the secret is encrypted per environment, and only web1 gets the bigger limit.'];var t=TASKS[S.task];return [false,'Variable '+(S.task+1)+' of 3: '+t.v+'. It is '+t.why+'. Where does it belong?']},
 learn:[['Know what a role is',0],['Use roles in a playbook',1],['Understand variable precedence',2],['Use group_vars and host_vars',3],['Encrypt secrets with Vault',4],['Run playbooks with Vault',5],['Lint and test roles',6]],
 steps:[
  {t:'Roles: reusable building blocks',b:'A role packs everything for one job, like nginx, into a standard folder layout: tasks, handlers, templates, defaults. You write it once and reuse it in every project.',k:['tip','Remember','ansible-galaxy init roles/app creates the whole folder skeleton for you.'],pill:'setup',tt:'Roles',focus:['def','pb'],S:{task:0},
   set:{info:{title:'role layout',rows:TREE,hl:[1,5]}},termClear:true,term:{term:['$ ansible-galaxy init roles/nginx','- Role roles/nginx was created successfully','$ ls roles/nginx','defaults  files  handlers  meta  README.md','tasks  templates  tests  vars']}},
  {t:'Playbooks call roles',b:'With roles, site.yml becomes a short map: which roles go on which hosts. Ansible Galaxy shares roles and collections that others have written.',k:['problem','Watch out','Read a Galaxy role before you use it. It runs as root on your servers.'],pill:'idea',tt:'Use roles',focus:['pb'],
   set:{info:{title:'site.yml',rows:SITE,hl:[2,4,6]}},termClear:true,term:{term:['$ ansible-galaxy collection install \\','    community.general','$ ansible-playbook site.yml']},fx:[{n:'pb',k:'pulse'}]},
  {t:'Where variables live',b:'The same variable can be set in many places. Ansible picks the one with the highest precedence. Role defaults are the weakest, extra vars from -e always win.',k:['idea','Key idea','Put a value as low as possible: defaults for sane values, group_vars for environments, host_vars for exceptions.'],pill:'idea',tt:'Precedence',focus:['def','gv','hv','pb'],
   set:{info:{title:'precedence',rows:PREC,hl:[1,3,4]}},termClear:true,term:{term:['$ ansible web1 -m debug -a "var=max_conn"','web1 | SUCCESS => "max_conn": 4096','$ ansible web2 -m debug -a "var=max_conn"','web2 | SUCCESS => "max_conn": 1024']}},
  {t:'group_vars and host_vars',b:'Folders next to the inventory hold variables by group and by host. group_vars/prod applies to every prod host, host_vars/web1.yml only to web1.',k:['tip','Remember','The folder names must match the inventory group and host names exactly.'],pill:'idea',tt:'Folders',focus:['gv','hv','web1'],
   set:{info:{title:'project layout',rows:GV,hl:[3,5,7]}},termClear:true,term:{term:['$ ansible-inventory --host web1 | grep max','  "max_conn": 4096']},
   once:[{path:['hv','web1'],label:'4096',tone:'blue'}]},
  {t:'Ansible Vault',b:'Vault encrypts secrets with AES so you can commit them safely. Encrypt a whole file or a single value, and only people with the vault password can read it.',k:['problem','Watch out','Never commit a plain password, even to a private repo. Encrypt it first, every time.'],pill:'problem',tt:'Vault',focus:['gv'],
   set:{info:{title:'group_vars/prod/vault.yml',rows:VAULT,hl:[0]}},termClear:true,term:{term:['$ cd group_vars/prod','$ ansible-vault encrypt vault.yml','Encryption successful','$ ansible-vault view vault.yml','Vault password: ••••']},fx:[{n:'gv',k:'ok'}]},
  {t:'Run with Vault',b:'Give the vault password at run time with --ask-vault-pass, or a protected password file in CI. Add no_log: true to tasks that handle secrets so they stay out of the output.',k:['tip','Remember','In CI, store the vault password as a pipeline secret and pass it with --vault-password-file.'],pill:'idea',tt:'Run',focus:['gv','pb'],
   set:{info:{title:'group_vars/prod/vault.yml',rows:VAULT,hl:[5,6]}},termClear:true,term:{term:['$ ansible-playbook site.yml --ask-vault-pass','Vault password: ••••','TASK [app : set db password] ******','ok: [web1]  (output hidden: no_log)']}},
  {t:'Lint and test roles',b:'ansible-lint catches bad patterns. Molecule spins up a test machine, applies the role, runs it a second time to check idempotency, and destroys it.',k:['idea','Key idea','A role that passes Molecule twice with changed=0 the second time is a role you can trust.'],pill:'idea',tt:'Testing',focus:['def','pb'],
   set:{info:{title:'role layout',rows:TREE,hl:[]}},termClear:true,term:{term:['$ ansible-lint roles/nginx','Passed: 0 failure(s), 0 warning(s)','$ molecule test','... idempotence: OK']}},
  {t:'Try it: place the variables',b:'Three variables need a home. For each one pick the location that fits its job. The goal bar shows the current variable.',k:['tip','Challenge','Ask two questions each time: who needs this value, and is it a secret?'],pill:'problem',tt:'Try it',S:{task:0},goal:true,focus:null,
   set:{info:{title:'project layout',rows:GV,hl:[]}},termClear:true,term:{term:['$ # three variables to place']}},
  {t:'Recap',b:'Roles package reusable work, variables go where precedence fits their job, and Vault keeps secrets encrypted in Git. Your automation is now ready for real teams.',k:['idea','Next up','Docker: package applications into containers.'],pill:'recap',tt:'Recap',S:{task:3},
   set:{info:{title:'project layout',rows:GV,hl:[]}},termClear:true,term:{term:['$ ansible-playbook site.yml --ask-vault-pass']}}
 ]});
})();
