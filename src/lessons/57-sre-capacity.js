(function(){
var RUN=[[100,'80 ms','0%'],[200,'110 ms','0%'],[300,'180 ms','0%'],[350,'420 ms','0.4%'],[400,'1.9 s','6%']];
var PEAK=1800,LIM=300;
function util(r){return Math.round(PEAK/(LIM*r)*100)}
function bar(i){return '▇▇▇▇▇▇▇▇▇▇▇▇'.slice(0,[1,2,3,6,12][i])}
function res(S){var r=['load test: 1 pod, req/s → p95 latency'];RUN.forEach(function(x,i){if(i<S.step)r.push({t:String(x[0]).padStart(3)+' rps  '+(bar(i)+'            ').slice(0,12)+' '+x[1].padStart(6)+'  err '+x[2],tone:i<3?'green':i<4?'gold':'red'})});if(S.step>=5)r.push('',{t:'Knee at ~300 req/s per pod.',tone:'green'});else if(!S.step)r.push('not run yet');return r}
var TYPES=['Kinds of performance test',{t:'load    expected peak, for 30-60 min',tone:'gold'},{t:'stress  push past the limit: where it breaks',tone:'gold'},{t:'spike   0 → peak in seconds',tone:'gold'},{t:'soak    normal load for hours: leaks',tone:'gold'},'','Test in staging sized like production,','with realistic data and traffic mix.'];
var K6=['k6 script',{t:"export const options = {",tone:'gold'},{t:"  stages: [{ duration: '5m', target: 400 }],",tone:'gold'},{t:"  thresholds: {",tone:'gold'},{t:"    http_req_duration: ['p(95)<300'] } };",tone:'gold'},{t:"export default () =>",tone:'gold'},{t:"  http.get('https://staging.shop/checkout');",tone:'gold'},'','target = virtual users ramping to 400'];
var PLAN=['Plan for the peak',{t:'today peak         1,200 req/s',tone:'gold'},{t:'growth             ×1.25 by December',tone:'gold'},{t:'sale day           ×1.2',tone:'gold'},{t:'forecast peak      1,800 req/s',tone:'green'},'',{t:'keep peak under 75% of tested limit:',tone:'gold'},' room for a pod or zone to fail',' and for the forecast to be wrong'];
function vis(S,A){for(var i=0;i<12;i++){var on=S.r&&i<S.r,u=S.r?util(S.r):0;A.set('p'+i,{show:!!on,status:u>100?'fail':u>75?'stop':'run',sub:on?u+'%':' '})}}
function test(S,A){var id=S.rid=(S.rid||0)+1;S.step=0;S.tested=false;A.term('term',['$ k6 run --vus 400 checkout.js'],true);
 function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
 RUN.forEach(function(x,i){L(500+i*650,function(){S.step=i+1;A.send(['k6','lb','p0'],{label:x[0]+' rps',tone:i<3?'green':i<4?'amber':'red',ok:i<4});A.set('p0',{show:true,status:i<3?'run':i<4?'stop':'fail',sub:x[0]+' rps'});A.set('info',{title:'results',rows:res(S),hl:[]});
  A.term('term',[(i>3?'! ':'')+'rps '+x[0]+'  p95 '+x[1]+'  errors '+x[2]]);if(i==4){S.tested=true;A.term('term',['# p95 < 300 ms holds up to ~300 rps']);if(S.r)vis(S,A)}A.refresh()})})}
function pick(S,A,r){S.r=r;if(!S.tested){S.r=null;A.term('term',['! run the load test first:','  you do not know what one pod can take'],true);A.refresh();return}
 vis(S,A);var u=util(r);S.done=r==8;A.set('info',{title:'plan',rows:PLAN,hl:[4,6]});
 A.term('term',['# '+r+' pods × '+LIM+' rps = '+fmt(r*LIM)+' rps capacity','# forecast peak '+fmt(PEAK)+' rps → '+u+'% busy',u>100?'! overload: users get errors at the peak':u>75?'! no headroom: one pod down = overload':r>8?'! works, but '+(r-8)+' pods sit idle: 8 is enough':'✓ 75% at peak: survives a pod failure'],true);
 A.send(['lb','p'+(r-1)],{label:'peak',tone:u>100?'red':u>75?'amber':'green',ok:u<=100});A.refresh()}
function fmt(x){return x.toLocaleString('en-US')}
function PS(r){var o={},u=r?util(r):0;for(var i=1;i<12;i++)o['p'+i]={show:!!(r&&i<r),status:u>100?'fail':u>75?'stop':'run',sub:r&&i<r?u+'%':' '};return o}
var POS=[[84,212],[160,212],[236,212],[312,212],[84,282],[160,282],[236,282],[312,282],[84,352],[160,352],[236,352],[312,352]];
var SPEC={
 title:'Capacity & load testing',sub:'Find how much traffic one instance can take, forecast the peak, and size the system with headroom before users find the limit.',time:'14 min',level:'Intermediate',
 S:{step:0,tested:false,r:null,done:false},
 legend:[['#3fa456','under 75%'],['#e8a33a','no headroom'],['#e5534b','overloaded']],
 hud:[{id:'l',l:'Pod limit',v:function(S){return S.tested?'~300 rps':'?'},lv:function(S){return S.tested?'good':'none'}},{id:'f',l:'Forecast',v:'1,800 rps',lv:'none'},{id:'r',l:'Pods',v:function(S){return S.r?String(S.r):'—'},lv:'none'},{id:'u',l:'Peak load',v:function(S){return S.r?util(S.r)+'%':'—'},lv:function(S){if(!S.r)return 'none';var u=util(S.r);return u>100?'bad':u>75?'warn':'good'}}],
 nodes:[
  H.tile('k6',84,44,'k6','load generator','violet',{w:124}),
  H.box('lb',262,40,'load balancer','blue',{center:true}),
  ].concat(POS.map(function(p,i){return H.tile('p'+i,p[0],p[1],'pod'+(i+1),' ','green',{w:70,fs:10,status:'run',show:i==0})})).concat([
  {t:'panel',id:'info',x:392,y:14,w:316,h:184,title:'results',rows:res({step:0}),fs:9.3},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}]),
 links:[H.lk('k6','lb','violet'),H.lk('lb','p0','blue',{dash:true})],
 controls:{title:'Size checkout for the sale',groups:[{items:[{label:'run load test',wide:true,click:function(S,A){test(S,A)}}]},{name:'Pods',items:[4,6,8,12].map(function(r){return {label:String(r),wide:true,on:function(S){return S.r==r},click:function(S,A){pick(S,A,r)}}})}]},
 goal:function(S){var ok=S.done;return [ok,ok?'Done. One pod holds ~300 req/s. 8 pods put the 1,800 req/s peak at 75%, with room for a pod to fail.':'Goal: the sale peak will be 1,800 req/s. Load-test one pod to find its limit, then pick the fewest pods that keep the peak under 75%.']},
 learn:[['Ask the capacity question',0],['Use trends and peaks',1],['Know the test types',2],['Write a k6 test',3],['Find the knee',4],['Leave headroom',5],['Forecast the peak',6]],
 steps:[
  {t:'Will it hold?',b:'Capacity planning answers one question: will the system handle the traffic coming next month, or on the sale day, while still meeting its SLO?',k:['idea','Key idea','Users should never be the ones who discover your limit.'],pill:'setup',tt:'Question',focus:['lb','p0'],S:{step:0,tested:false,r:null,done:false},
   set:{info:{title:'results',rows:res({step:0}),hl:[]}},termClear:true,term:{term:['# Black Friday in 3 weeks','# can checkout take it?']}},
  {t:'Trends and peaks',b:'Look at months of traffic, not one day. Plan for the peak hour, not the average, and add growth and special events on top.',k:['tip','Remember','Watch all the limits, not just CPU: DB connections, disk IOPS, network, third-party rate limits.'],pill:'idea',tt:'Trends',focus:null,
   set:{info:{title:'plan',rows:PLAN,hl:[1,2,3,4]}},termClear:true,term:{term:['# max_over_time(sum(rate(','#   http_requests_total[5m]))[30d:1h])','1203']}},
  {t:'Kinds of test',b:'A load test runs the expected peak. A stress test goes past it to find where things break. Spike tests jump suddenly, and soak tests run for hours to find leaks.',k:['problem','Watch out','A test against a tiny staging with an empty database tells you little about production.'],pill:'idea',tt:'Types',focus:['k6'],
   set:{info:{title:'test types',rows:TYPES,hl:[1,2,3,4]}},termClear:true,term:{term:['# tools: k6, Locust, JMeter, Gatling']}},
  {t:'A k6 test',b:'k6 scripts are JavaScript. Stages ramp virtual users up, and thresholds fail the run if p95 latency goes above the SLO.',k:['tip','Remember','Put the load test in CI before big releases, with the same thresholds as your SLO.'],pill:'idea',tt:'k6',focus:['k6','lb'],
   set:{info:{title:'k6',rows:K6,hl:[2,4]}},termClear:true,term:{term:['$ k6 run checkout.js','✓ http_req_duration p(95)=176ms']},
   once:[{path:['k6','lb','p0'],label:'load',tone:'violet'}]},
  {t:'Find the knee',b:'As load rises, latency stays flat, then shoots up when the instance saturates and requests start to queue. That bend, the knee, is the real limit.',k:['idea','Key idea','Do not plan to run near the knee. Small spikes push you over it.'],pill:'idea',tt:'Knee',focus:['p0'],S:{step:5,tested:true,r:null,done:false},
   set:{info:{title:'results',rows:res({step:5}),hl:[3,4,7]},p0:{show:true,status:'stop',sub:'300 rps'}},termClear:true,term:{term:['# 300 rps → 180 ms','# 350 rps → 420 ms   ← queueing starts','# 400 rps → 1.9 s, 6% errors']}},
  {t:'Headroom',b:'Size so the peak uses at most about 75% of tested capacity. The rest covers a failed pod or zone, a bad forecast, and the time autoscaling needs to react.',k:['tip','Remember','Autoscaling has limits too: max replicas, node capacity and cloud quotas. Check them before the event.'],pill:'idea',tt:'Headroom',focus:['lb'],
   set:{info:{title:'plan',rows:PLAN,hl:[6,7,8]}},termClear:true,term:{term:['# N+1: lose any one pod or zone','#      and still meet the SLO']}},
  {t:'Forecast the peak',b:'Today\'s peak is 1,200 req/s. With expected growth and the sale, the forecast is 1,800 req/s. That is the number to size for.',k:['tip','Remember','After the event, compare forecast and reality. It makes the next forecast better.'],pill:'idea',tt:'Forecast',focus:null,
   set:{info:{title:'plan',rows:PLAN,hl:[1,2,3,4]}},termClear:true,term:{term:['# 1200 × 1.25 × 1.2 = 1800 req/s']}},
  {t:'Try it: size checkout for the sale',b:'Run the load test on one pod to find its limit. Then choose the number of pods for a 1,800 req/s peak.',k:['tip','Challenge','Try 6 pods. The maths says it fits. What happens when one pod dies at the peak?'],pill:'problem',tt:'Try it',S:{step:0,tested:false,r:null,done:false},goal:true,focus:null,
   set:{info:{title:'results',rows:res({step:0}),hl:[]},p0:{show:true,status:'run',sub:' '}},termClear:true,term:{term:['# staging: 1 checkout pod, same size as prod']}},
  {t:'Recap',b:'Plan for the peak, not the average. Load-test to find the knee, forecast growth and events, and keep the peak under about 75% of capacity.',k:['idea','Next up','Backup and disaster recovery: what if the whole region is gone?'],pill:'recap',tt:'Recap',S:{step:5,tested:true,r:8,done:true},
   set:{info:{title:'plan',rows:PLAN,hl:[4,6]}},termClear:true,term:{term:['✓ 8 pods × 300 rps, peak at 75%']}}
 ]};
SPEC.steps.forEach(function(st){st.set=Object.assign(PS(st.tt=='Recap'?8:0),st.set||{})});
SPEC.steps[8].set.p0={show:true,status:'run',sub:'75%'};
LESSON('sre','capacity',SPEC);
})();
