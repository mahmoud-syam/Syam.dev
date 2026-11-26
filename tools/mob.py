import asyncio
from playwright.async_api import async_playwright
LES=__import__('os').environ.get('LES','linux-tree').split(',')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh in [(390,844),(820,1180)]:
            pg=await b.new_page(viewport={'width':vw,'height':vh})
            for les in LES:
                await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('app.html'))+'#'+les); await pg.wait_for_timeout(400)
                n=await pg.evaluate('LES.steps.length')
                ty=[i for i in range(n) if await pg.evaluate(f'!!LES.steps[{i}].goal')]
                await pg.evaluate(f'go({ty[0] if ty else 2})'); await pg.wait_for_timeout(2500)
                r=await pg.evaluate('''()=>{var o=[];if(document.documentElement.scrollWidth>innerWidth+1)o.push('HSCROLL '+document.documentElement.scrollWidth);
                 var els=[...document.querySelectorAll('.sheet > *, .rail2 > *')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).display!='none');
                 for(var i=0;i<els.length;i++)for(var j=i+1;j<els.length;j++){var a=els[i].getBoundingClientRect(),c=els[j].getBoundingClientRect();var w=Math.min(a.right,c.right)-Math.max(a.left,c.left),h=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);if(w>1&&h>1)o.push('overlap '+els[i].className+'/'+els[j].className)}
                 document.querySelectorAll('.chip,.tool,.sb').forEach(function(e){if(e.scrollWidth>e.clientWidth+1)o.push('clip '+e.textContent.slice(0,20))});
                 var sv=document.getElementById('svg').getBoundingClientRect();o.push('svg '+Math.round(sv.width)+'x'+Math.round(sv.height));return o}''')
                print(vw,les,r)
                if les in('linux-labs','linux-systemd'): await pg.screenshot(path=f'/tmp/m_{vw}_{les}.png',full_page=True)
            await pg.close()
        await b.close()
asyncio.run(main())
