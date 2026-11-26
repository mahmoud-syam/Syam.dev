(function(){
var HX={c1:['a1f3c2e','init'],c2:['7b9d014','README'],c3:['3e5a9f1','fix login'],c4:['b7e21c9','debug pwd'],r:['f0d93a4','revert']};
function tip(S){return S.reset?'c3':S.reverted?'r':'c4'}
function otip(S){return S.pushed?'r':'c4'}
var MAP=['Which undo do I need?',{t:'discard a file change  git restore f',tone:'gold'},{t:'unstage a file         restore --staged',tone:'gold'},{t:'fix the last commit    commit --amend',tone:'gold'},{t:'undo local commits     git reset',tone:'gold'},{t:'undo a pushed commit   git revert',tone:'green'},{t:'park unfinished work   git stash',tone:'gold'},{t:'find a lost commit     git reflog',tone:'gold'}];
var RST=['git reset moves the branch back:','',{t:'--soft   changes stay staged',tone:'green'},{t:'--mixed  changes stay in your files',tone:'gold'},'         (the default)',{t:'--hard   changes are DELETED',tone:'red'},'','Only for commits you have NOT pushed.'];
var LOG=[0,1,2,3,4].map(function(i){return function(S){var ids=[tip(S)];if(ids[0]=='r')ids.push('c4');var c=ids[ids.length-1];var order=['c4','c3','c2','c1'];var rest=order.slice(order.indexOf(c)+1);var all=ids.concat(rest);var id=all[i];if(!id)return '';
 var d=[];if(id==tip(S))d.push('HEAD -> main');if(id==otip(S))d.push('origin/main');return {t:HX[id][0]+(d.length?' ('+d.join(', ')+')':'')+' '+HX[id][1],tone:id=='c4'?'red':d.length?'gold':undefined}}});
var RLOG=['git reflog — every move of HEAD',{t:'3e5a9f1 HEAD@{0}: reset: moving to HEAD~1',tone:'red'},'b7e21c9 HEAD@{1}: commit: debug pwd','3e5a9f1 HEAD@{2}: commit: fix login','','git reset --hard HEAD@{1}  brings it back'];
function vis(S,A){A.set('r',{show:!!S.reverted});A.set('wip',{show:!!S.wip,sub:'uncommitted',status:'stop'});A.set('stash',{});A.refresh()}
function C(id,x,y,tone,o){return H.tile(id,x,y,HX[id][0],HX[id][1],tone,Object.assign({w:80,h:40,fs:10.5},o||{}))}
function pl(a,b,tone,fn){return H.lk(a,b,tone,{on:fn,dash:true})}
LESSON('git','undo',{
 title:'Undo: reset, revert, stash',sub:'Fix mistakes safely, whether the change is local, committed or already pushed.',time:'15 min',level:'Intermediate',
 S:{wip:true,stashed:false,reverted:false,pushed:false,popped:false,reset:false},
 legend:[['#e5534b','bad commit'],['#3fa456','revert commit'],['#5a4aa8','stash']],
 hud:[{id:'head',l:'HEAD',v:function(S){return HX[tip(S)][0]},lv:'none'},{id:'wt',l:'Working tree',v:function(S){return S.wip?'dirty':'clean'},lv:function(S){return S.wip?'warn':'good'}},{id:'st',l:'Stash',v:function(S){return S.stashed?'1 entry':'empty'},lv:'none'},{id:'om',l:'origin/main',v:function(S){return HX[otip(S)][0]},lv:function(S){return S.pushed?'good':'bad'}}],
 nodes:[
  H.tile('org',322,34,'origin/main','pushed','slate',{w:118,h:40,fs:10.5}),
  C('c1',46,124,'slate'),C('c2',138,124,'slate'),C('c3',230,124,'slate'),C('c4',322,124,'red'),
  C('r',322,222,'green',{show:false}),
  H.tile('lmain',176,222,'main','← HEAD','gold',{w:104,h:40}),
  H.tile('wip',84,330,'login.py','uncommitted','amber',{w:124,status:'stop'}),
  H.box('stash',262,300,'stash','violet',{center:true,sub:function(S){return S.stashed?'1 entry':'empty'}}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'git log --oneline',rows:LOG,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('c1','c2','slate'),H.lk('c2','c3','slate'),H.lk('c3','c4','red'),H.lk('c4','r','green'),H.lk('wip','stash','violet',{dash:true}),
  pl('lmain','c4','gold',function(S){return tip(S)=='c4'}),pl('lmain','c3','gold',function(S){return tip(S)=='c3'}),pl('lmain','r','gold',function(S){return tip(S)=='r'}),
  pl('org','c4','slate',function(S){return otip(S)=='c4'}),pl('org','r','slate',function(S){return otip(S)=='r'})],
 controls:{title:'Clean up main',groups:[{items:[
  {label:'git stash',wide:true,on:function(S){return S.stashed},click:function(S,A){if(!S.wip){A.term('term',['$ git stash','No local changes to save']);return}S.wip=false;S.stashed=true;A.send(['wip','stash'],{label:'WIP',tone:'violet',ok:true});A.term('term',['$ git stash','Saved working directory and index state','  WIP on main: b7e21c9 debug pwd']);A.after(800,function(){vis(S,A)})}},
  {label:'reset --hard HEAD~1',wide:true,click:function(S,A){A.fx('c4','no');A.send(['lmain','c3'],{label:'?',tone:'red',ok:false});A.term('term',['$ # b7e21c9 is already on origin/main','! reset rewrites shared history: your','! next push is rejected, and teammates','! who pulled it still have it.','$ # use git revert for pushed commits'])}},
  {label:'git revert HEAD',wide:true,on:function(S){return S.reverted},click:function(S,A){if(S.reverted){A.term('term',['$ # already reverted']);return}
   if(S.wip){A.term('term',['$ git revert HEAD','! error: your local changes would be','! overwritten by revert.','hint: commit your changes or stash them']);A.fx('wip','no');return}
   S.reverted=true;A.send(['c4','r'],{label:'undo',tone:'green',ok:true});A.term('term',['$ git revert HEAD --no-edit','[main f0d93a4] Revert "debug pwd"',' 1 file changed, 1 deletion(-)']);A.after(800,function(){vis(S,A)})}},
  {label:'git push',wide:true,on:function(S){return S.pushed},click:function(S,A){if(!S.reverted){A.term('term',['$ git push','Everything up-to-date']);return}S.pushed=true;A.send(['r','org'],{label:'push',tone:'gold',ok:true});A.term('term',['$ git push','   b7e21c9..f0d93a4  main -> main']);A.after(900,function(){A.refresh()})}},
  {label:'git stash pop',wide:true,on:function(S){return S.popped},click:function(S,A){if(!S.stashed){A.term('term',['$ git stash pop','! No stash entries found.']);return}S.stashed=false;S.wip=true;S.popped=true;A.send(['stash','wip'],{label:'WIP',tone:'violet',ok:true});A.term('term',['$ git stash pop','On branch main','  modified:   login.py','Dropped refs/stash@{0}']);A.after(800,function(){vis(S,A)})}}]}]},
 goal:function(S){var ok=S.reverted&&S.pushed&&S.popped;return [ok,ok?'Done. The bad commit is undone on origin without rewriting history, and your unfinished work is back. Now rotate that password.':'Goal: undo the pushed commit b7e21c9 safely, push the fix, and keep your unfinished work in login.py.']},
 learn:[['Pick the right undo',0],['Discard and unstage',1],['Amend the last commit',2],['Reset local commits',3],['Revert pushed commits',4],['Stash unfinished work',5],['Recover with reflog',6]],
 steps:[
  {t:'Pick the right undo',b:'Git has a different undo for each situation. The key question is: has this change been pushed? Local mistakes can be rewritten. Pushed ones must be undone with a new commit.',k:['idea','Key idea','Local: restore, amend, reset. Shared: revert. Unfinished work: stash.'],pill:'setup',tt:'Map',focus:['c4','org','lmain','wip'],S:{wip:true,stashed:false,reverted:false,pushed:false,popped:false,reset:false},
   set:{r:{show:false},wip:{show:true,sub:'uncommitted',status:'stop'},c4:{title:'b7e21c9',sub:'debug pwd'},info:{title:'undo map',rows:MAP,hl:[5]}},termClear:true,term:{term:['$ git status -s',' M login.py','$ git log --oneline -1','b7e21c9 debug pwd']},
   fx:[{n:'c4',k:'no'}]},
  {t:'restore: discard or unstage',b:'git restore file throws away changes in your working directory. git restore --staged file takes a file out of the staging area but keeps the change.',k:['problem','Watch out','A discarded change was never committed, so Git cannot bring it back. Be sure before you restore.'],pill:'problem',tt:'restore',focus:['wip'],S:{wip:true},
   set:{info:{title:'undo map',rows:MAP,hl:[1,2]}},termClear:true,term:{term:['$ git restore --staged login.py','$ # unstaged, change is still in the file','$ git restore login.py','$ # change is gone for good']},
   timed:[{at:2200,set:{wip:{sub:'discarded',status:'dead'}}}]},
  {t:'amend: fix the last commit',b:'git commit --amend replaces the last commit with a new one: fix a typo in the message or add a forgotten file. The commit gets a new id.',k:['problem','Watch out','Amend only before you push. It creates a different commit, so a pushed one would no longer match.'],pill:'problem',tt:'amend',focus:['c3','c4','lmain'],S:{wip:true},
   set:{wip:{sub:'uncommitted',status:'stop'},info:{title:'undo map',rows:MAP,hl:[3]}},termClear:true,term:{term:['$ git add forgotten.py','$ git commit --amend --no-edit','[main 9a77e40] debug pwd','$ # b7e21c9 replaced by 9a77e40']},
   timed:[{at:1800,set:{c4:{title:'9a77e40',sub:'amended'}}}],fx:[{n:'c4',k:'pulse'}]},
  {t:'reset: move the branch back',b:'git reset moves your branch label back to an older commit, as if the newer ones never happened. The mode decides what happens to their changes.',k:['tip','Remember','git reset --soft HEAD~1 is the safe way to "uncommit" the last commit and keep everything staged.'],pill:'idea',tt:'reset',focus:['c3','c4','lmain'],S:{reset:true},
   set:{c4:{title:'b7e21c9',sub:'debug pwd'},info:{title:'git reset modes',rows:RST,hl:[5]}},termClear:true,term:{term:['$ git reset --soft HEAD~1','$ git status -s','M  login.py','$ # commit gone, change still staged']},
   once:[{path:['lmain','c3'],label:'~1',tone:'gold'}]},
  {t:'revert: undo with a new commit',b:'git revert creates a new commit that does the opposite of an old one. History is not rewritten, so it is safe for commits that others already pulled.',k:['idea','Key idea','Reset erases history. Revert adds to it. On a shared branch, always revert.'],pill:'idea',tt:'revert',focus:['c4','r','lmain','org'],S:{reset:false,reverted:true,wip:false},
   set:{r:{show:true},wip:{show:false},info:{title:'git log --oneline',rows:LOG,hl:[0,1]}},termClear:true,term:{term:['$ git revert HEAD --no-edit','[main f0d93a4] Revert "debug pwd"','$ git log --oneline -2','f0d93a4 Revert "debug pwd"','b7e21c9 debug pwd']},
   once:[{path:['c4','r'],label:'undo',tone:'green'}]},
  {t:'stash: park unfinished work',b:'git stash saves your uncommitted changes and gives you a clean working tree. Later, git stash pop brings them back. Useful when you must switch tasks quickly.',k:['tip','Remember','git stash list shows what you parked. Give stashes a name: git stash push -m "login wip".'],pill:'idea',tt:'stash',focus:['wip','stash'],S:{reverted:false,wip:true,stashed:false},
   set:{r:{show:false},wip:{show:true,sub:'uncommitted',status:'stop'},info:{title:'undo map',rows:MAP,hl:[6]}},termClear:true,term:{term:['$ git stash push -m "login wip"','Saved working directory and index state','$ git stash list','stash@{0}: On main: login wip','$ git stash pop']},
   once:[{path:['wip','stash'],label:'WIP',tone:'violet'},{path:['stash','wip'],label:'WIP',tone:'violet',delay:2200}],timed:[{at:900,S:{wip:false,stashed:true},set:{wip:{show:false}}},{at:3000,S:{wip:true,stashed:false},set:{wip:{show:true}}}]},
  {t:'reflog: the safety net',b:'Even after a bad reset --hard, the old commits still exist for a while. git reflog lists every place HEAD has been, so you can jump back.',k:['tip','Remember','Unreachable commits are kept for weeks before cleanup. Almost nothing you committed is truly lost.'],pill:'idea',tt:'reflog',focus:['c3','c4','lmain'],S:{wip:true,reset:true},
   set:{info:{title:'git reflog',rows:RLOG,hl:[2,5]}},termClear:true,term:{term:['$ git reset --hard HEAD~1   # oops','$ git reflog -3','$ git reset --hard HEAD@{1}','HEAD is now at b7e21c9 debug pwd']},
   once:[{path:['lmain','c3'],label:'oops',tone:'red'},{path:['c3','c4'],label:'back',tone:'gold',delay:1800}],timed:[{at:2600,S:{reset:false}}]},
  {t:'Try it: undo a pushed mistake',b:'You pushed b7e21c9, a commit with a debug password, to main. You also have unfinished work in login.py. Clean it up without losing anything.',k:['problem','Watch out','Revert removes the password from the code, not from history. A leaked secret must also be rotated.'],pill:'problem',tt:'Try it',S:{wip:true,stashed:false,reverted:false,pushed:false,popped:false,reset:false},goal:true,focus:null,
   set:{r:{show:false},wip:{show:true,sub:'uncommitted',status:'stop'},c4:{title:'b7e21c9',sub:'debug pwd'},info:{title:'git log --oneline',rows:LOG,hl:[]}},termClear:true,term:{term:['$ git status -s',' M login.py']}},
  {t:'Recap',b:'Before you undo, ask whether the change was pushed. Restore, amend and reset fix local work. Revert fixes shared history. Stash parks work, and reflog finds what you thought was lost.',k:['idea','Next up','Bash: automate the commands you have been typing by hand.'],pill:'recap',tt:'Recap',S:{wip:true,stashed:false,reverted:true,pushed:true,popped:true,reset:false},
   set:{r:{show:true},wip:{show:true,sub:'uncommitted',status:'stop'},c4:{title:'b7e21c9',sub:'debug pwd'},info:{title:'undo map',rows:MAP,hl:[]}},termClear:true,term:{term:['$ restore · amend · reset · revert · stash']}}
 ]});
})();
