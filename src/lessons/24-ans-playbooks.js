(function(){
var PB=[{t:'- hosts: web',tone:'gold'},'  become: true','  tasks:','    - apt: {name: nginx, state: present}','    - template:','        src: nginx.conf.j2','        dest: /etc/nginx/nginx.conf',{t:'      notify: restart nginx',tone:'violet'},'    - service: {name: nginx, state: started}',{t:'  handlers:',tone:'gold'},'    - name: restart nginx','      service: {name: nginx, state: restarted}'];
var TPL=[{t:'# templates/nginx.conf.j2',tone:'gold'},function(S){return {t:'worker_processes {{ ansible_processor_vcpus }};',tone:'green'}},'events { worker_connections {{ max_conn }}; }',function(S){return {t:'# max_conn = '+(S.ver>1?'2048':'1024')+'   (group_vars/web.yml)',tone:S.ver>1?'amber':undefined}},'','# on web1 (4 vCPUs) this renders as:','worker_processes 4;'];
var WL=[{t:'- apt:',tone:'gold'},'    name: "{{ item }}"','    state: present','  loop: [git, curl, htop]',{t:'  when: ansible_facts["os_family"] == "Debian"',tone:'green'},'','# RHEL hosts skip this task; use dnf there'];
var MODS=[{t:'apt / dnf      packages',tone:'gold'},{t:'copy           put a file',tone:'gold'},{t:'template       file with variables (Jinja2)',tone:'gold'},{t:'service        start, stop, enable',tone:'gold'},{t:'user / group   accounts',tone:'gold'},{t:'file           folders, links, permissions',tone:'gold'},{t:'lineinfile     one line in a config',tone:'gold'},'','ansible-doc template   # docs for a module'];
var HOSTS=['web1','web2','web3'];
function recap(ch){return HOSTS.map(function(h){return (h+'  ').slice(0,5)+' : ok=3  changed='+ch})}
function setT(A,st){['t1','t2','t3'].forEach(function(t,i){A.set(t,{status:st[i]})})}
function play(S,A,check){var first=!S.inst,edited=S.ver!=S.dep;var st=[first?'stop':'run',first||edited?'stop':'run',first?'stop':'run'],ch=st.filter(function(x){return x=='stop'}).length,hd=first||edited;
 var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
 setT(A,['none','none','none']);A.set('hd',{status:'none'});if(!check)A.set('code',{title:'site.yml',rows:PB,hl:[]});
 ['t1','t2','t3'].forEach(function(t,i){L(200+i*700,function(){A.send([t].concat(HOSTS),{label:check?'?':'▶',tone:'blue',ok:true});A.set(t,{status:check?(st[i]=='stop'?'#e8a33a':'run'):st[i]})})});
 if(check){L(2400,function(){A.term('term',['$ ansible-playbook site.yml --check --diff'].concat(edited?['--- before: /etc/nginx/nginx.conf','+++ after: nginx.conf.j2','-events { worker_connections 1024; }','+events { worker_connections 2048; }']:[]).concat(recap(edited?1:0)).concat(['# check mode: nothing was changed']),true);A.refresh()});return}
 if(hd)L(2400,function(){A.send(['t2','hd'],{label:'notify',tone:'violet',ok:true});A.set('hd',{status:'run'})});
 L(3000,function(){A.term('term',['$ ansible-playbook site.yml'].concat(hd?['RUNNING HANDLER [restart nginx]']:[]).concat(['PLAY RECAP']).concat(recap(ch)),true);
  if(!first&&!edited)S.idem=true;if(!first&&edited)S.hand=true;S.inst=true;S.dep=S.ver;S.runs++;A.refresh()})}
LESSON('ansible','playbooks',{
 title:'Playbooks & modules',sub:'Write the desired state of your servers in YAML once, and apply it safely as often as you like.',time:'15 min',level:'Intermediate',
 S:{inst:false,ver:1,dep:0,runs:0,idem:false,hand:false},
 legend:[['#e8a33a','changed'],['#3fa456','ok (already right)'],['#5a4aa8','handler']],
 hud:[{id:'r',l:'Runs',v:function(S){return String(S.runs)},lv:'none'},{id:'i',l:'Idempotent run',v:function(S){return S.idem?'seen':'not yet'},lv:function(S){return S.idem?'good':'none'}},{id:'h',l:'Handler after edit',v:function(S){return S.hand?'seen':'not yet'},lv:function(S){return S.hand?'good':'none'}},{id:'t',l:'Template',v:function(S){return S.ver==S.dep?'deployed':'edited'},lv:function(S){return S.ver==S.dep?'none':'warn'}}],
 nodes:[
  H.tile('t1',88,46,'apt','nginx present','blue',{w:128,status:'none'}),
  H.tile('t2',88,128,'template','nginx.conf','blue',{w:128,status:'none'}),
  H.tile('t3',88,210,'service','nginx started','blue',{w:128,status:'none'}),
  H.tile('hd',88,316,'handler','restart nginx','violet',{w:128,status:'none'}),
  H.tile('web1',314,86,'web1','web · prod','green',{w:112}),H.tile('web2',314,172,'web2','web · prod','green',{w:112}),H.tile('web3',314,258,'web3','web · staging','green',{w:112}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:230,title:'site.yml',rows:PB,fs:9.5},
  {t:'term',id:'term',x:392,y:256,w:316,h:194,title:'terminal'}],
 links:[H.lk('t1','t2','blue'),H.lk('t2','t3','blue'),H.lk('t2','hd','violet',{dash:true})],
 controls:{title:'Run site.yml',groups:[{items:[
  {label:'ansible-playbook site.yml',wide:true,click:function(S,A){play(S,A,false)}},
  {label:'edit template',wide:true,on:function(S){return S.ver!=S.dep&&S.inst},click:function(S,A){if(!S.inst){A.term('term',['# run the playbook once first'],true);return}S.ver++;S.rid=(S.rid||0)+1;A.set('code',{title:'nginx.conf.j2',rows:TPL,hl:[3]});A.term('term',['$ vim templates/nginx.conf.j2','# max_conn: 1024 → 2048'],true);A.fx('t2','pulse')}},
  {label:'--check --diff',wide:true,click:function(S,A){if(!S.inst){A.term('term',['# nothing deployed yet: run once first'],true);return}play(S,A,true)}}]}]},
 goal:function(S){var ok=S.idem&&S.hand;return [ok,ok?'Done. A second run changed nothing, and an edited template changed one file and fired the handler once. That is idempotency.':'Goal: run the playbook, run it again and compare changed=, then edit the template, preview with --check --diff and run once more.']},
 learn:[['Read a playbook',0],['Know the common modules',1],['Read a PLAY RECAP',2],['Prove idempotency',3],['Use templates and facts',4],['Use handlers',5],['Use when, loop and check mode',6]],
 steps:[
  {t:'A playbook is desired state',b:'A playbook is a YAML file. Each play picks hosts, and its tasks run in order on all of them. You describe what should be true, not how to get there.',k:['tip','Remember','Real playbooks give every task a name: so the output reads like a checklist. We skip names here to save space.'],pill:'setup',tt:'Playbook',focus:['t1','t2','t3'],S:{inst:false,ver:1,dep:0,runs:0,idem:false,hand:false},
   set:{t1:{status:'none'},t2:{status:'none'},t3:{status:'none'},hd:{status:'none'},code:{title:'site.yml',rows:PB,hl:[0,1,2]}},termClear:true,term:{term:['$ ansible-playbook --syntax-check site.yml','playbook: site.yml']}},
  {t:'Modules do the work',b:'Each task calls one module with arguments. apt installs packages, template writes a file from a template, service starts and enables services.',k:['idea','Key idea','Prefer a real module over shell: or command:. Modules know how to be idempotent, shell commands do not.'],pill:'idea',tt:'Modules',focus:['t1','t2','t3'],
   set:{code:{title:'common modules',rows:MODS,hl:[0,2,3]}},termClear:true,term:{term:['$ ansible-doc -s service | head -3','- name: Manage services','  service:','      enabled: ...']}},
  {t:'First run',b:'On fresh servers every task has something to do, so each reports changed. The PLAY RECAP at the end counts ok and changed for every host.',k:['tip','Remember','failed=0 and unreachable=0 in the recap are what you look for first.'],pill:'idea',tt:'Run 1',focus:['t1','t2','t3','web1','web2','web3'],S:{inst:true,dep:1,runs:1},
   set:{t1:{status:'stop'},t2:{status:'stop'},t3:{status:'stop'},hd:{status:'run'},code:{title:'site.yml',rows:PB,hl:[3,4,8]}},termClear:true,term:{term:['$ ansible-playbook site.yml','RUNNING HANDLER [restart nginx]','PLAY RECAP'].concat(recap(3))},
   once:[{path:['t1','web1','web2','web3'],label:'▶',tone:'blue'},{path:['t2','web1','web2','web3'],label:'▶',tone:'blue',delay:700},{path:['t3','web1','web2','web3'],label:'▶',tone:'blue',delay:1400}]},
  {t:'Second run: nothing to do',b:'Run the same playbook again. nginx is installed, the file matches and the service runs, so every task reports ok and changed=0.',k:['idea','Key idea','changed=0 on a rerun proves the playbook is idempotent. Run it every day and it only fixes drift.'],pill:'idea',tt:'Run 2',focus:['t1','t2','t3','web1','web2','web3'],S:{runs:2,idem:true},
   set:{t1:{status:'run'},t2:{status:'run'},t3:{status:'run'},hd:{status:'none'}},termClear:true,term:{term:['$ ansible-playbook site.yml','PLAY RECAP'].concat(recap(0))},
   once:[{path:['t1','web1','web2','web3'],label:'ok',tone:'green'}]},
  {t:'Templates, variables and facts',b:'A template is a config file with blanks. {{ max_conn }} comes from your variables, and ansible_facts are details Ansible gathers from each host, like its CPU count.',k:['tip','Remember','ansible web1 -m setup prints every fact for a host. Filter with -a "filter=ansible_processor*".'],pill:'idea',tt:'Templates',focus:['t2','web1'],
   set:{code:{title:'nginx.conf.j2',rows:TPL,hl:[1,2]}},termClear:true,term:{term:['$ ansible web1 -m setup \\','    -a "filter=ansible_processor_vcpus"','"ansible_processor_vcpus": 4']}},
  {t:'Handlers',b:'A handler runs only when a task that notifies it reports changed, and only once at the end of the play. So nginx restarts when its config changes, not on every run.',k:['problem','Watch out','Restarting on every run causes needless downtime. Notify a handler instead of adding a restart task.'],pill:'idea',tt:'Handlers',focus:['t2','hd'],S:{ver:2,dep:2,runs:3,hand:true},
   set:{t1:{status:'run'},t2:{status:'stop'},t3:{status:'run'},hd:{status:'run'},code:{title:'site.yml',rows:PB,hl:[7,9,10,11]}},termClear:true,term:{term:['$ ansible-playbook site.yml','RUNNING HANDLER [restart nginx]','PLAY RECAP'].concat(recap(1))},
   once:[{path:['t2','hd'],label:'notify',tone:'violet'}]},
  {t:'when, loop and check mode',b:'loop repeats a task over a list. when runs it only if a condition is true, often based on facts. --check --diff shows exactly what would change, without changing it.',k:['tip','Remember','Use --check --diff before every run in production. It is the plan, like terraform plan.'],pill:'idea',tt:'when',focus:['t1'],
   set:{code:{title:'loop + when',rows:WL,hl:[3,4]}},termClear:true,term:{term:['$ ansible-playbook site.yml --check --diff','--- before: /etc/nginx/nginx.conf','+++ after: nginx.conf.j2','-  worker_connections 1024;','+  worker_connections 2048;']}},
  {t:'Try it: prove idempotency',b:'Run the playbook, then run it again. Edit the template, preview the change with --check --diff, and run once more. Watch changed= and the handler.',k:['tip','Challenge','Which run fires the handler? Which run changes nothing at all?'],pill:'problem',tt:'Try it',S:{inst:false,ver:1,dep:0,runs:0,idem:false,hand:false},goal:true,focus:null,
   set:{t1:{status:'none'},t2:{status:'none'},t3:{status:'none'},hd:{status:'none'},code:{title:'site.yml',rows:PB,hl:[]}},termClear:true,term:{term:['$ ansible web -m ping -o | wc -l','3']}},
  {t:'Recap',b:'Playbooks describe desired state, modules make it true, templates fill in variables and facts, handlers restart only on change, and --check --diff previews it all.',k:['idea','Next up','Roles and Vault: reuse playbooks and keep secrets encrypted.'],pill:'recap',tt:'Recap',S:{inst:true,ver:2,dep:2,runs:3,idem:true,hand:true},
   set:{t1:{status:'run'},t2:{status:'run'},t3:{status:'run'},hd:{status:'none'},code:{title:'site.yml',rows:PB,hl:[]}},termClear:true,term:{term:['$ ansible-playbook site.yml --check --diff']}}
 ]});
})();
