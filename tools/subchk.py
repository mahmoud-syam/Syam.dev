import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh in [(1440,900),(1280,720)]:
            pg=await b.new_page(viewport={'width':vw,'height':vh})
            await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('index.html'))+''); await pg.wait_for_timeout(500)
            ids=await pg.evaluate("Object.keys(window.LESSONS)")
            bad=[]
            for i in ids:
                await pg.evaluate(f"location.hash='{i}'"); await pg.wait_for_timeout(120)
                r=await pg.evaluate("""()=>{var e=[...document.querySelectorAll('.head *')].find(x=>x.children.length==0&&(x.scrollWidth>x.clientWidth+1||x.scrollHeight>x.clientHeight+1)&&getComputedStyle(x).overflow=='hidden');return e?(e.className+': '+e.textContent.length):null}""")
                if r: bad.append((i,r))
            print(vw,len(ids),len(bad)); [print('  ',x) for x in bad[:80]]
        await b.close()
asyncio.run(main())
