/** Competitor data for the /compare pages. Feature flags describe each product's main offering (not every add-on). */
export type Feature = "cloudComputer" | "browser" | "telegram" | "integrations" | "voice" | "routines" | "teams" | "wallet" | "memory" | "code";
export type Tool = { slug: string; name: string; maker: string; kind: string; about: string; bestFor: string; has: Feature[] };

export const FEATURE_LABELS: Record<Feature, string> = {
  cloudComputer: "Private cloud computer that runs 24/7",
  browser: "Browses and acts on websites by itself",
  telegram: "Personal bots you talk to in Telegram",
  integrations: "Connects to 1,000+ apps (Gmail, Notion, Slack…)",
  voice: "Live voice calls with your AI",
  routines: "Scheduled tasks every minute, day or week",
  teams: "Team of specialist bots working together",
  wallet: "Built-in crypto wallet",
  memory: "Long-term memory across chats",
  code: "Writes and runs code for you",
};
export const CEYO_FEATURES = Object.keys(FEATURE_LABELS) as Feature[];

const t = (slug: string, name: string, maker: string, kind: string, about: string, bestFor: string, has: Feature[]): Tool => ({ slug, name, maker, kind, about, bestFor, has });

export const TOOLS: Tool[] = [
  t("claude-code", "Claude Code", "Anthropic", "coding agent", "A command-line coding agent that edits code in your own project folder.", "developers working inside a codebase on their own machine", ["code", "memory"]),
  t("chatgpt", "ChatGPT", "OpenAI", "AI assistant", "A general chat assistant for writing, questions, images and research.", "quick answers, writing and everyday questions", ["memory", "voice", "code", "browser"]),
  t("claude", "Claude", "Anthropic", "AI assistant", "A chat assistant known for long documents, writing and analysis.", "long reading, writing and careful analysis", ["memory", "code"]),
  t("gemini", "Gemini", "Google", "AI assistant", "Google's assistant, tied into Gmail, Docs and Android.", "people who live inside Google apps", ["memory", "voice", "integrations"]),
  t("copilot", "Microsoft Copilot", "Microsoft", "AI assistant", "Microsoft's assistant inside Windows, Edge and Office.", "Windows and Microsoft 365 users", ["voice", "memory"]),
  t("github-copilot", "GitHub Copilot", "GitHub", "coding assistant", "Code suggestions and a coding agent inside your editor and GitHub.", "developers who want autocomplete in their editor", ["code"]),
  t("cursor", "Cursor", "Anysphere", "AI code editor", "A code editor with AI built into every file.", "developers who want an AI-first editor", ["code"]),
  t("windsurf", "Windsurf", "Windsurf", "AI code editor", "An AI code editor with an agent that edits across your project.", "developers working in one repository", ["code"]),
  t("devin", "Devin", "Cognition", "AI software engineer", "An autonomous software engineer for engineering teams.", "engineering teams handing off coding tickets", ["code", "browser", "cloudComputer"]),
  t("manus", "Manus", "Manus", "general AI agent", "An agent that completes multi-step tasks in a virtual computer.", "one-off research and multi-step tasks", ["browser", "code", "cloudComputer"]),
  t("perplexity", "Perplexity", "Perplexity AI", "AI search engine", "An answer engine that searches the web and cites sources.", "researching with cited sources", ["browser", "memory"]),
  t("grok", "Grok", "xAI", "AI assistant", "xAI's assistant with live access to posts on X.", "following news and conversations on X", ["voice", "browser"]),
  t("deepseek", "DeepSeek", "DeepSeek", "AI assistant", "A chat assistant built on open DeepSeek models.", "reasoning and coding questions at low cost", ["code"]),
  t("meta-ai", "Meta AI", "Meta", "AI assistant", "Meta's assistant inside WhatsApp, Instagram and Messenger.", "quick help inside Meta's apps", ["voice"]),
  t("mistral-le-chat", "Le Chat", "Mistral AI", "AI assistant", "Mistral's fast chat assistant from Europe.", "fast answers with a European provider", ["memory", "code"]),
  t("poe", "Poe", "Quora", "AI chat hub", "One app to chat with many different AI models.", "trying many models in one place", ["code"]),
  t("character-ai", "Character.AI", "Character.AI", "AI characters", "Chat and roleplay with AI characters.", "entertainment and character chats", ["voice", "memory"]),
  t("replit", "Replit Agent", "Replit", "app builder", "Builds and hosts apps from a description in the browser.", "building and hosting small apps", ["code", "cloudComputer"]),
  t("lovable", "Lovable", "Lovable", "app builder", "Builds full web apps from a chat.", "building websites and web apps", ["code"]),
  t("bolt", "Bolt.new", "StackBlitz", "app builder", "Generates and runs web apps in the browser.", "prototyping web apps quickly", ["code"]),
  t("v0", "v0", "Vercel", "UI builder", "Generates interfaces and web apps for Vercel.", "designing UI components and pages", ["code"]),
  t("zapier", "Zapier", "Zapier", "automation platform", "Connects apps with rule-based workflows and AI steps.", "fixed workflows between business apps", ["integrations", "routines"]),
  t("make", "Make", "Make", "automation platform", "Visual workflow builder for connecting apps.", "visual, step-by-step automations", ["integrations", "routines"]),
  t("n8n", "n8n", "n8n", "automation platform", "Open workflow automation you can self-host.", "technical teams building workflows", ["integrations", "routines", "code"]),
  t("openai-operator", "ChatGPT Agent", "OpenAI", "browser agent", "ChatGPT's agent mode that uses a browser to finish tasks.", "one-off tasks on websites", ["browser", "code"]),
  t("notion-ai", "Notion AI", "Notion", "workspace AI", "AI writing and search inside Notion.", "teams whose work lives in Notion", ["memory", "integrations"]),
  t("jasper", "Jasper", "Jasper", "marketing AI", "AI writing for marketing teams and brands.", "marketing copy in a brand voice", ["memory"]),
  t("elevenlabs", "ElevenLabs", "ElevenLabs", "voice AI", "Realistic AI voices and voice agents.", "voiceovers and voice agents", ["voice"]),
  t("crewai", "CrewAI", "CrewAI", "agent framework", "A framework for developers to build teams of AI agents.", "developers coding their own agents", ["teams", "code"]),
  t("openclaw", "OpenClaw", "Open source", "self-hosted agent", "An open-source personal agent you run on your own machine.", "tinkerers who host their own agent", ["telegram", "memory", "code", "routines"]),
];
export const toolBySlug = (s: string) => TOOLS.find((x) => x.slug === s);
