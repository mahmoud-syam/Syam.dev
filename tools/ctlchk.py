import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh in [(1440,900),(1280,720),(1920,1080)]:
            pg=await b.new_page(viewport={'width':vw,'height':vh})
            await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('app.html'))+''); await pg.wait_for_timeout(500)
            ids=await pg.evaluate("Object.keys(window.LESSONS)"); bad=[]
            for i in ids:
                await pg.evaluate(f"location.hash='{i}'"); await pg.wait_for_timeout(150)
                r=await pg.evaluate("""()=>{var sw=document.getElementById('sw');if(!sw)return null;var c=sw.getBoundingClientRect();var o=[...sw.querySelectorAll('button')].filter(b=>{var r=b.getBoundingClientRect();return r.width>0&&(r.right>c.right+1||b.scrollWidth>b.clientWidth+1)}).map(b=>b.textContent);return o.length?o.join(','):null}""")
                if r: bad.append((i,r))
            print(vw,len(ids),bad)
        await b.close()
asyncio.run(main())
