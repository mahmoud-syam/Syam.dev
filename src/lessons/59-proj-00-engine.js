// Shared engine for the Real-World Projects module: build parts in dependency order, then verify.
window.PROJ=function(id,c){
 var P=c.parts,N=P.length,BY={};P.forEach(function(p){BY[p.id]=p});
 function cnt(S){return P.filter(function(p){return S.b[p.id]}).length}
 function chk(S){var r=[{t:c.checkTitle||'project checklist',tone:'gold'}];P.forEach(function(p){r.push({t:(S.b[p.id]?'✓ ':'□ ')+p.what,tone:S.b[p.id]?'green':'gold'})});r.push(S.v?{t:'✓ verified: '+c.verifyShort,tone:'green'}:{t:'□ verify: '+c.verifyShort,tone:'gold'});return r}
 function SETB(b){var o={};P.forEach(function(p){o[p.id]={status:b[p.id]?'run':'none',sub:b[p.id]?p.sub:'not built'}});return o}
 function MAP(list){var o={};(list||[]).forEach(function(i){o[i]=true});return o}
 function build(S,A,p){if(S.b[p.id]){A.term('term',['# already done: '+p.what],true);return}
  var miss=(p.deps||[]).filter(function(d){return !S.b[d]});
  if(miss.length){A.term('term',['! first: '+miss.map(function(d){return BY[d].btn}).join(', ')],true);return}
  S.rid=(S.rid||0)+1;S.b[p.id]=true;S.v=false;S.done=false;A.set(p.id,{status:'run',sub:p.sub});
  (p.deps||[]).forEach(function(d){A.send([d,p.id],{label:p.flow||'',tone:'green',ok:true})});
  A.set('info',{title:'checklist',rows:chk(S),hl:[]});A.term('term',p.cmd,true);A.refresh()}
 function verify(S,A){var miss=P.filter(function(p){return !S.b[p.id]});
  if(miss.length){A.term('term',['! not built yet: '+miss.slice(0,3).map(function(p){return p.btn}).join(', ')+(miss.length>3?' …':'')],true);return}
  var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}
  A.term('term',[c.verify[0]],true);(c.verifyFlows||[]).forEach(function(f,i){L(300+i*350,function(){A.send(f,{label:'test',tone:'blue',ok:true})})});
  c.verify.slice(1).forEach(function(l,i){L(600+i*450,function(){A.term('term',[l]);if(i==c.verify.length-2){S.v=true;S.done=true;A.set('info',{title:'checklist',rows:chk(S),hl:[]});A.refresh()}})})}
 function reset(S,A){S.rid=(S.rid||0)+1;S.b={};S.v=false;S.done=false;var o=SETB({});Object.keys(o).forEach(function(k){A.set(k,o[k])});A.set('info',{title:'checklist',rows:chk(S),hl:[]});A.term('term',c.tryTerm,true);A.refresh()}
 var steps=c.steps.map(function(s,i){var b=MAP(s.built);return {t:s.t,b:s.b,k:s.k,pill:i==0?'setup':'idea',tt:s.tt,focus:s.focus||null,S:{b:b,v:false,done:false},
  set:Object.assign(SETB(b),{info:s.panel?{title:s.panel[0],rows:s.panel[1],hl:s.panel[2]||[]}:{title:'checklist',rows:chk({b:b}),hl:[]}}),termClear:true,term:{term:s.term},flows:s.flows,once:s.once}});
 var all={};P.forEach(function(p){all[p.id]=true});
 steps.push({t:'Try it: '+c.tryTitle,b:c.tryBody,k:['tip','Challenge',c.tryHint],pill:'problem',tt:'Try it',goal:true,focus:null,S:{b:{},v:false,done:false},
  set:Object.assign(SETB({}),{info:{title:'checklist',rows:chk({b:{}}),hl:[]}}),termClear:true,term:{term:c.tryTerm}});
 steps.push({t:'Recap',b:c.recap,k:['idea','Next up',c.next],pill:'recap',tt:'Recap',S:{b:all,v:true,done:true},
  set:Object.assign(SETB(all),{info:{title:'checklist',rows:chk({b:all,v:true}),hl:[]}}),termClear:true,term:{term:c.recapTerm}});
 var nodes=P.map(function(p){return H.tile(p.id,p.pos[0],p.pos[1],p.title,'not built',p.tone||'green',{w:p.w||136,status:'none'})}).concat(c.extra||[]).concat([
  {t:'panel',id:'info',x:392,y:14,w:316,h:196,title:'checklist',rows:chk({b:{}}),fs:9.3},
  {t:'term',id:'term',x:392,y:224,w:316,h:226,title:c.termTitle||'terminal'}]);
 LESSON('projects',id,{title:c.title,sub:c.sub,time:c.time,level:'Project',S:{b:{},v:false,done:false},
  legend:[['#3fa456','built'],['#bdb4a8','not built']].concat(c.legend||[]),
  hud:[{id:'b',l:'Built',v:function(S){return cnt(S)+' / '+N},lv:function(S){return cnt(S)==N?'good':'none'}},{id:'s',l:'Stack',v:c.stack,lv:'none'},{id:'v',l:'Verified',v:function(S){return S.v?'yes':'no'},lv:function(S){return S.v?'good':'warn'}},{id:'d',l:'Deliverable',v:c.deliv,lv:'none'}],
  nodes:nodes,links:(c.links||[]).map(function(l){return H.lk(l[0],l[1],l[2]||'green',l[3]?{dash:true}:undefined)}),
  controls:{title:c.ctl,groups:[{items:P.map(function(p){return {label:p.btn,wide:true,on:function(S){return !!S.b[p.id]},click:function(S,A){build(S,A,p)}}})},{items:[{label:c.verifyBtn||'verify',wide:true,click:function(S,A){verify(S,A)}},{label:'start over',wide:true,click:function(S,A){reset(S,A)}}]}]},
  goal:function(S){return [S.done,S.done?c.doneText:c.goalText]},
  learn:c.steps.map(function(s,i){return [s.learn,i]}).slice(0,7),
  steps:steps});
};
