// ---------- Admin dashboard: manage tracks, courses, sections and lessons ----------
var AD={view:{tab:'content'},busy:false};
function adSection(){var s=$('vadmin');if(s)return s;s=document.createElement('section');s.className='view adv';s.id='vadmin';s.hidden=true;$('vcourses').after(s);return s}
function adErr(e){acToast(e&&e.message?e.message:'Something went wrong',true)}
function adReload(){return acLoad(true)}
function adAfterLoad(){if(VIEW=='admin')adRender(AD.view)}
function adSel(name,opts,val){return '<select id="'+name+'">'+opts.map(function(o){return '<option value="'+esc(o[0])+'"'+(o[0]==val?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select>'}
function adProvOpts(){return Object.keys(AC_PROV).map(function(k){return [k,AC_PROV[k]]})}
function adTypeOpts(){return Object.keys(AC_TYPES).map(function(k){return [k,AC_TYPES[k]]})}
function adBtn(act,id,label,cls,title){return '<button class="adb'+(cls?' '+cls:'')+'" data-a="'+act+'" data-id="'+id+'"'+(title?' title="'+esc(title)+'" aria-label="'+esc(title)+'"':'')+'>'+label+'</button>'}
function adRender(arg){AD.view=arg||{tab:'content'};var s=adSection();document.title='SYAM.DEV — Admin';
 if(!ACAD.ok){s.innerHTML='<div class="vhead"><div class="crumb">Admin</div><h1>Admin dashboard</h1><p class="sub">Open the academy site to manage courses.</p></div>';return}
 if(!ACAD.cat){s.innerHTML='<div class="vhead"><div class="crumb">Admin</div><h1>Admin dashboard</h1><p class="sub">'+(ACAD.err?esc(ACAD.err):'Loading…')+'</p></div>';acLoad();return}
 if(!ACAD.admin){s.innerHTML='<div class="vhead"><div class="crumb">Admin</div><h1>Admins only</h1><p class="sub">Your account can study every course, but only admins can change them.</p></div><div class="hbtns"><a class="pbtn" href="#courses">Go to courses</a></div>';return}
 var tab=AD.view.tab,tabs=[['content','Content'],['learners','Learners'],['import','Import'],['backup','Backup']];
 var h='<div class="vhead"><div class="crumb"><a href="#admin">Admin</a>'+(tab=='course'?'<i>/</i>Course editor':'')+'</div><div class="achead"><h1>'+(tab=='course'?'Edit course':'Admin dashboard')+'</h1><a class="pbtn alt" href="#courses">View as learner</a></div>'+(tab=='course'?'':'<p class="sub">Add and arrange tracks, courses, sections and lessons. Changes are live for every learner right away.</p>')+'</div>';
 if(tab!='course')h+='<div class="adtabs">'+tabs.map(function(t){return '<a href="#admin'+(t[0]=='content'?'':':'+t[0])+'" class="'+(tab==t[0]?'on':'')+'">'+t[1]+'</a>'}).join('')+'</div>';
 h+='<div id="adbody"></div>';s.innerHTML=h;
 if(tab=='course')adCourse(AD.view.id);else if(tab=='learners')adLearners();else if(tab=='import')adImport(AD.view.id);else if(tab=='backup')adBackup();else adContent()}
// ---------- Content overview ----------
function adContent(){var b=$('adbody'),cat=ACAD.cat;
 var h='<div class="adtool"><button class="pbtn" id="adnt">+ New track</button><button class="pbtn alt" id="adnc">+ New course</button><span class="acmuted">'+cat.tracks.length+' tracks · '+cat.courses.length+' courses · '+cat.lessons.length+' lessons</span></div>';
 if(!cat.tracks.length)h+='<div class="acempty big">Start by creating a track, for example <b>Cloud</b> or <b>DevOps</b>.</div>';
 h+=cat.tracks.map(function(t,ti){var cs=cat.courses.filter(function(c){return c.track_id==t.id});
  return '<div class="adtrack"><div class="adth"><i style="background:'+esc(t.color)+'"></i><div class="adtt"><b>'+esc(t.title)+'</b>'+(t.description?'<small>'+esc(t.description)+'</small>':'')+'</div><div class="adacts">'+adBtn('tup',t.id,'↑','','Move up')+adBtn('tdown',t.id,'↓','','Move down')+adBtn('tedit',t.id,'Edit')+adBtn('tdel',t.id,'Delete','danger')+adBtn('cnew',t.id,'+ Course','pri')+'</div></div>'+
   (cs.length?'<ul class="adlist">'+cs.map(function(c){var st=acStats(c.id);return '<li><a class="adname" href="#admin:course:'+c.id+'"><b>'+esc(c.title)+'</b><small>'+esc(AC_PROV[c.provider]||'')+' · '+(ACAD.CM[c.id]||[]).length+' sections · '+st.n+' lessons'+(st.min?' · '+acMins(st.min):'')+'</small></a>'+(c.published?'':'<span class="acchip warn">Hidden</span>')+'<div class="adacts">'+adBtn('cup',c.id,'↑','','Move up')+adBtn('cdown',c.id,'↓','','Move down')+'<a class="adb pri" href="#admin:course:'+c.id+'">Open</a>'+adBtn('cdel',c.id,'Delete','danger')+'</div></li>'}).join('')+'</ul>':'<div class="adnone">No courses yet.</div>')+'</div>'}).join('');
 b.innerHTML=h;
 $('adnt').onclick=function(){adTrackForm()};$('adnc').onclick=function(){if(!cat.tracks.length){acToast('Create a track first',true);return}adCourseForm(null,cat.tracks[0].id)};
 b.querySelectorAll('[data-a]').forEach(function(x){x.onclick=function(){adAct(x.dataset.a,x.dataset.id)}})}
function adMove(kind,list,id,dir){var ids=list.map(function(x){return x.id}),i=ids.indexOf(id),j=i+dir;if(i<0||j<0||j>=ids.length)return;var t=ids[i];ids[i]=ids[j];ids[j]=t;
 ids.forEach(function(x,k){var r=ACAD.cat[kind].filter(function(y){return y.id==x})[0];if(r)r.sort=k});ACAD.cat[kind].sort(function(a,b){return a.sort-b.sort});acIndex(ACAD.cat);adRender(AD.view);
 acApi('POST','/api/admin/reorder',{kind:kind,ids:ids}).then(adReload,adErr)}
function adConfirm(msg,yes){mdlOpen('Are you sure?','<p>'+msg+'</p><div class="hbtns"><button class="pbtn addanger" id="adyes">Delete</button><button class="pbtn alt" id="adno">Cancel</button></div>');$('adno').onclick=mdlClose;$('adyes').onclick=function(){mdlClose();yes()}}
function adDel(kind,id,what){acApi('DELETE','/api/admin/'+kind+'/'+id).then(function(){acToast(what+' deleted');return adReload()},adErr)}
function adAct(a,id){var cat=ACAD.cat,c,t,m;
 if(a=='tup'||a=='tdown')return adMove('tracks',cat.tracks,id,a=='tup'?-1:1);
 if(a=='tedit')return adTrackForm(ACAD.T[id]);
 if(a=='tdel'){t=ACAD.T[id];var n=cat.courses.filter(function(x){return x.track_id==id}).length;return adConfirm('Delete the track <b>'+esc(t.title)+'</b>'+(n?' and its '+n+' course'+(n==1?'':'s')+' with all their lessons and learner notes':'')+'? This cannot be undone.',function(){adDel('tracks',id,'Track')})}
 if(a=='cnew')return adCourseForm(null,id);
 if(a=='cup'||a=='cdown'){c=ACAD.C[id];return adMove('courses',cat.courses.filter(function(x){return x.track_id==c.track_id}),id,a=='cup'?-1:1)}
 if(a=='cdel'){c=ACAD.C[id];return adConfirm('Delete the course <b>'+esc(c.title)+'</b> with its '+(ACAD.CL[id]||[]).length+' lessons and all learner notes on them? This cannot be undone.',function(){adDel('courses',id,'Course');if(AD.view.tab=='course')location.hash='admin'})}
 if(a=='mup'||a=='mdown'){m=ACAD.M[id];return adMove('modules',ACAD.CM[m.course_id],id,a=='mup'?-1:1)}
 if(a=='mdel'){m=ACAD.M[id];return adConfirm('Delete the section <b>'+esc(m.title)+'</b> and its '+ACAD.ML[id].length+' lessons?',function(){adDel('modules',id,'Section')})}
 if(a=='lnew')return adLessonForm(null,id);
 if(a=='ledit')return adEditLesson(id);
 if(a=='lup'||a=='ldown'){var l=ACAD.L[id];return adMove('lessons',ACAD.ML[l.module_id],id,a=='lup'?-1:1)}
 if(a=='ldel'){return adConfirm('Delete the lesson <b>'+esc(ACAD.L[id].title)+'</b>?',function(){adDel('lessons',id,'Lesson')})}}
// ---------- Forms ----------
function adTrackForm(t){mdlOpen(t?'Edit track':'New track','<div class="adform"><label>Title<input id="ftt" maxlength="120" value="'+esc(t?t.title:'')+'" placeholder="Cloud"></label><label>Description<textarea id="ftd" rows="2" maxlength="600" placeholder="What this track covers">'+esc(t?t.description:'')+'</textarea></label><label class="adrow">Color<input type="color" id="ftc" value="'+esc(t?t.color:'#2f86ce')+'"></label><div class="hbtns"><button class="pbtn" id="fts">'+(t?'Save':'Create track')+'</button></div><div id="fterr" class="mmsg"></div></div>');
 $('ftt').focus();$('fts').onclick=function(){var body={title:$('ftt').value,description:$('ftd').value,color:$('ftc').value};
  (t?acApi('PUT','/api/admin/tracks/'+t.id,body):acApi('POST','/api/admin/tracks',body)).then(function(){mdlClose();acToast(t?'Track saved':'Track created');return adReload()},function(e){$('fterr').className='mmsg bad';$('fterr').textContent=e.message})}}
function adLinkInfo(inp,titleInp,extra){var u=$(inp).value.trim();if(!u){acToast('Paste a link first',true);return}var b=event&&event.target;if(b)b.disabled=true;
 acApi('GET','/api/admin/link-info?url='+encodeURIComponent(u)).then(function(j){if(j.title&&$(titleInp))$(titleInp).value=j.title;if(extra)extra(j);acToast(j.title?'Title filled in':'No title found on that page')},adErr).then(function(){if(b)b.disabled=false})}
function adCourseForm(c,trackId){var cat=ACAD.cat;mdlOpen(c?'Edit course':'New course','<div class="adform"><label>Title<input id="fct" maxlength="160" value="'+esc(c?c.title:'')+'" placeholder="AZ-104: Azure Administrator"></label>'+
 '<label>Course link (optional)<span class="adinl"><input id="fcu" value="'+esc(c?c.url:'')+'" placeholder="https://www.udemy.com/course/…"><button class="pbtn alt" type="button" id="fcg">Get title</button></span></label>'+
 '<div class="adcols"><label>Track'+adSel('fctr',cat.tracks.map(function(t){return [t.id,t.title]}),c?c.track_id:trackId)+'</label><label>Platform'+adSel('fcp',adProvOpts(),c?c.provider:'other')+'</label><label>Level<input id="fcl" maxlength="40" value="'+esc(c?c.level:'')+'" placeholder="Beginner"></label></div>'+
 '<label>Description<textarea id="fcd" rows="3" maxlength="2000">'+esc(c?c.description:'')+'</textarea></label><label class="adrow"><input type="checkbox" id="fcpub"'+(!c||c.published?' checked':'')+'> Visible to learners</label>'+
 '<div class="hbtns"><button class="pbtn" id="fcs">'+(c?'Save':'Create course')+'</button></div><div id="fcerr" class="mmsg"></div></div>');
 $('fct').focus();$('fcg').onclick=function(){adLinkInfo('fcu','fct',function(j){if(j.provider)$('fcp').value=j.provider})};
 $('fcs').onclick=function(){var body={title:$('fct').value,url:$('fcu').value,track_id:$('fctr').value,provider:$('fcp').value,level:$('fcl').value,description:$('fcd').value,published:$('fcpub').checked};
  (c?acApi('PUT','/api/admin/courses/'+c.id,body):acApi('POST','/api/admin/courses',body)).then(function(r){mdlClose();acToast(c?'Course saved':'Course created');return adReload().then(function(){if(!c)location.hash='admin:course:'+r.id})},function(e){$('fcerr').className='mmsg bad';$('fcerr').textContent=e.message})}}
function adLinksText(ls){return (ls||[]).map(function(x){return (x.title?x.title+' | ':'')+x.url}).join('\n')}
function adParseLinks(t){return t.split('\n').map(function(s){s=s.trim();if(!s)return null;var p=s.split('|');var url=p.pop().trim(),title=p.join('|').trim();return {title:title,url:url}}).filter(Boolean)}
function adEditLesson(id,cb){adLessonForm(ACAD.L[id],ACAD.L[id].module_id,cb)}
function adLessonForm(l,moduleId,cb){var m=ACAD.M[moduleId],c=ACAD.C[m.course_id];
 mdlOpen(l?'Edit lesson':'New lesson','<div class="adform"><label>Title<input id="flt" maxlength="200" value="'+esc(l?l.title:'')+'"></label>'+
 '<label>Link (YouTube, Udemy, docs…)<span class="adinl"><input id="flu" value="'+esc(l?l.url:(c&&c.provider=='udemy'&&c.url)||'')+'" placeholder="https://www.youtube.com/watch?v=…"><button class="pbtn alt" type="button" id="flg">Get title</button></span><small>YouTube videos play inside the site and remember where you stopped. Other links open in a new tab.</small></label>'+
 '<div class="adcols"><label>Type'+adSel('fly',adTypeOpts(),l?l.type:'video')+'</label><label>Minutes<input id="flm" type="number" min="0" max="1000" value="'+(l?l.minutes||'':'')+'"></label><label>Section'+adSel('flmod',(ACAD.CM[c.id]||[]).map(function(x){return [x.id,x.title]}),moduleId)+'</label></div>'+
 '<label>Notes for the lesson (Markdown)<span class="adtabs2"><button type="button" class="on" id="flw">Write</button><button type="button" id="flp">Preview</button></span><textarea id="flb" rows="7" maxlength="60000" placeholder="Key points, commands, steps of a lab…">'+esc(l?l.body:'')+'</textarea><div id="flpv" class="acbody adprev" hidden></div></label>'+
 '<label>Extra links<textarea id="fll" rows="3" placeholder="One per line:  Title | https://…">'+esc(adLinksText(l&&l.links))+'</textarea></label><label class="adrow"><input type="checkbox" id="flpub"'+(!l||l.published?' checked':'')+'> Visible to learners</label>'+
 '<div class="hbtns"><button class="pbtn" id="fls">'+(l?'Save':'Add lesson')+'</button>'+(l?'':'<button class="pbtn alt" id="flsa">Add and add another</button>')+'</div><div id="flerr" class="mmsg"></div></div>');
 $('flt').focus();
 $('flg').onclick=function(){adLinkInfo('flu','flt',function(j){if(j.type)$('fly').value=j.type})};
 $('flw').onclick=function(){$('flb').hidden=false;$('flpv').hidden=true;this.className='on';$('flp').className=''};
 $('flp').onclick=function(){$('flpv').innerHTML=acMd($('flb').value)||'<p class="acmuted">Nothing to preview.</p>';$('flb').hidden=true;$('flpv').hidden=false;this.className='on';$('flw').className=''};
 function go(again){var body={title:$('flt').value,url:$('flu').value,type:$('fly').value,minutes:$('flm').value,module_id:$('flmod').value,body:$('flb').value,links:adParseLinks($('fll').value),published:$('flpub').checked};
  (l?acApi('PUT','/api/admin/lessons/'+l.id,body):acApi('POST','/api/admin/lessons',body)).then(function(){acToast(l?'Lesson saved':'Lesson added');return adReload().then(function(){if(again)adLessonForm(null,body.module_id,cb);else{mdlClose();if(cb)cb()}})},function(e){$('flerr').className='mmsg bad';$('flerr').textContent=e.message})}
 $('fls').onclick=function(){go(false)};if($('flsa'))$('flsa').onclick=function(){go(true)}}
// ---------- Course editor ----------
function adCourse(cid){var b=$('adbody'),c=ACAD.C[cid];if(!c){b.innerHTML='<div class="acempty big">Course not found. <a href="#admin">Back to the dashboard</a>.</div>';return}
 var t=ACAD.T[c.track_id]||{},mods=ACAD.CM[cid]||[],st=acStats(cid);
 var h='<div class="adcourse" style="--tc:'+esc(t.color||'#2f86ce')+'"><div class="adch"><div><small>'+esc(t.title||'')+' · '+esc(AC_PROV[c.provider]||'')+(c.level?' · '+esc(c.level):'')+'</small><b>'+esc(c.title)+'</b><span class="acmuted">'+mods.length+' sections · '+st.n+' lessons'+(st.min?' · '+acMins(st.min):'')+'</span></div><div class="adacts">'+(c.published?'':'<span class="acchip warn">Hidden</span>')+'<button class="adb" id="adce">Edit details</button><a class="adb" href="#admin:import:'+cid+'">Import lessons</a><a class="adb" href="#course:'+cid+'">View</a>'+adBtn('cdel',cid,'Delete','danger')+'</div></div></div>';
 h+=mods.map(function(m,mi){var ls=ACAD.ML[m.id];return '<div class="admod"><div class="admh"><span class="acmn">'+(mi+1<10?'0':'')+(mi+1)+'</span><input class="admt" data-m="'+m.id+'" value="'+esc(m.title)+'" maxlength="160" aria-label="Section title"><div class="adacts">'+adBtn('mup',m.id,'↑','','Move up')+adBtn('mdown',m.id,'↓','','Move down')+adBtn('mdel',m.id,'Delete','danger')+adBtn('lnew',m.id,'+ Lesson','pri')+'</div></div>'+
  (ls.length?'<ul class="adlist">'+ls.map(function(l){return '<li>'+acIcon(l.type)+'<button class="adname as" data-a="ledit" data-id="'+l.id+'"><b>'+esc(l.title)+'</b><small>'+esc(AC_TYPES[l.type]||'')+(l.minutes?' · '+acMins(l.minutes):'')+(l.url?' · '+esc((l.url.match(/^https?:\/\/(?:www\.)?([^/]+)/)||[])[1]||''):' · no link')+'</small></button>'+(l.published?'':'<span class="acchip warn">Hidden</span>')+'<div class="adacts">'+adBtn('lup',l.id,'↑','','Move up')+adBtn('ldown',l.id,'↓','','Move down')+adBtn('ledit',l.id,'Edit')+adBtn('ldel',l.id,'Delete','danger')+'</div></li>'}).join('')+'</ul>':'<div class="adnone">No lessons in this section yet.</div>')+'</div>'}).join('');
 h+='<div class="adtool"><input id="adnm" maxlength="160" placeholder="New section title, e.g. Networking"><button class="pbtn" id="adnmb">+ Add section</button></div>';
 b.innerHTML=h;
 $('adce').onclick=function(){adCourseForm(c)};
 b.querySelectorAll('[data-a]').forEach(function(x){x.onclick=function(){adAct(x.dataset.a,x.dataset.id)}});
 b.querySelectorAll('.admt').forEach(function(inp){var orig=inp.value;function sv(){var v=inp.value.trim();if(!v){inp.value=orig;return}if(v==orig)return;orig=v;acApi('PUT','/api/admin/modules/'+inp.dataset.m,{title:v}).then(function(){acToast('Section renamed');return adReload()},adErr)}
  inp.onblur=sv;inp.onkeydown=function(e){if(e.key=='Enter'){e.preventDefault();inp.blur()}if(e.key=='Escape'){inp.value=orig;inp.blur()}}});
 function addMod(){var v=$('adnm').value.trim();if(!v){$('adnm').focus();return}acApi('POST','/api/admin/modules',{course_id:cid,title:v}).then(function(){acToast('Section added');return adReload()},adErr)}
 $('adnmb').onclick=addMod;$('adnm').onkeydown=function(e){if(e.key=='Enter')addMod()}}
// ---------- Import ----------
function adParseCurriculum(text,url){var lines=text.replace(/\r/g,'').split('\n').map(function(s){return s.replace(/\t/g,' ').trim()}).filter(Boolean),mods=[],cur=null,last=null;
 var dur=/^(\d{1,2}:\d{2}(?::\d{2})?|\d+\s*(?:min|mins|m)|\d+\s*hr?s?(?:\s*\d+\s*min)?)$/i,meta=/(\d+\s*(lectures?|lessons?)\s*[•·|]|^\d+\s*\/\s*\d+\s*\|?|^\d+\s*(lectures?|lessons?)$|^preview$|^(resources?|start|play)$)/i;
 function mins(s){var m;if((m=s.match(/^(\d+):(\d{2}):(\d{2})$/)))return +m[1]*60+ +m[2]+(+m[3]>=30?1:0);if((m=s.match(/^(\d+):(\d{2})$/)))return Math.max(1,+m[1]+(+m[2]>=30?1:0));if((m=s.match(/(\d+)\s*hr?s?/i))){var x=+m[1]*60,n=s.match(/(\d+)\s*min/i);return x+(n?+n[1]:0)}if((m=s.match(/(\d+)/)))return +m[1];return 0}
 function mod(t){cur={title:t.replace(/\s*\d+\s*\/\s*\d+.*$/,'').replace(/\s*[•·|]\s*\d.*$/,'').trim()||'Section',lessons:[]};mods.push(cur);last=null}
 for(var i=0;i<lines.length;i++){var ln=lines[i],m;
  if((m=ln.match(/^section\s+\d+\s*[:.\-–]\s*(.+)$/i))){mod(m[1]);continue}
  if(dur.test(ln)){if(last&&!last.minutes)last.minutes=mins(ln);continue}
  if(meta.test(ln))continue;
  if(lines[i+1]&&/\d+\s*(lectures?|lessons?)/i.test(lines[i+1])){mod(ln);continue}
  var title=ln,mm=null;if((m=ln.match(/^(.*?)\s+(\d{1,2}:\d{2}(?::\d{2})?|\d+\s*min)$/i))){title=m[1];mm=mins(m[2])}
  title=title.replace(/^\d+\.\s*/,'').replace(/\s*Preview$/i,'').trim();if(!title)continue;
  if(!cur)mod('Section 1');last={title:title,type:'video',url:url||'',minutes:mm||0};cur.lessons.push(last)}
 return mods.filter(function(x){return x.lessons.length})}
function adImport(cid){var b=$('adbody'),cat=ACAD.cat;var copts=cat.courses.map(function(c){return [c.id,c.title]});
 var h='<div class="adform adimp"><label>Import into'+adSel('fic',[['new','+ A new course']].concat(copts),cid||'new')+'</label><div id="finew" class="adcols"><label>New course title<input id="fint" maxlength="160" placeholder="AZ-104 on Udemy"></label><label>Track'+adSel('fitr',cat.tracks.map(function(t){return [t.id,t.title]}),'')+'</label></div>'+
 '<div class="adsrc"><label class="adrow"><input type="radio" name="fis" value="udemy" checked> Udemy curriculum</label><label class="adrow"><input type="radio" name="fis" value="yt"> YouTube playlist</label><label class="adrow"><input type="radio" name="fis" value="links"> List of links</label></div>'+
 '<div id="fip-udemy"><label>Course link on Udemy<input id="fiu" placeholder="https://www.udemy.com/course/…"></label><label>Curriculum<textarea id="fitx" rows="10" placeholder="On the Udemy course page, open Course content, expand all sections, select the whole list and paste it here.\n\nSection 1: Introduction\nWelcome  02:15\nHow to use this course  03:40\nSection 2: Azure basics\n…"></textarea></label></div>'+
 '<div id="fip-yt" hidden><label>Playlist link<input id="fiy" placeholder="https://www.youtube.com/playlist?list=…"></label></div>'+
 '<div id="fip-links" hidden><label>Links (one per line, title optional)<textarea id="fil" rows="8" placeholder="Install Azure CLI | https://learn.microsoft.com/…\nhttps://www.youtube.com/watch?v=…"></textarea></label></div>'+
 '<div class="hbtns"><button class="pbtn alt" id="fiprev">Preview</button><button class="pbtn" id="figo" disabled>Import</button></div><div id="fimsg" class="mmsg"></div><div id="fipv"></div></div>';
 b.innerHTML=h;var parsed=null;
 function src(){return document.querySelector('[name=fis]:checked').value}
 function sync(){$('finew').hidden=$('fic').value!='new';['udemy','yt','links'].forEach(function(k){$('fip-'+k).hidden=src()!=k});parsed=null;$('figo').disabled=true;$('fipv').innerHTML=''}
 $('fic').onchange=sync;document.querySelectorAll('[name=fis]').forEach(function(r){r.onchange=sync});sync();
 function show(mods){parsed=mods;var n=mods.reduce(function(a,m){return a+m.lessons.length},0),mn=mods.reduce(function(a,m){return a+m.lessons.reduce(function(x,l){return x+(l.minutes||0)},0)},0);
  $('fimsg').className='mmsg '+(n?'good':'bad');$('fimsg').textContent=n?'Found '+mods.length+' section'+(mods.length==1?'':'s')+' and '+n+' lesson'+(n==1?'':'s')+(mn?' ('+acMins(mn)+')':'')+'. Check them, then press Import.':'Nothing to import was found.';$('figo').disabled=!n;
  $('fipv').innerHTML=mods.map(function(m){return '<div class="adpvm"><b>'+esc(m.title)+'</b><ol>'+m.lessons.slice(0,60).map(function(l){return '<li>'+esc(l.title)+(l.minutes?' <small>'+acMins(l.minutes)+'</small>':'')+'</li>'}).join('')+(m.lessons.length>60?'<li>…and '+(m.lessons.length-60)+' more</li>':'')+'</ol></div>'}).join('')}
 $('fiprev').onclick=function(){var s=src();$('fimsg').className='mmsg';$('fimsg').textContent='Reading…';
  if(s=='udemy')show(adParseCurriculum($('fitx').value,$('fiu').value.trim()));
  else if(s=='links')show([{title:'Links',lessons:adParseLinks($('fil').value).map(function(x){var yt=acYtId(x.url);return {title:x.title||(x.url.replace(/^https?:\/\/(www\.)?/,'').slice(0,80)),url:x.url,type:yt?'video':'link',minutes:0}})}]);
  else acApi('GET','/api/admin/playlist?url='+encodeURIComponent($('fiy').value.trim())).then(function(j){if($('fic').value=='new'&&!$('fint').value&&j.title)$('fint').value=j.title;show([{title:j.title||'Playlist',lessons:j.lessons}])},function(e){$('fimsg').className='mmsg bad';$('fimsg').textContent=e.message})};
 $('figo').onclick=function(){if(!parsed)return;var btn=this;btn.disabled=true;$('fimsg').className='mmsg';$('fimsg').textContent='Importing…';
  var target=$('fic').value,p=target!='new'?Promise.resolve({id:target}):acApi('POST','/api/admin/courses',{title:$('fint').value||'Imported course',track_id:$('fitr').value,provider:src()=='udemy'?'udemy':src()=='yt'?'youtube':'other',url:src()=='udemy'?$('fiu').value.trim():src()=='yt'?$('fiy').value.trim():''});
  p.then(function(c){return acApi('POST','/api/admin/bulk',{course_id:c.id,modules:parsed}).then(function(r){acToast('Imported '+r.lessons+' lessons');return adReload().then(function(){location.hash='admin:course:'+c.id})})}).catch(function(e){btn.disabled=false;$('fimsg').className='mmsg bad';$('fimsg').textContent=e.message})}}
// ---------- Learners & backup ----------
function adAgo(t){if(!t)return '—';var s=(Date.now()-t)/1000;return s<90?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' days ago'}
function adLearners(){var b=$('adbody');b.innerHTML='<p class="acmuted">Loading learners…</p>';
 acApi('GET','/api/admin/learners').then(function(j){var ls=j.learners||[];
  b.innerHTML='<p class="acmuted">'+ls.length+' account'+(ls.length==1?'':'s')+'. Only e-mails you approve can sign in; ask Claude to add or remove one.</p><div class="adtbl"><table><thead><tr><th>Learner</th><th>Interactive lessons</th><th>Course lessons</th><th>Last seen</th><th>Joined</th></tr></thead><tbody>'+
   ls.map(function(x){return '<tr><td><b>'+esc(x.name||x.email.split('@')[0])+'</b><small>'+esc(x.email)+'</small></td><td>'+x.interactive_done+'</td><td>'+x.course_done+'</td><td>'+adAgo(x.last_seen)+'</td><td>'+(x.created_at?new Date(x.created_at).toLocaleDateString():'—')+'</td></tr>'}).join('')+'</tbody></table></div>'},function(e){b.innerHTML='<div class="acempty">'+esc(e.message)+'</div>'})}
function adBackup(){var b=$('adbody'),cat=ACAD.cat;b.innerHTML='<div class="hcard"><b>Download a backup</b><p>A JSON file with every track, course, section and lesson ('+cat.courses.length+' courses, '+cat.lessons.length+' lessons). Learner progress and notes are not included.</p><div class="hbtns"><button class="pbtn" id="adbk">Download backup</button></div></div>';
 $('adbk').onclick=function(){acApi('GET','/api/admin/export').then(function(j){var blob=new Blob([JSON.stringify(j,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='syam-academy-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)},adErr)}}
// ---------- Wiring ----------
(function(){adSection();
 var _sv=setView;setView=function(v,arg){_sv(v,arg);document.querySelector('.body').classList.toggle('v-admin',v=='admin');$('vadmin').hidden=v!='admin';if(v=='admin'){adRender(arg);$('vadmin').scrollTop=0}};
 var _rv=routeView;routeView=function(h){var m=h.match(/^admin(?::(content|learners|import|backup|course))?(?::([\w-]+))?$/);if(m){setView('admin',{tab:m[1]||'content',id:m[2]});renderTree();return true}return _rv(h)};
 var _gv=goView;goView=function(v){if(v=='admin'){location.hash='admin';return}_gv(v)}})();
