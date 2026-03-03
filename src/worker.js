// ═══════════════════════════════════════════════════════════════
//  Bakı Namaz Vaxtları Telegram Botu — Cloudflare Workers
//  Pulsuz tier: Webhook + Cron Trigger + KV dedup
//  Əmrlər: /start, /vaxtlar, /sabah, /heftelik, /tarix, /ay,
//          /help, /ayarlar
//  Ramazan xüsusi rejimi + Inline düymələr
// ═══════════════════════════════════════════════════════════════

// ─── Bundled JSON data ─────────────────────────────────────────
import data202601 from '../data/baku/2026-01.json';
import data202602 from '../data/baku/2026-02.json';
import data202603 from '../data/baku/2026-03.json';
import data202604 from '../data/baku/2026-04.json';
import data202605 from '../data/baku/2026-05.json';
import data202606 from '../data/baku/2026-06.json';
import data202607 from '../data/baku/2026-07.json';
import data202608 from '../data/baku/2026-08.json';
import data202609 from '../data/baku/2026-09.json';
import data202610 from '../data/baku/2026-10.json';
import data202611 from '../data/baku/2026-11.json';
import data202612 from '../data/baku/2026-12.json';

import gence202601 from '../data/gence/2026-01.json';
import gence202602 from '../data/gence/2026-02.json';
import gence202603 from '../data/gence/2026-03.json';
import gence202604 from '../data/gence/2026-04.json';
import gence202605 from '../data/gence/2026-05.json';
import gence202606 from '../data/gence/2026-06.json';
import gence202607 from '../data/gence/2026-07.json';
import gence202608 from '../data/gence/2026-08.json';
import gence202609 from '../data/gence/2026-09.json';
import gence202610 from '../data/gence/2026-10.json';
import gence202611 from '../data/gence/2026-11.json';
import gence202612 from '../data/gence/2026-12.json';

const BUNDLED_DATA = {
    'baku': {
        '2026-01': data202601,
        '2026-02': data202602,
        '2026-03': data202603,
        '2026-04': data202604,
        '2026-05': data202605,
        '2026-06': data202606,
        '2026-07': data202607,
        '2026-08': data202608,
        '2026-09': data202609,
        '2026-10': data202610,
        '2026-11': data202611,
        '2026-12': data202612,
    },
    'gence': {
        '2026-01': gence202601,
        '2026-02': gence202602,
        '2026-03': gence202603,
        '2026-04': gence202604,
        '2026-05': gence202605,
        '2026-06': gence202606,
        '2026-07': gence202607,
        '2026-08': gence202608,
        '2026-09': gence202609,
        '2026-10': gence202610,
        '2026-11': gence202611,
        '2026-12': gence202612,
    }
};

// ═══════════════════════════════════════════════════════════════
//  SABİTLƏR
// ═══════════════════════════════════════════════════════════════

// ─── Şəhər konfigürasyonu ──────────────────────────────────────
// Türkiyə şəhərləri əlifba sırası ilə
const TR_CITY_TEMPLATE = {
    country: 'Turkey',
    timezone: 'Europe/Istanbul',
    source: 'api',
    method: 13,
    emoji: '🇹🇷',
    authority_az: 'Diyanət İşləri Başqanlığı',
    authority_tr: 'Diyanet İşleri Başkanlığı',
};

function makeTrCity(id, name) {
    return { id, name_az: name, name_tr: name, ...TR_CITY_TEMPLATE };
}

// Əlifba sırası ilə Türkiyənin 81 vilayəti
const TURKEY_CITIES_LIST = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
    'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
    'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Sivas', 'Şırnak',
    'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

const CITIES = {};

// Azərbaycan şəhərləri
CITIES.baku = {
    id: 'baku',
    name_az: 'Bakı',
    name_tr: 'Bakü',
    country: 'Azerbaijan',
    timezone: 'Asia/Baku',
    source: 'bundled',
    emoji: '🇦🇿',
    authority_az: 'Qafqaz Müsəlmanları İdarəsi',
    authority_tr: 'Kafkasya Müslümanları İdaresi',
};

CITIES.gence = {
    id: 'gence',
    name_az: 'Gəncə',
    name_tr: 'Gence',
    country: 'Azerbaijan',
    timezone: 'Asia/Baku',
    source: 'bundled',
    emoji: '🇦🇿',
    authority_az: 'Qafqaz Müsəlmanları İdarəsi',
    authority_tr: 'Kafkasya Müslümanları İdaresi',
};

// Türkiyə şəhərlərini CITIES-ə əlavə et
for (const name of TURKEY_CITIES_LIST) {
    const id = name.toLowerCase()
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/â/g, 'a').replace(/î/g, 'i');
    CITIES[id] = makeTrCity(id, name);
}

// Ölkəyə görə şəhərlərin siyahısı
const AZERBAIJAN_CITIES = ['baku', 'gence'];
const TURKEY_CITIES = Object.keys(CITIES).filter(id => CITIES[id].country === 'Turkey');
const CITIES_PER_PAGE = 12;

const DEFAULT_CITY = 'baku';
const DEFAULT_LANG = 'az';

// ─── Lokalizasiya (i18n) ────────────────────────────────────────
const LOCALES = {
    az: {
        prayer_names: {
            imsak: '🌙 İmsak',
            subh: '🌅 Sübh',
            zohr: '☀️ Zöhr',
            esr: '🌤️ Əsr',
            meqrib: '🌇 Məğrib',
            isha: '🌃 İşa',
        },
        all_labels: {
            imsak: '🌙 İmsak',
            subh: '🌅 Sübh',
            gunCixir: '🌅 Gün çıxır',
            zohr: '☀️ Zöhr',
            esr: '🌤️ Əsr',
            gunBatir: '🌇 Gün batır',
            meqrib: '🌇 Məğrib',
            isha: '🌃 İşa',
            gecaYarisi: '🌑 Gecə yarısı',
        },
        weekdays: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'],
        weekdays_short: ['Baz', 'Ber', 'Çax', 'Çər', 'Cax', 'Cüm', 'Şən'],
        months_input: {
            'yanvar': 1, 'fevral': 2, 'mart': 3, 'aprel': 4,
            'may': 5, 'iyun': 6, 'iyul': 7, 'avqust': 8,
            'sentyabr': 9, 'oktyabr': 10, 'noyabr': 11, 'dekabr': 12,
        },
        months_display: {
            1: 'Yanvar', 2: 'Fevral', 3: 'Mart', 4: 'Aprel',
            5: 'May', 6: 'İyun', 7: 'İyul', 8: 'Avqust',
            9: 'Sentyabr', 10: 'Oktyabr', 11: 'Noyabr', 12: 'Dekabr',
        },
        ui: {
            today_title: '📅 Bugünkü Namaz Vaxtları',
            tomorrow_title: '📅 Sabahkı Namaz Vaxtları',
            weekly_title: '📆 Həftəlik Namaz Vaxtları',
            monthly_title: '🗓 {month} {year} — Namaz Vaxtları',
            next_prayer: '⏳ Növbəti: {prayer} — {min} dəq sonra',
            no_data_today: '⚠️ Bugün üçün namaz vaxtları tapılmadı.',
            no_data_tomorrow: '⚠️ Sabah üçün namaz vaxtları tapılmadı.',
            no_data_month: '⚠️ {month} {year} üçün data tapılmadı.',
            no_data_date: '⚠️ {date} tarixi üçün data tapılmadı.',
            welcome_title: '🕌 <b>Namaz Vaxtları Botu</b>',
            welcome_text: 'Salam! Bu bot sizə hər gün namaz vaxtlarını göndərir.',
            welcome_buttons: 'Aşağıdakı düymələrdən istifadə edin və ya əmr yazın:',
            btn_today: '📅 Bugün',
            btn_tomorrow: '📅 Sabah',
            btn_weekly: '📆 Həftəlik',
            btn_monthly: '🗓 Aylıq',
            btn_ramadan: '🌙 Ramazan',
            btn_settings: '⚙️ Ayarlar',
            btn_help: '❓ Kömək',
            btn_more: '➕ Daha çox',
            btn_back: '🔙 Əsas menyu',
            btn_tesbeh: '📿 Təsbeh',
            btn_hadith: '📖 Hədis',
            btn_qaza: '🕌 Qəza',
            btn_calendar: '📅 Təqvim',
            btn_asma: '📿 Əsma',
            btn_friday: '✨ Cümə',
            btn_hijri: '📅 Hicri',
            btn_stats: '📊 Statistika',
            btn_dua: '🤲 Dua',
            settings_title: '⚙️ <b>Bildiriş Ayarları</b>',
            settings_desc: 'Bildirişləri fərdiləşdirmək üçün\naşağıdakı düymələrə basın:',
            settings_active: '✅ = Aktiv  |  ❌ = Deaktiv',
            settings_lang: '🌐 Dil',
            settings_city: '📍 Şəhər',
            settings_reminder15: '15 dəq xatırlatma',
            settings_reminder10: '10 dəq xatırlatma',
            settings_reminder5: '5 dəq xatırlatma',
            settings_ontime: 'Vaxt gəldikdə',
            settings_morning: 'Səhər cədvəli (05:00)',
            settings_prayers_header: '━━━ Namazlar ━━━',
            settings_all_off: '🔕 Bütün bildirişləri bağla',
            settings_updated: '✅ Yeniləndi!',
            settings_all_off_done: '🔕 Bütün bildirişlər bağlandı!',
            lang_select_title: '🌐 <b>Dil Seçimi</b>',
            lang_select_desc: 'Botun dilini seçin:',
            lang_changed: '✅ Dil dəyişdirildi!',
            city_select_title: '📍 <b>Şəhər Seçimi</b>',
            city_select_desc: 'Namaz vaxtları üçün şəhəri seçin:',
            city_changed: '✅ Şəhər dəyişdirildi: {city}',
            country_select_title: '🌍 <b>Ölkə Seçimi</b>',
            country_select_desc: 'Əvvəlcə ölkə seçin:',
            city_page_info: 'Səhifə {page}/{total}',
            dil_cmd_title: '🌐 <b>Dil Seçimi</b>',
            dil_cmd_desc: 'Botun dilini seçin:',
            weekly_order: 'Sıra: İmsak | Sübh | Zöhr | Əsr | Məğrib | İşa',
            monthly_header: 'Gün  Sübh  Günçx Zöhr  Əsr   Məğr  İşa',
            ramadan_greet: '🌙 <b>Ramazan Mübarək!</b> ({day}-ci gün)',
            prayer_coming: '{emoji} <b>{prayer}</b> vaxtına <b>{min} dəqiqə</b> qalıb!',
            prayer_time: '🕌 <b>{prayer} vaxtıdır!</b>',
            iftar_30min: '🌙 <b>İftara 30 dəqiqə qalıb!</b>',
            iftar_coming: '{emoji} 🌙 <b>İftara {min} dəqiqə</b> qalıb!',
            imsak_coming: '{emoji} 🌙 <b>Səhərə (İmsak) {min} dəqiqə</b> qalıb!',
            iftar_time: '🌙🎉 <b>İFTAR VAXTIDIR!</b>',
            imsak_time: '🌙 <b>İMSAK VAXTIDIR!</b>',
            imsak_label: ' 🍽 Səhər',
            iftar_label: ' 🍽 İftar',
            accept_pray: '🤲 Allah qəbul etsin!',
            accept_fast: '🤲 Allahım, orucumuzu qəbul et!',
            morning_title: '🌄 Sabahınız xeyir! Bugünkü Namaz Vaxtları',
            api_error: '⚠️ Namaz vaxtları alınarkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
            more_title: '➕ <b>Əlavə Funksiyalar</b>',
            more_desc: 'Aşağıdakı düymələrdən istifadə edin:',
            // Ramazan səhifəsi
            ramadan_calendar: 'Ramazan {year} Təqvimi',
            ramadan_days_left: '⏳ Ramazana <b>{days} gün</b> qalıb',
            ramadan_current_day: '📿 Ramazanın <b>{day}-ci</b> günü',
            ramadan_ended: '🎉 Ramazan bitib — Bayramınız mübarək!',
            ramadan_qadr_note: '⭐ = Qadr gecəsi ehtimalı',
            ramadan_no_data: '⚠️ {year}-ci il üçün Ramazan tarixləri mövcud deyil.',
            // Ramazan statistika
            ramadan_stats_title: 'Ramazan {year} — Oruc Statistikası',
            ramadan_today_day: '🌙 Bu gün Ramazanın <b>{day}-ci</b> günüdür',
            ramadan_fasted: '✅ Tutulan oruclar: <b>{count}</b>',
            ramadan_missed: '❌ Tutulmayan günlər: <b>{count}</b>',
            ramadan_unmarked: '⬜ Qeyd edilməyib: <b>{count}</b>',
            ramadan_future: '🔲 Qalan günlər: <b>{count}</b>',
            ramadan_completion: '📈 <b>Tamamlanma:</b>',
            ramadan_qaza_debt: '⚠️ <b>Qəza orucları:</b> {count} gün',
            ramadan_achievements: '🏆 <b>Nailiyyətlər:</b>',
            ramadan_accept: '🤲 Allah oruclarınızı qəbul etsin!',
            ramadan_stats_label: '📊 <b>Statistika:</b>',
            ramadan_fasted_count: '✅ {count} tutuldu',
            ramadan_missed_count: '❌ {count} tutulmadı',
            ramadan_unmarked_count: '⬜ {count} qeyd edilməyib',
            ramadan_future_count: '🔲 {count} qalıb',
            // Ramazan düymələr
            btn_ramadan_cancel: 'Ləğv et',
            btn_ramadan_prev: '◀️ Əvvəlki',
            btn_ramadan_next: 'Növbəti ▶️',
            btn_ramadan_stats: '📊 Statistika',
            btn_ramadan_dua: '🤲 Dua',
            btn_ramadan_calendar: '🌙 Ramazan Təqvimi',
            // Oruc qeydləri
            fasting_cannot_mark: '⚠️ Bu gün üçün qeyd edilə bilməz!',
            fasting_marked_yes: '✅ {day}-ci gün: Oruc tutuldu!',
            fasting_marked_no: '❌ {day}-ci gün: Oruc tutulmadı',
            fasting_cancelled: '🔄 {day}-ci gün: Qeyd ləğv edildi',
            // /tarix əmri
            tarix_help_title: 'ℹ️ <b>Tarix əmri istifadəsi:</b>',
            // Callback toasts
            toast_today: '📅 Bugün',
            toast_tomorrow: '📅 Sabah',
            toast_weekly: '📆 Həftəlik',
            toast_monthly: '🗓 Aylıq',
            toast_tesbeh: '📿 Təsbeh',
            toast_qaza: '🕌 Qəza',
            // Gündəlik namaz izləyicisi
            btn_namazlarim: '📋 Namazlarım',
            namazlarim_title: '📋 Bugünkü Namazlar',
            namazlarim_desc: 'Hər namazı qıldıqdan sonra ✅ basın.\nGün bitdikdə işarələnməmiş namazlar qəzaya düşür.',
            prayer_done: '✅ {prayer} qılındı!',
            prayer_undone: '↩️ {prayer} ləğv edildi',
            namazlarim_alldone: '🎉 Bütün namazlar qılındı! Allah qəbul etsin! 🤲',
            namazlarim_auto_qaza: '⚠️ Dünən {count} namaz qəzaya düşdü.',
        },
    },
    tr: {
        prayer_names: {
            imsak: '🌙 İmsak',
            subh: '🌅 Sabah',
            zohr: '☀️ Öğle',
            esr: '🌤️ İkindi',
            meqrib: '🌇 Akşam',
            isha: '🌃 Yatsı',
        },
        all_labels: {
            imsak: '🌙 İmsak',
            subh: '🌅 Sabah',
            gunCixir: '🌅 Güneş',
            zohr: '☀️ Öğle',
            esr: '🌤️ İkindi',
            gunBatir: '🌇 Güneş Batışı',
            meqrib: '🌇 Akşam',
            isha: '🌃 Yatsı',
            gecaYarisi: '🌑 Gece Yarısı',
        },
        weekdays: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
        weekdays_short: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
        months_input: {
            'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4,
            'mayıs': 5, 'haziran': 6, 'temmuz': 7, 'ağustos': 8,
            'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12,
            'subat': 2, 'agustos': 8, 'mayis': 5, 'kasim': 11,
            'eylul': 9, 'aralik': 12,
        },
        months_display: {
            1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
            5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
            9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık',
        },
        ui: {
            today_title: '📅 Bugünkü Namaz Vakitleri',
            tomorrow_title: '📅 Yarınki Namaz Vakitleri',
            weekly_title: '📆 Haftalık Namaz Vakitleri',
            monthly_title: '🗓 {month} {year} — Namaz Vakitleri',
            next_prayer: '⏳ Sonraki: {prayer} — {min} dk sonra',
            no_data_today: '⚠️ Bugün için namaz vakitleri bulunamadı.',
            no_data_tomorrow: '⚠️ Yarın için namaz vakitleri bulunamadı.',
            no_data_month: '⚠️ {month} {year} için veri bulunamadı.',
            no_data_date: '⚠️ {date} tarihi için veri bulunamadı.',
            welcome_title: '🕌 <b>Namaz Vakitleri Botu</b>',
            welcome_text: 'Merhaba! Bu bot size her gün namaz vakitlerini gönderir.',
            welcome_buttons: 'Aşağıdaki butonları kullanın veya komut yazın:',
            btn_today: '📅 Bugün',
            btn_tomorrow: '📅 Yarın',
            btn_weekly: '📆 Haftalık',
            btn_monthly: '🗓 Aylık',
            btn_ramadan: '🌙 Ramazan',
            btn_settings: '⚙️ Ayarlar',
            btn_help: '❓ Yardım',
            btn_more: '➕ Daha fazla',
            btn_back: '🔙 Ana menü',
            btn_tesbeh: '📿 Tesbih',
            btn_hadith: '📖 Hadis',
            btn_qaza: '🕌 Kaza',
            btn_calendar: '📅 Takvim',
            btn_asma: '📿 Esma',
            btn_friday: '✨ Cuma',
            btn_hijri: '📅 Hicri',
            btn_stats: '📊 İstatistik',
            btn_dua: '🤲 Dua',
            settings_title: '⚙️ <b>Bildirim Ayarları</b>',
            settings_desc: 'Bildirimleri özelleştirmek için\naşağıdaki butonlara basın:',
            settings_active: '✅ = Aktif  |  ❌ = Deaktif',
            settings_lang: '🌐 Dil',
            settings_city: '📍 Şehir',
            settings_reminder15: '15 dk hatırlatma',
            settings_reminder10: '10 dk hatırlatma',
            settings_reminder5: '5 dk hatırlatma',
            settings_ontime: 'Vakit geldiğinde',
            settings_morning: 'Sabah takvimi (05:00)',
            settings_prayers_header: '━━━ Namazlar ━━━',
            settings_all_off: '🔕 Tüm bildirimleri kapat',
            settings_updated: '✅ Güncellendi!',
            settings_all_off_done: '🔕 Tüm bildirimler kapatıldı!',
            lang_select_title: '🌐 <b>Dil Seçimi</b>',
            lang_select_desc: 'Botun dilini seçin:',
            lang_changed: '✅ Dil değiştirildi!',
            city_select_title: '📍 <b>Şehir Seçimi</b>',
            city_select_desc: 'Namaz vakitleri için şehri seçin:',
            city_changed: '✅ Şehir değiştirildi: {city}',
            country_select_title: '🌍 <b>Ülke Seçimi</b>',
            country_select_desc: 'Önce ülke seçin:',
            city_page_info: 'Sayfa {page}/{total}',
            dil_cmd_title: '🌐 <b>Dil Seçimi</b>',
            dil_cmd_desc: 'Botun dilini seçin:',
            weekly_order: 'Sıra: İmsak | Sabah | Öğle | İkindi | Akşam | Yatsı',
            monthly_header: 'Gün  Sabah Güneş Öğle  İknd  Akşm  Yatsı',
            ramadan_greet: '🌙 <b>Ramazan Mübarek!</b> ({day}. gün)',
            prayer_coming: '{emoji} <b>{prayer}</b> vaktine <b>{min} dakika</b> kaldı!',
            prayer_time: '🕌 <b>{prayer} vaktidir!</b>',
            iftar_30min: '🌙 <b>İftara 30 dakika kaldı!</b>',
            iftar_coming: '{emoji} 🌙 <b>İftara {min} dakika</b> kaldı!',
            imsak_coming: '{emoji} 🌙 <b>Sahura (İmsak) {min} dakika</b> kaldı!',
            iftar_time: '🌙🎉 <b>İFTAR VAKTİDİR!</b>',
            imsak_time: '🌙 <b>İMSAK VAKTİDİR!</b>',
            imsak_label: ' 🍽 Sahur',
            iftar_label: ' 🍽 İftar',
            accept_pray: '🤲 Allah kabul etsin!',
            accept_fast: '🤲 Allahım, orucumuzu kabul et!',
            morning_title: '🌄 Günaydın! Bugünkü Namaz Vakitleri',
            api_error: '⚠️ Namaz vakitleri alınırken hata oluştu. Lütfen biraz sonra tekrar deneyin.',
            more_title: '➕ <b>Ek Özellikler</b>',
            more_desc: 'Aşağıdaki butonları kullanın:',
            // Ramazan sayfası
            ramadan_calendar: 'Ramazan {year} Takvimi',
            ramadan_days_left: '⏳ Ramazan\'a <b>{days} gün</b> kaldı',
            ramadan_current_day: '📿 Ramazan\'ın <b>{day}. günü</b>',
            ramadan_ended: '🎉 Ramazan bitti — Bayramınız mübarek olsun!',
            ramadan_qadr_note: '⭐ = Kadir gecesi olasılığı',
            ramadan_no_data: '⚠️ {year} yılı için Ramazan tarihleri mevcut değil.',
            // Ramazan istatistik
            ramadan_stats_title: 'Ramazan {year} — Oruç İstatistiği',
            ramadan_today_day: '🌙 Bugün Ramazan\'ın <b>{day}. günüdür</b>',
            ramadan_fasted: '✅ Tutulan oruçlar: <b>{count}</b>',
            ramadan_missed: '❌ Tutulmayan günler: <b>{count}</b>',
            ramadan_unmarked: '⬜ Kaydedilmedi: <b>{count}</b>',
            ramadan_future: '🔲 Kalan günler: <b>{count}</b>',
            ramadan_completion: '📈 <b>Tamamlanma:</b>',
            ramadan_qaza_debt: '⚠️ <b>Kaza oruçları:</b> {count} gün',
            ramadan_achievements: '🏆 <b>Başarılar:</b>',
            ramadan_accept: '🤲 Allah oruçlarınızı kabul etsin!',
            ramadan_stats_label: '📊 <b>İstatistik:</b>',
            ramadan_fasted_count: '✅ {count} tutuldu',
            ramadan_missed_count: '❌ {count} tutulmadı',
            ramadan_unmarked_count: '⬜ {count} kaydedilmedi',
            ramadan_future_count: '🔲 {count} kaldı',
            // Ramazan butonlar
            btn_ramadan_cancel: 'İptal',
            btn_ramadan_prev: '◀️ Önceki',
            btn_ramadan_next: 'Sonraki ▶️',
            btn_ramadan_stats: '📊 İstatistik',
            btn_ramadan_dua: '🤲 Dua',
            btn_ramadan_calendar: '🌙 Ramazan Takvimi',
            // Oruç kayıtları
            fasting_cannot_mark: '⚠️ Bu gün için kaydedilemez!',
            fasting_marked_yes: '✅ {day}. gün: Oruç tutuldu!',
            fasting_marked_no: '❌ {day}. gün: Tutulmadı',
            fasting_cancelled: '🔄 {day}. gün: Kayıt iptal edildi',
            // /tarih komutu
            tarix_help_title: 'ℹ️ <b>Tarih komutu kullanımı:</b>',
            // Callback toastları
            toast_today: '📅 Bugün',
            toast_tomorrow: '📅 Yarın',
            toast_weekly: '📆 Haftalık',
            toast_monthly: '🗓 Aylık',
            toast_tesbeh: '📿 Tesbih',
            toast_qaza: '🕌 Kaza',
            // Günlük namaz takipçisi
            btn_namazlarim: '📋 Namazlarım',
            namazlarim_title: '📋 Bugünkü Namazlar',
            namazlarim_desc: 'Her namazı kıldıktan sonra ✅ basın.\nGün bittiğinde işaretlenmemiş namazlar kazaya düşer.',
            prayer_done: '✅ {prayer} kılındı!',
            prayer_undone: '↩️ {prayer} iptal edildi',
            namazlarim_alldone: '🎉 Tüm namazlar kılındı! Allah kabul etsin! 🤲',
            namazlarim_auto_qaza: '⚠️ Dün {count} namaz kazaya düştü.',
        },
    },
};

// Köməkçi lokalizasiya funksiyası
function t(key, lang) {
    const locale = LOCALES[lang] || LOCALES.az;
    return locale.ui[key] || LOCALES.az.ui[key] || key;
}

function getPrayerNames(lang) {
    return (LOCALES[lang] || LOCALES.az).prayer_names;
}

function getAllLabels(lang) {
    return (LOCALES[lang] || LOCALES.az).all_labels;
}

function getWeekdays(lang) {
    return (LOCALES[lang] || LOCALES.az).weekdays;
}

function getMonthsInput(lang) {
    return (LOCALES[lang] || LOCALES.az).months_input;
}

function getMonthsDisplay(lang) {
    return (LOCALES[lang] || LOCALES.az).months_display;
}

function getCityName(cityId, lang) {
    const city = CITIES[cityId] || CITIES.baku;
    return lang === 'tr' ? city.name_tr : city.name_az;
}

function getCityAuthority(cityId, lang) {
    const city = CITIES[cityId] || CITIES.baku;
    return lang === 'tr' ? city.authority_tr : city.authority_az;
}

// Backward compat aliases
const PRAYER_NAMES = LOCALES.az.prayer_names;

const ALL_LABELS = LOCALES.az.all_labels;

const NOTIFY_PRAYERS = ['imsak', 'subh', 'zohr', 'esr', 'meqrib', 'isha'];
const REMINDER_MINUTES = [15, 10, 5];
const DISPLAY_ORDER = ['imsak', 'subh', 'gunCixir', 'zohr', 'esr', 'gunBatir', 'meqrib', 'isha', 'gecaYarisi'];

// Həftənin gün adları (Azərbaycan dilində) — backward compat
const WEEKDAY_NAMES = LOCALES.az.weekdays;

// Ay adları (Azərbaycan dilində) — backward compat
const MONTH_NAMES_AZ = LOCALES.az.months_input;
const MONTH_NAMES_REVERSE = LOCALES.az.months_display;

// ─── Ramazan tarixləri (Miladi) ────────────────────────────────
// Hicri təqvim dəqiq hesablanması mürəkkəbdir, ona görə
// bilinen Ramazan tarixlərini əl ilə qeyd edirik.
// Hər il yenilənməlidir!
const RAMADAN_DATES = {
    2026: { start: { month: 2, day: 19 }, end: { month: 3, day: 19 } },
    2027: { start: { month: 2, day: 8 }, end: { month: 3, day: 8 } },
};

// Ramazan Hicri il məlumatları
const RAMADAN_HIJRI_YEAR = {
    2026: 1447,
    2027: 1448,
};

// Ramazan duaları
const RAMADAN_DUAS = {
    iftar: '🤲 <b>İftar Duası:</b>\n\n"Allahummə ləkə sumtu və bika aməntu və ələykə təvəkkəltu və alə rizkikə əftartu."\n\n<i>Mənası: Allahım! Sənin üçün oruc tutdum, Sənə iman gətirdim, Sənə təvəkkül etdim və Sənin ruzinlə orucumu açdım.</i>',
    imsak: '🤲 <b>Səhər (Niyyət) Duası:</b>\n\n"Nəvəytu ən əsumə sovmə şəhri Ramazanə minəl-fəcri iləl-mağribi xalisən lillahi təalə."\n\n<i>Mənası: Ramazan ayının orucunu sübhdən axşama qədər Allah rizası üçün tutmağa niyyət etdim.</i>',
    umumiDua: '🤲 <b>Ramazan Duası:</b>\n\n"Allahummə ədhilhu ələynə bil-əmni vəl-imani vəs-səlaməti vəl-islami və ridalləhi və rizvanihim."\n\n<i>Mənası: Allahım! Bu ayı bizə əmin-amanlıqla, imanla, salamatlıqla, İslamla, Sənin razılığınla daxil et.</i>',
};

const RAMADAN_DUAS_TR = {
    iftar: '🤲 <b>İftar Duası:</b>\n\n"Allahümme leke sumtü ve bike amentü ve aleyke tevekkeltü ve ala rızkıke eftartü."\n\n<i>Anlamı: Allahım! Senin için oruç tuttum, Sana iman ettim, Sana tevekkül ettim ve Senin rızkınla orucumu açtım.</i>',
    imsak: '🤲 <b>Sahur (Niyet) Duası:</b>\n\n"Neveytü en esume sevme şehri Ramazane minel-fecri ilel-mağribi halisen lillahi teala."\n\n<i>Anlamı: Ramazan ayının orucunu sabahtan akşama kadar Allah rızası için tutmaya niyet ettim.</i>',
    umumiDua: '🤲 <b>Ramazan Duası:</b>\n\n"Allahümme edhilhu aleyna bil-emni vel-imani ves-selameti vel-islami ve ridallahi ve ridvanih."\n\n<i>Anlamı: Allahım! Bu ayı bize emniyet, iman, selamet, İslam ve Senin rızan ile nasip et.</i>',
};

// Qadr gecəsi ehtimal olunan gecələr (Ramazanın tək gecələri)
const QADR_NIGHTS = [21, 23, 25, 27, 29];

// Gündəlik hədis/ayələr (30 gün üçün)
const RAMADAN_DAILY_QUOTES = [
    '"Ramazan ayı gəldikdə cənnətin qapıları açılar, cəhənnəmin qapıları bağlanar və şeytanlar zəncirlənər." (Buxari)',
    '"Kim iman edərək və mükafatını Allahdan gözləyərək Ramazan orucunu tutarsa, keçmiş günahları bağışlanar." (Buxari)',
    '"Oruclunun ağzının qoxusu, Allah yanında miskdən daha gözəldir." (Buxari)',
    '"Oruc bir qalxandır. Oruclu pis söz söyləməsin, cahillik etməsin." (Buxari)',
    '"Hər kimin Ramazandan bir günü ölümsüz gəlirsə, cənnətə girər." (Əhməd)',
    '"Cənnətdə Rəyyan adlı bir qapı var. Oruc tutanlar o qapıdan girəcəklər." (Buxari)',
    '"Allah buyurdu: Oruc Mənim üçündür, onun mükafatını Mən verəcəyəm." (Buxari)',
    '"Oruclu iki sevinc yaşar: biri iftar edərkən, digəri Rəbbinə qovuşarkən." (Muslim)',
    '"Sübh namazının ağırlığını hiss edən, gecə namazı ilə yüngülləşdirsin." (Tirmizi)',
    '"Ən yaxşı oruc tutanlar — dillərini qoruyanlar, qəlbləri təmiz olanlardır." (İbn Macə)',
    '"Quranı oxuyun! Çünki o, qiyamət günü sahiblərinə şəfaətçi olacaq." (Muslim)',
    '"Kim bir orucluya iftar etdirsə, onun savabı qədər savab alar." (Tirmizi)',
    '"Ramazan ayının ilk on günü rəhmət, ikinci on günü məğfirət, üçüncü on günü cəhənnəmdən qurtuluşdur."',
    '"Allahı zikr etmək qəlblərin şəfasıdır." (Beyhəqi)',
    '"Təravih namazını iman edərək və savabını Allahdan gözləyərək qılan, keçmiş günahlarından bağışlanar." (Buxari)',
    '"Sədəqə günahları söndürər, eynilə suyun odu söndürməsi kimi." (Tirmizi)',
    '"Ən fəzilətli sədəqə, Ramazan ayında verilən sədəqədir." (Tirmizi)',
    '"Allahım! Sən bağışlayansan, bağışlamağı sevirsən, məni bağışla!" (Tirmizi)',
    '"Quran bu ayda endirilmişdir. Onu çox oxuyun." (Bəqərə, 185)',
    '"Gecə namazı ən fəzilətli namazlardan biridir." (Muslim)',
    '"Qadr gecəsi min aydan xeyirlidir." (Qədr surəsi, 3)',
    '"Ey iman gətirənlər! Sizə oruc tutmaq fərz qılındı." (Bəqərə, 183)',
    '"Allahın yanında ən sevimli əməl, az da olsa davamlı olanıdır." (Buxari)',
    '"Səbr edənlərə mükafatları hesabsız veriləcəkdir." (Zumər, 10)',
    '"Qadr gecəsini Ramazanın son on günündə axtarın." (Buxari)',
    '"Dua ibadətin beynidir." (Tirmizi)',
    '"Qadr gecəsini iman edərək və savabını Allahdan gözləyərək keçirən, keçmiş günahlarından bağışlanar." (Buxari)',
    '"Orucu xurma ilə açın, tapmasanız su ilə açın." (Tirmizi)',
    '"Ramazan ayı səbr ayıdır, səbrin qarşılığı isə cənnətdir." (İbn Xüzeymə)',
    '"Ramazanı xeyir dua ilə bitirin, bayramı şükranlıqla qarşılayın."',
];

// Nailiyyətlər sistemi
const ACHIEVEMENTS = [
    { id: 'first', emoji: '🥇', name: 'İlk Oruc', name_tr: 'İlk Oruç', desc: 'İlk orucunu tutdun', desc_tr: 'İlk orucunu tuttun', check: (s) => s.fasted >= 1 },
    { id: 'streak3', emoji: '🔥', name: '3 Gün Ardıcıl', name_tr: '3 Gün Ard Arda', desc: '3 gün ardıcıl oruc', desc_tr: '3 gün ard arda oruç', check: (s) => s.maxStreak >= 3 },
    { id: 'streak7', emoji: '⚡', name: '7 Gün Ardıcıl', name_tr: '7 Gün Ard Arda', desc: '1 həftə ardıcıl oruc', desc_tr: '1 hafta ard arda oruç', check: (s) => s.maxStreak >= 7 },
    { id: 'half', emoji: '💪', name: 'Yarısı Tamam', name_tr: 'Yarısı Tamam', desc: '15 gün oruc tutdun', desc_tr: '15 gün oruç tuttun', check: (s) => s.fasted >= 15 },
    { id: 'full', emoji: '🏆', name: 'Tam Ramazan', name_tr: 'Tam Ramazan', desc: 'Bütün 30 günü tutdun', desc_tr: 'Tüm 30 günü tuttun', check: (s) => s.fasted >= 30 },
    { id: 'qadr', emoji: '⭐', name: 'Qadr Gecələri', name_tr: 'Kadir Geceleri', desc: 'Bütün Qadr gecələrində oruc', desc_tr: 'Tüm Kadir gecelerinde oruç', check: (s) => s.qadrFasted === 5 },
];

const MOTIVASIYA_MESAJLARI = [
    '💪 Ramazana güclü başladın! Davam et!',
    '🌟 İkinci gün — əzmkarlığın möhtəşəmdir!',
    '🔥 3 gün tamam! İlk sınaq keçildi!',
    '🎯 Hədəfə doğru irəliləyirsən, bravo!',
    '✨ 5 gün! Artıq ritm tutdun!',
    '💫 Yarısının yarısı tamam, davam!',
    '🌙 Bir həftə! Əla gedirsən!',
    '📈 Hər gün daha da güclüsən!',
    '🏃 Dayanma, hədəf yaxındır!',
    '🌟 10 gün! Üçdə biri tamam!',
    '💪 11-ci gün, əzmin möhkəmdir!',
    '🔥 Rəhmət günləri bitdi, bağışlanma günləri başlayır!',
    '🤲 Dualarını artır, qəbul vaxtıdır!',
    '💫 Yarıdan çox keçdin, geri dönmə yoxdur!',
    '⭐ 15 gün! Yarısı tamam! 🎉',
    '🌙 Son yarıya keçdin, güclü davam!',
    '🏆 17-ci gün, fəth yaxınlaşır!',
    '📿 Dua et, zikr et, şükr et!',
    '💪 19-cu gün, son 11 gün!',
    '⭐ 20 gün! Son onluğa daxil oldun!',
    '🌟 Qadr gecələri başlayır! İbadəti artır!',
    '🔥 22-ci gün, finişə az qalıb!',
    '⭐ Bu gecə Qadr gecəsi ola bilər!',
    '💫 24-cü gün, heyranlıq doğuran səbr!',
    '⭐ Qadr gecəsinə diqqət! 25-ci gün!',
    '🏃 Son 5 gün, sprint vaxtıdır!',
    '⭐ 27-ci gecə — ən ehtimallı Qadr gecəsi!',
    '💪 28-ci gün, demək olar ki bitdi!',
    '⭐ Son Qadr gecəsi ehtimalı!',
    '🏆 30-cu gün! TƏBRİKLƏR! Ramazan tamamlandı! 🎉',
];

const MOTIVASIYA_MESAJLARI_TR = [
    '💪 Ramazana güçlü başladın! Devam et!',
    '🌟 İkinci gün — azmin harika!',
    '🔥 3 gün tamam! İlk sınav geçildi!',
    '🎯 Hedefe doğru ilerliyorsun, bravo!',
    '✨ 5 gün! Artık ritmi yakaladın!',
    '💫 Yarı yolda, devam!',
    '🌙 Bir hafta! Harika gidiyorsun!',
    '📈 Her gün daha da güçlüsün!',
    '🏃 Durma, hedef yakın!',
    '🌟 10 gün! Üçte biri tamam!',
    '💪 11. gün, azmin sağlam!',
    '🔥 Rahmet günleri bitti, mağfiret günleri başlıyor!',
    '🤲 Dualarını artır, kabul vaktidir!',
    '💫 Yarıdan fazlası geçti, geri dönüş yok!',
    '⭐ 15 gün! Yarısı tamam! 🎉',
    '🌙 Son yarıya geçtin, güçlü devam!',
    '🏆 17. gün, zafer yaklaşıyor!',
    '📿 Dua et, zikir yap, şükret!',
    '💪 19. gün, son 11 gün!',
    '⭐ 20 gün! Son on güne girdin!',
    '🌟 Kadir geceleri başlıyor! İbadeti artır!',
    '🔥 22. gün, bitişe az kaldı!',
    '⭐ Bu gece Kadir gecesi olabilir!',
    '💫 24. gün, hayranlık uyandıran sabır!',
    '⭐ Kadir gecesine dikkat! 25. gün!',
    '🏃 Son 5 gün, sprint vakti!',
    '⭐ 27. gece — en olası Kadir gecesi!',
    '💪 28. gün, neredeyse bitti!',
    '⭐ Son Kadir gecesi olasılığı!',
    '🏆 30. gün! TEBRİKLER! Ramazan tamamlandı! 🎉',
];

// ─── Hicri Təqvim Çevirici (Kuwaiti Algorithm) ─────────────────
function gregorianToHijri(year, month, day) {
    const d = new Date(year, month - 1, day);
    const jd = Math.floor((d.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const lRem = l - 10631 * n + 354;
    const j = (Math.floor((10985 - lRem) / 5316)) * (Math.floor((50 * lRem) / 17719))
        + (Math.floor(lRem / 5670)) * (Math.floor((43 * lRem) / 15238));
    const lFinal = lRem - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50))
        - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const hMonth = Math.floor((24 * lFinal) / 709);
    const hDay = lFinal - Math.floor((709 * hMonth) / 24);
    const hYear = 30 * n + j - 30;
    return { year: hYear, month: hMonth, day: hDay };
}

const HIJRI_MONTH_NAMES = {
    1: 'Məhərrəm', 2: 'Səfər', 3: 'Rəbiüləvvəl', 4: 'Rəbiülaxır',
    5: 'Cəmadiyüləvvəl', 6: 'Cəmadiyülaxır', 7: 'Rəcəb', 8: 'Şaban',
    9: 'Ramazan', 10: 'Şəvval', 11: 'Zilqədə', 12: 'Zilhiccə',
};

function formatHijriDate(year, month, day, lang = 'az') {
    const h = gregorianToHijri(year, month, day);
    const names = lang === 'tr' ? HIJRI_MONTH_NAMES_TR : HIJRI_MONTH_NAMES;
    const mName = names[h.month] || `Ay ${h.month}`;
    return `${h.day} ${mName} ${h.year}`;
}

const HIJRI_MONTH_NAMES_TR = {
    1: 'Muharrem', 2: 'Safer', 3: 'Rebiülevvel', 4: 'Rebiülahir',
    5: 'Cemaziyeülevvel', 6: 'Cemaziyeülahir', 7: 'Recep', 8: 'Şaban',
    9: 'Ramazan', 10: 'Şevval', 11: 'Zilkade', 12: 'Zilhicce',
};

// ─── Genişləndirilmiş Hədis / Ayə Bazası (il boyu) ─────────────────
const EXTENDED_HADITH_DB = [
    '"Əməllər niyyətlərə görədir." (Buxari)',
    '"Müsəlman müsəlmanın qardaşıdır." (Buxari)',
    '"Gülər üzlə qarşılamaq da sədəqədir." (Tirmizi)',
    '"Ən xeyirliniz əxlaqı ən gözəl olanınızdır." (Buxari)',
    '"Güclü mömin zəif mömindən daha xeyirli və Allaha daha sevimlidir." (Muslim)',
    '"Kim Allaha və axirət gününə iman gətirirsə, ya xeyir danışsın, ya da sussun." (Buxari)',
    '"Qonşusu ac ikən tox yatan bizdən deyildir." (Buxari)',
    '"Heç biriniz özünə istədiyini qardaşına da istəmədikcə iman gətirmiş olmaz." (Buxari)',
    '"Dünya möminin zindanı, kafirin cənnətidir." (Muslim)',
    '"Elm öyrənmək hər müsəlmana fərzdir." (İbn Macə)',
    '"Təvazökarlıq göstərəni Allah ucaldar." (Muslim)',
    '"Ən yaxşı sədəqə elm öyrətməkdir." (İbn Macə)',
    '"Allahın ən sevdiyi əməl vaxtında qılınan namazdır." (Buxari)',
    '"Dua ibadətin beynidir." (Tirmizi)',
    '"Səbr imanın yarısıdır." (Beyhəqi)',
    '"Şükür edənin nemətini artıraram." (İbrahim, 7)',
    '"Zikr edənlə etməyən, diri ilə ölü kimidir." (Buxari)',
    '"Ana-ataya yaxşılıq — Allahın razılığıdır." (Tirmizi)',
    '"Qəzəblənmə!" (Buxari)',
    '"Kim bir çətinliyi aradan qaldırsa, Allah da onun çətinliyini aradan qaldırar." (Muslim)',
    '"Ruzini genişləndirmək istəyən, qohumluq əlaqəsini qorusun." (Buxari)',
    '"Ən çox istiğfar edənə Allah hər çətinlikdən çıxış yolu göstərər." (Əbu Davud)',
    '"Namazı tərk edən küfrlə arasındakı əhdi pozmuşdur." (Muslim)',
    '"Quran oxuyun, o sizə şəfaətçi olacaq." (Muslim)',
    '"Allahın rəhməti yaxındır." (Əraf, 56)',
    '"Əgər Allaha təvəkkül etsəydiniz, quşları ruziləndirdiyi kimi sizi də ruziləndirərdi." (Tirmizi)',
    '"Cənnət anaların ayaqları altındadır." (Nəsai)',
    '"İnsanlara təşəkkür etməyən Allaha şükür etməz." (Tirmizi)',
    '"Hər yaxşı əməl sədəqədir." (Buxari)',
    '"Yatmadan əvvəl Ayətəl-Kürsi oxuyana Allah qoruyucu göndərər." (Buxari)',
    '"Ən faydası olan elm — əməl edilən elmdir." (Əbu Davud)',
    '"Möminin niyyəti əməlindən xeyirlidir." (Təbərani)',
    '"Allah bir qulu sevəndə onu sınağa çəkər." (Tirmizi)',
    '"Dünyanı axirətin tarlası bilin." (Beyhəqi)',
    '"Kim gecə Bəqərə surəsinin son iki ayəsini oxusa, ona kifayət edər." (Buxari)',
    '"Allahdan cənnəti istəyin və cəhənnəmdən sığının." (Tirmizi)',
];

const EXTENDED_HADITH_DB_TR = [
    '"Ameller niyetlere göredir." (Buhari)',
    '"Müslüman müslümanın kardeşidir." (Buhari)',
    '"Güler yüzle karşılamak da sadakadır." (Tirmizi)',
    '"En hayırlınız ahlakı en güzel olanınızdır." (Buhari)',
    '"Güçlü mümin zayıf müminden daha hayırlı ve Allah\'a daha sevimlidir." (Müslim)',
    '"Kim Allah\'a ve ahiret gününe iman ediyorsa, ya hayır konuşsun ya da sussun." (Buhari)',
    '"Komşusu açken tok yatan bizden değildir." (Buhari)',
    '"Hiçbiriniz kendinize istediğinizi kardeşinize de istemedikçe iman etmiş olmaz." (Buhari)',
    '"Dünya müminin zindanı, kâfirin cennetidir." (Müslim)',
    '"İlim öğrenmek her müslümana farzdır." (İbn Mace)',
    '"Tevazu göstereni Allah yüceltir." (Müslim)',
    '"En hayırlı sadaka ilim öğretmektir." (İbn Mace)',
    '"Allah\'ın en sevdiği amel vaktinde kılınan namazdır." (Buhari)',
    '"Dua ibadetin özüdür." (Tirmizi)',
    '"Sabır imanın yarısıdır." (Beyhaki)',
    '"Şükredenlerin nimetini artırırım." (İbrahim, 7)',
    '"Zikir edenle etmeyen, diri ile ölü gibidir." (Buhari)',
    '"Anne-babaya iyilik — Allah\'ın rızasıdır." (Tirmizi)',
    '"Kızma!" (Buhari)',
    '"Kim bir sıkıntıyı giderirse, Allah da onun sıkıntısını giderir." (Müslim)',
    '"Rızkını genişletmek isteyen, akrabalık bağlarını korusun." (Buhari)',
    '"En çok istigfar edene Allah her zorluktan çıkış yolu gösterir." (Ebu Davud)',
    '"Namazı terk eden küfürle arasındaki ahdi bozmuştur." (Müslim)',
    '"Kuran okuyun, o size şefaatçi olacaktır." (Müslim)',
    '"Allah\'ın rahmeti yakındır." (Araf, 56)',
    '"Eğer Allah\'a tevekkul etseydiniz, kuşları rızıklandırdığı gibi sizi de rızıklandırırdı." (Tirmizi)',
    '"Cennet annelerin ayakları altındadır." (Nesai)',
    '"İnsanlara teşekkür etmeyen Allah\'a şükretmez." (Tirmizi)',
    '"Her iyi amel sadakadır." (Buhari)',
    '"Yatmadan önce Ayetel-Kürsi okuyana Allah koruyucu gönderir." (Buhari)',
    '"En faydalı ilim — amel edilen ilimdir." (Ebu Davud)',
    '"Müminin niyeti amelinden hayırlıdır." (Taberani)',
    '"Allah bir kulunu sevdiğinde onu sınava çeker." (Tirmizi)',
    '"Dünyayı ahiretin tarlası bilin." (Beyhaki)',
    '"Kim gece Bakara suresinin son iki ayetini okursa, ona yeter." (Buhari)',
    '"Allah\'tan cenneti isteyin ve cehennemden sığının." (Tirmizi)',
];

// Türkcə Ramazan günlük ayələr/hədislər
const RAMADAN_DAILY_QUOTES_TR = [
    '"Ramazan ayı geldiğinde cennetin kapıları açılır, cehennem kapıları kapanır ve şeytanlar zincirlenir." (Buhari)',
    '"Kim iman ederek ve mükafatını Allah\'tan bekleyerek Ramazan orucunu tutarsa, geçmiş günahları bağışlanır." (Buhari)',
    '"Oruçlunun ağzının kokusu, Allah katında miskten daha güzeldir." (Buhari)',
    '"Oruç bir kalkandır. Oruçlu kötü söz söylemesin, cahillik etmesin." (Buhari)',
    '"Her kimin Ramazan\'dan bir günü ölümsüz gelirse, cennete girer." (Ahmed)',
    '"Cennette Reyyan adlı bir kapı vardır. Oruç tutanlar o kapıdan gireceklerdir." (Buhari)',
    '"Allah buyurdu: Oruç Benim içindir, onun mükafatını Ben vereceğim." (Buhari)',
    '"Oruçlu iki sevinç yaşar: biri iftar ederken, diğeri Rabbine kavuşurken." (Müslim)',
    '"Sabah namazının ağırlığını hisseden, gece namazı ile hafifletsin." (Tirmizi)',
    '"En iyi oruç tutanlar — dillerini koruyanlar, kalpleri temiz olanlardır." (İbn Mace)',
    '"Kuran\'ı okuyun! Çünkü o, kıyamet günü sahiplerine şefaatçi olacaktır." (Müslim)',
    '"Kim bir oruçluya iftar ettirirse, onun sevabı kadar sevap alır." (Tirmizi)',
    '"Ramazan ayının ilk on günü rahmet, ikinci on günü mağfiret, üçüncü on günü cehennemden kurtuluştur."',
    '"Allah\'ı zikretmek kalplerin şifasıdır." (Beyhaki)',
    '"Teravih namazını iman ederek ve sevabını Allah\'tan bekleyerek kılan, geçmiş günahlarından bağışlanır." (Buhari)',
    '"Sadaka günahları söndürür, tıpkı suyun ateşi söndürmesi gibi." (Tirmizi)',
    '"En faziletli sadaka, Ramazan ayında verilen sadakadır." (Tirmizi)',
    '"Allahım! Sen bağışlayansın, bağışlamayı seversin, beni bağışla!" (Tirmizi)',
    '"Kuran bu ayda indirilmiştir. Onu çok okuyun." (Bakara, 185)',
    '"Gece namazı en faziletli namazlardan biridir." (Müslim)',
    '"Kadir gecesi bin aydan hayırlıdır." (Kadr suresi, 3)',
    '"Ey iman edenler! Size oruç tutmak farz kılındı." (Bakara, 183)',
    '"Allah katında en sevimli amel, az da olsa devamlı olanıdır." (Buhari)',
    '"Sabır edenlere mükafatları hesapsız verilecektir." (Zümer, 10)',
    '"Kadir gecesini Ramazan\'ın son on gününde arayın." (Buhari)',
    '"Dua ibadetin özüdür." (Tirmizi)',
    '"Kadir gecesini iman ederek ve sevabını Allah\'tan bekleyerek geçiren, geçmiş günahlarından bağışlanır." (Buhari)',
    '"Orucu hurma ile açın, bulamazsanız su ile açın." (Tirmizi)',
    '"Ramazan ayı sabır ayıdır, sabrın karşılığı ise cennettir." (İbn Huzeyme)',
    '"Ramazan\'ı hayır dua ile bitirin, bayramı şükranla karşılayın."',
];

// Dile göre Ramadan quote getir
function getRamadanQuote(index, lang = 'az') {
    const arr = lang === 'tr' ? RAMADAN_DAILY_QUOTES_TR : RAMADAN_DAILY_QUOTES;
    return arr[index % arr.length];
}

// Dile göre hadis getir
function getHadith(index, lang = 'az') {
    const all = lang === 'tr'
        ? [...RAMADAN_DAILY_QUOTES_TR, ...EXTENDED_HADITH_DB_TR]
        : [...RAMADAN_DAILY_QUOTES, ...EXTENDED_HADITH_DB];
    return all[index % all.length];
}

// ─── Zikr (Təsbeh) Sayğac Konfiqurasiyası ──────────────────────
const ZIKR_ITEMS = [
    { id: 'subhanallah', label: 'سُبْحَانَ ٱللَّـهِ', name: 'SubhanAllah', name_tr: 'Sübhanallah', target: 33 },
    { id: 'alhamdulillah', label: 'ٱلْحَمْدُ لِلَّـهِ', name: 'Əlhəmdulillah', name_tr: 'Elhamdülillah', target: 33 },
    { id: 'allahuakbar', label: 'ٱللَّـهُ أَكْبَرُ', name: 'Allahu Əkbər', name_tr: 'Allahuekber', target: 34 },
    { id: 'lailahaillallah', label: 'لَا إِلَـهَ إِلَّا ٱللَّـهُ', name: 'La iləhə illəllah', name_tr: 'La ilahe illallah', target: 100 },
    { id: 'istigfar', label: 'أَسْتَغْفِرُ ٱللَّـهَ', name: 'Əstağfirullah', name_tr: 'Estağfirullah', target: 100 },
    { id: 'salavat', label: 'صَلِّ عَلَى مُحَمَّدٍ', name: 'Salavat', name_tr: 'Salavat', target: 100 },
];

const ZIKR_ITEMS_TR = [
    { id: 'subhanallah', label: 'سُبْحَانَ ٱللَّٰهِ', name: 'Sübhanallah', target: 33 },
    { id: 'alhamdulillah', label: 'ٱلْحَمْدُ لِلَّٰهِ', name: 'Elhamdülillah', target: 33 },
    { id: 'allahuakbar', label: 'ٱللَّٰهُ أَكْبَرُ', name: 'Allahuekber', target: 34 },
    { id: 'lailahaillallah', label: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', name: 'La ilahe illallah', target: 100 },
    { id: 'istigfar', label: 'أَسْتَغْفِرُ ٱللَّٰهَ', name: 'Estağfirullah', target: 100 },
    { id: 'salavat', label: 'صَلِّ عَلَى مُحَمَّدٍ', name: 'Salavat', target: 100 },
];

// ─── Qəza Namazı Konfiqurasiyası ────────────────────────────────
const QEZA_PRAYERS = [
    { id: 'subh', name: '🌅 Sübh', name_tr: '🌅 Sabah' },
    { id: 'zohr', name: '☀️ Zöhr', name_tr: '☀️ Öğle' },
    { id: 'esr', name: '🌤️ Əsr', name_tr: '🌤️ İkindi' },
    { id: 'meqrib', name: '🌇 Məğrib', name_tr: '🌇 Akşam' },
    { id: 'isha', name: '🌃 İşa', name_tr: '🌃 Yatsı' },
    { id: 'vitr', name: '🌙 Vitr', name_tr: '🌙 Vitir' },
];

// ─── 2026 Dini Günlər Təqvimi ──────────────────────────────────
const RELIGIOUS_DAYS_2026 = [
    { date: '2025-12-21', name: '🌙 Rəcəb ayının başlanğıcı', name_tr: '🌙 Recep ayının başlangıcı', desc: 'Üç mübarək ayın birincisi (1 Rəcəb 1447)', desc_tr: 'Üç mübarek ayın birincisi (1 Recep 1447)' },
    { date: '2025-12-25', name: '✨ Rəğaib gecəsi', name_tr: '✨ Regaip gecesi', desc: 'Rəcəb ayının ilk cümə gecəsi (5 Rəcəb)', desc_tr: 'Recep ayının ilk cuma gecesi (5 Recep)' },
    { date: '2026-01-16', name: '⭐ Merac Gecəsi (Rəcəb 27)', name_tr: '⭐ Miraç Gecesi (Recep 27)', desc: 'Peyğəmbərin (s.ə.s.) Meraca yüksəldiyi gecə', desc_tr: 'Peygamber\'in (s.a.v.) Miraca yükseldiği gece' },
    { date: '2026-01-20', name: '🌙 Şaban ayının başlanğıcı', name_tr: '🌙 Şaban ayının başlangıcı', desc: 'Ramazandan əvvəlki ay (1 Şaban 1447)', desc_tr: 'Ramazan\'dan önceki ay (1 Şaban 1447)' },
    { date: '2026-02-03', name: '⭐ Bərat Gecəsi (Şaban 15)', name_tr: '⭐ Berat Gecesi (Şaban 15)', desc: 'Bağışlanma gecəsi', desc_tr: 'Bağışlanma gecesi' },
    { date: '2026-02-19', name: '🌙 Ramazan başlanğıcı', name_tr: '🌙 Ramazan başlangıcı', desc: '1447 Hicri — Oruc ayı', desc_tr: '1447 Hicri — Oruç ayı' },
    { date: '2026-03-08', name: '⭐ Qadr Gecəsi (21-ci gecə)', name_tr: '⭐ Kadir Gecesi (21. gece)', desc: 'Ehtimal olunan Qadr gecələrindən biri', desc_tr: 'Muhtemel Kadir gecelerinden biri' },
    { date: '2026-03-10', name: '⭐ Qadr Gecəsi (23-cü gecə)', name_tr: '⭐ Kadir Gecesi (23. gece)', desc: 'Ehtimal olunan Qadr gecələrindən biri', desc_tr: 'Muhtemel Kadir gecelerinden biri' },
    { date: '2026-03-12', name: '⭐ Qadr Gecəsi (25-ci gecə)', name_tr: '⭐ Kadir Gecesi (25. gece)', desc: 'Ehtimal olunan Qadr gecələrindən biri', desc_tr: 'Muhtemel Kadir gecelerinden biri' },
    { date: '2026-03-16', name: '⭐ Qadr Gecəsi (27-ci gecə)', name_tr: '⭐ Kadir Gecesi (27. gece)', desc: 'Ən ehtimallı Qadr gecəsi — min aydan xeyirli', desc_tr: 'En muhtemel Kadir gecesi — bin aydan hayırlı' },
    { date: '2026-03-20', name: '🎉 Ramazan Bayramı (1-ci gün)', name_tr: '🎉 Ramazan Bayramı (1. gün)', desc: 'Fitr bayramı — rəsmi qeyri-iş günü', desc_tr: 'Ramazan Bayramı — resmi tatil günü' },
    { date: '2026-03-21', name: '🎉 Ramazan Bayramı (2-ci gün)', name_tr: '🎉 Ramazan Bayramı (2. gün)', desc: 'Fitr bayramı — rəsmi qeyri-iş günü', desc_tr: 'Ramazan Bayramı — resmi tatil günü' },
    { date: '2026-05-26', name: '🕋 Ərəfə günü', name_tr: '🕋 Arefe günü', desc: 'Qurban bayramı ərəfəsi — oruc tutmaq savablıdır', desc_tr: 'Kurban bayramı arefesi — oruç tutmak sevaptır' },
    { date: '2026-05-27', name: '🐑 Qurban Bayramı (1-ci gün)', name_tr: '🐑 Kurban Bayramı (1. gün)', desc: 'Zülhiccə 10 — rəsmi qeyri-iş günü', desc_tr: 'Zilhicce 10 — resmi tatil günü' },
    { date: '2026-05-28', name: '🐑 Qurban Bayramı (2-ci gün)', name_tr: '🐑 Kurban Bayramı (2. gün)', desc: 'Təşriq günləri — rəsmi qeyri-iş günü', desc_tr: 'Teşrik günleri — resmi tatil günü' },
    { date: '2026-06-16', name: '☪️ Hicri Yeni İl (1448)', name_tr: '☪️ Hicri Yeni Yıl (1448)', desc: 'Məhərrəm ayının başlanğıcı', desc_tr: 'Muharrem ayının başlangıcı' },
    { date: '2026-06-25', name: '📿 Aşura Günü (Məhərrəm 10)', name_tr: '📿 Aşure Günü (Muharrem 10)', desc: 'Hz. Hüseynin şəhadəti — oruc tutmaq savablıdır', desc_tr: 'Hz. Hüseyin\'in şehadeti — oruç tutmak sevaptır' },
    { date: '2026-08-25', name: '🕌 Mövlud Gecəsi', name_tr: '🕌 Mevlit Gecesi', desc: 'Peyğəmbərin (s.ə.s.) doğum gecəsi (12 Rəbiül-əvvəl)', desc_tr: 'Peygamber\'in (s.a.v.) doğum gecesi (12 Rebiülevvel)' },
];

// Azərbaycan transkripsiyasini Türkcəyə çevir
function azToTrTranscript(azName) {
    return azName
        .replace(/Ə/g, 'E').replace(/ə/g, 'e')
        .replace(/X/g, 'H').replace(/x/g, 'h')
        .replace(/Q/g, 'K').replace(/q/g, 'k');
}

// ─── Əsma-ül Hüsna (Allahın 99 Adı) ──────────────────────────
const ASMA_UL_HUSNA = [
    { num: 1, ar: 'ٱللَّٰهُ', az: 'Allah', meaning: 'Yeganə ilah, hər şeyin yaradanı', meaning_tr: 'Tek ilah, her şeyin yaratıcısı' },
    { num: 2, ar: 'ٱلرَّحْمَٰنُ', az: 'Ər-Rəhman', meaning: 'Sonsuz mərhəmət sahibi', meaning_tr: 'Sonsuz merhamet sahibi' },
    { num: 3, ar: 'ٱلرَّحِيمُ', az: 'Ər-Rəhim', meaning: 'Əbədi rəhm edən', meaning_tr: 'Ebedi merhamet eden' },
    { num: 4, ar: 'ٱلْمَلِكُ', az: 'Əl-Məlik', meaning: 'Mütləq hökmdarlıq sahibi', meaning_tr: 'Mutlak hükümdar' },
    { num: 5, ar: 'ٱلْقُدُّوسُ', az: 'Əl-Quddus', meaning: 'Hər nöqsandan uzaq olan', meaning_tr: 'Her kusurdan uzak olan' },
    { num: 6, ar: 'ٱلسَّلَامُ', az: 'Əs-Salam', meaning: 'Salamatlıq verən', meaning_tr: 'Selam veren, esenlik kaynağı' },
    { num: 7, ar: 'ٱلْمُؤْمِنُ', az: 'Əl-Mömin', meaning: 'Əmin-amanlıq bəxş edən', meaning_tr: 'Güven ve emniyet veren' },
    { num: 8, ar: 'ٱلْمُهَيْمِنُ', az: 'Əl-Müheymin', meaning: 'Hər şeyi nəzarət edən', meaning_tr: 'Her şeyi gözetip koruyan' },
    { num: 9, ar: 'ٱلْعَزِيزُ', az: 'Əl-Əziz', meaning: 'Yenilməz qüdrət sahibi', meaning_tr: 'Yenilmez kudret sahibi' },
    { num: 10, ar: 'ٱلْجَبَّارُ', az: 'Əl-Cəbbar', meaning: 'İradəsini hər şeyə keçirən', meaning_tr: 'İradesini her şeye geçiren' },
    { num: 11, ar: 'ٱلْمُتَكَبِّرُ', az: 'Əl-Mütəkəbbir', meaning: 'Uca və böyük olan', meaning_tr: 'Yüce ve büyük olan' },
    { num: 12, ar: 'ٱلْخَالِقُ', az: 'Əl-Xaliq', meaning: 'Hər şeyin yaradıcısı', meaning_tr: 'Her şeyin yaratıcısı' },
    { num: 13, ar: 'ٱلْبَارِئُ', az: 'Əl-Bari', meaning: 'Varlıqları nöqsansız yaradan', meaning_tr: 'Varlıkları kusursuz yaratan' },
    { num: 14, ar: 'ٱلْمُصَوِّرُ', az: 'Əl-Musavvir', meaning: 'Surət verən, şəkil yaradan', meaning_tr: 'Suret veren, şekil yaratan' },
    { num: 15, ar: 'ٱلْغَفَّارُ', az: 'Əl-Ğəffar', meaning: 'Çox bağışlayan', meaning_tr: 'Çok bağışlayan' },
    { num: 16, ar: 'ٱلْقَهَّارُ', az: 'Əl-Qəhhar', meaning: 'Hər şeyə qalib gələn', meaning_tr: 'Her şeye galip gelen' },
    { num: 17, ar: 'ٱلْوَهَّابُ', az: 'Əl-Vəhhab', meaning: 'Qarşılıqsız verən', meaning_tr: 'Karşılıksız veren' },
    { num: 18, ar: 'ٱلرَّزَّاقُ', az: 'Ər-Rəzzaq', meaning: 'Ruzi verən', meaning_tr: 'Rızık veren' },
    { num: 19, ar: 'ٱلْفَتَّاحُ', az: 'Əl-Fəttah', meaning: 'Hər şeyi açan', meaning_tr: 'Her şeyi açan' },
    { num: 20, ar: 'ٱلْعَلِيمُ', az: 'Əl-Əlim', meaning: 'Hər şeyi bilən', meaning_tr: 'Her şeyi bilen' },
    { num: 21, ar: 'ٱلْقَابِضُ', az: 'Əl-Qabid', meaning: 'Daraldan, sıxan', meaning_tr: 'Daraltıp sıkan' },
    { num: 22, ar: 'ٱلْبَاسِطُ', az: 'Əl-Basit', meaning: 'Genişlədən, bollaşdıran', meaning_tr: 'Genişletip bollaştıran' },
    { num: 23, ar: 'ٱلْخَافِضُ', az: 'Əl-Xafid', meaning: 'Alçaldan', meaning_tr: 'Alçaltan' },
    { num: 24, ar: 'ٱلرَّافِعُ', az: 'Ər-Rafi', meaning: 'Yüksəldən', meaning_tr: 'Yükselten' },
    { num: 25, ar: 'ٱلْمُعِزُّ', az: 'Əl-Müizz', meaning: 'İzzət verən, şərəfləndirən', meaning_tr: 'İzzet veren, şereflendiren' },
    { num: 26, ar: 'ٱلْمُذِلُّ', az: 'Əl-Müzill', meaning: 'Zəlil edən', meaning_tr: 'Zelil eden' },
    { num: 27, ar: 'ٱلسَّمِيعُ', az: 'Əs-Səmi', meaning: 'Hər şeyi eşidən', meaning_tr: 'Her şeyi işiten' },
    { num: 28, ar: 'ٱلْبَصِيرُ', az: 'Əl-Basir', meaning: 'Hər şeyi görən', meaning_tr: 'Her şeyi gören' },
    { num: 29, ar: 'ٱلْحَكَمُ', az: 'Əl-Hakəm', meaning: 'Hökm verən, hakim', meaning_tr: 'Hüküm veren, hakim' },
    { num: 30, ar: 'ٱلْعَدْلُ', az: 'Əl-Adl', meaning: 'Mütləq ədalətli', meaning_tr: 'Mutlak adil' },
    { num: 31, ar: 'ٱللَّطِيفُ', az: 'Əl-Lətif', meaning: 'Lütf sahibi, incəlik edən', meaning_tr: 'Lütuf sahibi, incelik eden' },
    { num: 32, ar: 'ٱلْخَبِيرُ', az: 'Əl-Xəbir', meaning: 'Hər şeydən xəbərdar olan', meaning_tr: 'Her şeyden haberdar olan' },
    { num: 33, ar: 'ٱلْحَلِيمُ', az: 'Əl-Həlim', meaning: 'Səbirli, yumuşaq davranan', meaning_tr: 'Sabırlı, yumuşak davranan' },
    { num: 34, ar: 'ٱلْعَظِيمُ', az: 'Əl-Azim', meaning: 'Sonsuz böyüklük sahibi', meaning_tr: 'Sonsuz büyüklük sahibi' },
    { num: 35, ar: 'ٱلْغَفُورُ', az: 'Əl-Ğəfur', meaning: 'Bağışlaması bol olan', meaning_tr: 'Bağışlaması bol olan' },
    { num: 36, ar: 'ٱلشَّكُورُ', az: 'Əş-Şəkur', meaning: 'Az əmələ çox savab verən', meaning_tr: 'Az amele çok sevap veren' },
    { num: 37, ar: 'ٱلْعَلِيُّ', az: 'Əl-Əliyy', meaning: 'Ən uca, ən yüksək', meaning_tr: 'En yüce, en yüksek' },
    { num: 38, ar: 'ٱلْكَبِيرُ', az: 'Əl-Kəbir', meaning: 'Böyüklükdə sonsuz', meaning_tr: 'Büyüklükte sonsuz' },
    { num: 39, ar: 'ٱلْحَفِيظُ', az: 'Əl-Hafiz', meaning: 'Hər şeyi qoruyan', meaning_tr: 'Her şeyi koruyan' },
    { num: 40, ar: 'ٱلْمُقِيتُ', az: 'Əl-Muqit', meaning: 'Qoruyub bəsləyən', meaning_tr: 'Koruyup besleyen' },
    { num: 41, ar: 'ٱلْحَسِيبُ', az: 'Əl-Hasib', meaning: 'Hesaba çəkən', meaning_tr: 'Hesaba çeken' },
    { num: 42, ar: 'ٱلْجَلِيلُ', az: 'Əl-Cəlil', meaning: 'Cəlal sahibi, heybətli', meaning_tr: 'Celal sahibi, heybetli' },
    { num: 43, ar: 'ٱلْكَرِيمُ', az: 'Əl-Kərim', meaning: 'Kərəm sahibi, əsirgəməyən', meaning_tr: 'Kerem sahibi, esirgemez' },
    { num: 44, ar: 'ٱلرَّقِيبُ', az: 'Ər-Rəqib', meaning: 'Hər şeyi müşahidə edən', meaning_tr: 'Her şeyi gözlemleyen' },
    { num: 45, ar: 'ٱلْمُجِيبُ', az: 'Əl-Mücib', meaning: 'Duaları qəbul edən', meaning_tr: 'Duaları kabul eden' },
    { num: 46, ar: 'ٱلْوَاسِعُ', az: 'Əl-Vasi', meaning: 'Rəhməti geniş olan', meaning_tr: 'Rahmeti geniş olan' },
    { num: 47, ar: 'ٱلْحَكِيمُ', az: 'Əl-Həkim', meaning: 'Hikmət sahibi', meaning_tr: 'Hikmet sahibi' },
    { num: 48, ar: 'ٱلْوَدُودُ', az: 'Əl-Vədud', meaning: 'Çox sevən, sevdirən', meaning_tr: 'Çok seven, sevdiren' },
    { num: 49, ar: 'ٱلْمَجِيدُ', az: 'Əl-Məcid', meaning: 'Şərəf və izzət sahibi', meaning_tr: 'Şeref ve izzet sahibi' },
    { num: 50, ar: 'ٱلْبَاعِثُ', az: 'Əl-Bais', meaning: 'Ölüləri dirildən', meaning_tr: 'Ölüleri dirilten' },
    { num: 51, ar: 'ٱلشَّهِيدُ', az: 'Əş-Şəhid', meaning: 'Hər şeyə şahid olan', meaning_tr: 'Her şeye şahit olan' },
    { num: 52, ar: 'ٱلْحَقُّ', az: 'Əl-Haqq', meaning: 'Varlığı mütləq həqiqi olan', meaning_tr: 'Varlığı mutlak gerçek olan' },
    { num: 53, ar: 'ٱلْوَكِيلُ', az: 'Əl-Vəkil', meaning: 'Güvənilən, vəkil olan', meaning_tr: 'Güvenilen, vekil olan' },
    { num: 54, ar: 'ٱلْقَوِيُّ', az: 'Əl-Qaviyy', meaning: 'Sonsuz güc sahibi', meaning_tr: 'Sonsuz güç sahibi' },
    { num: 55, ar: 'ٱلْمَتِينُ', az: 'Əl-Mətin', meaning: 'Çox möhkəm, sarsılmaz', meaning_tr: 'Çok sağlam, sarsılmaz' },
    { num: 56, ar: 'ٱلْوَلِيُّ', az: 'Əl-Vəliyy', meaning: 'Dost, yardımçı', meaning_tr: 'Dost, yardımcı' },
    { num: 57, ar: 'ٱلْحَمِيدُ', az: 'Əl-Həmid', meaning: 'Tərifə layiq olan', meaning_tr: 'Övgüye layık olan' },
    { num: 58, ar: 'ٱلْمُحْصِي', az: 'Əl-Muhsi', meaning: 'Hər şeyi sayan', meaning_tr: 'Her şeyi sayan' },
    { num: 59, ar: 'ٱلْمُبْدِئُ', az: 'Əl-Mubdi', meaning: 'Yoxdan var edən', meaning_tr: 'Yoktan var eden' },
    { num: 60, ar: 'ٱلْمُعِيدُ', az: 'Əl-Muid', meaning: 'Yenidən yaradan', meaning_tr: 'Yeniden yaratan' },
    { num: 61, ar: 'ٱلْمُحْيِي', az: 'Əl-Muhyi', meaning: 'Can verən, dirildən', meaning_tr: 'Can veren, dirilten' },
    { num: 62, ar: 'ٱلْمُمِيتُ', az: 'Əl-Mumit', meaning: 'Ölümü yaradan', meaning_tr: 'Ölümü yaratan' },
    { num: 63, ar: 'ٱلْحَيُّ', az: 'Əl-Hayy', meaning: 'Əbədi diri olan', meaning_tr: 'Ebedi diri olan' },
    { num: 64, ar: 'ٱلْقَيُّومُ', az: 'Əl-Qayyum', meaning: 'Hər şeyi ayaqda tutan', meaning_tr: 'Her şeyi ayakta tutan' },
    { num: 65, ar: 'ٱلْوَاجِدُ', az: 'Əl-Vacid', meaning: 'İstədiyini tapan', meaning_tr: 'İstediğini bulan' },
    { num: 66, ar: 'ٱلْمَاجِدُ', az: 'Əl-Macid', meaning: 'Şanı uca olan', meaning_tr: 'Şanı yüce olan' },
    { num: 67, ar: 'ٱلْوَاحِدُ', az: 'Əl-Vahid', meaning: 'Tək olan', meaning_tr: 'Tek olan' },
    { num: 68, ar: 'ٱلصَّمَدُ', az: 'Əs-Saməd', meaning: 'Heç nəyə möhtac olmayan', meaning_tr: 'Hiçbir şeye muhtaç olmayan' },
    { num: 69, ar: 'ٱلْقَادِرُ', az: 'Əl-Qadir', meaning: 'Hər şeyə gücü çatan', meaning_tr: 'Her şeye gücü yeten' },
    { num: 70, ar: 'ٱلْمُقْتَدِرُ', az: 'Əl-Muqtədir', meaning: 'Qüdrəti sonsuz olan', meaning_tr: 'Kudreti sonsuz olan' },
    { num: 71, ar: 'ٱلْمُقَدِّمُ', az: 'Əl-Muqaddim', meaning: 'İstədiyini öndə edən', meaning_tr: 'İstediğini önde eden' },
    { num: 72, ar: 'ٱلْمُؤَخِّرُ', az: 'Əl-Muaxxir', meaning: 'İstədiyini geri buraxan', meaning_tr: 'İstediğini geri bırakan' },
    { num: 73, ar: 'ٱلْأَوَّلُ', az: 'Əl-Əvvəl', meaning: 'Başlanğıcı olmayan, ilk', meaning_tr: 'Başlangıcı olmayan, ilk' },
    { num: 74, ar: 'ٱلْآخِرُ', az: 'Əl-Axir', meaning: 'Sonu olmayan, son', meaning_tr: 'Sonu olmayan, son' },
    { num: 75, ar: 'ٱلظَّاهِرُ', az: 'Əz-Zahir', meaning: 'Varlığı aşkar olan', meaning_tr: 'Varlığı açık olan' },
    { num: 76, ar: 'ٱلْبَاطِنُ', az: 'Əl-Batin', meaning: 'Gizli, dərk olunmayan', meaning_tr: 'Gizli, anlaşılmaz' },
    { num: 77, ar: 'ٱلْوَالِي', az: 'Əl-Vali', meaning: 'Hər şeyi idarə edən', meaning_tr: 'Her şeyi idare eden' },
    { num: 78, ar: 'ٱلْمُتَعَالِي', az: 'Əl-Mütəali', meaning: 'Uca, hər şeydən yüksək', meaning_tr: 'Yüce, her şeyden yüksek' },
    { num: 79, ar: 'ٱلْبَرُّ', az: 'Əl-Bərr', meaning: 'İyilik və lütf sahibi', meaning_tr: 'İyilik ve lütuf sahibi' },
    { num: 80, ar: 'ٱلتَّوَّابُ', az: 'Ət-Təvvab', meaning: 'Tövbələri çox qəbul edən', meaning_tr: 'Tevbeleri çok kabul eden' },
    { num: 81, ar: 'ٱلْمُنْتَقِمُ', az: 'Əl-Müntəqim', meaning: 'Ədalətlə cəzalandıran', meaning_tr: 'Adaletle cezalandıran' },
    { num: 82, ar: 'ٱلْعَفُوُّ', az: 'Əl-Afuvv', meaning: 'Affı çox olan', meaning_tr: 'Affı çok olan' },
    { num: 83, ar: 'ٱلرَّؤُوفُ', az: 'Ər-Rauf', meaning: 'Çox şəfqətli', meaning_tr: 'Çok şefkatli' },
    { num: 84, ar: 'مَالِكُ ٱلْمُلْكِ', az: 'Malikül-Mülk', meaning: 'Mülkün mütləq sahibi', meaning_tr: 'Mülkün mutlak sahibi' },
    { num: 85, ar: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ', az: 'Zül-Cəlali vəl-İkram', meaning: 'Cəlal və kərəm sahibi', meaning_tr: 'Celal ve kerem sahibi' },
    { num: 86, ar: 'ٱلْمُقْسِطُ', az: 'Əl-Muqsit', meaning: 'Ədalətlə hökm edən', meaning_tr: 'Adaletle hükmeden' },
    { num: 87, ar: 'ٱلْجَامِعُ', az: 'Əl-Cami', meaning: 'Bir araya gətirən, toplayan', meaning_tr: 'Bir araya getiren, toplayan' },
    { num: 88, ar: 'ٱلْغَنِيُّ', az: 'Əl-Ğaniyy', meaning: 'Heç nəyə ehtiyacı olmayan', meaning_tr: 'Hiçbir şeye ihtiyacı olmayan' },
    { num: 89, ar: 'ٱلْمُغْنِي', az: 'Əl-Muğni', meaning: 'Zənginləşdirən', meaning_tr: 'Zenginleştiren' },
    { num: 90, ar: 'ٱلْمَانِعُ', az: 'Əl-Mani', meaning: 'İstəmədiyi şeyə mane olan', meaning_tr: 'İstemediği şeye mani olan' },
    { num: 91, ar: 'ٱلضَّارُّ', az: 'Əd-Darr', meaning: 'Zərər verən (imtahan üçün)', meaning_tr: 'Zarar veren (imtihan için)' },
    { num: 92, ar: 'ٱلنَّافِعُ', az: 'Ən-Nafi', meaning: 'Fayda verən', meaning_tr: 'Fayda veren' },
    { num: 93, ar: 'ٱلنُّورُ', az: 'Ən-Nur', meaning: 'Aləmləri nurlandıran', meaning_tr: 'Alemleri nurlandıran' },
    { num: 94, ar: 'ٱلْهَادِي', az: 'Əl-Hadi', meaning: 'Hidayətə çatdıran', meaning_tr: 'Hidayete erdiren' },
    { num: 95, ar: 'ٱلْبَدِيعُ', az: 'Əl-Bədi', meaning: 'Nümunəsiz yaradan', meaning_tr: 'Örneksiz yaratan' },
    { num: 96, ar: 'ٱلْبَاقِي', az: 'Əl-Baqi', meaning: 'Varlığı əbədi olan', meaning_tr: 'Varlığı ebedi olan' },
    { num: 97, ar: 'ٱلْوَارِثُ', az: 'Əl-Varis', meaning: 'Hər şeyin son sahibi', meaning_tr: 'Her şeyin son sahibi' },
    { num: 98, ar: 'ٱلرَّشِيدُ', az: 'Ər-Rəşid', meaning: 'Doğruya yönləndirən', meaning_tr: 'Doğruya yönlendiren' },
    { num: 99, ar: 'ٱلصَّبُورُ', az: 'Əs-Sabur', meaning: 'Çox səbirli olan', meaning_tr: 'Çok sabırlı olan' },
];

// ─── Cümə Təbrikləri ───────────────────────────────────────────
const FRIDAY_MESSAGES = [
    '🕌 Cümə mübarək!\n\n\"Cümə günü duaların qəbul olunduğu bir vaxt var. O vaxtda edilən dua rədd olunmaz.\" (Buxari)\n\n🤲 Allah dualarınızı qəbul etsin!',
    '🌹 Xeyirli Cümə!\n\n\"Günəşin doğduğu ən xeyirli gün — Cümə günüdür.\" (Muslim)\n\n📿 Kəhf surəsini oxumağı unutmayın!',
    '🕊️ Mübarək Cümə!\n\n\"Cümə günü mənə çox salavat göndərin. Çünki sizin salavatlarınız mənə çatdırılır.\" (Əbu Davud)\n\n🤲 Allahummə salli alə Muhammadin və alə ali Muhammad!',
    '🌙 Cümə Mübarək!\n\n\"Kim Cümə günü qüsl edər, gözəl geyinər, ətir vurub məscidə gedər və imam xütbə oxuyarkən susarsa, iki Cümə arasındakı günahları bağışlanar.\" (Buxari)\n\n🕌 Haydi, Cümə namazına!',
    '🌺 Mübarək Cümə olsun!\n\n\"Cümə günü Kəhf surəsini oxuyana növbəti Cüməyə qədər nur verilər.\" (Nəsai)\n\n📖 Kəhf surəsini oxudunuzmu?',
    '✨ Cüməniz xeyirli olsun!\n\n\"Ən fəzilətli gün Cümə günüdür: Adəm o gün yaradılmış, o gün Cənnətə daxil olmuş və o gün Cənnətdən çıxarılmışdır.\" (Muslim)\n\n🤲 Allaha dua edin, dualarınız qəbuldur!',
    '🌿 Xeyirli Cümə!\n\n\"Cümə günü elə bir saat var ki, mömin qul o saatda Allahdan nə istəsə, Allah ona verər.\" (Buxari və Muslim)\n\n⏰ O saatı qaçırmayın, dua edin!',
    '☀️ Cümə günün mübarək!\n\n\"Üç Cüməni üzürsüz tərk edənin qəlbi möhürlənər.\" (Tirmizi)\n\n🕌 Cümə namazının fəzilətini boş buraxmayın!',
    '🌸 Mübarək Cümə!\n\nBu gün içindən keçənlərə dua et,\nsənə dua edən qəlblər çox olsun.\nAllah sənə rahatlıq, hüzur,\nvə bərəkət nəsib etsin! 🤲',
    '🕌 Hayırlı Cumalar!\n\n\"Cümə günü bütün günlərin seyyididir (ən üstünüdür).\" (İbn Macə)\n\n📿 Bu gün çox salavat gətirin!\nAllahummə salli alə Muhammad! 🤲',
];

// ─── Cuma Mesajları — TR ────────────────────────────────────────
const FRIDAY_MESSAGES_TR = [
    '🕌 Hayırlı Cumalar!\n\n\"Cuma günü duaların kabul edildiği bir vakit vardır. O vakitte edilen dua reddolunmaz.\" (Buhari)\n\n🤲 Allah dualarınızı kabul etsin!',
    '🌹 Hayırlı Cumalar!\n\n\"Güneşin doğduğu en hayırlı gün Cuma günüdür.\" (Müslim)\n\n📿 Kehf suresini okumayı unutmayın!',
    '🕊️ Mübarek Cumalar!\n\n\"Cuma günü bana çok salavat getirin. Çünkü salavatlarınız bana ulaştırılır.\" (Ebu Davud)\n\n🤲 Allahümme salli ala Muhammedin ve ala ali Muhammed!',
    '🌙 Cuma Mübarek!\n\n\"Kim Cuma günü gusül abdesti alır, güzel giyinir, koku sürünerek camiye gider ve imam hutbe okurken susarsa, iki Cuma arasındaki günahları bağışlanır.\" (Buhari)\n\n🕌 Haydi, Cuma namazına!',
    '🌺 Mübarek Cuma olsun!\n\n\"Cuma günü Kehf suresini okuyana sonraki Cumaya kadar nur verilir.\" (Nesâi)\n\n📖 Kehf suresini okudunuz mu?',
    '✨ Cumanız hayırlı olsun!\n\n\"En faziletli gün Cuma günüdür: Âdem o gün yaratılmış, o gün cennete girmiş ve o gün cennetten çıkarılmıştır.\" (Müslim)\n\n🤲 Allah\'a dua edin, dualarınız kabuldür!',
    '🌿 Hayırlı Cumalar!\n\n\"Cuma günü öyle bir saat vardır ki, mümin kul o saatte Allah\'tan ne isterse, Allah ona verir.\" (Buhari ve Müslim)\n\n⏰ O saati kaçırmayın, dua edin!',
    '☀️ Cuma gününüz mübarek olsun!\n\n\"Üç Cumayı özürsüz terk edenin kalbi mühürlenir.\" (Tirmizi)\n\n🕌 Cuma namazının faziletini boş geçmeyin!',
    '🌸 Mübarek Cumalar!\n\nBugün içinden geçenlere dua et,\nsana dua eden kalpler çok olsun.\nAllah sana huzur, rahatlık\nve bereket nasip etsin! 🤲',
    '🕌 Hayırlı Cumalar!\n\n\"Cuma günü bütün günlerin efendisidir (en üstünüdür).\" (İbn Mâce)\n\n📿 Bugün çok salavat getirin!\nAllahümme salli ala Muhammed! 🤲',
];

// Dile göre Cuma mesajı getir
function getFridayMessage(index, lang = 'az') {
    const msgs = lang === 'tr' ? FRIDAY_MESSAGES_TR : FRIDAY_MESSAGES;
    return msgs[index % msgs.length];
}

// Defolt bildiriş ayarları
const DEFAULT_SETTINGS = {
    language: 'az',
    city: 'baku',
    reminder15: true,
    reminder10: true,
    reminder5: true,
    reminderOnTime: true,
    morningSchedule: true,
    prayers: {
        imsak: true,
        subh: true,
        zohr: true,
        esr: true,
        meqrib: true,
        isha: true,
    },
};

// ═══════════════════════════════════════════════════════════════
//  KÖMƏKÇI FUNKSİYALAR
// ═══════════════════════════════════════════════════════════════

function getLocalNow(cityId = 'baku') {
    const city = CITIES[cityId] || CITIES.baku;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: city.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = {};
    for (const { type, value } of formatter.formatToParts(now)) {
        parts[type] = value;
    }

    return {
        year: parseInt(parts.year, 10),
        month: parseInt(parts.month, 10),
        day: parseInt(parts.day, 10),
        hours: parseInt(parts.hour, 10),
        minutes: parseInt(parts.minute, 10),
        dateStr: `${parts.day}.${parts.month}.${parts.year}`,
        timeStr: `${parts.hour}:${parts.minute}`,
        isoDate: `${parts.year}-${parts.month}-${parts.day}`,
        monthKey: `${parts.year}-${parts.month}`,
    };
}

// Backward compat
function getBakuNow() {
    return getLocalNow('baku');
}

function getLocalTomorrow(cityId = 'baku') {
    const city = CITIES[cityId] || CITIES.baku;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: city.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false,
    });

    const parts = {};
    for (const { type, value } of formatter.formatToParts(tomorrow)) {
        parts[type] = value;
    }

    return {
        year: parseInt(parts.year, 10),
        month: parseInt(parts.month, 10),
        day: parseInt(parts.day, 10),
        dateStr: `${parts.day}.${parts.month}.${parts.year}`,
        monthKey: `${parts.year}-${parts.month}`,
    };
}

// Backward compat
function getBakuTomorrow() {
    return getLocalTomorrow('baku');
}

/**
 * Bakıda verilmiş gün-ay-il üçün həftənin gününü tapır.
 */
function getWeekdayName(year, month, day, lang = 'az') {
    const d = new Date(year, month - 1, day);
    return getWeekdays(lang)[d.getDay()];
}

/**
 * N gün sonrasının tarixini verilmiş şəhərin vaxtına görə hesablayır.
 */
function getLocalDateOffset(offsetDays, cityId = 'baku') {
    const city = CITIES[cityId] || CITIES.baku;
    const now = new Date();
    const target = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: city.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false,
    });

    const parts = {};
    for (const { type, value } of formatter.formatToParts(target)) {
        parts[type] = value;
    }

    return {
        year: parseInt(parts.year, 10),
        month: parseInt(parts.month, 10),
        day: parseInt(parts.day, 10),
        dateStr: `${parts.day}.${parts.month}.${parts.year}`,
        isoDate: `${parts.year}-${parts.month}-${parts.day}`,
        monthKey: `${parts.year}-${parts.month}`,
    };
}

// Backward compat
function getBakuDateOffset(offsetDays) {
    return getLocalDateOffset(offsetDays, 'baku');
}

async function getPrayerData(monthKey, city = 'baku', env) {
    const data = BUNDLED_DATA[city] ? BUNDLED_DATA[city][monthKey] : null;
    if (!data) return null;
    return data;
}

async function getDayData(year, month, day, city = 'baku', env) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = await getPrayerData(monthKey, city, env);
    if (!monthData) return null;
    return monthData.days.find(d => d.day === day) || null;
}

// ─── Aladhan API İnteqrasiyası (Aylıq Calendar) ─────────────────

/**
 * Aladhan API-dən bütün ayın namaz vaxtlarını çəkir.
 * /calendarByCity/{year}/{month} endpoint-i — bir dəfəyə 28-31 gün.
 * @param {string} cityId - CITIES açarı (məs: 'istanbul')
 * @param {number} month
 * @param {number} year
 * @returns {Array|null} dayData array formatında
 */
async function fetchMonthFromAladhanAPI(cityId, month, year) {
    const city = CITIES[cityId];
    if (!city || city.source !== 'api') return null;

    const url = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${encodeURIComponent(city.name_tr || city.name_az)}&country=${encodeURIComponent(city.country)}&method=${city.method}`;

    try {
        console.log(`Fetching month calendar from Aladhan: ${cityId} ${year}/${month}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Aladhan Calendar API Error: ${response.status}`);
            return null;
        }

        const json = await response.json();
        if (json.code !== 200 || !json.data || !Array.isArray(json.data)) {
            console.error(`Aladhan Calendar API bad response`);
            return null;
        }

        // Bütün günləri öz formatımıza çevir
        const days = json.data.map((entry) => {
            const timings = entry.timings;
            const gDate = entry.date.gregorian;
            const dayNum = parseInt(gDate.day, 10);

            // Vaxtlardan timezone hissəsini sil (məs: "05:47 (+03)" → "05:47")
            const cleanTime = (t) => t ? t.replace(/\s*\(.*\)/, '').trim() : '??:??';

            return {
                day: dayNum,
                imsak: cleanTime(timings.Imsak),
                subh: cleanTime(timings.Fajr),
                gunCixir: cleanTime(timings.Sunrise),
                zohr: cleanTime(timings.Dhuhr),
                esr: cleanTime(timings.Asr),
                gunBatir: cleanTime(timings.Sunset),
                meqrib: cleanTime(timings.Maghrib),
                isha: cleanTime(timings.Isha),
                gecaYarisi: cleanTime(timings.Midnight),
            };
        });

        return days;
    } catch (e) {
        console.error(`Aladhan Calendar API fetch error: ${e}`);
        return null;
    }
}

/**
 * Hibrid gün datası — şəhərə görə yerli JSON və ya API.
 * API şəhərləri üçün bütün ayı bir dəfəyə çəkib KV-da saxlayır (30 gün).
 */
async function getDayDataForCity(year, month, day, cityId, env) {
    const city = CITIES[cityId] || CITIES.baku;

    if (city.source === 'bundled' || (cityId === 'baku' || cityId === 'gence')) {
        return getDayData(year, month, day, cityId, env);
    }

    if (city.source === 'api') {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const cacheKey = `api_cache:${cityId}:${monthKey}`;

        // KV-dan aylıq cache-i yoxla
        let monthDays = null;
        try {
            monthDays = await env.NOTIFICATIONS_KV.get(cacheKey, 'json');
        } catch { /* cache miss */ }

        // Cache yoxdursa, API-dən çək
        if (!monthDays) {
            monthDays = await fetchMonthFromAladhanAPI(cityId, month, year);
            if (monthDays) {
                // 30 gün keşlə (2592000 saniyə)
                try {
                    await env.NOTIFICATIONS_KV.put(cacheKey, JSON.stringify(monthDays), { expirationTtl: 2592000 });
                } catch { /* KV xətası */ }
            }
        }

        if (!monthDays) return null;
        return monthDays.find(d => d.day === day) || null;
    }

    return null;

}

/**
 * API şəhərləri üçün aylıq datanı qaytarır (bundled-a bənzər format).
 */
async function getMonthDataForCity(year, month, cityId, env) {
    const city = CITIES[cityId] || CITIES.baku;

    if (city.source === 'bundled' || cityId === 'baku') {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        return await getPrayerData(monthKey, cityId, env);
    }

    if (city.source === 'api') {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const cacheKey = `api_cache:${cityId}:${monthKey}`;

        let monthDays = null;
        try {
            monthDays = await env.NOTIFICATIONS_KV.get(cacheKey, 'json');
        } catch { /* cache miss */ }

        if (!monthDays) {
            monthDays = await fetchMonthFromAladhanAPI(cityId, month, year);
            if (monthDays) {
                try {
                    await env.NOTIFICATIONS_KV.put(cacheKey, JSON.stringify(monthDays), { expirationTtl: 2592000 });
                } catch { /* KV xətası */ }
            }
        }

        if (!monthDays) return null;
        return { days: monthDays };
    }

    return null;
}

function timeToMinutes(timeStr, treatMidnightAsNextDay = false) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m;
    if (treatMidnightAsNextDay && h === 0) {
        return 1440 + m;
    }
    return total;
}

/**
 * Cari tarix Ramazan ayına düşürmü?
 */
function isRamadan(year, month, day) {
    const ramadan = RAMADAN_DATES[year];
    if (!ramadan) return false;

    const currentDate = new Date(year, month - 1, day);
    const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);
    const endDate = new Date(year, ramadan.end.month - 1, ramadan.end.day);

    return currentDate >= startDate && currentDate <= endDate;
}

/**
 * Ramazan günü sayısını hesablayır (1-dən 30-a qədər).
 */
function getRamadanDayNumber(year, month, day) {
    const ramadan = RAMADAN_DATES[year];
    if (!ramadan) return 0;

    const currentDate = new Date(year, month - 1, day);
    const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);

    const diffMs = currentDate - startDate;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return diffDays + 1;
}

/**
 * Ramazan ayının bütün günlərini qaytarır (data + prayer times).
 */
async function getRamadanDays(year, cityId = 'baku', env, lang = 'az') {
    const ramadan = RAMADAN_DATES[year];
    if (!ramadan) return [];

    const hijriYear = RAMADAN_HIJRI_YEAR[year] || '????';
    const days = [];

    const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);

    const endDate = new Date(year, ramadan.end.month - 1, ramadan.end.day);
    const totalDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const cYear = currentDate.getFullYear();
        const cMonth = currentDate.getMonth() + 1;
        const cDay = currentDate.getDate();

        const dayData = await getDayDataForCity(cYear, cMonth, cDay, cityId, env);
        const locale = LOCALES[lang] || LOCALES.az;
        const wdShort = locale.weekdays_short[currentDate.getDay()];

        days.push({
            ramadanDay: i + 1,
            hijriDate: `${i + 1} Ramazan ${hijriYear}`,
            gregorianDate: `${String(cDay).padStart(2, '0')}.${String(cMonth).padStart(2, '0')}.${cYear}`,
            gregorianShort: `${String(cDay).padStart(2, '0')}.${String(cMonth).padStart(2, '0')}`,
            weekday: wdShort,
            year: cYear,
            month: cMonth,
            day: cDay,
            imsak: dayData ? dayData.imsak : '??:??',
            meqrib: dayData ? dayData.meqrib : '??:??',
            isha: dayData ? dayData.isha : null,
        });
    }

    return days;
}

/**
 * İstifadəçinin verilmiş Ramazan günü üçün oruc statusu qeyd edib-edə bilməyəcəyini yoxlayır.
 * @returns {boolean}
 */
function canMarkFasting(ramadanDay, year, cityId = 'baku') {
    const ramadan = RAMADAN_DATES[year];
    if (!ramadan) return false;

    const baku = getBakuNow();
    const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);
    const targetDate = new Date(startDate.getTime() + (ramadanDay - 1) * 24 * 60 * 60 * 1000);

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    // Gələcək gün — qadağan
    if (targetYear > baku.year) return false;
    if (targetYear === baku.year && targetMonth > baku.month) return false;
    if (targetYear === baku.year && targetMonth === baku.month && targetDay > baku.day) return false;

    // Keçmiş gün — icazə var
    if (targetYear < baku.year) return true;
    if (targetYear === baku.year && targetMonth < baku.month) return true;
    if (targetYear === baku.year && targetMonth === baku.month && targetDay < baku.day) return true;

    // Cari gün — yalnız İftar vaxtından sonra
    // Cari gün üçün İftar (Məğrib) vaxtını tapmalıyıq
    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const cityDataGroup = BUNDLED_DATA[cityId] || BUNDLED_DATA['baku'];
    const monthData = cityDataGroup[monthKey];
    if (!monthData) return false;

    const dayEntry = monthData.days.find(d => d.day === targetDay);
    if (!dayEntry) return false;

    const iftarMinutes = timeToMinutes(dayEntry.meqrib, false);
    const currentMinutes = baku.hours * 60 + baku.minutes;

    return currentMinutes >= iftarMinutes;
}

// ═══════════════════════════════════════════════════════════════
//  TELEGRAM API
// ═══════════════════════════════════════════════════════════════

async function telegramSendMessage(botToken, chatId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
    };
    if (replyMarkup) {
        body.reply_markup = JSON.stringify(replyMarkup);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Telegram API xətası: ${response.status} — ${err}`);
    }

    return response;
}

async function telegramAnswerCallbackQuery(botToken, callbackQueryId, text = '') {
    const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: text,
        }),
    });
}

async function telegramEditMessage(botToken, chatId, messageId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
    const body = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
    };
    if (replyMarkup) {
        body.reply_markup = JSON.stringify(replyMarkup);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Telegram Edit xətası: ${response.status} — ${err}`);
    }
    return response;
}

// ═══════════════════════════════════════════════════════════════
//  AYARLAR (KV)
// ═══════════════════════════════════════════════════════════════

async function getSettings(chatId, env) {
    const key = `settings:${chatId}`;
    const data = await env.NOTIFICATIONS_KV.get(key, 'json');
    if (!data) return { ...DEFAULT_SETTINGS, prayers: { ...DEFAULT_SETTINGS.prayers } };
    // Əksik sahələri defolt ilə doldur
    return {
        ...DEFAULT_SETTINGS,
        ...data,
        prayers: { ...DEFAULT_SETTINGS.prayers, ...(data.prayers || {}) },
    };
}

async function saveSettings(chatId, settings, env) {
    const key = `settings:${chatId}`;
    await env.NOTIFICATIONS_KV.put(key, JSON.stringify(settings));
}

// ═══════════════════════════════════════════════════════════════
//  KANAL BİLDİRİŞ AYARLARI (KV)
// ═══════════════════════════════════════════════════════════════

const CHANNEL_ID = '-1003722702390';

const DEFAULT_CHANNEL_SETTINGS = {
    imsak: true,
    subh: true,
    zohr: true,
    esr: true,
    meqrib: true,
    isha: true,
};

async function getChannelSettings(env) {
    const key = `channel_settings:${CHANNEL_ID}`;
    const data = await env.NOTIFICATIONS_KV.get(key, 'json');
    if (!data) return { ...DEFAULT_CHANNEL_SETTINGS };
    return { ...DEFAULT_CHANNEL_SETTINGS, ...data };
}

async function saveChannelSettings(settings, env) {
    const key = `channel_settings:${CHANNEL_ID}`;
    await env.NOTIFICATIONS_KV.put(key, JSON.stringify(settings));
}

function getChannelSettingsKeyboard(settings) {
    const labels = {
        imsak: '🌙 İmsak',
        subh: '🌅 Sübh',
        zohr: '☀️ Zöhr',
        esr: '🌤️ Əsr',
        meqrib: '🌇 Məğrib',
        isha: '🌃 İşa',
    };
    const keyboard = [];
    for (const [key, label] of Object.entries(labels)) {
        const icon = settings[key] ? '✅' : '❌';
        keyboard.push([{ text: `${icon} ${label}`, callback_data: `chset_${key}` }]);
    }
    keyboard.push([{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }]);
    return { inline_keyboard: keyboard };
}

async function cmdChannelSettings(botToken, chatId, env) {
    const allowedId = String(env.ALLOWED_CHAT_ID);
    if (String(chatId) !== allowedId) {
        return; // Heç cavab vermə — gizli əmr
    }

    const settings = await getChannelSettings(env);

    let msg = `📡 <b>Kanal Bildiriş Ayarları</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Kanal: <code>${CHANNEL_ID}</code>\n\n`;
    msg += `Hansı namaz vaxtlarında kanala\nbildiriş göndərilsin?\n\n`;
    msg += `✅ = Aktiv  |  ❌ = Deaktiv`;

    await telegramSendMessage(botToken, chatId, msg, getChannelSettingsKeyboard(settings));
}

// ═══════════════════════════════════════════════════════════════
//  ORUC STATUSU (KV)
// ═══════════════════════════════════════════════════════════════

async function getFastingStatus(chatId, year, env) {
    const key = `fasting:${chatId}:${year}`;
    const data = await env.NOTIFICATIONS_KV.get(key, 'json');
    return data || {};
}

async function saveFastingStatus(chatId, year, status, env) {
    const key = `fasting:${chatId}:${year}`;
    await env.NOTIFICATIONS_KV.put(key, JSON.stringify(status));
}

// ═══════════════════════════════════════════════════════════════
//  İNLİNE DÜYMƏLƏR
// ═══════════════════════════════════════════════════════════════

function getMainMenuKeyboard(lang = 'az') {
    const baku = getBakuNow();
    const hasRamadan = !!RAMADAN_DATES[baku.year];

    const keyboard = [
        [
            { text: t('btn_today', lang), callback_data: 'cmd_vaxtlar' },
            { text: t('btn_tomorrow', lang), callback_data: 'cmd_sabah' },
        ],
        [
            { text: t('btn_weekly', lang), callback_data: 'cmd_heftelik' },
            { text: t('btn_monthly', lang), callback_data: 'cmd_ay' },
        ],
    ];

    // Namazlarım düyməsi (həmişə göstər)
    keyboard.push([
        { text: t('btn_namazlarim', lang), callback_data: 'cmd_namazlarim' },
    ]);

    // Ramazan datası olan il üçün həmişə göstər
    if (hasRamadan) {
        keyboard.push([
            { text: t('btn_ramadan', lang), callback_data: 'cmd_ramazan' },
        ]);
    }

    keyboard.push([
        { text: t('btn_settings', lang), callback_data: 'cmd_ayarlar' },
        { text: t('btn_help', lang), callback_data: 'cmd_help' },
    ]);
    keyboard.push([
        { text: t('btn_more', lang), callback_data: 'cmd_more' },
    ]);

    return { inline_keyboard: keyboard };
}

function getSecondaryMenuKeyboard(lang = 'az') {
    const baku = getBakuNow();
    const hasRamadan = !!RAMADAN_DATES[baku.year];

    const keyboard = [
        [
            { text: t('btn_tesbeh', lang), callback_data: 'cmd_zikr' },
            { text: t('btn_hadith', lang), callback_data: 'cmd_hedis' },
        ],
        [
            { text: t('btn_qaza', lang), callback_data: 'cmd_qeza' },
            { text: t('btn_calendar', lang), callback_data: 'cmd_teqvim' },
        ],
        [
            { text: t('btn_asma', lang), callback_data: 'cmd_asma' },
            { text: t('btn_friday', lang), callback_data: 'cmd_cume' },
        ],
        [
            { text: t('btn_hijri', lang), callback_data: 'cmd_cevir_today' },
        ],
    ];

    if (hasRamadan) {
        keyboard.push([
            { text: t('btn_stats', lang), callback_data: 'cmd_stats' },
            { text: t('btn_dua', lang), callback_data: 'cmd_dua' },
        ]);
    }

    keyboard.push([
        { text: t('btn_back', lang), callback_data: 'cmd_menu' },
    ]);

    return { inline_keyboard: keyboard };
}

function getSettingsKeyboard(settings, lang = 'az') {
    const yn = (val) => val ? '✅' : '❌';
    const pn = getPrayerNames(lang);
    const cityName = getCityName(settings.city || 'baku', lang);
    const langLabel = settings.language === 'tr' ? '🇹🇷 Türkçe' : '🇦🇿 Azərbaycan';

    return {
        inline_keyboard: [
            [
                { text: `🌐 ${langLabel}`, callback_data: 'set_lang_menu' },
                { text: `📍 ${cityName}`, callback_data: 'set_city_menu' },
            ],
            [{ text: `${yn(settings.reminder15)} ${t('settings_reminder15', lang)}`, callback_data: 'set_reminder15' }],
            [{ text: `${yn(settings.reminder10)} ${t('settings_reminder10', lang)}`, callback_data: 'set_reminder10' }],
            [{ text: `${yn(settings.reminder5)} ${t('settings_reminder5', lang)}`, callback_data: 'set_reminder5' }],
            [{ text: `${yn(settings.reminderOnTime)} ${t('settings_ontime', lang)}`, callback_data: 'set_reminderOnTime' }],
            [{ text: `${yn(settings.morningSchedule)} ${t('settings_morning', lang)}`, callback_data: 'set_morningSchedule' }],
            [{ text: t('settings_prayers_header', lang), callback_data: 'noop' }],
            [
                { text: `${yn(settings.prayers.imsak)} ${pn.imsak.split(' ')[1] || 'İmsak'}`, callback_data: 'set_p_imsak' },
                { text: `${yn(settings.prayers.subh)} ${pn.subh.split(' ')[1] || 'Sübh'}`, callback_data: 'set_p_subh' },
                { text: `${yn(settings.prayers.zohr)} ${pn.zohr.split(' ')[1] || 'Zöhr'}`, callback_data: 'set_p_zohr' },
            ],
            [
                { text: `${yn(settings.prayers.esr)} ${pn.esr.split(' ')[1] || 'Əsr'}`, callback_data: 'set_p_esr' },
                { text: `${yn(settings.prayers.meqrib)} ${pn.meqrib.split(' ')[1] || 'Məğrib'}`, callback_data: 'set_p_meqrib' },
                { text: `${yn(settings.prayers.isha)} ${pn.isha.split(' ')[1] || 'İşa'}`, callback_data: 'set_p_isha' },
            ],
            [{ text: t('settings_all_off', lang), callback_data: 'set_notifications_off' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
}

function getBackKeyboard(lang = 'az') {
    return {
        inline_keyboard: [
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
}

// ═══════════════════════════════════════════════════════════════
//  MESAJ FORMATLAMA
// ═══════════════════════════════════════════════════════════════

function formatPrayerTimesMessage(dayData, dateStr, currentMinutes, title, ramadanInfo = null, lang = 'az', cityId = 'baku') {
    if (!title) title = t('today_title', lang);
    const labels = getAllLabels(lang);
    const pNames = getPrayerNames(lang);
    const cityName = getCityName(cityId, lang);
    const authority = getCityAuthority(cityId, lang);

    let nextPrayer = null;
    let minutesUntilNext = null;

    if (currentMinutes >= 0) {
        for (const key of NOTIFY_PRAYERS) {
            const prayerMin = timeToMinutes(dayData[key], key === 'gecaYarisi');
            if (prayerMin > currentMinutes) {
                nextPrayer = key;
                minutesUntilNext = prayerMin - currentMinutes;
                break;
            }
        }
    }

    const dateParts = dateStr.split('.');
    const hijriStr = (dateParts.length === 3) ?
        formatHijriDate(parseInt(dateParts[2]), parseInt(dateParts[1]), parseInt(dateParts[0]), lang) : '';

    let msg = `${title}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 ${cityName}  •  🗓 ${dateStr}\n`;
    if (hijriStr) msg += `☪️ ${hijriStr}\n`;
    if (ramadanInfo) {
        const suffix = lang === 'tr' ? '.' : '-ci';
        msg += `🌙 Ramazan — ${ramadanInfo.dayNumber}${suffix} ${lang === 'tr' ? 'gün' : 'gün'}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const key of DISPLAY_ORDER) {
        const label = labels[key] || key;
        const time = dayData[key];
        if (!time) continue;
        const arrow = (key === nextPrayer) ? ' ◀️' : '';
        if (ramadanInfo && (key === 'imsak' || key === 'meqrib')) {
            const extra = key === 'imsak' ? t('imsak_label', lang) : t('iftar_label', lang);
            msg += `  <b>${label}  —  ${time}${extra}</b>${arrow}\n`;
        } else {
            msg += `  ${label}  —  ${time}${arrow}\n`;
        }
    }

    if (ramadanInfo && dayData.isha) {
        const teravihTime = calculateTeravihTime(dayData.isha);
        const teravihLabel = lang === 'tr' ? 'Teravih' : 'Təravih';
        if (teravihTime) msg += `  🕌 ${teravihLabel}  —  ${teravihTime}\n`;
    }

    if (nextPrayer && minutesUntilNext !== null) {
        msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        const nextStr = t('next_prayer', lang).replace('{prayer}', pNames[nextPrayer]).replace('{min}', minutesUntilNext);
        msg += `${nextStr}\n`;
    }

    if (ramadanInfo) {
        msg += `\n${t('accept_fast', lang)}`;
    } else {
        msg += `\n🕌 ${authority}`;
    }
    return msg;
}

function formatWeeklyMessage(daysData, lang = 'az', cityId = 'baku') {
    const cityName = getCityName(cityId, lang);
    const authority = getCityAuthority(cityId, lang);
    let msg = `${t('weekly_title', lang)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 ${cityName}\n\n`;

    for (const { year, month, day, dayData } of daysData) {
        if (!dayData) continue;
        const weekday = getWeekdayName(year, month, day, lang);
        const dateStr = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
        const isRam = isRamadan(year, month, day);
        const ramLabel = isRam ? ' 🌙' : '';
        msg += `<b>📍 ${weekday}, ${dateStr}${ramLabel}</b>\n`;
        msg += `  🌙 ${dayData.imsak}  🌅 ${dayData.subh}  ☀️ ${dayData.zohr}\n`;
        msg += `  🌤️ ${dayData.esr}  🌇 ${dayData.meqrib}  🌃 ${dayData.isha}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${t('weekly_order', lang)}\n`;
    msg += `🕌 ${authority}`;
    return msg;
}

function formatMonthlyMessage(monthData, monthNum, year, part, totalParts, lang = 'az', cityId = 'baku') {
    const monthName = getMonthsDisplay(lang)[monthNum] || `${monthNum}`;
    const cityName = getCityName(cityId, lang);
    const authority = getCityAuthority(cityId, lang);
    let msg = t('monthly_title', lang).replace('{month}', monthName).replace('{year}', year);
    if (totalParts > 1) msg += ` (${part}/${totalParts})`;
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 ${cityName}\n\n`;
    msg += `<code>${t('monthly_header', lang)}</code>\n`;
    msg += `<code>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</code>\n`;

    for (const dayData of monthData) {
        const d = String(dayData.day).padStart(2, ' ');
        const isRam = isRamadan(year, monthNum, dayData.day);
        const ramMark = isRam ? '🌙' : '  ';
        msg += `<code>${d}${ramMark} ${dayData.subh} ${dayData.gunCixir} ${dayData.zohr} ${dayData.esr} ${dayData.meqrib} ${dayData.isha}</code>\n`;
    }

    msg += `\n🕌 ${authority}`;
    return msg;
}

// ═══════════════════════════════════════════════════════════════
//  TARİX PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Tarix mətnini parse edir.
 * Formatlar: "25.03.2026", "25.03", "25 mart", "25 mart 2026"
 * @returns {{ year, month, day } | null}
 */
function parseDate(text, currentYear) {
    text = text.trim().toLowerCase();

    // DD.MM.YYYY
    let match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
        return { day: parseInt(match[1], 10), month: parseInt(match[2], 10), year: parseInt(match[3], 10) };
    }

    // DD.MM (cari il)
    match = text.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (match) {
        return { day: parseInt(match[1], 10), month: parseInt(match[2], 10), year: currentYear };
    }

    // DD AY_ADI [IL] — hər iki dildə (AZ + TR)
    match = text.match(/^(\d{1,2})\s+([a-zçşğüöıəi̇]+)(?:\s+(\d{4}))?$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const monthName = match[2];
        const year = match[3] ? parseInt(match[3], 10) : currentYear;
        // Əvvəl AZ, sonra TR ay adlarını yoxla
        const monthNum = LOCALES.az.months_input[monthName] || LOCALES.tr.months_input[monthName];
        if (monthNum) {
            return { day, month: monthNum, year };
        }
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
//  ƏMRLƏR (KOMANDALAR)
// ═══════════════════════════════════════════════════════════════

async function cmdStart(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const now = getLocalNow(cityId);
    const dayData = await getDayDataForCity(now.year, now.month, now.day, cityId, env);
    const isRam = isRamadan(now.year, now.month, now.day);
    const cityName = getCityName(cityId, lang);

    let reply;
    if (dayData) {
        reply = `${t('welcome_title', lang)}\n\n`;
        if (isRam) {
            const ramDay = getRamadanDayNumber(now.year, now.month, now.day);
            const suffix = lang === 'tr' ? '.' : '-ci';
            reply += `🌙 <b>Ramazan ${lang === 'tr' ? 'Mübarek' : 'Mübarək'}!</b> (${ramDay}${suffix} ${lang === 'tr' ? 'gün' : 'gün'})\n\n`;
        }
        reply += `${t('welcome_text', lang)}\n\n`;
        reply += `${t('welcome_buttons', lang)}\n\n`;
        const currentMinutes = now.hours * 60 + now.minutes;
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(now.year, now.month, now.day) } : null;
        reply += formatPrayerTimesMessage(dayData, now.dateStr, currentMinutes, t('today_title', lang), ramadanInfo, lang, cityId);
    } else {
        reply = `${t('welcome_title', lang)}\n\n`;
        reply += t('no_data_today', lang);
    }
    await telegramSendMessage(botToken, chatId, reply, getMainMenuKeyboard(lang));
}

async function cmdVaxtlar(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const now = getLocalNow(cityId);
    const dayData = await getDayDataForCity(now.year, now.month, now.day, cityId, env);

    if (dayData) {
        const currentMinutes = now.hours * 60 + now.minutes;
        const isRam = isRamadan(now.year, now.month, now.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(now.year, now.month, now.day) } : null;
        const reply = formatPrayerTimesMessage(dayData, now.dateStr, currentMinutes, t('today_title', lang), ramadanInfo, lang, cityId);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
    } else {
        await telegramSendMessage(botToken, chatId, t('no_data_today', lang), getBackKeyboard(lang));
    }
}

async function cmdSabah(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const tomorrow = getLocalTomorrow(cityId);
    const dayData = await getDayDataForCity(tomorrow.year, tomorrow.month, tomorrow.day, cityId, env);

    if (dayData) {
        const isRam = isRamadan(tomorrow.year, tomorrow.month, tomorrow.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(tomorrow.year, tomorrow.month, tomorrow.day) } : null;
        const reply = formatPrayerTimesMessage(dayData, tomorrow.dateStr, -1, t('tomorrow_title', lang), ramadanInfo, lang, cityId);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
    } else {
        await telegramSendMessage(botToken, chatId, t('no_data_tomorrow', lang), getBackKeyboard(lang));
    }
}

async function cmdHeftelik(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const daysData = [];

    for (let i = 0; i < 7; i++) {
        const dateInfo = getLocalDateOffset(i, cityId);
        const dayData = await getDayDataForCity(dateInfo.year, dateInfo.month, dateInfo.day, cityId, env);
        daysData.push({ year: dateInfo.year, month: dateInfo.month, day: dateInfo.day, dayData });
    }

    const reply = formatWeeklyMessage(daysData, lang, cityId);
    await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
}

async function cmdTarix(botToken, chatId, dateText, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const now = getLocalNow(cityId);
    const monthsInput = getMonthsInput(lang);
    const parsed = parseDate(dateText, now.year);

    if (!parsed) {
        let reply = `⚠️ ${lang === 'tr' ? 'Tarih formatı geçersiz.' : 'Tarix formatı düzgün deyil.'}\n\n`;
        reply += `<b>${lang === 'tr' ? 'Geçerli formatlar:' : 'Düzgün formatlar:'}</b>\n`;
        reply += `• /tarix 25.03.2026\n• /tarix 25.03\n• /tarix 25 mart\n• /tarix 25 mart 2026`;
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
        return;
    }

    const dayData = await getDayDataForCity(parsed.year, parsed.month, parsed.day, cityId, env);
    if (dayData) {
        const dateStr = `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`;
        const weekday = getWeekdayName(parsed.year, parsed.month, parsed.day, lang);
        const isRam = isRamadan(parsed.year, parsed.month, parsed.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(parsed.year, parsed.month, parsed.day) } : null;
        const title = `📅 ${weekday}, ${dateStr}`;
        const reply = formatPrayerTimesMessage(dayData, dateStr, -1, title, ramadanInfo, lang, cityId);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
    } else {
        const noData = t('no_data_date', lang).replace('{date}', `${parsed.day}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`);
        await telegramSendMessage(botToken, chatId, noData, getBackKeyboard(lang));
    }
}

async function cmdAy(botToken, chatId, argText, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const now = getLocalNow(cityId);
    let targetMonth = now.month;
    let targetYear = now.year;

    if (argText) {
        const arg = argText.trim().toLowerCase();
        const monthsInput = getMonthsInput(lang);
        if (monthsInput[arg]) {
            targetMonth = monthsInput[arg];
        } else if (MONTH_NAMES_AZ[arg]) {
            targetMonth = MONTH_NAMES_AZ[arg];
        } else {
            const num = parseInt(arg, 10);
            if (num >= 1 && num <= 12) targetMonth = num;
        }
    }

    const monthData = await getMonthDataForCity(targetYear, targetMonth, cityId, env);

    if (!monthData || !monthData.days) {
        const monthName = getMonthsDisplay(lang)[targetMonth] || targetMonth;
        const noData = t('no_data_month', lang).replace('{month}', monthName).replace('{year}', targetYear);
        await telegramSendMessage(botToken, chatId, noData, getBackKeyboard(lang));
        return;
    }

    const days = monthData.days;
    const midPoint = Math.ceil(days.length / 2);
    const part1 = days.slice(0, midPoint);
    const part2 = days.slice(midPoint);
    const msg1 = formatMonthlyMessage(part1, targetMonth, targetYear, 1, 2, lang, cityId);
    const msg2 = formatMonthlyMessage(part2, targetMonth, targetYear, 2, 2, lang, cityId);
    await telegramSendMessage(botToken, chatId, msg1);
    await telegramSendMessage(botToken, chatId, msg2, getBackKeyboard(lang));
}

// Qiblə funksiyası silindi (v2.0 — sadələşdirilmə)

async function cmdHelp(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    let msg = `🕌 <b>${lang === 'tr' ? 'Bot Komutları' : 'Bot Əmrləri'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (lang === 'tr') {
        msg += `📅 <b>Namaz Vakitleri:</b>\n`;
        msg += `  /namaz — Bugünkü vakitler\n`;
        msg += `  /sabah — Yarınki vakitler\n`;
        msg += `  /haftalik — 7 günlük takvim\n`;
        msg += `  /aylik — Aylık takvim\n`;
        msg += `  /tarih 25.03.2026\n\n`;
        msg += `🌙 <b>Ramazan:</b>\n`;
        msg += `  /ramazan — Ramazan takvimi\n`;
        msg += `  /istatistik — Oruç istatistikleri\n`;
        msg += `  /dua — İftar/İmsak duaları\n\n`;
        msg += `📿 <b>İbadet:</b>\n`;
        msg += `  /tespih — Dijital Tesbih\n`;
        msg += `  /hadis — Günün hadisi\n`;
        msg += `  /kaza — Kaza namazı\n`;
        msg += `  /asma — Esma-ül Hüsna\n\n`;
        msg += `☪️ <b>Hicri Takvim:</b>\n`;
        msg += `  /cevir — Bugünkü Hicri tarih\n\n`;
        msg += `📅 <b>Diğer:</b>\n`;
        msg += `  /takvim — Dini günler takvimi\n`;
        msg += `  /cuma — Cuma tebriği\n\n`;
        msg += `⚙️ /ayarlar — Ayarlar\n`;
        msg += `❓ /yardim — Bu yardım mesajı\n\n`;
        msg += `🔔 <b>Otomatik Bildirimler:</b>\n`;
        msg += `  • Her namaza 15, 10, 5 dk kala\n`;
        msg += `  • Vakit geldiğinde\n`;
        msg += `  • Her gün sabah 05:00'de takvim\n\n`;
        msg += `💡 <i>Aşağıdaki butonları da kullanabilirsiniz!</i>`;
    } else {
        msg += `📅 <b>Namaz Vaxtları:</b>\n`;
        msg += `  /vaxtlar — Bugünkü vaxtlar\n`;
        msg += `  /sabah — Sabahkı vaxtlar\n`;
        msg += `  /heftelik — 7 günlük cədvəl\n`;
        msg += `  /ay — Aylıq cədvəl\n`;
        msg += `  /tarix 25.03.2026\n\n`;
        msg += `🌙 <b>Ramazan:</b>\n`;
        msg += `  /ramazan — Ramazan təqvimi\n`;
        msg += `  /statistika — Oruc statistikası\n`;
        msg += `  /dua — İftar/İmsak duaları\n\n`;
        msg += `📿 <b>İbadət:</b>\n`;
        msg += `  /zikr — Rəqəmsal Təsbeh\n`;
        msg += `  /hedis — Günün hədisi\n`;
        msg += `  /qeza — Qəza namazı\n`;
        msg += `  /asma — Əsma-ül Hüsna\n\n`;
        msg += `☪️ <b>Hicri Təqvim:</b>\n`;
        msg += `  /cevir — Bugünkü Hicri tarix\n\n`;
        msg += `📅 <b>Digər:</b>\n`;
        msg += `  /teqvim — Dini günlər təqvimi\n`;
        msg += `  /cume — Cümə təbriki\n\n`;
        msg += `⚙️ /ayarlar — Ayarlar\n`;
        msg += `❓ /help — Bu kömək mesajı\n\n`;
        msg += `🔔 <b>Avtomatik Bildirişlər:</b>\n`;
        msg += `  • Hər namaza 15, 10, 5 dəq qalmış\n`;
        msg += `  • Namaz vaxtı gəldikdə\n`;
        msg += `  • Hər gün səhər 05:00-da cədvəl\n\n`;
        msg += `💡 <i>Aşağıdakı düymələrdən də istifadə edə bilərsiniz!</i>`;
    }
    await telegramSendMessage(botToken, chatId, msg, getMainMenuKeyboard(lang));
}

async function cmdAyarlar(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';

    let msg = `${t('settings_title', lang)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `${t('settings_desc', lang)}\n\n`;
    msg += t('settings_active', lang);

    await telegramSendMessage(botToken, chatId, msg, getSettingsKeyboard(settings, lang));
}

// ═══════════════════════════════════════════════════════════════
//  RAMAZAN ƏMRLƏRI
// ═══════════════════════════════════════════════════════════════

/**
 * Ramazan təqvimini formatlayır (bir səhifə, ~10 gün).
 */
function formatRamadanPage(days, fastingStatus, pageNum, totalPages, lang = 'az') {
    const baku = getBakuNow();
    const year = baku.year;
    const hijriYear = RAMADAN_HIJRI_YEAR[year] || RAMADAN_HIJRI_YEAR[2026] || '????';
    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const currentRamDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : 0;

    let msg = `🌙 <b>${t('ramadan_calendar', lang).replace('{year}', hijriYear)}</b>`;
    if (totalPages > 1) {
        msg += ` (${pageNum}/${totalPages})`;
    }
    msg += `\n`;

    // Ramazana qalan/keçən günlər
    const ramadan = RAMADAN_DATES[year];
    if (ramadan) {
        const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);
        const endDate = new Date(year, ramadan.end.month - 1, ramadan.end.day);
        const todayDate = new Date(baku.year, baku.month - 1, baku.day);

        if (todayDate < startDate) {
            const diffDays = Math.ceil((startDate - todayDate) / (24 * 60 * 60 * 1000));
            msg += t('ramadan_days_left', lang).replace('{days}', diffDays) + `\n`;
        } else if (todayDate <= endDate) {
            msg += t('ramadan_current_day', lang).replace('{day}', currentRamDay) + `\n`;
        } else {
            msg += t('ramadan_ended', lang) + `\n`;
        }
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const d of days) {
        const dayNum = d.ramadanDay;
        const statusVal = fastingStatus[dayNum];
        const isQadr = QADR_NIGHTS.includes(dayNum);
        const isCurrent = (dayNum === currentRamDay);
        let statusIcon;

        if (statusVal === true) {
            statusIcon = '✅';
        } else if (statusVal === false) {
            statusIcon = '❌';
        } else {
            const canMark = canMarkFasting(dayNum, d.year);
            if (canMark) {
                statusIcon = '⬜';
            } else {
                statusIcon = ' ';
            }
        }

        const qadrMark = isQadr ? ' ⭐' : '';
        const currentMark = isCurrent ? '👉 ' : '';

        msg += `${currentMark}${statusIcon} <b>${dayNum}.</b> ${d.gregorianShort} ${d.weekday}${qadrMark}\n`;
        const teravihTime = calculateTeravihTime(d.isha || null);
        const teravihPart = teravihTime ? `  |  🕌 ${teravihTime}` : '';
        msg += `    🌙 ${d.imsak}  |  🌇 ${d.meqrib}${teravihPart}\n`;
    }

    // Qadr gecəsi açıqlama (yalnız son səhifədə)
    if (pageNum === totalPages) {
        msg += `\n${t('ramadan_qadr_note', lang)}\n`;
    }

    return msg;
}

/**
 * Teravih namazı vaxtını hesablayır (İşa + 30 dəq).
 */
function calculateTeravihTime(ishaTime) {
    if (!ishaTime) return null;
    const [h, m] = ishaTime.split(':').map(Number);
    let totalMin = h * 60 + m + 30;
    const newH = Math.floor(totalMin / 60) % 24;
    const newM = totalMin % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Nailiyyətləri yoxlayır.
 */
function checkAchievements(fastingStatus) {
    let fasted = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let qadrFasted = 0;

    for (let i = 1; i <= 30; i++) {
        if (fastingStatus[i] === true) {
            fasted++;
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            if (QADR_NIGHTS.includes(i)) qadrFasted++;
        } else {
            currentStreak = 0;
        }
    }

    const statsObj = { fasted, maxStreak, qadrFasted };
    const earned = [];
    for (const ach of ACHIEVEMENTS) {
        if (ach.check(statsObj)) {
            earned.push(ach);
        }
    }
    return earned;
}

/**
 * Ramazan statistikasını hesablayır.
 */
function calculateRamadanStats(fastingStatus, totalDays, year) {
    let fasted = 0;
    let missed = 0;
    let unmarked = 0;
    let future = 0;

    for (let i = 1; i <= totalDays; i++) {
        if (fastingStatus[i] === true) {
            fasted++;
        } else if (fastingStatus[i] === false) {
            missed++;
        } else {
            const canMark = canMarkFasting(i, year);
            if (canMark) {
                unmarked++;
            } else {
                future++;
            }
        }
    }

    return { fasted, missed, unmarked, future, total: totalDays };
}

/**
 * Statistika üçün progress bar.
 */
function makeProgressBar(fasted, total, width = 15) {
    const filled = Math.round((fasted / total) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Ramazan səhifəsi üçün inline düymələri yaradır.
 */
function getRamadanKeyboard(days, fastingStatus, pageNum, totalPages, lang = 'az') {
    const keyboard = [];

    // Oruc düymələri — yalnız qeyd edilə bilən günlər üçün
    const markableDays = days.filter(d => canMarkFasting(d.ramadanDay, d.year));
    const cancelText = t('btn_ramadan_cancel', lang);

    // Qruplama: hər sətirdə 3 düymə
    for (let i = 0; i < markableDays.length; i += 3) {
        const row = [];
        for (let j = i; j < Math.min(i + 3, markableDays.length); j++) {
            const d = markableDays[j];
            const dayNum = d.ramadanDay;
            const status = fastingStatus[dayNum];

            if (status === true) {
                row.push({ text: `${dayNum} ✅ ${cancelText}`, callback_data: `fast_undo_${dayNum}` });
            } else if (status === false) {
                row.push({ text: `${dayNum} ❌ ${cancelText}`, callback_data: `fast_undo_${dayNum}` });
            } else {
                row.push({ text: `${dayNum} ✅`, callback_data: `fast_yes_${dayNum}` });
                row.push({ text: `${dayNum} ❌`, callback_data: `fast_no_${dayNum}` });
                // İki düymə əlavə olunduğu üçün sıçrayırıq
                break;
            }
        }
        if (row.length > 0) keyboard.push(row);
    }

    // Səhifə naviqasiyası
    if (totalPages > 1) {
        const navRow = [];
        if (pageNum > 1) {
            navRow.push({ text: t('btn_ramadan_prev', lang), callback_data: `ramazan_page_${pageNum - 1}` });
        }
        if (pageNum < totalPages) {
            navRow.push({ text: t('btn_ramadan_next', lang), callback_data: `ramazan_page_${pageNum + 1}` });
        }
        keyboard.push(navRow);
    }

    // Statistika və geri
    keyboard.push([
        { text: t('btn_ramadan_stats', lang), callback_data: 'cmd_stats' },
        { text: t('btn_ramadan_dua', lang), callback_data: 'cmd_dua' },
    ]);
    keyboard.push([
        { text: t('btn_back', lang), callback_data: 'cmd_menu' },
    ]);

    return { inline_keyboard: keyboard };
}

async function cmdRamazan(botToken, chatId, env, page = 1) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const baku = getBakuNow();
    const year = baku.year;
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) {
        await telegramSendMessage(
            botToken,
            chatId,
            t('ramadan_no_data', lang).replace('{year}', year),
            getBackKeyboard(lang)
        );
        return;
    }

    const ramadanDays = await getRamadanDays(year, cityId, env, lang);
    const fastingStatus = await getFastingStatus(chatId, year, env);

    // 3 səhifəyə böl (hər biri 10 gün)
    const perPage = 10;
    const totalPages = Math.ceil(ramadanDays.length / perPage);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * perPage;
    const pageDays = ramadanDays.slice(start, start + perPage);

    let msg = formatRamadanPage(pageDays, fastingStatus, currentPage, totalPages, lang);

    // Sonuncu səhifədə statistika göstər
    if (currentPage === totalPages) {
        const stats = calculateRamadanStats(fastingStatus, ramadanDays.length, year);
        const pct = stats.total > 0 ? Math.round((stats.fasted / stats.total) * 100) : 0;
        msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += t('ramadan_stats_label', lang) + `\n`;
        msg += t('ramadan_fasted_count', lang).replace('{count}', stats.fasted) + ` | `;
        msg += t('ramadan_missed_count', lang).replace('{count}', stats.missed) + `\n`;
        msg += t('ramadan_unmarked_count', lang).replace('{count}', stats.unmarked) + ` | `;
        msg += t('ramadan_future_count', lang).replace('{count}', stats.future) + `\n`;
        msg += `<code>${makeProgressBar(stats.fasted, stats.total)} ${pct}%</code>`;
    }

    const kb = getRamadanKeyboard(pageDays, fastingStatus, currentPage, totalPages, lang);
    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdRamazanStats(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const baku = getBakuNow();
    const year = baku.year;
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) {
        await telegramSendMessage(
            botToken,
            chatId,
            t('ramadan_no_data', lang).replace('{year}', year),
            getBackKeyboard(lang)
        );
        return;
    }

    const ramadanDays = await getRamadanDays(year, cityId, env, lang);
    const fastingStatus = await getFastingStatus(chatId, year, env);
    const stats = calculateRamadanStats(fastingStatus, ramadanDays.length, year);
    const pct = stats.total > 0 ? Math.round((stats.fasted / stats.total) * 100) : 0;
    const hijriYear = RAMADAN_HIJRI_YEAR[year] || '????';

    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const ramDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : null;

    let msg = `📊 <b>${t('ramadan_stats_title', lang).replace('{year}', hijriYear)}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (ramDay) {
        msg += t('ramadan_today_day', lang).replace('{day}', ramDay) + `\n\n`;
    }

    msg += t('ramadan_fasted', lang).replace('{count}', stats.fasted) + `\n`;
    msg += t('ramadan_missed', lang).replace('{count}', stats.missed) + `\n`;
    msg += t('ramadan_unmarked', lang).replace('{count}', stats.unmarked) + `\n`;
    msg += t('ramadan_future', lang).replace('{count}', stats.future) + `\n\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += t('ramadan_completion', lang) + `\n`;
    msg += `<code>${makeProgressBar(stats.fasted, stats.total, 20)} ${pct}%</code>\n`;
    const dayWord = lang === 'tr' ? 'gün' : 'gün';
    msg += `<code>${stats.fasted}/${stats.total} ${dayWord}</code>\n\n`;

    if (stats.missed > 0) {
        msg += t('ramadan_qaza_debt', lang).replace('{count}', stats.missed) + `\n\n`;
    }

    // Nailiyyətlər
    const achievements = checkAchievements(fastingStatus);
    if (achievements.length > 0) {
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += t('ramadan_achievements', lang) + `\n\n`;
        for (const ach of achievements) {
            const achName = lang === 'tr' ? (ach.name_tr || ach.name) : ach.name;
            const achDesc = lang === 'tr' ? (ach.desc_tr || ach.desc) : ach.desc;
            msg += `${ach.emoji} <b>${achName}</b> — ${achDesc}\n`;
        }
        msg += `\n`;
    }

    // Motivasiya mesajı
    if (ramDay && ramDay > 0 && ramDay <= 30) {
        const motivArr = lang === 'tr' ? MOTIVASIYA_MESAJLARI_TR : MOTIVASIYA_MESAJLARI;
        msg += `💬 ${motivArr[ramDay - 1]}\n\n`;
    }

    msg += t('ramadan_accept', lang);

    const kb = {
        inline_keyboard: [
            [{ text: t('btn_ramadan_calendar', lang), callback_data: 'cmd_ramazan' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };

    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdDua(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const baku = getBakuNow();
    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const ramDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : 0;
    const duas = lang === 'tr' ? RAMADAN_DUAS_TR : RAMADAN_DUAS;

    let msg = `🤲 <b>${lang === 'tr' ? 'Ramazan Duaları' : 'Ramazan Duaları'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += duas.imsak;
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += duas.iftar;
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += duas.umumiDua;

    const quoteIndex = (ramDay > 0 && ramDay <= 30) ? ramDay - 1 : (baku.day % 30);
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📿 <b>${lang === 'tr' ? 'Günün Hadisi:' : 'Günün Hədisi:'}</b>\n\n`;
    msg += `<i>${getRamadanQuote(quoteIndex, lang)}</i>`;

    if (ramDay > 0 && QADR_NIGHTS.includes(ramDay)) {
        msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `⭐ <b>Bu gece Kadir gecesi olabilir!</b>\n`;
            msg += `Kadir gecesi bin aydan hayırlıdır.\n`;
            msg += `🤲 Geceyi ibadetle geçirin!`;
        } else {
            msg += `⭐ <b>Bu gecə Qadr gecəsi ola bilər!</b>\n`;
            msg += `Qadr gecəsi min aydan xeyirlidir.\n`;
            msg += `🤲 Gecəni ibadətlə keçirin!`;
        }
    }

    const kb = {
        inline_keyboard: [
            [{ text: lang === 'tr' ? '🌙 Ramazan Takvimi' : '🌙 Ramazan Təqvimi', callback_data: 'cmd_ramazan' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };

    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  HİCRİ TƏQVİM ÇEVİRİCİ
// ═══════════════════════════════════════════════════════════════

async function cmdCevir(botToken, chatId, dateText, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    let year, month, day;
    const dotMatch = dateText.match(/^(\d{1,2})[\.\/-](\d{1,2})(?:[\.\/-](\d{4}))?$/);
    if (dotMatch) {
        day = parseInt(dotMatch[1]);
        month = parseInt(dotMatch[2]);
        year = dotMatch[3] ? parseInt(dotMatch[3]) : getBakuNow().year;
    } else {
        day = parseInt(dateText);
        if (isNaN(day)) {
            const errMsg = lang === 'tr' ? '⚠️ Tarih formatı doğru değil.\n\nÖrnek: /tarih 15.03.2026' : '⚠️ Tarix formatı düzgün deyil.\n\nNümunə: /cevir 15.03.2026';
            await telegramSendMessage(botToken, chatId, errMsg, getBackKeyboard(lang));
            return;
        }
        const baku = getBakuNow();
        month = baku.month;
        year = baku.year;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        const errMsg = lang === 'tr' ? '⚠️ Geçersiz tarih.' : '⚠️ Keçərsiz tarix.';
        await telegramSendMessage(botToken, chatId, errMsg, getBackKeyboard(lang));
        return;
    }

    const hijri = formatHijriDate(year, month, day, lang);
    const weekday = getWeekdayName(year, month, day, lang);
    const dateStr = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;

    let msg = `📅 <b>${lang === 'tr' ? 'Hicri Tarih Çevirici' : 'Hicri Tarix Çevirici'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📅 ${lang === 'tr' ? 'Miladi' : 'Miladi'}: <b>${dateStr}</b> (${weekday})\n\n`;
    msg += `☪️ ${lang === 'tr' ? 'Hicri' : 'Hicri'}: <b>${hijri}</b>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <i>${lang === 'tr' ? 'Hicri tarih ±1 gün fark edebilir.' : 'Hicri tarix ±1 gün fərq edə bilər.'}</i>`;

    await telegramSendMessage(botToken, chatId, msg, getBackKeyboard(lang));
}

// ═══════════════════════════════════════════════════════════════
//  GÜNÜN HƏDİSİ
// ═══════════════════════════════════════════════════════════════

async function cmdHedis(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const baku = getBakuNow();
    const dayOfYear = Math.floor((new Date(baku.year, baku.month - 1, baku.day) - new Date(baku.year, 0, 0)) / (24 * 60 * 60 * 1000));
    const hadithText = getHadith(dayOfYear, lang);
    const hijriStr = formatHijriDate(baku.year, baku.month, baku.day, lang);

    let msg = `📿 <b>${lang === 'tr' ? 'Günün Hadisi' : 'Günün Hədisi'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🗓 ${baku.dateStr}  •  ☪️ ${hijriStr}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `<i>${hadithText}</i>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 ${lang === 'tr' ? 'Her gün yeni hadis için /hadis yazın.' : 'Hər gün yeni hədis üçün /hedis yazın.'}`;

    const kb = {
        inline_keyboard: [
            [{ text: lang === 'tr' ? '📿 Başka hadis' : '📿 Başqa hədis', callback_data: 'cmd_hedis_random' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  ZİKR (TƏSBEH) SAYĞAC
// ═══════════════════════════════════════════════════════════════

function getZikrKeyboard(counts, lang = 'az') {
    const keyboard = [];
    for (const item of ZIKR_ITEMS) {
        const count = counts[item.id] || 0;
        const done = count >= item.target;
        const icon = done ? '✅' : '📿';
        const name = lang === 'tr' ? (item.name_tr || item.name) : item.name;
        keyboard.push([
            { text: `${icon} ${name}: ${count}/${item.target}`, callback_data: `zikr_info_${item.id}` },
            { text: '➕', callback_data: `zikr_plus_${item.id}` },
        ]);
    }
    keyboard.push([{ text: lang === 'tr' ? '🔄 Sıfırla' : '🔄 Sıfırla', callback_data: 'zikr_reset' }]);
    keyboard.push([{ text: t('btn_back', lang), callback_data: 'cmd_menu' }]);
    return { inline_keyboard: keyboard };
}

async function cmdZikr(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const counts = {};

    let msg = `📿 <b>${lang === 'tr' ? 'Dijital Tesbih' : 'Rəqəmsal Təsbeh'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (lang === 'tr') {
        msg += `Aşağıdaki butonlara basarak zikir yapın.\n`;
        msg += `Her zikrin hedefine ulaştığında ✅ görünecek.\n\n`;
    } else {
        msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
        msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;
    }

    let totalCount = 0;
    for (const item of ZIKR_ITEMS) {
        totalCount += counts[item.id] || 0;
    }
    msg += `🔢 ${lang === 'tr' ? 'Toplam zikir sayısı' : 'Ümumi zikr sayı'}: <b>${totalCount}</b>`;

    await telegramSendMessage(botToken, chatId, msg, getZikrKeyboard(counts, lang));
}

// ═══════════════════════════════════════════════════════════════
//  QƏZA NAMAZI HESABLAYICISI
// ═══════════════════════════════════════════════════════════════

async function getMissedPrayers(chatId, env) {
    const key = `missed:${chatId}`;
    const data = await env.NOTIFICATIONS_KV.get(key, 'json');
    if (!data) {
        const defaults = {};
        for (const p of QEZA_PRAYERS) { defaults[p.id] = 0; }
        return defaults;
    }
    // Ensure all keys exist
    for (const p of QEZA_PRAYERS) {
        if (data[p.id] === undefined) data[p.id] = 0;
    }
    return data;
}

async function saveMissedPrayers(chatId, data, env) {
    const key = `missed:${chatId}`;
    await env.NOTIFICATIONS_KV.put(key, JSON.stringify(data));
}

function getQezaKeyboard(missed, lang = 'az') {
    const keyboard = [];
    for (const p of QEZA_PRAYERS) {
        const count = missed[p.id] || 0;
        const name = lang === 'tr' ? (p.name_tr || p.name) : p.name;
        keyboard.push([
            { text: `${name}: ${count}`, callback_data: 'noop' },
            { text: '➖', callback_data: `qeza_sub_${p.id}` },
            { text: '➕', callback_data: `qeza_add_${p.id}` },
        ]);
    }
    keyboard.push([{ text: lang === 'tr' ? '🔄 Tümünü sıfırla' : '🔄 Hamısını sıfırla', callback_data: 'qeza_reset' }]);
    keyboard.push([{ text: t('btn_back', lang), callback_data: 'cmd_menu' }]);
    return { inline_keyboard: keyboard };
}

async function cmdQeza(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const missed = await getMissedPrayers(chatId, env);

    let total = 0;
    for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }

    let msg = `🕌 <b>${lang === 'tr' ? 'Kaza Namazı Hesaplayıcısı' : 'Qəza Namazı Hesablayıcısı'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (lang === 'tr') {
        msg += `Kılmadığınız namazların sayısını takip edin.\n`;
        msg += `➕ ile artırın, ➖ ile azaltın.\n\n`;
        msg += `📊 Toplam kaza borcu: <b>${total}</b> namaz\n\n`;
        msg += `💡 <i>Her kaza namazı kıldığınızda ➖ basın.</i>`;
    } else {
        msg += `Qılmadığınız namazların sayını izləyin.\n`;
        msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
        msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
        msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
    }

    await telegramSendMessage(botToken, chatId, msg, getQezaKeyboard(missed, lang));
}

// ═══════════════════════════════════════════════════════════════
//  GÜNDƏLİK NAMAZ İZLƏYİCİSİ (TODO)
// ═══════════════════════════════════════════════════════════════

// İzlənən namazlar (imsak xaric — imsak namaz deyil)
const TRACKED_PRAYERS = ['subh', 'zohr', 'esr', 'meqrib', 'isha'];

async function getPrayerLog(chatId, dateStr, env) {
    const key = `prayer_log:${chatId}:${dateStr}`;
    const data = await env.NOTIFICATIONS_KV.get(key, 'json');
    if (!data) {
        const defaults = {};
        for (const p of TRACKED_PRAYERS) { defaults[p] = null; } // null = hələ işarələnməyib
        return defaults;
    }
    // Əksik açarları doldur
    for (const p of TRACKED_PRAYERS) {
        if (data[p] === undefined) data[p] = null;
    }
    return data;
}

async function savePrayerLog(chatId, dateStr, logData, env) {
    const key = `prayer_log:${chatId}:${dateStr}`;
    // 7 gün saxla
    await env.NOTIFICATIONS_KV.put(key, JSON.stringify(logData), { expirationTtl: 604800 });
}

function getNamazlarimKeyboard(prayerLog, dateStr, lang = 'az') {
    const pn = getPrayerNames(lang);
    const keyboard = [];
    const row1 = [];
    const row2 = [];

    for (let i = 0; i < TRACKED_PRAYERS.length; i++) {
        const p = TRACKED_PRAYERS[i];
        const status = prayerLog[p];
        const icon = status === true ? '✅' : '❌';
        const name = (pn[p] || p).replace(/^[^\s]+\s/, ''); // Emojini sil, ad qalsın
        const btn = { text: `${icon} ${name}`, callback_data: `nlog_${p}_${dateStr}` };
        if (i < 3) row1.push(btn);
        else row2.push(btn);
    }

    keyboard.push(row1);
    keyboard.push(row2);
    keyboard.push([{ text: t('btn_back', lang), callback_data: 'cmd_menu' }]);

    return { inline_keyboard: keyboard };
}

async function cmdNamazlarim(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);
    const lang = settings.language || 'az';
    const cityId = settings.city || 'baku';
    const now = getLocalNow(cityId);
    const dateStr = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`;

    const dayData = await getDayDataForCity(now.year, now.month, now.day, cityId, env);
    const prayerLog = await getPrayerLog(chatId, dateStr, env);
    const pn = getPrayerNames(lang);

    let msg = `${t('namazlarim_title', lang)} — ${now.dateStr}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let doneCount = 0;
    for (const p of TRACKED_PRAYERS) {
        const status = prayerLog[p];
        const icon = status === true ? '✅' : '❌';
        const name = pn[p] || p;
        const timeStr = dayData ? (dayData[p] || '??:??') : '??:??';
        msg += `${icon} ${name}  ${timeStr}\n`;
        if (status === true) doneCount++;
    }

    msg += `\n`;

    if (doneCount === TRACKED_PRAYERS.length) {
        msg += t('namazlarim_alldone', lang);
    } else {
        msg += t('namazlarim_desc', lang);
    }

    msg += `\n\n📍 ${getCityName(cityId, lang)}`;

    await telegramSendMessage(botToken, chatId, msg, getNamazlarimKeyboard(prayerLog, dateStr, lang));
}

// ═══════════════════════════════════════════════════════════════
//  DİNİ GÜNLƏR TƏQVİMİ
// ═══════════════════════════════════════════════════════════════

async function cmdTeqvim(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const baku = getBakuNow();
    const todayStr = `${baku.year}-${String(baku.month).padStart(2, '0')}-${String(baku.day).padStart(2, '0')}`;

    let msg = `📅 <b>${lang === 'tr' ? '2026 Dini Günler Takvimi' : '2026 Dini Günlər Təqvimi'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let upcomingCount = 0;

    for (const day of RELIGIOUS_DAYS_2026) {
        const isPast = day.date < todayStr;
        const isToday = day.date === todayStr;
        const dayName = lang === 'tr' ? (day.name_tr || day.name) : day.name;
        const dayDesc = lang === 'tr' ? (day.desc_tr || day.desc) : day.desc;

        const parts = day.date.split('-');
        const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;

        if (isToday) {
            msg += `👉 <b>${dayName}</b>\n`;
            msg += `    📅 ${dateStr} — <b>${lang === 'tr' ? 'BUGÜN!' : 'BU GÜN!'}</b>\n`;
            msg += `    <i>${dayDesc}</i>\n\n`;
        } else if (isPast) {
            msg += `✅ <s>${dayName}</s>\n`;
            msg += `    📅 ${dateStr}\n\n`;
        } else {
            upcomingCount++;
            const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const todayDate = new Date(baku.year, baku.month - 1, baku.day);
            const diffDays = Math.ceil((targetDate - todayDate) / (24 * 60 * 60 * 1000));
            msg += `⏳ <b>${dayName}</b>\n`;
            msg += `    📅 ${dateStr} — <b>${diffDays} ${lang === 'tr' ? 'gün kaldı' : 'gün qalıb'}</b>\n`;
            msg += `    <i>${dayDesc}</i>\n\n`;
        }
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    const cityId = settings.city || 'baku';
    msg += `📍 ${lang === 'tr' ? 'Kaynak' : 'Əsas'}: ${getCityAuthority(cityId, lang)}`;

    await telegramSendMessage(botToken, chatId, msg, getBackKeyboard(lang));
}

// ═══════════════════════════════════════════════════════════════
//  ƏSMA-ÜL HÜSNA (99 AD)
// ═══════════════════════════════════════════════════════════════

async function cmdAsma(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const randomIdx = Math.floor(Math.random() * ASMA_UL_HUSNA.length);
    const name = ASMA_UL_HUSNA[randomIdx];

    let msg = `📿 <b>${lang === 'tr' ? 'Esma-ül Hüsna — Allah\'\u0131n 99 Adı' : 'Əsma-ül Hüsna — Allahın 99 Adı'}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `<b>${name.num}/99</b>\n\n`;
    msg += `<b>${name.ar}</b>\n\n`;
    const displayName = lang === 'tr' ? azToTrTranscript(name.az) : name.az;
    msg += `🔤 <b>${displayName}</b>\n\n`;
    const meaningText = (lang === 'tr' && name.meaning_tr) ? name.meaning_tr : name.meaning;
    msg += `📖 <i>${meaningText}</i>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 ${lang === 'tr' ? 'Başka isim için butona basın.' : 'Başqa ad üçün düyməyə basın.'}`;

    const kb = {
        inline_keyboard: [
            [{ text: lang === 'tr' ? '📿 Başka isim' : '📿 Başqa ad', callback_data: 'cmd_asma_random' }],
            [{ text: lang === 'tr' ? '📋 Tümünü göster (1-33)' : '📋 Hamısını göstər (1-33)', callback_data: 'asma_list_1' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdAsmaList(botToken, chatId, page, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const perPage = 33;
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, 99);
    const totalPages = 3;

    let msg = `📿 <b>${lang === 'tr' ? 'Esma-ül Hüsna' : 'Əsma-ül Hüsna'}</b> (${start + 1}-${end}/99)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (let i = start; i < end; i++) {
        const n = ASMA_UL_HUSNA[i];
        const meaningText = (lang === 'tr' && n.meaning_tr) ? n.meaning_tr : n.meaning;
        const displayName = lang === 'tr' ? azToTrTranscript(n.az) : n.az;
        msg += `<b>${n.num}.</b> ${n.ar} — <b>${displayName}</b>\n    <i>${meaningText}</i>\n\n`;
    }

    const navRow = [];
    if (page > 1) navRow.push({ text: lang === 'tr' ? '◀️ Önceki' : '◀️ Əvvəlki', callback_data: `asma_list_${page - 1}` });
    if (page < totalPages) navRow.push({ text: lang === 'tr' ? 'Sonraki ▶️' : 'Növbəti ▶️', callback_data: `asma_list_${page + 1}` });

    const kb = {
        inline_keyboard: [
            navRow,
            [{ text: lang === 'tr' ? '📿 Rastgele isim' : '📿 Təsadüfi ad', callback_data: 'cmd_asma_random' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  CÜMɘ TƏBRİKLƏRİ
// ═══════════════════════════════════════════════════════════════

async function cmdCume(botToken, chatId, env) {
    const settings = env ? await getSettings(chatId, env) : {};
    const lang = settings.language || 'az';
    const randomIdx = Math.floor(Math.random() * FRIDAY_MESSAGES.length);
    const msg = getFridayMessage(randomIdx, lang);

    const kb = {
        inline_keyboard: [
            [{ text: lang === 'tr' ? '✨ Başka mesaj' : '✨ Başqa təbrik', callback_data: 'cmd_cume_random' }],
            [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  İSTİFADƏÇİ İZLƏMƏ & BROADCAST
// ═══════════════════════════════════════════════════════════════

async function trackUser(chatId, env, userObj = null) {
    const userKey = `user:${chatId}`;
    const now = new Date().toISOString();

    let existing = null;
    try {
        const raw = await env.NOTIFICATIONS_KV.get(userKey);
        if (raw) {
            try {
                existing = JSON.parse(raw);
            } catch {
                // Köhnə format: sadə ISO string idi
                existing = { joined: raw, lastActive: now, firstName: 'Naməlum' };
            }
        }
    } catch { /* KV xətası — davam et */ }

    if (!existing) {
        // Yeni istifadəçi
        const data = {
            firstName: userObj?.first_name || 'Naməlum',
            lastName: userObj?.last_name || '',
            username: userObj?.username || '',
            joined: now,
            lastActive: now,
        };
        await env.NOTIFICATIONS_KV.put(userKey, JSON.stringify(data));
        const countStr = await env.NOTIFICATIONS_KV.get('users:count');
        const count = countStr ? parseInt(countStr, 10) : 0;
        await env.NOTIFICATIONS_KV.put('users:count', String(count + 1));
    } else {
        // Mövcud istifadəçi — lastActive-i gündə 1 dəfə yenilə
        const todayStr = new Date(now).toISOString().split('T')[0];
        const lastActiveStr = existing.lastActive ? new Date(existing.lastActive).toISOString().split('T')[0] : '';
        let needsUpdate = false;

        if (todayStr !== lastActiveStr) {
            existing.lastActive = now;
            needsUpdate = true;
        }

        if (userObj?.first_name && existing.firstName !== userObj.first_name) {
            existing.firstName = userObj.first_name;
            needsUpdate = true;
        }
        if (userObj?.last_name && existing.lastName !== userObj.last_name) {
            existing.lastName = userObj.last_name;
            needsUpdate = true;
        }
        if (userObj?.username && existing.username !== userObj.username) {
            existing.username = userObj.username;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await env.NOTIFICATIONS_KV.put(userKey, JSON.stringify(existing));
        }
    }
}

async function getAllUserIds(env) {
    const users = [];
    let cursor = null;
    do {
        const result = await env.NOTIFICATIONS_KV.list({ prefix: 'user:', cursor, limit: 1000 });
        for (const key of result.keys) {
            if (key.name !== 'users:count') {
                const id = key.name.replace('user:', '');
                users.push(id);
            }
        }
        cursor = result.list_complete ? null : result.cursor;
    } while (cursor);
    return users;
}

async function cmdBroadcast(botToken, chatId, messageText, env) {
    const allowedId = String(env.ALLOWED_CHAT_ID);
    if (String(chatId) !== allowedId) {
        await telegramSendMessage(botToken, chatId, '⛔ Bu əmr yalnız admin üçündür.');
        return;
    }

    if (!messageText || messageText.trim() === '') {
        await telegramSendMessage(botToken, chatId, '⚠️ İstifadə: /broadcast <mesaj mətni>');
        return;
    }

    const userIds = await getAllUserIds(env);
    let sent = 0;
    let failed = 0;

    const broadcastMsg = `📢 <b>Elan:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n${messageText.trim()}`;

    for (const uid of userIds) {
        try {
            await telegramSendMessage(botToken, uid, broadcastMsg);
            sent++;
        } catch (e) {
            failed++;
        }
    }

    const report = `✅ Yayım tamamlandı!\n\n📤 Göndərildi: ${sent}\n❌ Uğursuz: ${failed}\n👥 Ümumi: ${userIds.length}`;
    await telegramSendMessage(botToken, chatId, report);
}

// ═══════════════════════════════════════════════════════════════
//  CALLBACK QUERY HANDLER (İnline Düymələr)
// ═══════════════════════════════════════════════════════════════

async function handleCallbackQuery(callbackQuery, env) {
    const botToken = env.BOT_TOKEN;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    // ── Əsas menyu əmrləri ──
    if (data === 'cmd_vaxtlar') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_today', lang));
        await cmdVaxtlar(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_sabah') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_tomorrow', lang));
        await cmdSabah(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_heftelik') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_weekly', lang));
        await cmdHeftelik(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_ay') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_monthly', lang));
        await cmdAy(botToken, chatId, '', env);
        return;
    }
    if (data === 'cmd_more') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '➥');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        let msg = `${t('more_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `${t('more_desc', lang)}`;
        await telegramSendMessage(botToken, chatId, msg, getSecondaryMenuKeyboard(lang));
        return;
    }
    if (data === 'cmd_namazlarim') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📋');
        await cmdNamazlarim(botToken, chatId, env);
        return;
    }
    if (data.startsWith('nlog_')) {
        // Format: nlog_{prayer}_{YYYY-MM-DD}
        const parts = data.replace('nlog_', '').split('_');
        const prayer = parts[0];
        const logDate = parts.slice(1).join('-'); // YYYY-MM-DD
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const pn = getPrayerNames(lang);

        const prayerLog = await getPrayerLog(chatId, logDate, env);

        // Toggle: null/false → true, true → null
        if (prayerLog[prayer] === true) {
            prayerLog[prayer] = null;
            const pName = pn[prayer] || prayer;
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('prayer_undone', lang).replace('{prayer}', pName));
        } else {
            prayerLog[prayer] = true;
            const pName = pn[prayer] || prayer;
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('prayer_done', lang).replace('{prayer}', pName));
        }
        await savePrayerLog(chatId, logDate, prayerLog, env);

        // Mesajı yenilə
        const cityId = settings.city || 'baku';
        const now = getLocalNow(cityId);
        const dayData = await getDayDataForCity(now.year, now.month, now.day, cityId, env);

        let doneCount = 0;
        let msg = `${t('namazlarim_title', lang)} — ${now.dateStr}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        for (const p of TRACKED_PRAYERS) {
            const status = prayerLog[p];
            const icon = status === true ? '✅' : '❌';
            const name = pn[p] || p;
            const timeStr = dayData ? (dayData[p] || '??:??') : '??:??';
            msg += `${icon} ${name}  ${timeStr}\n`;
            if (status === true) doneCount++;
        }

        msg += `\n`;
        if (doneCount === TRACKED_PRAYERS.length) {
            msg += t('namazlarim_alldone', lang);
        } else {
            msg += t('namazlarim_desc', lang);
        }
        msg += `\n\n📍 ${getCityName(cityId, lang)}`;

        await telegramEditMessage(botToken, chatId, messageId, msg, getNamazlarimKeyboard(prayerLog, logDate, lang));
        return;
    }
    if (data === 'cmd_help') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '❓');
        await cmdHelp(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_ayarlar') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '⚙️');
        await cmdAyarlar(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_menu') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🏠');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const cityId = settings.city || 'baku';
        const now = getLocalNow(cityId);
        const dayData = await getDayDataForCity(now.year, now.month, now.day, cityId, env);
        if (dayData) {
            const currentMinutes = now.hours * 60 + now.minutes;
            const isRam = isRamadan(now.year, now.month, now.day);
            const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(now.year, now.month, now.day) } : null;
            const reply = formatPrayerTimesMessage(dayData, now.dateStr, currentMinutes, t('today_title', lang), ramadanInfo, lang, cityId);
            await telegramEditMessage(botToken, chatId, messageId, reply, getMainMenuKeyboard(lang));
        } else {
            await telegramEditMessage(botToken, chatId, messageId, `${t('welcome_title', lang)}\n\n${t('welcome_buttons', lang)}`, getMainMenuKeyboard(lang));
        }
        return;
    }

    // ── Yeni əmrlər: Zikr, Hədis, Hicri ──
    if (data === 'cmd_zikr') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_tesbeh', lang));
        await cmdZikr(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_hedis') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📖');
        await cmdHedis(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_hedis_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const randomIdx = Math.floor(Math.random() * (lang === 'tr' ? [...RAMADAN_DAILY_QUOTES_TR, ...EXTENDED_HADITH_DB_TR].length : [...RAMADAN_DAILY_QUOTES, ...EXTENDED_HADITH_DB].length));
        const hadithText = getHadith(randomIdx, lang);
        const baku = getBakuNow();
        const hijriStr = formatHijriDate(baku.year, baku.month, baku.day, lang);
        let msg = `📿 <b>${lang === 'tr' ? 'Rastgele Hadis' : 'Təsadüfi Hədis'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `<i>${hadithText}</i>\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `☪️ ${hijriStr}`;
        const kb = {
            inline_keyboard: [
                [{ text: lang === 'tr' ? '📿 Başka hadis' : '📿 Başqa hədis', callback_data: 'cmd_hedis_random' }],
                [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
            ],
        };
        await telegramSendMessage(botToken, chatId, msg, kb);
        return;
    }
    if (data === 'cmd_cevir_today') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅');
        const baku = getBakuNow();
        await cmdCevir(botToken, chatId, baku.dateStr, env);
        return;
    }

    // ── Yeni əmrlər: Qəza, Təqvim, Əsma, Cümə ──
    if (data === 'cmd_qeza') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('toast_qaza', lang));
        await cmdQeza(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_teqvim') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅');
        await cmdTeqvim(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_asma') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿');
        await cmdAsma(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_asma_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿');
        await cmdAsma(botToken, chatId, env);
        return;
    }
    if (data.startsWith('asma_list_')) {
        const page = parseInt(data.replace('asma_list_', ''), 10);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `📋 ${page}`);
        await cmdAsmaList(botToken, chatId, page, env);
        return;
    }
    if (data === 'cmd_cume' || data === 'cmd_cume_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '✨');
        await cmdCume(botToken, chatId, env);
        return;
    }

    // ── Qəza namazı düymələri ──
    if (data.startsWith('qeza_add_')) {
        const prayerId = data.replace('qeza_add_', '');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const missed = await getMissedPrayers(chatId, env);
        missed[prayerId] = (missed[prayerId] || 0) + 1;
        await saveMissedPrayers(chatId, missed, env);
        const prayerItem = QEZA_PRAYERS.find(p => p.id === prayerId);
        const pName = lang === 'tr' ? (prayerItem?.name_tr || prayerItem?.name || prayerId) : (prayerItem?.name || prayerId);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `➕ ${pName}: ${missed[prayerId]}`);
        let total = 0;
        for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }
        let msg = `🕌 <b>${lang === 'tr' ? 'Kaza Namazı Hesaplayıcısı' : 'Qəza Namazı Hesablayıcısı'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `Kılmadığınız namazların sayısını takip edin.\n`;
            msg += `➕ ile artırın, ➖ ile azaltın.\n\n`;
            msg += `📊 Toplam kaza borcu: <b>${total}</b> namaz\n\n`;
            msg += `💡 <i>Her kaza namazı kıldığınızda ➖ basın.</i>`;
        } else {
            msg += `Qılmadığınız namazların sayını izləyin.\n`;
            msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
            msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
            msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        }
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(missed, lang));
        return;
    }
    if (data.startsWith('qeza_sub_')) {
        const prayerId = data.replace('qeza_sub_', '');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const missed = await getMissedPrayers(chatId, env);
        if ((missed[prayerId] || 0) > 0) {
            missed[prayerId] = missed[prayerId] - 1;
            await saveMissedPrayers(chatId, missed, env);
        }
        const prayerItem = QEZA_PRAYERS.find(p => p.id === prayerId);
        const pName = lang === 'tr' ? (prayerItem?.name_tr || prayerItem?.name || prayerId) : (prayerItem?.name || prayerId);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `➖ ${pName}: ${missed[prayerId]}`);
        let total = 0;
        for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }
        let msg = `🕌 <b>${lang === 'tr' ? 'Kaza Namazı Hesaplayıcısı' : 'Qəza Namazı Hesablayıcısı'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `Kılmadığınız namazların sayısını takip edin.\n`;
            msg += `➕ ile artırın, ➖ ile azaltın.\n\n`;
            msg += `📊 Toplam kaza borcu: <b>${total}</b> namaz\n\n`;
            msg += `💡 <i>Her kaza namazı kıldığınızda ➖ basın.</i>`;
        } else {
            msg += `Qılmadığınız namazların sayını izləyin.\n`;
            msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
            msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
            msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        }
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(missed, lang));
        return;
    }
    if (data === 'qeza_reset') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const defaults = {};
        for (const p of QEZA_PRAYERS) { defaults[p.id] = 0; }
        await saveMissedPrayers(chatId, defaults, env);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, lang === 'tr' ? '🔄 Sıfırlandı!' : '🔄 Sıfırlandı!');
        let msg = `🕌 <b>${lang === 'tr' ? 'Kaza Namazı Hesaplayıcısı' : 'Qəza Namazı Hesablayıcısı'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `Kılmadığınız namazların sayısını takip edin.\n`;
            msg += `➕ ile artırın, ➖ ile azaltın.\n\n`;
            msg += `📊 Toplam kaza borcu: <b>0</b> namaz\n\n`;
            msg += `💡 <i>Her kaza namazı kıldığınızda ➖ basın.</i>`;
        } else {
            msg += `Qılmadığınız namazların sayını izləyin.\n`;
            msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
            msg += `📊 Ümumi qəza borcu: <b>0</b> namaz\n\n`;
            msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        }
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(defaults, lang));
        return;
    }
    if (data === 'noop') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        return;
    }

    // ─── Dil seçimi ───
    if (data === 'set_lang_menu') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🌐');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        let msg = `${t('lang_select_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += t('lang_select_desc', lang);
        const kb = {
            inline_keyboard: [
                [{ text: `🇦🇿 Azərbaycan${lang === 'az' ? ' ✅' : ''}`, callback_data: 'set_lang_az' }],
                [{ text: `🇹🇷 Türkçe${lang === 'tr' ? ' ✅' : ''}`, callback_data: 'set_lang_tr' }],
                [{ text: t('btn_back', lang), callback_data: 'cmd_ayarlar' }],
            ],
        };
        await telegramEditMessage(botToken, chatId, messageId, msg, kb);
        return;
    }
    if (data === 'set_lang_az' || data === 'set_lang_tr') {
        const newLang = data === 'set_lang_tr' ? 'tr' : 'az';
        const settings = await getSettings(chatId, env);
        settings.language = newLang;
        await saveSettings(chatId, settings, env);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('lang_changed', newLang));
        // Ayarları yenidən göstər (yeni dildə)
        let msg = `${t('settings_title', newLang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `${t('settings_desc', newLang)}\n\n`;
        msg += t('settings_active', newLang);
        await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings, newLang));
        return;
    }

    // ─── Şəhər seçimi (Ölkə → Şəhər) ───
    if (data === 'set_city_menu') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📍');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        let msg = `${t('country_select_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += t('country_select_desc', lang);
        const kb = {
            inline_keyboard: [
                [{ text: '🇦🇿 Azərbaycan', callback_data: 'set_country_az' }],
                [{ text: '🇹🇷 Türkiye', callback_data: 'set_country_tr_1' }],
                [{ text: t('btn_back', lang), callback_data: 'cmd_ayarlar' }],
            ],
        };
        await telegramEditMessage(botToken, chatId, messageId, msg, kb);
        return;
    }
    // ── Azərbaycan şəhərləri ──
    if (data === 'set_country_az') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🇦🇿');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const currentCity = settings.city || 'baku';
        let msg = `${t('city_select_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `🇦🇿 ${lang === 'tr' ? 'Azerbaycan şehirleri:' : 'Azərbaycan şəhərləri:'}`;
        const buttons = [];
        for (const id of AZERBAIJAN_CITIES) {
            const name = getCityName(id, lang);
            const check = (id === currentCity) ? ' ✅' : '';
            buttons.push([{ text: `🇦🇿 ${name}${check}`, callback_data: `set_city_${id}` }]);
        }
        buttons.push([{ text: t('btn_back', lang), callback_data: 'set_city_menu' }]);
        await telegramEditMessage(botToken, chatId, messageId, msg, { inline_keyboard: buttons });
        return;
    }
    // ── Türkiyə şəhərləri (səhifələmə ilə) ──
    if (data.startsWith('set_country_tr_')) {
        const page = parseInt(data.replace('set_country_tr_', ''), 10) || 1;
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🇹🇷');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const currentCity = settings.city || 'baku';
        const totalPages = Math.ceil(TURKEY_CITIES.length / CITIES_PER_PAGE);
        const start = (page - 1) * CITIES_PER_PAGE;
        const end = Math.min(start + CITIES_PER_PAGE, TURKEY_CITIES.length);
        const pageCities = TURKEY_CITIES.slice(start, end);
        let msg = `${t('city_select_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `🇹🇷 ${lang === 'tr' ? 'Türkiye şehirleri' : 'Türkiyə şəhərləri'}\n`;
        msg += `📄 ${t('city_page_info', lang).replace('{page}', page).replace('{total}', totalPages)}`;
        const buttons = [];
        // Hər sətirdə 2 şəhər göstər
        for (let i = 0; i < pageCities.length; i += 2) {
            const row = [];
            const id1 = pageCities[i];
            const name1 = getCityName(id1, lang);
            const check1 = (id1 === currentCity) ? ' ✅' : '';
            row.push({ text: `${name1}${check1}`, callback_data: `set_city_${id1}` });
            if (i + 1 < pageCities.length) {
                const id2 = pageCities[i + 1];
                const name2 = getCityName(id2, lang);
                const check2 = (id2 === currentCity) ? ' ✅' : '';
                row.push({ text: `${name2}${check2}`, callback_data: `set_city_${id2}` });
            }
            buttons.push(row);
        }
        // Naviqasiya düymələri
        const navRow = [];
        if (page > 1) navRow.push({ text: lang === 'tr' ? '◀️ Önceki' : '◀️ Əvvəlki', callback_data: `set_country_tr_${page - 1}` });
        if (page < totalPages) navRow.push({ text: lang === 'tr' ? 'Sonraki ▶️' : 'Növbəti ▶️', callback_data: `set_country_tr_${page + 1}` });
        if (navRow.length > 0) buttons.push(navRow);
        buttons.push([{ text: t('btn_back', lang), callback_data: 'set_city_menu' }]);
        await telegramEditMessage(botToken, chatId, messageId, msg, { inline_keyboard: buttons });
        return;
    }
    if (data.startsWith('set_city_')) {
        const newCity = data.replace('set_city_', '');
        if (!CITIES[newCity]) {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '❌');
            return;
        }
        const settings = await getSettings(chatId, env);
        settings.city = newCity;
        await saveSettings(chatId, settings, env);
        const lang = settings.language || 'az';
        const cityName = getCityName(newCity, lang);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('city_changed', lang).replace('{city}', cityName));
        let msg = `${t('settings_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `${t('settings_desc', lang)}\n\n`;
        msg += t('settings_active', lang);
        await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings, lang));
        return;
    }

    // ── Zikr sayğac düymələri ──
    if (data.startsWith('zikr_plus_')) {
        const zikrId = data.replace('zikr_plus_', '');
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';

        const counts = {};
        if (callbackQuery.message && callbackQuery.message.reply_markup && callbackQuery.message.reply_markup.inline_keyboard) {
            const kb = callbackQuery.message.reply_markup.inline_keyboard;
            for (const row of kb) {
                if (row.length > 0 && row[0].callback_data && row[0].callback_data.startsWith('zikr_info_')) {
                    const id = row[0].callback_data.replace('zikr_info_', '');
                    const txt = row[0].text;
                    const match = txt.match(/: (\d+)\/\d+/);
                    if (match) {
                        counts[id] = parseInt(match[1], 10);
                    }
                }
            }
        }

        counts[zikrId] = (counts[zikrId] || 0) + 1;
        const item = ZIKR_ITEMS.find(z => z.id === zikrId);
        const label = item ? (lang === 'tr' ? (item.name_tr || item.name) : item.name) : zikrId;
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `${label}: ${counts[zikrId]}`);
        let totalCount = 0;
        for (const zi of ZIKR_ITEMS) { totalCount += counts[zi.id] || 0; }
        let msg = `📿 <b>${lang === 'tr' ? 'Dijital Tesbih' : 'Rəqəmsal Təsbeh'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `Aşağıdaki butonlara basarak zikir yapın.\n`;
            msg += `Her zikrin hedefine ulaştığında ✅ görünecek.\n\n`;
        } else {
            msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
            msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;
        }
        msg += `🔢 ${lang === 'tr' ? 'Toplam zikir sayısı' : 'Ümumi zikr sayı'}: <b>${totalCount}</b>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getZikrKeyboard(counts, lang));
        return;
    }
    if (data.startsWith('zikr_info_')) {
        const zikrId = data.replace('zikr_info_', '');
        const item = ZIKR_ITEMS.find(z => z.id === zikrId);
        if (item) {
            const settings = await getSettings(chatId, env);
            const lang = settings.language || 'az';
            const name = lang === 'tr' ? (item.name_tr || item.name) : item.name;
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `${item.label} — ${name}`);
        } else {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        }
        return;
    }
    if (data === 'zikr_reset') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, lang === 'tr' ? '🔄 Sıfırlandı!' : '🔄 Sıfırlandı!');
        let msg = `📿 <b>${lang === 'tr' ? 'Dijital Tesbih' : 'Rəqəmsal Təsbeh'}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (lang === 'tr') {
            msg += `Aşağıdaki butonlara basarak zikir yapın.\n`;
            msg += `Her zikrin hedefine ulaştığında ✅ görünecek.\n\n`;
        } else {
            msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
            msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;
        }
        msg += `🔢 ${lang === 'tr' ? 'Toplam zikir sayısı' : 'Ümumi zikr sayı'}: <b>0</b>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getZikrKeyboard({}, lang));
        return;
    }

    // ── Ayarlar toggle ──
    if (data === 'noop') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        return;
    }

    if (data === 'set_notifications_off') {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        settings.reminder15 = false;
        settings.reminder10 = false;
        settings.reminder5 = false;
        settings.reminderOnTime = false;
        settings.morningSchedule = false;
        settings.prayers.imsak = false;
        settings.prayers.subh = false;
        settings.prayers.zohr = false;
        settings.prayers.esr = false;
        settings.prayers.meqrib = false;
        settings.prayers.isha = false;
        await saveSettings(chatId, settings, env);

        // ── Schedule-u invalidate et ki yeni ayarlar tətbiq olunsun ──
        try {
            const baku = getBakuNow();
            await env.NOTIFICATIONS_KV.delete(`schedule_full:${baku.isoDate}`);
            console.log(`🔄 Schedule invalidated: all notifications off for user ${chatId}`);
        } catch (e) {
            console.error(`⚠️ Schedule invalidate xətası: ${e}`);
        }

        let msg = `${t('settings_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `${t('settings_all_off_done', lang)}\n\n`;
        msg += `${t('settings_desc', lang)}\n\n`;
        msg += t('settings_active', lang);

        await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings, lang));
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('settings_all_off_done', lang));
        return;
    }

    if (data.startsWith('set_')) {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        let settingName = data.replace('set_', '');
        let changed = false;

        // Namaz ayarları
        if (settingName.startsWith('p_')) {
            const prayer = settingName.replace('p_', '');
            if (settings.prayers.hasOwnProperty(prayer)) {
                settings.prayers[prayer] = !settings.prayers[prayer];
                changed = true;
            }
        } else {
            // Ümumi ayarlar
            if (settings.hasOwnProperty(settingName) && typeof settings[settingName] === 'boolean') {
                settings[settingName] = !settings[settingName];
                changed = true;
            }
        }

        if (changed) {
            await saveSettings(chatId, settings, env);

            // ── Schedule-u invalidate et ki yeni ayarlar tətbiq olunsun ──
            try {
                const baku = getBakuNow();
                await env.NOTIFICATIONS_KV.delete(`schedule_full:${baku.isoDate}`);
                console.log(`🔄 Schedule invalidated: settings changed for user ${chatId}`);
            } catch (e) {
                console.error(`⚠️ Schedule invalidate xətası: ${e}`);
            }

            let msg = `${t('settings_title', lang)}\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `${t('settings_desc', lang)}\n\n`;
            msg += t('settings_active', lang);

            await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings, lang));
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('settings_updated', lang));
        } else {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        }
        return;
    }

    // ── Ramazan əmrləri ──
    if (data === 'cmd_ramazan') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🌙');
        await cmdRamazan(botToken, chatId, env, 1);
        return;
    }
    if (data === 'cmd_stats') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📊');
        await cmdRamazanStats(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_dua') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🤲');
        await cmdDua(botToken, chatId, env);
        return;
    }

    // ── Ramazan səhifə naviqasiyası ──
    if (data.startsWith('ramazan_page_')) {
        const page = parseInt(data.replace('ramazan_page_', ''), 10);
        const _s = await getSettings(chatId, env);
        const _l = _s.language || 'az';
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `📄 ${_l === 'tr' ? 'Sayfa' : 'Səhifə'} ${page}`);
        await cmdRamazan(botToken, chatId, env, page);
        return;
    }

    // ── Oruc statusu düymələri ──
    if (data.startsWith('fast_')) {
        const settings = env ? await getSettings(chatId, env) : {};
        const lang = settings.language || 'az';
        const baku = getBakuNow();
        const year = baku.year;
        const parts = data.split('_');
        const action = parts[1]; // yes, no, undo
        const dayNum = parseInt(parts[2], 10);

        if (!canMarkFasting(dayNum, year)) {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('fasting_cannot_mark', lang));
            return;
        }

        const fastingStatus = await getFastingStatus(chatId, year, env);

        if (action === 'yes') {
            fastingStatus[dayNum] = true;
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('fasting_marked_yes', lang).replace('{day}', dayNum));
        } else if (action === 'no') {
            fastingStatus[dayNum] = false;
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('fasting_marked_no', lang).replace('{day}', dayNum));
        } else if (action === 'undo') {
            delete fastingStatus[dayNum];
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, t('fasting_cancelled', lang).replace('{day}', dayNum));
        }

        // TODO: Mesajı yeniləmək üçün burada editMessage istifadə edilə bilər
        // Hazırda sadəcə yeni Ramazan təqvimi göndərilir
        // Hansı səhifədə dayNum var tapaq
        const pageNum = Math.ceil(dayNum / 10);
        await cmdRamazan(botToken, chatId, env, pageNum);
        return;
    }

    // ── Kanal ayarları toggle (gizli admin) ──
    if (data.startsWith('chset_')) {
        const allowedId = String(env.ALLOWED_CHAT_ID);
        if (String(chatId) !== allowedId) {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
            return;
        }

        const prayer = data.replace('chset_', '');
        const chSettings = await getChannelSettings(env);

        if (chSettings.hasOwnProperty(prayer)) {
            chSettings[prayer] = !chSettings[prayer];
            await saveChannelSettings(chSettings, env);

            const status = chSettings[prayer] ? '✅ Aktiv' : '❌ Deaktiv';
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `${status}`);

            let msg = `📡 <b>Kanal Bildiriş Ayarları</b>\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `Kanal: <code>${CHANNEL_ID}</code>\n\n`;
            msg += `Hansı namaz vaxtlarında kanala\nbildiriş göndərilsin?\n\n`;
            msg += `✅ = Aktiv  |  ❌ = Deaktiv`;

            await telegramEditMessage(botToken, chatId, messageId, msg, getChannelSettingsKeyboard(chSettings));
        } else {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        }
        return;
    }

    await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
}

// ═══════════════════════════════════════════════════════════════
//  WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleWebhook(request, env) {
    let update;
    try {
        update = await request.json();
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    // ── Callback Query (inline düymə basıldı) ──
    if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, env);
        return new Response('OK', { status: 200 });
    }

    const message = update.message;
    if (!message || !message.text) {
        return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const botToken = env.BOT_TOKEN;

    // ── İstifadəçini izlə (KV-yə yaz) ──
    await trackUser(chatId, env, message.from);

    // ── /start ──
    if (text.startsWith('/start')) {
        await cmdStart(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /namazlarim | /namazlarım ──
    if (text.startsWith('/namazlarim') || text.startsWith('/namazlarım') || text.startsWith('/namaz') || text.startsWith('/todo')) {
        await cmdNamazlarim(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /vaxtlar | /vakitler ──
    if (text.startsWith('/vaxtlar') || text.startsWith('/bugün') || text.startsWith('/bugun') || text.startsWith('/today') || text.startsWith('/vakitler') || text.startsWith('/ezan')) {
        await cmdVaxtlar(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /sabah | /yarin ──
    if (text.startsWith('/sabah') || text.startsWith('/tomorrow') || text.startsWith('/yarin') || text.startsWith('/yarın')) {
        await cmdSabah(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /heftelik | /haftalik ──
    if (text.startsWith('/heftelik') || text.startsWith('/həftəlik') || text.startsWith('/weekly') || text.startsWith('/heftə') || text.startsWith('/haftalik') || text.startsWith('/haftalık')) {
        await cmdHeftelik(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /tarix | /tarih ──
    if (text.startsWith('/tarix') || text.startsWith('/date') || text.startsWith('/tarih')) {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        const dateText = text.replace(/^\/(tarix|date|tarih)\s*/, '').trim();
        if (!dateText) {
            let reply = t('tarix_help_title', lang) + `\n\n`;
            if (lang === 'tr') {
                reply += `/tarih 25.03.2026\n`;
                reply += `/tarih 25.03\n`;
                reply += `/tarih 25 mart\n`;
                reply += `/tarih 25 mart 2026`;
            } else {
                reply += `/tarix 25.03.2026\n`;
                reply += `/tarix 25.03\n`;
                reply += `/tarix 25 mart\n`;
                reply += `/tarix 25 mart 2026`;
            }
            await telegramSendMessage(botToken, chatId, reply, getBackKeyboard(lang));
        } else {
            await cmdTarix(botToken, chatId, dateText, env);
        }
        return new Response('OK', { status: 200 });
    }

    // ── /ayarlar ──
    if (text.startsWith('/ayarlar') || text.startsWith('/settings')) {
        await cmdAyarlar(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /dil ──
    if (text.startsWith('/dil') || text.startsWith('/language')) {
        const settings = await getSettings(chatId, env);
        const lang = settings.language || 'az';
        let msg = `${t('dil_cmd_title', lang)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += t('dil_cmd_desc', lang);
        const kb = {
            inline_keyboard: [
                [{ text: `🇦🇿 Azərbaycan${lang === 'az' ? ' ✅' : ''}`, callback_data: 'set_lang_az' }],
                [{ text: `🇹🇷 Türkçe${lang === 'tr' ? ' ✅' : ''}`, callback_data: 'set_lang_tr' }],
                [{ text: t('btn_back', lang), callback_data: 'cmd_menu' }],
            ],
        };
        await telegramSendMessage(botToken, chatId, msg, kb);
        return new Response('OK', { status: 200 });
    }

    // ── /ay | /aylik ──
    if (text.startsWith('/ayliq') || text.startsWith('/aylıq') || text.startsWith('/monthly') || text.startsWith('/aylik') || text.startsWith('/aylık')) {
        const argText = text.replace(/^\/(ayliq|ayl\u0131q|monthly|aylik|ayl\u0131k)\s*/, '').trim();
        await cmdAy(botToken, chatId, argText, env);
        return new Response('OK', { status: 200 });
    }
    if (text.startsWith('/ay')) {
        const argText = text.replace(/^\/ay\s*/, '').trim();
        await cmdAy(botToken, chatId, argText, env);
        return new Response('OK', { status: 200 });
    }

    // /qible silindi — artıq dəstəklənmir

    // ── /help | /yardim ──
    if (text.startsWith('/help') || text.startsWith('/komek') || text.startsWith('/kömək') || text.startsWith('/yardim') || text.startsWith('/yardım')) {
        await cmdHelp(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /ramazan ──
    if (text.startsWith('/ramazan') || text.startsWith('/ramadan') || text.startsWith('/oruc') || text.startsWith('/oruç')) {
        await cmdRamazan(botToken, chatId, env, 1);
        return new Response('OK', { status: 200 });
    }

    // ── /statistika | /istatistik ──
    if (text.startsWith('/statistika') || text.startsWith('/stats') || text.startsWith('/istatistik')) {
        await cmdRamazanStats(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /dua ──
    if (text.startsWith('/dua')) {
        await cmdDua(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /cevir ──
    if (text.startsWith('/cevir') || text.startsWith('/çevir') || text.startsWith('/hicri')) {
        const dateText = text.replace(/^\/(cevir|\u00e7evir|hicri)\s*/, '').trim();
        if (!dateText) {
            const baku = getBakuNow();
            await cmdCevir(botToken, chatId, baku.dateStr, env);
        } else {
            await cmdCevir(botToken, chatId, dateText, env);
        }
        return new Response('OK', { status: 200 });
    }

    // ── /hedis ──
    if (text.startsWith('/hedis') || text.startsWith('/hadis')) {
        await cmdHedis(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /zikr | /zikir | /tesbih ──
    if (text.startsWith('/zikr') || text.startsWith('/tesbeh') || text.startsWith('/təsbeh') || text.startsWith('/zikir') || text.startsWith('/tesbih') || text.startsWith('/tespih')) {
        await cmdZikr(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /qeza | /kaza ──
    if (text.startsWith('/qeza') || text.startsWith('/qəza') || text.startsWith('/kaza')) {
        await cmdQeza(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /teqvim | /takvim ──
    if (text.startsWith('/teqvim') || text.startsWith('/təqvim') || text.startsWith('/calendar') || text.startsWith('/takvim')) {
        await cmdTeqvim(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /asma ──
    if (text.startsWith('/asma') || text.startsWith('/esma') || text.startsWith('/husna') || text.startsWith('/99')) {
        await cmdAsma(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /cume | /cuma ──
    if (text.startsWith('/cume') || text.startsWith('/cümə') || text.startsWith('/friday') || text.startsWith('/juma') || text.startsWith('/cuma')) {
        await cmdCume(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /broadcast (admin) ──
    if (text.startsWith('/broadcast')) {
        const messageText = text.replace(/^\/broadcast\s*/, '').trim();
        await cmdBroadcast(botToken, chatId, messageText, env);
        return new Response('OK', { status: 200 });
    }

    // ── /kanal_ayarlar (gizli admin) ──
    if (text.startsWith('/kanal_ayarlar') || text.startsWith('/kanal')) {
        await cmdChannelSettings(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // Tanınmayan əmr
    return new Response('OK', { status: 200 });
}

// ═══════════════════════════════════════════════════════════════
//  PRE-SCHEDULED BİLDİRİŞ SİSTEMİ
// ═══════════════════════════════════════════════════════════════

async function buildDailySchedule(env) {
    const baku = getBakuNow();
    const isoDate = baku.isoDate;
    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const allUsers = await getAllUserIds(env);

    // Şəhərə görə qrupla
    const cityGroups = {};
    const userSettingsMap = {};
    for (const uid of allUsers) {
        const settings = await getSettings(uid, env);
        userSettingsMap[uid] = settings;
        const cityId = settings.city || 'baku';
        if (!cityGroups[cityId]) cityGroups[cityId] = [];
        cityGroups[cityId].push(uid);
    }

    // Şəhər və Bakı arasındakı dəqiqə fərqini hesablayan köməkçi
    function getCityOffsetToBakuMinutes(cId) {
        if (cId === 'baku') return 0;
        const cTZ = CITIES[cId] ? CITIES[cId].timezone : 'Asia/Baku';
        const now = new Date();
        const bNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Baku' }));
        const cNow = new Date(now.toLocaleString('en-US', { timeZone: cTZ }));
        return Math.round((bNow.getTime() - cNow.getTime()) / 60000);
    }

    // Timeslot-ları topla
    const timeslots = {};

    function addJob(hour, minute, job, dayShift = 0) {
        let h = hour;
        let m = minute;

        while (m < 0) { h--; m += 60; }
        while (m >= 60) { h++; m -= 60; }

        while (h < 0) { dayShift--; h += 24; }
        while (h >= 24) { dayShift++; h -= 24; }

        let targetIsoDate = baku.isoDate;
        if (dayShift !== 0) {
            const targetDateInfo = getLocalDateOffset(dayShift, 'baku');
            targetIsoDate = targetDateInfo.isoDate;
        }

        const key = `${targetIsoDate}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!timeslots[key]) timeslots[key] = [];
        timeslots[key].push(job);
    }

    // Hər şəhər üçün namaz vaxtlarını al və job-ları yarat
    for (const [cityId, userIds] of Object.entries(cityGroups)) {
        const dayData = await getDayDataForCity(baku.year, baku.month, baku.day, cityId, env);
        if (!dayData) continue;
        const cityOffset = getCityOffsetToBakuMinutes(cityId);

        for (const uid of userIds) {
            const settings = userSettingsMap[uid];
            const lang = settings.language || 'az';

            // Namaz bildirişləri
            for (const prayer of NOTIFY_PRAYERS) {
                if (!settings.prayers[prayer]) continue;
                const prayerTimeStr = dayData[prayer];
                if (!prayerTimeStr) continue;
                const [pH, pM] = prayerTimeStr.split(':').map(Number);
                const baseCronM = pM + cityOffset;

                // Reminder-lər (15, 10, 5 dəq əvvəl)
                for (const reminderMin of REMINDER_MINUTES) {
                    const settingKey = `reminder${reminderMin}`;
                    if (!settings[settingKey]) continue;
                    addJob(pH, baseCronM - reminderMin, {
                        userId: uid, type: `reminder${reminderMin}`,
                        prayer, prayerTime: prayerTimeStr, cityId, lang,
                    });
                }

                // Vaxt gəldi (on-time)
                if (settings.reminderOnTime) {
                    addJob(pH, baseCronM, {
                        userId: uid, type: 'ontime',
                        prayer, prayerTime: prayerTimeStr, cityId, lang,
                    });
                }

                // Ramazan: iftara 30 dəq qalmış
                if (isRam && prayer === 'meqrib') {
                    addJob(pH, baseCronM - 30, {
                        userId: uid, type: 'iftar_30',
                        prayer: 'meqrib', prayerTime: prayerTimeStr, cityId, lang,
                    });
                }

                // Ramazan: iftar + 30 dəq sonra oruc sualı
                if (isRam && prayer === 'meqrib') {
                    const fpH = pH;
                    const fpM = baseCronM + 30;
                    console.log(`📝 fasting_prompt yaradıldı: user=${uid}, meqrib=${prayerTimeStr}, prompt_time=${fpH}:${fpM}, cityOffset=${cityOffset}`);
                    addJob(fpH, fpM, {
                        userId: uid, type: 'fasting_prompt',
                        prayer: 'meqrib', prayerTime: prayerTimeStr, cityId, lang,
                    });
                }
            }

            // Səhər cədvəli (05:00 yerli vaxt)
            if (settings.morningSchedule) {
                addJob(5, cityOffset, {
                    userId: uid, type: 'morning',
                    prayer: null, prayerTime: null, cityId, lang,
                });
            }
        }
    }

    // Kanal bildirişləri (Bakı vaxtı ilə)
    const chSettings = await getChannelSettings(env);
    const activePrayers = Object.keys(chSettings).filter(k => chSettings[k]);
    const bakuDayData = await getDayDataForCity(baku.year, baku.month, baku.day, 'baku', env);
    if (bakuDayData) {
        for (const prayer of activePrayers) {
            const prayerTimeStr = bakuDayData[prayer];
            if (!prayerTimeStr) continue;
            const [pH, pM] = prayerTimeStr.split(':').map(Number);
            addJob(pH, pM, {
                userId: CHANNEL_ID, type: 'channel',
                prayer, prayerTime: prayerTimeStr, cityId: 'baku', lang: 'az',
            });
        }
    }

    // KV-yə yaz — bütün günün schedule-unu BİR key-ə (KV put optimallaşdırması)
    const totalTimeslots = Object.keys(timeslots).length;
    const totalJobs = Object.values(timeslots).reduce((s, j) => s + j.length, 0);
    const timeslotKeys = Object.keys(timeslots).slice(0, 5); // İlk 5 key-i göstər

    if (totalJobs === 0) {
        console.warn(`⚠️ Schedule boşdur! User sayı: ${allUsers.length}, city groups: ${JSON.stringify(Object.keys(cityGroups))}`);
    }

    console.log(`📝 Schedule yazılır: schedule_full:${isoDate}, ${totalTimeslots} timeslot, ${totalJobs} job, users: ${allUsers.length}, ilk key-lər: [${timeslotKeys.join(', ')}]`);

    await env.NOTIFICATIONS_KV.put(
        `schedule_full:${isoDate}`,
        JSON.stringify(timeslots),
        { expirationTtl: 86400 * 2 }
    );

    console.log(`✅ Gündəlik cədvəl quruldu: ${isoDate}, ${totalTimeslots} timeslot, ${totalJobs} job (1 KV put)`);
}

function formatNotificationMessage(job, dayData, baku, isRam) {
    const lang = job.lang || 'az';
    const cityId = job.cityId || 'baku';
    const cityName = getCityName(cityId, lang);
    const prayerNamesMap = getPrayerNames(lang);
    const pName = job.prayer ? (prayerNamesMap[job.prayer] || PRAYER_NAMES[job.prayer] || job.prayer) : '';
    const prayerTimeStr = job.prayerTime || '';

    switch (job.type) {
        case 'reminder15':
        case 'reminder10':
        case 'reminder5': {
            const reminderMin = parseInt(job.type.replace('reminder', ''), 10);
            const emoji = reminderMin === 5 ? '🔴' : reminderMin === 10 ? '🟡' : '🟢';
            const minWord = lang === 'tr' ? 'dakika' : 'dəqiqə';

            if (isRam && job.prayer === 'meqrib') {
                return lang === 'tr'
                    ? `${emoji} 🌙 <b>İftara ${reminderMin} ${minWord}</b> kaldı!\n\n🕐 İftar vakti: ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Az kaldı, sabret!`
                    : `${emoji} 🌙 <b>İftara ${reminderMin} ${minWord}</b> qalıb!\n\n🕐 İftar vaxtı: ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Az qaldı, səbr et!`;
            } else if (isRam && job.prayer === 'imsak') {
                return lang === 'tr'
                    ? `${emoji} 🌙 <b>Sahura (İmsak) ${reminderMin} ${minWord}</b> kaldı!\n\n🕐 İmsak vakti: ${prayerTimeStr}\n📍 ${cityName}\n\n🍽 Son yemek vakti yaklaşıyor!`
                    : `${emoji} 🌙 <b>Səhərə (İmsak) ${reminderMin} ${minWord}</b> qalıb!\n\n🕐 İmsak vaxtı: ${prayerTimeStr}\n📍 ${cityName}\n\n🍽 Son yemək vaxtı yaxınlaşır!`;
            } else {
                return lang === 'tr'
                    ? `${emoji} <b>${pName}</b> vaktine <b>${reminderMin} ${minWord}</b> kaldı!\n\n🕐 Vakit: ${prayerTimeStr}`
                    : `${emoji} <b>${pName}</b> vaxtına <b>${reminderMin} ${minWord}</b> qalıb!\n\n🕐 Vaxt: ${prayerTimeStr}`;
            }
        }

        case 'ontime': {
            const acceptPray = t('accept_pray', lang);
            if (isRam && job.prayer === 'meqrib') {
                const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                const motIdx = ramDay > 0 && ramDay <= 30 ? ramDay - 1 : 0;
                const motivArr = lang === 'tr' ? MOTIVASIYA_MESAJLARI_TR : MOTIVASIYA_MESAJLARI;
                return lang === 'tr'
                    ? `🌙🎉 <b>İFTAR VAKTİDİR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allahım orucumuzu, dualarımızı kabul et!\nBismillah, buyurun!\n\n💬 ${motivArr[motIdx]}`
                    : `🌙🎉 <b>İFTAR VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allahım orucumuzu, dualarımızı qəbul et!\nBismillah, buyurun!\n\n💬 ${MOTIVASIYA_MESAJLARI[motIdx]}`;
            } else if (isRam && job.prayer === 'imsak') {
                return lang === 'tr'
                    ? `🌙 <b>İMSAK VAKTİDİR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\nOruç başlıyor. Niyet etmeyi unutmayın!\n${acceptPray}`
                    : `🌙 <b>İMSAK VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\nOruc başlayır. Niyyət etməyi unutmayın!\n${acceptPray}`;
            } else {
                return lang === 'tr'
                    ? `🕌 <b>${pName} vaktidir!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n${acceptPray}`
                    : `🕌 <b>${pName} vaxtıdır!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n${acceptPray}`;
            }
        }

        case 'iftar_30': {
            return lang === 'tr'
                ? `🌙 <b>İftara 30 dakika kaldı!</b>\n\n🕐 İftar vakti: ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allahım, orucumuzu kabul et!`
                : `🌙 <b>İftara 30 dəqiqə qalıb!</b>\n\n🕐 İftar vaxtı: ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allahım, orucumuzu qəbul et!`;
        }

        case 'morning': {
            if (!dayData) return null;
            const currentMinutes = baku.hours * 60 + baku.minutes;
            let title = t('morning_title', lang);
            if (isRam) {
                const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                const isQadr = QADR_NIGHTS.includes(ramDay);
                title = t('ramadan_greet', lang).replace('{day}', ramDay) + `\n` + t('morning_title', lang);
                if (isQadr) {
                    title += lang === 'tr' ? `\n⭐ Bu gece Kadir gecesi olabilir!` : `\n⭐ Bu gecə Qadr gecəsi ola bilər!`;
                }
            }
            const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(baku.year, baku.month, baku.day) } : null;
            let msg = formatPrayerTimesMessage(dayData, baku.dateStr, currentMinutes, title, ramadanInfo, lang, cityId);
            if (isRam) {
                const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                const quoteIndex = ramDay > 0 && ramDay <= 30 ? ramDay - 1 : 0;
                msg += `\n\n📿 ${getRamadanQuote(quoteIndex, lang)}`;
                const motivArr = lang === 'tr' ? MOTIVASIYA_MESAJLARI_TR : MOTIVASIYA_MESAJLARI;
                msg += `\n💬 ${motivArr[quoteIndex]}`;
            }
            return msg;
        }

        case 'fasting_prompt': {
            const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
            return lang === 'tr'
                ? `🌙 <b>Ramazanın ${ramDay}. günü</b>\n\nBugün oruç tuttunuz mu?`
                : `🌙 <b>Ramazanın ${ramDay}-ci günü</b>\n\nBugün oruc tutdunuzmu?`;
        }

        case 'channel': {
            if (isRam && job.prayer === 'meqrib') {
                return `🌙🎉 <b>İFTAR VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allah orucunuzu qəbul etsin!\nBismillah, buyurun!`;
            } else if (isRam && job.prayer === 'imsak') {
                return `🌙 <b>İMSAK VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\nOruc başlayır. Niyyət etməyi unutmayın!\n🤲 Allah qəbul etsin!`;
            } else {
                return `🕌 <b>${PRAYER_NAMES[job.prayer] || job.prayer} vaxtıdır!</b>\n\n🕐 ${prayerTimeStr}\n📍 ${cityName}\n\n🤲 Allah qəbul etsin!`;
            }
        }

        default:
            return null;
    }
}

async function processTimeslot(env, ctx, workerUrl = null) {
    const botToken = env.BOT_TOKEN;
    const baku = getBakuNow();
    const isoDate = baku.isoDate;
    const hh = String(baku.hours).padStart(2, '0');
    const mm = String(baku.minutes).padStart(2, '0');
    const timeKey = `${isoDate}:${hh}:${mm}`;

    // Konsolidasiya edilmiş schedule-dan oxu (1 key bütün gün üçün)
    const fullSchedule = await env.NOTIFICATIONS_KV.get(`schedule_full:${isoDate}`, 'json');
    if (!fullSchedule) {
        console.log(`⏭ schedule_full:${isoDate} tapılmadı (${hh}:${mm})`);
        return null; // null = schedule mövcud deyil, build lazımdır
    }

    const jobs = fullSchedule[timeKey];
    if (!jobs || jobs.length === 0) return;

    // Batching logic: Max 40 requests per execution (CF Limit is 50)
    const BATCH_SIZE = 40;
    const jobsToProcess = jobs.slice(0, BATCH_SIZE);
    const jobsRemaining = jobs.slice(BATCH_SIZE);

    console.log(`🔄 Processing ${timeKey}: ${jobsToProcess.length} jobs [${jobsToProcess.map(j => j.type).join(', ')}]. Remaining: ${jobsRemaining.length}`);

    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const dayDataCache = {};
    const settingsCache = {};

    for (const job of jobsToProcess) {
        try {
            // ── Real-time ayar yoxlaması (bağlanmış bildirişləri göndərmə!) ──
            if (job.type !== 'channel' && job.userId) {
                if (!settingsCache[job.userId]) {
                    settingsCache[job.userId] = await getSettings(job.userId, env);
                }
                const userSettings = settingsCache[job.userId];

                // Namaz bağlıdırsa — skip
                if (job.prayer && userSettings.prayers && !userSettings.prayers[job.prayer]) {
                    console.log(`⏭ Skip: user=${job.userId}, prayer=${job.prayer} deaktivdir`);
                    continue;
                }

                // Reminder tipi bağlıdırsa — skip
                if (job.type === 'reminder15' && !userSettings.reminder15) {
                    console.log(`⏭ Skip: user=${job.userId}, reminder15 deaktivdir`);
                    continue;
                }
                if (job.type === 'reminder10' && !userSettings.reminder10) {
                    console.log(`⏭ Skip: user=${job.userId}, reminder10 deaktivdir`);
                    continue;
                }
                if (job.type === 'reminder5' && !userSettings.reminder5) {
                    console.log(`⏭ Skip: user=${job.userId}, reminder5 deaktivdir`);
                    continue;
                }
                if (job.type === 'ontime' && !userSettings.reminderOnTime) {
                    console.log(`⏭ Skip: user=${job.userId}, reminderOnTime deaktivdir`);
                    continue;
                }
                if (job.type === 'morning' && !userSettings.morningSchedule) {
                    console.log(`⏭ Skip: user=${job.userId}, morningSchedule deaktivdir`);
                    continue;
                }
            }

            const cityId = job.cityId || 'baku';
            if (!dayDataCache[cityId]) {
                dayDataCache[cityId] = await getDayDataForCity(baku.year, baku.month, baku.day, cityId, env);
            }
            const dayData = dayDataCache[cityId];

            const msg = formatNotificationMessage(job, dayData, baku, isRam);
            if (!msg) continue;

            if (job.type === 'fasting_prompt') {
                const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                const fastingStatus = await getFastingStatus(job.userId, baku.year, env);
                console.log(`🌙 fasting_prompt: user=${job.userId}, ramDay=${ramDay}, status=${JSON.stringify(fastingStatus[ramDay])}, skip=${fastingStatus[ramDay] !== undefined}`);
                if (fastingStatus[ramDay] !== undefined) continue;
                const kb = {
                    inline_keyboard: [
                        [
                            { text: job.lang === 'tr' ? '✅ Evet, tuttum' : '✅ Bəli, tutdum', callback_data: `fast_yes_${ramDay}` },
                            { text: job.lang === 'tr' ? '❌ Hayır' : '❌ Xeyr', callback_data: `fast_no_${ramDay}` },
                        ],
                    ],
                };
                await telegramSendMessage(botToken, job.userId, msg, kb);
            } else {
                await telegramSendMessage(botToken, job.userId, msg);
            }
        } catch (e) {
            console.error(`❌ Job xətası (${job.userId}/${job.type}): ${e}`);
        }
    }

    // Handle remaining jobs (Self-Chaining)
    if (jobsRemaining.length > 0) {
        // Overflow: qalan job-ları schedule-a geri yaz, bitmiş timeslotu saxla
        fullSchedule[timeKey] = jobsRemaining;
        await env.NOTIFICATIONS_KV.put(`schedule_full:${isoDate}`, JSON.stringify(fullSchedule), { expirationTtl: 86400 * 2 });

        if (!workerUrl) {
            workerUrl = await env.NOTIFICATIONS_KV.get('system:worker_url');
        }

        if (workerUrl && env.ADMIN_PASSWORD) {
            console.log(`🔗 Chaining cron: Triggering next batch via ${workerUrl}/cron-continue`);
            const nextBatch = fetch(`${workerUrl}/cron-continue`, {
                method: 'POST',
                headers: { 'X-Cron-Secret': env.ADMIN_PASSWORD }
            });
            ctx.waitUntil(nextBatch);
        } else {
            console.warn("⚠️ Cannot chain cron: WORKER_URL (system:worker_url) or ADMIN_PASSWORD missing. Remaining jobs delayed.");
        }
    } else {
        // ── Bu timeslot bitdi — schedule-dan sil ki dublikat olmasın ──
        delete fullSchedule[timeKey];
        await env.NOTIFICATIONS_KV.put(`schedule_full:${isoDate}`, JSON.stringify(fullSchedule), { expirationTtl: 86400 * 2 });
        console.log(`✅ Timeslot ${timeKey}: ${jobsToProcess.length} job icra edildi və schedule-dan silindi.`);
    }

    return true; // true = schedule mövcud idi
}

// ═══════════════════════════════════════════════════════════════
//  SCHEDULED HANDLER (Cron — Hər Dəqiqə)
// ═══════════════════════════════════════════════════════════════

async function handleScheduled(env, ctx) {
    const botToken = env.BOT_TOKEN;
    const baku = getBakuNow();



    // ── Gecə yarısı 00:05 — dünənki işarələnməmiş namazları qəzaya yaz ──
    if (baku.hours === 0 && baku.minutes === 5) {
        try {
            const autoQazaKey = `sent:${baku.isoDate}:auto_qaza:0`;
            const alreadyDone = await env.NOTIFICATIONS_KV.get(autoQazaKey);
            if (!alreadyDone) {
                // Dünənki tarixi hesabla
                const yesterday = getLocalDateOffset(-1, 'baku');
                const yesterdayStr = `${yesterday.year}-${String(yesterday.month).padStart(2, '0')}-${String(yesterday.day).padStart(2, '0')}`;

                // Bütün istifadəçilər üçün yoxla
                const allUsers = await getAllUserIds(env);
                for (const uid of allUsers) {
                    try {
                        const logKey = `prayer_log:${uid}:${yesterdayStr}`;
                        const prayerLog = await env.NOTIFICATIONS_KV.get(logKey, 'json');
                        if (!prayerLog) continue; // Bu istifadəçi heç istifadə etməyib, skip

                        let missedCount = 0;
                        const missed = await getMissedPrayers(uid, env);

                        for (const p of TRACKED_PRAYERS) {
                            if (prayerLog[p] === null || prayerLog[p] === undefined) {
                                // İşarələnməyib → qəzaya yaz
                                prayerLog[p] = false;
                                missed[p] = (missed[p] || 0) + 1;
                                missedCount++;
                            }
                        }

                        if (missedCount > 0) {
                            await saveMissedPrayers(uid, missed, env);
                            // Dünənki logu yenilə (false ilə)
                            await env.NOTIFICATIONS_KV.put(logKey, JSON.stringify(prayerLog), { expirationTtl: 604800 });

                            // İstifadəçiyə xəbər ver
                            const userSettings = await getSettings(uid, env);
                            const uLang = userSettings.language || 'az';
                            const autoMsg = t('namazlarim_auto_qaza', uLang).replace('{count}', missedCount);
                            try {
                                await telegramSendMessage(botToken, uid, autoMsg);
                            } catch { /* istifadəçi botu bloklamış ola bilər */ }
                        }
                    } catch { /* istifadəçi emalı xətası */ }
                }

                await env.NOTIFICATIONS_KV.put(autoQazaKey, '1', { expirationTtl: 86400 });
            }
        } catch (e) {
            console.error(`❌ Auto-qaza xətası: ${e}`);
        }
    }

    // ── Hər dəqiqə: timeslot-u oxu və icra et ──
    // processTimeslot null qaytarırsa — schedule yoxdur, build lazımdır
    let scheduleExists = true;
    try {
        const result = await processTimeslot(env, ctx);
        if (result === null) scheduleExists = false;
    } catch (e) {
        console.error(`❌ processTimeslot xətası: ${e}`);
        scheduleExists = false; // xəta olubsa, schedule olmaya bilər
    }

    // ── Schedule yoxdursa dərhal qur ──
    // processTimeslot-dan əldə etdiyimiz nəticəni istifadə edirək — əlavə KV read yoxdur!
    if (!scheduleExists) {
        try {
            console.log(`📅 Schedule tapılmadı, cədvəl qurulur... (${baku.hours}:${String(baku.minutes).padStart(2, '0')})`);
            await buildDailySchedule(env);
        } catch (e) {
            console.error(`❌ Schedule build xətası: ${e}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN PANELİ — HTML & API
// ═══════════════════════════════════════════════════════════════

function getAdminLoginHTML() {
    return `<!DOCTYPE html>
<html lang="az"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Panel — Giriş</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e2e8f0}
.card{background:rgba(30,41,59,.85);backdrop-filter:blur(12px);border:1px solid rgba(100,116,139,.3);border-radius:16px;padding:40px;width:100%;max-width:400px;box-shadow:0 25px 50px rgba(0,0,0,.4)}
h1{text-align:center;font-size:24px;margin-bottom:8px}
.sub{text-align:center;color:#94a3b8;margin-bottom:32px;font-size:14px}
label{display:block;font-size:13px;color:#94a3b8;margin-bottom:6px}
input{width:100%;padding:12px 16px;border:1px solid rgba(100,116,139,.4);border-radius:10px;background:rgba(15,23,42,.6);color:#e2e8f0;font-size:15px;outline:none;transition:border .2s}
input:focus{border-color:#3b82f6}
button{width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-top:20px;transition:opacity .2s}
button:hover{opacity:.9}
.err{color:#f87171;font-size:13px;text-align:center;margin-top:12px;display:none}
</style></head><body>
<div class="card">
<h1>🕌 Admin Panel</h1>
<p class="sub">Bakı Namaz Vaxtları Botu</p>
<form id="f" onsubmit="return login(event)">
<label>Şifrə</label>
<input type="password" id="pw" placeholder="Admin şifrəsini daxil edin" autofocus>
<button type="submit">Daxil ol</button>
<p class="err" id="err">Şifrə yanlışdır!</p>
</form></div>
<script>
async function login(e){
e.preventDefault();const pw=document.getElementById('pw').value;
const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
if(r.ok){window.location.href='/admin'}
else{document.getElementById('err').style.display='block'}
return false}
</script></body></html>`;
}

function getAdminDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="az"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Panel — Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.header{background:linear-gradient(135deg,#1e293b,#334155);padding:20px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(100,116,139,.3)}
.header h1{font-size:20px}
.header .badge{background:#3b82f6;padding:4px 12px;border-radius:20px;font-size:12px}
.logout{background:none;border:1px solid #ef4444;color:#ef4444;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:13px}
.logout:hover{background:#ef4444;color:#fff}
.container{max-width:1100px;margin:0 auto;padding:24px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:rgba(30,41,59,.85);border:1px solid rgba(100,116,139,.2);border-radius:12px;padding:20px}
.stat-card .num{font-size:32px;font-weight:700;color:#3b82f6}
.stat-card .label{color:#94a3b8;font-size:13px;margin-top:4px}
.section{background:rgba(30,41,59,.85);border:1px solid rgba(100,116,139,.2);border-radius:12px;padding:20px;margin-bottom:24px}
.section h2{font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 12px;border-bottom:1px solid rgba(100,116,139,.3);color:#94a3b8;font-size:12px;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid rgba(100,116,139,.1);font-size:14px}
tr:hover td{background:rgba(59,130,246,.05)}
.username{color:#3b82f6}
textarea{width:100%;padding:12px;border:1px solid rgba(100,116,139,.3);border-radius:10px;background:rgba(15,23,42,.6);color:#e2e8f0;font-size:14px;resize:vertical;min-height:80px;outline:none}
textarea:focus{border-color:#3b82f6}
.btn{padding:10px 24px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s}
.btn:hover{opacity:.85}
.btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff}
.btn-sm{padding:6px 14px;font-size:12px}
.toast{position:fixed;top:20px;right:20px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:10px;display:none;z-index:999;font-size:14px}
.loading{color:#94a3b8;text-align:center;padding:40px;font-size:14px}
</style></head><body>
<div class="header">
<div style="display:flex;align-items:center;gap:12px">
<h1>🕌 Admin Panel</h1>
<span class="badge">Bakı Namaz Bot</span>
</div>
<button class="logout" onclick="logout()">Çıxış</button>
</div>
<div class="container">
<div class="stats">
<div class="stat-card"><div class="num" id="totalUsers">-</div><div class="label">Ümumi İstifadəçi</div></div>
<div class="stat-card"><div class="num" id="activeToday">-</div><div class="label">Bu gün aktiv</div></div>
<div class="stat-card"><div class="num" id="activeWeek">-</div><div class="label">Bu həftə aktiv</div></div>
</div>
<div class="section">
<h2>📢 Yayım Göndər</h2>
<textarea id="bMsg" placeholder="Bütün istifadəçilərə göndəriləcək mesajı yazın..."></textarea>
<div style="display:flex;gap:12px;margin-top:12px;align-items:center">
<button class="btn btn-primary" onclick="sendBroadcast()">📤 Göndər</button>
<span id="bStatus" style="color:#94a3b8;font-size:13px"></span>
</div>
</div>
<div class="section">
<h2>👥 İstifadəçilər</h2>
<div id="userTable"><p class="loading">Yüklənir...</p></div>
</div>
</div>
<div class="toast" id="toast"></div>
<script>
async function api(path,opts){
const r=await fetch(path,opts);
if(r.status===401){window.location.href='/admin';return null}
return r.json()}
function showToast(msg,color='#22c55e'){
const t=document.getElementById('toast');t.textContent=msg;t.style.background=color;t.style.display='block';
setTimeout(()=>t.style.display='none',3000)}
async function loadStats(){
const d=await api('/api/stats');if(!d)return;
document.getElementById('totalUsers').textContent=d.totalUsers;
document.getElementById('activeToday').textContent=d.activeToday;
document.getElementById('activeWeek').textContent=d.activeWeek}
async function loadUsers(){
const d=await api('/api/users');if(!d)return;
if(!d.users||d.users.length===0){document.getElementById('userTable').innerHTML='<p style="color:#94a3b8">İstifadəçi tapılmadı.</p>';return}
let h='<table><tr><th>Ad</th><th>Username</th><th>ID</th><th>Şəhər</th><th>Dil</th><th>Oruc</th><th>Qəza</th><th>Namaz</th><th>Qoşulub</th><th>Son aktivlik</th></tr>';
for(const u of d.users){
const name=(u.firstName||'')+(u.lastName?' '+u.lastName:'');
const uname=u.username?'<span class="username">@'+u.username+'</span>':'-';
const joined=u.joined?new Date(u.joined).toLocaleDateString('az'):'?';
const last=u.lastActive?timeAgo(u.lastActive):'?';
const city=u.userCity||'baku';
const lang=u.userLang||'az';
const oruc=u.orucCount||0;
const qeza=u.qezaCount||0;
const nmz=u.bugunNamaz||0;
h+='<tr><td>'+name+'</td><td>'+uname+'</td><td>'+u.id+'</td><td>'+city+'</td><td>'+lang+'</td><td>'+oruc+'</td><td>'+qeza+'</td><td>'+nmz+'/5</td><td>'+joined+'</td><td>'+last+'</td></tr>'}
h+='</table>';document.getElementById('userTable').innerHTML=h}
function timeAgo(iso){
const d=Date.now()-new Date(iso).getTime();const m=Math.floor(d/60000);
if(m<1)return'indi';if(m<60)return m+' dəq əvvəl';
const h=Math.floor(m/60);if(h<24)return h+' saat əvvəl';
const days=Math.floor(h/24);return days+' gün əvvəl'}
async function sendBroadcast(){
const msg=document.getElementById('bMsg').value.trim();
if(!msg){showToast('Mesaj boş ola bilməz!','#ef4444');return}
document.getElementById('bStatus').textContent='Göndərilir...';
const d=await api('/api/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
if(d){showToast('Göndərildi: '+d.sent+' | Uğursuz: '+d.failed);document.getElementById('bMsg').value='';document.getElementById('bStatus').textContent=''}
else{document.getElementById('bStatus').textContent='Xəta baş verdi'}}
async function logout(){
await fetch('/admin/logout',{method:'POST'});window.location.href='/admin'}
loadStats();loadUsers()
</script></body></html>`;
}

// ── Admin Auth Helpers ──
function getSessionFromCookie(request) {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_session=([^;]+)/);
    return match ? match[1] : null;
}

function makeSessionToken(password) {
    // Sadə hash: real istifadə üçün yetərli
    let hash = 0;
    const str = 'nmz_admin_' + password + '_2026';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'sess_' + Math.abs(hash).toString(36);
}

function isValidSession(request, env) {
    const session = getSessionFromCookie(request);
    if (!session || !env.ADMIN_PASSWORD) return false;
    return session === makeSessionToken(env.ADMIN_PASSWORD);
}

// ── Admin API Endpoints ──
async function handleAdminAPI(request, env, pathname) {
    if (!isValidSession(request, env)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // GET /api/stats
    if (pathname === '/api/stats' && request.method === 'GET') {
        const countStr = await env.NOTIFICATIONS_KV.get('users:count');
        const totalUsers = countStr ? parseInt(countStr, 10) : 0;

        // Aktiv istifadəçiləri hesabla
        const now = Date.now();
        const todayMs = 24 * 60 * 60 * 1000;
        const weekMs = 7 * todayMs;
        let activeToday = 0;
        let activeWeek = 0;

        const result = await env.NOTIFICATIONS_KV.list({ prefix: 'user:', limit: 1000 });
        for (const key of result.keys) {
            if (key.name === 'users:count') continue;
            const data = await env.NOTIFICATIONS_KV.get(key.name, 'json');
            if (data && data.lastActive) {
                const diff = now - new Date(data.lastActive).getTime();
                if (diff < todayMs) activeToday++;
                if (diff < weekMs) activeWeek++;
            }
        }

        return new Response(JSON.stringify({ totalUsers, activeToday, activeWeek }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // GET /api/users
    if (pathname === '/api/users' && request.method === 'GET') {
        const baku = getBakuNow();
        const year = baku.year;
        const dateStr = `${year}-${String(baku.month).padStart(2, '0')}-${String(baku.day).padStart(2, '0')}`;

        const users = [];
        let cursor = null;
        do {
            const result = await env.NOTIFICATIONS_KV.list({ prefix: 'user:', cursor, limit: 1000 });
            for (const key of result.keys) {
                if (key.name === 'users:count') continue;
                const id = key.name.replace('user:', '');
                const data = await env.NOTIFICATIONS_KV.get(key.name, 'json');
                let userObj;
                if (data && typeof data === 'object') {
                    userObj = { id, ...data };
                } else {
                    userObj = { id, firstName: 'Naməlum', joined: data || '?', lastActive: null };
                }

                // Əlavə statistika: qəza, oruc, bu günkü namaz, şəhər, dil
                try {
                    const [missedData, fastingData, prayerLogData, settingsData] = await Promise.all([
                        env.NOTIFICATIONS_KV.get(`missed:${id}`, 'json'),
                        env.NOTIFICATIONS_KV.get(`fasting:${id}:${year}`, 'json'),
                        env.NOTIFICATIONS_KV.get(`prayer_log:${id}:${dateStr}`, 'json'),
                        env.NOTIFICATIONS_KV.get(`settings:${id}`, 'json'),
                    ]);

                    // Qəza borcu
                    let qezaCount = 0;
                    if (missedData) {
                        for (const v of Object.values(missedData)) { qezaCount += (v || 0); }
                    }
                    userObj.qezaCount = qezaCount;

                    // Oruc tutduğu günlər
                    let orucCount = 0;
                    if (fastingData) {
                        for (const v of Object.values(fastingData)) { if (v === true) orucCount++; }
                    }
                    userObj.orucCount = orucCount;

                    // Bu gün qıldığı namazlar
                    let bugunNamaz = 0;
                    if (prayerLogData) {
                        for (const v of Object.values(prayerLogData)) { if (v === true) bugunNamaz++; }
                    }
                    userObj.bugunNamaz = bugunNamaz;

                    // Şəhər və Dil
                    userObj.userCity = (settingsData && settingsData.city) || 'baku';
                    userObj.userLang = (settingsData && settingsData.language) || 'az';
                } catch { /* statistika oxunuşu xətası — skip */ }

                users.push(userObj);
            }
            cursor = result.list_complete ? null : result.cursor;
        } while (cursor);

        // Son aktivliyə görə sırala
        users.sort((a, b) => {
            const ta = a.lastActive ? new Date(a.lastActive).getTime() : 0;
            const tb = b.lastActive ? new Date(b.lastActive).getTime() : 0;
            return tb - ta;
        });

        return new Response(JSON.stringify({ users }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // POST /api/broadcast
    if (pathname === '/api/broadcast' && request.method === 'POST') {
        const body = await request.json();
        const messageText = body.message;
        if (!messageText) {
            return new Response(JSON.stringify({ error: 'Mesaj boş' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const botToken = env.BOT_TOKEN;
        const userIds = await getAllUserIds(env);
        let sent = 0, failed = 0;
        const broadcastMsg = `📢 <b>Elan:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n${messageText.trim()}`;

        for (const uid of userIds) {
            try {
                await telegramSendMessage(botToken, uid, broadcastMsg);
                sent++;
            } catch (e) { failed++; }
        }

        return new Response(JSON.stringify({ sent, failed, total: userIds.length }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}

// ═══════════════════════════════════════════════════════════════
//  WORKER EXPORT
// ═══════════════════════════════════════════════════════════════

let cachedWorkerUrl = null;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Auto-discover Worker URL for cron chaining (cached + get verification to save KV puts)
        if (!cachedWorkerUrl) {
            cachedWorkerUrl = url.origin;
            ctx.waitUntil((async () => {
                const existingUrl = await env.NOTIFICATIONS_KV.get('system:worker_url');
                if (existingUrl !== cachedWorkerUrl) {
                    await env.NOTIFICATIONS_KV.put('system:worker_url', cachedWorkerUrl);
                }
            })());
        }

        // ── Cron Chaining Endpoint ──
        if (url.pathname === '/cron-continue' && request.method === 'POST') {
            if (request.headers.get('X-Cron-Secret') !== env.ADMIN_PASSWORD) {
                return new Response('Unauthorized', { status: 401 });
            }
            await processTimeslot(env, ctx, url.origin);
            return new Response('OK');
        }

        // POST /webhook → Telegram update
        if (request.method === 'POST' && url.pathname === '/webhook') {
            return handleWebhook(request, env);
        }

        // ── Admin Panel Routes ──
        if (url.pathname === '/admin') {
            if (isValidSession(request, env)) {
                return new Response(getAdminDashboardHTML(), {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            } else {
                return new Response(getAdminLoginHTML(), {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
        }

        if (url.pathname === '/admin/login' && request.method === 'POST') {
            try {
                const body = await request.json();
                if (body.password === env.ADMIN_PASSWORD) {
                    const token = makeSessionToken(env.ADMIN_PASSWORD);
                    return new Response(JSON.stringify({ ok: true }), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Set-Cookie': `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
                        },
                    });
                } else {
                    return new Response(JSON.stringify({ error: 'Wrong password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
            } catch {
                return new Response('Bad Request', { status: 400 });
            }
        }

        if (url.pathname === '/admin/logout' && request.method === 'POST') {
            return new Response(JSON.stringify({ ok: true }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': 'admin_session=; Path=/; Max-Age=0',
                },
            });
        }

        // ── API Endpoints ──
        if (url.pathname.startsWith('/api/')) {
            return handleAdminAPI(request, env, url.pathname);
        }

        // GET / → Health check
        if (request.method === 'GET' && url.pathname === '/') {
            const baku = getBakuNow();
            const isRam = isRamadan(baku.year, baku.month, baku.day);
            return new Response(
                JSON.stringify({
                    status: 'OK',
                    bot: 'Bakı Namaz Vaxtları',
                    bakuTime: baku.timeStr,
                    bakuDate: baku.dateStr,
                    ramadan: isRam,
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response('Not Found', { status: 404 });
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleScheduled(env, ctx));
    },
};

