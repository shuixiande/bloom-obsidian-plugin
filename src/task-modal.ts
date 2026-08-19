/* =========================================================================
   Bloom — New Task modal
   Replaces `window.prompt()`, which is blocked inside Obsidian's iframe
   sandbox (1.6+). Opens a proper modal with a text field and an explicit
   "Add task" button; the confirmed name is handed back via onConfirm().
   Reuses the dashboard's pastel tokens by wrapping in `.bloom`.
   ========================================================================= */
import { App, Modal, Notice, Setting, TextComponent } from "obsidian";

export class NewTaskModal extends Modal {
  private input: TextComponent;
  private submitted = false;

  constructor(
    app: App,
    private onConfirm: (name: string) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const wrap = contentEl.createDiv({ cls: "bloom bloom-settings bloom-task-modal" });

    wrap.createEl("h3", { text: "New task", cls: "bs-title" });
    wrap.createEl("div", {
      text: "The task will be added to your Daily Tasks list.",
      cls: "bs-note",
    });

    const row = wrap.createDiv({ cls: "bs-row" });
    row.createSpan({ text: "Task name", cls: "bs-label" });
    this.input = new TextComponent(row)
      .setPlaceholder("e.g. Water the plants")
      .setValue("")
      .onChange(() => {
        // keep Enter-to-submit logic simple: nothing here
      });
    this.input.inputEl.addClass("bs-input");
    // focus + select-all so typing replaces the placeholder instantly
    this.input.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.submit();
      }
    });
    window.setTimeout(() => {
      this.input.inputEl.focus();
    }, 50);

    const foot = wrap.createDiv({ cls: "bs-row bs-foot" });
    const cancel = foot.createEl("button", { text: "Cancel", cls: "bs-btn" });
    cancel.addEventListener("click", () => this.close());
    const add = foot.createEl("button", { text: "+ Add task", cls: "bs-btn bs-primary" });
    add.addEventListener("click", () => this.submit());
  }

  private submit() {
    const name = this.input.getValue().trim();
    if (!name) {
      new Notice("Bloom: task name can't be empty");
      return;
    }
    this.submitted = true;
    this.onConfirm(name);
    this.close();
  }

  onClose() {
    if (!this.submitted) {
      // Escape / backdrop click — treat as cancel, do nothing.
    }
    this.contentEl.empty();
  }
}
