/** Site footer (NimbusOS-style sky + white card). Countries, comparisons and languages open from buttons inside the card via <details>, so every link stays crawlable without script. */
import { TOOLS } from "@/components/compare/tools";
import { COUNTRY_PAGES } from "./list";

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export type FooterLang = { path: string; label: string };

const SKY = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4ec0de15-9d60-43b1-a76e-7d721f094fd6.jpg";
const FLOOR = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/cadf77d3-d2b1-45a2-800b-5f96d6ec3f18.jpg";
const GRAIN = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M8.5 12h7M12.5 9l3 3-3 3"/></svg>';
const LOGO = '<svg viewBox="0 0 33 31" fill="#111884"><polygon points="16.5,9.5 21,12.2 21,17.6 16.5,20.3 12,17.6 12,12.2"/><g fill="none" stroke="#111884" stroke-width="1.4"><polygon points="16.5,1 19.6,2.8 19.6,6.4 16.5,8.2 13.4,6.4 13.4,2.8"/><polygon points="26.5,6.8 29.6,8.6 29.6,12.2 26.5,14 23.4,12.2 23.4,8.6"/><polygon points="26.5,17 29.6,18.8 29.6,22.4 26.5,24.2 23.4,22.4 23.4,18.8"/><polygon points="16.5,22.8 19.6,24.6 19.6,28.2 16.5,30 13.4,28.2 13.4,24.6"/><polygon points="6.5,17 9.6,18.8 9.6,22.4 6.5,24.2 3.4,22.4 3.4,18.8"/><polygon points="6.5,6.8 9.6,8.6 9.6,12.2 6.5,14 3.4,12.2 3.4,8.6"/></g></svg>';

export function footerPanels(o: { current?: string; langs?: FooterLang[]; labels?: { world?: string; compare?: string; languages?: string } }) {
  const L = { world: "SEO around the world", compare: "Comparisons", languages: "Languages", ...o.labels };
  const countries = COUNTRY_PAGES.map((c) => `<a class="nf-c" href="/countries/${c.slug}"${c.code === o.current ? ' aria-current="page"' : ""}><img src="https://flagcdn.com/w40/${c.code}.png" alt="" width="24" height="18" loading="lazy">${esc(c.nameEn)}</a>`).join("");
  const compares = TOOLS.map((t) => `<a class="nf-t" href="/compare/${t.slug}"><b>Ceyo vs ${esc(t.name)}</b><span>${esc(t.kind)}</span></a>`).join("");
  const langs = (o.langs ?? []).map((l) => `<a class="nf-l" href="${l.path}">${esc(l.label)}</a>`).join("");
  const panel = (label: string, n: number, cls: string, body: string) => `<details class="nf-d"><summary><span>${esc(label)}</span><small>${n}</small><i></i></summary><div class="nf-p"><div class="${cls}">${body}</div></div></details>`;
  const col = (id: string, h: string, links: [string, string][]) => `<div class="nf-col" id="nf-${id}" role="tabpanel" aria-labelledby="nft-${id}"><h4>${esc(h)}</h4>${links.map(([t, u]) => `<a href="${u}">${esc(t)}</a>`).join("")}</div>`;
  const cols: [string, string, [string, string][]][] = [
    ["product", "Product", [["Pricing", "/pricing"], ["Free trial", "/pricing"], ["Sign in", "/auth"], ["Compare", "/compare"]]],
    ["explore", "Explore", [["Countries", "#nf-world"], ["Comparisons", "#nf-cmp"], ["Languages", "#nf-lang"], ["Sitemap", "/sitemap.xml"]]],
    ["legal", "Company", [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refund"]]],
  ];
  const css = `<style>
.nf{--u:min(calc(100vw/1433),max(.68px,calc(100vh/1098)));position:relative;width:100vw;margin:0 calc(50% - 50vw);background:#03063A url(${SKY}) center bottom/cover no-repeat;color:#000;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:400;display:flex;flex-direction:column;min-height:100vh;overflow:hidden;text-align:start;isolation:isolate}
.nf *{box-sizing:border-box}.nf a{text-decoration:none!important}
.nf::before{content:"";position:absolute;inset:0;background:url("${GRAIN}") 0 0/calc(220*var(--u));opacity:.07;mix-blend-mode:soft-light;pointer-events:none;z-index:-1}
.nf-floor{position:absolute;left:0;right:0;bottom:0;height:calc(157.5*var(--u));background:url(${FLOOR}) center/100% 100%;-webkit-mask:linear-gradient(transparent,#000 calc(8*var(--u)));mask:linear-gradient(transparent,#000 calc(8*var(--u)));z-index:-1}
.nf-hero{padding:calc(35*var(--u)) calc(47*var(--u)) 0;color:#fff;max-width:calc(1100*var(--u))}
.nf-badge{width:calc(43*var(--u));height:calc(43*var(--u));background:#fff;clip-path:polygon(0 0,72% 0,100% 28%,100% 100%,0 100%);display:grid;place-items:center;color:#111884}.nf-badge svg{width:45%}
.nf-hero h2{margin:calc(41*var(--u)) 0 0;font-size:max(26px,calc(53.8*var(--u)));line-height:1.23;font-weight:400;color:rgba(255,255,255,.9);-webkit-text-stroke:.3px currentColor;letter-spacing:-.01em}
.nf-hero p{margin:calc(20*var(--u)) 0 0;font-size:max(14px,calc(18.6*var(--u)));line-height:1.58;color:rgba(255,255,255,.69);max-width:calc(820*var(--u))}
.nf-cta{display:flex;gap:calc(10*var(--u));margin-top:calc(35.7*var(--u));flex-wrap:wrap}
.nf-cta a{display:inline-flex;align-items:center;height:max(44px,calc(55.5*var(--u)));transition:background .25s,color .25s}
.nf-go{background:#fff;color:#111884!important;padding-inline-start:calc(22*var(--u));gap:calc(16*var(--u));font-size:max(14px,calc(17*var(--u)))}.nf-go span{width:max(38px,calc(48*var(--u)));height:max(38px,calc(48*var(--u)));margin-inline-end:calc(4*var(--u));background:#111884;color:#fff;display:grid;place-items:center}.nf-go span svg{width:55%}.nf-go:hover span{background:#1A23A6}
.nf-ghost{padding:0 calc(26*var(--u));color:#fff!important;background:rgba(255,255,255,.2);backdrop-filter:blur(4px);font-size:max(14px,calc(17*var(--u)))}.nf-ghost:hover{background:rgba(255,255,255,.26);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6)}
.nf-sp{flex:1;min-height:calc(60*var(--u))}
.nf-card{margin:0 calc(48*var(--u)) calc(40*var(--u));background:#FEFEFE;outline:1px solid rgba(0,0,0,.85);box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 4px #E0E1E9,0 2px 0 rgba(0,0,0,.35)}
.nf-top{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,minmax(150px,calc(210*var(--u))));padding:calc(62*var(--u)) calc(40*var(--u)) calc(40*var(--u)) calc(58*var(--u));gap:0}
.nf-brand .nf-lg{display:flex;align-items:center;gap:10px;font-size:max(20px,calc(25.4*var(--u)));color:#000!important}.nf-brand .nf-lg svg{width:max(28px,calc(33*var(--u)))}
.nf-brand h3{margin:calc(60*var(--u)) 0 calc(28*var(--u));font-size:max(20px,calc(30.6*var(--u)));line-height:1.25;font-weight:400;-webkit-text-stroke:.2px currentColor}
.nf-btn{display:inline-flex;align-items:center;justify-content:space-between;gap:16px;height:48px;padding:0 4px 0 18px;background:#111884;color:#fff!important;font-size:15px;transition:background .25s}.nf-btn:hover{background:#1A23A6}.nf-btn span{width:40px;height:40px;background:#fff;color:#111884;display:grid;place-items:center}.nf-btn svg{width:20px}
.nf-col{border-inline-start:2.4px solid #E0E1E9;padding-inline-start:calc(22*var(--u));display:flex;flex-direction:column;gap:calc(19.5*var(--u))}
.nf-col h4{margin:0 0 6px;font-size:max(16px,calc(19.8*var(--u)));font-weight:400;color:#000}
.nf-col a{font-size:max(14px,calc(15.8*var(--u)));color:#4E4E51!important;transition:color .2s}.nf-col a:hover{color:#111884!important}
.nf-tabs{display:none}
.nf-ex{border-top:1px solid #E0E1E9;padding:calc(22*var(--u)) calc(58*var(--u));display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.nf-d{border:1px solid #E0E1E9;background:#fff}.nf-d[open]{grid-column:1/-1;order:9}
.nf-d summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:16px 18px;font-size:16px;color:#000;user-select:none}.nf-d summary::-webkit-details-marker{display:none}
.nf-d summary small{color:#59595C;font-size:12px;border:1px solid #E0E1E9;padding:2px 8px}.nf-d summary i{margin-inline-start:auto;width:8px;height:8px;border-right:1.5px solid #111884;border-bottom:1.5px solid #111884;transform:rotate(45deg);transition:transform .3s}.nf-d[open] summary i{transform:rotate(225deg)}.nf-d summary:hover{color:#111884}
.nf-p{border-top:1px solid #E0E1E9;padding:14px;max-height:420px;overflow:auto;scrollbar-width:thin}
.nf-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:2px}.nf-c{display:flex;align-items:center;gap:10px;padding:9px 10px;font-size:13.5px;color:#4E4E51!important}.nf-c:hover,.nf-c[aria-current]{background:#F3F4FA;color:#111884!important}.nf-c img{width:24px;height:18px;object-fit:cover;flex:none;outline:1px solid #E0E1E9}
.nf-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}.nf-t{display:flex;flex-direction:column;justify-content:space-between;gap:10px;padding:18px;min-height:100px;border:1px solid #E0E1E9;color:#000!important;transition:border-color .2s,background .2s}.nf-t:hover{border-color:#111884;background:#F7F8FD}.nf-t b{font-size:17px;font-weight:400}.nf-t span{font-size:12.5px;color:#59595C}
.nf-lgr{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.nf-l{padding:13px;border:1px solid #E0E1E9;text-align:center;font-size:14px;color:#000!important}.nf-l:hover{border-color:#111884;color:#111884!important}
.nf-bot{min-height:62px;border-top:1px solid #E0E1E9;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px calc(58*var(--u));font-size:13px;color:#59595C}.nf-bot nav{display:flex;gap:6px;flex-wrap:wrap}.nf-bot a{color:#59595C!important}.nf-bot a:hover{color:#111884!important}
.nf.pend .nf-a{opacity:0}.nf-a{animation:none}
@media (max-width:900px){.nf-top{grid-template-columns:1fr 1fr 1fr;gap:24px 0}.nf-brand{grid-column:1/-1}.nf-ex{grid-template-columns:1fr}}
@media (max-width:600px){.nf{min-height:0}.nf-hero{padding:28px 20px 0}.nf-card{margin:0 12px 24px}.nf-top{grid-template-columns:1fr;padding:32px 20px 20px}.nf-tabs{display:flex;gap:4px;margin:24px 0 4px;border-bottom:1px solid #E0E1E9}.nf-tabs button{flex:1;background:none;border:0;border-bottom:2px solid transparent;padding:10px 4px;font:inherit;font-size:14px;color:#59595C;cursor:pointer}.nf-tabs button[aria-selected=true]{color:#111884;border-color:#111884}
.nf.js .nf-col{display:none;border:0;padding:12px 0 0;grid-template-columns:1fr 1fr;gap:14px}.nf.js .nf-col.on{display:grid}.nf.js .nf-col h4{display:none}.nf-ex{padding:16px 20px}.nf-bot{flex-direction:column;align-items:flex-start;padding:16px 20px}}
@media (prefers-reduced-motion:reduce){.nf *{transition:none!important}}
</style>`;
  const js = `<script>(function(){var r=document.currentScript.previousElementSibling;if(!r||!r.classList.contains('nf'))return;r.classList.add('js');var tabs=[].slice.call(r.querySelectorAll('.nf-tabs button')),cols=[].slice.call(r.querySelectorAll('.nf-col'));function sel(i,f){tabs.forEach(function(t,j){t.setAttribute('aria-selected',j===i);t.tabIndex=j===i?0:-1;cols[j].classList.toggle('on',j===i)});if(f)tabs[i].focus()}tabs.forEach(function(t,i){t.onclick=function(){sel(i)};t.onkeydown=function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();sel((i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length,1)}}});sel(0);r.querySelectorAll('a[href^="#nf-"]').forEach(function(a){a.onclick=function(e){var d=r.querySelector(a.getAttribute('href'));if(d){e.preventDefault();d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}}});if(matchMedia('(prefers-reduced-motion: reduce)').matches||!r.animate)return;var els=[].slice.call(r.querySelectorAll('.nf-a'));var io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();els.forEach(function(el,i){el.animate([{opacity:0,transform:'translateY(14px)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'none',clipPath:'inset(0 0 0 0)'}],{duration:620,delay:80+i*90,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'})})},{threshold:.15});io.observe(r)})();</script>`;
  return `${css}<section class="nf" aria-label="Ceyo footer"><div class="nf-floor"></div>
<div class="nf-hero"><div class="nf-badge nf-a"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h9l3 3v13H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg></div>
<h2 class="nf-a">Your AI teammate, with its own computer.<br>Start free for 3 days.</h2>
<p class="nf-a">Ceyo works in a private cloud computer and browser, connects your apps and Telegram bots, and keeps going after you close the chat. The free trial includes up to 1,000,000 tokens a day.</p>
<div class="nf-cta nf-a"><a class="nf-go" href="/pricing">Start free trial<span>${ARROW}</span></a><a class="nf-ghost" href="/compare">Compare Ceyo</a></div></div>
<div class="nf-sp"></div>
<div class="nf-card"><div class="nf-top"><div class="nf-brand"><a class="nf-lg nf-a" href="/">${LOGO}Ceyo</a><h3 class="nf-a">The AI teammate<br>that gets work done.</h3><a class="nf-btn nf-a" href="/pricing">See plans<span>${ARROW}</span></a>
<div class="nf-tabs" role="tablist">${cols.map(([id, h]) => `<button role="tab" id="nft-${id}" aria-controls="nf-${id}">${esc(h)}</button>`).join("")}</div></div>
${cols.map(([id, h, l]) => col(id, h, l)).join("")}</div>
<div class="nf-ex">${panel(L.world, COUNTRY_PAGES.length, "nf-g", countries).replace('<details class="nf-d"', '<details class="nf-d" id="nf-world"')}${panel(L.compare, TOOLS.length, "nf-tg", compares).replace('<details class="nf-d"', '<details class="nf-d" id="nf-cmp"')}${langs ? panel(L.languages, o.langs!.length, "nf-lgr", langs).replace('<details class="nf-d"', '<details class="nf-d" id="nf-lang"') : ""}</div>
<div class="nf-bot nf-a"><nav><a href="/privacy">Privacy Policy</a>·<a href="/terms">Terms of Use</a>·<a href="/refund">Refunds</a></nav><span>© 2026 Ceyo. All rights reserved.</span></div></div></section>${js}`;
}
