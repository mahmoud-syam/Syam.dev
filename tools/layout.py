import asyncio,sys,json
from playwright.async_api import async_playwright
LES=__import__('os').environ.get('LES','linux-tree').split(',')
import os
VPS=[tuple(map(int,x.split('x'))) for x in os.environ.get('VPS','1440x900').split(',')]
JS='''()=>{var out=[];function R(e){return e.getBoundingClientRect()}
function ov(a,b){var w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return w>1&&h>1}
// DOM: cards overflow
var vis=function(e){var r=R(e);return r.width>0&&r.height>0&&getComputedStyle(e).display!='none'};
['.guide','.goals','#swcard','.sheet','.stage','.tl','#goal','.rail2'].forEach(function(s){document.querySelectorAll(s).forEach(function(e){if(!vis(e))return;if(e.scrollHeight>e.clientHeight+2&&getComputedStyle(e).overflowY!='visible')out.push('scroll '+s+' '+e.scrollHeight+'>'+e.clientHeight)})});
// hud chips vs tools
var t=R(document.querySelector('.tools'));document.querySelectorAll('.chip').forEach(function(c){if(ov(R(c),t))out.push('chip overlaps tools')});
// svg scale
var sv=document.getElementById('svg'),r=R(sv);var sc=Math.min(r.width/720,r.height/470);out.push('scale '+sc.toFixed(2)+' svg '+Math.round(r.width)+'x'+Math.round(r.height));
// node label pills/text overlapping other nodes
var ids=Object.keys(NODES).filter(function(k){return NODES[k].g.style.display!='none'});
ids.forEach(function(a){NODES[a].g.querySelectorAll('text').forEach(function(tx){var b=tx.getBBox();if(!b.width)return;ids.forEach(function(o){if(o==a)return;var t2=NODES[o].spec.t;var bb=NODES[o].g.getBBox();var w=Math.min(b.x+b.width,bb.x+bb.width)-Math.max(b.x,bb.x),h=Math.min(b.y+b.height,bb.y+bb.height)-Math.max(b.y,bb.y);if(w>3&&h>3)out.push('text "'+tx.textContent.slice(0,18)+'" of '+a+' over '+o)})})});
ids.forEach(function(k){var N=NODES[k];if(N.spec.t!='tile')return;var rs=N.g.querySelectorAll('rect'),r=rs[1].getBBox(),dot=N.g.querySelector('circle'),m=dot&&dot.style.display!='none'?22:4;N.g.querySelectorAll('text').forEach(function(x,i){var b=x.getBBox();if(b.width&&(b.x+b.width>r.x+r.width-(i==0?m:4)||b.y+b.height>r.y+r.height))out.push('tile text clipped: '+k+' '+x.textContent)})});
ids.forEach(function(k){var N=NODES[k];if(N.spec.t!='term')return;N.g.querySelectorAll('text').forEach(function(x){if(/…$/.test(x.textContent))out.push('TERM TRUNC: '+x.textContent.slice(0,30))})});
// scene content bbox vs viewBox
var all=null;ids.forEach(function(k){var b=NODES[k].g.getBBox();all=all?{x:Math.min(all.x,b.x),y:Math.min(all.y,b.y),r:Math.max(all.r,b.x+b.width),b:Math.max(all.b,b.y+b.height)}:{x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height}});
if(all){if(all.x<0||all.y<0||all.r>720||all.b>470)out.push('content outside viewBox '+JSON.stringify([Math.round(all.x),Math.round(all.y),Math.round(all.r),Math.round(all.b)]));out.push('content '+[Math.round(all.x),Math.round(all.y),Math.round(all.r),Math.round(all.b)].join(','))}
out.push('pagescroll '+(document.documentElement.scrollHeight>innerHeight+1));return out}'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh in VPS:
            pg=await b.new_page(viewport={'width':vw,'height':vh})
            for les in LES:
                await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('index.html'))+'#'+les); await pg.wait_for_timeout(500)
                n=await pg.evaluate('LES.steps.length'); agg={}
                for i in range(n):
                    await pg.evaluate(f'go({i})'); await pg.wait_for_timeout(2600)
                    for x in await pg.evaluate(JS):
                        k=x if not x.startswith(('scale','content')) else x.split(' ')[0]
                        agg.setdefault(k,[]).append((i,x))
                    if (vw,vh)==(1440,900) and i in (n//2,): await pg.screenshot(path=f'/tmp/L_{les}.png')
                for k,v in agg.items():
                    if k in('scale','content'): print(vw,vh,les,(min(v,key=lambda q:float(q[1].split()[1]))[1]) if k=='scale' else v[0][1])
                    elif k!='pagescroll false': print(vw,vh,les,'STEPS',[q[0] for q in v],k)
            await pg.close()
        await b.close()
asyncio.run(main())
