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
  const panel = (label: string, n: number, cls: string, body: string) => `<details class="fp"><summary>${esc(label)} <i>${n}</i></summary><div class="${cls}">${body}</div></details>`;
  const css = `<style>.fpw .fp{background:none!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important;border-radius:0!important;color:inherit!important}.fpw .fp summary{background:none!important;color:inherit!important;width:auto!important;justify-content:flex-start!important}.fpw .fp summary::before{display:none!important}.fpw a{color:inherit!important;opacity:.9}.fpw{display:flex;flex-direction:column;gap:10px;margin:24px 0}.fp summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:999px;border:1px solid currentColor;font-size:14px;font-weight:500;opacity:.9;user-select:none}.fp summary::-webkit-details-marker{display:none}.fp summary::after{content:"+";font-size:18px;line-height:1}.fp[open] summary::after{content:"–"}.fp summary i{font-style:normal;font-size:11px;opacity:.6}.fp summary:hover{opacity:1}
.fp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin-top:14px}.fp-c{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;font-size:13px;text-decoration:none;color:inherit}.fp-c:hover,.fp-c[aria-current]{background:rgba(127,127,127,.15)}.fp-c img{width:24px;height:18px;object-fit:cover;border-radius:3px;flex:none;box-shadow:0 0 0 1px rgba(127,127,127,.25)}
.fp-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:14px}.fp-t{display:flex;flex-direction:column;gap:6px;padding:20px 22px;border-radius:16px;border:1px solid rgba(127,127,127,.3);text-decoration:none;color:inherit;min-height:96px}.fp-t:hover{background:rgba(127,127,127,.12)}.fp-t b{font-size:17px;font-weight:600}.fp-t span{font-size:12.5px;opacity:.65}
.fp-lg{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.fp-l{padding:10px 18px;border-radius:999px;border:1px solid rgba(127,127,127,.3);font-size:14px;text-decoration:none;color:inherit}.fp-l:hover{background:rgba(127,127,127,.12)}</style>`;
  return `${css}<div class="fpw">${panel(L.world, COUNTRY_PAGES.length, "fp-g", countries)}${panel(L.compare, TOOLS.length, "fp-tg", compares)}${langs ? panel(L.languages, o.langs!.length, "fp-lg", langs) : ""}</div>`;
}
