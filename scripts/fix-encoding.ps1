param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Action,
  [Parameter(Position = 1)]
  [string]$Path = ".",
  [string]$OutputPath,
  [switch]$DryRun
)

<#
.SYNOPSIS
  Reusable encoding fix utility for accented/special character issues
  across Nebula Forge projects.

.DESCRIPTION
  Handles multiple encoding scenarios documented in
  docs/technical/encoding-reference.md:

  Action 'check'      - Scan for encoding issues (alias: check-encoding.ps1)
  Action 'fix-placeholders' - Replace {E} {GR} etc. with actual accented chars
  Action 'fix-mojibake'     - Attempt to repair corrupted accented characters
  Action 'fix-lineendings'  - Normalize line endings (CRLF→LF for SQL/MD)
  Action 'fix-bom'          - Strip UTF-8 BOM from files
  Action 'docker-pipe'      - Write SQL and pipe safely to Docker psql
  Action 'all'              - Run all fixes

.EXAMPLES
  .\scripts\fix-encoding.ps1 check -Path scripts/db
  .\scripts\fix-encoding.ps1 fix-placeholders -Path temp.sql -OutputPath clean.sql
  .\scripts\fix-encoding.ps1 fix-mojibake -Path scripts/db -DryRun
  .\scripts\fix-encoding.ps1 fix-lineendings -Path scripts/db
  .\scripts\fix-encoding.ps1 fix-bom -Path scripts/db
  .\scripts\fix-encoding.ps1 docker-pipe -Path script.sql
#>

# ---- Configuration ----
$accentPlaceholders = @{
  '{E}'  = [char]0x00E9  # é
  '{GR}' = [char]0x00E8  # è
  '{C}'  = [char]0x00EA  # ê
  '{A}'  = [char]0x00E0  # à
  '{U}'  = [char]0x00F9  # ù
  '{O}'  = [char]0x00F4  # ô
  '{I}'  = [char]0x00EE  # î
  '{Cc}' = [char]0x00E7  # ç
  '{OE}' = [char]0x0153  # œ
  '{EU}' = [char]0x00EB  # ë
  '{AA}' = [char]0x00E2  # â
  '{UI}' = [char]0x00FB  # û
}

# ---- Helper Functions ----

function Write-Step {
  param([string]$Message)
  Write-Host ">>> $Message" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Message)
  Write-Host "    $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "    WARN: $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
  param([string]$Message)
  Write-Host "    ERROR: $Message" -ForegroundColor Red
}

function Read-FileUtf8 {
  param([string]$FilePath)
  return [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
}

function Write-FileUtf8 {
  param([string]$FilePath, [string]$Content)
  if ($DryRun) {
    Write-Success "[DRY-RUN] Would write to: $FilePath"
    return
  }
  # Use .NET to write UTF-8 without BOM (works in any PowerShell version)
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($FilePath, $Content, $utf8NoBom)
  Write-Success "Written: $FilePath"
}

function Get-TargetFiles {
  param(
    [string]$Path,
    [string[]]$Include = @('*.sql', '*.md')
  )
  $searchPath = Resolve-Path -LiteralPath $Path -ErrorAction Stop
  return Get-ChildItem -LiteralPath $searchPath -Recurse -File -Include $Include |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    Where-Object { $_.FullName -notmatch '\\.next\\' }
}

# ---- Action Implementations ----

function Action-Check {
  Write-Step "Checking files for encoding issues..."
  & "$PSScriptRoot\check-encoding.ps1" -Path $Path
}

function Action-FixPlaceholders {
  Write-Step "Replacing accent placeholders with actual characters..."
  Write-Step "Placeholder map: $($accentPlaceholders.Keys -join ', ')"

  $files = Get-TargetFiles -Path $Path
  $modifiedCount = 0

  foreach ($file in $files) {
    $content = Read-FileUtf8 -FilePath $file.FullName
    $original = $content
    $hadPlaceholder = $false

    foreach ($key in $accentPlaceholders.Keys) {
      $replacement = $accentPlaceholders[$key]
      if ($content -match [regex]::Escape($key)) {
        $content = $content -replace [regex]::Escape($key), $replacement
        $hadPlaceholder = $true
      }
    }

    if ($hadPlaceholder) {
      Write-Success "Replaced placeholders in: $($file.FullName)"
      $modifiedCount++
      if (-not $DryRun) {
        Write-FileUtf8 -FilePath $file.FullName -Content $content
      }
    }
  }

  Write-Success "Files modified: $modifiedCount"
}

function Action-FixMojibake {
  Write-Step "Attempting to repair mojibake (corrupted accented characters)..."

  $files = Get-TargetFiles -Path $Path
  $modifiedCount = 0

  # Known corruption patterns observed from PowerShell→psql pipeline
  $repairs = @(
    # French e-acute corruption patterns
    @{Pattern = 'Ac'; Replacement = [char]0x00E9}
    # Note: many mojibake patterns are context-dependent and cannot be
    # automatically fixed without false positives. This function handles
    # the most common patterns; manual review is still recommended.
  )

  foreach ($file in $files) {
    $content = Read-FileUtf8 -FilePath $file.FullName
    $original = $content
    $hadMatch = $false

    foreach ($repair in $repairs) {
      if ($content -match [regex]::Escape($repair.Pattern)) {
        $content = $content -replace [regex]::Escape($repair.Pattern), $repair.Replacement
        $hadMatch = $true
      }
    }

    if ($hadMatch) {
      $relPath = $file.FullName.Substring((Resolve-Path -LiteralPath $Path).Path.Length + 1)
      Write-Success "Repaired mojibake in: $relPath"
      $modifiedCount++
      if (-not $DryRun) {
        Write-FileUtf8 -FilePath $file.FullName -Content $content
      }
    }
  }

  if ($modifiedCount -eq 0) {
    Write-Success "No mojibake patterns detected (or all already clean)."
  } else {
    Write-Warn "Repaired $modifiedCount file(s). Manual review recommended - mojibake detection is heuristic."
  }
}

function Action-FixLineEndings {
  Write-Step "Normalizing line endings (CRLF -> LF for SQL, MD, and script files)..."

  $extensions = @('*.sql', '*.md', '*.sh', '*.mjs', '*.js', '*.ts', '*.tsx', '*.json', '*.yml', '*.yaml')
  $files = Get-TargetFiles -Path $Path -Include $extensions
  $modifiedCount = 0

  foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)

    if ($content -match "`r`n") {
      $newContent = $content -replace "`r`n", "`n"
      $modifiedCount++
      if ($DryRun) {
        Write-Success "[DRY-RUN] Would fix CRLF in: $($file.FullName)"
      } else {
        Write-FileUtf8 -FilePath $file.FullName -Content $newContent
        Write-Success "Fixed CRLF -> LF in: $($file.FullName)"
      }
    }
  }

  Write-Success "Files with normalized line endings: $modifiedCount"
}

function Action-FixBom {
  Write-Step "Stripping UTF-8 BOM from files..."

  $extensions = @('*.sql', '*.md', '*.ps1', '*.mjs', '*.sh', '*.js', '*.ts', '*.tsx', '*.json', '*.yml', '*.yaml')
  $files = Get-TargetFiles -Path $Path -Include $extensions
  $modifiedCount = 0

  foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
      $contentNoBom = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
      $modifiedCount++
      if ($DryRun) {
        Write-Success "[DRY-RUN] Would strip BOM from: $($file.FullName)"
      } else {
        Write-FileUtf8 -FilePath $file.FullName -Content $contentNoBom
        Write-Success "Stripped BOM from: $($file.FullName)"
      }
    }
  }

  Write-Success "Files with BOM stripped: $modifiedCount"
}

function Action-DockerPipe {
  Write-Step "Safely piping SQL to Docker psql..."

  $filePath = Resolve-Path -LiteralPath $Path -ErrorAction Stop
  if (-not (Test-Path -LiteralPath $filePath)) {
    Write-ErrorMsg "File not found: $Path"
    exit 1
  }

  $container = "supabase_db_ascentlegacy-local"
  $remotePath = "/tmp/script_$(Get-Random).sql"

  Write-Step "Container: $container"
  Write-Step "Local: $filePath"
  Write-Step "Remote: $remotePath"

  # Check if container is running
  $running = docker inspect --format '{{.State.Running}}' $container 2>$null
  if ($running -ne 'true') {
    Write-ErrorMsg "Container $container is not running. Start it first."
    Write-Step "  docker start $container"
    exit 1
  }

  # Copy file to container (avoids pipe encoding issues)
  Write-Step "Copying SQL file to container..."
  if ($DryRun) {
    Write-Success "[DRY-RUN] docker cp $($filePath.Path) ${container}:${remotePath}"
    Write-Success "[DRY-RUN] docker exec $container psql -U postgres -d postgres -f $remotePath"
  } else {
    try {
      docker cp $filePath.Path "${container}:${remotePath}"
      Write-Success "Copied to container."

      Write-Step "Executing SQL..."
      docker exec $container psql -U postgres -d postgres -f $remotePath
      $exitCode = $LASTEXITCODE

      # Cleanup
      docker exec $container rm $remotePath 2>$null

      if ($exitCode -eq 0) {
        Write-Success "SQL executed successfully."
      } else {
        Write-ErrorMsg "SQL execution failed with exit code $exitCode."
        exit $exitCode
      }
    } catch {
      Write-ErrorMsg "Docker operation failed: $_"
      exit 1
    }
  }
}

function Action-All {
  Write-Step "Running all encoding fixes..."
  Action-FixPlaceholders
  Action-FixMojibake
  Action-FixLineEndings
  Action-FixBom
  Write-Step "All fixes complete."
}

# ---- Dispatch ----

switch ($Action.ToLower()) {
  'check'           { Action-Check }
  'fix-placeholders' { Action-FixPlaceholders }
  'fix-mojibake'    { Action-FixMojibake }
  'fix-lineendings' { Action-FixLineEndings }
  'fix-bom'         { Action-FixBom }
  'docker-pipe'     { Action-DockerPipe }
  'all'             { Action-All }
  default {
    Write-ErrorMsg "Unknown action: $Action"
    Write-Host ""
    Write-Host "Valid actions:"
    Write-Host "  check             - Scan for encoding issues"
    Write-Host "  fix-placeholders  - Replace {E} {GR} etc. with actual accented chars"
    Write-Host "  fix-mojibake      - Repair corrupted accented characters (heuristic)"
    Write-Host "  fix-lineendings   - Normalize CRLF to LF for SQL/MD/script files"
    Write-Host "  fix-bom           - Strip UTF-8 BOM from files"
    Write-Host "  docker-pipe       - Write SQL and pipe safely to Docker psql"
    Write-Host "  all               - Run all fixes"
    exit 1
  }
}
