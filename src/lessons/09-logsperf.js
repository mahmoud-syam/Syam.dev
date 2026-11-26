(function(){
function mem(S){return S.leak?97:41}
function cpu(S){return S.leak?38:12}
var LOG0=['14:02 api[311]: request took 4200ms','14:02 api[311]: request took 5100ms','14:03 kernel: swap usage high','14:03 api[311]: upstream timeout','14:04 systemd: api.service watchdog warn'];
var LOGOK=['14:20 api[311]: request took 95ms','14:20 api[311]: request took 110ms','14:21 api[311]: request took 98ms','','# healthy again'];
var LROT=['/etc/logrotate.d/app','/var/log/app/*.log {','  weekly','  rotate 4','  compress','  missingok','}'];
var PSR=['ps aux --sort=-%mem','COMMAND         %MEM   PID',{t:'python3 report.py  71.2  7781',tone:'red'},'api (gunicorn)    6.1   311','nginx             0.4   530','mysqld            12.0   402'];
function top(S,A){A.term('term',S.leak?['$ ps aux --sort=-%mem | head -3','USER  PID %CPU %MEM COMMAND','syam 7781 35.0 71.2 python3 report.py','svc   311  2.0  6.1 gunicorn api']:['$ ps aux --sort=-%mem | head -3','USER  PID %CPU %MEM COMMAND','svc   311  2.0  6.1 gunicorn api','mysql 402  1.5 12.0 mysqld'])}
function kill(S,A){if(!S.leak){A.term('term',['! report.py is already gone']);return}S.leak=false;A.send(['job','mem'],{label:'KILL',tone:'red',ok:true});A.term('term',['$ kill 7781','$ free -h | grep Mem','Mem: 8.0Gi 3.3Gi 4.1Gi avail 4.5Gi']);A.set('job',{status:'dead'});A.set('logs',{rows:LOGOK,title:'/var/log/syslog'});A.hud({rt:{v:'95 ms',lv:'good'}})}
LESSON('linux','logsperf',{
 title:'Logs & performance',sub:'Read what the system tells you, then find the resource that is slowing it down.',time:'15 min',level:'Intermediate',
 S:{leak:true},
 legend:[['#3fa456','normal'],['#e8a33a','high'],['#e5534b','exhausted']],
 hud:[{id:'cpu',l:'CPU',v:function(S){return cpu(S)+'%'},lv:'good'},{id:'mem',l:'Memory',v:function(S){return mem(S)+'%'},lv:function(S){return S.leak?'bad':'good'}},{id:'swp',l:'Swap',v:function(S){return S.leak?'1.9G used':'0 used'},lv:function(S){return S.leak?'warn':'good'}},{id:'rt',l:'Response',v:function(S){return S.leak?'4200 ms':'95 ms'},lv:function(S){return S.leak?'bad':'good'}}],
 nodes:[
  H.box('cpu',64,30,'CPU','slate',{center:true,led:true,sub:function(S){return cpu(S)+'%'}}),
  H.box('mem',188,30,'Memory','amber',{center:true,led:true,sub:function(S){return mem(S)+'%'}}),
  H.box('dsk',312,30,'Disk','blue',{center:true,led:true,sub:function(){return '61%'}}),
  H.tile('api',78,228,'api','gunicorn · 311','green',{w:110,status:'run'}),
  H.tile('job',226,228,'report.py','PID 7781','red',{w:116,status:'run'}),
  {t:'crowd',id:'users',x:70,y:350,tone:'gold',label:'users',n:3,w:60,anchor:[132,350]},
  {t:'panel',id:'logs',x:392,y:14,w:316,h:170,title:'/var/log/syslog',rows:LOG0,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('users','api','gold'),H.lk('job','mem','red',{dash:true}),H.lk('api','mem','slate',{dash:true})],
 controls:{title:'Investigate the slow server',groups:[{items:[
  {label:'journalctl -p err',wide:true,click:function(S,A){A.term('term',S.leak?['$ journalctl -p err -n 3','api: upstream timeout','kernel: swap usage high']:['$ journalctl -p err -n 3','-- No entries --'])}},
  {label:'free -h',wide:true,click:function(S,A){A.fx('mem',S.leak?'no':'ok');A.term('term',S.leak?['$ free -h','       total used free avail','Mem:   8.0Gi 7.6Gi 120Mi 210Mi','Swap:  2.0Gi 1.9Gi']:['$ free -h','       total used free avail','Mem:   8.0Gi 3.3Gi 4.1Gi 4.5Gi','Swap:  2.0Gi 0B'])}},
  {label:'top (by memory)',wide:true,click:function(S,A){top(S,A);if(S.leak)A.fx('job','no')}},
  {label:'df -h',wide:true,click:function(S,A){A.fx('dsk','ok');A.term('term',['$ df -h /','/dev/sda1 40G 24G 61%','# disk is fine'])}},
  {label:'kill 7781',wide:true,on:function(S){return !S.leak},click:function(S,A){kill(S,A)}}]}]},
 goal:function(S){var ok=!S.leak;return [ok,ok?'Done. You found the memory hog and stopped it. Response time is back to normal.':'Goal: the API is slow. Check CPU, memory and disk to find which resource is exhausted, then stop the process responsible.']},
 learn:[['Know where logs live',0],['Read logs with journalctl',1],['Understand log rotation',2],['Check CPU, memory, disk',3],['Read free correctly',4],['Find the culprit process',5]],
 steps:[
  {t:'Where logs live',b:'Services write logs to /var/log files or to the systemd journal. When something breaks, the log is the first place to look.',k:['idea','Key idea','Logs say what happened and when. The metrics say how bad it is.'],pill:'setup',tt:'Logs',focus:['logs','api'],S:{leak:true},
   set:{logs:{rows:LOG0,title:'/var/log/syslog',hl:[3]},job:{status:'run',show:true}},hud:{rt:{v:'4200 ms',lv:'bad'}},termClear:true,term:{term:['$ ls /var/log','auth.log  syslog  nginx/  app/','$ tail -n 2 /var/log/syslog','api: upstream timeout','systemd: api.service watchdog warn']}},
  {t:'journalctl and tail',b:'journalctl reads the systemd journal. Filter by unit with -u, by time with --since, and follow live with -f. tail -f does the same for a plain file.',k:['tip','Remember','journalctl -u app -f is the one to learn first. Add -p err to show only errors.'],pill:'idea',tt:'Read logs',focus:['logs','api'],S:{leak:true},
   set:{logs:{rows:LOG0,hl:[0,1]}},termClear:true,term:{term:['$ journalctl -u api --since "10 min ago"','request took 4200ms','request took 5100ms','$ journalctl -u api -f','# follows new lines live','$ grep -i error /var/log/syslog | tail -2']},
   once:[{path:['users','api'],label:'req',tone:'gold',ok:false,denyAt:'api'}]},
  {t:'Rotation: logs must not fill the disk',b:'Logs grow forever unless you rotate them. logrotate renames old logs, compresses them and deletes the oldest on a schedule.',k:['problem','Watch out','Unrotated logs are one of the most common reasons a server runs out of disk.'],pill:'problem',tt:'Rotation',focus:['logs','dsk'],S:{leak:true},
   set:{logs:{title:'/etc/logrotate.d/app',rows:LROT,hl:[2,3,4]}},termClear:true,term:{term:['$ ls /var/log/app','app.log  app.log.1  app.log.2.gz','$ sudo logrotate -d /etc/logrotate.d/app','# -d = dry run, shows the plan']},
   fx:[{n:'dsk',k:'pulse'}]},
  {t:'Performance: three resources',b:'A slow server is short of CPU, memory or disk. Check all three. For each one ask: how busy is it, is work queueing, and are there errors?',k:['idea','Key idea','Load average above the number of CPU cores means work is waiting for a CPU.'],pill:'idea',tt:'Resources',focus:['cpu','mem','dsk'],S:{leak:true},
   set:{logs:{title:'/var/log/syslog',rows:LOG0,hl:[]}},termClear:true,term:{term:['$ nproc','4','$ uptime','load average: 0.9, 1.1, 1.0','# load 1.0 on 4 cores = fine','$ df -h / | tail -1','61% used']},
   fx:[{n:'cpu',k:'ok'},{n:'dsk',k:'ok'}]},
  {t:'Memory: read free correctly',b:'Linux uses spare memory as cache, so a small free value is normal. Look at available instead. When available is tiny, the system starts using swap and slows down.',k:['problem','Watch out','Heavy swap use is the symptom of a memory problem, not the cause. Find who is using the memory.'],pill:'problem',tt:'Memory',focus:['mem','job'],S:{leak:true},
   set:{logs:{rows:LOG0,hl:[2]}},termClear:true,term:{term:['$ free -h','       total used free avail','Mem:   8.0Gi 7.6Gi 120Mi 210Mi','Swap:  2.0Gi 1.9Gi','$ dmesg | grep -i "out of memory"','# the OOM killer is next']},
   fx:[{n:'mem',k:'no'}]},
  {t:'Find the culprit',b:'Sort processes by memory. One process uses 71% of RAM: report.py, a script that never frees what it reads.',k:['idea','Key idea','Fix the cause, not the symptom. Adding swap would only hide this leak for a while.'],pill:'idea',tt:'Culprit',focus:['job','mem','logs'],S:{leak:true},
   set:{logs:{title:'processes by memory',rows:PSR,hl:[2]}},termClear:true,term:{term:['$ ps aux --sort=-%mem | head -3','USER  PID %CPU %MEM COMMAND','syam 7781 35.0 71.2 python3 report.py']},
   once:[{path:['job','mem'],label:'RAM',tone:'red'}],fx:[{n:'job',k:'no'}]},
  {t:'Fix it and verify',b:'Stop the process, then confirm with the same tools: memory is back, swap is empty and response time is normal.',k:['tip','Remember','Always re-run the check that found the problem. The fix is only proven when it shows green.'],pill:'idea',tt:'Verify',focus:['job','mem','api','users'],S:{leak:false},
   set:{job:{status:'dead'},logs:{title:'/var/log/syslog',rows:LOGOK,hl:[]}},hud:{rt:{v:'95 ms',lv:'good'}},termClear:true,term:{term:['$ kill 7781','$ free -h | grep -E "Mem|Swap"','Mem:  8.0Gi 3.3Gi 4.1Gi avail 4.5Gi','Swap: 2.0Gi 0B']},
   once:[{path:['job','mem'],label:'KILL',tone:'red'},{path:['users','api'],label:'req',tone:'gold',delay:1200}]},
  {t:'Try it: slow server',b:'Users complain that everything is slow. Use the buttons to check each resource, find the cause and stop it.',k:['tip','Challenge','CPU and disk look fine. Which resource is not? Then who is using it?'],pill:'problem',tt:'Try it',S:{leak:true},goal:true,focus:['cpu','mem','dsk','job'],
   set:{job:{status:'run',show:true},logs:{title:'/var/log/syslog',rows:LOG0,hl:[]}},hud:{rt:{v:'4200 ms',lv:'bad'}},termClear:true,term:{term:['$ # server is slow, find out why']}},
  {t:'Recap',b:'Read the logs for what happened. Check CPU, memory and disk for how bad. Find the process, fix the cause, then verify.',k:['idea','Next up','Troubleshooting lab: fix the nine classic Linux failures, evidence first.'],pill:'recap',tt:'Recap',S:{leak:false},
   set:{job:{status:'dead'},logs:{title:'/var/log/syslog',rows:LOGOK,hl:[]}},hud:{rt:{v:'95 ms',lv:'good'}},termClear:true,term:{term:['$ journalctl · free · top · df']}}
 ]});
})();
