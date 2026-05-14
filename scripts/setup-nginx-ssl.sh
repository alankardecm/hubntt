#!/bin/bash
# Configura nginx com SSL autoassinado para o HUB Netturbo
# Rodar como root no SRV-CT-TurboWS

set -e

echo "==> Instalando nginx..."
apt-get update -qq && apt-get install -y nginx

echo "==> Criando diretório SSL..."
mkdir -p /etc/nginx/ssl

echo "==> Gerando certificado autoassinado (10 anos)..."
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/hub.key \
  -out /etc/nginx/ssl/hub.crt \
  -subj "/C=BR/ST=SP/L=Campinas/O=Netturbo/CN=10.250.110.238"

chmod 600 /etc/nginx/ssl/hub.key

echo "==> Criando configuração nginx..."
cat > /etc/nginx/sites-available/hub-netturbo << 'EOF'
server {
    listen 80;
    server_name 10.250.110.238;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name 10.250.110.238;

    ssl_certificate /etc/nginx/ssl/hub.crt;
    ssl_certificate_key /etc/nginx/ssl/hub.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Aumenta limite para upload de áudio (NetMeet)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
EOF

echo "==> Ativando site..."
ln -sf /etc/nginx/sites-available/hub-netturbo /etc/nginx/sites-enabled/hub-netturbo
rm -f /etc/nginx/sites-enabled/default

echo "==> Testando configuração..."
nginx -t

echo "==> Iniciando/recarregando nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "==> Nginx configurado! HUB acessível em: https://10.250.110.238"
echo "==> IMPORTANTE: adicione as variáveis de auth no .env do servidor (ver instruções)"
