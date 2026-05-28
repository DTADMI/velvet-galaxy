---
name: encoding-handling
description: Handle accented/special character encoding issues across Nebula Forge projects. Use when dealing with French accents (e, e, e, etc.), Unicode mangling, PowerShell encoding problems, PostgreSQL JSONB encoding, SQL placeholder generation, or line ending normalization.
---

# Encoding & Special Character Handling

Use this skill when accented characters are being mangled, encoding errors appear
in SQL or text files, or you need to safely process French/Unicode text through
the Windows PowerShell + PostgreSQL toolchain.

## When To Use

- French accented characters (e, e, e, o, c, etc.) appearing corrupted in SQL output or DB content
- PowerShell producing mangled text when piping to docker exec psql
- JSONB content updates failing due to Unicode escaping issues
- Generating SQL files that contain non-ASCII characters
- CRLF/LF line ending inconsistencies in SQL or script files
- UTF-8 BOM causing issues with tools expecting BOM-free files
- Any task involving i18n, French translations, or multi-lingual seed data

## Catalog Of Known Cases

All 12 documented encoding cases are in `docs/technical/encoding-reference.md`.
Refer to it for full details on each case's root cause and recommended actions.

| # | Case | Quick Fix |
|---|------|-----------|
| 1 | PowerShell here-strings corrupting French accents | Set `[Console]::OutputEncoding = [Text.Encoding]::UTF8` before piping |
| 2 | Single vs double quotes in PowerShell strings | Use single quotes for literal strings with accents |
| 3 | regexp_replace on JSONB with Unicode | Use `jsonb_set(content, '{text}', to_jsonb(replace(...)))` instead |
| 4 | Placeholder system for French accents | Use `scripts/fix-encoding.ps1 fix-placeholders` to resolve {E} {GR} etc. |
| 5 | UTF-8 BOM vs UTF-8 without BOM | Use `[System.IO.File]::WriteAllText(path, content, [Text.Encoding]::UTF8)` |
| 6 | Shell redirection encoding loss | Use `docker cp + docker exec -f` instead of piping |
| 7 | CRLF/LF line endings in git | Use `.gitattributes` with `text eol=lf` for SQL files |
| 8 | JSONB `content::text` vs `content->>'text'` | Always use `->>` for extraction and pattern matching |
| 9 | Python/Node script generation of UTF-8 SQL | Write files with explicit `encoding='utf-8'` |
| 10 | SQL single-quote escaping | Double single quotes or use dollar-quoting for function bodies |
| 11 | `git add` CRLF warnings | Cosmetic on Windows; `.gitattributes` reduces noise |
| 12 | Docker exec stdin encoding for psql | Copy file to container, then execute with `-f` flag |

## Key Rules

### For SQL With French Accents

1. Use `jsonb_set(content, '{text}', to_jsonb(replace(content->>'text', old, new)))` for plain-text replacements in JSONB columns. Never use `regexp_replace(content::text, ...)` when the pattern contains Unicode characters.

2. Always use `content->>'text'` (not `content::text`) for extracting text values from JSONB for pattern matching. The `::text` cast can escape Unicode characters.

3. Use PostgreSQL dollar-quoting (`$func$...$func$`) for function bodies containing single quotes and accented text.

4. Escape single quotes in SQL string literals as `''` (two single quotes).

### For PowerShell Piping To PostgreSQL

1. Never pipe SQL containing accented characters directly to `docker exec -i psql`. The pipe encoding corrupts characters.

2. Preferred approach: write SQL to a temp UTF-8 file, `docker cp` it to the container, then execute with `docker exec ... psql -f /path/script.sql`.

3. If piping is unavoidable, set `[Console]::OutputEncoding = [Text.Encoding]::UTF8` first.

### For File I/O

1. Use .NET methods for reliable UTF-8 without BOM:
   - Write: `[System.IO.File]::WriteAllText(path, content, [System.Text.Encoding]::UTF8)`
   - Read: `[System.IO.File]::ReadAllText(path, [System.Text.Encoding]::UTF8)`

2. Avoid `Out-File` default encoding (UTF-16 LE in PowerShell 5.1). Always specify `-Encoding UTF8`.

3. SQL, shell scripts, and TypeScript files must use LF line endings. Use `.gitattributes` to enforce this.

### For Placeholder-Based Generation

When generating SQL with accented characters through multiple toolchain layers:

1. Use placeholder tokens that are pure ASCII: `{E}` -> e, `{GR}` -> e, `{Cc}` -> c, `{OE}` -> oe, etc.
2. Finalize by running `scripts/fix-encoding.ps1 fix-placeholders` to replace tokens with actual UTF-8.
3. Verify the output with `scripts/check-encoding.ps1` to catch unreplaced placeholders or mojibake.

## References

- `docs/technical/encoding-reference.md` — Complete catalog of all 12 cases
- `scripts/fix-encoding.ps1` — Reusable fix utility (check, fix-placeholders, fix-mojibake, fix-lineendings, fix-bom, docker-pipe, all)
- `scripts/check-encoding.ps1` — CI detection script (exit 0 = clean, exit 1 = issues found)
- `.gitattributes` — Line ending policies per file type

## Workflow

1. Identify the encoding case using the catalog above or `docs/technical/encoding-reference.md`.
2. Run `scripts/check-encoding.ps1 -Path <target>` to assess the scope.
3. Run the appropriate fix action: `scripts/fix-encoding.ps1 <action> -Path <target>`.
4. Verify with `scripts/check-encoding.ps1 -Path <target>` again.
5. For DB content fixes, use the `jsonb_set + replace` SQL pattern documented above.

## Output

- Encoding check report: list of files with issues and their specific problems.
- Fix confirmation: which files were modified and what was repaired.
- Validation status: clean/not-clean with exit code.
