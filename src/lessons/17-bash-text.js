(function(){
var P='2026-11-26T03:1';
var AUTH=[P+'0:02 srv sshd[801]: Accepted publickey for syam from 10.0.0.4 port 50122 ssh2',
 P+'2:01 srv sshd[812]: Failed password for root from 203.0.113.9 port 4122 ssh2',
 P+'2:04 srv sshd[812]: Failed password for root from 203.0.113.9 port 4130 ssh2',
 P+'3:00 srv CRON[900]: pam_unix(cron:session): session opened for user root',
 P+'3:20 srv sshd[817]: Failed password for invalid user admin from 198.51.100.7 port 4410 ssh2',
 P+'4:11 srv sudo: syam : TTY=pts/0 ; USER=root ; COMMAND=/usr/bin/apt update',
 P+'5:09 srv sshd[822]: Failed password for root from 203.0.113.9 port 4188 ssh2'];
var FAIL=[1,2,4,6];
var SSHD0=['# /etc/ssh/sshd_config','Port 22','PermitRootLogin yes','PasswordAuthentication yes','PubkeyAuthentication yes'];
var SSHD1=['# /etc/ssh/sshd_config','Port 22',{t:'PermitRootLogin no',tone:'green'},'PasswordAuthentication yes','PubkeyAuthentication yes','',{t:"$ sudo sed -i.bak 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config",tone:'gold'}];
var PASSWD=['root:x:0:0:root:/root:/bin/bash','daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin','www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin','syam:x:1000:1000:Syam:/home/syam:/bin/bash','deploy:x:1001:1001::/home/deploy:/bin/bash','','awk -F: \'$3 >= 1000 {print $1}\' /etc/passwd   →  syam, deploy'];
var RX=[{t:'^      start of line        ^PermitRootLogin',tone:'gold'},{t:'$      end of line          ssh2$',tone:'gold'},{t:'.      any one character    p.rt',tone:'gold'},{t:'*      0 or more of before  a*',tone:'gold'},{t:'[0-9]  one digit            [0-9]+  (with -E)',tone:'gold'},{t:'a|b    a or b               -E "yes|no"',tone:'gold'},'',"grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}' auth.log   # every IP"];
function hl(ids){return ids}
var TASKS=[{n:'find failures',best:'grep',why:'Show only the failed SSH logins in auth.log.'},{n:'disable root',best:'sed',why:'Change PermitRootLogin yes to no in sshd_config, in place.'},{n:'print IPs',best:'awk',why:'From the failed lines, print only the attacker IP.'}];
var MSG={
 0:{sed:['! sed edits text. To show matching lines,','! use the tool that searches.'],awk:["$ awk '/Failed password/' auth.log","# works, but grep is the simple tool","# for finding lines. Try grep."],cut:['! cut slices columns; it cannot','! choose which lines to keep.']},
 1:{grep:['! grep only finds the line,','! it does not change the file.'],awk:['! awk prints a changed copy, but','! cannot edit the file in place.'],cut:['! cut cannot replace text.']},
 2:{grep:["$ grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}'",'# works too, but awk reads the','# column directly. Try awk.'],sed:['! sed can, but the regex is long and','! fragile. A column tool is simpler.'],cut:["$ grep 'Failed' auth.log | cut -d' ' -f9",'203.0.113.9','203.0.113.9','! admin   <- not an IP!','203.0.113.9','! "invalid user" shifted the columns']}};
function view(S,A){if(S.task==0)A.set('view',{title:'/var/log/auth.log',rows:AUTH,hl:[]});else if(S.task==1)A.set('view',{title:'/etc/ssh/sshd_config',rows:SSHD0,hl:[2]});else if(S.task==2)A.set('view',{title:'grep "Failed password" auth.log',rows:FAIL.map(function(i){return AUTH[i]}),hl:[]});else A.set('view',{title:'done',rows:['Failed logins:','      3 203.0.113.9','      1 198.51.100.7','',{t:'PermitRootLogin no  ✓',tone:'green'}],hl:[1]})}
function pick(S,A,tool){if(S.task>=3){A.term('term',['# all three tasks done']);return}var t=TASKS[S.task];
 if(tool!=t.best){A.send([tool,'file'],{label:'?',tone:'red',ok:false});var m=MSG[S.task][tool];A.term('term',m);return}
 A.send([tool,'file','out'],{label:tool,tone:tool=='grep'?'blue':tool=='sed'?'amber':'violet',ok:true});
 if(S.task==0)A.term('term',['$ grep "Failed password" /var/log/auth.log','# 4 matching lines']),A.after(1200,function(){A.set('view',{title:'grep "Failed password" auth.log',rows:FAIL.map(function(i){return AUTH[i]}),hl:[0,1,2,3]})});
 if(S.task==1)A.term('term',['$ sudo sed -i.bak ...   # see the panel','$ grep ^PermitRootLogin sshd_config','PermitRootLogin no','$ sudo sshd -t && sudo systemctl reload ssh']),A.after(1200,function(){A.set('view',{title:'/etc/ssh/sshd_config',rows:SSHD1,hl:[2]})});
 if(S.task==2)A.term('term',['$ grep "Failed password" auth.log \\',"    | awk '{print $(NF-3)}' | sort | uniq -c",'      3 203.0.113.9','      1 198.51.100.7']);
 S.task++;A.after(2600,function(){view(S,A);A.refresh()})}
LESSON('bash','text',{
 title:'Text tools: grep, sed, awk',sub:'Find lines with grep, change text with sed, and work with columns using awk.',time:'15 min',level:'Intermediate',
 S:{task:0},
 legend:[['#3b82c4','grep: find'],['#e8a33a','sed: edit'],['#5a4aa8','awk: columns']],
 hud:[{id:'tk',l:'Task',v:function(S){return S.task>=3?'all done':(S.task+1)+'/3 '+TASKS[S.task].n},lv:function(S){return S.task>=3?'good':'none'}},{id:'f',l:'Failed logins',v:'4',lv:'warn'},{id:'ip',l:'Attackers',v:'2 IPs',lv:'warn'},{id:'rl',l:'Root login',v:function(S){return S.task>=2?'disabled':'allowed'},lv:function(S){return S.task>=2?'good':'bad'}}],
 nodes:[
  H.box('grep',62,26,'grep','blue',{center:true}),H.box('sed',190,26,'sed','amber',{center:true}),H.box('awk',318,26,'awk','violet',{center:true}),
  H.tile('cut',62,170,'cut','by position','slate',{w:118}),
  H.tile('file',190,176,'input file','auth.log','slate',{w:118}),
  H.tile('out',318,176,'output','stdout','green',{w:110}),
  {t:'term',id:'term',x:392,y:14,w:316,h:222,title:'terminal'},
  {t:'panel',id:'view',x:14,y:252,w:694,h:200,title:'/var/log/auth.log',rows:AUTH,fs:9.5}],
 links:[H.lk('grep','file','blue'),H.lk('sed','file','amber'),H.lk('awk','file','violet'),H.lk('cut','file','slate'),H.lk('file','out','green')],
 controls:{title:'Pick the right tool',groups:[{items:['grep','sed','awk','cut'].map(function(t){return {label:t,wide:true,click:function(S,A){pick(S,A,t)}}})}]},
 goal:function(S){if(S.task>=3)return [true,'Done. grep found the lines, sed edited the config in place, and awk pulled the IP column, even from the "invalid user" line.'];return [false,'Task '+(S.task+1)+' of 3: '+TASKS[S.task].why+' Which tool fits?']},
 learn:[['Know which tool does what',0],['Search with grep',1],['Read basic regex',2],['Edit text with sed',3],['Work with columns in awk',4],['Use cut, sort, uniq, jq',5],['Combine them in one line',6]],
 steps:[
  {t:'Three tools, three jobs',b:'grep finds the lines you care about. sed changes text: replace, delete, insert. awk treats each line as columns, so you can pick, compare and add them up.',k:['idea','Key idea','grep = search, sed = edit, awk = columns. Pick by the job, not by habit.'],pill:'setup',tt:'Tools',focus:['grep','sed','awk','file'],S:{task:0},
   set:{view:{title:'/var/log/auth.log',rows:AUTH,hl:[]}},termClear:true,term:{term:['$ wc -l /var/log/auth.log','7 /var/log/auth.log','$ # 7 lines: logins, cron, sudo']},
   once:[{path:['grep','file'],label:'find',tone:'blue'},{path:['sed','file'],label:'edit',tone:'amber',delay:700},{path:['awk','file'],label:'$1',tone:'violet',delay:1400}]},
  {t:'grep: find lines',b:'grep prints every line that matches a pattern. -i ignores case, -v inverts the match, -c counts, -n shows line numbers, -r searches a whole folder.',k:['tip','Remember','grep -rn "TODO" src/ finds every TODO in a project, with file names and line numbers.'],pill:'idea',tt:'grep',focus:['grep','file','out'],
   set:{view:{title:'grep "Failed password" /var/log/auth.log',rows:AUTH,hl:FAIL}},termClear:true,term:{term:['$ grep -c "Failed password" auth.log','4','$ grep -v sshd auth.log | wc -l','2','$ grep -n "invalid user" auth.log','5:...Failed password for invalid user admin']},
   once:[{path:['grep','file','out'],label:'grep',tone:'blue'}]},
  {t:'Regular expressions',b:'Patterns can describe text instead of spelling it out. ^ anchors the start of a line, $ the end, . is any character and [0-9]+ is one or more digits.',k:['problem','Watch out','Use grep -E (or egrep) for +, | and {n}. Plain grep treats them as normal characters.'],pill:'idea',tt:'Regex',focus:['grep','file'],
   set:{view:{title:'regex cheat sheet',rows:RX,hl:[0,1]}},termClear:true,term:{term:["$ grep -E '^PermitRootLogin (yes|no)' \\",'    /etc/ssh/sshd_config','PermitRootLogin yes',"$ grep -c '^#' /etc/ssh/sshd_config",'92']}},
  {t:'sed: edit text',b:"sed 's/old/new/' replaces the first match on each line; add g for every match. -i edits the file itself. sed '/^#/d' deletes comment lines.",k:['problem','Watch out','sed -i changes the file with no undo. Use -i.bak to keep a backup, and test without -i first.'],pill:'problem',tt:'sed',focus:['sed','file','out'],
   set:{view:{title:'/etc/ssh/sshd_config',rows:SSHD1,hl:[2]}},termClear:true,term:{term:["$ sed 's/yes/no/' sshd_config | head -3",'# preview only: the file is unchanged','$ # in place, with a backup: see panel',"$ sed -n '2,3p' sshd_config",'Port 22','PermitRootLogin no']},
   once:[{path:['sed','file','out'],label:'s///',tone:'amber'}]},
  {t:'awk: columns',b:'awk splits each line on spaces into $1, $2 and so on. $NF is the last field. -F: sets another separator. You can add conditions and totals.',k:['idea','Key idea',"In awk '$3 >= 1000 {print $1}', the part before { } is a condition: only matching lines run the action."],pill:'idea',tt:'awk',focus:['awk','file','out'],
   set:{view:{title:'/etc/passwd',rows:PASSWD,hl:[3,4,6]}},termClear:true,term:{term:["$ awk -F: '$3 >= 1000 {print $1}' /etc/passwd",'syam','deploy',"$ df -P | awk 'NR>1 {s+=$3} END {print s}'",'48213904']},
   once:[{path:['awk','file','out'],label:'$1',tone:'violet'}]},
  {t:'cut, sort, uniq and jq',b:'cut slices fixed columns, sort orders lines, uniq removes or counts repeats. For JSON from APIs, jq is the tool: it reads fields by name.',k:['tip','Remember',"curl -s api/status | jq -r '.version' prints one field from a JSON response. No regex needed."],pill:'idea',tt:'cut + jq',focus:['cut','file','out'],
   set:{view:{title:'/etc/passwd',rows:PASSWD,hl:[0,3,4]}},termClear:true,term:{term:['$ cut -d: -f1,7 /etc/passwd | head -2','root:/bin/bash','daemon:/usr/sbin/nologin',"$ echo '{\"version\":\"1.4.2\"}' | jq -r .version",'1.4.2']},
   once:[{path:['cut','file','out'],label:'-f1',tone:'slate'}]},
  {t:'Combine them',b:'The power is in the pipe. grep picks the failed logins, awk takes the IP, and sort | uniq -c counts attempts per attacker.',k:['problem','Watch out','Fixed columns break when a message changes shape. "invalid user admin" adds two words, so count from the end with $(NF-3).'],pill:'idea',tt:'Combine',focus:['grep','awk','file','out'],
   set:{view:{title:'grep "Failed password" auth.log',rows:FAIL.map(function(i){return AUTH[i]}),hl:[2]}},termClear:true,term:{term:['$ grep "Failed password" auth.log \\',"    | awk '{print $(NF-3)}' | sort | uniq -c",'      3 203.0.113.9','      1 198.51.100.7']},
   once:[{path:['grep','file'],label:'grep',tone:'blue'},{path:['awk','file','out'],label:'awk',tone:'violet',delay:1000}]},
  {t:'Try it: secure the server',b:'Three tasks, one at a time. For each one pick the tool that does the job most simply. The goal bar tells you the current task.',k:['tip','Challenge','For task 3, try cut first and look at the third result. Why does awk with $(NF-3) not break?'],pill:'problem',tt:'Try it',S:{task:0},goal:true,focus:null,
   set:{view:{title:'/var/log/auth.log',rows:AUTH,hl:[]}},termClear:true,term:{term:['$ # task 1: find the failed logins']}},
  {t:'Recap',b:'grep finds lines, sed edits text, awk works with columns, and pipes join them. Preview before you edit in place, and count columns from the end when lines vary.',k:['idea','Next up','Automation scripts: turn these one-liners into safe scripts that run on a schedule.'],pill:'recap',tt:'Recap',S:{task:3},
   set:{view:{title:'done',rows:['Failed logins:','      3 203.0.113.9','      1 198.51.100.7','',{t:'PermitRootLogin no  ✓',tone:'green'}],hl:[1]}},termClear:true,term:{term:['$ grep · sed -i.bak · awk · cut · jq']}}
 ]});
})();
