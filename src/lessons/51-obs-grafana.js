(function(){
var P={traffic:['Traffic','412 req/s',true],errors:['Errors','2.4 %',true],latency:['Latency p95','280 ms',true],sat:['Saturation','CPU 61%',true],pods:['Pod list','40 rows',false],raw:['Total requests','184,302,991',false],logo:['Company logo','',false],uptime:['Uptime','212 days',false]};
var KEYS=Object.keys(P);
function sel(S){return KEYS.filter(function(k){return S.s.indexOf(k)>=0})}
function good(S){var x=sel(S);return x.length==4&&x.every(function(k){return P[k][2]})}

function SET(S){var o={},x=S.s;for(var i=0;i<6;i++){var k=x[i];o['d'+i]=k?{show:true,title:P[k][0],sub:P[k][1]||'—',status:P[k][2]?'run':'#e8a33a'}:{show:false}}return o}
var GOOD=['A dashboard for 3 am',{t:'top row: the 4 golden signals',tone:'green'},'  traffic · errors · latency · saturation','one question per panel, units on every axis','red/green only where it means something','',{t:'Noise hides the one graph that matters.',tone:'red'}];
var VARS=[{t:'Dashboard variables',tone:'gold'},'$namespace = label_values(up, namespace)','$service   = label_values(up{namespace=','              "$namespace"}, job)','',{t:'rate(http_requests_total{job="$service"}[5m])',tone:'green'},'','One dashboard, every service: pick from a dropdown.'];
var CODE=['Dashboards as code',{t:'dashboards/web.json      in Git',tone:'gold'},{t:'provisioning/*.yaml      loaded at start',tone:'gold'},{t:'or Grafana Terraform provider',tone:'gold'},'',{t:'Annotations: mark every deploy on the graph,',tone:'green'},{t:'so "it broke at 14:02" lines up with v1.7.',tone:'green'}];
function vis(S,A){var o=SET(S);Object.keys(o).forEach(function(k){A.set(k,o[k])});A.refresh()}
function tog(S,A,k){var i=S.s.indexOf(k);if(i>=0)S.s.splice(i,1);else{if(S.s.length>=6){A.term('term',['! the dashboard is full: remove a panel first'],true);return}S.s.push(k);A.send(['prom','graf'],{label:P[k][0].split(' ')[0].toLowerCase(),tone:P[k][2]?'green':'amber',ok:true})}
 A.term('term',[good(S)?'✓ 4 golden signals, nothing else':'# '+S.s.length+' panels: '+sel(S).filter(function(x){return P[x][2]}).length+' golden, '+sel(S).filter(function(x){return !P[x][2]}).length+' noise'].concat(sel(S).filter(function(x){return !P[x][2]}).map(function(x){return '! '+P[x][0]+': does not help at 3 am'})),true);vis(S,A)}
LESSON('obs','grafana',{
 title:'Grafana dashboards',sub:'Turn metrics into dashboards that answer one question fast: is it broken, and where?',time:'14 min',level:'Intermediate',
 S:{s:[]},
 legend:[['#3fa456','useful panel'],['#e8a33a','noise'],['#5a4aa8','Grafana']],
 hud:[{id:'n',l:'Panels',v:function(S){return S.s.length+' / 6'},lv:'none'},{id:'g',l:'Golden signals',v:function(S){return sel(S).filter(function(k){return P[k][2]}).length+' / 4'},lv:function(S){return sel(S).filter(function(k){return P[k][2]}).length==4?'good':'warn'}},{id:'x',l:'Noise panels',v:function(S){return String(sel(S).filter(function(k){return !P[k][2]}).length)},lv:function(S){return sel(S).some(function(k){return !P[k][2]})?'bad':'good'}},{id:'ds',l:'Data source',v:'Prometheus',lv:'none'}],
 nodes:[
  H.box('prom',90,34,'Prometheus','amber',{center:true}),
  H.box('graf',250,34,'Grafana','violet',{center:true}),
  H.tile('d0',90,166,' ',' ','green',{w:150,show:false}),
  H.tile('d1',252,166,' ',' ','green',{w:150,show:false}),
  H.tile('d2',90,246,' ',' ','green',{w:150,show:false}),
  H.tile('d3',252,246,' ',' ','green',{w:150,show:false}),
  H.tile('d4',90,326,' ',' ','green',{w:150,show:false}),
  H.tile('d5',252,326,' ',' ','green',{w:150,show:false}),
  H.tile('dep',170,406,'deploy v1.7','annotation 14:02','gold',{w:140}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'good dashboards',rows:GOOD,fs:9.3},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'dashboard review'}],
 links:[H.lk('prom','graf','violet'),H.lk('graf','d0','violet',{dash:true}),H.lk('graf','d1','violet',{dash:true}),H.lk('dep','d2','gold',{dash:true})],
 controls:{title:'Build the on-call dashboard',groups:[{items:KEYS.map(function(k){return {label:P[k][0],wide:true,on:function(S){return S.s.indexOf(k)>=0},click:function(S,A){tog(S,A,k)}}})}]},
 goal:function(S){var ok=good(S);return [ok,ok?'Done. Traffic, errors, latency and saturation, and nothing else. At 3 am you see the problem in seconds.':'Goal: an on-call dashboard that shows whether users are hurting. Add the panels that answer that, and leave the rest out.']},
 learn:[['Connect a data source',0],['Design for one question',1],['Use the golden signals',2],['Use variables',3],['Mark deploys with annotations',4],['Alert from Grafana',5],['Keep dashboards as code',6]],
 steps:[
  {t:'Grafana reads, Prometheus stores',b:'Grafana stores no metrics itself. It queries data sources, like Prometheus, Loki or CloudWatch, and draws the results as panels on dashboards.',k:['idea','Key idea','One Grafana can show metrics, logs and traces side by side from different sources.'],pill:'setup',tt:'Setup',focus:['prom','graf'],S:{s:[]},
   set:Object.assign(SET({s:[]}),{info:{title:'good dashboards',rows:GOOD,hl:[]}}),termClear:true,term:{term:['# Grafana → Connections → Data sources','# Prometheus http://prometheus:9090','# ✓ data source is working']},
   once:[{path:['prom','graf'],label:'query',tone:'violet'}]},
  {t:'One question per dashboard',b:'A good dashboard answers one question: "is the web service healthy?". Put the most important graphs at the top, use units, and keep colours meaningful.',k:['problem','Watch out','Fifty panels look impressive and hide the one that matters during an incident.'],pill:'idea',tt:'Design',focus:['graf'],
   set:{info:{rows:GOOD,hl:[1,3,4,6]}},termClear:true,term:{term:['# rule of thumb: if nobody looked at a panel','# in 3 months, delete it']}},
  {t:'The golden signals row',b:'Start every service dashboard with traffic, errors, latency and saturation. Together they show whether users are affected and roughly why.',k:['tip','Remember','Show latency as p95 or p99, not the average. Averages hide the slow requests users complain about.'],pill:'idea',tt:'Signals',focus:['d0','d1','d2','d3'],S:{s:['traffic','errors','latency','sat']},
   set:Object.assign(SET({s:['traffic','errors','latency','sat']}),{info:{rows:GOOD,hl:[1,2]}}),termClear:true,term:{term:['traffic   sum(rate(http_requests_total[5m]))','errors    5xx rate / all rate','latency   histogram_quantile(0.95, ...)','saturation cpu / limit']}},
  {t:'Variables',b:'Variables turn one dashboard into many: a dropdown for namespace and service fills $service in every query. No copy-paste dashboards per service.',k:['tip','Remember','label_values() fills a dropdown from the labels Prometheus already has.'],pill:'idea',tt:'Variables',focus:['graf'],
   set:{info:{title:'variables',rows:VARS,hl:[1,2,3,5]}},termClear:true,term:{term:['# $namespace = shop','# $service   = web','# every panel now shows shop/web']}},
  {t:'Annotations',b:'Annotations draw a vertical line on every graph, for example at each deploy. When errors jump right after the line, you know where to look.',k:['idea','Key idea','Most incidents start with a change. Make changes visible on the graphs.'],pill:'idea',tt:'Annotations',focus:['dep','d2'],
   set:{info:{title:'as code',rows:CODE,hl:[5,6]}},termClear:true,term:{term:['$ curl -X POST grafana/api/annotations \\','    -H "Content-Type: application/json" \\','    -d \'{"text":"deploy v1.7"}\'']},
   once:[{path:['dep','d2'],label:'v1.7',tone:'gold'}]},
  {t:'Alerting in Grafana',b:'Grafana can also alert on any panel query and send notifications. Many teams keep alert rules in Prometheus and Alertmanager, and use Grafana to look.',k:['problem','Watch out','Pick one place for alert rules. Two systems alerting on the same thing means double pages.'],pill:'idea',tt:'Alerts',focus:['graf','d1'],
   set:{info:{title:'good dashboards',rows:GOOD,hl:[]}},termClear:true,term:{term:['# Alert rule: errors > 2% for 5m','# Contact point: on-call Slack']}},
  {t:'Dashboards as code',b:'Export dashboards as JSON and keep them in Git, loaded by provisioning or the Terraform provider. Changes get reviewed, and a lost Grafana is rebuilt in minutes.',k:['tip','Remember','Grafana Labs\' public dashboard library has ready dashboards for node_exporter, Kubernetes and more.'],pill:'idea',tt:'As code',focus:['graf'],
   set:{info:{title:'as code',rows:CODE,hl:[1,2,3]}},termClear:true,term:{term:['$ ls grafana/dashboards','node-exporter.json  web-red.json','$ git log --oneline -1 grafana/','9a1c2e3 add p99 to web dashboard']}},
  {t:'Try it: build the on-call dashboard',b:'It is 3 am and the pager went off. Build the dashboard you would want to open: add the panels that tell you if users are hurting, leave out the rest.',k:['tip','Challenge','Add "Total requests" and look at its number. Does it tell you anything about right now?'],pill:'problem',tt:'Try it',S:{s:[]},goal:true,focus:null,
   set:Object.assign(SET({s:[]}),{info:{title:'good dashboards',rows:GOOD,hl:[]}}),termClear:true,term:{term:['# new dashboard: "web on-call"']}},
  {t:'Recap',b:'Grafana queries data sources and draws panels. Lead with the golden signals, use variables instead of copies, mark deploys with annotations, and keep dashboards in Git.',k:['idea','Next up','Logs: collect them in one place and search them fast.'],pill:'recap',tt:'Recap',S:{s:['traffic','errors','latency','sat']},
   set:Object.assign(SET({s:['traffic','errors','latency','sat']}),{info:{title:'good dashboards',rows:GOOD,hl:[]}}),termClear:true,term:{term:['✓ traffic ✓ errors ✓ latency ✓ saturation']}}
 ]});
})();
