(function(){
// CEH: scanning networks with Nmap (host discovery, port states, versions, OS, NSE).
var P=[['p21','21/tcp','ftp','vsftpd 2.3.4','open'],['p22','22/tcp','ssh','OpenSSH 8.9p1','open'],['p80','80/tcp','http','Apache 2.4.52','open'],['p3306','3306/tcp','mysql','','filtered']];
var ST={open:'run',closed:'stop',filtered:'fail'};
function ports(S){var o={};P.forEach(function(p){o[p[0]]={status:S.ports?ST[p[4]]:'none',sub:!S.ports?'?':S.ver&&p[3]?p[3]:p[4]+' · '+p[2]}});return o}
function hosts(S){return {h1:{show:!!S.disc},h9:{show:!!S.disc}}}
var PANEL=['Scan results: 10.10.10.5',function(S){return {t:'hosts up:  '+(S.disc?'.1  .5  .9':'?'),tone:S.disc?'green':'slate'}}].concat(P.map(function(p){return function(S){return S.ports?{t:p[1].padEnd(10)+p[4].padEnd(10)+(S.ver&&p[3]?p[3]:p[2]),tone:p[4]=='open'?(S.ver&&p[0]=='p21'?'red':'green'):'amber'}:{t:p[1]+'  ?',tone:'slate'}}})).concat([function(S){return S.ver?{t:'! vsftpd 2.3.4 has a known backdoor',tone:'red'}:''}]);
function upd(S,A){var o=Object.assign(ports(S),hosts(S));Object.keys(o).forEach(function(k){A.set(k,o[k])});A.set('res',{rows:PANEL});A.refresh()}
LESSON('ceh','scanning',{
 title:'Scanning with Nmap',sub:'Find live hosts, open ports, versions and the OS, and read what each port state means.',time:'18 min',level:'Intermediate',
 S:{disc:false,ports:false,ver:false},
 legend:[['#3fa456','open'],['#e8a33a','closed'],['#e5534b','filtered']],
 hud:[{id:'hosts',l:'Hosts up',v:function(S){return S.disc?'3':'?'},lv:function(S){return S.disc?'good':'none'}},{id:'open',l:'Open ports',v:function(S){return S.ports?'3':'?'},lv:function(S){return S.ports?'warn':'none'}},{id:'scan',l:'Scan type',v:'—',lv:'none'},{id:'risk',l:'Finding',v:function(S){return S.ver?'vsftpd 2.3.4':'—'},lv:function(S){return S.ver?'bad':'none'}}],
 nodes:[
  {t:'crowd',id:'you',x:58,y:262,tone:'gold',label:'you',n:1,w:52,anchor:[110,262]},
  H.tile('fw',178,262,'firewall','filters 3306','amber',{w:100}),
  H.box('h5',252,40,'.5 target','green',{center:true,w:28,h:14,d:26}),
  H.box('h1',160,40,'.1','slate',{center:true,w:28,h:14,d:26,show:false}),
  H.box('h9',338,40,'.9','slate',{center:true,w:28,h:14,d:26,show:false}),
  H.tile('p21',306,190,'21 ftp','?','teal',{w:120,status:'none'}),
  H.tile('p22',306,248,'22 ssh','?','teal',{w:120,status:'none'}),
  H.tile('p80',306,306,'80 http','?','teal',{w:120,status:'none'}),
  H.tile('p3306',306,364,'3306 mysql','?','teal',{w:120,status:'none'}),
  {t:'panel',id:'res',x:392,y:14,w:316,h:170,title:'nmap results',rows:PANEL,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'kali terminal'}],
 links:[H.lk('you','fw','gold'),H.lk('fw','h5','green'),H.lk('h5','p21','teal',{dash:true})],
 controls:{title:'Scan 10.10.10.0/24',groups:[{items:[
  {label:'nmap -sn',wide:true,click:function(S,A){S.disc=true;A.hud({scan:{v:'ping sweep',lv:'none'}});A.send(['you','fw','h5'],{label:'ping',tone:'green',ok:true});A.term('term',['$ sudo nmap -sn 10.10.10.0/24','Nmap scan report for 10.10.10.1','Nmap scan report for 10.10.10.5','Nmap scan report for 10.10.10.9','Nmap done: 256 IP addresses (3 hosts up)']);upd(S,A)}},
  {label:'nmap -sS',wide:true,click:function(S,A){A.hud({scan:{v:'SYN',lv:'none'}});if(!S.disc){A.term('term',['$ sudo nmap -sS ?','! which host? run a ping sweep first']);return}
   S.ports=true;A.send(['you','fw','h5'],{label:'SYN',tone:'gold',ok:true});A.send(['you','fw'],{label:'3306',tone:'red',ok:false,denyAt:'fw'});A.term('term',['$ sudo nmap -sS 10.10.10.5','PORT     STATE    SERVICE','21/tcp   open     ftp','22/tcp   open     ssh','80/tcp   open     http','3306/tcp filtered mysql']);upd(S,A)}},
  {label:'nmap -sV',wide:true,click:function(S,A){A.hud({scan:{v:'versions',lv:'none'}});if(!S.ports){A.term('term',['$ sudo nmap -sV ?','! which ports? run a port scan first']);return}
   S.ver=true;A.send(['you','fw','h5'],{label:'probe',tone:'blue',ok:true});A.fx('p21','no');A.term('term',['$ sudo nmap -sV -p 21,22,80 10.10.10.5','PORT   STATE SERVICE VERSION','21/tcp open  ftp     vsftpd 2.3.4','22/tcp open  ssh     OpenSSH 8.9p1','80/tcp open  http    Apache httpd 2.4.52']);upd(S,A)}},
  {label:'Reset',wide:true,click:function(S,A){S.disc=S.ports=S.ver=false;A.hud({scan:{v:'—',lv:'none'}});A.term('term',['$ # scan 10.10.10.0/24'],true);upd(S,A)}}]}]},
 goal:function(S){var ok=S.ver;return [ok,ok?'Done. Sweep, port scan, version scan: vsftpd 2.3.4 is a famous backdoored release. That is the top finding for the report.':'Goal: find the riskiest service on the network. Sweep for hosts, scan the target\'s ports, then ask the open ports for their versions.']},
 learn:[['Know what scanning looks for',0],['Find live hosts with -sn',1],['Read open, closed and filtered',2],['TCP connect and UDP scans',3],['Detect versions with -sV',4],['OS detection and NSE scripts',5],['Timing and saving output',6]],
 steps:[
  {t:'What scanning answers',b:'Recon gave you targets. Scanning asks them directly: which hosts are up, which ports are open, what software and version is behind each port, and which OS runs it.',k:['idea','Key idea','Nmap is the standard tool. Every answer narrows down where an attacker would try to get in.'],pill:'setup',tt:'Scanning',focus:['you','fw','h5'],S:{disc:false,ports:false,ver:false},
   set:Object.assign(ports({}),hosts({}),{res:{rows:['Four questions, in order',{t:'1 which hosts are up?     -sn',tone:'violet'},{t:'2 which ports are open?   -sS',tone:'violet'},{t:'3 what software/version?  -sV',tone:'violet'},{t:'4 which OS?               -O',tone:'violet'},'','Only scan what the scope allows.'],hl:[]}}),
   hud:{scan:{v:'—',lv:'none'}},termClear:true,term:{term:['$ nmap --version','Nmap version 7.94 ( https://nmap.org )','$ # scope: 10.10.10.0/24']},
   fx:[{n:'h5',k:'pulse'}]},
  {t:'Host discovery: -sn',b:'A ping sweep checks which addresses answer, without scanning ports. On a local network Nmap uses ARP, which even host firewalls cannot hide from.',k:['tip','Remember','-sn = no port scan. Add -Pn later to skip discovery for hosts that block ping but are still up.'],pill:'idea',tt:'-sn',focus:['you','h1','h5','h9'],S:{disc:true,ports:false,ver:false},
   set:Object.assign(ports({}),hosts({disc:1}),{res:{rows:PANEL}}),hud:{scan:{v:'ping sweep',lv:'none'}},termClear:true,term:{term:['$ sudo nmap -sn 10.10.10.0/24','Nmap scan report for 10.10.10.1','Host is up (0.00041s latency).','Nmap scan report for 10.10.10.5','Nmap scan report for 10.10.10.9','Nmap done: 256 IP addresses (3 hosts up)']},
   flows:[{path:['you','fw','h5'],label:'ping',tone:'green'}],fx:[{n:'h1',k:'pulse'},{n:'h9',k:'pulse'}]},
  {t:'SYN scan and port states',b:'-sS sends a SYN to each port. SYN/ACK back means open, RST means closed, and silence means filtered: a firewall dropped it. Nmap never finishes the handshake, so it is fast.',k:['idea','Key idea','open = a program listens. closed = host reachable, nothing listens. filtered = something in between ate the packet.'],pill:'idea',tt:'-sS',focus:['you','fw','p21','p22','p80','p3306'],S:{disc:true,ports:true,ver:false},
   set:Object.assign(ports({ports:1}),hosts({disc:1}),{res:{rows:PANEL}}),hud:{scan:{v:'SYN',lv:'none'}},termClear:true,term:{term:['$ sudo nmap -sS 10.10.10.5','PORT     STATE    SERVICE','21/tcp   open     ftp','22/tcp   open     ssh','80/tcp   open     http','3306/tcp filtered mysql','Not shown: 996 closed tcp ports (reset)']},
   once:[{path:['you','fw','h5'],label:'SYN',tone:'gold'},{path:['h5','fw','you'],label:'SYN/ACK',tone:'green',delay:1100},{path:['you','fw'],label:'3306',tone:'red',ok:false,denyAt:'fw',delay:2200}]},
  {t:'Connect and UDP scans',b:'Without root, Nmap uses -sT: a full TCP handshake, slower and logged by the service. -sU scans UDP (DNS, SNMP), which is slow because closed ports often stay silent.',k:['problem','Watch out','Do not skip UDP. SNMP on 161 with the community string "public" leaks a lot.'],pill:'idea',tt:'-sT -sU',focus:['you','fw','h5'],S:{disc:true,ports:true,ver:false},
   set:Object.assign(ports({ports:1}),hosts({disc:1}),{res:{rows:['Scan types',{t:'-sS  SYN, half-open    needs root',tone:'green'},{t:'-sT  full connect      no root',tone:'amber'},{t:'-sU  UDP               slow',tone:'violet'},{t:'-p-  all 65535 ports',tone:'slate'},'','Default: top 1000 TCP ports.'],hl:[]}}),
   hud:{scan:{v:'UDP',lv:'none'}},termClear:true,term:{term:['$ nmap -sT -p 22 10.10.10.5','22/tcp open  ssh','$ sudo nmap -sU -p 53,161 10.10.10.5','PORT    STATE         SERVICE','53/udp  open|filtered domain','161/udp open          snmp']},
   flows:[{path:['you','fw','h5'],label:'UDP',tone:'violet'}]},
  {t:'Version detection: -sV',b:'An open port only says something listens. -sV talks to it and reads the banner and replies to name the exact software and version. Versions are what you look up for known CVEs.',k:['tip','Remember','searchsploit vsftpd 2.3.4 checks the local Exploit-DB copy. Old versions are the first thing in a report.'],pill:'idea',tt:'-sV',focus:['p21','p22','p80'],S:{disc:true,ports:true,ver:true},
   set:Object.assign(ports({ports:1,ver:1}),hosts({disc:1}),{res:{rows:PANEL}}),hud:{scan:{v:'versions',lv:'none'}},termClear:true,term:{term:['$ sudo nmap -sV -p 21,22,80 10.10.10.5','PORT   STATE SERVICE VERSION','21/tcp open  ftp     vsftpd 2.3.4','22/tcp open  ssh     OpenSSH 8.9p1','80/tcp open  http    Apache httpd 2.4.52']},
   once:[{path:['you','fw','h5'],label:'probe',tone:'blue'}],fx:[{n:'p21',k:'no'}]},
  {t:'OS detection and scripts',b:'-O guesses the operating system from how the TCP/IP stack answers. The Nmap Scripting Engine (NSE) runs small checks: page titles, SMB info, known vulnerabilities. -A turns on -O, -sV, -sC and traceroute.',k:['idea','Key idea','-sC runs the default safe scripts. --script vuln runs vulnerability checks: louder, use only in scope.'],pill:'idea',tt:'-O NSE',focus:['h5','p80'],S:{disc:true,ports:true,ver:true},
   set:Object.assign(ports({ports:1,ver:1}),hosts({disc:1}),{res:{rows:PANEL}}),hud:{scan:{v:'OS + NSE',lv:'none'}},termClear:true,term:{term:['$ sudo nmap -O 10.10.10.5','Running: Linux 4.X|5.X','OS details: Linux 4.15 - 5.8','$ nmap --script http-title -p80 10.10.10.5','|_http-title: Acme Intranet Login']},
   flows:[{path:['you','fw','h5'],label:'probe',tone:'blue'}]},
  {t:'Timing, noise and output',b:'-T0 to -T5 set the speed: slower is quieter, faster is noisier. -oA saves every format at once, so the results go straight into your notes and report.',k:['problem','Watch out','An IDS such as Snort or Suricata spots fast scans easily. Defenders: alert on one IP touching many ports.'],pill:'idea',tt:'Timing',focus:['you','fw'],S:{disc:true,ports:true,ver:true},
   set:Object.assign(ports({ports:1,ver:1}),hosts({disc:1}),{res:{rows:['Timing templates',{t:'-T0 -T1  paranoid, sneaky (IDS)',tone:'violet'},{t:'-T2      polite',tone:'violet'},{t:'-T3      normal (default)',tone:'green'},{t:'-T4 -T5  aggressive, insane',tone:'red'},'','-oA lab → lab.nmap .gnmap .xml'],hl:[]}}),
   hud:{scan:{v:'-T2 -oA',lv:'none'}},termClear:true,term:{term:['$ sudo nmap -sS -T2 -oA lab 10.10.10.0/24','$ ls lab.*','lab.gnmap  lab.nmap  lab.xml']},
   fx:[{n:'fw',k:'pulse'}]},
  {t:'Try it: find the riskiest service',b:'You are in scope for 10.10.10.0/24. Use the three scans in a sensible order and find the service that goes first in the report.',k:['tip','Challenge','Hosts first, then ports, then versions. Each step needs the answer from the one before.'],pill:'problem',tt:'Try it',S:{disc:false,ports:false,ver:false},goal:true,focus:['you','fw','h5','p21','p22','p80','p3306'],
   set:Object.assign(ports({}),hosts({}),{res:{rows:PANEL}}),hud:{scan:{v:'—',lv:'none'}},termClear:true,term:{term:['$ # scan 10.10.10.0/24']}},
  {t:'Recap',b:'-sn for hosts, -sS for ports, -sV for versions, -O and NSE for detail. Read the states: open, closed, filtered. Save everything with -oA.',k:['idea','Next up','Enumeration: pulling users, shares and service details out of the open ports you just found.'],pill:'recap',tt:'Recap',S:{disc:true,ports:true,ver:true},
   set:Object.assign(ports({ports:1,ver:1}),hosts({disc:1}),{res:{rows:PANEL}}),hud:{scan:{v:'—',lv:'none'}},termClear:true,term:{term:['$ nmap -sn · -sS · -sV · -O','$ nmap -sC · --script · -oA']}}
 ]});
})();
