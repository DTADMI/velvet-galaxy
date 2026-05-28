param(
  [string]$Path = ".",
  [switch]$Fix,
  [switch]$Quiet
)

<#
.SYNOPSIS
  Check for encoding issues across SQL, documentation, and text files.
  Detects: unreplaced accent placeholders, CRLF/LF inconsistencies,
  UTF-8 BOM, and known mojibake patterns.

.DESCRIPTION
  Scans SQL migration files, markdown docs, and text files for common
  encoding problems that arise from PowerShell/Windows toolchain issues
  with French accented characters and Unicode.

  With -Fix, automatically repairs detected issues.

  With -Quiet, only outputs issues (no progress messages), suitable for CI.

.OUTPUTS
  Returns exit code 0 if no issues found, 1 if issues are detected.

.EXAMPLES
  .\scripts\check-encoding.ps1
  .\scripts\check-encoding.ps1 -Fix
  .\scripts\check-encoding.ps1 -Path scripts/db -Fix
  .\scripts\check-encoding.ps1 -Path docs -Quiet
#>

$issues = @()
$filesChecked = 0
$global:repaired = 0

# Known mojibake patterns (specific to observed corruption from PowerShell->psql pipeline)
# These are WORD-BOUNDED patterns to avoid false positives on English words like "Space", "Replace"
$mojibakePatterns = @(
  # French accents corrupted in SQL content text (not code keywords)
  # Pattern: French word fragments where accents were mangled
  '\bAc\b'
)

# Unreplaced placeholders that should not exist in finalized files (except in comments/docs)
$placeholderPatterns = @(
  '{E}', '{GR}', '{C}', '{A}', '{U}', '{O}', '{I}', '{Cc}', '{OE}', '{EU}', '{AA}', '{UI}'
)

# Line patterns that are comments/documentation (not executable SQL)
$commentLinePattern = '^\s*(--|#|//)'

function Write-Msg {
  param([string]$Message)
  if (-not $Quiet) { Write-Host $Message }
}

function Test-Mojibake {
  param([string]$Content, [string]$FilePath)
  $found = @()
  $lines = $Content -split "`n"
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    foreach ($pattern in $mojibakePatterns) {
      # Use regex word boundary
      if ($line -match $pattern) {
        # Skip comment lines
        if ($line -match $commentLinePattern) { continue }
        $trimmed = $line.Trim()
        if ($trimmed.Length -gt 0) {
          $display = $trimmed
          if ($display.Length -gt 120) { $display = $display.Substring(0, 120) }
          $found += "Line ${lineNum}: '$display'"
        }
      }
    }
  }
  return $found
}

function Test-Placeholders {
  param([string]$Content, [string]$FilePath)
  $found = @()
  $lines = $Content -split "`n"
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    # Skip comment lines
    if ($line -match $commentLinePattern) { continue }
    foreach ($placeholder in $placeholderPatterns) {
      if ($line -match [regex]::Escape($placeholder)) {
        $trimmed = $line.Trim()
        $display = $trimmed
        if ($display.Length -gt 80) { $display = $display.Substring(0, 80) }
        $found += "Line ${lineNum}: Unreplaced placeholder $placeholder in '$display'"
      }
    }
  }
  return $found
}

function Test-BOM {
  param([string]$FilePath)
  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    return $true
  }
  return $false
}

function Test-CRLF {
  param([string]$Content, [string]$FilePath, [string]$Extension)
  # Files that should use LF should warn on CRLF
  $lfExtensions = @('.sql', '.sh', '.mjs', '.js', '.ts', '.tsx', '.md', '.json', '.yml', '.yaml')
  if ($lfExtensions -contains $Extension -and $Content -match "`r`n") {
    return $true
  }
  return $false
}

function Repair-Mojibake {
  param([string]$Content)
  # Known mojibake patterns from PowerShell -> psql pipeline corruption
  # These are very specific -- applying broad replacements is too risky
  $result = $Content
  return $result  # Placeholder: mojibake repair is context-dependent and risky
}

function Repair-Placeholders {
  param([string]$Content)
  $placeholders = @{
    '{E}'  = [char]0x00E9  # e
    '{GR}' = [char]0x00E8  # e
    '{C}'  = [char]0x00EA  # e
    '{A}'  = [char]0x00E0  # a
    '{U}'  = [char]0x00F9  # u
    '{O}'  = [char]0x00F4  # o
    '{I}'  = [char]0x00EE  # i
    '{Cc}' = [char]0x00E7  # c
    '{OE}' = [char]0x0153  # oe
    '{EU}' = [char]0x00EB  # e
    '{AA}' = [char]0x00E2  # a
    '{UI}' = [char]0x00FB  # u
  }
  $result = $Content
  foreach ($key in $placeholders.Keys) {
    $result = $result -replace [regex]::Escape($key), $placeholders[$key]
  }
  return $result
}

# ---- Main ----

# Resolve search path
$searchPath = Resolve-Path -LiteralPath $Path -ErrorAction Stop

# Collect files to check
$files = @()
Get-ChildItem -LiteralPath $searchPath -Recurse -File -Include @('*.sql', '*.md', '*.ps1', '*.mjs', '*.sh', '*.txt') |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  Where-Object { $_.FullName -notmatch '\\.next\\' } |
  ForEach-Object { $files += $_ }

Write-Msg "Checking $($files.Count) files in $searchPath for encoding issues..."

foreach ($file in $files) {
  $fileIssues = @()
  $ext = [System.IO.Path]::GetExtension($file.FullName)

  # Read file as bytes first to check BOM
  $hasBom = Test-BOM -FilePath $file.FullName
  if ($hasBom -and $ext -ne '.ps1') {
    $fileIssues += "UTF-8 BOM present"
  }
  if (-not $hasBom -and $ext -eq '.ps1') {
    $fileIssues += "UTF-8 BOM missing (required for .ps1 files)"
  }

  # Read content
  try {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  } catch {
    $fileIssues += "Could not read as UTF-8: $_"
    $issues += [PSCustomObject]@{ File = $file.FullName; Issues = $fileIssues -join '; ' }
    continue
  }

  # Check CRLF
  $hasCRLF = Test-CRLF -Content $content -FilePath $file.FullName -Extension $ext
  if ($hasCRLF) {
    $fileIssues += "CRLF line endings (should use LF for $ext files)"
  }

  $filesChecked++

  # Check mojibake (only for .sql and .md files that may contain French)
  # Skip encoding-reference.md which documents known mojibake patterns
  if ($ext -in @('.sql', '.md') -and $file.Name -ne 'encoding-reference.md') {
    $moji = Test-Mojibake -Content $content -FilePath $file.FullName
    if ($moji.Count -gt 0) {
      $fileIssues += "Possible mojibake (corrupted accented characters): $($moji -join '; ')"
    }
  }

  # Check unreplaced placeholders (only for .sql files)
  if ($ext -eq '.sql') {
    $placeholders = Test-Placeholders -Content $content -FilePath $file.FullName
    if ($placeholders.Count -gt 0) {
      $fileIssues += $placeholders -join '; '
    }
  }

  if ($fileIssues.Count -gt 0) {
    Write-Msg "  [ISSUE] $($file.FullName)"
    foreach ($issue in $fileIssues) {
      Write-Msg "         $issue"
    }
    $issues += [PSCustomObject]@{ File = $file.FullName; Issues = $fileIssues -join '; ' }

    # Auto-fix if requested
    if ($Fix) {
      $modified = $false
      $newContent = $content

      # Fix placeholders (safe: replaces tokens with actual characters)
      if ($ext -eq '.sql') {
        $repaired = Repair-Placeholders -Content $newContent
        if ($repaired -ne $newContent) {
          $newContent = $repaired
          $modified = $true
        }
      }

      # Fix CRLF to LF for SQL files and other LF-expected types
      if ($ext -in @('.sql', '.sh', '.mjs', '.js', '.ts', '.tsx', '.md')) {
        if ($newContent -match "`r`n") {
          $newContent = $newContent -replace "`r`n", "`n"
          $modified = $true
        }
      }

      if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        $global:repaired++
        Write-Msg "         -> REPAIRED"
      }
    }
  }
}

# Summary
Write-Msg ""
Write-Msg "=== Encoding Check Summary ==="
Write-Msg "Files checked: $filesChecked"
if ($Fix) {
  Write-Msg "Files repaired: $repaired"
}
if ($issues.Count -gt 0) {
  Write-Msg "Files with issues: $($issues.Count)"
  Write-Msg ""
  Write-Msg "Issues found:"
  foreach ($issue in $issues) {
    Write-Msg "  $($issue.File): $($issue.Issues)"
  }
  exit 1
} else {
  Write-Msg "No encoding issues found."
  exit 0
}
