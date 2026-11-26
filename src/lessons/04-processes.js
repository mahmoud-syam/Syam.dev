LESSON('linux','processes',{
 title:'Processes & signals',sub:'A running program, its family tree, and how to ask it to stop.',time:'12 min',level:'Beginner',
 S:{st:'run',hog:false},
 legend:[['#3fa456','running'],['#3b82c4','sleeping'],['#e8a33a','stopped'],['#e5534b','dead / killed']],
 hud:[{id:'n',l:'Processes',v:'6',lv:'none'},{id:'cpu',l:'CPU',v:function(S){return cpu(S)},lv:function(S){return S.hog&&S.st=='run'?'bad':'good'}},{id:'sel',l:'Selected',v:'—',lv:'none'},{id:'sig',l:'Last signal',v:'—',lv:'none'}],
 nodes:[
  P('systemd',250,44,'systemd','PID 1','slate','sleep'),
  P('sshd',90,130,'sshd','PID 412','blue','sleep'),P('nginx',250,130,'nginx','PID 530','green','sleep'),P('cron',410,130,'cron','PID 611','amber','sleep'),
  P('bash',90,216,'bash','PID 2101','violet','sleep'),P('worker',250,216,'worker','nginx · PID 531','green','sleep'),
  P('sleepp',70,302,'sleep 300','PID 3355','slate','sleep',{show:false}),P('backup',200,302,'backup.sh','PID 4120','red','run',{show:false}),
  {t:'box',id:'cpu',x:618,y:40,w:40,h:18,d:40,tone:'slate',label:'CPU',led:true,nobob:true,sub:function(S){return cpu(S)+' busy'}},
  {t:'crowd',id:'you',x:560,y:226,tone:'gold',label:'you',n:1,w:56,anchor:[500,226]},
  {t:'term',id:'term',x:384,y:298,w:324,h:154,title:'terminal'}
 ],
 links:[['systemd','sshd'],['systemd','nginx'],['systemd','cron'],['sshd','bash'],['nginx','worker'],['bash','sleepp'],['bash','backup']].map(function(p){return {id:p[0]+'_'+p[1],a:p[0],b:p[1],tone:'slate'}}),
 controls:{title:'Signal the runaway',groups:[{items:[
  {label:'kill -15 TERM',wide:true,click:function(S,A){A.send(['you','backup'],{label:'TERM',tone:'amber',ok:false,log:'TERM → backup.sh (ignored)'});A.term('term',['$ kill 4120','$ ps -o stat= -p 4120','R']);A.hud({sig:{v:'SIGTERM (15)'},sel:{v:'backup.sh'}})}},
  {label:'kill -19 STOP',wide:true,click:function(S,A){if(S.st=='dead')return;S.st='stop';A.send(['you','backup'],{label:'STOP',tone:'amber',ok:true});A.after(900,function(){A.set('backup',{status:'stop'});A.refresh()});A.term('term',['$ kill -19 4120','$ ps -o stat= -p 4120','T']);A.hud({sig:{v:'SIGSTOP (19)'},sel:{v:'backup.sh'}})}},
  {label:'kill -18 CONT',wide:true,click:function(S,A){if(S.st!='stop')return;S.st='run';A.send(['you','backup'],{label:'CONT',tone:'green',ok:true});A.after(900,function(){A.set('backup',{status:'run'});A.refresh()});A.term('term',['$ kill -18 4120','$ ps -o stat= -p 4120','R']);A.hud({sig:{v:'SIGCONT (18)'},sel:{v:'backup.sh'}})}},
  {label:'kill -9 KILL',wide:true,click:function(S,A){if(S.st=='dead')return;S.st='dead';A.send(['you','backup'],{label:'KILL',tone:'red',ok:true});A.after(900,function(){A.set('backup',{status:'dead'});A.refresh()});A.term('term',['$ kill -9 4120','$ ps -p 4120','  PID TTY    TIME CMD']);A.hud({sig:{v:'SIGKILL (9)'},sel:{v:'backup.sh'},n:{v:'6'}})}}]}]},
 goal:function(S){var ok=S.st!='run';return [ok,ok?(S.st=='dead'?'Done. KILL ended the process — it cannot ignore that signal.':'Done. STOP paused it: CPU is free, and CONT can resume it.'):'Goal: bring the CPU back to normal. TERM is polite — does this process listen?']},
 learn:[['Know what a process is',0],['Read the process tree',1],['Know the process states',3],['Spot a CPU hog',4],['Send signals with kill',7]],
 steps:[
  {t:'A running program',b:'A program is a file on disk. A process is that program running: it has a PID (process ID), its own memory and a state.',k:['idea','Key idea','Run the same program twice and you get two processes with two different PIDs.'],pill:'setup',tt:'Program',focus:['systemd'],
   term:{term:['$ ps -p 1 -o pid,ppid,comm','  PID  PPID COMMAND','    1     0 systemd']},hud:{n:{v:'6'},sel:{v:'systemd'}},fx:[{n:'systemd',k:'pulse'}]},
  {t:'Parents and children',b:'Every process has a parent (PPID). PID 1, systemd, starts first and everything else descends from it. Logging in over SSH makes sshd start a bash for you.',k:['tip','Remember','If you know the parent, you know who started a process and who to blame.'],pill:'idea',tt:'Parents',
   termClear:true,term:{term:['$ pstree -p','systemd(1)─┬─cron(611)','           ├─nginx(530)───nginx(531)','           └─sshd(412)───bash(2101)']},
   once:[['systemd','sshd'],['systemd','nginx'],['systemd','cron'],['sshd','bash'],['nginx','worker']].map(function(p){return {path:p,label:'fork',tone:'slate',stagger:260}})},
  {t:'fork: starting a process',b:'When you type a command, bash forks itself and the copy runs your program. Here bash starts sleep 300 in the background.',k:['idea','Key idea','fork copies the process, exec swaps in the new program. That is how every command starts.'],pill:'idea',tt:'fork',focus:['bash','sleepp','sshd'],
   set:{sleepp:{show:true}},hud:{n:{v:'7'},sel:{v:'sleep 300'}},
   term:{term:['$ sleep 300 &','[1] 3355','$ ps','  PID TTY   CMD',' 2101 pts/0 bash',' 3355 pts/0 sleep']},once:[{path:['bash','sleepp'],label:'fork',tone:'violet',delay:350}]},
  {t:'Process states',b:'Most processes sleep, waiting for something. Only a few run at any moment. The dot on each tile shows the state.',k:['idea','Key idea','R running, S sleeping, D waiting for disk, T stopped, Z zombie (finished but not yet collected by its parent).'],pill:'idea',tt:'States',
   term:{term:['$ ps aux | head -4','USER  PID %CPU STAT COMMAND','root    1  0.0 Ss   systemd','syam 3355  0.0 S    sleep 300']},hud:{sel:{v:'—'}}},
  {t:'A CPU hog appears',b:'backup.sh starts and burns CPU. One runaway process can slow the whole server. top and ps show who is using the CPU.',k:['problem','Watch out','High CPU is not always a problem, but a process stuck at ~100% usually is.'],pill:'problem',tt:'CPU hog',S:{hog:true,st:'run'},focus:['bash','backup','cpu'],
   set:{backup:{show:true,status:'run'}},hud:{n:{v:'8'},sel:{v:'backup.sh'}},term:{term:['$ top -bn1 | head -8','%Cpu(s): 97.0 us','  PID USER %CPU COMMAND',' 4120 syam 96.8 backup.sh']},
   flows:[{path:['backup','cpu'],label:'cpu',tone:'red',ok:true,when:function(S){return S.st=='run'}}]},
  {t:'Signals: ask nicely',b:'kill does not always kill. It sends a signal. SIGTERM (15) politely asks a process to clean up and exit. sleep 300 listens and quits.',k:['idea','Key idea','Think of a signal as a message to the process. The process decides what to do with most of them.'],pill:'idea',tt:'TERM',focus:['you','sleepp'],
   term:{term:['$ kill 3355','[1]+ Terminated sleep 300']},hud:{sig:{v:'SIGTERM (15)'},sel:{v:'sleep 300'}},once:[{path:['you','sleepp'],label:'TERM',tone:'amber',delay:300}],timed:[{at:1500,set:{sleepp:{status:'dead'}},hud:{n:{v:'7'}}}]},
  {t:'SIGKILL: no negotiation',b:'backup.sh ignores SIGTERM. SIGKILL (9) cannot be ignored: the kernel ends the process immediately.',k:['problem','Watch out','KILL skips cleanup, so files may be left half-written. Try TERM first and use KILL as the last resort.'],pill:'problem',tt:'KILL',focus:['you','backup','cpu'],S:{hog:true,st:'run'},
   term:{term:['$ kill 4120','$ ps -o stat= -p 4120','R','$ kill -9 4120','[2]+ Killed backup.sh']},hud:{sig:{v:'SIGKILL (9)'},sel:{v:'backup.sh'}},
   flows:[{path:['backup','cpu'],label:'cpu',tone:'red',ok:true,when:function(S){return S.st=='run'}}],
   once:[{path:['you','backup'],label:'TERM',tone:'amber',ok:false,delay:300},{path:['you','backup'],label:'KILL',tone:'red',ok:true,delay:1900}],
   timed:[{at:3000,S:{st:'dead'},set:{backup:{status:'dead'}},hud:{n:{v:'6'}}}]},
  {t:'Try it: tame the runaway',b:'backup.sh is hogging the CPU again. Send it signals with the buttons and watch what each one does.',k:['tip','Challenge','Try TERM first. Then STOP, then CONT. Finally KILL. Which ones does it obey?'],pill:'problem',tt:'Try it',S:{hog:true,st:'run'},goal:true,termClear:true,focus:['you','backup','cpu'],
   set:{backup:{show:true,status:'run'}},hud:{n:{v:'7'},sel:{v:'backup.sh'},sig:{v:'—'}},term:{term:['$ top -bn1 | head -4','%Cpu(s): 97.0 us',' 4120 syam 96.8 backup.sh']},
   flows:[{path:['backup','cpu'],label:'cpu',tone:'red',ok:true,when:function(S){return S.st=='run'}}]},
  {t:'Recap',b:'A process is a running program with a PID and a parent. Processes sleep, run, stop or die. Signals ask them to stop: TERM politely, KILL by force.',k:['idea','Next up','systemd: the process that starts and supervises all the others.'],pill:'recap',tt:'Recap',S:{hog:false,st:'run'},termClear:true,
   set:{backup:{show:false},sleepp:{show:true,status:'sleep'}},hud:{n:{v:'7'},sel:{v:'—'},sig:{v:'—'}},term:{term:['$ kill -l | head -3',' 1) SIGHUP   2) SIGINT   9) SIGKILL','15) SIGTERM 18) SIGCONT 19) SIGSTOP']}}
 ]});
})();

(function(){
var UNIT=['[Unit]','Description=My app','After=network.target','[Service]','ExecStart=/opt/app/run','Restart=on-failure','[Install]','WantedBy=multi-user.target'];
var ENVR=['YOUR SHELL','  APP_ENV=prod','  PATH=/usr/local/bin:/usr/bin','','A SYSTEMD SERVICE','  sees only what the unit sets:','  Environment=APP_ENV=prod','  EnvironmentFile=/etc/app.env'];
var act=function(S){return S.active},lvl=function(S){return S.active=='active'?'good':S.active=='failed'?'bad':'warn'};
function fail(A){A.set('app',{status:'fail'})}
function start(S,A){if(S.broken){S.active='failed';A.set('app',{status:'fail'});A.term('term',['$ sudo systemctl start app','! Job for app.service failed.','$ journalctl -u app -n 1','app: bind: address already in use']);A.send(['systemd','app'],{label:'start',tone:'green',ok:false})}
 else{S.active='active';A.set('app',{status:'run'});A.term('term',['$ sudo systemctl start app','$ systemctl is-active app','active']);A.send(['systemd','app'],{label:'start',tone:'green',ok:true})}}
