import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
  {
    ignores: ["main.js", "prototype.js", "*.d.ts", "node_modules/"],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // prototype.ts is a plain-browser demo page (no Obsidian createEl helpers).
    files: ["src/prototype.ts"],
    rules: {
      "obsidianmd/prefer-create-el": "off",
    },
  }
);
