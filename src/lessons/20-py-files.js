(function(){
var Y={A:['app:',{t:'→   name: web        # TAB here',tone:'red'},'  version: "1.10"','  ports: [80, 443]'],B:['app:','  name: web','  version: "1.10"',{t:'ports: [80, 443]     # no indent',tone:'red'}],C:['app:','  name: web',{t:'  version: 1.10       # no quotes',tone:'red'},'  ports: [80, 443]'],D:['app:','  name: web','  version: "1.10"','  ports: [80, 443]']};
var OUT={A:['>>> yaml.safe_load(open("app.yaml"))','! ScannerError: found character \'\\t\'','! that cannot start any token'],B:['>>> yaml.safe_load(open("app.yaml"))',"{'app': {'name': 'web', 'version': '1.10'},"," 'ports': [80, 443]}",'# ports landed outside app!'],
 C:['>>> yaml.safe_load(open("app.yaml"))',"{'app': {'name': 'web', 'version': 1.1,","         'ports': [80, 443]}}",'# "1.10" became the number 1.1'],D:['>>> yaml.safe_load(open("app.yaml"))',"{'app': {'name': 'web', 'version': '1.10',","         'ports': [80, 443]}}"]};
var OPEN=[{t:'with open("app.log") as f:',tone:'gold'},'    for line in f:','        if "ERROR" in line:','            errors += 1','',{t:'# "with" closes the file for you,',tone:'green'},{t:'# even if an error happens inside.',tone:'green'},'','modes: "r" read  "w" write  "a" append'];
var JS=[{t:'import json',tone:'gold'},'with open("status.json") as f:','    data = json.load(f)        # JSON → dict','data["services"][0]["state"]   # "running"','',{t:'json.dumps(data, indent=2)    # dict → text',tone:'green'}];
var YM=[{t:'import yaml',tone:'gold'},'with open("app.yaml") as f:',{t:'    cfg = yaml.safe_load(f)',tone:'green'},'cfg["app"]["ports"]     # [80, 443]','',{t:'# yaml.load() can run code from the file.',tone:'red'},{t:'# Always use safe_load.',tone:'red'}];
var GOT=['YAML gotchas',{t:'tabs          → parse error (spaces only)',tone:'red'},{t:'version: 1.10 → float 1.1   quote it',tone:'red'},{t:'enabled: no   → False (YAML 1.1)',tone:'amber'},{t:'country: NO   → False  "the Norway problem"',tone:'amber'},{t:'port: 08080   → string or error',tone:'amber'},'',{t:'When in doubt, quote strings.',tone:'green'}];
var ENV=[{t:'import os',tone:'gold'},{t:'host = os.environ.get("DB_HOST", "localhost")',tone:'green'},{t:'pwd  = os.environ["DB_PASSWORD"]   # required',tone:'gold'},'','# missing DB_PASSWORD → KeyError right away:','# fail fast, not halfway through a job',{t:'# never hardcode secrets in code or Git',tone:'red'}];
var REP=[{t:'report = {"host": "web1", "disk": 91,',tone:'gold'},{t:'          "alerts": ["disk"]}',tone:'gold'},'with open("report.json", "w") as f:',{t:'    json.dump(report, f, indent=2)',tone:'green'},'','# or with pathlib:','Path("report.json").write_text(','    json.dumps(report, indent=2))'];
LESSON('python','files',{
 title:'Files, JSON & YAML',sub:'Read logs and configs, parse JSON and YAML into Python data, and write clean reports.',time:'14 min',level:'Beginner',
 S:{pick:null},
 legend:[['#3fa456','parsed correctly'],['#e8a33a','parsed, wrong data'],['#e5534b','parse error']],
 hud:[{id:'f',l:'File',v:'app.yaml',lv:'none'},{id:'pk',l:'Tried',v:function(S){return S.pick||'—'},lv:'none'},{id:'r',l:'Result',v:function(S){return !S.pick?'—':S.pick=='D'?'correct':S.pick=='A'?'error':'wrong data'},lv:function(S){return !S.pick?'none':S.pick=='D'?'good':S.pick=='A'?'bad':'warn'}},{id:'lib',l:'Parser',v:'safe_load',lv:'none'}],
 nodes:[
  H.tile('yaml',66,46,'app.yaml','config','amber',{w:112}),
  H.box('py',196,34,'load.py','blue',{center:true}),
  H.tile('dict',322,46,'dict','Python data','green',{w:104,status:'none'}),
  H.tile('env',66,186,'environment','DB_PASSWORD','violet',{w:118}),
  H.tile('log',66,276,'app.log','12,480 lines','slate',{w:118}),
  H.tile('json',322,186,'report.json','output','gold',{w:112,show:false}),
  {t:'panel',id:'view',x:392,y:14,w:316,h:170,title:'app.yaml',rows:Y.D,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'python3'}],
 links:[H.lk('yaml','py','amber'),H.lk('py','dict','green'),H.lk('env','py','violet',{dash:true}),H.lk('log','py','slate',{dash:true}),H.lk('dict','json','gold')],
 controls:{title:'Which app.yaml parses right?',groups:[{items:['A','B','C','D'].map(function(k){return {label:'load version '+k,wide:true,on:function(S){return S.pick==k},click:function(S,A){S.pick=k;A.set('view',{title:'app.yaml (version '+k+')',rows:Y[k],hl:[]});
   A.send(['yaml','py','dict'],{label:'yaml',tone:k=='D'?'green':k=='A'?'red':'amber',ok:k!='A',denyAt:'py'});A.term('term',OUT[k],true);A.after(1500,function(){A.set('dict',{status:k=='D'?'run':k=='A'?'#e5534b':'stop'});A.refresh()})}}})}]},
 goal:function(S){var ok=S.pick=='D';return [ok,ok?'Done. Spaces for indentation, ports inside app, and the version quoted so it stays the text "1.10".':'Goal: the app expects app.name, app.version as the text "1.10", and app.ports. Load each version and read what Python gets.']},
 learn:[['Open files safely',0],['Process a file line by line',1],['Read and write JSON',2],['Load YAML safely',3],['Avoid YAML gotchas',4],['Read environment variables',5],['Write a report file',6]],
 steps:[
  {t:'Open files with "with"',b:'open() gives you a file, and with closes it automatically when the block ends, even after an error. "r" reads, "w" replaces the file, "a" appends.',k:['problem','Watch out','"w" empties the file the moment it opens. Use "a" to add to a log.'],pill:'setup',tt:'Files',focus:['log','py'],S:{pick:null},
   set:{json:{show:false},dict:{status:'none'},view:{title:'reading a file',rows:OPEN,hl:[0]}},termClear:true,term:{term:['$ python3 count_errors.py app.log','ERROR lines: 37']},
   once:[{path:['log','py'],label:'read',tone:'slate'}]},
  {t:'Line by line',b:'for line in f reads one line at a time, so even a huge log uses little memory. Test each line with in, startswith or a split.',k:['tip','Remember','line.strip() removes the newline at the end. line.split() breaks it into fields like awk.'],pill:'idea',tt:'Lines',focus:['log','py'],
   set:{view:{title:'reading a file',rows:OPEN,hl:[1,2,3]}},termClear:true,term:{term:['>>> line = "14:02 ERROR db timeout\\n"','>>> line.strip().split()',"['14:02', 'ERROR', 'db', 'timeout']"]},
   flows:[{path:['log','py'],label:'line',tone:'slate'}]},
  {t:'JSON',b:'JSON is how APIs and many tools exchange data. json.load turns it into dicts and lists, json.dumps turns Python data back into text.',k:['idea','Key idea','JSON objects become dicts, arrays become lists, true becomes True, null becomes None.'],pill:'idea',tt:'JSON',focus:['py','dict'],
   set:{view:{title:'JSON',rows:JS,hl:[2,5]}},termClear:true,term:{term:['>>> data = json.load(open("status.json"))','>>> data["services"][0]',"{'name': 'nginx', 'state': 'running'}"]},
   once:[{path:['py','dict'],label:'{ }',tone:'green'}]},
  {t:'YAML',b:'YAML is the format of Ansible, Kubernetes and most CI tools. Indentation is the structure: a key indented under app belongs to app. yaml.safe_load turns it into a dict.',k:['problem','Watch out','yaml.load on an untrusted file can run code. Always use yaml.safe_load.'],pill:'problem',tt:'YAML',focus:['yaml','py','dict'],S:{pick:'D'},
   set:{view:{title:'loading YAML',rows:YM,hl:[2,5,6]},dict:{status:'run'}},termClear:true,term:{term:OUT.D},
   once:[{path:['yaml','py','dict'],label:'yaml',tone:'green'}]},
  {t:'YAML gotchas',b:'YAML guesses types, and sometimes guesses wrong. Tabs are not allowed. 1.10 becomes the number 1.1. Older parsers turn yes, no and even NO into booleans.',k:['tip','Remember','Quote anything that must stay text: versions, country codes, zip codes, IDs with leading zeros.'],pill:'problem',tt:'Gotchas',focus:['yaml','py'],S:{pick:'C'},
   set:{view:{title:'YAML gotchas',rows:GOT,hl:[1,2,3]},dict:{status:'stop'}},termClear:true,term:{term:['>>> yaml.safe_load("version: 1.10")',"{'version': 1.1}",'>>> yaml.safe_load("country: NO")',"{'country': False}"]}},
  {t:'Environment variables',b:'Settings that change per server, and secrets, come from environment variables, not from code. os.environ.get gives a default. os.environ["X"] fails at once if X is missing.',k:['problem','Watch out','A password in code ends up in Git history. Read it from the environment or a secret manager.'],pill:'problem',tt:'Env',focus:['env','py'],
   set:{view:{title:'environment',rows:ENV,hl:[1,2,6]}},termClear:true,term:{term:['$ export DB_HOST=db1.internal','$ python3','>>> os.environ["DB_HOST"]',"'db1.internal'",'>>> os.environ["DB_PASSWORD"]',"! KeyError: 'DB_PASSWORD'"]},
   once:[{path:['env','py'],label:'env',tone:'violet'}]},
  {t:'Write a report',b:'Build a dict with your results and write it as JSON. Other tools, dashboards and scripts can read it without any parsing tricks.',k:['tip','Remember','indent=2 makes the file readable for people. Machines do not care either way.'],pill:'idea',tt:'Report',focus:['dict','json'],
   set:{json:{show:true},view:{title:'writing a report',rows:REP,hl:[3]}},termClear:true,term:{term:['$ python3 report.py','$ cat report.json','{','  "host": "web1",','  "disk": 91,','  "alerts": ["disk"]','}']},
   once:[{path:['dict','json'],label:'dump',tone:'gold'}]},
  {t:'Try it: fix the config',b:'Four versions of app.yaml. Load each one and read what Python actually gets. Only one gives the structure the app expects.',k:['tip','Challenge','Find the one with the tab, the one with a key in the wrong place, and the one with a type surprise.'],pill:'problem',tt:'Try it',S:{pick:null},goal:true,focus:null,
   set:{json:{show:false},dict:{status:'none'},view:{title:'expected structure',rows:['app:','  name     text','  version  text "1.10"','  ports    list of numbers'],hl:[]}},termClear:true,term:{term:['>>> import yaml']}},
  {t:'Recap',b:'with open reads and writes files safely. json and yaml.safe_load turn text into dicts. Quote strings in YAML, read secrets from the environment, and write results as JSON.',k:['idea','Next up','APIs and requests: talk to web services from Python.'],pill:'recap',tt:'Recap',S:{pick:'D'},
   set:{json:{show:true},dict:{status:'run'},view:{title:'app.yaml',rows:Y.D,hl:[]}},termClear:true,term:{term:['>>> open · json · yaml.safe_load · os.environ']}}
 ]});
})();
