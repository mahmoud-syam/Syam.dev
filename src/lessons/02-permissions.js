LESSON('linux','permissions',{
 title:'File permissions',sub:'Who gets in, who gets blocked — and the one number that decides it.',time:'10 min',level:'Beginner',
 S:{b:PRE.slice()},
 legend:[['#3b82c4','read'],['#e0a526','write'],['#8a5ad8','run'],['#e5534b','denied']],
 hud:[chip(0),chip(1),chip(2),{id:'cmd',l:'Command',v:function(S){return 'chmod '+dig(S,0)+dig(S,1)+dig(S,2)},lv:'none'}],
 nodes:[
  {t:'crowd',id:'c0',x:120,y:70,tone:'gold',label:'Owner',crown:true},
  {t:'crowd',id:'c1',x:120,y:220,tone:'violet',label:'Group'},
  {t:'crowd',id:'c2',x:120,y:370,tone:'green',label:'Everyone else'},
  {t:'box',id:'file',x:590,y:240,w:78,h:36,d:90,tone:'gold',base:true,ports:['gold','violet','green'],lock:true,plate:'deploy.sh',led:true,
   sub:function(S){return '-'+bits(S,0)+bits(S,1)+bits(S,2)}},
  {t:'panel',id:'led',x:526,y:73,w:128,h:98,title:'PERMISSIONS',rows:[0,1,2].map(function(g){return function(S){return {dot:['gold','violet','green'][g],leds:[0,1,2].map(function(i){return {t:L[i],tone:AC[i],on:S.b[g*3+i]}})}}})}
 ],
 links:[{id:'l0',a:'c0',b:'file#0',tone:'gold'},{id:'l1',a:'c1',b:'file#1',tone:'violet'},{id:'l2',a:'c2',b:'file#2',tone:'green'},{id:'lp',a:'led',b:'file',pa:[590,171],pb:[590,203],tone:'slate',dash:true}],
 controls:{title:'Permission switches',groups:AUD.map(function(n,g){return {name:n.split(' ')[0],items:[0,1,2].map(function(i){return {label:L[i],on:function(S){return S.b[g*3+i]},click:function(S){S.b[g*3+i]^=1}}})}})},
 goal:function(S){var ok=''+dig(S,0)+dig(S,1)+dig(S,2)=='644';return [ok,ok?'Done. 644 = owner reads and writes, everyone else only reads.':'Goal: 644. You have '+dig(S,0)+dig(S,1)+dig(S,2)]},
 learn:[['See the three audiences',0],['Follow the owner’s requests',1],['Compare group and others',3],['Convert rwx to a number',4],['Build a chmod command',5]],
 steps:[
  {t:'One file, three audiences',b:'This is deploy.sh. Three kinds of users send requests to it. For each request Linux decides: let it in, or block it.',k:['idea','Key idea','Every request is one of three: read (r), write (w) or run (x). The file’s permissions say which ones pass.'],pill:'setup',tt:'The file'},
  {t:'The owner',b:'The owner is the user who created the file. With 7 (rwx) all three kinds of request get through.',k:['tip','Watch','Blue is read, gold is write, purple is run. A green glow means the request was allowed.'],pill:'idea',tt:'Owner',focus:['c0','file','led'],flows:F(0)},
  {t:'The group',b:'Members of the file’s group come next. With 5 (r-x) they can read and run, but a write is blocked.',k:['problem','Watch out','A blocked request bounces back and the file glows red. Nothing on the file changes.'],pill:'problem',tt:'Group',focus:['c1','file','led'],flows:F(1)},
  {t:'Everyone else',b:'Every other user on the system. With 4 (r--) they can only read.',k:['idea','Key idea','Linux checks owner first, then group, then everyone else. The first match decides.'],pill:'idea',tt:'Others',focus:['c2','file','led'],flows:F(2)},
  {t:'Add it up to one number',b:'Give each power a value: r is 4, w is 2, x is 1. Add the ones that are on. One digit per audience gives 754.',k:['tip','Shortcut','7 = rwx, 6 = rw-, 5 = r-x, 4 = r--. These four cover most of what you will use.'],pill:'tip',tt:'Numbers',flows:allF(),hl:['h0','h1','h2']},
  {t:'Try it: make it 644',b:'Use the switches. Goal: the owner can read and write, everyone else can only read. Watch the traffic change.',k:['tip','Challenge','Then try 755. That is the normal setting for a script.'],pill:'problem',tt:'Try it',S:{b:[0,0,0,0,0,0,0,0,0]},flows:allF(),goal:true},
  {t:'Recap',b:'You can now split permissions by audience, know what r, w and x do, and convert them to a chmod number.',k:['idea','Next up','Users and groups: who the owner and group really are, and how to change them with chown.'],pill:'recap',tt:'Recap',S:{b:[1,1,0,1,0,0,1,0,0]},flows:allF()}
 ]});
})();

(function(){
