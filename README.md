# Valkyrion Discord Radio Bot

Bot Discord untuk streaming radio 24/7 dengan dashboard web monitoring real-time.

## Fitur
- 🎵 13+ stasiun radio berkualitas tinggi
- 🎛️ Multi-server support 
- 📊 Dashboard web dengan monitoring real-time
- 🔐 Discord OAuth2 authentication
- 🎮 Interface Discord interaktif

## Deployment ke Vercel (Gratis)

### Langkah 1: Persiapan
1. Buat akun di [vercel.com](https://vercel.com)
2. Beli domain `valkyrion.xyz` dari registrar (Namecheap, GoDaddy, dll)

### Langkah 2: Deploy
1. Push code ke GitHub repository
2. Connect GitHub ke Vercel
3. Deploy otomatis dari Vercel dashboard

### Langkah 3: Custom Domain
1. Di Vercel project settings, tambahkan domain `valkyrion.xyz`
2. Update DNS records di domain registrar:
   - A record: `@` → Vercel IP
   - CNAME: `www` → vercel deployment URL

### Environment Variables
Set di Vercel dashboard:
```
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id  
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=your_postgres_url
```

## Stasiun Radio
- J1HITS, J1HD (Pop/Top 40)
- BIG B RADIO (K-Pop, J-Pop, C-Pop, Asian Pop) 
- Prambors FM (Indonesian Pop)
- Chill Lofi, Jazz, Rock, Electronic, dan lainnya

## URL Dashboard
Setelah deployment: `https://valkyrion.xyz`