(function(){
var ST={test:'lint + test',build:'build image',push:'push image',stg:'deploy staging',appr:'approval',prod:'deploy prod'};
var ORDER=['test','build','push','stg','appr','prod'];
function check(p){if(p.indexOf('prod')<0)return [false,'nothing reaches production yet'];var i=function(k){return p.indexOf(k)};
 if(i('test')<0||i('test')>i('prod'))return [false,'! the bug reached prod: no test stage before deploy'];
 if(i('build')<0||i('push')<0||i('build')>i('push'))return [false,'! push failed: image must be built first'];
 if(i('push')>i('prod')||(i('stg')>=0&&i('push')>i('stg')))return [false,'! deploy failed: image not in the registry yet'];
 if(i('stg')<0||i('stg')>i('prod'))return [false,'! prod was the first place the release ran'];
 if(i('appr')<0||i('appr')>i('prod')||i('appr')<i('stg'))return [false,'! prod deployed with nobody checking staging'];
 if(i('test')>i('build'))return [false,'tests ran late: an image was built for broken code'];return [true,'✓ bug caught by tests, release verified']}
var SLOT=[[66,190],[190,190],[314,190],[314,280],[190,280],[66,280]];
function SET(p){var o={};for(var k=0;k<6;k++){var s=p[k];o['s'+k]=s?{show:true,title:{test:'test',build:'build',push:'push',stg:'staging',appr:'approval',prod:'prod'}[s],sub:(k+1)+' · '+(s=='appr'?'manual gate':s=='prod'?'users':'automatic')}:{show:false}}return o}
var STAGES=['A typical pipeline',{t:'1 lint + test       every push, minutes',tone:'gold'},{t:'2 build image       tagged with the commit',tone:'gold'},{t:'3 push              to the registry',tone:'gold'},{t:'4 deploy staging    same image as prod',tone:'gold'},{t:'5 approval / checks smoke tests, a person',tone:'amber'},{t:'6 deploy prod       then verify',tone:'green'}];
var CICD=['Three words',{t:'CI   merge often, test every change',tone:'gold'},{t:'CD   continuous delivery: always',tone:'gold'},'     ready to release, a person clicks',{t:'CD   continuous deployment: every green',tone:'gold'},'     change goes out automatically','','Fast feedback is the whole point.'];
var ART=['Build once, deploy many',{t:'commit 3f2a9c1 → image app:3f2a9c1',tone:'gold'},'      staging runs app:3f2a9c1','      prod runs    app:3f2a9c1',{t:'Never rebuild for prod: test what you ship.',tone:'green'},'',{t:'Config differs per environment,',tone:'gold'},{t:'the artifact does not.',tone:'gold'}];
function add(S,A,k){if(S.p.indexOf(k)>=0){A.term('term',['# '+ST[k]+' is already in the pipeline'],true);return}if(S.p.length>=6)return;S.p.push(k);S.ran=false;var o=SET(S.p);Object.keys(o).forEach(function(x){A.set(x,o[x])});A.send([S.p.length>1?'s'+(S.p.length-2):'git','s'+(S.p.length-1)],{label:'',tone:'blue',ok:true});A.refresh()}
function run(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}var r=check(S.p);S.ran=false;
 var path=['git'].concat(S.p.map(function(x,i){return 's'+i}));if(r[0])A.send(['git','s0'],{label:'bug',tone:'red',ok:false,denyAt:'s0'});else A.send(S.p.indexOf('prod')>=0&&r[1].indexOf('bug')>=0?path.concat(['users']):path,{label:'bug',tone:'red',ok:true});
 L(Math.max(1500,path.length*600),function(){S.ran=true;S.ok=r[0];A.term('term',['# commit 9c1e2b0 "fix cart" has a bug'].concat(S.p.map(function(x,i){return (i+1)+'. '+ST[x]+(x=='test'&&r[0]?'  ✗ 2 tests failed':'')})).concat([r[1]]),true);A.refresh()})}
LESSON('cicd','concepts',{
 title:'CI/CD concepts',sub:'Turn every commit into a tested, packaged, verified release with a pipeline, and stop bad changes early.',time:'14 min',level:'Beginner',
 S:{p:[],ran:false,ok:false},
 legend:[['#3b82c4','automatic stage'],['#e8a33a','manual gate'],['#e5534b','bad change']],
 hud:[{id:'n',l:'Stages',v:function(S){return S.p.length+' / 6'},lv:'none'},{id:'t',l:'Tests first',v:function(S){return S.p[0]=='test'?'yes':'no'},lv:function(S){return S.p[0]=='test'?'good':'warn'}},{id:'g',l:'Gate before prod',v:function(S){var a=S.p.indexOf('appr'),b=S.p.indexOf('prod');return a>=0&&(b<0||a<b)?'yes':'no'},lv:'none'},{id:'r',l:'Buggy commit',v:function(S){return !S.ran?'—':S.ok?'stopped':'escaped'},lv:function(S){return !S.ran?'none':S.ok?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'git',x:66,y:66,tone:'gold',label:'git push',n:1,w:44,anchor:[110,66]},
  H.box('ci',230,34,'CI runner','violet',{center:true}),
  H.tile('s0',66,190,'',' ','blue',{w:112,show:false}),H.tile('s1',190,190,'',' ','blue',{w:112,show:false}),H.tile('s2',314,190,'',' ','blue',{w:112,show:false}),
  H.tile('s3',314,280,'',' ','blue',{w:112,show:false}),H.tile('s4',190,280,'',' ','amber',{w:112,show:false}),H.tile('s5',66,280,'',' ','green',{w:112,show:false}),
  {t:'crowd',id:'users',x:190,y:390,tone:'green',label:'users',n:3,w:54,anchor:[190,370]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'pipeline',rows:STAGES,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'pipeline run'}],
 links:[H.lk('git','ci','gold'),H.lk('git','s0','blue',{dash:true}),H.lk('s0','s1','blue'),H.lk('s1','s2','blue'),H.lk('s2','s3','blue'),H.lk('s3','s4','blue'),H.lk('s4','s5','blue'),H.lk('s5','users','green',{dash:true})],
 controls:{title:'Build the pipeline',groups:[{items:ORDER.map(function(k){return {label:ST[k],wide:true,click:function(S,A){add(S,A,k)}}}).concat([
  {label:'undo',wide:true,click:function(S,A){S.p.pop();S.ran=false;var o=SET(S.p);Object.keys(o).forEach(function(x){A.set(x,o[x])});A.refresh()}},
  {label:'push a buggy commit',wide:true,click:function(S,A){run(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&S.ok;return [ok,ok?'Done. Tests first stopped the bug in minutes, one image moved from staging to prod, and a gate protected production.':S.ran?'The bug escaped or the run failed: read the last line, fix the order and push again.':'Goal: arrange the six stages so a buggy commit is stopped early and every release is verified before prod. Then push the bug.']},
 learn:[['Know CI vs CD',0],['Know the pipeline stages',1],['Build once, deploy many',2],['Use environments',3],['Fail fast',4],['Plan for rollback',5],['Measure the pipeline',6]],
 steps:[
  {t:'CI, CD and CD',b:'Continuous Integration: everyone merges small changes often, and every change is built and tested automatically. Continuous Delivery keeps main always releasable. Continuous Deployment releases every green change.',k:['idea','Key idea','The goal is fast, safe feedback: know within minutes if a change broke something.'],pill:'setup',tt:'Terms',focus:['git','ci'],S:{p:[],ran:false,ok:false},
   set:Object.assign(SET([]),{info:{title:'terms',rows:CICD,hl:[1,2,4]}}),termClear:true,term:{term:['$ git push origin feature/cart','# pipeline #812 started']},
   once:[{path:['git','ci'],label:'push',tone:'gold'}]},
  {t:'Pipeline stages',b:'A pipeline is a series of stages. Cheap, fast checks run first: lint and unit tests. Then build the artifact, push it, deploy to staging, verify, and finally deploy to production.',k:['tip','Remember','Order stages from fastest and cheapest to slowest and riskiest.'],pill:'idea',tt:'Stages',focus:['s0','s1','s2','s3','s4','s5'],S:{p:ORDER.slice()},
   set:Object.assign(SET(ORDER),{info:{title:'pipeline',rows:STAGES,hl:[1,2,3,4,5,6]}}),termClear:true,term:{term:['✓ lint + test     1m12s','✓ build image     2m40s','✓ push image        18s','✓ deploy staging    45s']},
   once:[{path:['git','s0','s1','s2','s3','s4','s5'],label:'',tone:'blue'}]},
  {t:'Build once, deploy many',b:'Build the image once, tag it with the commit, and promote that exact image from staging to production. Only configuration changes between environments.',k:['problem','Watch out','Rebuilding for production means production runs something nobody tested.'],pill:'idea',tt:'Artifact',focus:['s1','s2','s3','s5'],
   set:{info:{title:'artifacts',rows:ART,hl:[1,4]}},termClear:true,term:{term:['$ docker build -t app:3f2a9c1 .','$ kubectl -n staging set image ... app:3f2a9c1','$ kubectl -n prod    set image ... app:3f2a9c1']}},
  {t:'Environments',b:'Dev for building, staging as a copy of production for testing the real release, production for users. Staging should match production as closely as you can afford.',k:['tip','Remember','A staging environment that differs from prod gives false confidence. Same images, same config shape, smaller size.'],pill:'idea',tt:'Envs',focus:['s3','s5','users'],
   set:{info:{title:'pipeline',rows:STAGES,hl:[4,6]}},termClear:true,term:{term:['$ kubectl config get-contexts -o name','dev','staging','prod']}},
  {t:'Fail fast',b:'A failing test should stop the pipeline in minutes, before anything is built or deployed. The developer gets the feedback while the change is still fresh in their mind.',k:['idea','Key idea','A broken main branch blocks everyone. Fix it or revert it first, before any new work.'],pill:'problem',tt:'Fail fast',focus:['git','s0'],S:{p:['test']},
   set:Object.assign(SET(['test']),{info:{title:'pipeline',rows:STAGES,hl:[1]}}),termClear:true,term:{term:['✗ lint + test   2 failed, 184 passed','  test_cart_total: expected 30, got 33','# pipeline stopped. nothing was deployed.']},
   once:[{path:['git','s0'],label:'bug',tone:'red',ok:false,denyAt:'s0'}]},
  {t:'Plan for rollback',b:'Every deploy needs a way back. Because each image is tagged and kept, rolling back is just deploying the previous tag, ideally in one click or automatically.',k:['tip','Remember','Practice rollbacks. A rollback that has never been tried will fail on the worst day.'],pill:'idea',tt:'Rollback',focus:['s5','users'],S:{p:ORDER.slice()},
   set:Object.assign(SET(ORDER),{info:{title:'artifacts',rows:ART,hl:[1]}}),termClear:true,term:{term:['$ kubectl -n prod rollout undo deploy/web','deployment.apps/web rolled back','# or: redeploy app:7b9d014 from the pipeline']}},
  {t:'Measure the pipeline',b:'Track four numbers: how often you deploy, how long a change takes to reach prod, how often deploys fail, and how fast you recover. They are the DORA metrics.',k:['idea','Key idea','Teams that deploy small changes often have fewer and smaller failures, not more.'],pill:'idea',tt:'DORA',focus:['ci'],
   set:{info:{title:'terms',rows:['DORA metrics',{t:'deployment frequency     how often',tone:'gold'},{t:'lead time for changes    commit → prod',tone:'gold'},{t:'change failure rate      % that break',tone:'gold'},{t:'time to restore          how fast back',tone:'gold'}],hl:[1,2,3,4]}},termClear:true,term:{term:['# this month: 46 deploys, lead time 3 h','# failure rate 4%, restore 12 min']}},
  {t:'Try it: stop the bug',b:'Put the six stages in order, then push a commit with a bug in the cart total. Does the bug reach your users?',k:['tip','Challenge','Try deploying to prod before testing, or without staging. Read what happens each time.'],pill:'problem',tt:'Try it',S:{p:[],ran:false,ok:false},goal:true,focus:null,
   set:Object.assign(SET([]),{info:{title:'pipeline',rows:STAGES,hl:[]}}),termClear:true,term:{term:['# empty pipeline: add stages in order']}},
  {t:'Recap',b:'CI tests every change, CD keeps releases ready and automatic. Test first, build one artifact, promote it through environments behind a gate, and always keep a way back.',k:['idea','Next up','GitHub Actions: write a real pipeline as code.'],pill:'recap',tt:'Recap',S:{p:ORDER.slice(),ran:true,ok:true},
   set:Object.assign(SET(ORDER),{info:{title:'pipeline',rows:STAGES,hl:[]}}),termClear:true,term:{term:['✓ test → build → push → staging → gate → prod']}}
 ]});
})();
