(function(){
var SV=[['web1','prod',45],['web2','prod',72],['web3','prod',88],['db1','prod',91],['dev1','dev',95],['stg1','staging',83]];
function pick(S){var t=S.th?85:80;return SV.filter(function(s){return (!S.env||s[1]=='prod')&&s[2]>t})}
function args(S){var a=[];if(S.env)a.push('--env prod');if(S.th)a.push('--threshold 85');if(S.js)a.push('--format json');return a.join(' ')}
function cl(S){var a=args(S);return a.length>26?['$ ./disk_report.py \\','    '+a]:['$ ./disk_report.py '+a]}
function out(S){var r=pick(S);if(S.js)return ['['].concat(r.map(function(s,i){return '  {"host": "'+s[0]+'", "disk": '+s[2]+'}'+(i<r.length-1?',':'')})).concat([']']);return ['HOST   ENV      DISK'].concat(r.map(function(s){return (s[0]+'      ').slice(0,7)+(s[1]+'         ').slice(0,9)+s[2]+'%'}))}
var MAIN=[{t:'import argparse, json, logging, subprocess, sys',tone:'gold'},'def main():','    p = argparse.ArgumentParser()','    p.add_argument("--env", choices=["prod","dev"])','    p.add_argument("--threshold", type=int, default=80)','    p.add_argument("--format", default="table")','    a = p.parse_args()','    ...','    return 1 if alerts else 0',{t:'if __name__ == "__main__":',tone:'gold'},{t:'    sys.exit(main())',tone:'gold'}];
var SUB=[{t:'r = subprocess.run(',tone:'gold'},'    ["ssh", host, "df", "-P", "/"],','    capture_output=True, text=True,','    check=True, timeout=10)','use = int(r.stdout.split()[-2].rstrip("%"))','',{t:'# a list, not a string: no shell=True,',tone:'green'},{t:'# so a hostname cannot inject commands',tone:'green'}];
var LOG=[{t:'logging.basicConfig(',tone:'gold'},'    filename="disk_report.log", level=logging.INFO,','    format="%(asctime)s %(levelname)s %(message)s")','log = logging.getLogger("disk")','',{t:'log.info("checked %s: %d%%", host, use)',tone:'green'},{t:'log.warning("%s above %d%%", host, limit)',tone:'amber'},{t:'log.error("%s unreachable", host)',tone:'red'}];
var BOTO=[{t:'import boto3',tone:'gold'},'ec2 = boto3.client("ec2", region_name="eu-west-1")','r = ec2.describe_instances(Filters=[','    {"Name": "tag:env", "Values": ["dev"]},','    {"Name": "instance-state-name",','     "Values": ["running"]}])','',{t:'# credentials come from an IAM role or',tone:'green'},{t:'# environment, never from the code',tone:'green'}];
function run(S,A){S.ran=true;var r=pick(S);A.send(['you','script'],{label:'run',tone:'gold',ok:true});A.after(500,function(){A.send(['script','sub'],{label:'df',tone:'blue',ok:true})});A.after(1100,function(){A.send(['script','log'],{label:'log',tone:'violet',ok:true});A.send(['script','out'],{label:S.js?'{ }':'txt',tone:'green',ok:true})});
 A.term('term',cl(S).concat(out(S)).concat(['$ echo $?',r.length?'1':'0']),true);A.after(1300,function(){A.set('out',{title:S.js?'report.json':'stdout',sub:r.length+' hosts'});A.refresh()})}
LESSON('python','scripts',{
 title:'Python automation scripts',sub:'Build a real command-line tool: flags with argparse, commands with subprocess, logs, exit codes and JSON output.',time:'16 min',level:'Intermediate',
 S:{env:false,th:false,js:false,ran:false},
 legend:[['#c8962e','you'],['#3b82c4','subprocess'],['#5a4aa8','logging']],
 hud:[{id:'a',l:'Flags',v:function(S){return [S.env?'env':'',S.th?'85':'',S.js?'json':''].filter(Boolean).join(' ')||'none'},lv:'none'},{id:'h',l:'Hosts reported',v:function(S){return S.ran?String(pick(S).length):'—'},lv:'none'},{id:'f',l:'Format',v:function(S){return S.js?'json':'table'},lv:'none'},{id:'x',l:'Exit code',v:function(S){return S.ran?(pick(S).length?'1':'0'):'—'},lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:66,y:66,tone:'gold',label:'you / cron',n:1,w:50,anchor:[118,66]},
  H.box('script',212,36,'disk_report.py','blue',{center:true}),
  H.tile('args',70,196,'argparse','--env --threshold','gold',{w:132}),
  H.tile('sub',212,208,'subprocess','ssh host df -P','blue',{w:128}),
  H.tile('log',330,300,'logging','disk_report.log','violet',{w:118}),
  H.tile('out',332,156,'stdout','—','green',{w:108}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:200,title:'disk_report.py',rows:MAIN,fs:9},
  {t:'term',id:'term',x:392,y:226,w:316,h:224,title:'terminal'}],
 links:[H.lk('you','script','gold'),H.lk('args','script','gold',{dash:true}),H.lk('script','sub','blue'),H.lk('script','log','violet'),H.lk('script','out','green')],
 controls:{title:'Run with flags',groups:[{items:[['env','--env prod'],['th','--threshold 85'],['js','--format json']].map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;A.fx('args','pulse');A.term('term',cl(S),true)}}}).concat([
  {label:'--help',wide:true,click:function(S,A){A.term('term',['$ ./disk_report.py --help','usage: disk_report.py [-h] [--env {prod,dev}]','       [--threshold N] [--format {table,json}]'],true)}},
  {label:'run',wide:true,click:function(S,A){run(S,A)}}])}]},
 goal:function(S){var r=pick(S),ok=S.ran&&S.env&&S.th&&S.js;return [ok,ok?'Done. One script, three flags: JSON for production hosts above 85%, web3 and db1, and exit code 1 so cron or CI can react.':'Goal: the dashboard needs JSON, only production, only hosts above 85%. Set the flags, run, and compare the output.']},
 learn:[['Structure a CLI tool',0],['Parse flags with argparse',1],['Run commands with subprocess',2],['Log instead of print',3],['Return exit codes',4],['Output JSON for machines',5],['Automate the cloud with boto3',6]],
 steps:[
  {t:'From script to tool',b:'A tool takes options instead of being edited for each case. Put the logic in main(), call it under if __name__ == "__main__", and pass its return value to sys.exit.',k:['idea','Key idea','The __main__ guard lets you import the file in tests without running it.'],pill:'setup',tt:'Tool',focus:['you','script'],S:{env:false,th:false,js:false,ran:false},
   set:{out:{title:'stdout',sub:'—'},code:{title:'disk_report.py',rows:MAIN,hl:[1,9,10]}},termClear:true,term:{term:['$ chmod +x disk_report.py','$ ./disk_report.py']},
   once:[{path:['you','script'],label:'run',tone:'gold'}]},
  {t:'argparse: flags and --help',b:'argparse reads options like --env prod, checks them, converts types and writes --help for you. choices= rejects typos, type=int rejects text.',k:['tip','Remember','A wrong flag stops the script with a clear message, before it touches any server.'],pill:'idea',tt:'argparse',focus:['args','script'],
   set:{code:{rows:MAIN,hl:[2,3,4,5,6]}},termClear:true,term:{term:['$ ./disk_report.py --env prd','! error: argument --env: invalid choice:',"! 'prd' (choose from 'prod', 'dev')"]},
   once:[{path:['args','script'],label:'--env',tone:'gold'}]},
  {t:'subprocess: run commands safely',b:'subprocess.run runs another program and captures its output. Pass the command as a list, set check=True to raise on failure, and add a timeout.',k:['problem','Watch out','shell=True with a value from outside lets someone inject commands, like a host named "x; rm -rf /".'],pill:'problem',tt:'subprocess',focus:['script','sub'],
   set:{code:{title:'subprocess',rows:SUB,hl:[1,3,6]}},termClear:true,term:{term:['>>> r = subprocess.run(["df","-P","/"],','...     capture_output=True, text=True)','>>> r.stdout.split()[-2]',"'61%'"]},
   once:[{path:['script','sub'],label:'df',tone:'blue'}]},
  {t:'logging, not print',b:'logging adds time and level to every message and can write to a file. INFO for normal steps, WARNING for problems, ERROR for failures.',k:['tip','Remember','Messages keep their % placeholders: log.info("%s: %d%%", host, use). The logger fills them only if it prints them.'],pill:'idea',tt:'logging',focus:['script','log'],
   set:{code:{title:'logging',rows:LOG,hl:[5,6,7]}},termClear:true,term:{term:['$ tail -3 disk_report.log','2026-11-26 02:00 INFO checked web1: 45%','2026-11-26 02:00 WARNING db1 above 85%','2026-11-26 02:00 ERROR dev1 unreachable']},
   once:[{path:['script','log'],label:'log',tone:'violet'}]},
  {t:'Exit codes',b:'main returns 0 when all is well and 1 when it found problems. sys.exit passes that to the shell, so cron, CI and other scripts can react without reading the text.',k:['idea','Key idea','The same contract as Bash: 0 means success, anything else means look at me.'],pill:'idea',tt:'Exit',focus:['script','you'],
   set:{code:{title:'disk_report.py',rows:MAIN,hl:[8,10]}},termClear:true,term:{term:['$ ./disk_report.py --threshold 85','$ echo $?','1','$ ./disk_report.py --threshold 99; echo $?','0']}},
  {t:'Output for machines',b:'People like tables. Programs like JSON. A --format flag lets the same tool feed your eyes and a dashboard, a Slack bot or another script.',k:['tip','Remember','json.dumps(results, indent=2) for files, without indent for one-line output that pipes into jq.'],pill:'idea',tt:'JSON',focus:['script','out'],S:{js:true,env:true,th:true},
   set:{out:{title:'report.json',sub:'2 hosts'},code:{title:'disk_report.py',rows:MAIN,hl:[5]}},termClear:true,term:{term:['$ ./disk_report.py --env prod --threshold 85 \\','    --format json | jq -r ".[].host"','web3','db1']},
   once:[{path:['script','out'],label:'{ }',tone:'green'}]},
  {t:'Automating the cloud',b:'The same pattern drives cloud work. boto3 is the AWS library for Python: list instances, stop forgotten dev servers, tag resources, all from a script.',k:['problem','Watch out','Never put access keys in code. Use an IAM role on the server, or credentials from the environment.'],pill:'idea',tt:'boto3',focus:['script','sub'],
   set:{code:{title:'boto3',rows:BOTO,hl:[1,2,3]}},termClear:true,term:{term:['$ ./stop_idle_dev.py --dry-run','would stop i-0a1b2c (dev-api, idle 3 days)','would stop i-0d4e5f (dev-db, idle 5 days)']}},
  {t:'Try it: feed the dashboard',b:'The monitoring dashboard needs a JSON list of production hosts above 85% disk. Set the flags, run the tool and check the output and exit code.',k:['tip','Challenge','Run without flags first and see what you get. Then add one flag at a time.'],pill:'problem',tt:'Try it',S:{env:false,th:false,js:false,ran:false},goal:true,focus:null,
   set:{out:{title:'stdout',sub:'—'},code:{title:'disk_report.py',rows:MAIN,hl:[3,4,5]}},termClear:true,term:{term:['$ ./disk_report.py --help']}},
  {t:'Recap',b:'argparse for options, subprocess for commands, logging for history, exit codes for automation and JSON for other programs. That is a tool, not just a script.',k:['idea','Next up','Ansible: configure many servers at once without writing scripts for each.'],pill:'recap',tt:'Recap',S:{env:true,th:true,js:true,ran:true},
   set:{out:{title:'report.json',sub:'2 hosts'},code:{title:'disk_report.py',rows:MAIN,hl:[]}},termClear:true,term:{term:['$ ./disk_report.py \\','    --env prod --threshold 85 --format json']}}
 ]});
})();
