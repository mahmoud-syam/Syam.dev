(function(){
var HX={m1:['a1f3c2e','init'],m2:['7b9d014','README'],m3:['c41e7a2','hotfix'],f1:['e92b1d0','login form'],f2:['5d7f3a8','add tests'],M:['8a0c6f1','merge']};
function ftip(S){return S.fc>=2?'f2':S.fc==1?'f1':'m2'}
function tip(S){return S.merged?(S.ff?ftip(S):'M'):(S.m3?'m3':'m2')}
function deco(S,id){var n=[];if(tip(S)==id)n.push('main');if(S.fb&&ftip(S)==id)n.push('feature');if(!n.length)return '';
 var h=S.br;n=n.map(function(b){return b==h?'HEAD -> '+b:b});n.sort(function(a){return a.indexOf('HEAD')==0?-1:1});return ' ('+n.join(', ')+')'}
function ln(S,pre,id){return {t:pre+HX[id][0]+deco(S,id)+' '+HX[id][1],tone:deco(S,id)?'gold':undefined}}
function graph(S){var r=[];
 if(S.merged&&!S.ff){r.push(ln(S,'*   ','M'),'|\\');if(S.fc>=2)r.push(ln(S,'| * ','f2'));r.push(ln(S,'| * ','f1'),ln(S,'* | ','m3'),'|/')}
 else if(S.m3&&S.fc>0){if(S.fc>=2)r.push(ln(S,'* ','f2'));r.push(ln(S,'* ','f1'),ln(S,'| * ','m3'),'|/')}
 else{if(S.fc>=2)r.push(ln(S,'* ','f2'));if(S.fc>=1)r.push(ln(S,'* ','f1'));if(S.m3)r.push(ln(S,'* ','m3'))}
 r.push(ln(S,'* ','m2'),ln(S,'* ','m1'));return r}
var GRAPH=[0,1,2,3,4,5,6,7].map(function(i){return function(S){return graph(S)[i]||''}});
var CONF=[{t:'app.py — CONFLICT',tone:'red'},{t:'<<<<<<< HEAD',tone:'red'},'timeout = 30',{t:'=======',tone:'amber'},'timeout = 60',{t:'>>>>>>> feature',tone:'red'},'','Keep the right line, delete the markers,','then git add + git commit.'];
var REB=['merge:  keeps both lines of history','        adds a merge commit','','rebase: replays your commits on top','        of main, history stays straight','',{t:'Never rebase commits others pulled.',tone:'red'}];
function vis(S,A){A.set('f1',{show:S.fc>=1});A.set('f2',{show:S.fc>=2});A.set('m3',{show:!!S.m3});A.set('M',{show:S.merged&&!S.ff});A.set('lfeat',{show:!!S.fb});
 A.set('lmain',{sub:S.br=='main'?'← HEAD':'branch'});A.set('lfeat',{sub:S.br=='feature'?'← HEAD':'branch'});A.refresh()}
var P=function(S){return {fb:S.fb,br:S.br,fc:S.fc,m3:S.m3,merged:S.merged,ff:S.ff}};
function C(id,x,y,tone,o){return H.tile(id,x,y,HX[id][0],HX[id][1],tone,Object.assign({w:80,h:40,fs:10.5},o||{}))}
function pl(a,b,tone,fn){return H.lk(a,b,tone,{on:fn})}
LESSON('git','branches',{
 title:'Branches & merging',sub:'Work on a feature without touching main, then bring it back with a merge.',time:'14 min',level:'Beginner',
 S:{fb:false,br:'main',fc:0,m3:false,merged:false,ff:false},
 legend:[['#c8962e','main'],['#5a4aa8','feature'],['#2f7d57','merge commit']],
 hud:[{id:'head',l:'HEAD →',v:function(S){return S.br},lv:'none'},{id:'main',l:'main at',v:function(S){return HX[tip(S)][0]},lv:'none'},{id:'feat',l:'feature at',v:function(S){return S.fb?HX[ftip(S)][0]:'—'},lv:'none'},{id:'mg',l:'Merge',v:function(S){return !S.merged?'not yet':S.ff?'fast-forward':'merge commit'},lv:function(S){return S.merged?'good':'none'}}],
 nodes:[
  H.tile('lmain',66,40,'main','← HEAD','gold',{w:96,h:40}),
  C('m1',46,130,'slate'),C('m2',138,130,'slate'),C('m3',230,130,'gold',{show:false}),C('M',322,130,'green',{show:false}),
  C('f1',230,240,'violet',{show:false}),C('f2',322,240,'violet',{show:false}),
  H.tile('lfeat',150,340,'feature','branch','violet',{w:104,h:40,show:false}),
  {t:'panel',id:'gr',x:392,y:14,w:316,h:170,title:'git log --oneline --graph --all',rows:GRAPH,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('m1','m2','slate'),H.lk('m2','m3','gold'),H.lk('m2','f1','violet'),H.lk('f1','f2','violet'),
  pl('m3','M','green',function(S){return S.merged&&!S.ff}),pl('f2','M','green',function(S){return S.merged&&!S.ff&&S.fc>=2}),pl('f1','M','green',function(S){return S.merged&&!S.ff&&S.fc==1}),
  pl('lmain','m2','gold',function(S){return tip(S)=='m2'}),pl('lmain','m3','gold',function(S){return tip(S)=='m3'}),pl('lmain','M','gold',function(S){return tip(S)=='M'}),pl('lmain','f1','gold',function(S){return tip(S)=='f1'}),pl('lmain','f2','gold',function(S){return tip(S)=='f2'}),
  pl('lfeat','m2','violet',function(S){return S.fb&&ftip(S)=='m2'}),pl('lfeat','f1','violet',function(S){return S.fb&&ftip(S)=='f1'}),pl('lfeat','f2','violet',function(S){return S.fb&&ftip(S)=='f2'})].map(function(l){if(l.a.charAt(0)=='l')l.dash=true;return l}),
 controls:{title:'Branch and merge',groups:[{items:[
  {label:'switch -c feature',wide:true,on:function(S){return S.fb},click:function(S,A){if(S.fb){A.term('term',['$ git switch -c feature',"! fatal: a branch named 'feature' already exists"]);return}S.fb=true;S.br='feature';A.term('term',['$ git switch -c feature',"Switched to a new branch 'feature'"]);A.fx('m2','pulse');vis(S,A)}},
  {label:'git commit',wide:true,click:function(S,A){if(S.merged){A.term('term',['$ # merged! start a new branch for new work']);return}
   if(S.br=='feature'){if(S.fc>=2){A.term('term',['$ # feature is ready: merge it into main']);return}S.fc++;var id=S.fc==1?'f1':'f2',pr=S.fc==1?'m2':'f1';A.send([pr,id],{label:'',tone:'violet',ok:true});A.term('term',['$ git commit -am "'+HX[id][1]+'"','[feature '+HX[id][0]+'] '+HX[id][1]]);A.after(700,function(){vis(S,A)})}
   else{if(S.m3){A.term('term',['$ # one hotfix on main is enough here']);return}S.m3=true;A.send(['m2','m3'],{label:'',tone:'gold',ok:true});A.term('term',['$ git commit -am "hotfix"','[main c41e7a2] hotfix']);A.after(700,function(){vis(S,A)})}}},
  {label:'switch main',wide:true,on:function(S){return S.br=='main'},click:function(S,A){S.br='main';A.term('term',['$ git switch main',"Switched to branch 'main'"]);vis(S,A)}},
  {label:'switch feature',wide:true,on:function(S){return S.br=='feature'},click:function(S,A){if(!S.fb){A.term('term',['$ git switch feature',"! fatal: invalid reference: feature"]);return}S.br='feature';A.term('term',['$ git switch feature',"Switched to branch 'feature'"]);vis(S,A)}},
  {label:'merge feature',wide:true,on:function(S){return S.merged},click:function(S,A){
   if(!S.fb||S.fc==0){A.term('term',['$ git merge feature',S.fb?'Already up to date.':'! merge: feature - not something we can merge']);return}
   if(S.br!='main'){A.term('term',['$ git merge feature','Already up to date.','$ # switch to main first: you merge INTO','$ # the branch you are on']);return}
   if(S.merged){A.term('term',['$ git merge feature','Already up to date.']);return}
   S.merged=true;S.ff=!S.m3;var t=ftip(S);
   if(S.ff){A.send([t,'lmain'],{label:'ff',tone:'gold',ok:true});A.term('term',['$ git merge feature','Updating 7b9d014..'+HX[t][0],'Fast-forward',' app.py | 12 ++++++++++++'])}
   else{A.send([t,'M'],{label:'',tone:'violet',ok:true});A.send(['m3','M'],{label:'',tone:'gold',ok:true});A.term('term',['$ git merge feature',"Merge made by the 'ort' strategy.",' app.py | 12 ++++++++++++'])}
   A.after(900,function(){vis(S,A)})}}]}]},
 goal:function(S){var ok=S.merged;return [ok,ok?(S.ff?'Done. main moved forward to the feature: a fast-forward merge. Try again with a hotfix on main first to see a merge commit.':'Done. main and feature had both moved on, so Git made a merge commit with two parents.'):'Goal: create a feature branch, commit on it, then merge it into main. Watch which branch HEAD points to.']},
 learn:[['Know what a branch is',0],['Create and switch branches',1],['Commit on a branch',2],['Fast-forward merge',3],['Merge commit',4],['Resolve a conflict',5],['Merge vs rebase',6]],
 steps:[
  {t:'A branch is a label',b:'A branch is just a movable label that points at a commit. main points at the newest commit, and HEAD tells Git which branch you are on.',k:['idea','Key idea','Creating a branch copies nothing. It only adds a new label, so it is instant and free.'],pill:'setup',tt:'Branch',focus:['lmain','m1','m2'],S:{fb:false,br:'main',fc:0,m3:false,merged:false,ff:false},
   set:{f1:{show:false},f2:{show:false},m3:{show:false},M:{show:false},lfeat:{show:false},lmain:{sub:'← HEAD'},gr:{title:'git log --oneline --graph --all',rows:GRAPH,hl:[0]}},termClear:true,term:{term:['$ git branch','* main','$ git log --oneline','7b9d014 (HEAD -> main) README','a1f3c2e init']},
   fx:[{n:'lmain',k:'pulse'}]},
  {t:'Create and switch',b:'git switch -c feature creates a new label on the current commit and moves HEAD to it. Both branches now point at the same commit.',k:['tip','Remember','git switch -c is the modern form of git checkout -b. Both do the same thing.'],pill:'idea',tt:'Create',focus:['lmain','lfeat','m2'],S:{fb:true,br:'feature'},
   set:{lfeat:{show:true,sub:'← HEAD'},lmain:{sub:'branch'},gr:{rows:GRAPH,hl:[0]}},termClear:true,term:{term:['$ git switch -c feature',"Switched to a new branch 'feature'",'$ git branch','* feature','  main']},
   once:[{path:['lfeat','m2'],label:'',tone:'violet'}]},
  {t:'Commit on the branch',b:'New commits move only the branch you are on. feature moves forward, main stays where it was, and main is safe from your unfinished work.',k:['idea','Key idea','This is why teams use branches: main always works, and each feature grows on its own branch.'],pill:'idea',tt:'Commits',focus:['m2','f1','f2','lfeat','lmain'],S:{fb:true,br:'feature',fc:2},
   set:{f1:{show:true},f2:{show:true},lfeat:{show:true,sub:'← HEAD'},lmain:{sub:'branch'},gr:{rows:GRAPH,hl:[0,1]}},termClear:true,term:{term:['$ git commit -am "login form"','[feature e92b1d0] login form','$ git commit -am "add tests"','[feature 5d7f3a8] add tests']},
   once:[{path:['m2','f1'],label:'',tone:'violet'},{path:['f1','f2'],label:'',tone:'violet',delay:900}]},
  {t:'Fast-forward merge',b:'Switch to main and merge. main has not moved, so Git simply slides the main label forward to the feature commit. No new commit is needed.',k:['tip','Remember','You always merge INTO the branch you are on. Switch to main first, then git merge feature.'],pill:'idea',tt:'Fast-fwd',focus:['lmain','m2','f1','f2'],S:{fb:true,br:'main',fc:2,merged:true,ff:true},
   set:{f1:{show:true},f2:{show:true},lfeat:{show:true,sub:'branch'},lmain:{sub:'← HEAD'},gr:{rows:GRAPH,hl:[0]}},termClear:true,term:{term:['$ git switch main','$ git merge feature','Updating 7b9d014..5d7f3a8','Fast-forward']},
   once:[{path:['f2','lmain'],label:'ff',tone:'gold'}]},
  {t:'When both sides moved',b:'Now imagine someone added a hotfix to main while you worked. The branches have split. Git joins them with a merge commit that has two parents.',k:['idea','Key idea','A merge commit records that two lines of work were joined. git log --graph shows the fork and the join.'],pill:'idea',tt:'Merge',focus:['m2','m3','f1','f2','M','lmain'],S:{fb:true,br:'main',fc:2,m3:true,merged:true,ff:false},
   set:{f1:{show:true},f2:{show:true},m3:{show:true},M:{show:true},lfeat:{show:true,sub:'branch'},lmain:{sub:'← HEAD'},gr:{rows:GRAPH,hl:[0,1]}},termClear:true,term:{term:['$ git merge feature',"Merge made by the 'ort' strategy.",'$ git log --oneline -1','8a0c6f1 Merge branch \'feature\'']},
   once:[{path:['f2','M'],label:'',tone:'violet'},{path:['m3','M'],label:'',tone:'gold',delay:300}],fx:[{n:'M',k:'ok'}]},
  {t:'Merge conflicts',b:'If both branches changed the same line, Git cannot choose and stops with a conflict. It marks both versions in the file and waits for you.',k:['problem','Watch out','Do not commit a file that still has <<<<<<< markers. Edit it, keep the right code, then git add and git commit.'],pill:'problem',tt:'Conflict',focus:['m3','f2','M'],S:{fb:true,br:'main',fc:2,m3:true,merged:false,ff:false},
   set:{f1:{show:true},f2:{show:true},m3:{show:true},M:{show:false},gr:{title:'app.py (conflict)',rows:CONF,hl:[1,3,5]}},termClear:true,term:{term:['$ git merge feature','CONFLICT (content): app.py','$ vim app.py   # keep timeout = 60','$ git add app.py','$ git commit']},
   once:[{path:['f2','m3'],label:'!',tone:'red',ok:false}]},
  {t:'Merge or rebase?',b:'Rebase is the other way to combine work: it replays your feature commits on top of main, so the history is one straight line. Merge keeps the real shape of history.',k:['problem','Watch out','Golden rule: only rebase your own local commits. Rebasing commits others already pulled rewrites their history.'],pill:'problem',tt:'Rebase',focus:['m3','f1','f2'],S:{fb:true,br:'feature',fc:2,m3:true,merged:false,ff:false},
   set:{f1:{show:true},f2:{show:true},m3:{show:true},M:{show:false},gr:{title:'merge vs rebase',rows:REB,hl:[6]}},termClear:true,term:{term:['$ git switch feature','$ git rebase main','Successfully rebased and updated','  refs/heads/feature.']},
   once:[{path:['m3','f1'],label:'re',tone:'violet'},{path:['f1','f2'],label:'re',tone:'violet',delay:900}]},
  {t:'Try it: ship a feature',b:'Use the buttons to create a feature branch, commit on it and merge it into main. Then go Back and try it again with a hotfix on main.',k:['tip','Challenge','Try merging while you are still on feature. Then commit on main before merging and compare the result.'],pill:'problem',tt:'Try it',S:{fb:false,br:'main',fc:0,m3:false,merged:false,ff:false},goal:true,focus:null,
   set:{f1:{show:false},f2:{show:false},m3:{show:false},M:{show:false},lfeat:{show:false},lmain:{sub:'← HEAD'},gr:{title:'git log --oneline --graph --all',rows:GRAPH,hl:[]}},termClear:true,term:{term:['$ git status','On branch main']}},
  {t:'Recap',b:'A branch is a label on a commit. Commit on a feature branch, switch to main and merge. Fast-forward when main has not moved, a merge commit when it has, and resolve conflicts by hand.',k:['idea','Next up','Remotes and pull requests: share your branch and get it reviewed.'],pill:'recap',tt:'Recap',S:{fb:true,br:'main',fc:2,m3:true,merged:true,ff:false},
   set:{f1:{show:true},f2:{show:true},m3:{show:true},M:{show:true},lfeat:{show:true,sub:'branch'},lmain:{sub:'← HEAD'},gr:{title:'git log --oneline --graph --all',rows:GRAPH,hl:[]}},termClear:true,term:{term:['$ git switch -c · commit · switch · merge']}}
 ]});
})();
