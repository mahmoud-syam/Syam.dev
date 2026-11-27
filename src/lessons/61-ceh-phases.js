(function(){
// Security track, CEH module: ethical hacking basics and the five phases.
var PH=[['recon','Recon','phase 1'],['scan','Scan','phase 2'],['gain','Gain','phase 3'],['keep','Keep','phase 4'],['cover','Cover','phase 5']];
var NAMES=['—','Recon','Scanning','Access','Persist','Report'];
function phSet(n){var o={};PH.forEach(function(p,i){o[p[0]]={status:i<n-1?'run':i==n-1?'sleep':'none'}});return o}
var PT=['1 reconnaissance','2 scanning & enumeration','3 gaining access','4 maintaining access','5 report & clean up'];
var PANEL=['Ethical hacking (in order)',function(S){return {t:(S.perm?'✓':'·')+' 0 written permission',tone:S.perm?'green':'red'}}].concat(PT.map(function(t,i){return function(S){return {t:(S.ph>i?'✓ ':'· ')+t,tone:S.ph>i?'green':S.ph==i&&S.perm?'amber':'slate'}}}));
function step(S,A,n){
 if(!S.perm){A.fx('contract','no');A.term('term',['! no signed scope: this would be a crime','# get written permission first']);return}
 if(n!=S.ph+1){A.fx(PH[Math.min(n,5)-1][0],'no');A.term('term',['! out of order: finish '+NAMES[S.ph+1]+' first']);return}
 S.ph=n;var o=phSet(Math.min(n,5)+(n==5?1:0));Object.keys(o).forEach(function(k){A.set(k,o[k])});
 var T=[[],['$ dig +short target.lab','10.10.10.5'],['$ sudo nmap -sS 10.10.10.5','22/tcp open  ssh','80/tcp open  http'],['$ ssh admin@10.10.10.5','# weak password admin123 worked','$ whoami','admin'],['$ cat ~/.ssh/authorized_keys','ssh-ed25519 AAAAC3Nza... pentest@kali','# test key added, logged in the notes'],["$ sed -i '/pentest@kali/d' ~/.ssh/authorized_keys",'# test key removed, report written']];
 if(n==1)A.send(['you','fw'],{label:'dns',tone:'violet',ok:true});else A.send(['you','fw','target'],{label:n==2?'SYN':n==3?'ssh':'key',tone:n==5?'green':'gold',ok:true});
 if(n==5){A.set('report',{status:'run',sub:'3 findings'});A.fx('report','ok')}
 A.term('term',T[n]);A.hud({phase:{v:NAMES[n],lv:n==5?'good':'warn'},access:{v:n>=3&&n<5?'admin':'none',lv:n>=3&&n<5?'bad':'none'},cia:{v:n>=3&&n<5?'C · I':'—',lv:n>=3&&n<5?'bad':'none'}});A.set('ph',{rows:PANEL});A.refresh()}
LESSON('ceh','phases',{
 title:'Ethical hacking & the five phases',sub:'Think like an attacker, act with permission: CIA, scope and the hacking methodology.',time:'15 min',level:'Beginner',
 S:{perm:true,ph:0},
 legend:[['#3fa456','done'],['#3b82c4','current phase'],['#d23a2e','not allowed']],
 hud:[{id:'scope',l:'Scope',v:function(S){return S.perm?'signed':'none'},lv:function(S){return S.perm?'good':'bad'}},{id:'phase',l:'Phase',v:'—',lv:'none'},{id:'access',l:'Access',v:'none',lv:'none'},{id:'cia',l:'At risk',v:'—',lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:66,y:110,tone:'gold',label:'ethical hacker',n:1,w:52,anchor:[120,110]},
  H.tile('fw',204,110,'firewall','perimeter','amber',{w:104}),
  H.box('target',326,96,'target','green',{center:true,lock:true}),
  H.tile('contract',72,262,'scope','signed','violet',{w:112,status:'run'}),
  H.tile('report',300,262,'report','findings','teal',{w:112,status:'none'}),
  H.tile('recon',40,380,'Recon','phase 1','blue',{w:72,fs:10.5,status:'none'}),
  H.tile('scan',115,380,'Scan','phase 2','blue',{w:72,fs:10.5,status:'none'}),
  H.tile('gain',190,380,'Gain','phase 3','gold',{w:72,fs:10.5,status:'none'}),
  H.tile('keep',265,380,'Keep','phase 4','gold',{w:72,fs:10.5,status:'none'}),
  H.tile('cover',340,380,'Cover','phase 5','red',{w:72,fs:10.5,status:'none'}),
  {t:'panel',id:'ph',x:392,y:14,w:316,h:170,title:'methodology',rows:PANEL,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'kali terminal'}],
 links:[H.lk('you','fw','gold'),H.lk('fw','target','green'),H.lk('you','contract','violet',{dash:true}),H.lk('target','report','teal',{dash:true}),
  H.lk('recon','scan','blue'),H.lk('scan','gain','blue'),H.lk('gain','keep','gold'),H.lk('keep','cover','gold')],
 controls:{title:'Run the engagement',groups:[{items:[
  {label:'Revoke scope',wide:true,on:function(S){return !S.perm},click:function(S,A){S.perm=false;S.ph=0;A.set('contract',{status:'fail',sub:'missing'});var o=phSet(0);Object.keys(o).forEach(function(k){A.set(k,o[k])});A.set('report',{status:'none',sub:'findings'});A.term('term',['# client has not signed yet'],true);A.hud({phase:{v:'—',lv:'none'},access:{v:'none',lv:'none'}});A.refresh()}},
  {label:'Sign scope',wide:true,on:function(S){return S.perm},click:function(S,A){S.perm=true;A.set('contract',{status:'run',sub:'signed'});A.fx('contract','ok');A.term('term',['$ cat scope.txt','in:     10.10.10.0/24','out:    10.10.10.1 (gateway)','window: Sat 22:00-02:00']);A.refresh()}},
  {label:'Recon',wide:true,click:function(S,A){step(S,A,1)}},
  {label:'Scan',wide:true,click:function(S,A){step(S,A,2)}},
  {label:'Gain access',wide:true,click:function(S,A){step(S,A,3)}},
  {label:'Persist',wide:true,click:function(S,A){step(S,A,4)}},
  {label:'Report & clean up',wide:true,click:function(S,A){step(S,A,5)}}]}]},
 goal:function(S){var ok=S.perm&&S.ph>=5;return [ok,ok?'Done. Permission first, then the phases in order, and you finished with a report and a clean target.':'Goal: run a legal engagement from start to finish. Sign the scope, then go through the phases in order and end with the report.']},
 learn:[['Know what makes hacking ethical',0],['Use the CIA triad',1],['Agree scope and rules of engagement',2],['Recon and scanning',3],['Gaining and keeping access',5],['Cover tracks vs report',7]],
 steps:[
  {t:'Same tools, different rules',b:'An ethical hacker uses the same tools and tricks as a criminal, but only with written permission, inside an agreed scope, and reports everything to the owner.',k:['idea','Key idea','White hat: authorised. Black hat: criminal. Grey hat: no permission, even with good intent. Only white hat is legal.'],pill:'setup',tt:'Ethics',focus:['you','contract','target'],S:{perm:true,ph:0},
   set:Object.assign(phSet(0),{contract:{status:'run',sub:'signed'},report:{status:'none',sub:'findings'},ph:{rows:['Who is who',{t:'white hat  authorised tester',tone:'green'},{t:'grey hat   no permission',tone:'amber'},{t:'black hat  criminal',tone:'red'},'','Permission is the only difference','between a pentest and a crime.'],hl:[]}}),
   hud:{phase:{v:'—',lv:'none'},access:{v:'none',lv:'none'},cia:{v:'—',lv:'none'}},termClear:true,term:{term:['$ # authorised test of target.lab','$ # every command goes in the notes']},
   fx:[{n:'contract',k:'pulse'}]},
  {t:'What you protect: CIA',b:'Security protects three things. Confidentiality: only the right people can read the data. Integrity: nobody changed it. Availability: it is there when needed.',k:['tip','Remember','A data leak hits C, a tampered file hits I, a DDoS hits A. Every finding in a report maps to one of them.'],pill:'idea',tt:'CIA',focus:['target'],S:{perm:true,ph:0},
   set:{ph:{rows:['The CIA triad',{t:'C  confidentiality  leak, sniffing',tone:'violet'},{t:'I  integrity        tampering',tone:'amber'},{t:'A  availability     DDoS, ransomware',tone:'red'},'','Hashes prove integrity:','same file → same hash.'],hl:[1,2,3]}},
   hud:{cia:{v:'C · I · A',lv:'warn'}},termClear:true,term:{term:['$ md5sum report.pdf','5d41402abc4b2a76b9719d911017c592  report.pdf','$ sha256sum report.pdf | cut -c1-16','2cf24dba5fb0a30e','# changed hash = changed file (I)']},
   fx:[{n:'target',k:'pulse'}]},
  {t:'Scope and rules of engagement',b:'Before any packet is sent, the client signs what you may test, what is off limits, when, and who to call if something breaks. Testing outside it is illegal, even by one IP.',k:['problem','Watch out','No signature, no test. Also agree what to do if you find live criminal activity or very sensitive data.'],pill:'problem',tt:'Scope',focus:['you','contract'],S:{perm:true,ph:0},
   set:{contract:{status:'run',sub:'signed'},ph:{rows:['Rules of engagement',{t:'✓ in scope: 10.10.10.0/24',tone:'green'},{t:'✗ out: gateway, prod database',tone:'red'},'✓ window: Saturday night','✓ emergency contact','✓ no denial of service','✓ data handled and deleted after'],hl:[]}},
   termClear:true,term:{term:['$ cat scope.txt','in:     10.10.10.0/24','out:    10.10.10.1 (gateway)','window: Sat 22:00-02:00','contact: soc@target.lab']},
   once:[{path:['you','contract'],label:'sign',tone:'violet'}]},
  {t:'Phase 1: reconnaissance',b:'Collect as much as you can about the target before touching it: domains, IP ranges, people, technologies. Passive recon uses public sources. Active recon talks to the target.',k:['idea','Key idea','Most of the work is here. Good recon tells you where to look, so the later phases are short and quiet.'],pill:'idea',tt:'Recon',focus:['you','recon'],S:{perm:true,ph:0},
   set:Object.assign(phSet(1),{ph:{rows:PANEL}}),hud:{phase:{v:'Recon',lv:'warn'},cia:{v:'C',lv:'warn'}},termClear:true,term:{term:['$ dig +short target.lab','10.10.10.5','$ dig +short MX target.lab','10 mail.target.lab.']},
   flows:[{path:['you','fw'],label:'dns',tone:'violet'}]},
  {t:'Phase 2: scanning & enumeration',b:'Now you touch the target: which hosts are up, which ports are open, which software and versions run behind them. Enumeration then pulls users, shares and banners.',k:['tip','Remember','Scanning is noisy. A firewall or IDS can log it, which is why the time window was agreed.'],pill:'idea',tt:'Scan',focus:['you','fw','target','scan'],S:{perm:true,ph:1},
   set:Object.assign(phSet(2),{ph:{rows:PANEL}}),hud:{phase:{v:'Scanning',lv:'warn'}},termClear:true,term:{term:['$ sudo nmap -sS -sV 10.10.10.5','PORT   STATE SERVICE VERSION','22/tcp open  ssh     OpenSSH 8.9p1','80/tcp open  http    Apache httpd 2.4.52']},
   flows:[{path:['you','fw','target'],label:'SYN',tone:'gold'}]},
  {t:'Phase 3: gaining access',b:'Use what you found to get in: a weak password, an unpatched service, a misconfiguration or a phishing email. Then escalate from a normal user to admin or root.',k:['problem','Watch out','Prove the risk, then stop. Do not read more data than you need to show the impact.'],pill:'problem',tt:'Access',focus:['you','fw','target','gain'],S:{perm:true,ph:2},
   set:Object.assign(phSet(3),{ph:{rows:PANEL}}),hud:{phase:{v:'Access',lv:'warn'},access:{v:'admin',lv:'bad'},cia:{v:'C · I',lv:'bad'}},termClear:true,term:{term:['$ ssh admin@10.10.10.5','# weak password admin123 worked','$ whoami','admin','$ sudo -l','    (ALL : ALL) ALL']},
   once:[{path:['you','fw','target'],label:'ssh',tone:'gold',ok:true}]},
  {t:'Phase 4: maintaining access',b:'Real attackers plant a way back in: an extra SSH key, a cron job, a new user, a service. Testers show that it is possible, write down exactly what they planted, and remove it later.',k:['tip','Remember','Defenders hunt for exactly these: unknown keys in authorized_keys, odd cron entries, new users.'],pill:'idea',tt:'Persist',focus:['target','keep'],S:{perm:true,ph:3},
   set:Object.assign(phSet(4),{ph:{rows:PANEL}}),hud:{phase:{v:'Persist',lv:'warn'},access:{v:'admin',lv:'bad'}},termClear:true,term:{term:['$ cat ~/.ssh/authorized_keys','ssh-ed25519 AAAAC3Nza... admin@laptop','ssh-ed25519 AAAAC3Nza... pentest@kali','$ crontab -l','no crontab for admin']},
   fx:[{n:'target',k:'pulse'}]},
  {t:'Phase 5: cover tracks vs report',b:'Criminals delete logs to hide. Ethical hackers never do: they remove only their own test files, then write a report with each finding, its risk and how to fix it.',k:['idea','Key idea','Defenders send logs to a central SIEM right away, so an attacker who wipes the local logs is still caught.'],pill:'idea',tt:'Report',focus:['target','cover','report'],S:{perm:true,ph:5},
   set:Object.assign(phSet(6),{report:{status:'run',sub:'3 findings'},ph:{rows:PANEL}}),hud:{phase:{v:'Report',lv:'good'},access:{v:'none',lv:'none'},cia:{v:'—',lv:'none'}},termClear:true,term:{term:['$ sudo grep Accepted /var/log/auth.log','... Accepted password for admin','    from 10.10.10.99 port 51514 ssh2','# evidence for the report, not deleted']},
   once:[{path:['target','report'],label:'pdf',tone:'teal'}]},
  {t:'Try it: run a legal engagement',b:'The client has not signed yet. Get the scope signed, then run the phases in the right order and finish with the report.',k:['tip','Challenge','Click Recon first and see what happens without a signature. Then try skipping a phase.'],pill:'problem',tt:'Try it',S:{perm:false,ph:0},goal:true,focus:['you','contract','recon','scan','gain','keep','cover'],
   set:Object.assign(phSet(0),{contract:{status:'fail',sub:'missing'},report:{status:'none',sub:'findings'},ph:{rows:PANEL}}),hud:{phase:{v:'—',lv:'none'},access:{v:'none',lv:'none'},cia:{v:'—',lv:'none'}},termClear:true,term:{term:['# client has not signed yet']}},
  {t:'Recap',b:'Permission and scope first. Then recon, scanning, access, persistence, and a report instead of hidden tracks. Everything you do is written down.',k:['idea','Next up','Footprinting: everything you can learn about a target without sending it a single packet.'],pill:'recap',tt:'Recap',S:{perm:true,ph:5},
   set:Object.assign(phSet(6),{contract:{status:'run',sub:'signed'},report:{status:'run',sub:'3 findings'},ph:{rows:PANEL}}),hud:{phase:{v:'Report',lv:'good'},access:{v:'none',lv:'none'}},termClear:true,term:{term:['$ # scope → recon → scan → access','$ # → persist → report & clean up']}}
 ]});
})();
