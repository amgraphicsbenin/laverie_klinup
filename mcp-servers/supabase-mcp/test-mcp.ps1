$body = Get-Content -Path "d:\Works and Projects\Plateforme Laverie KLIN UP\KLIN UP WEB APP\mcp-servers\supabase-mcp\init.json" -Raw
try {
    $response = Invoke-WebRequest -Uri "https://mcp.supabase.com/mcp" -Method POST -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"} -Body $body -UseBasicParsing
    Write-Output $response.Content
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Output "Response Body: $responseBody"
    }
}