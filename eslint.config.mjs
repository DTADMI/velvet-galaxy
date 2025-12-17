/* eslint-env node */
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Next.js configuration (scoped to frontend package)
const nextConfig = {
    rootDir: path.join(__dirname, "frontend"),
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    experimental: {
        appDir: true,
    },
};

// Common TypeScript parser options
const tsParserOptions = {
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
        jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    projectService: true,
};

export default [
    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript + React rules for project files
    {
        files: [
            "**/*.{ts,tsx,js,jsx}",
            "app/**/*",
            "games/**/*",
            "libs/**/*",
            "components/**/*",
            "contexts/**/*",
            "lib/**/*",
            "**/*.{test,spec}.{ts,tsx,js,jsx}",
            "tests/**",
            "tests-e2e/**",
            "e2e/**",
            "vitest.setup.ts",
        ],
        languageOptions: {
            parser: tsparser,
            parserOptions: tsParserOptions,
            globals: {
                // Browser globals for app code and tests setup
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                vi: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            tseslint,
            react,
            "react-hooks": hooks,
            "jsx-a11y": a11y,
            "simple-import-sort": simpleImportSort,
        },
        settings: {react: {version: "detect"}},
        rules: {
            // Many globals (fetch, Request, etc.) are provided by the runtime (Next/Node 20, browsers).
            // Disable no-undef to avoid false positives across mixed server/client files.
            "no-undef": "off",
            // Let Prettier handle quote style; allow both
            quotes: "off",
            // Keep codebase strict but report as warnings while we clean up
            semi: ["warn", "always"],
            curly: ["warn", "all"],
            "no-empty": ["warn", {allowEmptyCatch: true}],
            // Defer unused checks to TS plugin and allow leading underscore
            "no-unused-vars": "off",
            // Temporarily disable TS unused-vars rule to avoid cross-config plugin resolution issues
            // when linting from nested workspaces on Windows. We can re-enable after the
            // workspace ESLint runner is stabilized.
            //"@typescript-eslint/no-unused-vars": "off",
            // Guardrails: prevent deep imports into games/* and libs/shared/src
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@games/*/src/**",
                                "../../games/*/src/**",
                                "../games/*/src/**",
                                "games/*/src/**",
                            ],
                            message:
                                "Do not deep-import from games/*/src in the frontend. Import from the package root, e.g. `@games/<name>`.",
                        },
                        {
                            group: [
                                "@games/shared/src/**",
                                "../../libs/shared/src/**",
                                "../libs/shared/src/**",
                                "libs/shared/src/**",
                            ],
                            message:
                                "Do not import directly from libs/shared/src. Use `@games/shared` public API instead.",
                        },
                    ],
                },
            ],
            // React 17+ / Next 12+ doesn't require React in scope
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off",
            "react/prop-types": "off", // Not needed with TypeScript

            // Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // A11y
            "jsx-a11y/alt-text": "warn",

            // TS
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],

            // Imports sorting
            "simple-import-sort/imports": "warn",
            "simple-import-sort/exports": "warn",
        },
    },

    // Ignore specific directories
    {
        ignores: [
            "**/node_modules/**",
            "**/.next/**",
            "**/out/**",
            "**/build/**",
            "**/dist/**",
            "**/coverage/**",
            "**/.idea/**",
            "**/.vscode/**",
            "**/*.sublime-*",
            "**/public/**",
            "**/target/**",
            "**/cypress/**",
            "**/tests-e2e/**",
            "**/__tests__/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/*.config.*",
            "**/tailwind.config.js",
            "**/vitest.config.ts",
            "**/playwright.config.ts",
            "**/backend/doc/**", // Exclude backend docs from ESLint
            "**/backend/target/**",
            "**/doc/**",
            "types/**/*.d.ts",
            "**/generated/**",
            ".eslintcache",
            ".env*",
            "**/.eslintrc.*",
            "**/eslint.config.*",
            "**/postcss.config.*",
            "**/next-env.d.ts",
        ],
    },

    // Node/config files – if they were not ignored by the top-level ignores,
    // ensure Node globals are defined to avoid no-undef on __dirname, require, etc.
    {
        files: [
            "**/*.{config,configs}.?(c|m)js",
            "**/*.{config,configs}.ts",
            "**/*.config.?(c|m)js",
            "**/next.config.ts",
            "**/postcss.config.mjs",
            "**/tailwind.config.ts",
            "**/playwright.config.ts",
        ],
        languageOptions: {
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                process: "readonly",
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
            },
        },
        rules: {
            // React rules
            "react/react-in-jsx-scope": "off", // Not needed with Next.js
            "react/prop-types": "off", // Not needed with TypeScript

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // Custom rules
            semi: ["warn", "always"],
            curly: ["warn", "all"],
            "no-empty": ["warn", {allowEmptyCatch: true}],
            // Allow both single and double quotes globally
            quotes: "off",
            // TypeScript already checks undefined symbols
            "no-undef": "off",
        },
    },
];
