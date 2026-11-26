(function(){
var Q={A:['http_requests_total{status=~"5.."}','184,302','a raw counter: it only grows, forever'],B:['rate(http_requests_total{status=~"5.."}[5m])','6.2 /s','errors per second, not a percentage'],C:['sum(rate(..{status=~"5.."}[5m])) / sum(rate(..[5m]))','2.4 %','the share of requests that fail'],D:['avg(http_requests_total)','91,512','averaging counters means nothing']};
var BARS={A:'▁▁▂▂▃▃▄▄▅▅▆▆▇▇██',B:'▂▂▂▃▂▂▂▃▅▇▇▆▃▂▂▂',C:'▁▁▁▁▁▁▁▂▅▇▇▆▂▁▁▁',D:'▁▂▂▃▃▄▄▅▅▆▆▇▇██▇'};
var TYPES=['Metric types',{t:'counter    only goes up: requests, errors',tone:'gold'},'           use rate() to get "per second"',{t:'gauge      goes up and down: memory, queue',tone:'gold'},{t:'histogram  buckets: latency percentiles',tone:'gold'},'',{t:'labels add dimensions:',tone:'green'},{t:'http_requests_total{status="500",path="/cart"}',tone:'green'}];
var PULL=['How Prometheus works',{t:'1 apps expose /metrics as plain text',tone:'gold'},{t:'2 Prometheus scrapes every 15 s (pull)',tone:'gold'},{t:'3 stores time series with labels',tone:'gold'},{t:'4 rules evaluate PromQL continuously',tone:'gold'},{t:'5 alerts go to Alertmanager → Slack, pager',tone:'gold'},'','exporters: node_exporter, blackbox, mysql…'];
var SIG=['What to measure',{t:'Golden signals  latency, traffic, errors,',tone:'gold'},{t:'                saturation (user view)',tone:'gold'},{t:'RED  rate, errors, duration  (services)',tone:'gold'},{t:'USE  utilization, saturation, errors',tone:'gold'},'     (resources: CPU, disk, network)','','Alert on symptoms users feel, not on causes.'];
var RULE=[{t:'- alert: HighErrorRate',tone:'gold'},'  expr: |','    sum(rate(http_requests_total{status=~"5.."}[5m]))','      / sum(rate(http_requests_total[5m])) > 0.02',{t:'  for: 5m',tone:'green'},'  labels: { severity: page }','  annotations:','    summary: "5xx above 2% for 5 minutes"'];
function pick(S,A,k){S.q=k;var q=Q[k];A.send(['graf','prom'],{label:'query',tone:'violet',ok:true});A.set('info',{title:'result: '+q[1],rows:['query:',{t:q[0],tone:'gold'},'','last hour:',{t:BARS[k],tone:k=='C'?'green':'amber'},'',{t:q[2],tone:k=='C'?'green':'red'}],hl:[]});A.term('term',['$ promtool query instant http://prom:9090 \\','    \''+(q[0].length>40?q[0].slice(0,37)+'...':q[0])+'\'',(k=='C'?'':'! ')+'value: '+q[1]],true);if(k=='C')S.done=true;A.refresh()}
LESSON('obs','metrics',{
 title:'Metrics & Prometheus',sub:'Collect numbers about your system over time, query them with PromQL, and alert when users are hurting.',time:'16 min',level:'Intermediate',
 S:{q:null,done:false},
 legend:[['#3fa456','useful signal'],['#e8a33a','misleading'],['#5a4aa8','query']],
 hud:[{id:'t',l:'Targets up',v:'12 / 12',lv:'good'},{id:'s',l:'Scrape',v:'every 15 s',lv:'none'},{id:'q',l:'Query',v:function(S){return S.q?'option '+S.q:'—'},lv:function(S){return !S.q?'none':S.q=='C'?'good':'warn'}},{id:'v',l:'Result',v:function(S){return S.q?Q[S.q][1]:'—'},lv:function(S){return !S.q?'none':S.q=='C'?'good':'warn'}}],
 nodes:[
  H.tile('app',70,52,'web /metrics','counters, gauges','green',{w:132}),
  H.tile('node',70,132,'node_exporter','CPU, disk, net','blue',{w:132}),
  H.box('prom',228,40,'Prometheus','amber',{center:true}),
  H.tile('am',330,190,'Alertmanager','route + group','red',{w:120}),
  H.tile('graf',196,300,'Grafana','dashboards','violet',{w:118}),
  {t:'crowd',id:'oncall',x:330,y:330,tone:'red',label:'on-call',n:1,w:42,anchor:[300,310]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'how it works',rows:PULL,fs:9.3},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('prom','app','amber',{dash:true}),H.lk('prom','node','amber',{dash:true}),H.lk('prom','am','red'),H.lk('graf','prom','violet'),H.lk('am','oncall','red',{dash:true})],
 controls:{title:'Which query is the error rate?',groups:[{items:['A','B','C','D'].map(function(k){return {label:{A:'raw 5xx counter',B:'rate of 5xx',C:'5xx rate / all rate',D:'avg of counter'}[k],wide:true,on:function(S){return S.q==k},click:function(S,A){pick(S,A,k)}}})}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. A ratio of two rates gives the share of failing requests: 2.4% right now. That is the number to graph and alert on.':'Goal: the dashboard needs "what percentage of requests fail right now". Try each query and read what it really measures.']},
 learn:[['Know the pull model',0],['Know metric types',1],['Use labels',2],['Query with rate()',3],['Pick what to measure',4],['Write alert rules',5],['Use exporters',6]],
 steps:[
  {t:'Prometheus pulls metrics',b:'Your app exposes numbers on a /metrics page. Prometheus scrapes every target every 15 seconds and stores each number as a time series.',k:['idea','Key idea','Metrics are cheap numbers over time. They tell you something is wrong, fast.'],pill:'setup',tt:'Pull',focus:['app','node','prom'],S:{q:null,done:false},
   set:{info:{title:'how it works',rows:PULL,hl:[1,2,3]}},termClear:true,term:{term:['$ curl -s web:8000/metrics | grep requests','http_requests_total{status="200"} 912034','http_requests_total{status="500"} 184302']},
   flows:[{path:['prom','app'],label:'scrape',tone:'amber'},{path:['prom','node'],label:'scrape',tone:'amber'}]},
  {t:'Counters, gauges, histograms',b:'A counter only goes up, like total requests. A gauge goes up and down, like memory in use. A histogram counts values in buckets, which gives latency percentiles.',k:['problem','Watch out','Never graph a raw counter. It always grows. Use rate() to turn it into "per second".'],pill:'idea',tt:'Types',focus:['app'],
   set:{info:{title:'metric types',rows:TYPES,hl:[1,2,3,4]}},termClear:true,term:{term:['# TYPE http_requests_total counter','# TYPE process_resident_memory_bytes gauge','# TYPE http_request_duration_seconds histogram']}},
  {t:'Labels',b:'Labels split one metric into many series: by status code, path, pod. PromQL can filter and group by any label.',k:['problem','Watch out','Never put user IDs or request IDs in labels. Each value creates a new series and can overload Prometheus.'],pill:'idea',tt:'Labels',focus:['app','prom'],
   set:{info:{title:'metric types',rows:TYPES,hl:[6,7]}},termClear:true,term:{term:['# sum by (status) (rate(...[5m]))','{status="200"}  412.7','{status="500"}    6.2']}},
  {t:'rate() and ratios',b:'rate(counter[5m]) gives the average per second over 5 minutes. Divide the rate of errors by the rate of all requests and you get an error ratio.',k:['tip','Remember','Latency percentiles come from histograms: histogram_quantile(0.95, sum by (le) (rate(..._bucket[5m]))).'],pill:'idea',tt:'PromQL',focus:['graf','prom'],S:{q:'C'},
   set:{info:{title:'result: 2.4 %',rows:['query:',{t:Q.C[0],tone:'gold'},'','last hour:',{t:BARS.C,tone:'green'}],hl:[]}},termClear:true,term:{term:['sum(rate(...{status=~"5.."}[5m]))','  / sum(rate(...[5m]))','0.024   # = 2.4%']},
   once:[{path:['graf','prom'],label:'query',tone:'violet'}]},
  {t:'What to measure',b:'For services measure RED: rate, errors, duration. For resources measure USE: utilization, saturation, errors. Together they are the golden signals.',k:['idea','Key idea','Alert on what users feel, like errors and latency. Use CPU and disk to explain why.'],pill:'idea',tt:'Signals',focus:['app','node'],
   set:{info:{title:'signals',rows:SIG,hl:[1,3,4,7]}},termClear:true,term:{term:['# RED web:  412 req/s','#           2.4% errors, p95 280 ms','# USE node: CPU 61%, load 1.2, 0 errors']}},
  {t:'Alert rules',b:'An alert rule is a PromQL expression with a threshold and a for: duration, so a two-second blip does not page anyone. Alertmanager groups, silences and routes the alerts.',k:['tip','Remember','Every page should be urgent and actionable. Everything else goes to a ticket or a dashboard.'],pill:'idea',tt:'Alerts',focus:['prom','am','oncall'],
   set:{info:{title:'alert rule',rows:RULE,hl:[0,3,4]}},termClear:true,term:{term:['$ promtool check rules alerts.yml','SUCCESS: 1 rules found','FIRING  HighErrorRate  severity=page']},
   once:[{path:['prom','am','oncall'],label:'page',tone:'red'}]},
  {t:'Exporters',b:'Not everything has /metrics built in. Exporters translate: node_exporter for Linux hosts, blackbox_exporter to probe URLs, and many more for databases and queues.',k:['tip','Remember','In Kubernetes, kube-prometheus-stack installs Prometheus, Alertmanager, Grafana and the common exporters in one Helm chart.'],pill:'idea',tt:'Exporters',focus:['node','prom'],
   set:{info:{title:'how it works',rows:PULL,hl:[7]}},termClear:true,term:{term:['$ helm install mon \\','    prometheus-community/kube-prometheus-stack','$ curl -s node:9100/metrics | grep -c node_','1284']}},
  {t:'Try it: write the error rate',b:'The dashboard needs one number: what percentage of requests are failing right now. Four queries are on the table. Run each and read what it really measures.',k:['tip','Challenge','Look at the shape of each graph. Which one only ever goes up?'],pill:'problem',tt:'Try it',S:{q:null,done:false},goal:true,focus:null,
   set:{info:{title:'how it works',rows:PULL,hl:[]}},termClear:true,term:{term:['# target: web, metric: http_requests_total']}},
  {t:'Recap',b:'Prometheus scrapes metrics, labels give dimensions, rate() turns counters into rates, ratios give error percentages, and alert rules with for: page on real problems.',k:['idea','Next up','Grafana: dashboards that answer questions at 3 am.'],pill:'recap',tt:'Recap',S:{q:'C',done:true},
   set:{info:{title:'alert rule',rows:RULE,hl:[]}},termClear:true,term:{term:['✓ scrape · rate() · ratio · alert for: 5m']}}
 ]});
})();
