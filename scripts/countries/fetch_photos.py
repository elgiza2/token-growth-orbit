"""Adds landmark photos (Wikimedia Commons thumbnails via Wikipedia) to each country copy file that has none yet."""
import json, os, glob, re, requests
HERE=os.path.dirname(os.path.abspath(__file__)); DATA=os.path.join(HERE,"../../src/components/countries/data")
UA={"User-Agent":"CeyoLandingBuilder/1.0 (https://ceyo.app; support@megsyai.com)"}
LEGACY=dict(re.findall(r'^\s*(\w\w): \{ img: "([^"]+)"', open(os.path.join(HERE,"../../src/components/landing/countryProfiles.ts")).read(), re.M)) if os.path.exists(os.path.join(HERE,"../../src/components/landing/countryProfiles.ts")) else {}
def thumbs(titles):
    r=requests.get("https://en.wikipedia.org/w/api.php",params={"action":"query","format":"json","prop":"pageimages","piprop":"thumbnail","pithumbsize":1600,"redirects":1,"titles":"|".join(titles)},headers=UA,timeout=30).json()
    q=r.get("query",{}); norm={x["to"]:x["from"] for x in q.get("normalized",[])+q.get("redirects",[])}
    out={}
    for p in q.get("pages",{}).values():
        s=p.get("thumbnail",{}).get("source")
        if s and re.search(r"\.jpe?g(/|$)",s,re.I):
            t=p["title"]; out[norm.get(norm.get(t,t),norm.get(t,t))]=s; out[t]=s
    return out
for f in sorted(glob.glob(os.path.join(DATA,"*.json"))):
    d=json.load(open(f))
    if len(d.get("images") or [])>=4: continue
    imgs=list(d.get("images") or [])
    if d["code"] in LEGACY: imgs.append({"src":LEGACY[d["code"]],"alt":d["landmarks"][0]["name"] if d.get("landmarks") else d["name"]})
    lm=[x for x in d.get("landmarks",[]) if x.get("wiki")]
    try:
        t=thumbs([x["wiki"] for x in lm])
        for x in lm:
            s=t.get(x["wiki"]) or t.get(x["wiki"].replace("_"," "))
            if s and all(s!=i["src"] for i in imgs): imgs.append({"src":s,"alt":x["name"]})
        if len(imgs)<4:
            en=d.get("nameEn") or d["name"]
            t2=thumbs([f"Tourism in {en}",f"Geography of {en}",f"Culture of {en}",d.get("city",""),en])
            for s in t2.values():
                if len(imgs)>=6: break
                if all(s!=i["src"] for i in imgs): imgs.append({"src":s,"alt":d.get("city") or d["name"]})
        if len(imgs)<4:
            en=d.get("nameEn") or d["name"]
            for qq in [f"{x.get('wiki','').replace('_',' ')}" for x in lm[:3]]+[f"{en} landmark",f"{en} city skyline",f"{en} landscape"]:
                if len(imgs)>=5 or not qq.strip(): continue
                r=requests.get("https://commons.wikimedia.org/w/api.php",params={"action":"query","format":"json","generator":"search","gsrnamespace":6,"gsrsearch":qq+" filetype:bitmap","gsrlimit":4,"prop":"imageinfo","iiprop":"url|size","iiurlwidth":1600},headers=UA,timeout=30).json()
                for pg in sorted(r.get("query",{}).get("pages",{}).values(),key=lambda x:x.get("index",0)):
                    ii=(pg.get("imageinfo") or [{}])[0]; s2=ii.get("thumburl")
                    if s2 and re.search(r"\.jpe?g",s2,re.I) and ii.get("width",0)>=1000 and all(s2!=i["src"] for i in imgs):
                        imgs.append({"src":s2,"alt":qq.replace(" landmark","").replace(" city skyline","").replace(" landscape","")}); break
    except Exception as e: print(d["code"],"ERR",e)
    d["images"]=imgs; json.dump(d,open(f,"w"),ensure_ascii=False); print(d["code"],len(imgs),flush=True)
