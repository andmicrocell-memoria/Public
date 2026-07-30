param(
  [string]$FromNumber = "5511999999996",
  [string]$CustomerName = "Cliente Lock",
  [string]$PhoneNumberId = "1256883267499769",
  [int]$DelayMs = 300
)

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$ts1 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$ts2 = ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 1).ToString()

$payloadA = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from = $FromNumber
                id = "lock-a-$([guid]::NewGuid().ToString('N').Substring(0,8))"
                timestamp = $ts1
                type = "text"
                text = @{ body = "Ola, quero orcamento" }
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

$payloadB = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from = $FromNumber
                id = "lock-b-$([guid]::NewGuid().ToString('N').Substring(0,8))"
                timestamp = $ts2
                type = "text"
                text = @{ body = "Ola, tudo bem?" }
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

$bodyA = $payloadA | ConvertTo-Json -Depth 8
$bodyB = $payloadB | ConvertTo-Json -Depth 8

Write-Output "Sending event A..."
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/whatsapp" -Method Post -ContentType "application/json" -Body $bodyA

Start-Sleep -Milliseconds $DelayMs

Write-Output "Sending event B after $DelayMs ms..."
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/whatsapp" -Method Post -ContentType "application/json" -Body $bodyB

Write-Output "Waiting for async processing..."
Start-Sleep -Seconds 6

Write-Output "Fetching webhook logs..."
$logs = Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/logs" -Method Get
$lockHit = @($logs | Where-Object { $_.message -match "Ignorando processamento concorrente" })

$result = [PSCustomObject]@{
  lockDetected = ($lockHit.Count -gt 0)
  lockMatches = $lockHit.Count
  latestLogs = @($logs | Select-Object -First 12)
}

$result | ConvertTo-Json -Depth 7
