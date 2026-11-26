(function(){
var G=[['to','timeout=5'],['rfs','raise_for_status()'],['tok','auth token'],['retry','retry + backoff']];
function n(S){return G.filter(function(g){return S[g[0]]}).length}
function res(S){return {api:['200 OK','run'],auth:S.tok?['200 OK','run']:['401 FAIL','#e5534b'],flaky:S.retry&&S.rfs?['200 on retry','run']:S.rfs?['500 FAIL','#e5534b']:['"OK" (was 500!)','stop'],slow:S.to?['DOWN: timeout','#e5534b']:['hung forever','stop']}}
function code(S){var g='requests.get(url, headers=H'+(S.to?', timeout=5':'')+')',L=[{t:'import os, time, requests',tone:'gold'},S.tok?{t:'H = {"Authorization": "Bearer " + os.environ["TOKEN"]}',tone:'green'}:'H = {}','def check(url):'];
 if(S.retry){L.push({t:'    for i in range(3):',tone:'green'},{t:'        try:',tone:'green'},'            r = '+g);L.push(S.rfs?{t:'            r.raise_for_status(); return r.status_code',tone:'green'}:'            return r.status_code');L.push({t:'        except requests.RequestException:',tone:'green'},{t:'            time.sleep(2 ** i)  # 1s, 2s, 4s',tone:'green'})}
 else{L.push('    r = '+g);if(S.rfs)L.push({t:'    r.raise_for_status()',tone:'green'});L.push('    return r.status_code')}return L}
var CV=[0,1,2,3,4,5,6,7,8].map(function(i){return function(S){return code(S)[i]||''}});
var HTTP=[{t:'REQUEST',tone:'gold'},'GET /api/health HTTP/1.1','Host: api.example.com','Authorization: Bearer eyJhbGci...','',{t:'RESPONSE',tone:'green'},'HTTP/1.1 200 OK','Content-Type: application/json','{"status": "ok", "db": "up"}'];
var CODES=[{t:'2xx  success      200 OK  201 Created',tone:'green'},{t:'3xx  redirect     301 Moved  304 Not Modified',tone:'gold'},{t:'4xx  your fault   400 Bad Request',tone:'amber'},{t:'                  401 no/bad token',tone:'amber'},{t:'                  403 not allowed  404 not found',tone:'amber'},{t:'                  429 too many requests',tone:'amber'},{t:'5xx  their fault  500 error  502/503/504',tone:'red'},'','Retry 5xx and timeouts. Do not retry 4xx.'];
function run(S,A){var _id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===_id)fn()})}var R=res(S);S.ran=false;['api','auth','flaky','slow'].forEach(function(k,i){A.set(k,{status:'none'});L(200+i*500,function(){var ok=R[k][1]=='run';A.send(['hc',k],{label:'GET',tone:'blue',ok:k=='slow'?!!S.to:ok,denyAt:k})});L(1500+i*500,function(){A.set(k,{status:R[k][1],sub:R[k][0]})})});
 L(3400,function(){S.ran=true;A.term('term',['$ python3 health.py'].concat(['api','auth','flaky','slow'].map(function(k){var r=R[k];return (r[1]=='run'?'✓ ':'! ')+k+': '+r[0]})),true);A.hud({res:{v:n(S)==4?'all correct':(4-n(S))+' wrong',lv:n(S)==4?'good':'bad'}});A.refresh()})}
function EP(id,y,sub){return H.tile(id,314,y,'/'+id,sub,'blue',{w:124,status:'none'})}
LESSON('python','apis',{
 title:'APIs & requests',sub:'Call web APIs from Python, read status codes and JSON, and handle timeouts, auth and retries.',time:'15 min',level:'Intermediate',
 S:{to:false,rfs:false,tok:false,retry:false,ran:false},
 legend:[['#3fa456','correct answer'],['#e8a33a','wrong answer'],['#e5534b','failure reported']],
 hud:[{id:'sg',l:'Safeguards',v:function(S){return n(S)+' / 4'},lv:function(S){return n(S)==4?'good':'warn'}},{id:'ep',l:'Endpoints',v:'4',lv:'none'},{id:'res',l:'Last run',v:'not run',lv:'none'},{id:'lib',l:'Library',v:'requests',lv:'none'}],
 nodes:[
  H.box('hc',74,40,'health.py','blue',{center:true}),
  EP('api',46,'healthy'),EP('auth',124,'needs token'),EP('flaky',202,'500 sometimes'),EP('slow',280,'never answers'),
  {t:'crowd',id:'you',x:76,y:300,tone:'gold',label:'on-call',n:1,w:50,anchor:[128,300]},
  {t:'panel',id:'code',x:392,y:14,w:316,h:186,title:'health.py',rows:CV,fs:9},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('hc','api','blue'),H.lk('hc','auth','blue'),H.lk('hc','flaky','blue'),H.lk('hc','slow','blue'),H.lk('hc','you','gold',{dash:true})],
 controls:{title:'Harden health.py',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;A.set('code',{});A.hud({res:{v:'not run',lv:'none'}});A.fx('hc',S[g[0]]?'ok':'pulse')}}}).concat([{label:'run health.py',wide:true,click:function(S,A){run(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&n(S)==4;return [ok,ok?'Done. Every endpoint gets a true answer: auth works with the token, flaky passes on retry, and slow is reported DOWN instead of hanging.':S.ran?'Some answers are wrong: a hang, a fake OK or a missing token. Add the safeguard that fixes each one and run again.':'Goal: make health.py give a correct answer for all four endpoints. Run it bare first and read the results.']},
 learn:[['Read a request and response',0],['Know the status codes',1],['Call an API with requests',2],['Always set a timeout',3],['Turn errors into exceptions',4],['Send an auth token',5],['Retry with backoff',6]],
 steps:[
  {t:'Request and response',b:'An API call is a request: a method like GET, a URL, headers and maybe a body. The server sends back a response: a status code, headers and a body, usually JSON.',k:['idea','Key idea','GET reads, POST creates, PUT updates, DELETE removes. Most health checks are a GET.'],pill:'setup',tt:'HTTP',focus:['hc','api'],S:{to:false,rfs:false,tok:false,retry:false,ran:false},
   set:{api:{status:'none',sub:'healthy'},auth:{status:'none',sub:'needs token'},flaky:{status:'none',sub:'500 sometimes'},slow:{status:'none',sub:'never answers'},code:{title:'one HTTP exchange',rows:HTTP,hl:[1,6]}},hud:{res:{v:'not run',lv:'none'}},termClear:true,term:{term:['$ curl -s https://api.example.com/health','{"status": "ok", "db": "up"}']},
   once:[{path:['hc','api'],label:'GET',tone:'blue'},{path:['api','hc'],label:'200',tone:'green',delay:1000}]},
  {t:'Status codes',b:'The first digit tells you who is at fault. 2xx worked, 4xx means your request was wrong, 5xx means the server failed.',k:['tip','Remember','401 means "who are you?" (no or bad token). 403 means "I know you, but no".'],pill:'idea',tt:'Codes',focus:['hc','auth','flaky'],
   set:{code:{title:'status codes',rows:CODES,hl:[0,3,6]}},termClear:true,term:{term:['$ curl -s -o /dev/null \\','    -w "%{http_code}" .../auth','401','$ curl ... /flaky','500']},
   once:[{path:['hc','auth'],label:'401',tone:'amber',ok:false},{path:['hc','flaky'],label:'500',tone:'red',ok:false,delay:800}]},
  {t:'Call an API with requests',b:'requests.get sends the request and returns a response object: r.status_code is the number, r.json() turns the body into a dict.',k:['idea','Key idea','r.json() is the same dict you met in the JSON lesson. From here it is plain Python.'],pill:'idea',tt:'requests',focus:['hc','api'],
   set:{code:{title:'health.py',rows:CV,hl:[3,4]}},termClear:true,term:{term:['>>> r = requests.get(URL, timeout=5)','>>> r.status_code','200','>>> r.json()["db"]',"'up'"]},
   once:[{path:['hc','api'],label:'GET',tone:'blue'}]},
  {t:'Always set a timeout',b:'requests waits forever by default. One server that never answers freezes your script, and the next cron run piles on top of it.',k:['problem','Watch out','No timeout is the most common bug in scripts that call APIs. Add timeout= to every request.'],pill:'problem',tt:'Timeout',focus:['hc','slow'],S:{to:true},
   set:{slow:{status:'#e5534b',sub:'DOWN: timeout'},code:{title:'health.py',rows:CV,hl:[3]}},termClear:true,term:{term:['>>> requests.get(SLOW, timeout=5)','! ReadTimeout: read timed out (5s)']},
   once:[{path:['hc','slow'],label:'⏱',tone:'red',ok:false}]},
  {t:'Turn errors into exceptions',b:'A 500 response is still a response, so requests does not raise. r.raise_for_status() raises HTTPError for 4xx and 5xx, so errors cannot pass as success.',k:['tip','Remember','Wrap the call in try / except requests.RequestException to catch timeouts, DNS failures and HTTP errors in one place.'],pill:'idea',tt:'Errors',focus:['hc','flaky'],S:{rfs:true},
   set:{flaky:{status:'#e5534b',sub:'500 FAIL'},code:{title:'health.py',rows:CV,hl:[4]}},termClear:true,term:{term:['>>> r = requests.get(FLAKY, timeout=5)','>>> r.raise_for_status()','! HTTPError: 500 Server Error']},
   once:[{path:['hc','flaky'],label:'500',tone:'red',ok:false}]},
  {t:'Auth tokens',b:'Most APIs want a token in the Authorization header. Read it from an environment variable and send it with every request.',k:['problem','Watch out','Never print a token or put it in a URL. URLs end up in logs and browser history.'],pill:'problem',tt:'Auth',focus:['hc','auth'],S:{tok:true},
   set:{auth:{status:'run',sub:'200 OK'},code:{title:'health.py',rows:CV,hl:[1]}},termClear:true,term:{term:['$ export TOKEN=$(cat ~/.secrets/api_token)','>>> requests.get(AUTH, headers=H,','...              timeout=5).status_code','200']},
   once:[{path:['hc','auth'],label:'🔑',tone:'green'}]},
  {t:'Retry with backoff',b:'Networks and servers have bad seconds. Retry a failed GET a few times and wait longer each time: 1, 2, 4 seconds. That rides out a blip without hammering the server.',k:['problem','Watch out','Retry 5xx and timeouts only. A 401 or 404 will not fix itself, and retrying a POST can create duplicates.'],pill:'idea',tt:'Retry',focus:['hc','flaky'],S:{retry:true},
   set:{flaky:{status:'run',sub:'200 on retry'},code:{title:'health.py',rows:CV,hl:[3,4,7,8]}},termClear:true,term:{term:['try 1: 500  wait 1s','try 2: 200 OK']},
   once:[{path:['hc','flaky'],label:'1',tone:'red',ok:false},{path:['hc','flaky'],label:'2',tone:'green',delay:1700}]},
  {t:'Try it: a health check you can trust',b:'Turn safeguards on or off and run health.py against four endpoints. Each endpoint hides a different real-world problem.',k:['tip','Challenge','Run with no safeguards and notice the fake "OK" on /flaky. Why is that worse than an error?'],pill:'problem',tt:'Try it',S:{to:false,rfs:false,tok:false,retry:false,ran:false},goal:true,focus:null,
   set:{api:{status:'none',sub:'healthy'},auth:{status:'none',sub:'needs token'},flaky:{status:'none',sub:'500 sometimes'},slow:{status:'none',sub:'never answers'},code:{title:'health.py',rows:CV,hl:[]}},hud:{res:{v:'not run',lv:'none'}},termClear:true,term:{term:['$ cat health.py   # bare version']}},
  {t:'Recap',b:'Read status codes, set a timeout on every call, raise on errors, send tokens from the environment, and retry only what can recover.',k:['idea','Next up','Python automation scripts: argparse, logging and subprocess.'],pill:'recap',tt:'Recap',S:{to:true,rfs:true,tok:true,retry:true,ran:true},
   set:{api:{status:'run',sub:'200 OK'},auth:{status:'run',sub:'200 OK'},flaky:{status:'run',sub:'200 on retry'},slow:{status:'#e5534b',sub:'DOWN: timeout'},code:{title:'health.py',rows:CV,hl:[]}},hud:{res:{v:'all correct',lv:'good'}},termClear:true,term:{term:['$ python3 health.py','✓ api ✓ auth ✓ flaky  ! slow: DOWN']}}
 ]});
})();
