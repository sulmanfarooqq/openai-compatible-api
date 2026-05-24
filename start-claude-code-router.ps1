$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $name = $line.Substring(0, $idx).Trim()
    if (-not $name) { return }
    if (Test-Path "Env:$name") { return }

    $value = $line.Substring($idx + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Set-Item -Path "Env:$name" -Value $value
  }
}

Import-DotEnv -Path (Join-Path $PSScriptRoot ".env")
Import-DotEnv -Path (Join-Path $PSScriptRoot ".env.local")

if (-not $env:GEMINI_API_KEYS) {
  throw "Set GEMINI_API_KEYS in .env or .env.local before starting Claude Code."
}

ccr code @args
