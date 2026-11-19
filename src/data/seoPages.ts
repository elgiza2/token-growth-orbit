/** Public SEO/GEO landing pages. Browser-safe. Each slug becomes /ai/<slug>. */
export type SeoPage = { slug: string; kind: "geo" | "use"; title: string; h1: string; intro: string; points: string[] };

const geo = (slug: string, city: string, country: string): SeoPage => ({
  slug, kind: "geo",
  title: `AI Agents in ${city} — Ceyo personal bots for ${country}`,
  h1: `Personal AI bots for people and teams in ${city}`,
  intro: `Ceyo gives everyone in ${city} a team of personal bots with their own cloud computer. They browse the web, write code, handle Telegram and keep working while your phone is off.`,
  points: [
    `Replies in your language and dialect, including Arabic and English`,
    `Runs in the cloud around the clock — no laptop needed in ${city}`,
    `Connects to 1,000+ apps you already use`,
    `Start with a 3-day free trial`,
  ],
});
const use = (slug: string, topic: string, h1: string, intro: string, points: string[]): SeoPage => ({
  slug, kind: "use", title: `${topic} — Ceyo`, h1, intro, points,
});

export const SEO_PAGES: SeoPage[] = [
  geo("cairo", "Cairo", "Egypt"), geo("alexandria", "Alexandria", "Egypt"), geo("riyadh", "Riyadh", "Saudi Arabia"),
  geo("jeddah", "Jeddah", "Saudi Arabia"), geo("dubai", "Dubai", "the UAE"), geo("abu-dhabi", "Abu Dhabi", "the UAE"),
  geo("doha", "Doha", "Qatar"), geo("kuwait-city", "Kuwait City", "Kuwait"), geo("amman", "Amman", "Jordan"),
  geo("casablanca", "Casablanca", "Morocco"), geo("london", "London", "the UK"), geo("new-york", "New York", "the US"),
  use("telegram-ai-bot", "Telegram AI bot", "Your own AI bot on Telegram", "Give your Ceyo bot a Telegram account. It answers, remembers context and does the work behind the message.", ["Personal and business Telegram replies", "Reads and summarises your chats when you ask", "Same bot in the app and on Telegram", "No server to run yourself"]),
  use("ai-web-browsing-agent", "AI web browsing agent", "A bot that browses the web for you", "Ceyo bots open real websites, search, compare and collect what you need, then bring back a clean answer.", ["Real browser in the cloud", "Asks you before signing in anywhere", "Research, prices, lists and reports", "Works while you do something else"]),
  use("ai-coding-assistant", "AI coding assistant", "A coding bot with its own computer", "Your bot writes, runs and tests code in an isolated cloud computer, then hands you the files.", ["Runs code safely in a private sandbox", "Exports full projects as files", "Explains what it changed", "Keeps going on long tasks"]),
  use("ai-research-assistant", "AI research assistant", "Deep research, done for you", "Ask a question and your bot reads many sources, checks them and writes a clear report.", ["Many sources per answer", "Saves documents you can download", "Arabic and English reports", "Follow-up questions in the same chat"]),
  use("social-media-automation", "Social media automation with AI", "Let bots handle your social media work", "Plan posts, draft captions and pull insights from social platforms with a team of bots.", ["Drafts posts in your voice", "Collects public social data", "Recurring routines on a schedule", "You approve before anything is published"]),
  use("ai-agent-team", "AI agent team", "Build a team of specialist bots", "Create bots for writing, research, coding and sales, and put them together in group chats.", ["Unlimited bots on your account", "Group chats with a coordinator", "Shared memory and documents", "Each bot has its own instructions"]),
  use("ai-phone-calls", "AI phone calls", "Bots that can talk and call", "Talk to your bot with your voice, and let it handle calls with natural speech.", ["Live voice conversations", "Voice notes in any language", "Call summaries back in your chat", "Your own bot voice"]),
  use("ai-scheduled-tasks", "Scheduled AI tasks", "Routines that run every day on their own", "Set a task once — a daily report, a price check, a reminder — and your bot does it on schedule.", ["Minute, daily or weekly routines", "Results delivered to your chat", "Pause or change anytime", "No duplicate runs"]),
  use("ai-app-integrations", "AI app integrations", "Connect your bots to 1,000+ apps", "Gmail, Sheets, Notion, Slack and more — your bot acts in your apps after you approve.", ["Connect apps in a tap", "Approve each action or trust an app", "Your accounts stay yours", "Works across many apps in one task"]),
  use("ai-crypto-wallet", "AI with a crypto wallet", "A personal bot with a built-in wallet", "Hold, send and trade crypto from the same app, with every move confirmed by you.", ["Self-custody wallet", "Bots can only propose — you confirm", "Live market prices", "Multiple networks"]),
  use("chatgpt-alternative-arabic", "Arabic ChatGPT alternative", "An Arabic-first alternative to ChatGPT that actually does the work", "Ceyo understands Egyptian, Gulf and Levantine Arabic and goes beyond chat: it browses, codes and runs tasks.", ["Replies in your dialect", "Takes real actions, not just text", "Bots that keep working in the cloud", "3-day free trial"]),
];

export const seoPage = (slug: string) => SEO_PAGES.find((p) => p.slug === slug);
