# Minimal local static server for previewing index.html
$root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8765/')
$listener.Start()
Write-Host "Serving $root on http://localhost:8765/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $rel = $ctx.Request.Url.AbsolutePath.TrimStart('/')
  if ($rel -eq '') { $rel = 'index.html' }
  $path = Join-Path $root $rel
  if ((Test-Path $path -PathType Leaf) -and ((Resolve-Path $path).Path.StartsWith($root))) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $types = @{
      '.html' = 'text/html; charset=utf-8'
      '.js' = 'text/javascript; charset=utf-8'
      '.webmanifest' = 'application/manifest+json'
      '.svg' = 'image/svg+xml'
      '.png' = 'image/png'
    }
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    if ($types.ContainsKey($ext)) { $ctx.Response.ContentType = $types[$ext] }
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
