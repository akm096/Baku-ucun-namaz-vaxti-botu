# 🕌 Bakı Namaz Vaxtları — Telegram Bot

Bakı şəhəri üçün namaz vaxtlarını bildirən, Ramazan rejimi və oruc izləmə sistemi olan Telegram botu.
**Cloudflare Workers** üzərində pulsuz işləyir — server lazım deyil.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)](https://core.telegram.org/bots)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Xüsusiyyətlər

### 📅 Namaz Vaxtları
- Gündəlik, sabahkı, həftəlik və aylıq namaz vaxtları
- İstənilən tarix üzrə axtarış (`/tarix 25.03.2026` və ya `/tarix 25 mart`)
- Növbəti namaza qalan vaxtın göstərilməsi (◀️ ilə işarələnir)
- 9 vaxt: İmsak, Sübh, Gün çıxır, Zöhr, Əsr, Gün batır, Məğrib, İşa, Gecə yarısı

### 🔔 Avtomatik Bildirişlər
- Hər namaza **15, 10, 5 dəqiqə** qalmış xəbərdarlıq
- Namaz vaxtı gəldikdə bildiriş
- Hər gün səhər **05:00**-da avtomatik gündəlik cədvəl
- Cloudflare KV ilə təkrar bildirişlərin qarşısının alınması (dedup)

### 🌙 Ramazan Rejimi
- Ramazan ayında avtomatik aktivləşir
- İmsak (Səhər) və İftar (Məğrib) vaxtları vurğulanır
- 🕌 Teravih namazı vaxtı əlavə göstərilir
- İftara **30, 15, 5 dəqiqə** qalmış xüsusi xatırlatma
- Gündəlik hədis / ayə mesajları (30 gün üçün)
- Qadr gecəsi xəbərdarlıqları

### 📊 Oruc İzləmə & Statistika
- İnteraktiv oruc qeydi (✅ Tutdum / ❌ Tutmadım)
- Ardıcıl oruc günləri izləmə (streak)
- Nailiyyətlər sistemi (🥇 İlk Oruc, 🔥 3 Gün, ⚡ 7 Gün, 💪 Yarısı, 🏆 Tam Ramazan, ⭐ Qadr Gecələri)
- Progress bar ilə statistika
- Motivasiya mesajları (hər gün fərqli)
- İftar sonrası avtomatik "Oruc tutdunuzmu?" sualı

### 🤲 Dua & Əlavə
- İftar, İmsak (Niyyət) və ümumi Ramazan duaları
- 🧭 Qiblə istiqaməti (Google Maps linki ilə)
- ⚙️ Fərdi bildiriş ayarları (hansı namazlar, hansı xatırlatmalar)

### 🖲️ İnteraktiv İnterfeys
- İnline düymələr ilə tam idarə — əmr yazmağa ehtiyac yoxdur
- Ramazan təqvimi səhifələmə (3 səhifə × 10 gün)

---

## 🤖 Bot Əmrləri

| Əmr | Təsvir |
|------|--------|
| `/start` | Bot haqqında məlumat + bugünkü vaxtlar |
| `/vaxtlar` | Bugünkü namaz vaxtları |
| `/sabah` | Sabahkı namaz vaxtları |
| `/heftelik` | 7 günlük namaz cədvəli |
| `/ay` | Cari ayın cədvəli |
| `/ay mart` | Müəyyən ayın cədvəli |
| `/tarix 25.03.2026` | Tarix üzrə namaz vaxtları |
| `/tarix 25 mart` | Tarix üzrə (cari il) |
| `/ramazan` | Ramazan təqvimi + oruc izləmə |
| `/statistika` | Oruc statistikası və nailiyyətlər |
| `/dua` | İftar / İmsak / Ramazan duaları |
| `/qible` | Qiblə istiqaməti |
| `/ayarlar` | Bildiriş ayarlarını idarə et |
| `/help` | Bütün əmrlərin siyahısı |

> 💡 **Alias-lar:** `/stats`, `/qibla`, `/komek`, `/kömək`, `/settings`

---

## 🛠️ Texnologiyalar

| Texnologiya | İstifadə |
|-------------|----------|
| [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless runtime (pulsuz tier) |
| [Cloudflare KV](https://developers.cloudflare.com/kv/) | Ayarlar, oruc statusu, dedup saxlanması |
| [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) | Hər dəqiqə bildiriş yoxlaması |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Webhook vasitəsilə əmrləri qəbul etmə |
| JavaScript (ES Modules) | Worker kodu |

---

## 🚀 Qurulum

### Tələblər
- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare hesabı](https://dash.cloudflare.com/sign-up) (pulsuz)
- Telegram bot token ([@BotFather](https://t.me/BotFather)-dən)

### 1. Layihəni klonla
```bash
git clone https://github.com/YOUR_USERNAME/baku-namaz-bot.git
cd baku-namaz-bot
```

### 2. Asılılıqları qur
```bash
npm install
```

### 3. Cloudflare-ə giriş et
```bash
npx wrangler login
```

### 4. KV Namespace yarat
```bash
npx wrangler kv namespace create NOTIFICATIONS_KV
```
Çıxışdakı `id` dəyərini `wrangler.toml` faylındakı `id = "YOUR_KV_NAMESPACE_ID_HERE"` ilə əvəz et.

### 5. Secret-ləri təyin et
```bash
npx wrangler secret put BOT_TOKEN
# Soruşanda Telegram bot tokenini yapışdır

npx wrangler secret put ALLOWED_CHAT_ID
# Soruşanda chat/qrup ID-ni yaz
```

> 💡 **Chat ID-ni tapmaq:** botu qrupa əlavə edib `/start` göndər, sonra `https://api.telegram.org/bot<TOKEN>/getUpdates` linkini açıb `chat.id` dəyərini tap.

### 6. Deploy et
```bash
npx wrangler deploy
```

### 7. Telegram Webhook-u təyin et
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://baku-namaz-bot.YOUR_SUBDOMAIN.workers.dev/webhook"
```

> 📖 Ətraflı qurulum təlimatı üçün [DEPLOY.md](DEPLOY.md) faylına baxın.

---

## 📁 Layihə Strukturu

```
baku-namaz-bot/
├── src/
│   └── worker.js          # Əsas Cloudflare Worker kodu
├── data/
│   ├── 2026-01.json       # Yanvar namaz vaxtları
│   ├── 2026-02.json       # Fevral namaz vaxtları
│   └── ...                # Hər ay üçün ayrı JSON
├── bot.js                 # ⚠️ Legacy Node.js versiya (istifadə olunmur)
├── wrangler.toml          # Cloudflare Workers konfiqurasiyası
├── package.json
├── DEPLOY.md              # Ətraflı deploy təlimatı
├── .env.example           # Nümunə environment dəyişənləri
├── .gitignore
└── LICENSE
```

---

## 📄 Data Formatı

Namaz vaxtları `data/` qovluğundakı aylıq JSON fayllardan oxunur.

**Format:** `data/YYYY-MM.json`

```json
{
  "year": 2026,
  "month": 2,
  "city": "Bakı",
  "days": [
    {
      "day": 1,
      "imsak": "06:23",
      "subh": "06:28",
      "gunCixir": "07:50",
      "zohr": "12:54",
      "esr": "16:17",
      "gunBatir": "17:58",
      "meqrib": "18:13",
      "isha": "19:16",
      "gecaYarisi": "00:12"
    }
  ]
}
```

> ⚠️ Yeni ay əlavə edəndə `src/worker.js` faylına `import` və `BUNDLED_DATA` giriş əlavə etmək lazımdır. Ətraflı: [DEPLOY.md](DEPLOY.md)

---

## 💰 Xərclər

Bu bot tamamilə **Cloudflare-in pulsuz tier-ində** işləyir:

| Resurs | Pulsuz limit | Botun istifadəsi |
|--------|-------------|------------------|
| Worker sorğuları | 100K/gün | ~1440/gün (cron) + əmrlər |
| KV oxuma | 100K/gün | ~100/gün max |
| KV yazma | 1K/gün | ~30/gün max |
| Cron triggers | 5 ədəd | 1 ədəd |

---

## ⚠️ Legacy Versiya

`bot.js` faylı botun köhnə **Node.js + Polling** versiyasıdır. Bu versiya **artıq istifadə olunmur** — layihə Cloudflare Workers-ə köçürülüb. Fayl yalnız istinad üçün saxlanılıb.

Əsas Worker kodu: [`src/worker.js`](src/worker.js)

---

## 📝 Lisenziya

Bu layihə [MIT lisenziyası](LICENSE) altında paylaşılır.

---

## 🤝 Töhfə

Töhfə vermək istəyirsinizsə:

1. Layihəni fork edin
2. Yeni branch yaradın (`git checkout -b feature/yeni-xüsusiyyət`)
3. Dəyişikliklərinizi commit edin (`git commit -m 'Yeni xüsusiyyət əlavə edildi'`)
4. Branch-ı push edin (`git push origin feature/yeni-xüsusiyyət`)
5. Pull Request açın

---

📍 **Mənbə:** Qafqaz Müsəlmanları İdarəsi rəsmi namaz vaxtları
