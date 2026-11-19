import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/authI18n", () => ({ translateExactText: (text: string) => text === "Settings" ? "Paramètres" : text }));
import { startInterfaceTranslation } from "./interfaceDom";

describe("interface localization privacy", () => {
  beforeEach(() => { document.body.innerHTML = ""; });
  it("leaves messages and editable content unchanged", () => {
    document.body.innerHTML = '<button>Settings</button><div class="message-content"><h2>Settings</h2></div><div contenteditable><h2>Settings</h2></div>';
    const stop = startInterfaceTranslation("fr");
    expect(document.querySelector("button")?.textContent).toBe("Paramètres");
    expect(document.querySelector(".message-content")?.textContent).toBe("Settings");
    expect(document.querySelector("[contenteditable]")?.textContent).toBe("Settings");
    stop();
  });
  it("restores the original controls when the language changes", () => {
    document.body.innerHTML = '<button>Settings</button><input placeholder="Settings">';
    const stop = startInterfaceTranslation("fr");
    expect(document.querySelector("input")?.placeholder).toBe("Paramètres");
    stop();
    expect(document.querySelector("button")?.textContent).toBe("Settings");
    expect(document.querySelector("input")?.placeholder).toBe("Settings");
  });
});
import { bundledText } from "@/lib/i18n/bundledLocales";
describe("phrases with names and numbers", () => {
  it("translates the message box hint with the bot name", () => {
    expect(bundledText("Message Dev", "de")).toBe("Nachricht Dev");
  });
  it("translates the permissions summary", () => {
    expect(bundledText("Auto-review on · 0 rules", "fr")).toBe("Vérification automatique: Activé · 0 règles");
  });
});
