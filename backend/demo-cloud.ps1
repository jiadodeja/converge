<#
Converge demo script for the DEPLOYED app (Render backend, Vercel dashboard).
It sends a messy message to the backend and prints the answer.
The same call also shows up on https://converge-zeta.vercel.app when it is in Live mode.

Examples (run from the backend folder):
  .\demo-cloud.ps1                           shows a menu
  .\demo-cloud.ps1 -Domain payroll           sample Payroll message
  .\demo-cloud.ps1 -Domain all               one message, every business (the router picks them)
  .\demo-cloud.ps1 -Domain hr -Message "Can I work from Spain for a month?"
#>

param(
    [string]$Domain = "",
    [string]$Message = "",
    [string]$EmployeeId = "EMP-90421",
    [string]$EmployeeName = "Alex Chen",
    [string]$ApiUrl = "https://converge-w5ge.onrender.com"
)

$Samples = @{
    hr         = "Hey Sarah, expecting our second kid in August! Do I get 12 weeks of leave, and do I have to exhaust my PTO first?"
    payroll    = "My last paycheck was about `$412 short. I worked 14 hours of overtime over the last two weeks and none of it showed up. Can someone fix this?"
    insurance  = "I got married last Saturday. Can I add my wife to my health insurance now, or do I have to wait until open enrollment in November?"
    retirement = "I want to buy a house and need cash for the down payment. Can I take a loan from my 401(k), and how much could I borrow?"
    all        = "Expecting our second kid in mid-August. What happens to my pay, my health plan and my 401(k) while I'm on leave?"
}

$Managers = @{
    hr         = "sarah-connor"
    payroll    = "priya-nair"
    insurance  = "daniel-okafor"
    retirement = "hannah-weiss"
    all        = "sarah-connor"
}

function Show-Title($text, $color) {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor $color
    Write-Host $text -ForegroundColor $color
    Write-Host ("=" * 70) -ForegroundColor $color
}

function Show-Plan($plan, $label) {
    Show-Title $label "Cyan"
    if ($plan.headline) { Write-Host $plan.headline -ForegroundColor White }
    Write-Host ""
    Write-Host ("Status:   " + $plan.eligibility_status + "  (" + $plan.eligibility_headline + ")") -ForegroundColor Green
    Write-Host ("Category: " + $plan.category + "   Urgency: " + $plan.urgency)
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host $plan.eligibility_summary
    if ($plan.highlights -and $plan.highlights.Count -gt 0) {
        Write-Host ""
        Write-Host "Key facts:" -ForegroundColor Yellow
        foreach ($h in $plan.highlights) { Write-Host ("  - " + $h.label + ": " + $h.value) }
    }
    if ($plan.checklist -and $plan.checklist.Count -gt 0) {
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        $i = 1
        foreach ($step in $plan.checklist) { Write-Host ("  " + $i + ". " + $step); $i++ }
    }
    if ($plan.statutory_citation) {
        Write-Host ""
        Write-Host ("Source: " + $plan.statutory_citation) -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host ("ADP endpoint: " + $plan.adp_api_endpoint) -ForegroundColor Magenta
}

function Send-Json($path, $body) {
    # Send the body as UTF-8 bytes so emoji and special characters survive
    $json = $body | ConvertTo-Json -Depth 5
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Uri ($ApiUrl + $path) -Method Post `
        -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 180
}

# The free Render service sleeps when idle. Wake it up first (can take up to a minute).
Write-Host "Waking up the backend (the first call can take up to a minute)..." -ForegroundColor DarkGray
try {
    Invoke-RestMethod -Uri ($ApiUrl + "/api/slack/feed") -Method Get -TimeoutSec 120 | Out-Null
    Write-Host "Backend is awake." -ForegroundColor Green
}
catch {
    Write-Host "Could not reach $ApiUrl yet. Trying anyway..." -ForegroundColor Yellow
}

# Menu when no business is chosen
if ($Domain -eq "") {
    Write-Host ""
    Write-Host "Converge demo. Pick a business:" -ForegroundColor Cyan
    Write-Host "  1  HR"
    Write-Host "  2  Payroll"
    Write-Host "  3  Insurance"
    Write-Host "  4  Retirement"
    Write-Host "  5  All businesses (one message, the router picks)"
    $choice = Read-Host "Number"
    $map = @{ "1" = "hr"; "2" = "payroll"; "3" = "insurance"; "4" = "retirement"; "5" = "all" }
    if (-not $map.ContainsKey($choice)) { Write-Host "Not a valid choice."; exit 1 }
    $Domain = $map[$choice]
}

$Domain = $Domain.ToLower()
if (-not $Samples.ContainsKey($Domain)) {
    Write-Host "Unknown business '$Domain'. Use: hr, payroll, insurance, retirement or all." -ForegroundColor Red
    exit 1
}

if ($Message -eq "") { $Message = $Samples[$Domain] }

Show-Title "Employee message" "White"
Write-Host $Message
Write-Host ""
Write-Host "Sending to Converge..." -ForegroundColor DarkGray

$body = @{
    employee_id   = $EmployeeId
    employee_name = $EmployeeName
    manager_id    = $Managers[$Domain]
    message       = $Message
}

try {
    if ($Domain -eq "all") {
        $res = Send-Json "/api/insights/analyze-all" $body
        Write-Host ""
        Write-Host ("Router picked: " + ($res.routing.domains -join ", ") + "  (" + $res.routing.method + ")") -ForegroundColor Green
        Write-Host ("Reason: " + $res.routing.reason) -ForegroundColor DarkGray
        foreach ($r in $res.results) {
            Show-Plan $r.insight ($r.domain.ToUpper())
        }
        if ($res.errors -and ($res.errors.PSObject.Properties.Count -gt 0)) {
            Write-Host ""
            Write-Host "Some businesses failed:" -ForegroundColor Red
            $res.errors.PSObject.Properties | ForEach-Object { Write-Host ("  " + $_.Name + ": " + $_.Value) }
        }
    }
    else {
        $body["domain"] = $Domain
        $plan = Send-Json "/api/insights/generate" $body
        Show-Plan $plan ($Domain.ToUpper())
    }
    Write-Host ""
    Write-Host "Done. Open https://converge-zeta.vercel.app in Live mode to see it there too." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "The call failed." -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message } else { Write-Host $_.Exception.Message }
    Write-Host "Is the Render service Live on $ApiUrl ? Did the build run python ingest.py?" -ForegroundColor Yellow
    exit 1
}
