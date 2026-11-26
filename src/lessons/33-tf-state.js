(function(){
var ALL=['web-a','web-b','web-c'];
function list(S){return S.rm?['web-a','web-c']:ALL}
function plan(S){var L=list(S),out={};if(S.mode=='count'){ALL.forEach(function(n,i){if(i>=L.length)out[n]=['-','aws_instance.web['+i+']','will be destroyed'];else if(L[i]!=n)out[n]=['~','aws_instance.web['+i+']','Name: "'+n+'" → "'+L[i]+'"'];else out[n]=['ok']})}
 else ALL.forEach(function(n){out[n]=L.indexOf(n)<0?['-','aws_instance.web["'+n+'"]','will be destroyed']:['ok']});return out}
function addr(S,n){return S.mode=='count'?'web['+ALL.indexOf(n)+']':'web["'+n+'"]'}
var CODE=[function(S){return {t:'variable "servers" {',tone:'gold'}},function(S){return '  default = ['+list(S).map(function(x){return '"'+x+'"'}).join(', ')+']'},'}','resource "aws_instance" "web" {',function(S){return S.mode=='count'?{t:'  count = length(var.servers)',tone:'amber'}:{t:'  for_each = toset(var.servers)',tone:'green'}},'  ami           = data.aws_ami.ubuntu.id','  instance_type = var.instance_type',function(S){return S.mode=='count'?{t:'  tags = { Name = var.servers[count.index] }',tone:'amber'}:{t:'  tags = { Name = each.key }',tone:'green'}},'}'];
var CV=CODE.map(function(c){return function(S){return typeof c=='function'?c(S):c}});
var VARS=[{t:'variable "instance_type" {',tone:'gold'},'  type        = string','  default     = "t3.small"','  description = "EC2 size"','}','',{t:'# prod.tfvars:  instance_type = "m7i.large"',tone:'green'},{t:'$ terraform plan -var-file=prod.tfvars',tone:'green'}];
var OUTS=[{t:'output "web_ips" {',tone:'gold'},'  value = [for i in aws_instance.web : i.public_ip]','}',{t:'output "db_password" {',tone:'gold'},'  value     = random_password.db.result',{t:'  sensitive = true',tone:'red'},'}','$ terraform output web_ips'];
var DATA=[{t:'locals { tags = { env = var.env, team = "platform" } }',tone:'gold'},{t:'data "aws_ami" "ubuntu" {',tone:'gold'},'  most_recent = true','  owners      = ["099720109477"]','  filter {','    name   = "name"','    values = ["*ubuntu-noble-24.04-amd64*"]','  }','}'];
var STATE=['State commands',{t:'terraform state list      what Terraform owns',tone:'gold'},{t:'terraform state show ADDR  its attributes',tone:'gold'},{t:'moved { from = A  to = B } rename safely',tone:'green'},{t:'import { to = ADDR  id = "i-0a1b" }',tone:'green'},{t:'terraform state rm ADDR   forget (not delete)',tone:'amber'},'',{t:'Never edit terraform.tfstate by hand.',tone:'red'}];
function vis(S,A){var P=S.planned?plan(S):null;ALL.forEach(function(n){var p=P?P[n]:['ok'];A.set(n,{sub:addr(S,n),status:!P?'run':p[0]=='-'?'#e5534b':p[0]=='~'?'#e8a33a':'run'})});A.set('code',{title:'main.tf',rows:CV});A.refresh()}
function doPlan(S,A){S.planned=true;var P=plan(S),d=ALL.filter(function(n){return P[n][0]=='-'}).length,c=ALL.filter(function(n){return P[n][0]=='~'}).length;
 A.send(['tf','web-a','web-b','web-c'],{label:'plan',tone:'amber',ok:true});
 var LL=[];ALL.filter(function(n){return P[n][0]!='ok'}).forEach(function(n){LL.push('  '+P[n][0]+' '+P[n][1],'      '+P[n][2])});A.term('term',['$ terraform plan'].concat(LL).concat(d+c?['Plan: 0 to add, '+c+' to change, '+d+' to destroy.']:['No changes.']).concat(S.mode=='count'&&S.rm?['! web-c is destroyed, web-b renamed!']:[]),true);
 if(S.mode=='each'&&S.rm)S.done=true;vis(S,A)}
LESSON('terraform','state',{
 title:'Variables, state & outputs',sub:'Make Terraform code reusable with variables and outputs, understand the state file, and avoid the count trap.',time:'15 min',level:'Intermediate',
 S:{mode:'count',rm:false,planned:false,done:false},
 legend:[['#3fa456','no change'],['#e8a33a','update'],['#e5534b','destroy']],
 hud:[{id:'m',l:'Loop',v:function(S){return S.mode=='count'?'count':'for_each'},lv:'none'},{id:'l',l:'Servers in code',v:function(S){return String(list(S).length)},lv:'none'},{id:'d',l:'Plan destroys',v:function(S){if(!S.planned)return '—';var P=plan(S);return ALL.filter(function(n){return P[n][0]=='-'}).join(', ')||'none'},lv:function(S){if(!S.planned)return 'none';var P=plan(S);return P['web-b'][0]=='-'&&P['web-c'][0]!='-'?'good':P['web-c'][0]=='-'?'bad':'none'}},{id:'s',l:'State',v:'remote',lv:'none'}],
 nodes:[
  H.box('tf',196,34,'terraform','violet',{center:true}),
  H.tile('web-a',70,200,'web-a','web[0]','green',{w:118,status:'run'}),H.tile('web-b',196,200,'web-b','web[1]','green',{w:118,status:'run'}),H.tile('web-c',322,200,'web-c','web[2]','green',{w:118,status:'run'}),
  H.tile('state',100,320,'terraform.tfstate','address → real ID','blue',{w:164}),
  H.tile('out',300,320,'outputs','web_ips','gold',{w:110}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:186,title:'main.tf',rows:CV,fs:9},
  {t:'term',id:'term',x:392,y:212,w:316,h:238,title:'terminal'}],
 links:[H.lk('tf','web-a','violet'),H.lk('tf','web-b','violet'),H.lk('tf','web-c','violet'),H.lk('tf','state','blue',{dash:true}),H.lk('state','out','gold',{dash:true})],
 controls:{title:'Remove web-b safely',groups:[{items:[
  {label:'use count',wide:true,on:function(S){return S.mode=='count'},click:function(S,A){S.mode='count';S.planned=false;vis(S,A)}},
  {label:'use for_each',wide:true,on:function(S){return S.mode=='each'},click:function(S,A){S.mode='each';S.planned=false;A.term('term',['# for_each: addresses use the name','# moved blocks migrate existing state'],true);vis(S,A)}},
  {label:'remove "web-b"',wide:true,on:function(S){return S.rm},click:function(S,A){S.rm=!S.rm;S.planned=false;vis(S,A);A.fx('code','pulse')}},
  {label:'terraform plan',wide:true,click:function(S,A){doPlan(S,A)}}]}]},
 goal:function(S){if(S.done)return [true,'Done. With for_each each server is addressed by its name, so removing web-b destroys web-b and nothing else.'];if(S.planned&&S.mode=='count'&&S.rm)return [false,'Look at the plan: count shifted the indexes, so web-c gets destroyed and web-b renamed. Switch to for_each and plan again.'];return [false,'Goal: remove web-b from the list and get a plan that destroys only web-b. Try it with count first.']},
 learn:[['Declare variables',0],['Use tfvars per environment',1],['Expose outputs',2],['Use locals and data sources',3],['Understand dependencies',4],['Work with state safely',5],['Choose for_each over count',6]],
 steps:[
  {t:'Variables',b:'Variables turn hard-coded values into inputs with a type, a default and a description. The same code then builds dev and prod with different sizes.',k:['tip','Remember','Use types like string, number, list(string) and map(string). Terraform rejects wrong input before it touches anything.'],pill:'setup',tt:'Variables',focus:['tf'],S:{mode:'count',rm:false,planned:false,done:false},
   set:{code:{title:'variables.tf',rows:VARS,hl:[0,1,2]}},termClear:true,term:{term:['$ terraform plan -var instance_type=t3.large','  ~ instance_type: "t3.small" → "t3.large"']}},
  {t:'tfvars per environment',b:'Put each environment\'s values in a file: dev.tfvars, prod.tfvars. Pass one with -var-file. terraform.tfvars and *.auto.tfvars load automatically.',k:['problem','Watch out','Do not put secrets in tfvars files in Git. Use TF_VAR_ environment variables or a secret manager.'],pill:'idea',tt:'tfvars',focus:['tf'],
   set:{code:{title:'variables.tf',rows:VARS,hl:[6,7]}},termClear:true,term:{term:['$ terraform plan -var-file=prod.tfvars','  ~ instance_type: "t3.small" → "m7i.large"','$ export TF_VAR_db_password=...']}},
  {t:'Outputs',b:'Outputs print useful values after apply, like IP addresses or URLs, and let other code read them. Mark secrets as sensitive so they are hidden in the output.',k:['problem','Watch out','sensitive = true hides a value on screen, but it is still stored in plain text in the state file.'],pill:'idea',tt:'Outputs',focus:['state','out'],
   set:{code:{title:'outputs.tf',rows:OUTS,hl:[0,1,5]}},termClear:true,term:{term:['$ terraform output web_ips','["3.250.7.42", "34.243.91.5", "54.220.18.10"]','$ terraform output db_password','(sensitive value)']},
   once:[{path:['state','out'],label:'ips',tone:'gold'}]},
  {t:'Locals and data sources',b:'locals name values you reuse, like a tag map. data blocks read things that exist outside your code, such as the latest Ubuntu AMI, without managing them.',k:['idea','Key idea','resource = Terraform owns it. data = Terraform only reads it.'],pill:'idea',tt:'Data',focus:['tf'],
   set:{code:{title:'locals + data',rows:DATA,hl:[0,1,3]}},termClear:true,term:{term:['$ terraform console','> data.aws_ami.ubuntu.id','"ami-0c1c30571d2dae5c9"']}},
  {t:'Dependencies',b:'When one resource references another, Terraform knows the order: create the security group before the instance, destroy them in reverse. Independent resources run in parallel.',k:['tip','Remember','depends_on is for hidden dependencies only. Normally a reference is enough and clearer.'],pill:'idea',tt:'Order',focus:['tf','web-a','web-b','web-c'],
   set:{code:{title:'main.tf',rows:CV,hl:[5]}},termClear:true,term:{term:['$ terraform graph | dot -Tpng > graph.png','$ # sg → instance → eip']},
   once:[{path:['tf','web-a'],label:'1',tone:'violet'},{path:['tf','web-b'],label:'1',tone:'violet'},{path:['tf','web-c'],label:'1',tone:'violet'}]},
  {t:'State',b:'The state maps each address in your code, like aws_instance.web["web-a"], to a real ID. Rename or import things with moved and import blocks, never by editing the file.',k:['problem','Watch out','state rm only makes Terraform forget a resource. The real server keeps running and costing money.'],pill:'problem',tt:'State',focus:['state'],
   set:{code:{title:'state',rows:STATE,hl:[1,3,4,7]}},termClear:true,term:{term:['$ terraform state list','aws_instance.web[0]','aws_instance.web[1]','aws_instance.web[2]','$ terraform state show aws_instance.web[1]','id = "i-0b2e4f"']}},
  {t:'count vs for_each',b:'count makes a numbered list: web[0], web[1], web[2]. for_each makes a map keyed by name. Remove the middle item and count shifts every index after it.',k:['idea','Key idea','Use count for "0 or 1" switches. Use for_each for collections of named things.'],pill:'problem',tt:'Loops',focus:['web-a','web-b','web-c'],S:{mode:'count',rm:true,planned:true},
   set:{code:{title:'main.tf',rows:CV,hl:[4,7]}},termClear:true,term:{term:['$ terraform plan','  ~ aws_instance.web[1]','      Name: "web-b" → "web-c"','  - aws_instance.web[2]','      will be destroyed','! web-c is destroyed, web-b renamed!']}},
  {t:'Try it: remove one server',b:'web-b is retired. Remove it from the list and plan. Only web-b should be destroyed: web-c holds customer sessions.',k:['tip','Challenge','Plan the removal with count first and read who gets destroyed. Then switch to for_each and plan again.'],pill:'problem',tt:'Try it',S:{mode:'count',rm:false,planned:false,done:false},goal:true,focus:null,
   set:{code:{title:'main.tf',rows:CV,hl:[]}},termClear:true,term:{term:['$ terraform state list | wc -l','3']}},
  {t:'Recap',b:'Variables and tfvars make code reusable, outputs share results, data sources read the outside world, and state links code to reality. Use for_each for named collections.',k:['idea','Next up','Modules and remote state: reuse code across projects and work safely as a team.'],pill:'recap',tt:'Recap',S:{mode:'each',rm:true,planned:true,done:true},
   set:{code:{title:'main.tf',rows:CV,hl:[4,7]}},termClear:true,term:{term:['$ terraform plan','  - aws_instance.web["web-b"]','      will be destroyed','Plan: 0 to add, 0 to change, 1 to destroy.']}}
 ]});
})();
