---
sidebar_position: 6
title: Deployment
description: Guide för att driftsätta Kunskapsportal i produktion
---

# Deployment

Guide för att driftsätta Kunskapsportal i produktion.

## Teknisk bakgrund

Kunskapsportal är en multi-container applikation som består av:

**Kärnteknologier som behöver driftsättas:**
- **[Next.js 15](https://nextjs.org/)** (Node.js 20+) - Huvudapplikationen med Payload CMS
- **[PostgreSQL 15](https://www.postgresql.org/)** - Primär databas för allt innehåll
- **[Qdrant](https://qdrant.tech/)** - Vektordatabas för RAG (semantisk sökning)
- **[LibreOffice](https://www.libreoffice.org/)** - Headless konvertering av Office-dokument

**Externa API-tjänster (krävs):**
- **[Google Gemini API](https://ai.google.dev/)** - AI för OCR, chatt, metadatagenerering
- **[OpenAI API](https://platform.openai.com/)** - Text embeddings för vektorsökning
- **[Mistral API](https://mistral.ai/)** (valfritt) - Alternativ OCR-motor

**Deployment-metoder:**
- Docker Compose (rekommenderas för kommuner)
- Kubernetes (för större skalning)
- Cloud platforms (Vercel, Railway, DigitalOcean)

## Innehållsförteckning

- [Översikt](#översikt)
- [Docker Deployment](#docker-deployment)
- [Cloud Providers](#cloud-providers)
- [Säkerhet](#säkerhet)
- [Backup & Recovery](#backup--recovery)
- [Monitoring](#monitoring)
- [Skalning](#skalning)

---

## Översikt

Kunskapsportal kan driftsättas på flera sätt:

| Metod | Svårighetsgrad | Kostnad | Skalbarhet |
|-------|---------------|---------|------------|
| **Docker Compose** | Lätt | Låg | Begränsad |
| **Kubernetes** | Medel | Medel | Hög |
| **Cloud (Vercel/Railway)** | Lätt | Medel | Hög |
| **VPS (DigitalOcean)** | Medel | Låg | Medel |

**Rekommendation för kommuner:** Docker Compose på dedikerad server

---

## Docker Deployment

### Produktion med Docker Compose

#### Förutsättningar

- Linux-server (Ubuntu 22.04 LTS rekommenderas)
- Docker & Docker Compose installerat
- Domännamn (t.ex. kunskapsportal.kommun.se)
- SSL-certifikat (Let's Encrypt)

#### Steg 1: Förbered server

```bash
# Uppdatera systemet
sudo apt update && sudo apt upgrade -y

# Installera Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installera Docker Compose
sudo apt install docker-compose-plugin

# Skapa användare
sudo useradd -m -s /bin/bash kunskapsportal
sudo usermod -aG docker kunskapsportal

# Byt till användaren
sudo su - kunskapsportal
```

#### Steg 2: Klona och konfigurera

```bash
# Klona repositoryt
git clone https://github.com/Falkenbergs-kommun/kunskapsportal.git
cd kunskapsportal

# Kopiera och konfigurera miljövariabler
cp .env.example .env
nano .env
```

**Produktions-.env:**

```bash
# Databas (GENERERA STARKA LÖSENORD!)
DATABASE_URI=postgres://knowledge_user:MYCKET_STARKT_LÖSENORD@postgres:5432/knowledge_base
DB_PASSWORD=MYCKET_STARKT_LÖSENORD
DB_PUSH=true

# Payload CMS (GENERERA HEMLIG NYCKEL!)
PAYLOAD_SECRET=$(openssl rand -base64 32)
PAYLOAD_URL=https://kunskapsportal.din-kommun.se

# Docker Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=
QDRANT_ENABLED=true

# AI-tjänster
GEMINI_API_KEY=din-produktions-nyckel
OPENAI_API_KEY=sk-din-produktions-nyckel
MISTRAL_API_KEY=din-produktions-nyckel
PDF_EXTRACTOR=mistral

# Produktionsinställningar
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=4096"
```

#### Steg 3: Konfigurera reverse proxy (Nginx)

**Installera Nginx:**

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

**Skapa Nginx-konfiguration:**

```bash
sudo nano /etc/nginx/sites-available/kunskapsportal
```

```nginx
server {
    server_name kunskapsportal.din-kommun.se;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size (anpassa efter behov)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts för AI-processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Static files cache
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Media files
    location /media {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

**Aktivera konfiguration:**

```bash
sudo ln -s /etc/nginx/sites-available/kunskapsportal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Skaffa SSL-certifikat:**

```bash
sudo certbot --nginx -d kunskapsportal.din-kommun.se
```

#### Steg 4: Starta tjänsterna

```bash
# Bygg Docker-imagen
docker-compose build

# Starta alla tjänster
docker-compose up -d

# Följ loggarna
docker-compose logs -f app
```

#### Steg 5: Verifiera deployment

```bash
# Kontrollera container-status
docker-compose ps

# Testa hälsokontroll
curl https://kunskapsportal.din-kommun.se/api/health

# Kolla loggarna
docker-compose logs --tail=100 app
```

### Autostart med systemd

**Skapa systemd-service:**

```bash
sudo nano /etc/systemd/system/kunskapsportal.service
```

```ini
[Unit]
Description=Kunskapsportal
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/kunskapsportal/kunskapsportal
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=kunskapsportal
Group=kunskapsportal

[Install]
WantedBy=multi-user.target
```

**Aktivera autostart:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable kunskapsportal
sudo systemctl start kunskapsportal
```

---

## Cloud Providers

### Railway

[Railway](https://railway.app/) erbjuder enkel deployment med managed PostgreSQL.

**Steg:**

1. Skapa konto på Railway.app
2. New Project → Deploy from GitHub
3. Välj kunskapsportal-repositoryt
4. Add PostgreSQL database
5. Konfigurera miljövariabler
6. Deploy!

**Miljövariabler att sätta:**
- `DATABASE_URI` (från Railway PostgreSQL)
- `PAYLOAD_SECRET`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `QDRANT_URL` (Qdrant Cloud)

**Kostnad:** ~$20/månad för Hobby plan

### Vercel (Frontend + API Routes)

Vercel kan hosta Next.js-appen, men kräver extern databas.

**Observera:** Payload admin fungerar inte fullt ut på Vercel pga. Serverless-begränsningar.

**Användningsfall:** Frontend + API endast

**Deployment:**

```bash
npm install -g vercel
vercel
```

### DigitalOcean Droplet

**1. Skapa Droplet:**
- Ubuntu 22.04 LTS
- Minst 4GB RAM
- 2 vCPUs

**2. Konfigurera enligt Docker-instruktionerna ovan**

**3. Konfigurera brandvägg:**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Kostnad:** ~$24/månad för Basic Droplet

### Qdrant Cloud

Istället för att köra Qdrant lokalt, använd [Qdrant Cloud](https://cloud.qdrant.io/).

**Fördelar:**
- Managed service
- Automatiska backups
- Bättre prestanda
- Enkel skalning

**Steg:**

1. Skapa konto på cloud.qdrant.io
2. Skapa cluster
3. Notera URL och API-nyckel
4. Uppdatera `.env`:

```bash
QDRANT_URL=https://xyz-abc123.eu-central.aws.cloud.qdrant.io
QDRANT_API_KEY=din-api-nyckel
```

**Kostnad:** Gratis tier finns, sedan från $25/månad

---

## Säkerhet

### Miljövariabler

**ALDRIG committa känslig data:**

```bash
# Lägg till i .gitignore
.env
.env.local
.env.production
```

**Använd starka lösenord:**

```bash
# Generera säkra nycklar
openssl rand -base64 32

# Eller
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2ban

Skydda mot brute-force:

```bash
sudo apt install fail2ban

# Konfigurera
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### SSL/TLS

**Alltid använd HTTPS i produktion:**

```bash
# Let's Encrypt (gratis)
sudo certbot --nginx -d kunskapsportal.din-kommun.se

# Auto-renewal
sudo certbot renew --dry-run
```

### Security Headers

Lägg till i Nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;" always;
```

### Databas-säkerhet

```bash
# PostgreSQL konfiguration
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Tillåt endast lokala anslutningar
local   all   all   peer
host    all   all   127.0.0.1/32   scram-sha-256
```

---

## Backup & Recovery

### Automatisk PostgreSQL-backup

**Skapa backup-script:**

```bash
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/kunskapsportal/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kunskapsportal_$DATE.sql.gz"

# Skapa backup
docker-compose exec -T postgres pg_dump -U knowledge_user knowledge_base | gzip > $BACKUP_FILE

# Behåll endast 30 dagar
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup skapad: $BACKUP_FILE"
```

```bash
chmod +x ~/backup-db.sh
```

**Schemalägg med cron:**

```bash
crontab -e
```

```cron
# Backup kl 02:00 varje natt
0 2 * * * /home/kunskapsportal/backup-db.sh >> /home/kunskapsportal/backup.log 2>&1
```

### Återställ från backup

```bash
# Stoppa applikationen
docker-compose down

# Återställ databas
gunzip < kunskapsportal_20250107_020000.sql.gz | \
  docker-compose exec -T postgres psql -U knowledge_user knowledge_base

# Starta applikationen
docker-compose up -d
```

### Qdrant-backup

**Lokal Qdrant:**

```bash
# Backup
docker cp qdrant:/qdrant/storage ./qdrant_backup

# Restore
docker cp ./qdrant_backup qdrant:/qdrant/storage
```

**Qdrant Cloud:**

Backups sköts automatiskt av Qdrant Cloud.

### Offsite backup

**Ladda upp till S3/Backblaze:**

```bash
# Installera AWS CLI eller rclone
sudo apt install rclone

# Konfigurera
rclone config

# Synka backups
rclone sync ~/backups remote:kunskapsportal-backups
```

---

## Monitoring

### Uptime monitoring

**Uptime Robot (Gratis):**

1. Gå till [uptimerobot.com](https://uptimerobot.com/)
2. Skapa monitor för `https://kunskapsportal.din-kommun.se/api/health`
3. Konfigurera alerter (email/SMS)

### Loggning

**Loggar från Docker:**

```bash
# Realtidslogg
docker-compose logs -f app

# Senaste 100 rader
docker-compose logs --tail=100 app

# Exportera loggar
docker-compose logs app > logs_$(date +%Y%m%d).txt
```

**Centraliserad loggning med Loki (valfritt):**

```bash
docker run -d --name=loki -p 3100:3100 grafana/loki
```

### Metriker med Prometheus (Avancerat)

**docker-compose.monitoring.yml:**

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Skalning

### Vertikal skalning (Enklast)

**Öka resurser för Docker-containrar:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Horisontell skalning (Avancerat)

**Kräver:**
- Load balancer (Nginx/HAProxy)
- Delad fillagring (S3/NFS)
- Redis för sessions

**Exempel med Docker Compose:**

```yaml
services:
  app:
    image: kunskapsportal:latest
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Database scaling

**PostgreSQL replication:**

- Primary/Replica setup
- Read replicas för frågor
- Automatisk failover

**Managed databases:**

- AWS RDS
- DigitalOcean Managed PostgreSQL
- Supabase

---

## Uppdateringar

### Manuell uppdatering

```bash
# Hämta senaste kod
git pull origin main

# Bygg om Docker-imagen
docker-compose build

# Stoppa gamla containrar
docker-compose down

# Starta nya containrar
docker-compose up -d

# Verifiera
docker-compose logs -f app
```

### Automatiska uppdateringar (Watchtower)

**Lägg till i docker-compose.yml:**

```yaml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400  # 24 timmar
```

---

## Checklista för produktion

- [ ] Starka lösenord och API-nycklar
- [ ] SSL/TLS-certifikat installerat
- [ ] Brandvägg konfigurerad
- [ ] Fail2ban aktiverat
- [ ] Automatiska backups schemalagda
- [ ] Uptime monitoring aktiverat
- [ ] Loggning konfigurerad
- [ ] Error tracking (Sentry/etc.)
- [ ] DNS konfigurerat korrekt
- [ ] Email för notifikationer
- [ ] Dokumentation för driftsättning
- [ ] Runbook för incidenter

---

## Support

**Produktionsproblem?**
- Öppna issue: https://github.com/Falkenbergs-kommun/kunskapsportal/issues
- Kritiska säkerhetsproblem: security@falkenberg.se

**Professionell support:**
Kontakta Falkenbergs kommun Utvecklingsavdelningen för support.
