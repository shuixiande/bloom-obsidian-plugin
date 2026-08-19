/* =========================================================================
   Bloom — generic entry modal
   Field-driven modal (text / number / select) used for adding an expense, a
   book, or any other structured record. Reuses the dashboard's pastel tokens
   by wrapping content in `.bloom`. Avoids `window.prompt()` (blocked inside
   Obsidian's iframe sandbox) — the same pattern as NewTaskModal.
   ========================================================================= */
import { App, Modal, Notice, TextComponent, DropdownComponent } from "obsidian";

export interface ModalField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

type Control = TextComponent | DropdownComponent;

export class EntryModal extends Modal {
  private submitted = false;
  private controls: Record<string, Control> = {};

  constructor(
    app: App,
    private titleText: string,
    private noteText: string,
    private fields: ModalField[],
    private submitLabel: string,
    private onConfirm: (values: Record<string, string>) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const wrap = contentEl.createDiv({ cls: "bloom bloom-settings bloom-entry-modal" });

    wrap.createEl("h3", { text: this.titleText, cls: "bs-title" });
    if (this.noteText) {
      wrap.createEl("div", { text: this.noteText, cls: "bs-note" });
    }

    let firstInput: TextComponent | null = null;
    for (const f of this.fields) {
      const row = wrap.createDiv({ cls: "bs-row" });
      row.createSpan({ text: f.label, cls: "bs-label" });
      const fieldBox = row.createDiv({ cls: "bs-field" });

      if (f.type === "select") {
        const dd = new DropdownComponent(fieldBox);
        (f.options ?? []).forEach((o) => dd.addOption(o.value, o.label));
        if (f.defaultValue) dd.setValue(f.defaultValue);
        this.controls[f.key] = dd;
      } else {
        const tc = new TextComponent(fieldBox)
          .setPlaceholder(f.placeholder ?? "")
          .setValue(f.defaultValue ?? "");
        tc.inputEl.addClass("bs-input");
        if (f.type === "number") tc.inputEl.setAttribute("inputmode", "decimal");
        if (!firstInput) firstInput = tc;
        tc.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.submit();
          }
        });
        this.controls[f.key] = tc;
      }
    }

    const foot = wrap.createDiv({ cls: "bs-row bs-foot" });
    const cancel = foot.createEl("button", { text: "Cancel", cls: "bs-btn" });
    cancel.addEventListener("click", () => this.close());
    const add = foot.createEl("button", { text: this.submitLabel, cls: "bs-btn bs-primary" });
    add.addEventListener("click", () => this.submit());

    window.setTimeout(() => firstInput?.inputEl.focus(), 50);
  }

  private submit() {
    const values: Record<string, string> = {};
    for (const f of this.fields) {
      const c = this.controls[f.key];
      if (!c) continue;
      values[f.key] = (c.getValue?.() ?? "").toString().trim();
    }
    this.submitted = true;
    this.onConfirm(values);
    this.close();
  }

  onClose() {
    if (!this.submitted) {
      // Escape / backdrop click — treat as cancel, do nothing.
    }
    this.contentEl.empty();
  }
}
