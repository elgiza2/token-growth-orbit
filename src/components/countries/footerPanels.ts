/** Footer buttons that open full lists: countries (flag + English name), comparisons (large cards) and languages. Uses <details>, so no script is needed and every link stays crawlable. */
import { TOOLS } from "@/components/compare/tools";
import { COUNTRY_PAGES } from "./list";

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export type FooterLang = { path: string; label: string };

export function footerPanels(o: { current?: string; langs?: FooterLang[]; labels?: { world?: string; compare?: string; languages?: string } }) {
  const L = { world: "SEO around the world", compare: "Comparisons", languages: "Languages", ...o.labels };
  const countries = COUNTRY_PAGES.map((c) => `<a class="fp-c" href="/countries/${c.slug}"${c.code === o.current ? ' aria-current="page"' : ""}><img src="https://flagcdn.com/w40/${c.code}.png" alt="" width="24" height="18" loading="lazy">${esc(c.nameEn)}</a>`).join("");
  const compares = TOOLS.map((t) => `<a class="fp-t" href="/compare/${t.slug}"><b>Ceyo vs ${esc(t.name)}</b><span>${esc(t.kind)}</span></a>`).join("");
  const langs = (o.langs ?? []).map((l) => `<a class="fp-l" href="${l.path}">${esc(l.label)}</a>`).join("");
  const ic = {
    world: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9s-1.3 6.2-3.9 9c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3z"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/></svg>',
    lang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h9M8.5 3v2M6 5c.5 3.5 3 6 6 7M11 5c-.6 3.6-3.2 6.6-7 8M13 21l4-10 4 10M14.5 17.5h5"/></svg>',
  };
  const panel = (icon: string, label: string, n: number, cls: string, body: string) => `<details class="fp"><summary><span class="fp-i">${icon}</span><span class="fp-tx"><b>${esc(label)}</b><small>${n}</small></span><span class="fp-ch"></span></summary><div class="fp-p"><div class="${cls}">${body}</div></div></details>`;
  const css = `<style>.fpw .fp-g,.fpw .fp-tg,.fpw .fp-lg{display:grid!important;flex-wrap:nowrap!important}.fpw .fp-p{display:block!important}.fpw{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:28px 0;width:100%}
.fpw .fp{margin:0!important;padding:0!important;border:1px solid rgba(127,127,127,.22)!important;border-radius:20px!important;background:rgba(127,127,127,.06)!important;box-shadow:none!important;color:inherit!important;overflow:hidden;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:background .3s,border-color .3s}.fpw .fp:hover{border-color:rgba(127,127,127,.4)!important}
.fpw .fp[open]{grid-column:1/-1;order:9;background:rgba(127,127,127,.08)!important}
.fpw .fp summary{list-style:none;cursor:pointer;display:flex!important;align-items:center;gap:14px;padding:16px 18px!important;background:none!important;color:inherit!important;user-select:none;width:auto!important;border:0!important}.fpw .fp summary::-webkit-details-marker{display:none}.fpw .fp summary::before,.fpw .fp summary::after{display:none!important;content:none!important}
.fp-i{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(127,127,127,.14)}.fp-i svg{width:20px;height:20px}
.fp-tx{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.fp-tx b{font-size:15px;font-weight:600;letter-spacing:-.01em}.fp-tx small{font-size:12px;opacity:.55}
.fp-ch{flex:none;width:9px;height:9px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);margin-top:-4px;opacity:.6;transition:transform .35s}.fp[open] .fp-ch{transform:rotate(225deg);margin-top:4px}
.fp-p{padding:4px 14px 16px;max-height:440px;overflow:auto;scrollbar-width:thin}
.fpw a{color:inherit!important;text-decoration:none!important;opacity:1!important}
.fp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px}.fp-c{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;font-size:13.5px;transition:background .2s}.fp-c:hover,.fp-c[aria-current]{background:rgba(127,127,127,.14)}.fp-c img{width:26px;height:19px;object-fit:cover;border-radius:4px;flex:none;box-shadow:0 0 0 1px rgba(127,127,127,.25)}
.fp-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.fp-t{display:flex;flex-direction:column;justify-content:space-between;gap:10px;padding:20px;border-radius:16px;background:rgba(127,127,127,.08);min-height:110px;transition:background .2s,transform .2s}.fp-t:hover{background:rgba(127,127,127,.16);transform:translateY(-2px)}.fp-t b{font-size:18px;font-weight:600;letter-spacing:-.02em}.fp-t span{font-size:12.5px;opacity:.6}
.fp-lg{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.fp-l{padding:14px 16px;border-radius:14px;background:rgba(127,127,127,.08);font-size:14.5px;text-align:center;transition:background .2s}.fp-l:hover{background:rgba(127,127,127,.16)}</style>`;
  return `${css}<div class="fpw">${panel(ic.world, L.world, COUNTRY_PAGES.length, "fp-g", countries)}${panel(ic.compare, L.compare, TOOLS.length, "fp-tg", compares)}${langs ? panel(ic.lang, L.languages, o.langs!.length, "fp-lg", langs) : ""}</div>`;
}
