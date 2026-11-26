(function(){
var SV=[['web1','prod',45],['web2','prod',72],['web3','prod',88],['db1','prod',91],['dev1','dev',95],['stg1','staging',83]];
var EX={A:['s["disk"] > 80',function(s){return s[2]>80}],B:['s["env"] == "prod"',function(s){return s[1]=='prod'}],C:['s["env"] == "prod" and s["disk"] > 80',function(s){return s[1]=='prod'&&s[2]>80}],D:['s["env"] == "prod" or s["disk"] > 80',function(s){return s[1]=='prod'||s[2]>80}]};
function sel(k){return k?SV.filter(EX[k][1]).map(function(s){return s[0]}):[]}
var CODE=[{t:'servers = [',tone:'gold'},'  {"name": "web1", "env": "prod", "disk": 45},','  ...  # 6 servers','],',function(S){return {t:'def critical(s):',tone:'gold'}},function(S){return '    return '+(S.ex?EX[S.ex][0]:'???')},'for s in servers:','    if critical(s):','        print(f"{s[\'name\']}: {s[\'disk\']}%")'];
var TYPES=[{t:'name  = "web1"      # str',tone:'gold'},{t:'disk  = 45          # int',tone:'gold'},{t:'load  = 0.75        # float',tone:'gold'},{t:'alive = True        # bool',tone:'gold'},'',{t:'print(f"{name} disk {disk}%")',tone:'green'},'# web1 disk 45%'];
var DICT=['s = {"name": "web1", "env": "prod", "disk": 45}','',{t:'s["disk"]            # 45',tone:'gold'},{t:'s["owner"]           # KeyError!',tone:'red'},{t:'s.get("owner", "-")  # "-"  (safe)',tone:'green'},'',{t:'servers[0]["name"]   # "web1"',tone:'gold'},'len(servers)         # 6'];
var FN=[{t:'def critical(s, limit=80):',tone:'gold'},'    return s["env"] == "prod" and \\','           s["disk"] > limit','',{t:'critical(db1)        # True',tone:'green'},{t:'critical(db1, 95)    # False',tone:'gold'}];
var EXC=[{t:'try:',tone:'gold'},'    disk = get_disk(host)','except TimeoutError:',{t:'    print(f"{host}: unreachable")',tone:'amber'},'    continue',{t:'except KeyError as e:',tone:'gold'},'    print(f"missing field {e}")','',{t:'# one bad host no longer stops the loop',tone:'green'}];
var MOD=[{t:'import json, os, sys',tone:'gold'},{t:'from pathlib import Path',tone:'gold'},'',{t:'$ python3 -m venv .venv',tone:'green'},{t:'$ source .venv/bin/activate',tone:'green'},{t:'$ pip install requests pyyaml',tone:'green'},{t:'$ pip freeze > requirements.txt',tone:'green'}];
function paint(S,A){var hit=sel(S.ex);SV.forEach(function(s){A.set(s[0],{status:!S.ex?'none':hit.indexOf(s[0])>=0?'#e5534b':'run'})});A.set('code',{});A.refresh()}
function T(s,x,y){var tone=s[1]=='prod'?'blue':s[1]=='dev'?'violet':'amber';return H.tile(s[0],x,y,s[0],s[1]+' · '+s[2]+'%',tone,{w:112,status:'none'})}
LESSON('python','basics',{
 title:'Python basics',sub:'Variables, lists, dicts, loops, functions and exceptions, using a real server inventory.',time:'15 min',level:'Beginner',
 S:{ex:null},
 legend:[['#e5534b','selected (critical)'],['#3fa456','not selected'],['#bdb4a8','not checked']],
 hud:[{id:'n',l:'Servers',v:'6',lv:'none'},{id:'ex',l:'Condition',v:function(S){return S.ex?'option '+S.ex:'none'},lv:'none'},{id:'hit',l:'Selected',v:function(S){var h=sel(S.ex);return S.ex?h.length+' of 6':'—'},lv:function(S){return S.ex=='C'?'good':S.ex?'warn':'none'}},{id:'py',l:'Python',v:'3.12',lv:'none'}],
 nodes:[T(SV[0],70,46),T(SV[1],190,46),T(SV[2],310,46),T(SV[3],70,124),T(SV[4],190,124),T(SV[5],310,124),
  H.box('script',190,236,'report.py','blue',{center:true}),
  {t:'crowd',id:'you',x:70,y:360,tone:'gold',label:'you',n:1,w:48,anchor:[118,360]},
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'report.py',rows:CODE,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'python3'}],
 links:SV.map(function(x){return H.lk('script',x[0],'red',{dash:true,on:function(S){return sel(S.ex).indexOf(x[0])>=0}})}).concat([H.lk('you','script','gold')]),
 controls:{title:'Pick the condition',groups:[{items:['A','B','C','D'].map(function(k){return {label:EX[k][0],wide:true,on:function(S){return S.ex==k},click:function(S,A){S.ex=k;var h=sel(k);
   SV.forEach(function(s,i){A.after(i*220,function(){A.send(['script',s[0]],{label:'?',tone:'blue',ok:true})})});A.after(1700,function(){paint(S,A)});
   A.term('term',['$ python3 report.py'].concat(h.map(function(n){var s=SV.filter(function(x){return x[0]==n})[0];return s[0]+': '+s[2]+'%'})),true)}}})},
  {items:[{label:'s["owner"]',wide:true,click:function(S,A){A.fx('script','no');A.term('term',['>>> servers[0]["owner"]','! KeyError: \'owner\'','>>> servers[0].get("owner", "-")',"'-'"])}}]}]},
 goal:function(S){var ok=S.ex=='C';return [ok,ok?'Done. and needs both conditions: production AND above 80%. dev1 is full but not prod, web2 is prod but not full.':'Goal: list only production servers whose disk is above 80%. Try each condition and compare who gets selected.']},
 learn:[['Know when to use Python',0],['Use variables and types',1],['Work with lists and dicts',2],['Loop and decide',3],['Write functions',4],['Handle exceptions',5],['Use modules and venv',6]],
 steps:[
  {t:'Why Python after Bash?',b:'Bash is great for gluing commands together. When you need structured data, real error handling or libraries for APIs and clouds, Python is easier to read and safer to grow.',k:['idea','Key idea','Rule of thumb: under ~50 lines of commands, Bash. Data, logic or APIs, Python.'],pill:'setup',tt:'Why',focus:['script','you'],S:{ex:null},
   set:{code:{title:'report.py',rows:CODE,hl:[]}},termClear:true,term:{term:['$ python3 --version','Python 3.12.3','$ python3 report.py']},
   once:[{path:['you','script'],label:'run',tone:'gold'}]},
  {t:'Variables and types',b:'A variable is a name for a value. Python figures out the type: text is str, whole numbers int, decimals float, True and False bool. f-strings put values inside text.',k:['tip','Remember','f"{name} disk {disk}%" is the clearest way to build messages. Note the f before the quote.'],pill:'idea',tt:'Types',focus:['web1'],
   set:{code:{title:'types',rows:TYPES,hl:[5]}},termClear:true,term:{term:['>>> disk = 45','>>> type(disk)',"<class 'int'>",'>>> f"web1 disk {disk}%"',"'web1 disk 45%'"]},fx:[{n:'web1',k:'pulse'}]},
  {t:'Lists and dicts',b:'A list holds items in order: servers[0] is the first. A dict holds named fields: s["disk"]. An inventory is usually a list of dicts, exactly like JSON.',k:['problem','Watch out','s["owner"] crashes with KeyError if the field is missing. s.get("owner", "-") returns a default instead.'],pill:'idea',tt:'Data',focus:['web1','web2','web3','db1','dev1','stg1'],
   set:{code:{title:'dicts',rows:DICT,hl:[3,4]}},termClear:true,term:{term:['>>> servers[3]["name"]',"'db1'",'>>> [s["name"] for s in servers][:3]',"['web1', 'web2', 'web3']"]}},
  {t:'Loops and conditions',b:'for s in servers runs the block once per server. if decides which ones to print. Indentation is not decoration in Python: it defines the block.',k:['idea','Key idea','and needs both sides true, or needs one. Combine conditions to say exactly what you mean.'],pill:'idea',tt:'Loop',focus:['script','web1','web2','web3','db1','dev1','stg1'],S:{ex:'A'},
   set:{code:{title:'report.py',rows:CODE,hl:[6,7,8]},web1:{status:'run'},web2:{status:'run'},web3:{status:'#e5534b'},db1:{status:'#e5534b'},dev1:{status:'#e5534b'},stg1:{status:'#e5534b'}},termClear:true,term:{term:['$ python3 report.py','web3: 88%','db1: 91%','dev1: 95%','stg1: 83%']},
   once:SV.map(function(s,i){return {path:['script',s[0]],label:'?',tone:'blue',delay:i*300}})},
  {t:'Functions',b:'def gives a block a name and inputs. critical(s) returns True or False, so the loop reads like English. Default arguments, like limit=80, make it flexible.',k:['tip','Remember','A function should do one thing and return a result. Printing inside it makes it harder to reuse.'],pill:'idea',tt:'def',focus:['script','db1'],S:{ex:'C'},
   set:{code:{title:'functions',rows:FN,hl:[0,4,5]},web1:{status:'run'},web2:{status:'run'},web3:{status:'#e5534b'},db1:{status:'#e5534b'},dev1:{status:'run'},stg1:{status:'run'}},termClear:true,term:{term:['>>> critical({"env":"prod","disk":91})','True','>>> critical({"env":"dev","disk":95})','False']}},
  {t:'Exceptions',b:'When something fails, Python raises an exception and stops. try / except catches the ones you expect, so one unreachable host does not kill the whole report.',k:['problem','Watch out','Never write a bare except: that hides every bug. Catch the specific error you expect.'],pill:'problem',tt:'try',focus:['script','dev1'],
   set:{code:{title:'exceptions',rows:EXC,hl:[2,3]}},termClear:true,term:{term:['$ python3 report.py','dev1: unreachable','web3: 88%','db1: 91%']},
   once:[{path:['script','dev1'],label:'⏱',tone:'red',ok:false}]},
  {t:'Modules and virtual environments',b:'import loads code: json, os and pathlib come with Python, requests and pyyaml come from pip. A virtual environment keeps each project\'s packages separate.',k:['tip','Remember','requirements.txt lists your packages, so anyone can rebuild the same environment with pip install -r.'],pill:'idea',tt:'venv',focus:['script'],
   set:{code:{title:'modules',rows:MOD,hl:[3,4,5]}},termClear:true,term:{term:['$ python3 -m venv .venv','$ source .venv/bin/activate','(.venv) $ pip install requests','Successfully installed requests-2.32.3']}},
  {t:'Try it: find the critical servers',b:'Pick the condition that selects only production servers with disk above 80%. Watch the loop check every server.',k:['tip','Challenge','Try or before and. Then press s["owner"] to see a KeyError and its safe fix.'],pill:'problem',tt:'Try it',S:{ex:null},goal:true,focus:null,
   set:{code:{title:'report.py',rows:CODE,hl:[5]},web1:{status:'none'},web2:{status:'none'},web3:{status:'none'},db1:{status:'none'},dev1:{status:'none'},stg1:{status:'none'}},termClear:true,term:{term:['>>> len(servers)','6']}},
  {t:'Recap',b:'Lists and dicts hold your data, for and if process it, functions name the logic, and try / except keeps one failure from stopping everything.',k:['idea','Next up','Files, JSON and YAML: read configs and write reports.'],pill:'recap',tt:'Recap',S:{ex:'C'},
   set:{code:{title:'report.py',rows:CODE,hl:[]},web1:{status:'run'},web2:{status:'run'},web3:{status:'#e5534b'},db1:{status:'#e5534b'},dev1:{status:'run'},stg1:{status:'run'}},termClear:true,term:{term:['$ python3 report.py','web3: 88%','db1: 91%']}}
 ]});
})();
