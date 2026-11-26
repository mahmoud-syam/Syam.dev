(function(){
function n(S){var x=2140000;if(S.app)x*=0.08;if(S.err)x*=0.03;if(S.lab&&S.json)x*=0.08;return Math.round(x)}
function fmt(x){return x.toLocaleString('en-US')}
function found(S){return S.app&&S.err&&S.json&&S.lab}
var NOISE=['sample of matching lines',{t:'12:04:01 web   GET /health 200 2ms',tone:'gold'},{t:'12:04:01 cart  INFO item added sku=4411',tone:'gold'},{t:'12:04:02 checkout INFO order 8812 created',tone:'gold'},{t:'12:04:02 web   GET /static/app.js 304',tone:'gold'},{t:'12:04:02 auth  INFO token refreshed',tone:'gold'},'',{t:'Too many lines to read. Narrow it down.',tone:'red'}];
var ROOT=['411 lines, one cause',{t:'level=error status=502 path=/pay',tone:'gold'},{t:'msg="payment failed"',tone:'gold'},{t:'cause="dial tcp bank-api:443: i/o timeout"',tone:'red'},{t:'trace_id=9f3c1a7e',tone:'gold'},'',{t:'Every failing request waits on bank-api.',tone:'green'},'Next: follow trace 9f3c1a7e to see where.'];
var SHIP=['How logs get to one place',{t:'1 apps write to stdout (one line per event)',tone:'gold'},{t:'2 an agent on every node tails the logs',tone:'gold'},'  Grafana Alloy, Fluent Bit, Filebeat',{t:'3 adds labels: namespace, app, pod',tone:'gold'},{t:'4 ships to the log store',tone:'gold'},'  Loki, Elasticsearch, CloudWatch Logs',{t:'5 you search them in Grafana / Kibana',tone:'gold'}];
var CMP=['Loki vs Elasticsearch',{t:'Loki     indexes labels only',tone:'gold'},'         cheap to store, grep-like search',{t:'ELK      indexes every word',tone:'gold'},'         fast full-text search, heavier to run','',{t:'Both: keep 7-30 days, archive the rest',tone:'green'},{t:'Never log passwords, tokens or card data',tone:'red'}];
var JSONL=['Structured logs',{t:'bad:  ERROR payment failed for 8812',tone:'red'},{t:'good: {"level":"error","order":8812,',tone:'green'},{t:'       "msg":"payment failed",',tone:'green'},{t:'       "trace_id":"9f3c1a7e"}',tone:'green'},'','Fields can be filtered, counted and joined','to traces. Free text can only be grepped.'];
var LQL=['LogQL in four parts',{t:'{app="checkout"}      stream selector',tone:'gold'},{t:'|= "error"            line filter',tone:'gold'},{t:'| json                parse fields',tone:'gold'},{t:'| status >= 500       field filter',tone:'gold'},'','Selector first: it decides how much data',' Loki has to read at all.'];
function q(S){var a=['{namespace="shop"'+(S.app?', app="checkout"':'')+'}'];if(S.err)a.push('  |= "error"');var t=[];if(S.json)t.push('| json');if(S.lab&&S.json)t.push('| status >= 500');if(t.length)a.push('  '+t.join(' '));return a}
function run(S,A,msg){var id=S.rid=(S.rid||0)+1;A.send(['graf','loki'],{label:'query',tone:'violet',ok:true});
 var c=n(S);A.term('term',(msg?msg:[]).concat(q(S).map(function(l,i){return (i?'':'$ ')+l}),[(found(S)?'':'# ')+fmt(c)+' lines in the last hour'+(found(S)?'  ✓':'')]),true);
 A.after(700,function(){if(S.rid!==id)return;
  A.set('info',{title:found(S)?'root cause':'results',rows:found(S)?ROOT:NOISE,hl:found(S)?[3]:[7]});if(found(S)){S.done=true;A.set('checkout',{status:'fail',sub:'502 → bank-api'})}A.refresh()})}
function tog(S,A,k){S[k]=!S[k];var m=null;if(k=='lab'&&S.lab&&!S.json)m=['! status is not a field yet: add | json first'];if(!found(S))A.set('checkout',{status:'run',sub:'orders, payment'});run(S,A,m);A.refresh()}
LESSON('obs','logs',{
 title:'Logs: Loki & ELK',sub:'Collect every pod\'s logs in one place, then cut millions of lines down to the one that matters.',time:'15 min',level:'Intermediate',
 S:{app:false,err:false,json:false,lab:false,done:false},
 legend:[['#3fa456','app pod'],['#3b82c4','log agent'],['#e8a33a','log store'],['#5a4aa8','query']],
 hud:[{id:'l',l:'Lines',v:function(S){var c=n(S);return c>=1e6?(c/1e6).toFixed(1)+' M':c>=1e4?Math.round(c/1e3)+' k':fmt(c)},lv:function(S){return found(S)?'good':n(S)>1e4?'bad':'warn'}},{id:'r',l:'Range',v:'last 1 h',lv:'none'},{id:'s',l:'Store',v:'Loki',lv:'none'},{id:'c',l:'Root cause',v:function(S){return found(S)?'bank-api':'—'},lv:function(S){return found(S)?'good':'none'}}],
 nodes:[
  H.tile('web',84,48,'web','frontend','green',{w:124,status:'run'}),
  H.tile('cart',84,128,'cart','basket','green',{w:124,status:'run'}),
  H.tile('checkout',84,208,'checkout','orders, payment','green',{w:124,status:'run'}),
  H.tile('agent',268,128,'Alloy agent','tails stdout','blue',{w:128}),
  H.box('loki',268,290,'Loki','amber',{center:true}),
  H.tile('graf',92,350,'Grafana','Explore','violet',{w:124}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'shipping logs',rows:SHIP,fs:9.3},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'logcli'}],
 links:[H.lk('web','agent','blue',{dash:true}),H.lk('cart','agent','blue',{dash:true}),H.lk('checkout','agent','blue',{dash:true}),H.lk('agent','loki','amber'),H.lk('graf','loki','violet')],
 controls:{title:'Build the LogQL query',groups:[{items:[['app','app="checkout"'],['err','|= "error"'],['json','| json'],['lab','| status >= 500']].map(function(x){return {label:x[1],wide:true,on:function(S){return !!S[x[0]]},click:function(S,A){tog(S,A,x[0])}}})}]},
 goal:function(S){var ok=found(S);return [ok,ok?'Done. 2.1 million lines became 411, and they all say the same thing: checkout times out calling bank-api.':'Goal: checkout returns 502s. Build a query that cuts 2.1 million lines down to the few that explain why.']},
 learn:[['Know why logs are centralised',0],['Ship logs with an agent',1],['Compare Loki and ELK',2],['Write structured logs',3],['Query with LogQL',4],['Turn logs into metrics',5],['Keep labels and secrets safe',6]],
 steps:[
  {t:'Why one place for logs',b:'Pods restart, get rescheduled and are deleted, and their logs go with them. kubectl logs shows one pod at a time. Central logging keeps every line, from every pod, searchable.',k:['problem','Watch out','kubectl logs --previous only shows the last crashed container. After that, the logs are gone.'],pill:'setup',tt:'Why',focus:['web','cart','checkout'],S:{app:false,err:false,json:false,lab:false,done:false},
   set:{info:{title:'shipping logs',rows:SHIP,hl:[]},checkout:{status:'run',sub:'orders, payment'}},termClear:true,term:{term:['$ kubectl logs checkout-7d9f-x2k','Error from server (NotFound): pods','  "checkout-7d9f-x2k" not found']}},
  {t:'Ship logs with an agent',b:'Apps write to stdout. An agent on every node, like Grafana Alloy or Fluent Bit, tails those logs, adds labels such as namespace, app and pod, and ships them to the log store.',k:['tip','Remember','Promtail, the old Loki agent, is replaced by Grafana Alloy. The idea is the same.'],pill:'idea',tt:'Ship',focus:['web','cart','checkout','agent','loki'],
   set:{info:{title:'shipping logs',rows:SHIP,hl:[1,2,4,5]}},termClear:true,term:{term:['$ kubectl -n monitoring get ds','NAME    DESIRED  READY','alloy   3        3']},
   flows:[{path:['web','agent','loki'],label:'logs',tone:'blue'},{path:['cart','agent','loki'],label:'logs',tone:'blue'},{path:['checkout','agent','loki'],label:'logs',tone:'blue'}]},
  {t:'Loki or ELK',b:'Loki indexes only the labels and stores the lines compressed, so it is cheap. Elasticsearch indexes every word, which makes full-text search fast but costs more to run. Kibana is its UI.',k:['idea','Key idea','Loki: metrics-style labels for logs. ELK: a search engine for logs. Both are common in jobs.'],pill:'idea',tt:'Stores',focus:['loki'],
   set:{info:{title:'stores',rows:CMP,hl:[1,3,6]}},termClear:true,term:{term:['# ELK = Elasticsearch + Logstash + Kibana','# (+ Beats) — the classic stack','# PLG = Promtail/Alloy + Loki + Grafana']}},
  {t:'Structured logs',b:'Log JSON instead of free text. Fields like level, status and trace_id can then be filtered, counted and linked to traces.',k:['tip','Remember','Add a trace_id to every log line. It joins logs to traces in the next lesson.'],pill:'idea',tt:'JSON',focus:['checkout'],
   set:{info:{title:'structured',rows:JSONL,hl:[2,3,4]}},termClear:true,term:{term:['$ kubectl logs deploy/checkout | tail -1','{"level":"info","msg":"order created",','"order":8812,"trace_id":"77ab01c2"}']}},
  {t:'LogQL',b:'A LogQL query starts with a label selector that picks the streams, then filters lines, parses fields and filters on them. Each step makes the result smaller.',k:['problem','Watch out','A selector like {namespace="shop"} reads every app in the namespace. Narrow the labels first, it is the fastest filter.'],pill:'idea',tt:'LogQL',focus:['graf','loki'],
   set:{info:{title:'LogQL',rows:LQL,hl:[1,2,3,4]}},termClear:true,term:{term:['$ logcli query \'{app="checkout"} |= "error"\'','{"level":"error","status":502,...}']},
   once:[{path:['graf','loki'],label:'query',tone:'violet'}]},
  {t:'Metrics from logs',b:'LogQL can count lines over time, so you can graph and alert on errors in logs when the app has no metric for them.',k:['tip','Remember','Prefer real metrics for alerts. Use log metrics when you cannot change the app.'],pill:'idea',tt:'Count',focus:['graf','loki'],
   set:{info:{title:'LogQL',rows:['Count errors per app',{t:'sum by (app) (',tone:'gold'},{t:'  count_over_time(',tone:'gold'},{t:'    {namespace="shop"} | json',tone:'gold'},{t:'      | level="error" [5m]))',tone:'gold'},'',{t:'checkout  35   cart  1   web  0',tone:'green'}],hl:[6]}},termClear:true,term:{term:['# same query in a Grafana panel gives','# an error-lines graph per app']}},
  {t:'Labels, retention, secrets',b:'Keep labels few and low-cardinality: namespace, app, level. Put IDs in the log line, not in labels. Set a retention, and never log secrets.',k:['problem','Watch out','A label like user_id creates one stream per user and can overload Loki.'],pill:'idea',tt:'Safety',focus:['agent','loki'],
   set:{info:{title:'stores',rows:CMP,hl:[6,7]}},termClear:true,term:{term:['# loki config','limits_config:','  retention_period: 720h   # 30 days']}},
  {t:'Try it: find why checkout fails',b:'Checkout returns 502s. There are 2.1 million log lines from the last hour. Add one part of the query at a time and watch the line count drop.',k:['tip','Challenge','Try the status filter before | json. Why does it not work yet?'],pill:'problem',tt:'Try it',S:{app:false,err:false,json:false,lab:false,done:false},goal:true,focus:null,
   set:{info:{title:'results',rows:NOISE,hl:[7]},checkout:{status:'run',sub:'orders, payment'}},termClear:true,term:{term:['# query: {namespace="shop"}','# 2,140,000 lines in the last hour']}},
  {t:'Recap',b:'Agents ship every pod\'s logs to Loki or Elasticsearch. Structured JSON logs and a narrow LogQL query take you from millions of lines to the root cause.',k:['idea','Next up','Traces: follow one request through every service and find the slow hop.'],pill:'recap',tt:'Recap',S:{app:true,err:true,json:true,lab:true,done:true},
   set:{info:{title:'root cause',rows:ROOT,hl:[3]},checkout:{status:'fail',sub:'502 → bank-api'}},termClear:true,term:{term:['$ {namespace="shop", app="checkout"}','  |= "error" | json | status >= 500','411 lines in the last hour  ✓']}}
 ]});
})();
