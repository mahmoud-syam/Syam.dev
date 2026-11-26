(function(){
var RED='#e5534b';
function sz(S){return S.ext?'20G':'9.8G'}
function used(S){return S.full?'9.3G':'1.2G'}
function pct(S){return S.full?(S.ext?47:95):(S.ext?6:12)}
function tone(S){var p=pct(S);return p>=90?'red':p>=75?'amber':'green'}
var DF=[function(S){return S.mnt?{t:'Size   '+sz(S),tone:'gold'}:{t:'not mounted',tone:'amber'}},function(S){return S.mnt?'Used   '+used(S):''},function(S){return S.mnt?{t:'Use%   '+pct(S)+'%',tone:tone(S)}:''},function(S){return S.mnt?'Mount  /data':''}];
var LSBLK=['NAME          SIZE TYPE MOUNT','sda            40G disk','└─sda1         40G part /','sdb            20G disk','└─sdb1         20G part'];
var FSTAB=['# /etc/fstab','# device   mount  type  options  dump pass','UUID=3f2a…  /      ext4  defaults 0 1','UUID=9c1d…  /data  ext4  defaults,nofail 0 2',''];
var LVMR=['pvs  → PV: a disk or partition','vgs  → VG: a pool of PVs','lvs  → LV: a slice of the pool','','LV  =  the "partition" you format.','You can grow it later, online.'];
function setUse(S,A){A.set('mnt',{title:'/data',sub:S.mnt?pct(S)+'% used':'',status:pct(S)>=90?RED:'run'});A.refresh()}
LESSON('linux','storage',{
 title:'Disks, mounts & LVM',sub:'From a raw disk to a mounted folder, and how to grow it when it fills up.',time:'15 min',level:'Intermediate',
 S:{lvm:false,fs:false,mnt:false,fstab:false,full:false,ext:false},
 legend:[['#3fa456','healthy'],['#e8a33a','getting full'],['#e5534b','full']],
 hud:[{id:'fs',l:'Filesystem',v:function(S){return S.fs?'ext4':'none'},lv:function(S){return S.fs?'good':'warn'}},{id:'mn',l:'Mounted',v:function(S){return S.mnt?'/data':'no'},lv:function(S){return S.mnt?'good':'warn'}},{id:'ft',l:'In fstab',v:function(S){return S.fstab?'yes':'no'},lv:function(S){return S.fstab?'good':'none'}},{id:'us',l:'/data used',v:function(S){return S.mnt?pct(S)+'%':'—'},lv:function(S){return !S.mnt?'none':pct(S)>=90?'bad':pct(S)>=75?'warn':'good'}}],
 nodes:[
  H.box('disk',60,28,'/dev/sdb','slate',{center:true}),
  H.tile('part',250,56,'sdb1','partition 20G','blue',{w:128,status:'sleep',show:false}),
  H.tile('vg',90,150,'vg_data','volume group','violet',{w:124,status:'sleep',show:false}),
  H.tile('lv',90,226,'lv_data','logical volume','violet',{w:124,status:'sleep',show:false}),
  H.tile('fs',250,152,'ext4','filesystem','amber',{w:128,status:'run',show:false}),
  H.tile('mnt',250,248,'/data','mount point','green',{w:128,status:'run',show:false}),
  {t:'panel',id:'df',x:12,y:300,w:176,h:112,title:'df -h /data',rows:DF,fs:10},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'lsblk',rows:LSBLK,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('disk','part','slate'),H.lk('part','fs','blue',{on:function(S){return !S.lvm}}),H.lk('part','vg','violet',{on:function(S){return S.lvm}}),H.lk('vg','lv','violet',{on:function(S){return S.lvm}}),H.lk('lv','fs','violet',{on:function(S){return S.lvm}}),H.lk('fs','mnt','green')],
 controls:{title:'Manage /data',groups:[{items:[
  {label:'mkfs.ext4',wide:true,on:function(S){return S.fs},click:function(S,A){S.fs=true;A.set('fs',{show:true});A.send([S.lvm?'lv':'part','fs'],{label:'mkfs',tone:'amber',ok:true});A.term('term',['$ sudo mkfs.ext4 /dev/vg_data/lv_data','Creating filesystem ... done'])}},
  {label:'mount /data',wide:true,on:function(S){return S.mnt},click:function(S,A){if(!S.fs){A.term('term',['$ sudo mount /dev/vg_data/lv_data /data','! wrong fs type, bad superblock','$ # make a filesystem first']);A.send([S.lvm?'lv':'part','fs'],{label:'?',tone:'red',ok:false});return}
   S.mnt=true;A.set('mnt',{show:true});A.send(['fs','mnt'],{label:'mount',tone:'green',ok:true});A.term('term',['$ sudo mount /dev/vg_data/lv_data /data','$ df -h /data','/dev/mapper/vg_data-lv_data 9.8G 12%']);A.after(900,function(){setUse(S,A)})}},
  {label:'add to fstab',wide:true,on:function(S){return S.fstab},click:function(S,A){if(!S.mnt){A.term('term',['! mount it first, then test the fstab line']);return}S.fstab=true;A.set('info',{title:'/etc/fstab',rows:FSTAB,hl:[3]});A.term('term',['$ sudoedit /etc/fstab','$ sudo mount -a','# no errors → safe to reboot'])}},
  {label:'fill /data',wide:true,on:function(S){return S.full},click:function(S,A){if(!S.mnt){A.term('term',['! nothing is mounted: files would land on /']);return}S.full=true;A.term('term',['$ df -h /data','Size 9.8G  Used 9.3G  Use% 95%']);setUse(S,A)}},
  {label:'lvextend +10G',wide:true,on:function(S){return S.ext},click:function(S,A){if(!S.fs){A.term('term',['! no filesystem yet: nothing to resize']);return}S.ext=true;A.send(['vg','lv'],{label:'+10G',tone:'violet',ok:true});A.term('term',['$ sudo lvextend -r -L +10G \\','    /dev/vg_data/lv_data','Logical volume extended to 20G','resize2fs: filesystem grown online']);A.after(1100,function(){setUse(S,A)})}}]}]},
 goal:function(S){var ok=S.fs&&S.mnt&&S.fstab&&S.ext&&(!S.full||pct(S)<80);return [ok,ok?'Done. /data is formatted, mounted, survives a reboot, and has room to grow.':'Goal: format, mount and persist /data, then grow the volume with lvextend. Try filling it first to see why you would need to.']},
 learn:[['Find disks with lsblk',0],['Create a filesystem',1],['Mount a filesystem',2],['Keep a mount across reboots',3],['Grow storage with LVM',6]],
 steps:[
  {t:'Disks and partitions',b:'A new disk shows up as a device like /dev/sdb. You split it into partitions, such as sdb1. A disk by itself holds nothing you can use yet.',k:['idea','Key idea','lsblk lists disks and partitions as a tree. It is the first command to run on any storage question.'],pill:'setup',tt:'Disks',focus:['disk','part'],S:{lvm:false,fs:false,mnt:false,fstab:false,full:false,ext:false},
   set:{part:{show:true},vg:{show:false},lv:{show:false},fs:{show:false},mnt:{show:false},info:{title:'lsblk',rows:LSBLK,hl:[3,4]}},termClear:true,term:{term:['$ lsblk','NAME   SIZE TYPE','sda     40G disk','└─sda1  40G part','sdb     20G disk','└─sdb1  20G part']},
   once:[{path:['disk','part'],label:'part',tone:'blue'}],fx:[{n:'disk',k:'pulse'}]},
  {t:'Make a filesystem',b:'A partition is just empty space. A filesystem (ext4 or xfs) adds the structure that lets you create files and folders on it.',k:['problem','Watch out','mkfs erases whatever was on the partition. Check the device name twice before you press Enter.'],pill:'problem',tt:'Filesystem',focus:['part','fs'],S:{fs:true},
   set:{fs:{show:true}},termClear:true,term:{term:['$ lsblk -f /dev/sdb1','# FSTYPE column is empty','$ sudo mkfs.ext4 /dev/sdb1','Creating filesystem ... done']},
   once:[{path:['part','fs'],label:'mkfs',tone:'amber'}]},
  {t:'Mount it',b:'Linux has one directory tree. To use a filesystem you attach it to a folder, called the mount point. After that, /data is the new disk.',k:['idea','Key idea','Whatever was inside /data before you mount is hidden until you unmount. Mount on an empty folder.'],pill:'idea',tt:'Mount',focus:['fs','mnt','df'],S:{fs:true,mnt:true},
   set:{fs:{show:true},mnt:{show:true,title:'/data',sub:'12% used',status:'run'}},termClear:true,term:{term:['$ sudo mkdir /data','$ sudo mount /dev/sdb1 /data','$ df -h /data','/dev/sdb1  20G  12%  /data']},
   once:[{path:['fs','mnt'],label:'mount',tone:'green'}]},
  {t:'Survive a reboot',b:'A manual mount disappears at reboot. To make it permanent add a line to /etc/fstab. Use the UUID, because /dev/sdb can change name.',k:['problem','Watch out','A bad fstab line can stop the server from booting. Test with mount -a first, and add nofail for non-critical disks.'],pill:'problem',tt:'fstab',focus:['mnt','info'],S:{fs:true,mnt:true,fstab:true},
   set:{fs:{show:true},mnt:{show:true,title:'/data',sub:'12% used'},info:{title:'/etc/fstab',rows:FSTAB,hl:[3]}},termClear:true,term:{term:['$ lsblk -f | grep sdb1','sdb1 ext4 9c1d… /data','$ sudo mount -a','# no output = fstab is fine']}},
  {t:'When the disk fills up',b:'df shows how full a filesystem is. du shows which folders use the space. A full disk breaks logs, databases and deploys.',k:['tip','Remember','Also check inodes with df -i. You can run out of file slots before running out of space.'],pill:'problem',tt:'Full disk',focus:['mnt','df'],S:{fs:true,mnt:true,fstab:true,full:true},
   set:{fs:{show:true},mnt:{show:true,title:'/data',sub:'95% used',status:RED}},termClear:true,term:{term:['$ df -h /data','Size 9.8G  Used 9.3G  Use% 95%','$ sudo du -sh /data/* | sort -h','9.0G /data/backups','280M /data/logs']},
   fx:[{n:'mnt',k:'no'}]},
  {t:'LVM: flexible volumes',b:'LVM puts a layer between disks and filesystems. Disks become PVs, PVs join a pool called a VG, and you cut LVs out of the pool.',k:['idea','Key idea','An LV is not tied to one disk. That is what lets you grow it later, even while it is in use.'],pill:'idea',tt:'LVM',focus:['part','vg','lv','fs'],S:{lvm:true,fs:true,mnt:true,fstab:true,full:true},
   set:{vg:{show:true},lv:{show:true},fs:{show:true},mnt:{show:true,title:'/data',sub:'95% used',status:RED},info:{title:'LVM layers',rows:LVMR,hl:[0,1,2]}},termClear:true,term:{term:['$ sudo pvs','/dev/sdb1 vg_data lvm2 20G','$ sudo vgs','vg_data 1 PV 20G free 10G','$ sudo lvs','lv_data vg_data 10G']},
   once:[{path:['part','vg'],label:'PV',tone:'violet'},{path:['vg','lv'],label:'LV',tone:'violet',delay:700},{path:['lv','fs'],label:'fs',tone:'amber',delay:1400}]},
  {t:'Grow it, online',b:'The pool has 10G free. lvextend adds it to the volume, and -r resizes the filesystem in the same step. No unmount, no downtime.',k:['tip','Remember','Check vgs first to see free space. LVM can only grow a volume by what the pool has free.'],pill:'idea',tt:'Grow',focus:['vg','lv','fs','mnt','df'],S:{lvm:true,fs:true,mnt:true,fstab:true,full:true,ext:true},
   set:{vg:{show:true},lv:{show:true},fs:{show:true},mnt:{show:true,title:'/data',sub:'47% used',status:'run'}},termClear:true,term:{term:['$ sudo lvextend -r -L +10G \\','    /dev/vg_data/lv_data','Logical volume extended to 20G','resize2fs: grown online','$ df -h /data','Size 20G  Used 9.3G  Use% 47%']},
   once:[{path:['vg','lv'],label:'+10G',tone:'violet'}],fx:[{n:'lv',k:'ok'}]},
  {t:'Try it: build /data',b:'You have a fresh LVM volume. Format it, mount it, make it permanent, then fill it and grow it.',k:['tip','Challenge','Try to mount before mkfs. Then fill /data and extend the volume until the usage drops.'],pill:'problem',tt:'Try it',S:{lvm:true,fs:false,mnt:false,fstab:false,full:false,ext:false},goal:true,focus:['lv','fs','mnt','df'],
   set:{vg:{show:true},lv:{show:true},fs:{show:false},mnt:{show:false},info:{title:'lsblk',rows:LSBLK,hl:[]}},termClear:true,term:{term:['$ # lv_data exists, but is empty']}},
  {t:'Recap',b:'Disk, partition or LV, filesystem, mount point. fstab keeps it across reboots, and LVM lets you grow it without downtime.',k:['idea','Next up','Networking tools: IPs, ports, DNS and how to debug a connection.'],pill:'recap',tt:'Recap',S:{lvm:true,fs:true,mnt:true,fstab:true,full:false,ext:true},
   set:{vg:{show:true},lv:{show:true},fs:{show:true},mnt:{show:true,title:'/data',sub:'6% used',status:'run'},info:{title:'/etc/fstab',rows:FSTAB,hl:[]}},termClear:true,term:{term:['$ lsblk · df -h · mount · lvextend -r']}}
 ]});
})();
