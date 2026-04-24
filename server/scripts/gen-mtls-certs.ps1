# gen-mtls-certs.ps1
# Run from project root: .\scripts\gen-mtls-certs.ps1
# Requires: openssl (available via Git for Windows or WSL)
# Output: certs\ directory (gitignored)

$certsDir = "certs"
New-Item -ItemType Directory -Force -Path $certsDir | Out-Null

Write-Host "[1/6] Generating Certificate Authority (CA)..." -ForegroundColor Cyan

# CA private key
openssl genrsa -out "$certsDir\ca.key" 4096

# CA self-signed cert (10 years)
openssl req -new -x509 -days 3650 -key "$certsDir\ca.key" `
  -out "$certsDir\ca.crt" `
  -subj "/C=TN/O=PFE2026/CN=PFE2026-CA"

Write-Host "[2/6] Generating RAG service server certificate..." -ForegroundColor Cyan

# RAG server key
openssl genrsa -out "$certsDir\rag-server.key" 2048

# RAG server CSR
openssl req -new -key "$certsDir\rag-server.key" `
  -out "$certsDir\rag-server.csr" `
  -subj "/C=TN/O=PFE2026/CN=rag-service"

# Sign RAG server cert with CA (2 years)
openssl x509 -req -days 730 `
  -in "$certsDir\rag-server.csr" `
  -CA "$certsDir\ca.crt" `
  -CAkey "$certsDir\ca.key" `
  -CAcreateserial `
  -out "$certsDir\rag-server.crt"

Write-Host "[3/6] Generating Node backend client certificate..." -ForegroundColor Cyan

# Node client key
openssl genrsa -out "$certsDir\node-client.key" 2048

# Node client CSR
openssl req -new -key "$certsDir\node-client.key" `
  -out "$certsDir\node-client.csr" `
  -subj "/C=TN/O=PFE2026/CN=node-backend"

# Sign Node client cert with CA
openssl x509 -req -days 730 `
  -in "$certsDir\node-client.csr" `
  -CA "$certsDir\ca.crt" `
  -CAkey "$certsDir\ca.key" `
  -CAcreateserial `
  -out "$certsDir\node-client.crt"

Write-Host "[4/6] Cleaning up CSR files..." -ForegroundColor Cyan
Remove-Item "$certsDir\*.csr" -Force

Write-Host "[5/6] Adding certs\ to .gitignore..." -ForegroundColor Cyan
$gitignorePath = ".gitignore"
$gitignoreContent = Get-Content $gitignorePath -Raw -ErrorAction SilentlyContinue
if ($gitignoreContent -notmatch "certs/") {
  Add-Content $gitignorePath "`n# mTLS certificates — never commit private keys`ncerts/"
}

Write-Host "[6/6] Setting .env vars..." -ForegroundColor Cyan
$envVars = @"

# mTLS — Node backend client certificate (paths relative to project root)
MTLS_CLIENT_CERT=./certs/node-client.crt
MTLS_CLIENT_KEY=./certs/node-client.key
MTLS_CA_CERT=./certs/ca.crt

# mTLS — RAG service (set these in rag/.env or docker-compose)
RAG_SSL_CERTFILE=./certs/rag-server.crt
RAG_SSL_KEYFILE=./certs/rag-server.key
RAG_SSL_CA=./certs/ca.crt
RAG_URL=https://localhost:8001
"@
Add-Content ".env" $envVars
Add-Content ".env.example" $envVars

Write-Host ""
Write-Host "Done. Certificates generated in .\certs\" -ForegroundColor Green
Write-Host "  ca.crt          — Certificate Authority (share with both services)"
Write-Host "  rag-server.crt  — RAG service TLS cert"
Write-Host "  rag-server.key  — RAG service private key"
Write-Host "  node-client.crt — Node backend client cert"
Write-Host "  node-client.key — Node backend client private key"
Write-Host ""
Write-Host "Next: restart RAG service and Node backend." -ForegroundColor Yellow
