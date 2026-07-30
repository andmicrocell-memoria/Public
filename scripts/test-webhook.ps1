param(
  [string]$FromNumber = "5511999999999",
  [string]$CustomerName = "Cliente Teste",
  [string]$MessageText = "Boa noite",
  [string]$MessageId = "",
  [string]$PhoneNumberId = "1256883267499769"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if ([string]::IsNullOrWhiteSpace($MessageId)) {
  $MessageId = "msg-test-" + [guid]::NewGuid().ToString('N').Substring(0, 8)
}

$unixTimestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()

$payloadObj = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from = $FromNumber
                id = $MessageId
                timestamp = $unixTimestamp
                type = "text"
                text = @{ body = $MessageText }
              }
            )
            contacts = @(
              @{
                profile = @{ name = $CustomerName }
              }
            )
            metadata = @{
              display_phone_number = "5511987654321"
              phone_number_id = $PhoneNumberId
            }
          }
        }
      )
    }
  )
}

$payload = $payloadObj | ConvertTo-Json -Depth 8

Write-Output "Sending webhook event #1..."
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/whatsapp" -Method Post -ContentType "application/json" -Body $payload

Start-Sleep -Milliseconds 600

Write-Output "Sending webhook event #2 (duplicate/retry simulation)..."
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/whatsapp" -Method Post -ContentType "application/json" -Body $payload

Write-Output "Waiting for async processing to finish..."
Start-Sleep -Seconds 5

Write-Output "Fetching webhook logs..."
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/logs" -Method Get | ConvertTo-Json -Depth 6
