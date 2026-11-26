(function(){
var G=[['stamp','date stamp'],['retain','retention 7d'],['lock','flock'],['strict','set -euo pipefail'],['alert','alert on fail'],['log','log file']];
var RES={stamp:['30 dated backups: restore any day','one file overwritten nightly: no history'],retain:['NAS steady at 35%: only 7 kept','NAS 100% full on day 23: backups fail'],lock:['night 5 slow run: 2nd run skipped','night 5: two runs wrote one file: corrupt'],
 strict:['night 12 NAS offline: script stopped','night 12: tar failed, script said OK'],alert:['night 12: on-call got a message','night 12 failure unnoticed for 9 days'],log:['backup.log shows every run','no log: nothing to investigate']};
function n(S){return G.filter(function(g){return S[g[0]]}).length}
var CODE=[function(){return {t:'#!/usr/bin/env bash',tone:'gold'}},function(S){return S.strict?{t:'set -euo pipefail',tone:'green'}:{t:'# no safety flags',tone:'red'}},
 function(S){return S.lock?{t:'exec 9>/run/backup.lock; flock -n 9 || exit 1',tone:'green'}:''},function(S){return S.log?{t:'exec >>/var/log/backup.log 2>&1',tone:'green'}:''},
 function(S){return S.alert?{t:"trap 'notify \"backup FAILED on $HOSTNAME\"' ERR",tone:'green'}:''},
 function(S){return S.strict?{t:'mountpoint -q /mnt/nas   # stop if not mounted',tone:'green'}:''},
 function(S){return S.stamp?{t:'f=/mnt/nas/www-$(date +%F).tar.gz',tone:'green'}:{t:'f=/mnt/nas/www.tar.gz',tone:'red'}},'tar czf "$f" /var/www',
 function(S){return S.retain?{t:'find /mnt/nas -name "www-*" -mtime +7 -delete',tone:'green'}:''},'echo "$(date +%F) backup OK"'];
function code(S){return CODE.map(function(f){return typeof f=='function'?f(S):f}).filter(function(x){return x!==''})}
var CODEV=[0,1,2,3,4,5,6,7,8,9].map(function(i){return function(S){return code(S)[i]||''}});
var CRON=['# crontab -e   (as root)','# m h dom mon dow  command',{t:'0 2 * * *  /opt/backup.sh',tone:'gold'},{t:'*/5 * * * *  /opt/health.sh',tone:'gold'},'','health.sh checks every 5 minutes:','  curl -fsS http://localhost/health','  systemctl is-active nginx','  df / below 85%'];
var TRUST=['A script you can trust:',{t:'✓ safe to run twice (idempotent)',tone:'green'},{t:'✓ --dry-run prints, changes nothing',tone:'green'},{t:'✓ shellcheck clean',tone:'green'},{t:'✓ logs and exit codes',tone:'green'},{t:'✓ restore tested every month',tone:'green'},'','A backup never restored is a hope,','not a backup.'];
function sim(S,A){var _id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===_id)fn()})}S.sim=true;var bad=G.filter(function(g){return !S[g[0]]});A.set('nas',{});
 for(var i=0;i<4;i++)(function(i){L(i*650,function(){A.send(['cron','script','data'],{label:'02:00',tone:'blue',ok:true})});L(i*650+350,function(){A.send(['script','nas'],{label:'tar',tone:'green',ok:true})})})(i);
 L(2900,function(){A.send(['script','nas'],{label:'✕',tone:'red',ok:false});if(S.alert)A.send(['script','oncall'],{label:'!',tone:'red',ok:true})});
 L(3800,function(){S.ran=true;var L=['$ # simulating 30 nights ...'];G.forEach(function(g){var ok=!!S[g[0]];L.push((ok?'✓ ':'! ')+RES[g[0]][ok?0:1])});A.term('term',L,true);
  A.hud({res:{v:bad.length?bad.length+' problems':'all good',lv:bad.length?'bad':'good'}});A.set('nas',{});A.set('log',{show:!!S.log});A.refresh()})}
LESSON('bash','scripts',{
 title:'Automation scripts',sub:'Turn one-liners into a nightly backup you can trust: dated, rotated, locked, logged and loud on failure.',time:'16 min',level:'Intermediate',
 S:{stamp:false,retain:false,lock:false,strict:false,alert:false,log:false,sim:false,ran:false},
 legend:[['#3b82c4','nightly run'],['#3fa456','backup written'],['#e5534b','failure']],
 hud:[{id:'sg',l:'Safeguards',v:function(S){return n(S)+' / 6'},lv:function(S){return n(S)==6?'good':'warn'}},{id:'nas',l:'NAS after 30 days',v:function(S){return !S.ran?'—':S.retain?'35%':'100%'},lv:function(S){return !S.ran?'none':S.retain?'good':'bad'}},{id:'res',l:'Simulation',v:'not run',lv:'none'},{id:'cr',l:'Schedule',v:'02:00 daily',lv:'none'}],
 nodes:[
  H.tile('cron',62,46,'cron','0 2 * * *','slate',{w:110}),
  H.box('script',190,34,'backup.sh','green',{center:true}),
  H.tile('data',318,46,'/var/www','source','blue',{w:110}),
  H.box('nas',318,186,'backup NAS','amber',{center:true,sub:function(S){return !S.ran?'':S.retain?'35% used':'100% FULL'}}),
  H.tile('log',176,226,'backup.log','every run','violet',{w:118,show:false}),
  {t:'crowd',id:'oncall',x:72,y:336,tone:'red',label:'on-call',n:1,w:50,anchor:[124,336]},
  {t:'panel',id:'code',x:392,y:14,w:316,h:214,title:'/opt/backup.sh',rows:CODEV,fs:9.5},
  {t:'term',id:'term',x:392,y:240,w:316,h:210,title:'terminal'}],
 links:[H.lk('cron','script','slate'),H.lk('script','data','blue'),H.lk('script','nas','green'),H.lk('script','log','violet'),H.lk('script','oncall','red',{dash:true,on:function(S){return S.alert}})],
 controls:{title:'Harden backup.sh',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;A.hud({res:{v:'not run',lv:'none'}});A.set('code',{});A.set('log',{show:!!S.log});A.fx('script',S[g[0]]?'ok':'pulse')}}}).concat([{label:'simulate 30 nights',wide:true,click:function(S,A){sim(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&n(S)==6;return [ok,ok?'Done. 30 nights, a slow run, a dead NAS and a full disk, and the script handled all of it. That is automation you can sleep on.':S.ran?'The month had problems: read the ✗ lines, add the safeguard that prevents each one, then simulate again.':'Goal: add safeguards to backup.sh, then simulate a month of nights. Run it bare first to see what goes wrong.']},
 learn:[['Choose what to automate',0],['Write a backup script',1],['Rotate old backups',2],['Fail loudly',3],['Log and lock',4],['Schedule and health-check',5],['Make scripts trustworthy',6]],
 steps:[
  {t:'What to automate',b:'Automate work that is repeated, easy to get wrong, or must happen while you sleep: backups, cleanups, health checks, user creation. The script does it the same way every time.',k:['idea','Key idea','If you did it twice by hand, script it. The third time, it is already done.'],pill:'setup',tt:'Why',focus:['cron','script'],S:{stamp:false,retain:false,lock:false,strict:false,alert:false,log:false,sim:false,ran:false},
   set:{log:{show:false},code:{title:'/opt/backup.sh',rows:CODEV,hl:[]}},hud:{res:{v:'not run',lv:'none'}},termClear:true,term:{term:['$ ls /opt/toolkit','backup.sh  cleanup.sh  health.sh','disk_check.sh  new_user.sh']},
   flows:[{path:['cron','script'],label:'02:00',tone:'slate'}]},
  {t:'A backup script',b:'tar czf packs a folder into one compressed file. Putting the date in the file name keeps one backup per day instead of overwriting yesterday.',k:['tip','Remember','tar tzf file lists what is inside an archive. Check a backup without restoring it.'],pill:'idea',tt:'Backup',focus:['script','data','nas'],S:{stamp:true},
   set:{code:{rows:CODEV,hl:[2,3]}},termClear:true,term:{term:['$ f=www-$(date +%F).tar.gz','$ tar czf "/mnt/nas/$f" /var/www','$ tar tzf "/mnt/nas/$f" | head -2','var/www/','var/www/index.html']},
   once:[{path:['script','data'],label:'read',tone:'blue'},{path:['script','nas'],label:'tar',tone:'green',delay:900}]},
  {t:'Retention: delete old backups',b:'Without cleanup, backups grow until the disk is full and the next backup fails. find -mtime +7 -delete removes files older than seven days.',k:['problem','Watch out','Run the find with -print first and read the list. Only then change it to -delete.'],pill:'problem',tt:'Retention',focus:['script','nas'],S:{retain:true},
   set:{code:{rows:CODEV,hl:[4]}},termClear:true,term:{term:['$ find /mnt/nas -name "www-*" -mtime +7 -print','/mnt/nas/www-2026-11-12.tar.gz','/mnt/nas/www-2026-11-13.tar.gz','$ # list looks right → use -delete']},
   fx:[{n:'nas',k:'ok'}]},
  {t:'Fail loudly',b:'set -euo pipefail stops the script at the first failing command, and trap ... ERR sends an alert when it does. mountpoint catches the sneaky case: an unmounted NAS is just an empty folder, and tar would fill the local disk.',k:['idea','Key idea','notify is your own small function: a curl to a Slack or Telegram webhook, or an email. The trap calls it.'],pill:'idea',tt:'Fail loud',focus:['script','oncall','nas'],S:{strict:true,alert:true},
   set:{code:{rows:CODEV,hl:[1,2,3]}},termClear:true,term:{term:['$ sudo umount /mnt/nas; ./backup.sh','$ echo $?','1','# mountpoint failed → set -e stopped it','# ERR trap ran: notify "backup FAILED"']},
   once:[{path:['script','nas'],label:'✕',tone:'red',ok:false},{path:['script','oncall'],label:'!',tone:'red',delay:1100}]},
  {t:'Logs and locks',b:'exec >> logfile 2>&1 sends everything the script prints into a log. flock makes sure only one copy runs: if last night is still running, tonight skips.',k:['tip','Remember','Two copies writing the same file at once is how backups get corrupted. flock costs one line.'],pill:'idea',tt:'Log + lock',focus:['script','log'],S:{lock:true,log:true},
   set:{log:{show:true},code:{rows:CODEV,hl:[2,3]}},termClear:true,term:{term:['$ tail -2 /var/log/backup.log','2026-11-25 backup OK','2026-11-26 backup OK','$ ./backup.sh & ./backup.sh','# second copy: flock busy, exit 1']},
   once:[{path:['script','log'],label:'log',tone:'violet'}]},
  {t:'Schedule and health checks',b:'cron runs the backup at 02:00 every night. The same idea powers a health check that runs every five minutes and alerts when the site, a service or the disk looks wrong.',k:['problem','Watch out','cron has a minimal PATH and no terminal. Use full paths in scripts, and always log the output.'],pill:'idea',tt:'cron',focus:['cron','script','oncall'],S:{},
   set:{code:{title:'crontab -l',rows:CRON,hl:[2,3]}},termClear:true,term:{term:['$ /opt/health.sh; echo $?','✓ http 200  ✓ nginx active  ✓ disk 61%','0']},
   flows:[{path:['cron','script'],label:'02:00',tone:'slate'},{path:['cron','script'],label:'*/5',tone:'blue'}]},
  {t:'Make it trustworthy',b:'A good script is safe to run twice, can show what it would do without doing it, passes shellcheck, and reports through logs and exit codes. And you test the restore.',k:['problem','Watch out','A backup you have never restored is a hope, not a backup. Schedule a restore test.'],pill:'problem',tt:'Trust',focus:['script','nas'],S:{},
   set:{code:{title:'checklist',rows:TRUST,hl:[5]}},termClear:true,term:{term:['$ ./backup.sh --dry-run','would write /mnt/nas/www-2026-11-26.tar.gz','would delete 1 file older than 7 days','$ shellcheck backup.sh']}},
  {t:'Try it: a month of nights',b:'Turn safeguards on or off, then simulate 30 nights. The month includes a slow night, a NAS that goes offline and a filling disk.',k:['tip','Challenge','Simulate with no safeguards first and read every failure. Then fix them one by one.'],pill:'problem',tt:'Try it',S:{stamp:false,retain:false,lock:false,strict:false,alert:false,log:false,sim:false,ran:false},goal:true,focus:null,
   set:{log:{show:false},code:{title:'/opt/backup.sh',rows:CODEV,hl:[]}},hud:{res:{v:'not run',lv:'none'}},termClear:true,term:{term:['$ cat /opt/backup.sh   # bare version']}},
  {t:'Recap',b:'Date-stamp backups, rotate them, lock against overlap, stop and alert on errors, log every run, schedule with cron, and test the restore.',k:['idea','Next up','Python for DevOps: when a task outgrows Bash.'],pill:'recap',tt:'Recap',S:{stamp:true,retain:true,lock:true,strict:true,alert:true,log:true,sim:true,ran:true},
   set:{log:{show:true},code:{title:'/opt/backup.sh',rows:CODEV,hl:[]}},hud:{res:{v:'all good',lv:'good'}},termClear:true,term:{term:['# stamp · retain · lock · strict · alert · log']}}
 ]});
})();
