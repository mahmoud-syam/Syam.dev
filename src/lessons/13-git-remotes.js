(function(){
function prs(S){return S.pr=='merged'?'merged':S.pr=='open'?'open':'—'}
function ck(S){return S.ci=='pass'?'passed':S.ci=='run'?'running':'—'}
var PRP=[function(S){return {t:'PR #42   feature → main',tone:'gold'}},function(S){return 'Status:   '+prs(S)},function(S){return {t:'Checks:   '+ck(S),tone:S.ci=='pass'?'green':S.ci=='run'?'amber':undefined}},function(S){return {t:'Review:   '+(S.appr?'approved':'required'),tone:S.appr?'green':'amber'}},'',
 function(S){var ok=S.ci=='pass'&&S.appr;return S.pr=='merged'?{t:'✓ Merged into main',tone:'green'}:S.pr=='open'?{t:ok?'[ Merge pull request ]  ready':'[ Merge ]  blocked',tone:ok?'green':'red'}:'No pull request yet'}];
var REM=['origin = the name of the remote','','git clone   copy a repo + history','git push    upload your commits','git fetch   download, change nothing','git pull    fetch + merge into branch'];
var PROT=['Branch protection: main',{t:'✓ Require a pull request',tone:'green'},{t:'✓ Require 1 approval',tone:'green'},{t:'✓ Require status checks to pass',tone:'green'},{t:'✗ Direct pushes to main',tone:'red'}];
function vis(S,A){A.set('pr',{show:S.pr!='none',sub:S.pr=='merged'?'merged':'open',status:S.pr=='merged'?'run':'sleep'});A.set('ci',{show:S.pr!='none',sub:ck(S),status:S.ci=='pass'?'run':S.ci=='run'?'stop':undefined});A.refresh()}
LESSON('git','remotes',{
 title:'Remotes & pull requests',sub:'Share your branch on GitHub, get it reviewed and tested, then merge it safely.',time:'14 min',level:'Beginner',
 S:{pushed:false,pr:'none',ci:'none',appr:false,pulled:false},
 legend:[['#3fa456','passed / merged'],['#e8a33a','running'],['#e5534b','blocked']],
 hud:[{id:'up',l:'feature on GitHub',v:function(S){return S.pushed?'yes':'no'},lv:function(S){return S.pushed?'good':'none'}},{id:'pr',l:'PR #42',v:prs,lv:function(S){return S.pr=='merged'?'good':'none'}},{id:'ck',l:'Checks',v:ck,lv:function(S){return S.ci=='pass'?'good':S.ci=='run'?'warn':'none'}},{id:'lm',l:'Local main',v:function(S){return S.pr=='merged'&&!S.pulled?'behind':'up to date'},lv:function(S){return S.pr=='merged'&&!S.pulled?'warn':'good'}}],
 nodes:[
  {t:'crowd',id:'you',x:64,y:120,tone:'gold',label:'you',n:1,w:52,anchor:[120,120]},
  H.box('origin',290,34,'origin (GitHub)','slate',{center:true}),
  H.tile('pr',290,214,'PR #42','open','violet',{w:112,show:false,status:'sleep'}),
  H.tile('ci',96,276,'CI checks','running','amber',{w:118,show:false}),
  {t:'crowd',id:'rev',x:296,y:350,tone:'blue',label:'reviewer',n:1,w:48,anchor:[296,320]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'remotes',rows:REM,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('you','origin','gold'),H.lk('origin','pr','violet'),H.lk('pr','ci','amber'),H.lk('rev','pr','blue',{dash:true})],
 controls:{title:'Ship your feature',groups:[{items:[
  {label:'git push -u origin feature',wide:true,on:function(S){return S.pushed},click:function(S,A){S.pushed=true;A.send(['you','origin'],{label:'push',tone:'gold',ok:true});A.term('term',['$ git push -u origin feature','To github.com:syam/app.git',' * [new branch]  feature -> feature'])}},
  {label:'open pull request',wide:true,on:function(S){return S.pr!='none'},click:function(S,A){if(!S.pushed){A.term('term',['! GitHub has no feature branch yet: push it first']);A.fx('origin','no');return}if(S.pr!='none')return;
   S.pr='open';S.ci='run';A.send(['origin','pr'],{label:'PR',tone:'violet',ok:true});A.term('term',['$ gh pr create --base main --head feature','https://github.com/syam/app/pull/42']);A.after(600,function(){vis(S,A)});
   A.after(1200,function(){A.send(['pr','ci'],{label:'CI',tone:'amber',ok:true})});A.after(2800,function(){S.ci='pass';A.term('term',['✓ build  ✓ tests  ✓ lint']);vis(S,A)})}},
  {label:'request review',wide:true,on:function(S){return S.appr},click:function(S,A){if(S.pr!='open'){A.term('term',['! open a pull request first']);return}S.appr=true;A.send(['rev','pr'],{label:'✓',tone:'blue',ok:true});A.term('term',['reviewer approved these changes']);A.after(900,function(){vis(S,A)})}},
  {label:'merge PR',wide:true,on:function(S){return S.pr=='merged'},click:function(S,A){if(S.pr!='open'){A.term('term',[S.pr=='merged'?'# already merged':'! no pull request to merge']);return}
   if(!(S.ci=='pass'&&S.appr)){A.send(['pr','origin'],{label:'✕',tone:'red',ok:false});A.term('term',['! Merging is blocked',!S.appr?'! review required':'! checks still running']);return}
   S.pr='merged';A.send(['pr','origin'],{label:'merge',tone:'green',ok:true});A.term('term',['Merged #42 into main','Branch feature can be safely deleted']);A.after(900,function(){vis(S,A)})}},
  {label:'git pull',wide:true,on:function(S){return S.pulled},click:function(S,A){if(S.pr!='merged'){A.term('term',['$ git switch main && git pull','Already up to date.']);return}S.pulled=true;A.send(['origin','you'],{label:'pull',tone:'green',ok:true});A.term('term',['$ git switch main && git pull','Updating 7b9d014..8a0c6f1','Fast-forward','$ git branch -d feature','Deleted branch feature.'])}}]}]},
 goal:function(S){var ok=S.pr=='merged'&&S.pulled;return [ok,ok?'Done. The feature went through review and CI, merged into main, and your laptop is in sync.':'Goal: get your feature into main through a pull request, then update your local main. Try merging before review to meet branch protection.']},
 learn:[['Clone and name remotes',0],['Push a branch',1],['Fetch vs pull',2],['Open a pull request',3],['Review and CI checks',4],['Protect main',5],['Sync after merging',6]],
 steps:[
  {t:'Local and remote',b:'Your laptop has a full copy of the repository. GitHub holds another copy that the team shares. The remote copy is usually called origin.',k:['idea','Key idea','Git works offline. You only talk to the remote when you push, fetch or pull.'],pill:'setup',tt:'Remote',focus:['you','origin'],S:{pushed:false,pr:'none',ci:'none',appr:false,pulled:false},
   set:{pr:{show:false},ci:{show:false},info:{title:'remotes',rows:REM,hl:[0]}},termClear:true,term:{term:['$ git clone git@github.com:syam/app.git',"Cloning into 'app'...",'$ git remote -v','origin  git@github.com:syam/app.git (fetch)','origin  git@github.com:syam/app.git (push)']},
   once:[{path:['origin','you'],label:'clone',tone:'slate'}]},
  {t:'Push your branch',b:'git push uploads your commits to the remote. The first time, -u links your local branch to the remote one, so later you can just type git push.',k:['tip','Remember','Push your feature branch, not main. main changes only through pull requests.'],pill:'idea',tt:'push',focus:['you','origin'],S:{pushed:true},
   set:{info:{rows:REM,hl:[3]}},termClear:true,term:{term:['$ git push -u origin feature','To github.com:syam/app.git',' * [new branch]  feature -> feature',"branch 'feature' set up to track","  'origin/feature'."]},
   once:[{path:['you','origin'],label:'push',tone:'gold'}]},
  {t:'Fetch vs pull',b:'git fetch downloads new commits from the remote but does not change your files. git pull does a fetch and then merges those commits into your current branch.',k:['problem','Watch out','Pull before you start new work, or you will build on an old main and get conflicts later.'],pill:'problem',tt:'fetch',focus:['you','origin'],S:{pushed:true},
   set:{info:{rows:REM,hl:[4,5]}},termClear:true,term:{term:['$ git fetch','   7b9d014..c41e7a2  main -> origin/main','$ git status','Your branch is behind by 1 commit.','$ git pull','Fast-forward']},
   once:[{path:['origin','you'],label:'fetch',tone:'slate'},{path:['origin','you'],label:'pull',tone:'green',delay:1500}]},
  {t:'Open a pull request',b:'A pull request asks the team to merge your branch into main. It shows the diff, collects comments and runs checks, all in one place.',k:['idea','Key idea','A PR is a conversation about a change before it lands. Small PRs get reviewed faster and break less.'],pill:'idea',tt:'PR',focus:['origin','pr'],S:{pushed:true,pr:'open',ci:'none'},
   set:{pr:{show:true,sub:'open',status:'sleep'},ci:{show:false},info:{title:'pull request #42',rows:PRP,hl:[0]}},termClear:true,term:{term:['$ gh pr create --base main --head feature','? Title: Add login form','https://github.com/syam/app/pull/42']},
   once:[{path:['origin','pr'],label:'PR',tone:'violet'}]},
  {t:'Review and CI checks',b:'Every push to the PR triggers CI: build, tests and lint run automatically. A teammate reads the change and approves it or asks for fixes.',k:['tip','Remember','CI catches what machines can check. Review catches what only people can: design, naming, risk.'],pill:'idea',tt:'Review',focus:['pr','ci','rev'],S:{pushed:true,pr:'open',ci:'pass',appr:true},
   set:{pr:{show:true},ci:{show:true,sub:'passed',status:'run'},info:{title:'pull request #42',rows:PRP,hl:[2,3]}},termClear:true,term:{term:['$ gh pr checks 42','✓ build   1m02s','✓ tests   2m15s','✓ lint      18s','$ # reviewer: Approved']},
   once:[{path:['pr','ci'],label:'CI',tone:'amber'},{path:['rev','pr'],label:'✓',tone:'blue',delay:1300}],timed:[{at:200,set:{ci:{sub:'running',status:'stop'}}},{at:1500,set:{ci:{sub:'passed',status:'run'}}}]},
  {t:'Protect main',b:'Branch protection makes the rules automatic: nobody can push straight to main, and a PR can only merge after approval and green checks.',k:['problem','Watch out','Without protection, one tired push can break production. Turn it on for every shared repo.'],pill:'problem',tt:'Protect',focus:['you','origin','pr'],S:{pushed:true,pr:'open',ci:'pass',appr:true},
   set:{info:{title:'settings → branches',rows:PROT,hl:[4]}},termClear:true,term:{term:['$ git push origin main','! remote: error: GH006: Protected branch','! update failed for refs/heads/main.']},
   once:[{path:['you','origin'],label:'main',tone:'red',ok:false,denyAt:'origin'}]},
  {t:'Merge and sync',b:'Merge the PR on GitHub. Then update your laptop: switch to main, pull, and delete the finished branch. You are ready for the next feature.',k:['tip','Remember','The merge happened on GitHub, not on your laptop. Until you pull, your local main is behind.'],pill:'idea',tt:'Sync',focus:['pr','origin','you'],S:{pushed:true,pr:'merged',ci:'pass',appr:true,pulled:true},
   set:{pr:{show:true,sub:'merged',status:'run'},ci:{show:true,sub:'passed',status:'run'},info:{title:'pull request #42',rows:PRP,hl:[5]}},termClear:true,term:{term:['$ git switch main','$ git pull','Updating 7b9d014..8a0c6f1','$ git branch -d feature','Deleted branch feature.']},
   once:[{path:['pr','origin'],label:'merge',tone:'green'},{path:['origin','you'],label:'pull',tone:'green',delay:1300}]},
  {t:'Try it: ship through a PR',b:'Your feature is committed locally. Push it, open a PR, get it approved and green, merge it, and sync your laptop.',k:['tip','Challenge','Press merge PR as soon as the PR opens. Branch protection will stop you. What is missing?'],pill:'problem',tt:'Try it',S:{pushed:false,pr:'none',ci:'none',appr:false,pulled:false},goal:true,focus:null,
   set:{pr:{show:false},ci:{show:false},info:{title:'pull request',rows:PRP,hl:[]}},termClear:true,term:{term:['$ git status','On branch feature','nothing to commit, working tree clean']}},
  {t:'Recap',b:'Push your branch, open a pull request, let CI and a reviewer check it, merge it on GitHub, then pull main on your laptop. Branch protection enforces the flow.',k:['idea','Next up','Undo: how to fix mistakes with restore, reset, revert and stash.'],pill:'recap',tt:'Recap',S:{pushed:true,pr:'merged',ci:'pass',appr:true,pulled:true},
   set:{pr:{show:true,sub:'merged',status:'run'},ci:{show:true,sub:'passed',status:'run'},info:{title:'pull request #42',rows:PRP,hl:[]}},termClear:true,term:{term:['$ push → PR → CI + review → merge → pull']}}
 ]});
})();
