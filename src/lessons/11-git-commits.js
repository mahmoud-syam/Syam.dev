(function(){
function st(S){return !S.mod?[{t:'On branch main',tone:'gold'},'nothing to commit,','working tree clean']:S.staged?[{t:'On branch main',tone:'gold'},'Changes to be committed:',{t:'    modified:   app.py',tone:'green'}]:[{t:'On branch main',tone:'gold'},'Changes not staged for commit:',{t:'    modified:   app.py',tone:'red'},'','(use "git add" to stage it)']}
var STATUS=[0,1,2,3,4].map(function(i){return function(S){return st(S)[i]||''}});
var GI=['# .gitignore','.env            # secrets','node_modules/   # dependencies','__pycache__/','*.log','dist/           # build output'];
var LOG=[{t:'3e5a9f1 (HEAD -> main) fix login bug',tone:'gold'},'7b9d014 add README','a1f3c2e initial commit','','git log --oneline'];
function fsub(S){return !S.mod?'committed':S.staged?'staged':'modified'}
function fst(S){return !S.mod?'run':S.staged?'sleep':'stop'}
var HS=[['7b9d014','add README'],['3e5a9f1','fix login bug'],['9c2b7d4','tidy app.py'],['5f81e0a','more changes'],['d04e6b2','small fix']];
function hs(n){return HS[Math.min(n-2,HS.length-1)]}
function sync(S,A){A.set('f1',{sub:fsub(S),status:fst(S)});var a=hs(Math.max(2,S.commits-1)),b=hs(S.commits);if(S.commits>=3){A.set('c2',{title:a[0],sub:a[1]});A.set('c3',{show:true,title:b[0],sub:b[1]})}else{A.set('c2',{title:'7b9d014',sub:'add README'});A.set('c3',{show:false,title:'3e5a9f1',sub:'fix login bug'})}A.refresh()}
function add(S,A){if(!S.mod){A.term('term',['$ git add app.py','$ git status -s','# nothing to stage']);return}
 S.staged=true;A.send(['wd','idx'],{label:'add',tone:'blue',ok:true});A.term('term',['$ git add app.py','$ git status -s','M  app.py']);A.after(900,function(){sync(S,A)})}
function commit(S,A){if(!S.staged){A.send(['idx','repo'],{label:'?',tone:'red',ok:false});A.term('term',['$ git commit -m "fix login bug"','! no changes added to commit','$ # git add first']);return}
 S.staged=false;S.mod=false;S.commits++;var h=hs(S.commits);A.send(['idx','repo'],{label:'commit',tone:'green',ok:true});A.term('term',['$ git commit -m "'+h[1]+'"','[main '+h[0]+'] '+h[1],' 1 file changed, 2 insertions(+)']);A.after(1100,function(){sync(S,A)})}
LESSON('git','commits',{
 title:'Repos, commits & staging',sub:'How Git records snapshots: the working directory, the staging area and the repository.',time:'12 min',level:'Beginner',
 S:{mod:true,staged:false,commits:2},
 legend:[['#e8a33a','modified'],['#3b82c4','staged'],['#3fa456','committed']],
 hud:[{id:'br',l:'Branch',v:'main',lv:'none'},{id:'fs',l:'app.py',v:fsub,lv:function(S){return !S.mod?'good':S.staged?'none':'warn'}},{id:'n',l:'Commits',v:function(S){return String(S.commits)},lv:'none'},{id:'head',l:'HEAD',v:function(S){return hs(S.commits)[0]},lv:'none'}],
 nodes:[
  H.box('wd',64,34,'working dir','amber',{center:true}),
  H.box('idx',190,34,'staging','blue',{center:true}),
  H.box('repo',316,34,'repository','green',{center:true}),
  H.tile('f1',104,190,'app.py','modified','amber',{w:118,status:'stop'}),
  H.tile('f2',268,190,'README.md','committed','slate',{w:126,status:'run'}),
  H.tile('c1',66,296,'a1f3c2e','initial commit','green',{w:112,fs:11}),
  H.tile('c2',190,296,'7b9d014','add README','green',{w:112,fs:11}),
  H.tile('c3',314,296,'3e5a9f1','fix login bug','gold',{w:112,fs:11,show:false}),
  H.tile('head',190,388,'main','← HEAD','gold',{w:104}),
  {t:'panel',id:'stat',x:392,y:14,w:316,h:170,title:'git status',rows:STATUS,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('wd','idx','blue'),H.lk('idx','repo','green'),H.lk('c1','c2','green'),H.lk('c2','c3','green'),
  H.lk('head','c2','gold',{on:function(S){return S.commits<3}}),H.lk('head','c3','gold',{on:function(S){return S.commits>=3}})],
 controls:{title:'Work on app.py',groups:[{items:[
  {label:'edit app.py',wide:true,click:function(S,A){if(S.mod&&!S.staged){A.term('term',['$ # app.py already has changes']);return}S.mod=true;S.staged=false;A.fx('wd','pulse');A.term('term',['$ vim app.py   # change a line','$ git status -s',' M app.py']);sync(S,A)}},
  {label:'git diff',wide:true,click:function(S,A){A.term('term',S.mod&&!S.staged?['$ git diff','-    if user = None:','+    if user is None:']:S.staged?['$ git diff','# empty: changes are staged','$ git diff --staged','+    if user is None:']:['$ git diff','# no changes'])}},
  {label:'git add app.py',wide:true,on:function(S){return S.staged},click:function(S,A){add(S,A)}},
  {label:'git commit',wide:true,click:function(S,A){commit(S,A)}},
  {label:'git log',wide:true,click:function(S,A){var L=['$ git log --oneline'];for(var n=S.commits;n>=2&&L.length<5;n--){var h=hs(n);L.push(h[0]+' '+h[1])}L.push('a1f3c2e initial commit');A.term('term',L)}}]}]},
 goal:function(S){var ok=S.commits>=3&&!S.mod;return [ok,ok?'Done. Your fix is a commit: a permanent snapshot in the history, and the tree is clean.':'Goal: record the change to app.py as a new commit. Try committing first and see what Git says.']},
 learn:[['Know what a repository is',0],['Tell the three areas apart',1],['Read git status',2],['Stage with git add',3],['Commit with a message',4],['Read log and diff',5]],
 steps:[
  {t:'Git keeps the history',b:'Git records snapshots of your project over time. A repository is your project folder plus a hidden .git folder that stores every snapshot.',k:['idea','Key idea','Each snapshot is a commit with an id, an author, a date and a message. You can go back to any of them.'],pill:'setup',tt:'Git',focus:['repo','c1','c2','head'],S:{mod:false,staged:false,commits:2},
   set:{f1:{sub:'committed',status:'run'},c3:{show:false},stat:{title:'git status',rows:STATUS,hl:[]}},termClear:true,term:{term:['$ git init myapp','Initialized empty Git repository','$ ls -a myapp','.  ..  .git']},
   once:[{path:['c1','c2'],label:'',tone:'green'}],fx:[{n:'repo',k:'pulse'}]},
  {t:'Three areas',b:'You edit files in the working directory. You pick which changes go into the next snapshot by moving them to the staging area. A commit saves the staged changes into the repository.',k:['idea','Key idea','Working dir → git add → staging → git commit → repository.'],pill:'idea',tt:'Areas',focus:['wd','idx','repo'],S:{mod:true,staged:false,commits:2},
   set:{f1:{sub:'modified',status:'stop'}},termClear:true,term:{term:['$ # edit → add → commit','$ # the same three steps, every time']},
   once:[{path:['wd','idx'],label:'add',tone:'blue'},{path:['idx','repo'],label:'commit',tone:'green',delay:1300}]},
  {t:'git status: where am I?',b:'git status tells you which files changed and which area they are in. Run it before every add and every commit.',k:['tip','Remember','Red means changed but not staged. Green means staged and ready to commit.'],pill:'idea',tt:'status',focus:['wd','f1','f2'],S:{mod:true,staged:false,commits:2},
   set:{stat:{rows:STATUS,hl:[1,2]}},termClear:true,term:{term:['$ git status','On branch main','Changes not staged for commit:','    modified:   app.py']},
   fx:[{n:'f1',k:'no'}]},
  {t:'git add: stage a change',b:'git add moves a change into the staging area. You can stage one file and leave others out, so each commit contains one logical change.',k:['problem','Watch out','git add . stages everything, including files you did not mean to commit. Check git status first.'],pill:'problem',tt:'add',focus:['wd','idx','f1'],S:{mod:true,staged:true,commits:2},
   set:{f1:{sub:'staged',status:'sleep'},stat:{rows:STATUS,hl:[1,2]}},termClear:true,term:{term:['$ git add app.py','$ git status -s','M  app.py','$ # M in the first column = staged']},
   once:[{path:['wd','idx'],label:'add',tone:'blue'}]},
  {t:'git commit: take the snapshot',b:'git commit saves everything in the staging area as a new commit and moves main and HEAD forward to it. The message says why you made the change.',k:['tip','Remember','A good message is short and specific: "fix login bug", not "update" or "stuff".'],pill:'idea',tt:'commit',focus:['idx','repo','c2','c3','head'],S:{mod:false,staged:false,commits:3},
   set:{f1:{sub:'committed',status:'run'},c3:{show:true},stat:{rows:STATUS,hl:[]}},termClear:true,term:{term:['$ git commit -m "fix login bug"','[main 3e5a9f1] fix login bug',' 1 file changed, 2 insertions(+)']},
   once:[{path:['idx','repo'],label:'commit',tone:'green'},{path:['c2','c3'],label:'',tone:'gold',delay:1100}]},
  {t:'git log and git diff',b:'git log lists the commits, newest first. git diff shows the exact lines you changed. git diff --staged shows what is about to be committed.',k:['idea','Key idea','HEAD is the commit you are on now. It normally points at the newest commit of your branch.'],pill:'idea',tt:'log',focus:['c1','c2','c3','head'],S:{mod:false,staged:false,commits:3},
   set:{c3:{show:true},stat:{title:'git log',rows:LOG,hl:[0]}},termClear:true,term:{term:['$ git log --oneline','3e5a9f1 fix login bug','7b9d014 add README','a1f3c2e initial commit','$ git show --stat HEAD',' app.py | 2 +-']},
   fx:[{n:'head',k:'pulse'}]},
  {t:'.gitignore and good commits',b:'Some files must never be committed: secrets, dependencies, logs and build output. List them in .gitignore and Git stops showing them.',k:['problem','Watch out','A password pushed to Git stays in the history even after you delete the file. Ignore .env from day one.'],pill:'problem',tt:'Ignore',focus:['wd','idx'],S:{mod:false,staged:false,commits:3},
   set:{stat:{title:'.gitignore',rows:GI,hl:[1]}},termClear:true,term:{term:['$ echo ".env" >> .gitignore','$ git status -s','?? .gitignore','$ git check-ignore -v .env','.gitignore:1:.env  .env']},
   once:[{path:['wd','idx'],label:'.env',tone:'red',ok:false,denyAt:'idx'}]},
  {t:'Try it: commit your fix',b:'app.py has a change. Turn it into a commit with the buttons, then check the history.',k:['tip','Challenge','Press git commit first and read the error. Then use git diff, git add and commit in that order.'],pill:'problem',tt:'Try it',S:{mod:true,staged:false,commits:2},goal:true,focus:['wd','idx','repo','f1','c2','c3'],
   set:{f1:{sub:'modified',status:'stop'},c2:{title:'7b9d014',sub:'add README'},c3:{show:false,title:'3e5a9f1',sub:'fix login bug'},stat:{title:'git status',rows:STATUS,hl:[]}},termClear:true,term:{term:['$ git status -s',' M app.py']}},
  {t:'Recap',b:'Edit in the working directory, stage with git add, save with git commit. git status and git diff show where you are, git log shows where you have been.',k:['idea','Next up','Branches and merging: work on a feature without touching main.'],pill:'recap',tt:'Recap',S:{mod:false,staged:false,commits:3},
   set:{f1:{sub:'committed',status:'run'},c3:{show:true},stat:{title:'git status',rows:STATUS,hl:[]}},termClear:true,term:{term:['$ git status → add → commit → log']}}
 ]});
})();
