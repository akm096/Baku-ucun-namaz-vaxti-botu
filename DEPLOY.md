# 🕌 Bakı Namaz Vaxtları Botu — Qurulum Təlimatı (Cloudflare Workers)

## Tələblər

- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare hesabı](https://dash.cloudflare.com/sign-up) (pulsuz)
- Telegram bot token (@BotFather-dən)

---

## 1. Wrangler-i quraşdırın

```bash
npm install
```

Bu `wrangler`-i dev dependency kimi quraşdıracaq.

> 💡 Əgər global quraşdırmaq istəyirsinizsə: `npm install -g wrangler`

---

## 2. Cloudflare-ə giriş edin

```bash
npx wrangler login
```

Bu brauzerdə Cloudflare hesabınıza giriş etməyi xahiş edəcək.

---

## 3. KV Namespace yaradın

```bash
npx wrangler kv namespace create NOTIFICATIONS_KV
```

Çıxışda belə bir şey görəcəksiniz:

```
🌀 Creating namespace with title "baku-namaz-bot-NOTIFICATIONS_KV"
✨ Success! Add the following to your wrangler.toml:
   id = "abcdef1234567890abcdef1234567890"
```

Həmin `id` dəyərini `wrangler.toml` faylındakı `id = "YOUR_KV_NAMESPACE_ID_HERE"` ilə əvəz edin.

---

## 4. Secret-ləri təyin edin

```bash
npx wrangler secret put BOT_TOKEN
```

> Soruşanda Telegram bot tokeninizi yapışdırın (@BotFather-dən alınan).

```bash
npx wrangler secret put ALLOWED_CHAT_ID
```

> Soruşanda bildirişləri alacaq chat/qrup ID-sini yazın.

> 💡 Chat ID-ni öyrənmək üçün: botu qrupa əlavə edib və ya şəxsi mesajda `/start` göndərin, sonra `https://api.telegram.org/bot<TOKEN>/getUpdates` linkini açıb `chat.id` dəyərini tapın.

---

## 5. Worker-i yükləyin (Deploy)

```bash
npx wrangler deploy
```

Çıxışda Worker URL-ini görəcəksiniz, məsələn:

```
Published baku-namaz-bot (1.5s)
  https://baku-namaz-bot.YOUR_SUBDOMAIN.workers.dev
```

Bu URL-i yadda saxlayın — növbəti addımda lazım olacaq.

---

## 6. Telegram Webhook-u təyin edin

Brauzerdə və ya terminal-da bu URL-ə daxil olun (dəyərləri əvəz edin):

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://baku-namaz-bot.YOUR_SUBDOMAIN.workers.dev/webhook"
```

Cavab belə olmalıdır:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## 7. Cron Trigger-i yoxlayın

Cron trigger artıq `wrangler.toml`-da `* * * * *` kimi təyin olunub. Deploy etdikdən sonra avtomatik aktivləşir.

Bunu yoxlamaq üçün [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → `baku-namaz-bot` → Triggers bölməsinə baxın.

---

## 8. Loqları izləyin

Real vaxtda loqları izləmək üçün:

```bash
npx wrangler tail
```

Namaz vaxtı yaxınlaşanda bildiriş göndərildiyini görəcəksiniz.

---

## 9. Test edin

| Test | Nə etməli | Gözlənilən nəticə |
|------|-----------|-------------------|
| `/start` | Bota `/start` göndərin | Salam mesajı + bugünkü vaxtlar |
| `/vaxtlar` | Bota `/vaxtlar` göndərin | Bugünkü vaxtlar (növbəti namaz `◀️` ilə) |
| `/sabah` | Bota `/sabah` göndərin | Sabahkı vaxtlar |
| Health check | Brauzerdə Worker URL-ini açın | JSON: status, bakuTime |
| Cron bildirişi | `wrangler tail` ilə izləyin | Namaz vaxtına 15/10/5/0 dəq qalmış mesaj |
| Təkrar yoxlama | Eyni bildirişin təkrarlanmadığını həmin gün yoxlayın | KV dedup sayəsində təkrar olmur |

---

## Yeni Ay Əlavə Etmək

### Seçim A (Bundled JSON — defolt)

1. `data/2026-03.json` faylını yaradın (eyni formatda).
2. `src/worker.js` faylında:

```js
import data202603 from '../data/2026-03.json';

const BUNDLED_DATA = {
  '2026-02': data202602,
  '2026-03': data202603,  // ⬅ Yeni əlavə
};
```

3. Yenidən deploy edin: `npx wrangler deploy`

### Seçim B (KV)

1. `data/2026-03.json` faylınız var.
2. KV-ya yükləyin:

```bash
npx wrangler kv key put --namespace-id=YOUR_KV_ID "2026-03" --path=data/2026-03.json
```

3. Redeploy lazım deyil!

---

## Problemlərin Həlli

| Problem | Həll |
|---------|------|
| `wrangler: command not found` | `npm install` işlədin |
| Webhook işləmir | URL-in `/webhook` ilə bitdiyini yoxlayın |
| Bildirişlər gəlmir | `wrangler tail` ilə xəta mesajlarını yoxlayın |
| Data tapılmadı | `data/YYYY-MM.json` faylının mövcudluğunu və `import`-un düzgün olduğunu yoxlayın |
| KV xətası | `wrangler.toml`-da düzgün KV namespace ID olduğunu yoxlayın |
| Təkrar bildiriş gəlir | KV binding-in düzgün işlədiyini yoxlayın |

---

## Xərclər (Pulsuz Tier Limitləri)

| Resurs | Pulsuz limit | Botun istifadəsi |
|--------|-------------|------------------|
| Worker sorğuları | 100K/gün | ~1440/gün (cron) + webhook əmrləri |
| KV oxuma | 100K/gün | ~100/gün max |
| KV yazma | 1K/gün | ~30/gün max |
| Cron triggers | 5 ədəd | 1 ədəd |

✅ Pulsuz tier bütün ehtiyacları rahatlıqla ödəyir.
