(function(){
var G=[['pr','on: pull_request'],['cache','cache: pip'],['needs','needs: test'],['oidc','OIDC role'],['env','environment']];
var RES={pr:['bug caught on the PR, before merge','bug found only after merge to main'],cache:['test job 1m05s (cache hit)','test job 4m20s (deps every run)'],needs:['deploy waited and was skipped','deploy ran while tests were failing'],oidc:['short-lived token, nothing to leak','long-lived AWS keys in repo secrets'],env:['prod needed a reviewer\'s approval','prod deploy started with no review']};
function n(S){return G.filter(function(g){return S[g[0]]}).length}
function wf(S){var L=[{t:'on:',tone:'gold'},'  push: { branches: [main] }'];if(S.pr)L.push({t:'  pull_request:',tone:'green'});L.push({t:'jobs:',tone:'gold'},'  test:','    runs-on: ubuntu-latest','    steps: checkout, setup-python'+(S.cache?' + cache':'')+', pytest','  deploy:');if(S.needs)L.push({t:'    needs: test',tone:'green'});if(S.env)L.push({t:'    environment: production',tone:'green'});L.push(S.oidc?{t:'    permissions: { id-token: write }',tone:'green'}:{t:'    env: { AWS_KEY: ${{ secrets.AWS_KEY }} }',tone:'amber'});L.push('    steps: build, push, deploy');return L}
var WV=[0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){return function(S){return wf(S)[i]||''}});
var REAL=[{t:'# .github/workflows/ci.yml',tone:'gold'},'jobs:','  test:','    runs-on: ubuntu-latest','    steps:','      - uses: actions/checkout@v4','      - uses: actions/setup-python@v5',"        with: { python-version: '3.12', cache: pip }",'      - run: pip install -r requirements.txt','      - run: pytest -q'];
var TRIG=['Triggers',{t:'push           a commit lands on a branch',tone:'gold'},{t:'pull_request   a PR is opened or updated',tone:'gold'},{t:'schedule       cron: nightly jobs',tone:'gold'},{t:'workflow_dispatch  a "Run" button',tone:'gold'},'',{t:'Branch protection: require the test job',tone:'green'},{t:'to pass before a PR can merge.',tone:'green'}];
var OIDC=[{t:'permissions: { id-token: write }',tone:'green'},'steps:','  - uses: aws-actions/configure-aws-credentials@v4','    with:','      role-to-assume: arn:aws:iam::1234:role/gh-deploy','      aws-region: eu-west-1','',{t:'AWS trusts GitHub for this repo and branch.',tone:'gold'},{t:'Tokens last minutes. No keys to rotate.',tone:'gold'}];
var FAST=['Faster pipelines',{t:'cache       reuse pip / npm / Docker layers',tone:'gold'},{t:'matrix      test 3.11 and 3.12 in parallel',tone:'gold'},{t:'concurrency cancel older runs of the same PR',tone:'gold'},{t:'needs       run jobs in parallel where possible',tone:'gold'},'',{t:'A 5-minute pipeline gets run.',tone:'green'},{t:'A 40-minute one gets skipped.',tone:'red'}];
function run(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;
 A.send(['dev','gh'],{label:S.pr?'PR':'merge',tone:'gold',ok:true});L(700,function(){A.send(['gh','test'],{label:'test',tone:'red',ok:false,denyAt:'test'})});
 L(1500,function(){A.send(['gh','deploy'],{label:'deploy',tone:S.needs?'slate':'red',ok:!S.needs,denyAt:'deploy'})});
 L(2300,function(){if(!S.needs)A.send(['deploy','aws'],{label:S.oidc?'token':'key',tone:'red',ok:true})});
 L(3000,function(){S.ran=true;var Lx=['# PR #57 "fix cart" (has a failing test)'];G.forEach(function(g){var ok=!!S[g[0]];Lx.push((ok?'✓ ':'! ')+RES[g[0]][ok?0:1])});A.term('term',Lx,true);A.refresh()})}
LESSON('cicd','actions',{
 title:'GitHub Actions',sub:'Write the pipeline as YAML in the repo: triggers, jobs and steps, secrets, OIDC to AWS and faster builds.',time:'16 min',level:'Intermediate',
 S:{pr:false,cache:false,needs:false,oidc:false,env:false,ran:false},
 legend:[['#3fa456','correct behaviour'],['#e5534b','risk or bug'],['#5a4aa8','workflow']],
 hud:[{id:'n',l:'Fixes',v:function(S){return n(S)+' / 5'},lv:function(S){return n(S)==5?'good':'warn'}},{id:'t',l:'Test time',v:function(S){return S.cache?'1m05s':'4m20s'},lv:function(S){return S.cache?'good':'warn'}},{id:'k',l:'AWS auth',v:function(S){return S.oidc?'OIDC':'static keys'},lv:function(S){return S.oidc?'good':'bad'}},{id:'r',l:'Last run',v:function(S){return !S.ran?'—':n(S)==5?'safe':(5-n(S))+' problems'},lv:function(S){return !S.ran?'none':n(S)==5?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'dev',x:64,y:62,tone:'gold',label:'developer',n:1,w:46,anchor:[110,62]},
  H.box('gh',230,32,'GitHub Actions','violet',{center:true}),
  H.tile('test',96,210,'job: test','pytest','blue',{w:120}),
  H.tile('deploy',260,210,'job: deploy','build, push, apply','green',{w:136}),
  H.box('aws',260,330,'AWS / EKS','amber',{center:true}),
  H.tile('rev',90,340,'reviewer','approves prod','gold',{w:116}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:226,title:'ci.yml (condensed)',rows:WV,fs:8.6},
  {t:'term',id:'term',x:392,y:252,w:316,h:198,title:'run #812'}],
 links:[H.lk('dev','gh','gold'),H.lk('gh','test','blue'),H.lk('gh','deploy','green'),H.lk('test','deploy','blue',{dash:true,on:function(S){return S.needs}}),H.lk('deploy','aws','amber'),H.lk('rev','deploy','gold',{dash:true,on:function(S){return S.env}})],
 controls:{title:'Fix the workflow',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;A.set('code',{title:'ci.yml (condensed)',rows:WV,hl:[]});A.refresh()}}}).concat([{label:'open buggy PR',wide:true,click:function(S,A){run(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&n(S)==5;return [ok,ok?'Done. The bug was caught on the PR, nothing deployed, builds are fast, AWS uses short-lived tokens and prod needs a reviewer.':'Goal: a PR with a failing test must never reach AWS, builds should be fast, and deploys need no stored keys and a reviewer. Run it bare first.']},
 learn:[['Know workflows, jobs, steps',0],['Read real workflow YAML',1],['Choose triggers',2],['Use secrets and environments',3],['Connect to AWS with OIDC',4],['Make pipelines fast',5],['Chain jobs with needs',6]],
 steps:[
  {t:'Workflows, jobs and steps',b:'A workflow is a YAML file in .github/workflows. An event triggers it, it runs jobs on runners, and each job runs steps: either an action (uses) or a shell command (run).',k:['idea','Key idea','The pipeline lives in the repo, so it is reviewed and versioned like the code.'],pill:'setup',tt:'Basics',focus:['dev','gh','test','deploy'],S:{pr:false,cache:false,needs:false,oidc:false,env:false,ran:false},
   set:{code:{title:'ci.yml (condensed)',rows:WV,hl:[0,3,4,7]}},termClear:true,term:{term:['$ ls .github/workflows','ci.yml','$ gh run list --limit 1','✓ ci  main  push  1m58s']},
   once:[{path:['dev','gh','test'],label:'push',tone:'gold'}]},
  {t:'Real workflow YAML',b:'actions/checkout gets the code, setup-python installs Python and can cache pip, then run steps install and test. Each step\'s exit code decides if the job passes.',k:['tip','Remember','Pin actions to a major version (@v4) or a commit SHA, never to a moving branch.'],pill:'idea',tt:'YAML',focus:['test'],
   set:{code:{title:'ci.yml',rows:REAL,hl:[5,6,7,9]}},termClear:true,term:{term:['Run pytest -q','........................ [100%]','186 passed in 41.2s']}},
  {t:'Triggers',b:'push runs on new commits, pull_request on every PR update, schedule on a cron, workflow_dispatch from a button. Make the test job a required check before merging.',k:['problem','Watch out','A workflow that only runs on main finds bugs after they are merged, when everyone already pulled them.'],pill:'idea',tt:'Triggers',focus:['dev','gh'],S:{pr:true},
   set:{code:{title:'triggers',rows:TRIG,hl:[2,6,7]}},termClear:true,term:{term:['$ gh pr checks 57','✗ test   1m05s','- deploy skipped']}},
  {t:'Secrets and environments',b:'Secrets are encrypted in the repo or organisation settings and masked in logs. An environment like production can require reviewers and hold its own secrets.',k:['problem','Watch out','Secrets from a fork PR are not available by design. Never print secrets, even "just to debug".'],pill:'idea',tt:'Secrets',focus:['deploy','rev'],S:{env:true},
   set:{code:{title:'ci.yml (condensed)',rows:WV,hl:[]}},termClear:true,term:{term:['deploy  Waiting for review','  production requires approval from','  @platform-team']},
   once:[{path:['rev','deploy'],label:'✓',tone:'gold'}]},
  {t:'OIDC: no stored keys',b:'Instead of saving AWS access keys as secrets, let AWS trust GitHub through OIDC. The job asks for a short-lived token for one role, valid for this repo and branch only.',k:['idea','Key idea','Nothing long-lived to leak, nothing to rotate. This is the recommended way to deploy to AWS from Actions.'],pill:'idea',tt:'OIDC',focus:['deploy','aws'],S:{oidc:true},
   set:{code:{title:'OIDC to AWS',rows:OIDC,hl:[0,4,7,8]}},termClear:true,term:{term:['Run aws-actions/configure-aws-credentials@v4','Assuming role gh-deploy with OIDC','$ aws sts get-caller-identity --query Arn','".../assumed-role/gh-deploy/GitHubActions"']},
   once:[{path:['deploy','aws'],label:'token',tone:'green'}]},
  {t:'Make it fast',b:'Cache dependencies between runs, run independent jobs in parallel, test several versions with a matrix, and cancel outdated runs of the same PR with concurrency.',k:['tip','Remember','Measure first: the run summary shows which step is slow.'],pill:'idea',tt:'Speed',focus:['test'],S:{cache:true},
   set:{code:{title:'speed',rows:FAST,hl:[1,2,3]}},termClear:true,term:{term:['Cache restored from key: pip-ubuntu-3f2a','✓ test   1m05s   (was 4m20s)']}},
  {t:'Chaining jobs with needs',b:'Jobs run in parallel by default. needs: test makes deploy wait for test and skip if it fails. Build artifacts can be passed between jobs.',k:['problem','Watch out','Without needs, deploy and test start together, and a failing test does not stop the deploy.'],pill:'problem',tt:'needs',focus:['test','deploy'],S:{needs:true},
   set:{code:{title:'ci.yml (condensed)',rows:WV,hl:[8]}},termClear:true,term:{term:['✗ test    2 failed','- deploy  skipped (needs: test)']},
   once:[{path:['test','deploy'],label:'✗',tone:'red',ok:false,denyAt:'deploy'}]},
  {t:'Try it: harden the workflow',b:'A PR with a failing test is coming. Apply fixes to the workflow, then open the PR and see what happens to tests, deploys and AWS access.',k:['tip','Challenge','Run it bare first. Count how many things go wrong in one PR.'],pill:'problem',tt:'Try it',S:{pr:false,cache:false,needs:false,oidc:false,env:false,ran:false},goal:true,focus:null,
   set:{code:{title:'ci.yml (condensed)',rows:WV,hl:[]}},termClear:true,term:{term:['$ cat .github/workflows/ci.yml | wc -l','24']}},
  {t:'Recap',b:'Workflows live in the repo. Run tests on every PR, make deploy need test, cache for speed, authenticate to AWS with OIDC, and protect production with an environment and reviewers.',k:['idea','Next up','Deployment strategies: rolling, blue/green and canary.'],pill:'recap',tt:'Recap',S:{pr:true,cache:true,needs:true,oidc:true,env:true,ran:true},
   set:{code:{title:'ci.yml (condensed)',rows:WV,hl:[]}},termClear:true,term:{term:['✓ PR checks ✓ cache ✓ needs ✓ OIDC ✓ approval']}}
 ]});
})();
