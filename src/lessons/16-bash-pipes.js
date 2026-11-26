(function(){
var LOGL=['10.0.0.7 GET /login 404','10.0.0.3 GET / 200','10.0.0.7 GET /admin 404','10.0.0.9 GET /wp-login 404','10.0.0.3 GET /api 200','10.0.0.7 GET /.env 404','10.0.0.5 GET /old 404','10.0.0.9 GET /xmlrpc 404','10.0.0.3 POST /api 201','10.0.0.5 GET /img 404','10.0.0.7 GET /backup 404','10.0.0.2 GET / 200'];
var ST={grep:['grep " 404"','grep 404'],awk:["awk '{print $1}'",'awk $1'],sort:['sort','sort'],uniq:['uniq -c','uniq -c'],sortrn:['sort -rn','sort -rn'],head:['head -3','head -3']};
function cnum(l){var m=/^\s*(\d+)/.exec(l);return m?+m[1]:0}
function apply(k,a){if(k=='grep')return a.filter(function(l){return l.indexOf(' 404')>=0});
 if(k=='awk')return a.map(function(l){return l.trim().split(/\s+/)[0]});
 if(k=='sort')return a.slice().sort();
 if(k=='uniq'){var o=[],prev=null,n=0;a.forEach(function(l){if(l===prev)n++;else{if(prev!==null)o.push(pad(n)+' '+prev);prev=l;n=1}});if(prev!==null)o.push(pad(n)+' '+prev);return o}
 if(k=='sortrn')return a.slice().sort(function(x,y){return cnum(y)-cnum(x)||(y>x?1:y<x?-1:0)});
 if(k=='head')return a.slice(0,3);return a}
function pad(n){var s=String(n);while(s.length<7)s=' '+s;return s}
function runp(p){var a=LOGL.slice(),out=[a.length];p.forEach(function(k){a=apply(k,a);out.push(a.length)});return {lines:a,counts:out}}
var GOAL=runp(['grep','awk','sort','uniq','sortrn','head']).lines.join('|');
var OUT=[0,1,2,3,4,5,6,7].map(function(i){return function(S){var r=runp(S.p).lines;if(i==7&&r.length>8)return {t:'… '+(r.length-7)+' more lines',tone:'amber'};var l=r[i];return l===undefined?'':{t:l,tone:S.p.length&&S.p[S.p.length-1]=='head'?'green':undefined}}});
function SET(p,extra){var r=runp(p),o={};for(var i=0;i<6;i++){var k=p[i];o['s'+i]=k?{show:true,title:ST[k][1],sub:r.counts[i+1]+' lines'}:{show:false}}o.out={sub:r.lines.length+' lines'};return Object.assign(o,extra||{})}
function sync(S,A){var o=SET(S.p);Object.keys(o).forEach(function(k){A.set(k,o[k])});A.set('outp',{title:'stdout',rows:OUT});A.refresh()}
function cmd(p){if(!p.length)return ['$ cat access.log'];var L=['$ '+ST[p[0]][0]+' access.log'];p.slice(1).forEach(function(k){L.push('    | '+ST[k][0])});return L}
function add(S,A,k){if(S.p.length>=6){A.term('term',['! six stages is the limit here: undo one']);return}var prev=S.p.length?'s'+(S.p.length-1):'log';S.p.push(k);var me='s'+(S.p.length-1);sync(S,A);A.send([prev,me],{label:'|',tone:'blue',ok:true});A.send([me,'out'],{label:'',tone:'green',ok:true});A.term('term',cmd(S.p),true)}
var FILE=['report.txt',''].concat(runp(['grep','awk','sort','uniq','sortrn','head']).lines);
var REDIR=[{t:'cmd > file    write, replace old content',tone:'gold'},{t:'cmd >> file   append to the end',tone:'gold'},{t:'cmd < file    read stdin from a file',tone:'gold'},'',{t:'cmd 2> err    errors to a file',tone:'red'},{t:'cmd > out 2>&1   both to one file',tone:'red'},{t:'cmd 2>/dev/null  throw errors away',tone:'red'}];
LESSON('bash','pipes',{
 title:'Pipes & redirection',sub:'Chain small commands into one pipeline, and send output and errors where you want them.',time:'14 min',level:'Beginner',
 S:{p:[],redir:false,err:false},
 legend:[['#3b82c4','stdin → stdout'],['#3fa456','result'],['#e5534b','stderr']],
 hud:[{id:'st',l:'Stages',v:function(S){return String(S.p.length)},lv:'none'},{id:'in',l:'Lines in',v:'12',lv:'none'},{id:'out',l:'Lines out',v:function(S){return String(runp(S.p).lines.length)},lv:'none'},{id:'ok',l:'Top 3 404s',v:function(S){return runp(S.p).lines.join('|')==GOAL?'correct':'not yet'},lv:function(S){return runp(S.p).lines.join('|')==GOAL?'good':'none'}}],
 nodes:[
  H.tile('log',62,46,'access.log','12 lines','slate',{w:112}),
  H.tile('s0',190,46,'',' ','blue',{w:112,show:false}),H.tile('s1',318,46,'',' ','blue',{w:112,show:false}),
  H.tile('s2',318,134,'',' ','blue',{w:112,show:false}),H.tile('s3',190,134,'',' ','blue',{w:112,show:false}),
  H.tile('s4',62,134,'',' ','blue',{w:112,show:false}),H.tile('s5',62,222,'',' ','blue',{w:112,show:false}),
  H.tile('out',190,222,'stdout','12 lines','green',{w:112}),
  H.tile('file',318,222,'report.txt','file','gold',{w:112,show:false}),
  H.tile('err',190,316,'stderr','fd 2','red',{w:112,show:false}),
  H.tile('null',318,316,'/dev/null','discard','slate',{w:112,show:false}),
  {t:'panel',id:'outp',x:392,y:14,w:316,h:170,title:'stdout',rows:OUT,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('log','s0','blue'),H.lk('s0','s1','blue'),H.lk('s1','s2','blue'),H.lk('s2','s3','blue'),H.lk('s3','s4','blue'),H.lk('s4','s5','blue'),
  H.lk('log','out','green',{on:function(S){return S.p.length==0}})].concat([0,1,2,3,4,5].map(function(i){return H.lk('s'+i,'out','green',{on:function(S){return S.p.length==i+1},dash:true})})).concat([H.lk('out','file','gold',{on:function(S){return S.redir}}),H.lk('err','null','slate',{on:function(S){return S.err}})]),
 controls:{title:'Build the pipeline',groups:[{items:['grep','awk','sort','uniq','sortrn','head'].map(function(k){return {label:ST[k][0],wide:true,click:function(S,A){add(S,A,k)}}}).concat([
  {label:'undo',wide:true,click:function(S,A){if(!S.p.length)return;S.p.pop();sync(S,A);A.term('term',cmd(S.p),true)}}])}]},
 goal:function(S){var ok=runp(S.p).lines.join('|')==GOAL;return [ok,ok?'Done. grep → awk → sort → uniq -c → sort -rn → head: the classic "top N" pipeline. 10.0.0.7 hit 404 four times.':'Goal: list the top 3 IPs that got 404 errors, with counts. Add stages in order and read stdout after each one.']},
 learn:[['Know stdin, stdout, stderr',0],['Connect commands with |',1],['Filter and extract fields',2],['Count with sort | uniq -c',3],['Redirect output to files',4],['Handle errors and /dev/null',5],['Use tee and xargs',6]],
 steps:[
  {t:'Three streams',b:'Every command reads from stdin and writes results to stdout and errors to stderr. By default stdout and stderr both go to your screen.',k:['idea','Key idea','The streams have numbers: 0 is stdin, 1 is stdout, 2 is stderr. Redirection uses these numbers.'],pill:'setup',tt:'Streams',focus:['log','out'],S:{p:[],redir:false,err:false},
   set:SET([],{file:{show:false},err:{show:false},null:{show:false},outp:{title:'stdout',rows:OUT,hl:[]}}),termClear:true,term:{term:['$ cat access.log | head -2','10.0.0.7 GET /login 404','10.0.0.3 GET / 200']},
   once:[{path:['log','out'],label:'1',tone:'green'}]},
  {t:'The pipe |',b:'A pipe sends the stdout of one command into the stdin of the next. Each command does one small job, and the pipe joins them into a tool.',k:['tip','Remember','Build pipelines one stage at a time and look at the output after each stage.'],pill:'idea',tt:'Pipe',focus:['log','s0','out'],S:{p:['grep']},
   set:SET(['grep']),termClear:true,term:{term:cmd(['grep']).concat(['# 8 of 12 lines kept'])},
   once:[{path:['log','s0'],label:'|',tone:'blue'},{path:['s0','out'],label:'',tone:'green',delay:900}]},
  {t:'Filter and extract',b:'grep keeps matching lines. awk splits each line into fields: $1 is the first column. Together they turn log lines into a list of IP addresses.',k:['problem','Watch out','Real nginx logs have more fields. There the status code is $9, not the 4th column used here.'],pill:'idea',tt:'Extract',focus:['log','s0','s1','out'],S:{p:['grep','awk']},
   set:SET(['grep','awk']),termClear:true,term:{term:cmd(['grep','awk'])},
   once:[{path:['log','s0','s1'],label:'|',tone:'blue'}]},
  {t:'Count: sort | uniq -c',b:'uniq -c counts repeated lines, but only when they sit next to each other. So sort first, then count, then sort -rn to put the biggest numbers on top.',k:['idea','Key idea','sort | uniq -c | sort -rn | head is the most used one-liner in operations. Learn it by heart.'],pill:'idea',tt:'Count',focus:['s1','s2','s3','s4','s5','out'],S:{p:['grep','awk','sort','uniq','sortrn','head']},
   set:SET(['grep','awk','sort','uniq','sortrn','head']),termClear:true,term:{term:cmd(['grep','awk','sort','uniq','sortrn','head'])},
   once:[{path:['log','s0','s1','s2','s3','s4','s5','out'],label:'|',tone:'blue'}]},
  {t:'Redirect output to a file',b:'> sends stdout into a file instead of the screen and replaces what was there. >> appends to the end. < feeds a file into stdin.',k:['problem','Watch out','> empties the file first, even if the command then fails. Use >> when you want to keep old content.'],pill:'problem',tt:'Redirect',focus:['out','file'],S:{redir:true},
   set:{file:{show:true},outp:{title:'report.txt',rows:FILE,hl:[]}},termClear:true,term:{term:['$ ... | head -3 > report.txt','$ date >> report.txt','$ wc -l < report.txt','4']},
   once:[{path:['out','file'],label:'>',tone:'gold'}]},
  {t:'Errors: stderr',b:'Errors go to stderr, so a pipe or > does not catch them. 2> sends errors to a file, 2>&1 joins them with stdout, and /dev/null throws output away.',k:['tip','Remember','cmd > all.log 2>&1 captures everything. The order matters: put 2>&1 after the > file part.'],pill:'idea',tt:'stderr',focus:['err','null','out','file'],S:{err:true},
   set:{err:{show:true},null:{show:true},outp:{title:'redirection cheat sheet',rows:REDIR,hl:[4,5,6]}},termClear:true,term:{term:['$ ls /etc /nope','! ls: cannot access /nope','$ ls /etc /nope 2>/dev/null','$ backup.sh > run.log 2>&1']},
   once:[{path:['err','null'],label:'2',tone:'red'}]},
  {t:'tee and xargs',b:'tee writes its input to a file and passes it on, so you can save and watch at the same time. xargs turns input lines into arguments for another command.',k:['problem','Watch out','File names with spaces break plain xargs. Use find -print0 | xargs -0, or simply find -delete.'],pill:'idea',tt:'xargs',focus:['out','file'],S:{redir:true,err:false},
   set:{err:{show:false},null:{show:false},outp:{title:'stdout',rows:OUT,hl:[]}},termClear:true,term:{term:['$ ./deploy.sh | tee deploy.log','$ find /tmp -name "*.log" -mtime +7 \\','    | xargs rm -f','$ find /tmp -name "*.log" -mtime +7 -delete']},
   once:[{path:['out','file'],label:'tee',tone:'gold'}]},
  {t:'Try it: top 404 offenders',b:'Someone is scanning your site. Build a pipeline that lists the top 3 IP addresses that got 404 errors, with counts, by adding stages in order.',k:['tip','Challenge','Try uniq -c before sort and look at the counts. Why is 10.0.0.7 listed more than once?'],pill:'problem',tt:'Try it',S:{p:[],redir:false,err:false},goal:true,focus:null,
   set:SET([],{file:{show:false},err:{show:false},null:{show:false},outp:{title:'stdout',rows:OUT,hl:[]}}),termClear:true,term:{term:['$ cat access.log']}},
  {t:'Recap',b:'Commands talk through stdin and stdout. | chains them, > and >> save output, 2> handles errors. Build pipelines one stage at a time and check each step.',k:['idea','Next up','Text tools: grep, sed and awk in depth.'],pill:'recap',tt:'Recap',S:{p:['grep','awk','sort','uniq','sortrn','head'],redir:true,err:false},
   set:SET(['grep','awk','sort','uniq','sortrn','head'],{file:{show:true},outp:{title:'stdout',rows:OUT,hl:[]}}),termClear:true,term:{term:['$ cmd | cmd | cmd > file 2>&1']}}
 ]});
})();
