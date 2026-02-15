require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════
//  KONFİQURASİYA
// ═══════════════════════════════════════════════════════

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN .env faylında tapılmadı!');
  console.error('   .env.example faylını .env olaraq kopyalayıb tokeni yazın.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Namaz adları (Azərbaycanca)
const PRAYER_NAMES = {
  imsak:   '🌙 İmsak',
  subh:    '🌅 Sübh',
  zohr:    '☀️ Zöhr',
  esr:     '🌤️ Əsr',
  meqrib:  '🌇 Məğrib',
  isha:    '🌃 İşa'
};

// Bildiriş göndəriləcək namazlar (bunlara xəbərdarlıq + vaxt mesajı gəlir)
const NOTIFY_PRAYERS = ['imsak', 'subh', 'zohr', 'esr', 'meqrib', 'isha'];

// Neçə dəqiqə qabaq xəbərdarlıq
const REMINDER_MINUTES = [15, 10, 5];

// Göndərilmiş mesajları izləmək üçün (eyni mesajı təkrar göndərməmək)
const sentMessages = new Set();

// ═══════════════════════════════════════════════════════
//  DATA OXUMA
// ═══════════════════════════════════════════════════════

/**
 * Verilmiş tarix üçün namaz vaxtlarını JSON faylından oxuyur
 * @param {Date} date 
 * @returns {object|null} Günün namaz vaxtları
 */
function getPrayerTimes(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = date.getDate();

  const filePath = path.join(__dirname, 'data', `${year}-${month}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Data faylı tapılmadı: ${filePath}`);
    console.error(`   data/${year}-${month}.json faylını yaradın.`);
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const dayData = data.days.find(d => d.day === day);

    if (!dayData) {
      console.error(`❌ ${day} ${month}.${year} günü üçün data tapılmadı.`);
      return null;
    }

    return dayData;
  } catch (err) {
    console.error(`❌ JSON oxuma xətası: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
//  VAXT HESABLAMA
// ═══════════════════════════════════════════════════════

/**
 * "HH:MM" stringini bugünkü Date obyektinə çevirir (Bakı vaxtı)
 */
function timeToDate(timeStr, baseDate) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);

  // Gecə yarısı (00:XX) sabahkı günə aiddir
  if (hours === 0) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

/**
 * Dəqiqə fərqini hesablayır
 */
function minutesDiff(date1, date2) {
  return Math.round((date1 - date2) / 60000);
}

/**
 * Hazırkı vaxtı "HH:MM" formatında qaytarır
 */
function getCurrentTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════
//  MESAJ FORMATLAMA
// ═══════════════════════════════════════════════════════

/**
 * Bugünkü bütün namaz vaxtlarını gözəl formatda göstərir
 */
function formatPrayerTimesMessage(dayData, title = '📅 Bugünkü Namaz Vaxtları') {
  const date = new Date();
  const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  // Növbəti namazı tap
  const now = new Date();
  let nextPrayer = null;
  let nextPrayerTime = null;

  for (const key of NOTIFY_PRAYERS) {
    const prayerDate = timeToDate(dayData[key], now);
    if (prayerDate > now) {
      nextPrayer = key;
      nextPrayerTime = dayData[key];
      break;
    }
  }

  let msg = `${title}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 Bakı  •  🗓 ${dateStr}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const entries = [
    ['imsak',   dayData.imsak],
    ['subh',    dayData.subh],
    ['gunCixir', dayData.gunCixir],
    ['zohr',    dayData.zohr],
    ['esr',     dayData.esr],
    ['gunBatir', dayData.gunBatir],
    ['meqrib',  dayData.meqrib],
    ['isha',    dayData.isha],
    ['gecaYarisi', dayData.gecaYarisi],
  ];

  const labels = {
    imsak:      '🌙 İmsak',
    subh:       '🌅 Sübh',
    gunCixir:   '🌅 Gün çıxır',
    zohr:       '☀️ Zöhr',
    esr:        '🌤️ Əsr',
    gunBatir:   '🌇 Gün batır',
    meqrib:     '🌇 Məğrib',
    isha:       '🌃 İşa',
    gecaYarisi: '🌑 Gecə yarısı',
  };

  for (const [key, time] of entries) {
    const label = labels[key] || key;
    const arrow = (key === nextPrayer) ? ' ◀️' : '';
    msg += `  ${label.padEnd(18)}  ${time}${arrow}\n`;
  }

  if (nextPrayer && nextPrayerTime) {
    const diff = minutesDiff(timeToDate(nextPrayerTime, now), now);
    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⏳ Növbəti: ${PRAYER_NAMES[nextPrayer]} — ${diff} dəq sonra\n`;
  }

  msg += `\n🕌 Qafqaz Müsəlmanları İdarəsi`;

  return msg;
}

// ═══════════════════════════════════════════════════════
//  BİLDİRİŞ SİSTEMİ
// ═══════════════════════════════════════════════════════

/**
 * Mesaj göndərmə (təkrar göndərməni önləyir)
 */
async function sendNotification(messageKey, text) {
  if (sentMessages.has(messageKey)) return;

  try {
    if (CHAT_ID) {
      await bot.sendMessage(CHAT_ID, text, { parse_mode: 'HTML' });
      sentMessages.add(messageKey);
      console.log(`✅ Göndərildi: ${messageKey}`);
    } else {
      console.log(`⚠️ CHAT_ID yoxdur. Mesaj: ${messageKey}`);
    }
  } catch (err) {
    console.error(`❌ Mesaj göndərmə xətası: ${err.message}`);
  }
}

/**
 * Hər dəqiqə yoxlanılır — namaz vaxtına nə qədər qalıb?
 */
function checkPrayerTimes() {
  const now = new Date();
  const dayData = getPrayerTimes(now);
  if (!dayData) return;

  const currentTimeStr = getCurrentTimeStr();

  for (const prayer of NOTIFY_PRAYERS) {
    const prayerTime = dayData[prayer];
    if (!prayerTime) continue;

    const prayerDate = timeToDate(prayerTime, now);
    const diff = minutesDiff(prayerDate, now);

    // Xəbərdarlıq mesajları (15, 10, 5 dəq qabaq)
    for (const reminderMin of REMINDER_MINUTES) {
      if (diff === reminderMin) {
        const key = `reminder_${prayer}_${reminderMin}_${now.toDateString()}`;
        const emoji = reminderMin === 5 ? '🔴' : reminderMin === 10 ? '🟡' : '🟢';
        sendNotification(key,
          `${emoji} <b>${PRAYER_NAMES[prayer]}</b> vaxtına <b>${reminderMin} dəqiqə</b> qalıb!\n\n🕐 Vaxt: ${prayerTime}`
        );
      }
    }

    // Vaxt gəldi mesajı
    if (currentTimeStr === prayerTime) {
      const key = `prayer_${prayer}_${now.toDateString()}`;
      sendNotification(key,
        `🕌 <b>${PRAYER_NAMES[prayer]} vaxtıdır!</b>\n\n🕐 ${prayerTime}\n📍 Bakı\n\n🤲 Allah qəbul etsin!`
      );
    }
  }
}

/**
 * Hər gün gecə yarısı göndərilmiş mesajlar siyahısını təmizlə
 */
function clearSentMessages() {
  sentMessages.clear();
  console.log('🧹 Göndərilmiş mesajlar siyahısı təmizləndi (yeni gün).');
}

// ═══════════════════════════════════════════════════════
//  TELEGRAM ƏMRLƏRİ
// ═══════════════════════════════════════════════════════

// /start əmri
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`📩 /start — Chat ID: ${chatId}`);

  const dayData = getPrayerTimes(new Date());
  let text;

  if (dayData) {
    text = `🕌 <b>Bakı Namaz Vaxtları Botu</b>\n\n`;
    text += `Salam! Bu bot sizə hər gün Bakı üçün namaz vaxtlarını göndərir.\n\n`;
    text += `<b>Əmrlər:</b>\n`;
    text += `/vaxtlar — Bugünkü namaz vaxtları\n`;
    text += `/sabah — Sabahkı namaz vaxtları\n\n`;
    text += `<b>Avtomatik bildirişlər:</b>\n`;
    text += `• Hər namaza 15, 10, 5 dəqiqə qalmış\n`;
    text += `• Namaz vaxtı gəldikdə\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += formatPrayerTimesMessage(dayData);
  } else {
    text = `🕌 <b>Bakı Namaz Vaxtları Botu</b>\n\n`;
    text += `⚠️ Bu ay üçün data faylı tapılmadı.\n`;
    text += `data/ qovluğuna aylıq JSON faylı əlavə edin.`;
  }

  bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
});

// /vaxtlar əmri
bot.onText(/\/vaxtlar/, (msg) => {
  const chatId = msg.chat.id;
  const dayData = getPrayerTimes(new Date());

  if (dayData) {
    bot.sendMessage(chatId, formatPrayerTimesMessage(dayData), { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '⚠️ Bugün üçün namaz vaxtları tapılmadı. Data faylını yoxlayın.', { parse_mode: 'HTML' });
  }
});

// /sabah əmri
bot.onText(/\/sabah/, (msg) => {
  const chatId = msg.chat.id;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayData = getPrayerTimes(tomorrow);

  if (dayData) {
    const title = '📅 Sabahkı Namaz Vaxtları';
    // Sabah üçün xüsusi format
    const dateStr = `${String(tomorrow.getDate()).padStart(2, '0')}.${String(tomorrow.getMonth() + 1).padStart(2, '0')}.${tomorrow.getFullYear()}`;

    let text = `${title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📍 Bakı  •  🗓 ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const entries = [
      ['🌙 İmsak',        dayData.imsak],
      ['🌅 Sübh',         dayData.subh],
      ['🌅 Gün çıxır',    dayData.gunCixir],
      ['☀️ Zöhr',          dayData.zohr],
      ['🌤️ Əsr',           dayData.esr],
      ['🌇 Gün batır',    dayData.gunBatir],
      ['🌇 Məğrib',       dayData.meqrib],
      ['🌃 İşa',          dayData.isha],
      ['🌑 Gecə yarısı',  dayData.gecaYarisi],
    ];

    for (const [label, time] of entries) {
      text += `  ${label.padEnd(18)}  ${time}\n`;
    }

    text += `\n🕌 Qafqaz Müsəlmanları İdarəsi`;

    bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '⚠️ Sabah üçün namaz vaxtları tapılmadı. Data faylını yoxlayın.', { parse_mode: 'HTML' });
  }
});

// ═══════════════════════════════════════════════════════
//  CRON İŞLƏRİ
// ═══════════════════════════════════════════════════════

// Hər dəqiqə namaz vaxtlarını yoxla
cron.schedule('* * * * *', () => {
  checkPrayerTimes();
});

// Hər gün 00:01-də göndərilmiş mesajlar siyahısını təmizlə
cron.schedule('1 0 * * *', () => {
  clearSentMessages();
});

// Hər gün səhər 05:00-da bugünkü vaxtları avtomatik göndər
cron.schedule('0 5 * * *', () => {
  if (!CHAT_ID) return;

  const dayData = getPrayerTimes(new Date());
  if (dayData) {
    bot.sendMessage(CHAT_ID, formatPrayerTimesMessage(dayData, '🌄 Sabahınız xeyir! Bugünkü Namaz Vaxtları'), { parse_mode: 'HTML' });
    console.log('📨 Səhər avtomatik namaz vaxtları göndərildi.');
  }
});

// ═══════════════════════════════════════════════════════
//  BAŞLAT
// ═══════════════════════════════════════════════════════

console.log('');
console.log('🕌 ════════════════════════════════════════');
console.log('   Bakı Namaz Vaxtları Botu işə düşdü!');
console.log('   ════════════════════════════════════════');
console.log('');

const todayData = getPrayerTimes(new Date());
if (todayData) {
  console.log('📅 Bugünkü vaxtlar:');
  for (const prayer of NOTIFY_PRAYERS) {
    console.log(`   ${PRAYER_NAMES[prayer]}: ${todayData[prayer]}`);
  }
  console.log('');
}

if (CHAT_ID) {
  console.log(`📬 Bildirişlər chat ID-yə göndəriləcək: ${CHAT_ID}`);
} else {
  console.log('⚠️  CHAT_ID təyin edilməyib. /start göndərərək Chat ID-ni öyrənin.');
}

console.log('⏱️  Hər dəqiqə namaz vaxtları yoxlanılır...');
console.log('');
