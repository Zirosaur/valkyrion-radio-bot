# Deploy Valkyrion Radio Bot ke Railway

## Langkah Deployment:

### 1. Login ke Railway
- Buka railway.app
- Klik "Login with GitHub"
- Authorize Railway

### 2. Deploy Project
- Klik "New Project"
- Pilih "Deploy from GitHub repo"
- Pilih repository: `Zirosaur/valkyrion-radio-bot`

### 3. Environment Variables
Di Railway dashboard, tambahkan variables:
```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=1293281550565113987
DISCORD_CLIENT_SECRET=your_discord_client_secret
DATABASE_URL=postgresql://... (Railway auto-generate)
NODE_ENV=production
SESSION_SECRET=your_random_session_secret
```

### 4. Database
- Railway akan auto-detect PostgreSQL
- Database URL akan otomatis tersedia

### 5. Deploy Settings
Railway akan otomatis detect:
- Build: Nixpacks akan install dependencies dan build project
- Start: `npm start`
- Port: Auto-detect dari aplikasi

## File Konfigurasi yang Sudah Dibuat:
- **nixpacks.toml**: Konfigurasi build Railway
- **Dockerfile**: Alternative Docker build
- **.dockerignore**: Exclude unnecessary files
- **.npmrc**: NPM configuration
- **railway.json**: Railway deployment settings

## Troubleshooting:
Jika ada error build, Railway akan menggunakan konfigurasi dari nixpacks.toml yang sudah dioptimasi untuk Discord bot.

Bot akan online 24/7 dengan monitoring system terintegrasi.
