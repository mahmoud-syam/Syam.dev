(function(){
var HOSTS=[['web1',45],['web2',82],['db1',91],['cache',67]];
var SCRIPT=['#!/usr/bin/env bash','set -euo pipefail',function(S){return 'THRESHOLD=${1:-'+S.T+'}'},'alerts=0','check() {','  local use=$(usage "$1")','  if (( use > THRESHOLD )); then','    echo "ALERT $1 ${use}%"; alerts=$((alerts+1))','  fi; }','for h in web1 web2 db1 cache; do check "$h"; done','exit $(( alerts > 0 ))'];
function hits(T){return HOSTS.filter(function(h){return h[1]>T}).map(function(h){return h[0]})}
function reset(A){HOSTS.forEach(function(h){A.set(h[0],{status:'none'})})}
function run(S,A,instant){var _id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===_id)fn()})}var al=hits(S.T),lines=['$ ./check.sh '+S.T];S.ran=false;reset(A);A.refresh();
 HOSTS.forEach(function(h,i){L(300+i*750,function(){A.send(['script',h[0]],{label:'df',tone:'blue',ok:true});A.hud({at:{v:h[0]}})});
  L(300+i*750+700,function(){var bad=h[1]>S.T;A.set(h[0],{status:bad?'#e5534b':'run'});if(bad)A.send([h[0],'oncall'],{label:'!',tone:'red',ok:true})})});
 L(300+HOSTS.length*750+700,function(){S.ran=true;S.ranT=S.T;A.term('term',lines.concat(al.map(function(n){var u=HOSTS.filter(function(h){return h[0]==n})[0][1];return 'ALERT '+n+' '+u+'%'})).concat(['$ echo $?',al.length?'1':'0']));A.hud({ex:{v:al.length?'1':'0',lv:al.length?'warn':'good'},al:{v:String(al.length)},at:{v:'done'}});A.set('oncall',{});A.refresh()})}
var SH=function(o){return Object.assign({w:120,status:'none'},o)};
LESSON('bash','basics',{
 title:'Variables, conditions & loops',sub:'Write a real script: check disk space on every server and alert when one is too full.',time:'14 min',level:'Beginner',
 S:{T:80,ran:false,ranT:0},
 legend:[['#3fa456','below threshold'],['#e5534b','alert'],['#3b82c4','checking']],
 hud:[{id:'th',l:'THRESHOLD',v:function(S){return S.T+'%'},lv:'none'},{id:'at',l:'Loop at',v:'—',lv:'none'},{id:'al',l:'Alerts',v:'—',lv:'none'},{id:'ex',l:'Exit code $?',v:'—',lv:'none'}],
 nodes:[
  H.box('script',66,54,'check.sh','green',{center:true}),
  H.tile('web1',262,48,'web1','disk 45%','blue',SH({})),H.tile('web2',262,126,'web2','disk 82%','blue',SH({})),
  H.tile('db1',262,204,'db1','disk 91%','violet',SH({})),H.tile('cache',262,282,'cache','disk 67%','amber',SH({})),
  {t:'crowd',id:'oncall',x:76,y:300,tone:'red',label:'on-call',n:1,w:50,anchor:[128,300]},
  {t:'panel',id:'code',x:392,y:14,w:316,h:214,title:'check.sh',rows:SCRIPT,fs:9.5},
  {t:'term',id:'term',x:392,y:240,w:316,h:210,title:'terminal'}],
 links:[H.lk('script','web1','blue'),H.lk('script','web2','blue'),H.lk('script','db1','blue'),H.lk('script','cache','blue'),H.lk('oncall','web2','red',{dash:true,on:function(S){return S.ran&&S.ranT<82}}),H.lk('oncall','db1','red',{dash:true,on:function(S){return S.ran&&S.ranT<91}})],
 controls:{title:'Run check.sh',groups:[{name:'THRESHOLD',items:[70,80,90].map(function(v){return {label:String(v),on:function(S){return S.T==v},click:function(S,A){S.T=v;S.rid=(S.rid||0)+1;S.ran=false;A.set('code',{});A.term('term',['$ # THRESHOLD='+v])}}})},{items:[{label:'run ./check.sh',wide:true,click:function(S,A){run(S,A)}}]}]},
 goal:function(S){var ok=S.ran&&S.ranT==90;return [ok,ok?'Done. With THRESHOLD=90 only db1 alerts: the loop checked every host and the condition picked the critical one.':'Goal: page on-call only for critical servers (above 85% full). Pick a threshold, run the script and read the alerts.']},
 learn:[['Write and run a script',0],['Use variables',1],['Write conditions',2],['Loop over a list',3],['Functions and arguments',4],['Read exit codes',5],['Write safer scripts',6]],
 steps:[
  {t:'A script is a file of commands',b:'A Bash script is the commands you would type, saved in a file. The first line, the shebang, says which program runs it. Make it executable, then run it.',k:['tip','Remember','#!/usr/bin/env bash finds bash wherever it is installed. chmod +x makes the file executable.'],pill:'setup',tt:'Script',focus:['script','code'],S:{T:80,ran:false,ranT:0},
   set:{code:{rows:SCRIPT,hl:[0]}},termClear:true,term:{term:['$ chmod +x check.sh','$ ./check.sh','$ bash check.sh   # also works']},fx:[{n:'script',k:'pulse'}]},
  {t:'Variables',b:'NAME=value stores a value, with no spaces around =. Read it back with "$NAME". $(command) runs a command and stores its output.',k:['problem','Watch out','Always quote variables: "$file". Without quotes, a value with a space breaks into two words.'],pill:'idea',tt:'Variables',focus:['script','code'],
   set:{code:{rows:SCRIPT,hl:[2,3,5]}},termClear:true,term:{term:['$ name=web1','$ echo "server: $name"','server: web1','$ today=$(date +%F)','$ echo "$today"','2026-11-26']}},
  {t:'Conditions',b:'if runs a block only when a test is true. (( use > THRESHOLD )) compares numbers. [[ $a == $b ]] compares text.',k:['idea','Key idea','For numbers inside [[ ]] use -gt, -lt, -eq. Inside (( )) you can write >, < and == like maths.'],pill:'idea',tt:'if',focus:['script','db1','web1'],
   set:{code:{rows:SCRIPT,hl:[6,7,8]}},termClear:true,term:{term:['$ use=91','$ if (( use > 80 )); then echo ALERT; fi','ALERT','$ [[ -f /etc/passwd ]] && echo exists','exists']},
   once:[{path:['script','db1'],label:'91',tone:'red'},{path:['script','web1'],label:'45',tone:'green',delay:900}],timed:[{at:900,set:{db1:{status:'#e5534b'}}},{at:1800,set:{web1:{status:'run'}}}]},
  {t:'Loops',b:'for repeats the same commands for each item in a list. Here it runs check once per server, so adding a server is one word, not new code.',k:['tip','Remember','while read -r line; do ... done < file processes a file line by line.'],pill:'idea',tt:'for',focus:['script','web1','web2','db1','cache'],
   set:{code:{rows:SCRIPT,hl:[9]},web1:{status:'none'},db1:{status:'none'}},termClear:true,term:{term:['$ for h in web1 web2 db1; do echo "$h"; done','web1','web2','db1']},
   once:['web1','web2','db1','cache'].map(function(h,i){return {path:['script',h],label:String(i+1),tone:'blue',delay:i*650}})},
  {t:'Functions and arguments',b:'A function groups commands under a name, and you call it like a command. Inside it $1 is the first argument. In the script itself $1 is what you typed after the script name.',k:['idea','Key idea','${1:-80} means: use argument 1, or 80 if it is missing. "$@" is all arguments, $# is how many.'],pill:'idea',tt:'Functions',focus:['script','code'],
   set:{code:{rows:SCRIPT,hl:[2,4,5]}},termClear:true,term:{term:['$ greet() { echo "hi $1"; }','$ greet syam','hi syam','$ ./check.sh 90   # THRESHOLD=90']}},
  {t:'Exit codes',b:'Every command ends with a number: 0 means success, anything else means failure. $? holds the last one. The script ends with 1 when it found alerts, so cron or CI can react.',k:['tip','Remember','cmd && next runs next only if cmd worked. cmd || fallback runs fallback only if it failed.'],pill:'idea',tt:'$?',focus:['script','oncall'],
   set:{code:{rows:SCRIPT,hl:[10]}},hud:{ex:{v:'1',lv:'warn'}},termClear:true,term:{term:['$ ls /nope; echo $?','! ls: cannot access /nope','2','$ ./check.sh || echo "page on-call"','page on-call']},
   once:[{path:['db1','oncall'],label:'!',tone:'red'}]},
  {t:'Safer scripts',b:'set -euo pipefail makes the script stop on the first error, on unset variables and on failures inside pipes, instead of carrying on with bad data.',k:['problem','Watch out','Run shellcheck on every script. It finds missing quotes and other classic bugs before they hit a server.'],pill:'problem',tt:'Safety',focus:['script','code'],
   set:{code:{rows:SCRIPT,hl:[1]}},hud:{ex:{v:'—',lv:'none'}},termClear:true,term:{term:['$ shellcheck check.sh','$ # no output = no warnings','$ bash -x check.sh 90   # trace each line']}},
  {t:'Try it: tune the alert',b:'On-call should be paged only for critical servers, above 85% full. Pick a THRESHOLD, run the script and watch the loop check each server.',k:['tip','Challenge','Run with 70 first. Count the alerts. Then find the value that pages only for db1.'],pill:'problem',tt:'Try it',S:{T:70,ran:false,ranT:0},goal:true,focus:null,
   set:{code:{rows:SCRIPT,hl:[2,6]},web1:{status:'none'},web2:{status:'none'},db1:{status:'none'},cache:{status:'none'}},hud:{al:{v:'—'},ex:{v:'—',lv:'none'},at:{v:'—'}},termClear:true,term:{term:['$ cat check.sh | head -3']}},
  {t:'Recap',b:'Variables hold values, if decides, for repeats, functions group, and exit codes report. With set -euo pipefail and shellcheck your scripts fail loudly instead of silently.',k:['idea','Next up','Pipes and redirection: connect small commands into powerful one-liners.'],pill:'recap',tt:'Recap',S:{T:90,ran:true,ranT:90},
   set:{code:{rows:SCRIPT,hl:[]},web1:{status:'run'},web2:{status:'run'},db1:{status:'#e5534b'},cache:{status:'run'}},termClear:true,term:{term:['$ ./check.sh 90','ALERT db1 91%']}}
 ]});
})();
