$ProgressPreference = 'SilentlyContinue'
$url = 'https://pub-c54673fc21b44c9580c5005e2ded1f7a.r2.dev/Campfire_0.1.0_x64_en-US.msi'
try {
  $h = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
  Write-Output ("HTTP {0} | {1} bytes | {2}" -f $h.StatusCode, $h.Headers['Content-Length'], $h.Headers['Content-Type'])
} catch {
  Write-Output ("ERROR: " + $_.Exception.Message)
}
