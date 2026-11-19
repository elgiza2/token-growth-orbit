"""Writes researched landing copy for every country in its own language (run once by an operator; output is committed)."""
import json, os, concurrent.futures as cf, requests, time
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,"../../src/components/countries/data")
KEY=os.environ["LOVABLE_API_KEY"]; C=json.load(open(os.path.join(HERE,"countries.json")))
FACTS="""Ceyo is a platform of personal AI agents ("bots"). Real features only:
- Every bot gets its own isolated cloud computer that keeps working 24/7, even when the user's phone is off.
- Autonomous web browser: it opens sites, fills forms, researches, compares prices.
- Coding agent: writes, runs and tests code in the cloud computer; builds websites.
- Personal Telegram bots and group chats where several bots work together as a team of specialists.
- Connects to 1,000+ apps (Gmail, Google Sheets, Slack, Notion, CRMs, calendars...).
- Voice and video calls with your bots; phone-call agents.
- Scheduled routines: minute/daily/weekly tasks and reports.
- Long memory and documents shared between your bots; deep research reports.
- Built-in crypto wallet.
Plans: Plus $20/month, Pro $60/month, Ultra $120/month. Every plan starts with a 3-day free trial with up to 1,000,000 tokens per day; a card is linked and charged only when the trial ends unless cancelled.
Never invent customer counts, testimonials, partnerships, awards, offices, local prices or statistics. Never claim local payment methods by name."""
SCHEMA="""Return ONE JSON object with exactly these keys (all text values written in the page language unless noted):
{"name":"country name in page language","nameEn":"English name","nameAr":"Arabic name","city":"main business city","dir":"ltr or rtl",
"flag":["#hex primary flag colour","#hex second flag colour"],
"title":"SEO title <=60 chars containing Ceyo and the country","description":"meta description 140-160 chars",
"eyebrow":"2-5 words","h1":"hero headline 4-9 words, specific to this country","accent":"1-3 words copied exactly from h1 to highlight","sub":"1-2 sentence hero subline",
"audience":"who in this country benefits most (specific local sectors)",
"manifesto":"one strong statement, 22-40 words, about how Ceyo fits life/work in this country",
"uses":[{"t":"3-6 word title","d":"1-2 sentences, concrete local scenario"}] (exactly 6, grounded in this country's real economy, cities, languages and habits),
"steps":[{"t":"short","d":"one sentence"}] (exactly 3: how to start),
"chapters":[{"k":"1-2 word label","t":"short title","d":"2 sentences"}] (exactly 4, a story of a day of work in this country with Ceyo),
"highlights":["short phrase"] (exactly 4, real Ceyo facts e.g. '1,000+ apps', '24/7 cloud computer'),
"faq":[{"q":"question locals would search","a":"2-3 sentence answer"}] (exactly 5, include price and free trial, languages supported, data/cloud, Telegram),
"landmarks":[{"name":"landmark name in page language","wiki":"exact English Wikipedia article title"}] (exactly 6 famous, photogenic places or city skylines of this country),
"ui":{"features":"","pricing":"","faq":"","signin":"","start":"Start free trial","seePlans":"","usesTitle":"","stepsTitle":"","chaptersTitle":"","pricingTitle":"","pricingBody":"","perMonth":"/month","popular":"Most popular","trialNote":"3-day free trial · up to 1,000,000 tokens a day","faqTitle":"","ctaTitle":"","ctaBody":"","countries":"Ceyo around the world","compare":"Compare","rights":"All rights reserved"}}
Fill every ui value translated into the page language. Write natively and idiomatically, like a professional local copywriter who studied this market. No markdown."""
def one(row):
    cc,en,lang=row; p=os.path.join(OUT,f"{cc}.json")
    if os.path.exists(p): return cc,"skip"
    user=f"Write the landing page for Ceyo in {en}. Page language: ISO 639-1 '{lang}'"+(" (use Traditional Chinese)" if cc=="tw" else "")+". "+SCHEMA
    err=""
    for a in range(6):
        try:
            r=requests.post("https://ai.gateway.lovable.dev/v1/chat/completions",headers={"Authorization":f"Bearer {KEY}"},json={"model":"google/gemini-3.8-flash","messages":[{"role":"system","content":"You are a senior multilingual SEO/GEO copywriter and market researcher. "+FACTS},{"role":"user","content":user}],"response_format":{"type":"json_object"}},timeout=180)
            r.raise_for_status(); t=r.json()["choices"][0]["message"]["content"].strip()
            if t.startswith("```"): t=t.strip("`").split("\n",1)[1]
            d=json.loads(t); assert len(d["uses"])>=6 and len(d["faq"])>=5 and len(d["landmarks"])>=4 and len(d["chapters"])>=4
            d.update(code=cc,lang=lang); json.dump(d,open(p,"w"),ensure_ascii=False); return cc,"ok"
        except Exception as e:
            err=str(e)[:160]; time.sleep(8*(a+1))
    return cc,"FAIL "+err
os.makedirs(OUT,exist_ok=True)
with cf.ThreadPoolExecutor(8) as ex:
    for cc,s in ex.map(one,C): print(cc,s,flush=True)
