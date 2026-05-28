# Encoding & Special Character Handling Reference

Comprehensive catalog of encoding issues, accented/special character mangling cases,
and recommended actions across all Nebula Forge projects.

## Case Index

| # | Case | Severity | Platforms |
|---|------|----------|-----------|
| 1 | PowerShell here-strings corrupting French accents | High | Windows |
| 2 | Single vs double quotes in PowerShell strings | Medium | Windows |
| 3 | PostgreSQL `regexp_replace` on JSONB with Unicode | High | All |
| 4 | Placeholder system for French accents in SQL | Medium | All |
| 5 | UTF-8 BOM vs UTF-8 without BOM | Medium | Windows |
| 6 | Shell redirection encoding loss | High | Windows |
| 7 | CRLF / LF line ending issues in git | Low | Windows |
| 8 | JSONB `content::text` vs `content->>'text'` Unicode escapes | Medium | All |
| 9 | Python/Node script generation of UTF-8 SQL | Medium | All |
| 10 | SQL single-quote escaping in generated content | Medium | All |
| 11 | `git add` CRLF warnings for new files on Windows | Low | Windows |
| 12 | Docker exec stdin encoding for psql | High | Windows |

---

## Case 1: PowerShell Here-Strings Corrupting French Accents

**Problem**: PowerShell here-strings (`@"..."@`) containing French accented characters
(e.g.,  é, è, ê, ô, ç, œ) get mangled when piped to external commands or written to files.

**Root Cause**: PowerShell's default output encoding is not UTF-8. When piping to native
commands (e.g., `docker exec psql`), characters are encoded using the system code page
(e.g., Windows-1252) instead of UTF-8. Many French accented characters exist in Windows-1252
but some (œ, Œ) or characters from other alphabets do not.

**Symptoms**:
- `é` becomes `Ac` or `Ac!` in SQL output
- `è` becomes `A"` in SQL output
- `ô` becomes `Ab"` in SQL output
- Unicode characters are replaced with `?` in the output

**Recommended Actions**:

a) Set PowerShell's output encoding before piping to external commands:
```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
```
Run this at the top of any script that pipes text containing accented characters.

b) Write SQL to a UTF-8 file first, then pipe the file:
```powershell
Set-Content -Path temp.sql -Value $sqlContent -Encoding UTF8
Get-Content temp.sql | docker exec -i supabase_db_ascentlegacy-local psql -U postgres -d postgres
```
This bypasses the PowerShell-native encoding issue entirely.

c) Use PowerShell Core 7+ which has better UTF-8 defaults:
```powershell
# In pwsh.exe (PowerShell 7+), Out-File defaults to utf8NoBOM
```

d) Pass SQL via `-c` argument instead of stdin pipe (avoids encoding issues entirely):
```powershell
docker exec supabase_db_ascentlegacy-local psql -U postgres -d postgres -c "$sqlStatement"
```

**Related Scripts**: `scripts/fix-encoding.ps1`, `scripts/check-encoding.ps1`

---

## Case 2: Single vs Double Quotes in PowerShell Strings

**Problem**: Double-quoted strings in PowerShell interpolate variables and escape sequences
(e.g., `"$variable"`, `` "`n" ``). French accented characters in double quotes may get mangled
if the string also contains PowerShell escape sequences. Single-quoted strings are strictly literal.

**Recommended Actions**:

a) Use single quotes for literal strings containing accented characters:
```powershell
$text = 'Français: é, è, ê, ô, ç, œ, à, ù, î, û'
```

b) Use single-quote here-strings for multi-line blocks:
```powershell
$sql = @'
UPDATE wiki_pages
SET content = jsonb_set(content, '{text}', to_jsonb(replace(
  content->>'text',
  'Français: é, è',
  'Français: ê, ô'
)));
'@
```

c) Use `--%` (stop-parsing symbol) to disable PowerShell interpretation of arguments to
native commands when passing strings with special characters.

---

## Case 3: PostgreSQL `regexp_replace` on JSONB with Unicode

**Problem**: `regexp_replace(content::text, ...)` converts JSONB to its text representation,
which escapes Unicode characters. For example, `é` in a JSONB string may appear as
`\u00e9` in the text representation, causing the regex pattern (which uses the literal
character) to not match.

**Symptoms**:
- Regex-based UPDATE matches zero rows despite the text being visually present
- `WHERE content::text LIKE '%é%'` returns no results but `WHERE content->>'text' LIKE '%é%'` works

**Recommended Actions**:

a) **Preferred**: Use `jsonb_set()` with `replace()` for plain-text replacements in known JSONB keys:
```sql
UPDATE wiki_pages
SET content = jsonb_set(content, '{text}', to_jsonb(
  replace(
    content->>'text',
    'old text with é',
    'new text with è'
  )
))
WHERE content->>'text' LIKE '%old text with é%';
```

b) Use `regexp_replace` only when the replacement target genuinely needs regex features
(patterns, groups, backreferences) AND the text contains no Unicode characters that could
be escaped in JSONB serialization.

c) When using `regexp_replace`, cast the specific JSONB key text (not the whole JSONB):
```sql
-- BAD: regexp_replace(content::text, ...) -- escapes Unicode
-- GOOD: regexp_replace(content->>'text', ...) -- keeps actual characters
```

Note: `->>'text'` returns `text` type (not JSONB), which avoids JSON serialization of Unicode.

d) Always verify regex replacements with a SELECT before running UPDATE:
```sql
SELECT slug, content->>'text'
FROM wiki_pages
WHERE content->>'text' ~ 'your-regex-pattern';
```

---

## Case 4: Placeholder System for French Accents in SQL

**Problem**: Writing SQL with French accented characters that must survive multiple layers
of processing (PowerShell -> psql -> PostgreSQL -> JSONB) frequently mangles characters.
Manual repair is error-prone.

**Recommended Actions**:

a) Use a placeholder system in generated SQL for maximum portability:
```
{E}  ->  é  (e-acute)
{GR} ->  è  (e-grave)
{C}  ->  ê  (e-circumflex)
{A}  ->  à  (a-grave)
{U}  ->  ù  (u-grave)
{O}  ->  ô  (o-circumflex)
{I}  ->  î  (i-circumflex)
{Cc} ->  ç  (c-cedilla)
{OE} ->  œ  (oe-ligature)
{EU} ->  ë  (e-diaeresis)
{AA} ->  â  (a-circumflex)
{UI} ->  û  (u-circumflex)
```

b) Post-process SQL files to replace placeholders with actual UTF-8 characters:
```powershell
# In PowerShell
(Get-Content file.sql -Encoding UTF8) `
  -replace '{E}', [char]0x00E9 `
  -replace '{GR}', [char]0x00E8 `
  -replace '{C}', [char]0x00EA `
  -replace '{A}', [char]0x00E0 `
  -replace '{U}', [char]0x00F9 `
  -replace '{O}', [char]0x00F4 |
Set-Content -Path file.sql -Encoding UTF8
```

c) Better: generate the SQL from a Python or Node.js script that handles UTF-8 natively.
See `scripts/fix-encoding.ps1` for the recommended script approach.

---

## Case 5: UTF-8 BOM vs UTF-8 Without BOM

**Problem**: PowerShell `Out-File` defaults to UTF-16 LE in Windows PowerShell 5.1.
`Set-Content` defaults to the system code page (Windows-1252). Neither produces clean
UTF-8 without BOM. Git and Unix tools expect UTF-8 without BOM.

**Recommended Actions**:

a) In PowerShell 5.1, use `-Encoding UTF8` parameter:
```powershell
Set-Content -Path file.sql -Value $content -Encoding UTF8
```
(Note: this produces UTF-8 with BOM, which is usually fine for SQL files)

b) In PowerShell Core 7+, use `utf8NoBOM`:
```powershell
Set-Content -Path file.sql -Value $content -Encoding utf8NoBOM
```

c) Use .NET directly for precise control:
```powershell
[System.IO.File]::WriteAllText('file.sql', $content, [System.Text.Encoding]::UTF8)
```

d) Strip BOM from existing files:
```powershell
$content = [System.IO.File]::ReadAllText('file.sql', [System.Text.Encoding]::UTF8)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText('file.sql', $content, $utf8NoBom)
```

---

## Case 6: Shell Redirection Encoding Loss

**Problem**: `>` and `|` in PowerShell change the encoding of the output. When piping to
`docker exec psql`, the stdin encoding is the system's default code page (typically
Windows-1252), which may not have all French accented characters or characters from
other alphabets.

**Recommended Actions**:

a) Write to file, copy to container, execute from there:
```powershell
Set-Content -Path temp.sql -Value $sql -Encoding UTF8
docker cp temp.sql supabase_db_ascentlegacy-local:/tmp/temp.sql
docker exec supabase_db_ascentlegacy-local psql -U postgres -d postgres -f /tmp/temp.sql
```

b) Set console encoding before piping:
```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$sql | docker exec -i supabase_db_ascentlegacy-local psql -U postgres -d postgres
```

c) Encode the string to a byte stream in UTF-8 before piping:
```powershell
$bytes = [Text.Encoding]::UTF8.GetBytes($sql)
$stream = [System.IO.MemoryStream]::new($bytes)
$stream | docker exec -i supabase_db_ascentlegacy-local psql -U postgres -d postgres
$stream.Dispose()
```

---

## Case 7: CRLF / LF Line Ending Issues in Git

**Problem**: Git on Windows converts LF to CRLF by default (core.autocrlf=true).
This causes git warnings on staging new files, pre-commit hook failures in CI, and
diff noise. SQL files in particular should use LF for cross-platform consistency.

**Recommended Actions**:

a) Create `.gitattributes` at the repo root to force LF for specific file types:
```
scripts/db/*.sql text eol=lf
*.sh text eol=lf
*.mjs text eol=lf
*.md text eol=lf
*.ps1 text eol=crlf
```

b) Configure git to handle line endings reasonably:
```powershell
git config core.autocrlf input
```

c) Accept CRLF warnings as cosmetic on Windows (they do not affect functionality).

---

## Case 8: JSONB `content::text` vs `content->>'text'` Unicode Escapes

**Problem**: When casting JSONB to text (`content::text`), PostgreSQL represents the
entire JSON structure including quotes, braces, and Unicode escapes. For example,
a JSONB value `{"text": "Français"}` cast to text may appear as
`{"text": "Fran\u00e7ais"}` depending on the server encoding and `standard_conforming_strings`
setting. This makes pattern matching unreliable.

**Recommended Actions**:

a) Always use `->>` to extract text values from JSONB for comparison or matching:
```sql
-- BAD: content::text LIKE '%pattern%' -- may have Unicode escapes
-- GOOD: content->>'text' LIKE '%pattern%' -- returns decoded text
```

b) Use `jsonb_set()` for updates to avoid JSON serialization issues entirely:
```sql
jsonb_set(content, '{text}', to_jsonb(new_value))
```

c) `jsonb_set()` with `to_jsonb(replace(content->>'text', old, new))` is the safest
pattern for text replacements within JSONB text fields.

---

## Case 9: Python/Node Script Generation of UTF-8 SQL

**Problem**: Generating SQL files programmatically with French accented characters
requires explicit encoding control. Default encodings vary by platform and runtime.

**Recommended Actions**:

a) **Python** - always specify encoding:
```python
with open('output.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)
```
Use `print()` only when console is UTF-8 aware, otherwise write to file.

b) **Node.js** - use `fs.writeFileSync` with UTF-8 (default in Node 14+):
```javascript
import { writeFileSync } from 'node:fs';
writeFileSync('output.sql', sqlContent, 'utf-8');
```

c) In Node.js, use `TextEncoder` for explicit byte-level control:
```javascript
const encoder = new TextEncoder();
const bytes = encoder.encode(sqlContent);
```

d) **For generating SQL files with French accents from templates**:
The most reliable approach is a Node.js or Python script that writes UTF-8 encoded files
directly, bypassing the shell/console encoding layer entirely.

---

## Case 10: SQL Single-Quote Escaping in Generated Content

**Problem**: SQL strings containing single quotes must escape them as `''` (two single
quotes) in PostgreSQL. When generating SQL programmatically from text content that
contains apostrophes, care is needed to properly escape them. Missing or incorrect
escaping leads to SQL syntax errors or data corruption.

**Recommended Actions**:

a) Always escape single quotes in SQL string literals by doubling them:
```sql
-- BAD: INSERT INTO t VALUES('don't');
-- GOOD: INSERT INTO t VALUES('don''t');
```

b) Use PostgreSQL dollar-quoting for function bodies to avoid quote escaping entirely:
```sql
CREATE FUNCTION fix_content() RETURNS TEXT
LANGUAGE plpgsql AS $func$
BEGIN
  UPDATE wiki_pages SET content = jsonb_set(content, '{text}',
    to_jsonb(replace(content->>'text', 'old with ''quote''', 'new with ''quote''')));
  RETURN 'done';
END;
$func$;
```

c) Use `REGEXP_REPLACE` or `REPLACE` functions to handle text containing quotes at
the data level rather than SQL-string level when possible.

d) When generating SQL with string content, escape the content before embedding:
```javascript
function escapeSql(str) {
  return str.replace(/'/g, "''");
}
```

---

## Case 11: `git add` CRLF Warnings for New Files on Windows

**Problem**: `git add` emits warnings like "CRLF will be replaced by LF the next time
Git touches it" for newly created files on Windows. These are cosmetic but noisy.

**Recommended Actions**:

a) Create `.gitattributes` (see Case 7) to set per-file-type line ending policies.
b) Accept the warnings as cosmetic on Windows.
c) `core.autocrlf = input` prevents the auto-conversion that causes warnings.

---

## Case 12: Docker exec stdin encoding for psql

**Problem**: Running `docker exec -i supabase_db_ascentlegacy-local psql -U postgres` with
piped input (`echo $sql | docker exec -i ...` or `$sql | docker exec -i ...`) in
PowerShell loses accented characters because the pipe encoding is the system code page.

**Symptoms**:
- Accented characters replaced with gibberish (`Ac`, `A"`, etc.)
- SQL fails because the mangled text does not match expected values
- SELECT queries return 0 rows that should match

**Recommended Actions**:

a) **Preferred**: Write SQL to a temp file and use `-f` flag:
```powershell
$tmpFile = Join-Path $env:TEMP "migrate_$(Get-Random).sql"
Set-Content -Path $tmpFile -Value $sql -Encoding UTF8
docker cp $tmpFile supabase_db_ascentlegacy-local:/tmp/script.sql
docker exec supabase_db_ascentlegacy-local psql -U postgres -d postgres -f /tmp/script.sql
Remove-Item $tmpFile
docker exec supabase_db_ascentlegacy-local rm /tmp/script.sql
```

b) Use `-c` flag for short statements:
```powershell
docker exec supabase_db_ascentlegacy-local psql -U postgres -d postgres -c "SELECT 1"
```
(Note: `-c` still has potential encoding issues; keep the statement ASCII-safe)

c) When piping is unavoidable, set console encoding first:
```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Console]::InputEncoding = [Text.Encoding]::UTF8
```

d) Use a helper script to wrap this pattern consistently. See `scripts/fix-encoding.ps1`.

---

## Quick Reference Card

### PowerShell Encoding Commands

```powershell
# Set console to UTF-8 (do at top of any script dealing with accented text)
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Console]::InputEncoding = [Text.Encoding]::UTF8

# Write UTF-8 file (PowerShell 5.1 — with BOM)
Set-Content -Path file.sql -Value $content -Encoding UTF8

# Write UTF-8 file (PowerShell 7+ — no BOM)
Set-Content -Path file.sql -Value $content -Encoding utf8NoBOM

# Write UTF-8 via .NET (no BOM, any PowerShell version)
[System.IO.File]::WriteAllText('file.sql', $content, [System.Text.Encoding]::UTF8)

# Read UTF-8 file
Get-Content -Path file.sql -Encoding UTF8

# Read UTF-8 via .NET (preserves accented characters reliably)
$content = [System.IO.File]::ReadAllText('file.sql', [System.Text.Encoding]::UTF8)

# UTF-8 byte array from string
$bytes = [Text.Encoding]::UTF8.GetBytes($string)
```

### SQL Patterns for Accented Text

```sql
-- SAFE: jsonb_set + replace (preferred for plain text replacements)
jsonb_set(content, '{text}', to_jsonb(
  replace(content->>'text', 'old accented text', 'new accented text')
))

-- RISKY: regexp_replace on content::text (can mangle Unicode)
regexp_replace(content::text, 'pattern with accents', 'replacement', 'g')::jsonb

-- SAFE: Use ->>'text' (not content::text) for pattern matching
WHERE content->>'text' LIKE '%accented pattern%'

-- SAFE: Dollar-quoting for function bodies
CREATE FUNCTION ... LANGUAGE plpgsql AS $func$
BEGIN
  -- SQL with 'single quotes' and French accents: é, è, ê
END;
$func$;
```

### Git Line Ending Settings

```powershell
# Per-repo: input mode (convert CRLF to LF on commit, but not on checkout)
git config core.autocrlf input

# Per-repo: explicit per-file-type control via .gitattributes
# (see .gitattributes at repo root)
```

### Placeholder Replacement Map

```
{E}  → é  (e-acute)       {GR} → è  (e-grave)
{C}  → ê  (e-circumflex)  {A}  → à  (a-grave)
{U}  → ù  (u-grave)       {O}  → ô  (o-circumflex)
{I}  → î  (i-circumflex)  {Cc} → ç  (c-cedilla)
{OE} → œ  (oe-ligature)   {EU} → ë  (e-diaeresis)
{AA} → â  (a-circumflex)  {UI} → û  (u-circumflex)
```

---

## Version History

| Date | Author | Changes |
|---|---|---|
| 2026-05-28 | NF Agent | Initial reference — all 12 cases documented from Ascent Legacy Phase 2 encoding work |
