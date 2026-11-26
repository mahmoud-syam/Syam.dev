(function(){
var SP={web:['web','GET /checkout','2.40','0.05','████████████████'],checkout:['checkout','POST /order','2.35','0.09',' ███████████████'],inv:['inventory','reserve','0.04','0.04',' ▌'],db:['db','INSERT order','0.01','0.01','  ▏'],pay:['payment','charge','2.21','0.11','  ██████████████'],bank:['bank-api','POST /charge','2.10','2.10','   █████████████']};
var ORDER=['web','checkout','inv','db','pay','bank'];
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s}
function wf(hl){return [{t:'trace 9f3c1a7e   total 2.40 s',tone:'gold'}].concat(ORDER.map(function(k){var p=SP[k];return {t:pad(p[0],10)+pad(p[4],18)+p[2]+'s',tone:hl==k?(k=='bank'?'red':'gold'):k=='bank'&&hl=='all'?'red':'green'}}),['',{t:'bars = when each span ran inside the request',tone:'gold'}])}
var MODEL=['Trace and spans',{t:'trace     one request, one trace_id',tone:'gold'},{t:'span      one operation: name, start,',tone:'gold'},'          duration, status, attributes',{t:'parent    each span knows who called it',tone:'gold'},'','Spans from every service join into one tree','because they share the trace_id.'];
var PROP=['Context propagation',{t:'traceparent: 00-9f3c1a7e…-b7ad6b71…-01',tone:'gold'},'             version-trace_id-span_id-flags','','Every outgoing call carries this header.','The next service continues the same trace.','',{t:'One service drops it → the trace breaks.',tone:'red'}];
var OTEL=['OpenTelemetry (OTel)',{t:'SDK / auto-instrumentation in each app',tone:'gold'},{t:'  → OTLP → OTel Collector',tone:'gold'},{t:'      batch, sample, add k8s labels',tone:'gold'},{t:'  → Tempo, Jaeger or a vendor',tone:'gold'},'',{t:'One standard for traces, metrics and logs.',tone:'green'},'Switch backends without touching the code.'];
var SAMP=['Sampling',{t:'head   decide at the start: keep 10%',tone:'gold'},'       cheap, but may drop the slow one',{t:'tail   decide at the end, in the Collector',tone:'gold'},'       keep all errors and slow traces',' + a small share of the normal ones','',{t:'Keep what you will need to debug.',tone:'green'}];
var PIL=['Three signals, one story',{t:'metric   p95 latency jumped to 2.4 s',tone:'gold'},{t:'  ↓ exemplar: a trace_id on the graph',tone:'gold'},{t:'trace    9f3c1a7e: bank-api took 2.1 s',tone:'gold'},{t:'  ↓ trace_id in every log line',tone:'gold'},{t:'logs     dial tcp bank-api:443: timeout',tone:'red'},'','Metrics: is it broken. Traces: where. Logs: why.'];
function pick(S,A,k){S.p=k;var p=SP[k],ok=k=='bank';if(ok)S.done=true;A.set('info',{title:'waterfall',rows:wf(k),hl:[ORDER.indexOf(k)+1]});
 A.set('bank',{status:S.done?'fail':'none'});
 var msg={web:'web waits for checkout almost all the time',checkout:'checkout mostly waits for payment',inv:'inventory is fast',db:'db is fast',pay:'payment mostly waits for bank-api',bank:'bank-api: the time is spent here'}[k];
 A.term('term',['# span '+p[0]+' '+p[1],'duration '+p[2]+' s   self time '+p[3]+' s',(ok?'✓ ':'! ')+msg],true);
 if(ok)A.send(['web','checkout','pay','bank'],{label:'2.1 s',tone:'red',ok:true});A.refresh()}
LESSON('obs','traces',{
 title:'Tracing with OpenTelemetry',sub:'Follow one request through every service and see exactly where the time goes.',time:'15 min',level:'Intermediate',
 S:{p:null,done:false},
 legend:[['#3fa456','service'],['#e5534b','slow span'],['#3b82c4','telemetry'],['#e8a33a','trace store']],
 hud:[{id:'t',l:'Trace',v:'9f3c1a7e',lv:'none'},{id:'d',l:'Duration',v:'2.40 s',lv:'bad'},{id:'s',l:'Spans',v:'6',lv:'none'},{id:'b',l:'Bottleneck',v:function(S){return S.done?'bank-api':'—'},lv:function(S){return S.done?'good':'none'}}],
 nodes:[
  H.tile('web',84,40,'web','GET /checkout','green',{w:124,status:'run'}),
  H.tile('checkout',84,120,'checkout','POST /order','green',{w:124,status:'run'}),
  H.tile('inv',84,200,'inventory','+ db','green',{w:124,status:'run'}),
  H.tile('pay',260,120,'payment','charge','green',{w:124,status:'run'}),
  H.tile('bank',260,200,'bank-api','external','red',{w:124,status:'none'}),
  H.tile('col',84,312,'OTel Collector','OTLP :4317','blue',{w:134}),
  H.box('tempo',262,318,'Tempo','amber',{center:true}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'waterfall',rows:wf(null),fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'trace explorer'}],
 links:[H.lk('web','checkout','green'),H.lk('checkout','inv','green'),H.lk('checkout','pay','green'),H.lk('pay','bank','red'),H.lk('col','tempo','amber'),H.lk('inv','col','blue',{dash:true})],
 controls:{title:'Which span is the bottleneck?',groups:[{items:ORDER.map(function(k){return {label:SP[k][0],wide:true,on:function(S){return S.p==k},click:function(S,A){pick(S,A,k)}}})}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. web, checkout and payment are slow only because they wait. bank-api spends 2.1 s itself: that is the bottleneck.':'Goal: this request took 2.4 s. Open each span and compare its total time with its self time. Find the one that is slow by itself.']},
 learn:[['Know what traces add',0],['Read traces and spans',1],['Propagate context',2],['Instrument with OpenTelemetry',3],['Choose a sampling strategy',4],['Link metrics, traces and logs',5],['Read a waterfall',6]],
 steps:[
  {t:'Where did the time go?',b:'Metrics say checkout is slow. Logs say some calls time out. A trace shows one request\'s full path through every service, with how long each step took.',k:['idea','Key idea','In a system of many services, a trace is the only view of a single request from start to end.'],pill:'setup',tt:'Why',focus:['web','checkout','pay','bank'],S:{p:null,done:false},
   set:{info:{title:'waterfall',rows:wf(null),hl:[]},bank:{status:'none'}},termClear:true,term:{term:['# p95 latency  2.4 s   (normal 0.3 s)','# which service is slow?']},
   flows:[{path:['web','checkout','pay','bank'],label:'request',tone:'green'}]},
  {t:'Traces and spans',b:'A trace is one request. It is made of spans: one per operation, each with a name, start, duration, status and attributes. Every span points to its parent, so they form a tree.',k:['tip','Remember','The waterfall shows spans on a timeline. Nested bars are calls made inside the parent.'],pill:'idea',tt:'Spans',focus:['web','checkout','inv','pay','bank'],
   set:{info:{title:'model',rows:MODEL,hl:[1,2,4]}},termClear:true,term:{term:['span  name=charge  service=payment','      parent=checkout  duration=2.21s','      http.status_code=502  error=true']}},
  {t:'Context propagation',b:'When one service calls another, it sends the trace_id in a header called traceparent. The next service adds its spans to the same trace.',k:['problem','Watch out','If one service in the chain does not pass the header on, the trace splits in two and you lose the picture.'],pill:'idea',tt:'Context',focus:['checkout','pay'],
   set:{info:{title:'propagation',rows:PROP,hl:[1,4,5]}},termClear:true,term:{term:['POST /charge HTTP/1.1','Host: payment','traceparent: 00-9f3c1a7e…-b7ad6b71…-01']},
   once:[{path:['checkout','pay'],label:'traceparent',tone:'blue'}]},
  {t:'OpenTelemetry',b:'OpenTelemetry is the open standard for creating and sending telemetry. Apps use its SDK or auto-instrumentation, send OTLP to the Collector, and the Collector forwards to Tempo, Jaeger or a vendor.',k:['tip','Remember','Auto-instrumentation covers HTTP, gRPC and database clients with almost no code changes.'],pill:'idea',tt:'OTel',focus:['inv','col','tempo'],
   set:{info:{title:'OpenTelemetry',rows:OTEL,hl:[1,2,4,6]}},termClear:true,term:{term:['$ pip install opentelemetry-distro \\','    opentelemetry-exporter-otlp','$ opentelemetry-bootstrap -a install','$ opentelemetry-instrument python app.py']},
   flows:[{path:['inv','col','tempo'],label:'OTLP',tone:'blue'}]},
  {t:'Sampling',b:'Keeping every trace is expensive. Head sampling decides at the start of a request. Tail sampling waits until it ends, so it can keep every error and every slow trace.',k:['tip','Remember','Tail sampling runs in the OTel Collector, because only there are all the spans of a trace together.'],pill:'idea',tt:'Sampling',focus:['col'],
   set:{info:{title:'sampling',rows:SAMP,hl:[1,3]}},termClear:true,term:{term:['processors:','  tail_sampling:','    policies: [errors, slow > 1s, 10%]']}},
  {t:'Metrics, traces and logs together',b:'Exemplars put trace IDs on metric graphs, and every log line carries the trace_id. In Grafana you click from a latency spike to its trace, and from a span to its logs.',k:['idea','Key idea','Metrics tell you it is broken, traces tell you where, logs tell you why.'],pill:'idea',tt:'Together',focus:['pay','bank','tempo'],
   set:{info:{title:'together',rows:PIL,hl:[1,3,5]}},termClear:true,term:{term:['# Grafana: latency panel → exemplar','# → trace 9f3c1a7e → span bank-api','# → logs for trace_id=9f3c1a7e']}},
  {t:'Reading a waterfall',b:'A parent span\'s time includes its children. To find the bottleneck, look for the span with the most self time: time spent in that span and not in a child.',k:['problem','Watch out','The top span is always the longest. That does not make it the problem.'],pill:'idea',tt:'Waterfall',focus:null,
   set:{info:{title:'waterfall',rows:wf(null),hl:[1,2,5,6]}},termClear:true,term:{term:['# self time = duration - time in children','# web: 2.40 - 2.35 = 0.05 s']}},
  {t:'Try it: find the bottleneck',b:'This checkout request took 2.4 s. Open each span in the waterfall and compare its total time with its self time. Which one is slow on its own?',k:['tip','Challenge','Start at web and follow the longest child down the tree.'],pill:'problem',tt:'Try it',S:{p:null,done:false},goal:true,focus:null,
   set:{info:{title:'waterfall',rows:wf(null),hl:[]},bank:{status:'none'}},termClear:true,term:{term:['# trace 9f3c1a7e  6 spans  2.40 s']}},
  {t:'Recap',b:'A trace follows one request across services. Spans form a tree, traceparent carries it between services, OpenTelemetry collects it, and self time points at the real bottleneck.',k:['idea','Next up','SRE: decide how reliable is reliable enough, with SLOs and error budgets.'],pill:'recap',tt:'Recap',S:{p:'bank',done:true},
   set:{info:{title:'waterfall',rows:wf('bank'),hl:[6]},bank:{status:'fail'}},termClear:true,term:{term:['✓ bottleneck: bank-api POST /charge 2.10 s','# fix: timeout + retry, or a circuit breaker']}}
 ]});
})();
