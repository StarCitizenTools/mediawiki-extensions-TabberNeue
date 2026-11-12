# AGENTS.md

## Overview

TabberNeue is a MediaWiki extension (requires MW 1.43+) that provides `<tabber>` and `<tabbertransclude>` parser tags for creating tabbed content. It uses PHP for parsing and rendering, Mustache templates, LESS for styles, and vanilla JS for client-side tab switching via MediaWiki's ResourceLoader. Optional Scribunto (Lua) integration is available.

## Verification

Run only what's relevant to the files you changed.

| Files changed | Command |
| --- | --- |
| `*.php` | `composer preflight` (lint, style, and Phan) |
| `*.js` | `npm run lint:js && npm test` |
| `*.less`, `*.css` | `npm run lint:styles` |
| `i18n/` | `npm run lint:i18n` |

Auto-fix commands: `composer fix` (PHP), `npm run lint:fix:js` (JS), `npm run lint:fix:styles` (styles).

**Preflight**: Run `npm run preflight` to execute all Node-based lints and JS tests in one command. Run `composer preflight` in the [dev environment](#dev-environment) to execute all PHP lints, style checks, and Phan static analysis.

**Always run the relevant checks before committing.** Read the full output — PHPCS warnings must be fixed, not just errors. The command exits 0 even with warnings, so do not treat exit code alone as a pass.

### Dev environment

PHP checks, PHPUnit and browser tests need a running MediaWiki that serves this checkout. Use the first that applies:

1. An environment the user has named.
2. A disposable one you start yourself with [mwenv](https://github.com/ProfessionalWiki/mwenv), which needs no MediaWiki installation.
3. A MediaWiki installation that contains this checkout, such as MediaWiki-Docker, when the task needs its content or extensions.

Ask the user only if none of these can run, or the task needs something a fresh wiki lacks. Don't destroy an environment you didn't create: its database may hold the user's test content.

Whichever you use, it needs what CI's PHP jobs get (`.github/workflows/ci.yml`): load each extension in `extra-extensions`, and require each package in `extra-composer-packages` into MediaWiki with Composer, without loading it.

On arm64 hosts, Scribunto needs the LuaSandbox PHP extension, because the standalone Lua binary it ships is x86-64 only.

### Phan

`.phan/config.php` adds Scribunto to type resolution when it is in MediaWiki's `extensions/` directory.

### Browser testing

When your test plan includes steps that require a browser (e.g., verifying scripts load, checking runtime behavior, confirming interactions work):

- Use available browser automation tools (e.g., Chrome DevTools MCP, Playwright MCP) to test against the dev environment URL before asking the user to test manually
- Always check the browser console for warnings and errors, not just visual correctness
- **XSS testing for i18n**: When changes touch interface messages or how they are rendered, append `?uselang=x-xss` to the URL. This replaces all i18n messages with XSS payloads — if any script executes or markup is injected, the message output is not properly escaped. See [Manual:$wgUseXssLanguage](https://www.mediawiki.org/wiki/Manual:$wgUseXssLanguage)

## Coding conventions

### PHP

- All files start with `declare( strict_types=1 );`
- Use native PHP types (properties, parameters, return values); use PHPDoc only for collection types like `string[]`
- Always use MediaWiki-namespaced imports (`use MediaWiki\Title\Title;`), never legacy shims (`use Title;`)

### JavaScript

- CommonJS modules: `require()` for imports, `module.exports` for exports

### LESS/CSS

- Styles live in `modules/`

### extension.json

`extension.json` is the source of truth for how the extension is wired — ResourceLoader modules, hooks, config variables, and dependencies are all declared here.

- When adding or removing files under `modules/`, update the corresponding `packageFiles` or `styles` list in `extension.json`
- Config variables are declared under `config` in `extension.json` (prefixed `wgTabberNeue`)

### Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `fix:`, `feat:`, `refactor:`)
- Use `ci:` or `chore:` for non-user-facing changes (tooling, config, dependencies)

### i18n

- Any user-facing string needs a message key in `i18n/en.json`
- Every key in `en.json` must also have a documentation entry in `i18n/qqq.json`
