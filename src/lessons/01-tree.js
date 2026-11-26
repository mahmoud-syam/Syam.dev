LESSON('linux','tree',{
 title:'The filesystem tree',sub:'One root, no drive letters — where everything lives and how to point at it.',time:'10 min',level:'Beginner',
 S:{cwd:'/'},
 legend:[['#3b82c4','/etc config'],['#2f7d57','/home users'],['#e8834d','/var data'],['#5a4aa8','/usr programs'],['#2a9d8f','/dev devices']],
 hud:[{id:'pwd',l:'Current dir',v:'/',lv:'none'},{id:'depth',l:'Depth',v:'0',lv:'none'},{id:'kind',l:'Path type',v:'—',lv:'none'},{id:'cmd',l:'Command',v:'ls',lv:'none'}],
 nodes:[D('root',260,52,'/','slate'),D('etc',60,162,'/etc','blue'),D('home',160,162,'/home','green'),D('var',260,162,'/var','orange'),D('usr',360,162,'/usr','violet'),D('dev',460,162,'/dev','teal'),
  D('ssh',60,272,'ssh','blue'),D('syam',160,272,'syam','green'),D('log',260,272,'log','orange'),D('bin',360,272,'bin','violet'),D('sda',460,272,'sda','teal'),
  T('sshd_config',60,'sshd_config','text file','blue'),T('notes',160,'notes.txt','your file','green'),T('syslog',260,'syslog','system log','orange'),T('python3',360,'python3','program','violet'),
  {t:'term',id:'term',x:520,y:30,w:190,h:176,title:'terminal'},
  {t:'panel',id:'path',x:520,y:226,w:190,h:180,title:'PATH ANATOMY',rows:['Every path is a trail','through the tree.','','Pick a step to see it','broken into pieces.']}],
 links:[['root','etc'],['root','home'],['root','var'],['root','usr'],['root','dev'],['etc','ssh'],['home','syam'],['var','log'],['usr','bin'],['dev','sda'],['ssh','sshd_config'],['syam','notes'],['log','syslog'],['bin','python3']].map(function(p){return {id:p[0]+'_'+p[1],a:p[0],b:p[1],tone:'slate'}}),
 controls:{title:'Move around',groups:[{items:[btn('cd /','/'),btn('cd ~','~'),btn('cd ..','..')]},{items:[btn('cd /etc/ssh','/etc/ssh'),btn('cd /var/log','/var/log')]},{items:[btn('cd /usr/bin','/usr/bin'),btn('cd /dev','/dev')]}]},
 learn:[['See the single root /',0],['Know what lives in /etc, /home, /var',3],['Read an absolute path',6],['Use a relative path',7],['Navigate with cd',8]],
 steps:[
  {t:'One tree, one root',b:'Linux has a single tree. Its top is / (called root). There are no drive letters like C: or D: — every disk, device and program hangs off this one tree.',k:['idea','Key idea','Everything is a file or a directory, and every one of them lives under /.'],pill:'setup',tt:'Root',focus:['root','etc','home','var','usr','dev'],
   term:{term:['$ ls /','bin dev etc home usr var …']},hud:{pwd:{v:'/'},depth:{v:'0'},cmd:{v:'ls /'}},fx:[{n:'root',k:'pulse'}],
   once:['etc','home','var','usr','dev'].map(function(c){return {path:['root',c],label:'ls',tone:'blue'}})},
  {t:'/etc — configuration',b:'/etc holds settings, as plain text files. The SSH server’s settings live in /etc/ssh/sshd_config.',k:['tip','Rule of thumb','Edit the text file, then restart the service. That is how most Linux services are configured.'],pill:'idea',tt:'/etc',focus:['root','etc','ssh','sshd_config'],
   term:{term:['$ ls /etc/ssh','sshd_config','$ cd /etc/ssh','$ grep Root sshd_config','PermitRootLogin no']},hud:{depth:{v:'3'},kind:{v:'absolute'},cmd:{v:'grep'}},
   set:{path:{rows:['/etc/ssh/sshd_config','',{t:'/etc    settings',tone:'amber'},'  ssh   SSH server','    sshd_config','          the file'],hl:[]}},once:[{path:['root','etc','ssh','sshd_config'],label:'cfg',tone:'blue'}]},
  {t:'/home — your files',b:'Every user gets a home directory under /home. Yours is /home/syam. This is where your documents and scripts live.',k:['tip','Shortcut','~ means your home directory. cd ~ takes you straight to /home/syam.'],pill:'idea',tt:'/home',focus:['root','home','syam','notes'],
   term:{term:['$ ls /home/syam','notes.txt']},hud:{depth:{v:'3'},kind:{v:'absolute'},cmd:{v:'ls'}},
   set:{path:{rows:['/home/syam/notes.txt','',{t:'/home  all users',tone:'amber'},'  syam  your home','    notes.txt','          your file']}},once:[{path:['root','home','syam','notes'],label:'ls',tone:'blue'}]},
  {t:'/var — data that changes',b:'/var keeps data that grows while the system runs: logs, caches, mail queues. System logs are in /var/log (syslog on Ubuntu and Debian, messages on RHEL).',k:['problem','Watch out','A full disk under /var/log is a classic reason a server suddenly misbehaves. You will meet this in the troubleshooting lab.'],pill:'problem',tt:'/var',focus:['root','var','log','syslog'],
   term:{term:['$ tail -2 /var/log/syslog','10:01 sshd: key accepted','10:02 cron: job started']},hud:{depth:{v:'3'},kind:{v:'absolute'},cmd:{v:'tail'}},
   set:{path:{rows:['/var/log/syslog','',{t:'/var   changing data',tone:'amber'},'  log   all the logs','    syslog','          system log']}},once:[{path:['root','var','log','syslog'],label:'tail',tone:'amber'}]},
  {t:'/usr and bin — programs',b:'Programs live in bin directories. python3 is in /usr/bin. The shell finds it by searching the folders listed in your PATH.',k:['idea','Key idea','Type a command name and the shell walks the PATH folders until it finds a file with that name.'],pill:'idea',tt:'/usr',focus:['root','usr','bin','python3'],
   term:{term:['$ which python3','/usr/bin/python3']},hud:{depth:{v:'3'},kind:{v:'absolute'},cmd:{v:'which'}},
   set:{path:{rows:['/usr/bin/python3','',{t:'/usr   installed software',tone:'amber'},'  bin   programs','    python3','          the program']}},once:[{path:['root','usr','bin','python3'],label:'run',tone:'purple'}]},
  {t:'/dev — devices are files',b:'Even hardware shows up as files. Your first disk is /dev/sda (or /dev/vda or /dev/nvme0n1 on many cloud servers). The b at the start of the permissions means a block device.',k:['idea','Everything is a file','That is why the same tools (ls, cat, cp) work almost everywhere in Linux.'],pill:'idea',tt:'/dev',focus:['root','dev','sda'],
   term:{term:['$ ls -l /dev/sda','brw-rw---- 1 root disk sda']},hud:{depth:{v:'2'},kind:{v:'absolute'},cmd:{v:'ls -l'}},
   set:{path:{rows:['/dev/sda','',{t:'/dev   devices',tone:'amber'},'  sda   first disk','','b = block device']}},once:[{path:['root','dev','sda'],label:'ls',tone:'teal'}]},
  {t:'Absolute path',b:'An absolute path starts with / and spells out every step from the root. It works from anywhere.',k:['tip','Remember','/home/syam/notes.txt always means the same file, no matter where you are.'],pill:'tip',tt:'Absolute',focus:['root','home','syam','notes'],
   term:{term:['$ cat /home/syam/notes.txt','Meeting at 10:00']},hud:{pwd:{v:'/'},depth:{v:'3'},kind:{v:'absolute'},cmd:{v:'cat'}},
   set:{path:{rows:['/home/syam/notes.txt','','/          start at root','home       go into /home','syam       go into syam','notes.txt  open the file'],hl:[]}},
   once:[{path:['root','home','syam','notes'],label:'cat',tone:'blue',delay:200}],
   timed:[{at:500,set:{path:{hl:[2]}}},{at:1100,set:{path:{hl:[3]}}},{at:1700,set:{path:{hl:[4]}}},{at:2300,set:{path:{hl:[5]}}}]},
  {t:'Relative path',b:'A relative path starts from where you are now. Inside /home/syam, just notes.txt is enough, and .. means one level up.',k:['problem','Watch out','A relative path depends on your location. The same notes.txt can be a different file in another folder.'],pill:'problem',tt:'Relative',focus:['root','home','syam','notes'],
   term:{term:['$ cd /home/syam','$ cat notes.txt','Meeting at 10:00','$ cd ..','$ pwd','/home']},hud:{pwd:{v:'/home'},depth:{v:'1'},kind:{v:'relative'},cmd:{v:'cd ..'}},
   set:{path:{rows:['Now in: /home/syam','','notes.txt',' = ./notes.txt','','..  = parent folder','    → /home'],hl:[]}},
   once:[{path:['syam','notes'],label:'cat',tone:'blue',delay:200},{path:['syam','home'],label:'..',tone:'amber',delay:1500}]},
  {t:'Try it: move around',b:'Use the buttons to run cd commands. Watch the pointer travel the tree, and the current directory change.',k:['tip','Challenge','Try cd /var/log, then cd .. twice. Where do you end up?'],pill:'problem',tt:'Try it',termClear:true,
   S:{cwd:'/'},term:{term:['$ pwd','/']},hud:{pwd:{v:'/'},depth:{v:'0'},kind:{v:'—'},cmd:{v:'pwd'}},set:{path:{rows:pathRows('/'),hl:[]}}},
  {t:'Recap',b:'One tree from /. Settings in /etc, people in /home, changing data in /var, programs in /usr, devices in /dev. Absolute paths start with /, relative paths start where you are.',k:['idea','Next up','File permissions: who is allowed to read, write or run each of these files.'],pill:'recap',tt:'Recap',termClear:true,
   term:{term:['$ ls /','bin dev etc home usr var …']},hud:{pwd:{v:'/'},depth:{v:'0'},kind:{v:'—'},cmd:{v:'ls /'}},set:{path:{rows:['Settings   /etc','People     /home','Data       /var','Programs   /usr','Devices    /dev','','Absolute starts /'],hl:[]}}}
 ]});
})();

(function(){
var A=['read','write','run'],L=['r','w','x'],AC=['blue','amber','purple'],AUD=['Owner','Group','Everyone else'],PRE=[1,1,1,1,0,1,1,0,0];
function dig(S,g){return S.b[g*3]*4+S.b[g*3+1]*2+S.b[g*3+2]}
function bits(S,g){return [0,1,2].map(function(i){return S.b[g*3+i]?L[i]:'-'}).join('')}
function F(g,log){return [0,1,2].map(function(i){return {path:['c'+g,'file#'+g],label:L[i],tone:AC[i],ok:function(S){return S.b[g*3+i]},log:AUD[g]+' → '+A[i]}})}
function allF(){return F(0).concat(F(1),F(2))}
var chip=function(g){return {id:'h'+g,l:AUD[g],v:function(S){return dig(S,g)+'  '+bits(S,g)},lv:function(S){return g>0&&S.b[g*3+1]?'bad':dig(S,g)?'good':'none'}}};
