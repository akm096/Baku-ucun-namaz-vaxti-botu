// ═══════════════════════════════════════════════════════════════
//  Bakı Namaz Vaxtları Telegram Botu — Cloudflare Workers
//  Pulsuz tier: Webhook + Cron Trigger + KV dedup
//  Əmrlər: /start, /vaxtlar, /sabah, /heftelik, /tarix, /ay,
//          /help, /ayarlar
//  Ramazan xüsusi rejimi + Inline düymələr
// ═══════════════════════════════════════════════════════════════

// ─── Bundled JSON data ─────────────────────────────────────────
import data202601 from '../data/2026-01.json';
import data202602 from '../data/2026-02.json';
import data202603 from '../data/2026-03.json';
import data202604 from '../data/2026-04.json';
import data202605 from '../data/2026-05.json';
import data202606 from '../data/2026-06.json';
import data202607 from '../data/2026-07.json';
import data202608 from '../data/2026-08.json';
import data202609 from '../data/2026-09.json';
import data202610 from '../data/2026-10.json';
import data202611 from '../data/2026-11.json';
import data202612 from '../data/2026-12.json';

const BUNDLED_DATA = {
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
};

// ═══════════════════════════════════════════════════════════════
//  SABİTLƏR
// ═══════════════════════════════════════════════════════════════

const PRAYER_NAMES = {
    imsak: '🌙 İmsak',
    subh: '🌅 Sübh',
    zohr: '☀️ Zöhr',
    esr: '🌤️ Əsr',
    meqrib: '🌇 Məğrib',
    isha: '🌃 İşa',
};

const ALL_LABELS = {
    imsak: '🌙 İmsak',
    subh: '🌅 Sübh',
    gunCixir: '🌅 Gün çıxır',
    zohr: '☀️ Zöhr',
    esr: '🌤️ Əsr',
    gunBatir: '🌇 Gün batır',
    meqrib: '🌇 Məğrib',
    isha: '🌃 İşa',
    gecaYarisi: '🌑 Gecə yarısı',
};

const NOTIFY_PRAYERS = ['imsak', 'subh', 'zohr', 'esr', 'meqrib', 'isha'];
const REMINDER_MINUTES = [15, 10, 5];
const DISPLAY_ORDER = ['imsak', 'subh', 'gunCixir', 'zohr', 'esr', 'gunBatir', 'meqrib', 'isha', 'gecaYarisi'];

// Həftənin gün adları (Azərbaycan dilində)
const WEEKDAY_NAMES = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

// Ay adları (Azərbaycan dilində)
const MONTH_NAMES_AZ = {
    'yanvar': 1, 'fevral': 2, 'mart': 3, 'aprel': 4,
    'may': 5, 'iyun': 6, 'iyul': 7, 'avqust': 8,
    'sentyabr': 9, 'oktyabr': 10, 'noyabr': 11, 'dekabr': 12,
};
const MONTH_NAMES_REVERSE = {
    1: 'Yanvar', 2: 'Fevral', 3: 'Mart', 4: 'Aprel',
    5: 'May', 6: 'İyun', 7: 'İyul', 8: 'Avqust',
    9: 'Sentyabr', 10: 'Oktyabr', 11: 'Noyabr', 12: 'Dekabr',
};

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

// Qadr gecəsi ehtimal olunan gecələr (Ramazanın tək gecələri)
const QADR_NIGHTS = [21, 23, 25, 27, 29];

// Günlük hədis/ayələr (30 gün üçün)
const RAMADAN_DAILY_QUOTES = [
    '"Ramazan ayı girəndə cənnətin qapıları açılır, cəhənnəmin qapıları bağlanır və şeytanlar zəncirə vurulur." (Buxari)',
    '"Kim iman və savab ümidi ilə Ramazan orucunu tutarsa, keçmiş günahları bağışlanar." (Buxari)',
    '"Oruc tutan qulun ağzının qoxusu, Allah yanında miskin iyindən daha gözəldir." (Buxari)',
    '"Oruc bir qalxandır. Oruc tutan ədəbsiz söz söyləməsin, cahillik etməsin." (Buxari)',
    '"Hər kimin Ramazandan bir günü ölümsüz gəlsə, cənnətə girər." (Əhməd)',
    '"Cənnətdə Rəyyan adlı bir qapı var. Oruc tutanlar o qapıdan girəcək." (Buxari)',
    '"Allah buyurdu: Oruc Mənim üçündür, onun mükafatını Mən verəcəyəm." (Buxari)',
    '"Oruc tutan iki sevinc yaşayar: biri iftar edərkən, digəri Rəbbinə qovuşarkən." (Muslim)',
    '"Sübh namazına durmağın ağırlığını kim hiss edirsə, gecə namazı ilə yüngülləşdirsin." (Tirmizi)',
    '"Ən yaxşı oruc tutanlar — dillərini qoruyanlar, qəlbləri təmiz olanlardır." (İbn Macə)',
    '"Quranı oxuyun! Çünki o, Qiyamət günü sahiblərinə şəfaətçi olacaq." (Muslim)',
    '"Kim bir oruc tutan kəsə iftar verdirsə, onun savabı qədər savab alar." (Tirmizi)',
    '"Ramazan ayının birinci on günü rəhmət, ikinci on günü bağışlanma, üçüncü on günü cəhənnəmdən qurtuluşdur."',
    '"Allahı zikr etmək — qəlblərin şəfasıdır." (Beyhəqi)',
    '"Təraveh namazını iman və savab ümidi ilə qılan, keçmiş günahlarından bağışlanar." (Buxari)',
    '"Sədəqə günahları söndürər, necə ki su odu söndürər." (Tirmizi)',
    '"Ən fəzilətli sədəqə, Ramazan ayında verilən sədəqədir." (Tirmizi)',
    '"Allahım! Sən bağışlayansan, bağışlamağı sevirsən, məni bağışla!" (Tirmizi)',
    '"Quran bu ayda nazil olub. Onu çox oxuyun." (Bəqərə, 185)',
    '"Gecə namazı ən fəzilətli namazlardan biridir." (Muslim)',
    '"Qadr gecəsi min aydan xeyirlidir." (Qədr surəsi, 3)',
    '"Ey iman gətirənlər! Sizə oruc tutmaq yazıldı." (Bəqərə, 183)',
    '"Allahın dərgahına ən sevimli əməl — az da olsa davam edənidir." (Buxari)',
    '"Səbr edənlərə mükafatları hesabsız veriləcəkdir." (Zumər, 10)',
    '"Qadr gecəsini Ramazanın son on günündə axtarın." (Buxari)',
    '"Dua — ibadətin özüdür." (Tirmizi)',
    '"Qadr gecəsini iman və savab ümidi ilə keçirən, keçmiş günahlarından bağışlanar." (Buxari)',
    '"Orucu xurma ilə açın, əgər tapmasanız su ilə açın." (Tirmizi)',
    '"Ramazan ayı — səbr ayıdır, səbrin mükafatı isə cənnətdir." (İbn Xüzeymə)',
    '"Ramazanı xeyir-dua ilə bitirin, bayramı şükranlıqla qarşılayın."',
];

// Nailiyyətlər sistemi
const ACHIEVEMENTS = [
    { id: 'first', emoji: '🥇', name: 'İlk Oruc', desc: 'İlk orucunu tutdun', check: (s) => s.fasted >= 1 },
    { id: 'streak3', emoji: '🔥', name: '3 Gün Ardıcıl', desc: '3 gün ardıcıl oruc', check: (s) => s.maxStreak >= 3 },
    { id: 'streak7', emoji: '⚡', name: '7 Gün Ardıcıl', desc: '1 həftə ardıcıl oruc', check: (s) => s.maxStreak >= 7 },
    { id: 'half', emoji: '💪', name: 'Yarısı Tamam', desc: '15 gün oruc tutdun', check: (s) => s.fasted >= 15 },
    { id: 'full', emoji: '🏆', name: 'Tam Ramazan', desc: 'Bütün 30 günü tutdun', check: (s) => s.fasted >= 30 },
    { id: 'qadr', emoji: '⭐', name: 'Qadr Gecələri', desc: 'Bütün Qadr gecələrində oruc', check: (s) => s.qadrFasted === 5 },
];

// Motivasiya mesajları (30 gün üçün)
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

function formatHijriDate(year, month, day) {
    const h = gregorianToHijri(year, month, day);
    const mName = HIJRI_MONTH_NAMES[h.month] || `Ay ${h.month}`;
    return `${h.day} ${mName} ${h.year}`;
}

// ─── Genişləndirilmiş Hədis / Ayə Bazası (il boyu) ────────────
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

// ─── Zikr (Təsbeh) Sayğac Konfiqurasiyası ──────────────────────
const ZIKR_ITEMS = [
    { id: 'subhanallah', label: 'سُبْحَانَ ٱللَّٰهِ', name: 'SubhanAllah', target: 33 },
    { id: 'alhamdulillah', label: 'ٱلْحَمْدُ لِلَّٰهِ', name: 'Əlhəmdulillah', target: 33 },
    { id: 'allahuakbar', label: 'ٱللَّٰهُ أَكْبَرُ', name: 'Allahu Əkbər', target: 34 },
    { id: 'lailahaillallah', label: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', name: 'La iləhə illəllah', target: 100 },
    { id: 'istigfar', label: 'أَسْتَغْفِرُ ٱللَّٰهَ', name: 'Əstağfirullah', target: 100 },
    { id: 'salavat', label: 'صَلِّ عَلَى مُحَمَّدٍ', name: 'Salavat', target: 100 },
];

// ─── Qəza Namazı Konfiqurasiyası ────────────────────────────────
const QEZA_PRAYERS = [
    { id: 'subh', name: '🌅 Sübh' },
    { id: 'zohr', name: '☀️ Zöhr' },
    { id: 'esr', name: '🌤️ Əsr' },
    { id: 'meqrib', name: '🌇 Məğrib' },
    { id: 'isha', name: '🌃 İşa' },
    { id: 'vitr', name: '🌙 Vitr' },
];

// ─── 2026 Dini Günlər Təqvimi ──────────────────────────────────
const RELIGIOUS_DAYS_2026 = [
    { date: '2025-12-21', name: '🌙 Rəcəb ayının başlanğıcı', desc: 'Üç mübarək ayın birincisi (1 Rəcəb 1447)' },
    { date: '2025-12-25', name: '✨ Rəğaib gecəsi', desc: 'Rəcəb ayının ilk cümə gecəsi (5 Rəcəb)' },
    { date: '2026-01-16', name: '⭐ Merac Gecəsi (Rəcəb 27)', desc: 'Peyğəmbərin (s.ə.s.) Meraca yüksəldiyi gecə' },
    { date: '2026-01-20', name: '🌙 Şaban ayının başlanğıcı', desc: 'Ramazandan əvvəlki ay (1 Şaban 1447)' },
    { date: '2026-02-03', name: '⭐ Bərat Gecəsi (Şaban 15)', desc: 'Bağışlanma gecəsi' },
    { date: '2026-02-19', name: '🌙 Ramazan başlanğıcı', desc: '1447 Hicri — Oruc ayı' },
    { date: '2026-03-08', name: '⭐ Qadr Gecəsi (21-ci gecə)', desc: 'Ehtimal olunan Qadr gecələrindən biri' },
    { date: '2026-03-10', name: '⭐ Qadr Gecəsi (23-cü gecə)', desc: 'Ehtimal olunan Qadr gecələrindən biri' },
    { date: '2026-03-12', name: '⭐ Qadr Gecəsi (25-ci gecə)', desc: 'Ehtimal olunan Qadr gecələrindən biri' },
    { date: '2026-03-16', name: '⭐ Qadr Gecəsi (27-ci gecə)', desc: 'Ən ehtimallı Qadr gecəsi — min aydan xeyirli' },
    { date: '2026-03-20', name: '🎉 Ramazan Bayramı (1-ci gün)', desc: 'Fitr bayramı — rəsmi qeyri-iş günü' },
    { date: '2026-03-21', name: '🎉 Ramazan Bayramı (2-ci gün)', desc: 'Fitr bayramı — rəsmi qeyri-iş günü' },
    { date: '2026-05-26', name: '🕋 Ərəfə günü', desc: 'Qurban bayramı ərəfəsi — oruc tutmaq savablıdır' },
    { date: '2026-05-27', name: '🐑 Qurban Bayramı (1-ci gün)', desc: 'Zülhiccə 10 — rəsmi qeyri-iş günü' },
    { date: '2026-05-28', name: '🐑 Qurban Bayramı (2-ci gün)', desc: 'Təşriq günləri — rəsmi qeyri-iş günü' },
    { date: '2026-06-16', name: '☪️ Hicri Yeni İl (1448)', desc: 'Məhərrəm ayının başlanğıcı' },
    { date: '2026-06-25', name: '📿 Aşura Günü (Məhərrəm 10)', desc: 'Hz. Hüseynin şəhadəti — oruc tutmaq savablıdır' },
    { date: '2026-08-25', name: '🕌 Mövlud Gecəsi', desc: 'Peyğəmbərin (s.ə.s.) doğum gecəsi (12 Rəbiül-əvvəl)' },
];

// ─── Əsma-ül Hüsna (Allahın 99 Adı) ──────────────────────────
const ASMA_UL_HUSNA = [
    { num: 1, ar: 'ٱللَّٰهُ', az: 'Allah', meaning: 'Yeganə ilah, hər şeyin yaradanı' },
    { num: 2, ar: 'ٱلرَّحْمَٰنُ', az: 'Ər-Rəhman', meaning: 'Sonsuz mərhəmət sahibi' },
    { num: 3, ar: 'ٱلرَّحِيمُ', az: 'Ər-Rəhim', meaning: 'Əbədi rəhm edən' },
    { num: 4, ar: 'ٱلْمَلِكُ', az: 'Əl-Məlik', meaning: 'Mütləq hökmdarlıq sahibi' },
    { num: 5, ar: 'ٱلْقُدُّوسُ', az: 'Əl-Quddus', meaning: 'Hər nöqsandan uzaq olan' },
    { num: 6, ar: 'ٱلسَّلَامُ', az: 'Əs-Salam', meaning: 'Salamatlıq verən' },
    { num: 7, ar: 'ٱلْمُؤْمِنُ', az: 'Əl-Mömin', meaning: 'Əmin-amanlıq bəxş edən' },
    { num: 8, ar: 'ٱلْمُهَيْمِنُ', az: 'Əl-Müheymin', meaning: 'Hər şeyi nəzarət edən' },
    { num: 9, ar: 'ٱلْعَزِيزُ', az: 'Əl-Əziz', meaning: 'Yenilməz qüdrət sahibi' },
    { num: 10, ar: 'ٱلْجَبَّارُ', az: 'Əl-Cəbbar', meaning: 'İradəsini hər şeyə keçirən' },
    { num: 11, ar: 'ٱلْمُتَكَبِّرُ', az: 'Əl-Mütəkəbbir', meaning: 'Uca və böyük olan' },
    { num: 12, ar: 'ٱلْخَالِقُ', az: 'Əl-Xaliq', meaning: 'Hər şeyin yaradıcısı' },
    { num: 13, ar: 'ٱلْبَارِئُ', az: 'Əl-Bari', meaning: 'Varlıqları nöqsansız yaradan' },
    { num: 14, ar: 'ٱلْمُصَوِّرُ', az: 'Əl-Musavvir', meaning: 'Surət verən, şəkil yaradan' },
    { num: 15, ar: 'ٱلْغَفَّارُ', az: 'Əl-Ğəffar', meaning: 'Çox bağışlayan' },
    { num: 16, ar: 'ٱلْقَهَّارُ', az: 'Əl-Qəhhar', meaning: 'Hər şeyə qalib gələn' },
    { num: 17, ar: 'ٱلْوَهَّابُ', az: 'Əl-Vəhhab', meaning: 'Qarşılıqsız verən' },
    { num: 18, ar: 'ٱلرَّزَّاقُ', az: 'Ər-Rəzzaq', meaning: 'Ruzi verən' },
    { num: 19, ar: 'ٱلْفَتَّاحُ', az: 'Əl-Fəttah', meaning: 'Hər şeyi açan' },
    { num: 20, ar: 'ٱلْعَلِيمُ', az: 'Əl-Əlim', meaning: 'Hər şeyi bilən' },
    { num: 21, ar: 'ٱلْقَابِضُ', az: 'Əl-Qabid', meaning: 'Daraldıan, sıxan' },
    { num: 22, ar: 'ٱلْبَاسِطُ', az: 'Əl-Basit', meaning: 'Genişlədən, bollaşdıran' },
    { num: 23, ar: 'ٱلْخَافِضُ', az: 'Əl-Xafid', meaning: 'Alçaldan' },
    { num: 24, ar: 'ٱلرَّافِعُ', az: 'Ər-Rafi', meaning: 'Yüksəldən' },
    { num: 25, ar: 'ٱلْمُعِزُّ', az: 'Əl-Müizz', meaning: 'İzzət verən, şərəfləndirən' },
    { num: 26, ar: 'ٱلْمُذِلُّ', az: 'Əl-Müzill', meaning: 'Zəlil edən' },
    { num: 27, ar: 'ٱلسَّمِيعُ', az: 'Əs-Səmi', meaning: 'Hər şeyi eşidən' },
    { num: 28, ar: 'ٱلْبَصِيرُ', az: 'Əl-Basir', meaning: 'Hər şeyi görən' },
    { num: 29, ar: 'ٱلْحَكَمُ', az: 'Əl-Hakəm', meaning: 'Hökm verən, hakim' },
    { num: 30, ar: 'ٱلْعَدْلُ', az: 'Əl-Adl', meaning: 'Mütləq ədalətli' },
    { num: 31, ar: 'ٱللَّطِيفُ', az: 'Əl-Lətif', meaning: 'Lütf sahibi, incəlik edən' },
    { num: 32, ar: 'ٱلْخَبِيرُ', az: 'Əl-Xəbir', meaning: 'Hər şeydən xəbərdar olan' },
    { num: 33, ar: 'ٱلْحَلِيمُ', az: 'Əl-Həlim', meaning: 'Səbirli, yumuşaq davranan' },
    { num: 34, ar: 'ٱلْعَظِيمُ', az: 'Əl-Azim', meaning: 'Sonsuz böyüklük sahibi' },
    { num: 35, ar: 'ٱلْغَفُورُ', az: 'Əl-Ğəfur', meaning: 'Bağışlaması bol olan' },
    { num: 36, ar: 'ٱلشَّكُورُ', az: 'Əş-Şəkur', meaning: 'Az əmələ çox savab verən' },
    { num: 37, ar: 'ٱلْعَلِيُّ', az: 'Əl-Əliyy', meaning: 'Ən uca, ən yüksək' },
    { num: 38, ar: 'ٱلْكَبِيرُ', az: 'Əl-Kəbir', meaning: 'Böyüklükdə sonsuz' },
    { num: 39, ar: 'ٱلْحَفِيظُ', az: 'Əl-Hafiz', meaning: 'Hər şeyi qoruyan' },
    { num: 40, ar: 'ٱلْمُقِيتُ', az: 'Əl-Muqit', meaning: 'Qoruyub bəsləyən' },
    { num: 41, ar: 'ٱلْحَسِيبُ', az: 'Əl-Hasib', meaning: 'Hesaba çəkən' },
    { num: 42, ar: 'ٱلْجَلِيلُ', az: 'Əl-Cəlil', meaning: 'Cəlal sahibi, heybətli' },
    { num: 43, ar: 'ٱلْكَرِيمُ', az: 'Əl-Kərim', meaning: 'Kərəm sahibi, əsirgəməyən' },
    { num: 44, ar: 'ٱلرَّقِيبُ', az: 'Ər-Rəqib', meaning: 'Hər şeyi müşahidə edən' },
    { num: 45, ar: 'ٱلْمُجِيبُ', az: 'Əl-Mücib', meaning: 'Duaları qəbul edən' },
    { num: 46, ar: 'ٱلْوَاسِعُ', az: 'Əl-Vasi', meaning: 'Rəhməti geniş olan' },
    { num: 47, ar: 'ٱلْحَكِيمُ', az: 'Əl-Həkim', meaning: 'Hikmət sahibi' },
    { num: 48, ar: 'ٱلْوَدُودُ', az: 'Əl-Vədud', meaning: 'Çox sevən, sevdirən' },
    { num: 49, ar: 'ٱلْمَجِيدُ', az: 'Əl-Məcid', meaning: 'Şərəf və izzət sahibi' },
    { num: 50, ar: 'ٱلْبَاعِثُ', az: 'Əl-Bais', meaning: 'Ölüləri dirildən' },
    { num: 51, ar: 'ٱلشَّهِيدُ', az: 'Əş-Şəhid', meaning: 'Hər şeyə şahid olan' },
    { num: 52, ar: 'ٱلْحَقُّ', az: 'Əl-Haqq', meaning: 'Varlığı mütləq həqiqi olan' },
    { num: 53, ar: 'ٱلْوَكِيلُ', az: 'Əl-Vəkil', meaning: 'Güvənilən, vəkil olan' },
    { num: 54, ar: 'ٱلْقَوِيُّ', az: 'Əl-Qaviyy', meaning: 'Sonsuz güc sahibi' },
    { num: 55, ar: 'ٱلْمَتِينُ', az: 'Əl-Mətin', meaning: 'Çox möhkəm, sarsılmaz' },
    { num: 56, ar: 'ٱلْوَلِيُّ', az: 'Əl-Vəliyy', meaning: 'Dost, yardımçı' },
    { num: 57, ar: 'ٱلْحَمِيدُ', az: 'Əl-Həmid', meaning: 'Tərifə layiq olan' },
    { num: 58, ar: 'ٱلْمُحْصِي', az: 'Əl-Muhsi', meaning: 'Hər şeyi sayan' },
    { num: 59, ar: 'ٱلْمُبْدِئُ', az: 'Əl-Mubdi', meaning: 'Yoxdan var edən' },
    { num: 60, ar: 'ٱلْمُعِيدُ', az: 'Əl-Muid', meaning: 'Yenidən yaradan' },
    { num: 61, ar: 'ٱلْمُحْيِي', az: 'Əl-Muhyi', meaning: 'Can verən, dirildən' },
    { num: 62, ar: 'ٱلْمُمِيتُ', az: 'Əl-Mumit', meaning: 'Ölümü yaradan' },
    { num: 63, ar: 'ٱلْحَيُّ', az: 'Əl-Hayy', meaning: 'Əbədi diri olan' },
    { num: 64, ar: 'ٱلْقَيُّومُ', az: 'Əl-Qayyum', meaning: 'Hər şeyi ayaqda tutan' },
    { num: 65, ar: 'ٱلْوَاجِدُ', az: 'Əl-Vacid', meaning: 'İstədiyini tapan' },
    { num: 66, ar: 'ٱلْمَاجِدُ', az: 'Əl-Macid', meaning: 'Şanı uca olan' },
    { num: 67, ar: 'ٱلْوَاحِدُ', az: 'Əl-Vahid', meaning: 'Tək olan' },
    { num: 68, ar: 'ٱلصَّمَدُ', az: 'Əs-Saməd', meaning: 'Heç nəyə möhtac olmayan' },
    { num: 69, ar: 'ٱلْقَادِرُ', az: 'Əl-Qadir', meaning: 'Hər şeyə gücü çatan' },
    { num: 70, ar: 'ٱلْمُقْتَدِرُ', az: 'Əl-Muqtədir', meaning: 'Qüdrəti sonsuz olan' },
    { num: 71, ar: 'ٱلْمُقَدِّمُ', az: 'Əl-Muqaddim', meaning: 'İstədiyini öndə edən' },
    { num: 72, ar: 'ٱلْمُؤَخِّرُ', az: 'Əl-Muaxxir', meaning: 'İstədiyini geri buraxan' },
    { num: 73, ar: 'ٱلْأَوَّلُ', az: 'Əl-Əvvəl', meaning: 'Başlanğıcı olmayan, ilk' },
    { num: 74, ar: 'ٱلْآخِرُ', az: 'Əl-Axir', meaning: 'Sonu olmayan, son' },
    { num: 75, ar: 'ٱلظَّاهِرُ', az: 'Əz-Zahir', meaning: 'Varlığı aşkar olan' },
    { num: 76, ar: 'ٱلْبَاطِنُ', az: 'Əl-Batin', meaning: 'Gizli, dərk olunmayan' },
    { num: 77, ar: 'ٱلْوَالِي', az: 'Əl-Vali', meaning: 'Hər şeyi idarə edən' },
    { num: 78, ar: 'ٱلْمُتَعَالِي', az: 'Əl-Mütəali', meaning: 'Uca, hər şeydən yüksək' },
    { num: 79, ar: 'ٱلْبَرُّ', az: 'Əl-Bərr', meaning: 'İyilik və lütf sahibi' },
    { num: 80, ar: 'ٱلتَّوَّابُ', az: 'Ət-Təvvab', meaning: 'Tövbələri çox qəbul edən' },
    { num: 81, ar: 'ٱلْمُنْتَقِمُ', az: 'Əl-Müntəqim', meaning: 'Ədalətlə cəzalandıran' },
    { num: 82, ar: 'ٱلْعَفُوُّ', az: 'Əl-Afuvv', meaning: 'Affı çox olan' },
    { num: 83, ar: 'ٱلرَّؤُوفُ', az: 'Ər-Rauf', meaning: 'Çox şəfqətli' },
    { num: 84, ar: 'مَالِكُ ٱلْمُلْكِ', az: 'Malikül-Mülk', meaning: 'Mülkün mütləq sahibi' },
    { num: 85, ar: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ', az: 'Zül-Cəlali vəl-İkram', meaning: 'Cəlal və kərəm sahibi' },
    { num: 86, ar: 'ٱلْمُقْسِطُ', az: 'Əl-Muqsit', meaning: 'Ədalətlə hökm edən' },
    { num: 87, ar: 'ٱلْجَامِعُ', az: 'Əl-Cami', meaning: 'Bir araya gətirən, toplayan' },
    { num: 88, ar: 'ٱلْغَنِيُّ', az: 'Əl-Ğaniyy', meaning: 'Heç nəyə ehtiyacı olmayan' },
    { num: 89, ar: 'ٱلْمُغْنِي', az: 'Əl-Muğni', meaning: 'Zənginləşdirən' },
    { num: 90, ar: 'ٱلْمَانِعُ', az: 'Əl-Mani', meaning: 'İstəmədiyi şeyə mane olan' },
    { num: 91, ar: 'ٱلضَّارُّ', az: 'Əd-Darr', meaning: 'Zərər verən (imtahan üçün)' },
    { num: 92, ar: 'ٱلنَّافِعُ', az: 'Ən-Nafi', meaning: 'Fayda verən' },
    { num: 93, ar: 'ٱلنُّورُ', az: 'Ən-Nur', meaning: 'Aləmləri nurlandıran' },
    { num: 94, ar: 'ٱلْهَادِي', az: 'Əl-Hadi', meaning: 'Hidayətə çatdıran' },
    { num: 95, ar: 'ٱلْبَدِيعُ', az: 'Əl-Bədi', meaning: 'Nümunəsiz yaradan' },
    { num: 96, ar: 'ٱلْبَاقِي', az: 'Əl-Baqi', meaning: 'Varlığı əbədi olan' },
    { num: 97, ar: 'ٱلْوَارِثُ', az: 'Əl-Varis', meaning: 'Hər şeyin son sahibi' },
    { num: 98, ar: 'ٱلرَّشِيدُ', az: 'Ər-Rəşid', meaning: 'Doğruya yönləndirən' },
    { num: 99, ar: 'ٱلصَّبُورُ', az: 'Əs-Sabur', meaning: 'Çox səbirli olan' },
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

// Defolt bildiriş ayarları
const DEFAULT_SETTINGS = {
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

function getBakuNow() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Baku',
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

function getBakuTomorrow() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Baku',
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

/**
 * Bakıda verilmiş gün-ay-il üçün həftənin gününü tapır.
 */
function getWeekdayName(year, month, day) {
    const d = new Date(year, month - 1, day);
    return WEEKDAY_NAMES[d.getDay()];
}

/**
 * N gün sonrasının tarixini Bakı vaxtına görə hesablayır.
 */
function getBakuDateOffset(offsetDays) {
    const now = new Date();
    const target = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Baku',
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
        monthKey: `${parts.year}-${parts.month}`,
    };
}

async function getPrayerData(monthKey, env) {
    const data = BUNDLED_DATA[monthKey];
    if (!data) return null;
    return data;
}

async function getDayData(year, month, day, env) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = await getPrayerData(monthKey, env);
    if (!monthData) return null;
    return monthData.days.find(d => d.day === day) || null;
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
async function getRamadanDays(year, env) {
    const ramadan = RAMADAN_DATES[year];
    if (!ramadan) return [];

    const hijriYear = RAMADAN_HIJRI_YEAR[year] || '????';
    const days = [];

    const startDate = new Date(year, ramadan.start.month - 1, ramadan.start.day);

    for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const cYear = currentDate.getFullYear();
        const cMonth = currentDate.getMonth() + 1;
        const cDay = currentDate.getDate();

        const dayData = await getDayData(cYear, cMonth, cDay, env);
        const weekday = getWeekdayName(cYear, cMonth, cDay);

        days.push({
            ramadanDay: i + 1,
            hijriDate: `${i + 1} Ramazan ${hijriYear}`,
            gregorianDate: `${String(cDay).padStart(2, '0')}.${String(cMonth).padStart(2, '0')}.${cYear}`,
            gregorianShort: `${String(cDay).padStart(2, '0')}.${String(cMonth).padStart(2, '0')}`,
            weekday: weekday.substring(0, 3),
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
function canMarkFasting(ramadanDay, year) {
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
    const monthData = BUNDLED_DATA[monthKey];
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

function getMainMenuKeyboard() {
    const baku = getBakuNow();
    const hasRamadan = !!RAMADAN_DATES[baku.year];

    const keyboard = [
        [
            { text: '📅 Bugün', callback_data: 'cmd_vaxtlar' },
            { text: '📅 Sabah', callback_data: 'cmd_sabah' },
        ],
        [
            { text: '📆 Həftəlik', callback_data: 'cmd_heftelik' },
            { text: '🗓 Aylıq', callback_data: 'cmd_ay' },
        ],
    ];

    // Ramazan datası olan il üçün həmişə göstər
    if (hasRamadan) {
        keyboard.push([
            { text: '🌙 Ramazan', callback_data: 'cmd_ramazan' },
        ]);
    }

    keyboard.push([
        { text: '⚙️ Ayarlar', callback_data: 'cmd_ayarlar' },
        { text: '❓ Kömək', callback_data: 'cmd_help' },
    ]);
    keyboard.push([
        { text: '➕ Daha çox', callback_data: 'cmd_more' },
    ]);

    return { inline_keyboard: keyboard };
}

function getSecondaryMenuKeyboard() {
    const baku = getBakuNow();
    const hasRamadan = !!RAMADAN_DATES[baku.year];

    const keyboard = [
        [
            { text: '📿 Təsbeh', callback_data: 'cmd_zikr' },
            { text: '📖 Hədis', callback_data: 'cmd_hedis' },
        ],
        [
            { text: '🕌 Qəza', callback_data: 'cmd_qeza' },
            { text: '📅 Təqvim', callback_data: 'cmd_teqvim' },
        ],
        [
            { text: '📿 Əsma', callback_data: 'cmd_asma' },
            { text: '✨ Cümə', callback_data: 'cmd_cume' },
        ],
        [
            { text: '📅 Hicri', callback_data: 'cmd_cevir_today' },
        ],
    ];

    if (hasRamadan) {
        keyboard.push([
            { text: '📊 Statistika', callback_data: 'cmd_stats' },
            { text: '🤲 Dua', callback_data: 'cmd_dua' },
        ]);
    }

    keyboard.push([
        { text: '🔙 Əsas menyu', callback_data: 'cmd_menu' },
    ]);

    return { inline_keyboard: keyboard };
}

function getSettingsKeyboard(settings) {
    const yn = (val) => val ? '✅' : '❌';
    return {
        inline_keyboard: [
            [{ text: `${yn(settings.reminder15)} 15 dəq xatırlatma`, callback_data: 'set_reminder15' }],
            [{ text: `${yn(settings.reminder10)} 10 dəq xatırlatma`, callback_data: 'set_reminder10' }],
            [{ text: `${yn(settings.reminder5)} 5 dəq xatırlatma`, callback_data: 'set_reminder5' }],
            [{ text: `${yn(settings.reminderOnTime)} Vaxt gəldikdə`, callback_data: 'set_reminderOnTime' }],
            [{ text: `${yn(settings.morningSchedule)} Səhər cədvəli (05:00)`, callback_data: 'set_morningSchedule' }],
            [{ text: '━━━ Namazlar ━━━', callback_data: 'noop' }],
            [
                { text: `${yn(settings.prayers.imsak)} İmsak`, callback_data: 'set_p_imsak' },
                { text: `${yn(settings.prayers.subh)} Sübh`, callback_data: 'set_p_subh' },
                { text: `${yn(settings.prayers.zohr)} Zöhr`, callback_data: 'set_p_zohr' },
            ],
            [
                { text: `${yn(settings.prayers.esr)} Əsr`, callback_data: 'set_p_esr' },
                { text: `${yn(settings.prayers.meqrib)} Məğrib`, callback_data: 'set_p_meqrib' },
                { text: `${yn(settings.prayers.isha)} İşa`, callback_data: 'set_p_isha' },
            ],
            [{ text: '🔕 Bütün bildirişləri bağla', callback_data: 'set_notifications_off' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };
}

function getBackKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };
}

// ═══════════════════════════════════════════════════════════════
//  MESAJ FORMATLAMA
// ═══════════════════════════════════════════════════════════════

function formatPrayerTimesMessage(dayData, dateStr, currentMinutes, title = '📅 Bugünkü Namaz Vaxtları', ramadanInfo = null) {
    let nextPrayer = null;
    let nextPrayerTime = null;
    let minutesUntilNext = null;

    if (currentMinutes >= 0) {
        for (const key of NOTIFY_PRAYERS) {
            const prayerMin = timeToMinutes(dayData[key], key === 'gecaYarisi');
            if (prayerMin > currentMinutes) {
                nextPrayer = key;
                nextPrayerTime = dayData[key];
                minutesUntilNext = prayerMin - currentMinutes;
                break;
            }
        }
    }

    // Hicri tarixi hesabla
    const dateParts = dateStr.split('.');
    const hijriStr = (dateParts.length === 3) ?
        formatHijriDate(parseInt(dateParts[2]), parseInt(dateParts[1]), parseInt(dateParts[0])) : '';

    let msg = `${title}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 Bakı  •  🗓 ${dateStr}\n`;
    if (hijriStr) {
        msg += `☪️ ${hijriStr}\n`;
    }

    if (ramadanInfo) {
        msg += `🌙 Ramazan — ${ramadanInfo.dayNumber}-ci gün\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const key of DISPLAY_ORDER) {
        const label = ALL_LABELS[key] || key;
        const time = dayData[key];
        if (!time) continue;
        const arrow = (key === nextPrayer) ? ' ◀️' : '';

        // Ramazan zamanı İmsak və Məğrib vurğulanır
        if (ramadanInfo && (key === 'imsak' || key === 'meqrib')) {
            const extra = key === 'imsak' ? ' 🍽 Səhər' : ' 🍽 İftar';
            msg += `  <b>${label}  —  ${time}${extra}</b>${arrow}\n`;
        } else {
            msg += `  ${label}  —  ${time}${arrow}\n`;
        }
    }

    // Ramazan zamanı Teravih vaxtı əlavə et
    if (ramadanInfo && dayData.isha) {
        const teravihTime = calculateTeravihTime(dayData.isha);
        if (teravihTime) {
            msg += `  🕌 Teravih  —  ${teravihTime}\n`;
        }
    }

    if (nextPrayer && nextPrayerTime && minutesUntilNext !== null) {
        msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `⏳ Növbəti: ${PRAYER_NAMES[nextPrayer]} — ${minutesUntilNext} dəq sonra\n`;
    }

    if (ramadanInfo) {
        msg += `\n🤲 Allahım, orucumuzu qəbul et!`;
    } else {
        msg += `\n🕌 Qafqaz Müsəlmanları İdarəsi`;
    }

    return msg;
}

function formatWeeklyMessage(daysData) {
    let msg = `📆 Həftəlik Namaz Vaxtları\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 Bakı\n\n`;

    for (const { year, month, day, dayData } of daysData) {
        if (!dayData) continue;

        const weekday = getWeekdayName(year, month, day);
        const dateStr = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
        const isRam = isRamadan(year, month, day);
        const ramLabel = isRam ? ' 🌙' : '';

        msg += `<b>📍 ${weekday}, ${dateStr}${ramLabel}</b>\n`;
        msg += `  🌙 ${dayData.imsak}  🌅 ${dayData.subh}  ☀️ ${dayData.zohr}\n`;
        msg += `  🌤️ ${dayData.esr}  🌇 ${dayData.meqrib}  🌃 ${dayData.isha}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Sıra: İmsak | Sübh | Zöhr | Əsr | Məğrib | İşa\n`;
    msg += `🕌 Qafqaz Müsəlmanları İdarəsi`;
    return msg;
}

function formatMonthlyMessage(monthData, monthNum, year, part, totalParts) {
    const monthName = MONTH_NAMES_REVERSE[monthNum] || `Ay ${monthNum}`;
    let msg = `🗓 ${monthName} ${year} — Namaz Vaxtları`;
    if (totalParts > 1) {
        msg += ` (${part}/${totalParts})`;
    }
    msg += `\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 Bakı\n\n`;

    // Kompakt cədvəl başlığı
    msg += `<code>Gün  Sübh  Günçx Zöhr  Əsr   Məğr  İşa</code>\n`;
    msg += `<code>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</code>\n`;

    for (const dayData of monthData) {
        const d = String(dayData.day).padStart(2, ' ');
        const isRam = isRamadan(year, monthNum, dayData.day);
        const ramMark = isRam ? '🌙' : '  ';

        msg += `<code>${d}${ramMark} ${dayData.subh} ${dayData.gunCixir} ${dayData.zohr} ${dayData.esr} ${dayData.meqrib} ${dayData.isha}</code>\n`;
    }

    msg += `\n🕌 Qafqaz Müsəlmanları İdarəsi`;
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

    // DD AY_ADI [IL]
    match = text.match(/^(\d{1,2})\s+([a-zçşğüöıə]+)(?:\s+(\d{4}))?$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const monthName = match[2];
        const year = match[3] ? parseInt(match[3], 10) : currentYear;
        const monthNum = MONTH_NAMES_AZ[monthName];
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
    const baku = getBakuNow();
    const dayData = await getDayData(baku.year, baku.month, baku.day, env);
    const isRam = isRamadan(baku.year, baku.month, baku.day);

    let reply;
    if (dayData) {
        reply = `🕌 <b>Bakı Namaz Vaxtları Botu</b>\n\n`;

        if (isRam) {
            const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
            reply += `🌙 <b>Ramazan Mübarək!</b> (${ramDay}-ci gün)\n\n`;
        }

        reply += `Salam! Bu bot sizə hər gün Bakı üçün namaz vaxtlarını göndərir.\n\n`;
        reply += `Aşağıdakı düymələrdən istifadə edin və ya əmr yazın:\n\n`;

        const currentMinutes = baku.hours * 60 + baku.minutes;
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(baku.year, baku.month, baku.day) } : null;
        reply += formatPrayerTimesMessage(dayData, baku.dateStr, currentMinutes, '📅 Bugünkü Namaz Vaxtları', ramadanInfo);
    } else {
        reply = `🕌 <b>Bakı Namaz Vaxtları Botu</b>\n\n`;
        reply += `⚠️ Bu ay üçün data faylı tapılmadı.\nAdmin data faylını yükləməlidir.`;
    }

    await telegramSendMessage(botToken, chatId, reply, getMainMenuKeyboard());
}

async function cmdVaxtlar(botToken, chatId, env) {
    const baku = getBakuNow();
    const dayData = await getDayData(baku.year, baku.month, baku.day, env);

    if (dayData) {
        const currentMinutes = baku.hours * 60 + baku.minutes;
        const isRam = isRamadan(baku.year, baku.month, baku.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(baku.year, baku.month, baku.day) } : null;
        const reply = formatPrayerTimesMessage(dayData, baku.dateStr, currentMinutes, '📅 Bugünkü Namaz Vaxtları', ramadanInfo);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
    } else {
        await telegramSendMessage(botToken, chatId, '⚠️ Bugün üçün namaz vaxtları tapılmadı.', getBackKeyboard());
    }
}

async function cmdSabah(botToken, chatId, env) {
    const tomorrow = getBakuTomorrow();
    const dayData = await getDayData(tomorrow.year, tomorrow.month, tomorrow.day, env);

    if (dayData) {
        const isRam = isRamadan(tomorrow.year, tomorrow.month, tomorrow.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(tomorrow.year, tomorrow.month, tomorrow.day) } : null;
        const reply = formatPrayerTimesMessage(dayData, tomorrow.dateStr, -1, '📅 Sabahkı Namaz Vaxtları', ramadanInfo);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
    } else {
        await telegramSendMessage(botToken, chatId, '⚠️ Sabah üçün namaz vaxtları tapılmadı.', getBackKeyboard());
    }
}

async function cmdHeftelik(botToken, chatId, env) {
    const daysData = [];

    for (let i = 0; i < 7; i++) {
        const dateInfo = getBakuDateOffset(i);
        const dayData = await getDayData(dateInfo.year, dateInfo.month, dateInfo.day, env);
        daysData.push({
            year: dateInfo.year,
            month: dateInfo.month,
            day: dateInfo.day,
            dayData,
        });
    }

    const reply = formatWeeklyMessage(daysData);
    await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
}

async function cmdTarix(botToken, chatId, dateText, env) {
    const baku = getBakuNow();
    const parsed = parseDate(dateText, baku.year);

    if (!parsed) {
        let reply = `⚠️ Tarix formatı düzgün deyil.\n\n`;
        reply += `<b>Düzgün formatlar:</b>\n`;
        reply += `• /tarix 25.03.2026\n`;
        reply += `• /tarix 25.03\n`;
        reply += `• /tarix 25 mart\n`;
        reply += `• /tarix 25 mart 2026`;
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
        return;
    }

    const dayData = await getDayData(parsed.year, parsed.month, parsed.day, env);

    if (dayData) {
        const dateStr = `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`;
        const weekday = getWeekdayName(parsed.year, parsed.month, parsed.day);
        const isRam = isRamadan(parsed.year, parsed.month, parsed.day);
        const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(parsed.year, parsed.month, parsed.day) } : null;
        const title = `📅 ${weekday}, ${dateStr}`;
        const reply = formatPrayerTimesMessage(dayData, dateStr, -1, title, ramadanInfo);
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
    } else {
        await telegramSendMessage(botToken, chatId, `⚠️ ${parsed.day}.${String(parsed.month).padStart(2, '0')}.${parsed.year} tarixi üçün data tapılmadı.\n\nMəlumat yalnız mövcud aylıq data fayllarında mövcuddur.`, getBackKeyboard());
    }
}

async function cmdAy(botToken, chatId, argText, env) {
    const baku = getBakuNow();
    let targetMonth = baku.month;
    let targetYear = baku.year;

    // Ay adı və ya nömrəsi ilə sorğu
    if (argText) {
        const arg = argText.trim().toLowerCase();
        if (MONTH_NAMES_AZ[arg]) {
            targetMonth = MONTH_NAMES_AZ[arg];
        } else {
            const num = parseInt(arg, 10);
            if (num >= 1 && num <= 12) {
                targetMonth = num;
            }
        }
    }

    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const monthData = await getPrayerData(monthKey, env);

    if (!monthData || !monthData.days) {
        const monthName = MONTH_NAMES_REVERSE[targetMonth] || `Ay ${targetMonth}`;
        await telegramSendMessage(botToken, chatId, `⚠️ ${monthName} ${targetYear} üçün data tapılmadı.`, getBackKeyboard());
        return;
    }

    // Telegram mesaj limiti 4096 simvoldur, ona görə aylığı hissələrə bölürük
    const days = monthData.days;
    const midPoint = Math.ceil(days.length / 2);
    const part1 = days.slice(0, midPoint);
    const part2 = days.slice(midPoint);

    const msg1 = formatMonthlyMessage(part1, targetMonth, targetYear, 1, 2);
    const msg2 = formatMonthlyMessage(part2, targetMonth, targetYear, 2, 2);

    await telegramSendMessage(botToken, chatId, msg1);
    await telegramSendMessage(botToken, chatId, msg2, getBackKeyboard());
}

// Qiblə funksiyası silindi (v2.0 — sadələşdirilmə)

async function cmdHelp(botToken, chatId) {
    let msg = `🕌 <b>Bot Əmrləri</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📅 <b>Namaz Vaxtları:</b>\n`;
    msg += `  /vaxtlar — Bugünkü vaxtlar\n`;
    msg += `  /sabah — Sabahkı vaxtlar\n`;
    msg += `  /heftelik — 7 günlük cədvəl\n`;
    msg += `  /ay — Aylıq cədvəl\n`;
    msg += `  /tarix 25.03.2026 — Tarix üzrə\n\n`;
    msg += `🌙 <b>Ramazan:</b>\n`;
    msg += `  /ramazan — Ramazan təqvimi + oruc izləmə\n`;
    msg += `  /statistika — Oruc statistikası\n`;
    msg += `  /dua — İftar/İmsak duaları\n\n`;
    msg += `📿 <b>İbadət:</b>\n`;
    msg += `  /zikr — Rəqəmsal Təsbeh (sayğac)\n`;
    msg += `  /hedis — Günün hədisi\n`;
    msg += `  /qeza — Qəza namazı hesablayıcısı\n`;
    msg += `  /asma — Əsma-ül Hüsna (99 Ad)\n\n`;
    msg += `☪️ <b>Hicri Təqvim:</b>\n`;
    msg += `  /cevir — Bugünkü Hicri tarix\n`;
    msg += `  /cevir 25.03.2026 — Tarix çevirici\n\n`;
    msg += `📅 <b>Təqvim & Əlavə:</b>\n`;
    msg += `  /teqvim — Dini günlər təqvimi\n`;
    msg += `  /cume — Cümə təbrikləri\n`;
    msg += `  /ayarlar — Bildiriş ayarları\n`;
    msg += `  /help — Bu kömək mesajı\n\n`;
    msg += `🔔 <b>Avtomatik Bildirişlər:</b>\n`;
    msg += `  • Hər namaza 15, 10, 5 dəq qalmış\n`;
    msg += `  • Namaz vaxtı gəldikdə\n`;
    msg += `  • Hər gün səhər 05:00-da cədvəl\n\n`;
    msg += `💡 <i>Aşağıdakı düymələrdən də istifadə edə bilərsiniz!</i>`;
    await telegramSendMessage(botToken, chatId, msg, getMainMenuKeyboard());
}

async function cmdAyarlar(botToken, chatId, env) {
    const settings = await getSettings(chatId, env);

    let msg = `⚙️ <b>Bildiriş Ayarları</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Bildirişləri fərdiləşdirmək üçün\naşağıdakı düymələrə basın:\n\n`;
    msg += `✅ = Aktiv  |  ❌ = Deaktiv`;

    await telegramSendMessage(botToken, chatId, msg, getSettingsKeyboard(settings));
}

// ═══════════════════════════════════════════════════════════════
//  RAMAZAN ƏMRLƏRI
// ═══════════════════════════════════════════════════════════════

/**
 * Ramazan təqvimini formatlayır (bir səhifə, ~10 gün).
 */
function formatRamadanPage(days, fastingStatus, pageNum, totalPages) {
    const baku = getBakuNow();
    const year = baku.year;
    const hijriYear = RAMADAN_HIJRI_YEAR[year] || RAMADAN_HIJRI_YEAR[2026] || '????';
    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const currentRamDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : 0;

    let msg = `🌙 <b>Ramazan ${hijriYear} Təqvimi</b>`;
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
            msg += `⏳ Ramazana <b>${diffDays} gün</b> qalıb\n`;
        } else if (todayDate <= endDate) {
            msg += `📿 Ramazanın <b>${currentRamDay}-ci</b> günü\n`;
        } else {
            msg += `🎉 Ramazan bitib — Bayramınız mübarək!\n`;
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
                statusIcon = '🔲';
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
        msg += `\n⭐ = Qadr gecəsi ehtimalı\n`;
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
function getRamadanKeyboard(days, fastingStatus, pageNum, totalPages) {
    const keyboard = [];

    // Oruc düymələri — yalnız qeyd edilə bilən günlər üçün
    const markableDays = days.filter(d => canMarkFasting(d.ramadanDay, d.year));

    // Qruplama: hər sətirdə 3 düymə
    for (let i = 0; i < markableDays.length; i += 3) {
        const row = [];
        for (let j = i; j < Math.min(i + 3, markableDays.length); j++) {
            const d = markableDays[j];
            const dayNum = d.ramadanDay;
            const status = fastingStatus[dayNum];

            if (status === true) {
                row.push({ text: `${dayNum} ✅ Ləğv et`, callback_data: `fast_undo_${dayNum}` });
            } else if (status === false) {
                row.push({ text: `${dayNum} ❌ Ləğv et`, callback_data: `fast_undo_${dayNum}` });
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
            navRow.push({ text: '◀️ Əvvəlki', callback_data: `ramazan_page_${pageNum - 1}` });
        }
        if (pageNum < totalPages) {
            navRow.push({ text: 'Növbəti ▶️', callback_data: `ramazan_page_${pageNum + 1}` });
        }
        keyboard.push(navRow);
    }

    // Statistika və geri
    keyboard.push([
        { text: '📊 Statistika', callback_data: 'cmd_stats' },
        { text: '🤲 Dua', callback_data: 'cmd_dua' },
    ]);
    keyboard.push([
        { text: '🔙 Əsas menyu', callback_data: 'cmd_menu' },
    ]);

    return { inline_keyboard: keyboard };
}

async function cmdRamazan(botToken, chatId, env, page = 1) {
    const baku = getBakuNow();
    const year = baku.year;
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) {
        await telegramSendMessage(
            botToken,
            chatId,
            `⚠️ ${year}-ci il üçün Ramazan tarixləri mövcud deyil.`,
            getBackKeyboard()
        );
        return;
    }

    const ramadanDays = await getRamadanDays(year, env);
    const fastingStatus = await getFastingStatus(chatId, year, env);

    // 3 səhifəyə böl (hər biri 10 gün)
    const perPage = 10;
    const totalPages = Math.ceil(ramadanDays.length / perPage);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * perPage;
    const pageDays = ramadanDays.slice(start, start + perPage);

    let msg = formatRamadanPage(pageDays, fastingStatus, currentPage, totalPages);

    // Sonuncu səhifədə statistika göstər
    if (currentPage === totalPages) {
        const stats = calculateRamadanStats(fastingStatus, ramadanDays.length, year);
        const pct = stats.total > 0 ? Math.round((stats.fasted / stats.total) * 100) : 0;
        msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📊 <b>Statistika:</b>\n`;
        msg += `✅ ${stats.fasted} tutuldu | ❌ ${stats.missed} tutulmadı\n`;
        msg += `⬜ ${stats.unmarked} qeyd edilməyib | 🔲 ${stats.future} qalıb\n`;
        msg += `<code>${makeProgressBar(stats.fasted, stats.total)} ${pct}%</code>`;
    }

    const kb = getRamadanKeyboard(pageDays, fastingStatus, currentPage, totalPages);
    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdRamazanStats(botToken, chatId, env) {
    const baku = getBakuNow();
    const year = baku.year;
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) {
        await telegramSendMessage(
            botToken,
            chatId,
            `⚠️ ${year}-ci il üçün Ramazan tarixləri mövcud deyil.`,
            getBackKeyboard()
        );
        return;
    }

    const ramadanDays = await getRamadanDays(year, env);
    const fastingStatus = await getFastingStatus(chatId, year, env);
    const stats = calculateRamadanStats(fastingStatus, ramadanDays.length, year);
    const pct = stats.total > 0 ? Math.round((stats.fasted / stats.total) * 100) : 0;
    const hijriYear = RAMADAN_HIJRI_YEAR[year] || '????';

    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const ramDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : null;

    let msg = `📊 <b>Ramazan ${hijriYear} — Oruc Statistikası</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (ramDay) {
        msg += `🌙 Bu gün Ramazanın <b>${ramDay}-ci</b> günüdür\n\n`;
    }

    msg += `✅ Tutulan oruclar: <b>${stats.fasted}</b>\n`;
    msg += `❌ Tutulmayan günlər: <b>${stats.missed}</b>\n`;
    msg += `⬜ Qeyd edilməyib: <b>${stats.unmarked}</b>\n`;
    msg += `🔲 Qalan günlər: <b>${stats.future}</b>\n\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📈 <b>Tamamlanma:</b>\n`;
    msg += `<code>${makeProgressBar(stats.fasted, stats.total, 20)} ${pct}%</code>\n`;
    msg += `<code>${stats.fasted}/${stats.total} gün</code>\n\n`;

    if (stats.missed > 0) {
        msg += `⚠️ <b>Qəza orucları:</b> ${stats.missed} gün\n\n`;
    }

    // Nailiyyətlər
    const achievements = checkAchievements(fastingStatus);
    if (achievements.length > 0) {
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🏆 <b>Nailiyyətlər:</b>\n\n`;
        for (const ach of achievements) {
            msg += `${ach.emoji} <b>${ach.name}</b> — ${ach.desc}\n`;
        }
        msg += `\n`;
    }

    // Motivasiya mesajı
    if (ramDay && ramDay > 0 && ramDay <= 30) {
        msg += `💬 ${MOTIVASIYA_MESAJLARI[ramDay - 1]}\n\n`;
    }

    msg += `🤲 Allah oruclarınızı qəbul etsin!`;

    const kb = {
        inline_keyboard: [
            [{ text: '🌙 Ramazan Təqvimi', callback_data: 'cmd_ramazan' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };

    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdDua(botToken, chatId) {
    const baku = getBakuNow();
    const isRam = isRamadan(baku.year, baku.month, baku.day);
    const ramDay = isRam ? getRamadanDayNumber(baku.year, baku.month, baku.day) : 0;

    let msg = `🤲 <b>Ramazan Duaları</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += RAMADAN_DUAS.imsak;
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += RAMADAN_DUAS.iftar;
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += RAMADAN_DUAS.umumiDua;

    // Günün hədisi
    const quoteIndex = (ramDay > 0 && ramDay <= 30) ? ramDay - 1 : (baku.day % 30);
    msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📿 <b>Günün Hədisi:</b>\n\n`;
    msg += `<i>${RAMADAN_DAILY_QUOTES[quoteIndex]}</i>`;

    // Qadr gecəsi xüsusi mesaj
    if (ramDay > 0 && QADR_NIGHTS.includes(ramDay)) {
        msg += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `⭐ <b>Bu gecə Qadr gecəsi ola bilər!</b>\n`;
        msg += `Qadr gecəsi min aydan xeyirlidir.\n`;
        msg += `🤲 Gecəni ibadətlə keçirin!`;
    }

    const kb = {
        inline_keyboard: [
            [{ text: '🌙 Ramazan Təqvimi', callback_data: 'cmd_ramazan' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };

    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  HİCRİ TƏQVİM ÇEVİRİCİ
// ═══════════════════════════════════════════════════════════════

async function cmdCevir(botToken, chatId, dateText) {
    const baku = getBakuNow();
    const parsed = parseDate(dateText, baku.year);

    if (!parsed) {
        let reply = `⚠️ Tarix formatı düzgün deyil.\n\n`;
        reply += `<b>Düzgün formatlar:</b>\n`;
        reply += `• /cevir 25.03.2026\n`;
        reply += `• /cevir 25.03\n`;
        reply += `• /cevir 25 mart`;
        await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
        return;
    }

    const hijri = gregorianToHijri(parsed.year, parsed.month, parsed.day);
    const hMonthName = HIJRI_MONTH_NAMES[hijri.month] || `Ay ${hijri.month}`;
    const weekday = getWeekdayName(parsed.year, parsed.month, parsed.day);
    const gDateStr = `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`;

    let msg = `📅 <b>Təqvim Çevirici</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `🗓 <b>Miladi:</b> ${weekday}, ${gDateStr}\n\n`;
    msg += `☪️ <b>Hicri:</b> ${hijri.day} ${hMonthName} ${hijri.year}\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <i>Hicri tarix ±1 gün fərq edə bilər.</i>`;

    await telegramSendMessage(botToken, chatId, msg, getBackKeyboard());
}

// ═══════════════════════════════════════════════════════════════
//  GÜNÜN HƏDİSİ
// ═══════════════════════════════════════════════════════════════

async function cmdHedis(botToken, chatId) {
    const baku = getBakuNow();
    // Günə görə sabit hədis seç (hər gün fərqli, amma gün içi eyni)
    const dayOfYear = Math.floor((new Date(baku.year, baku.month - 1, baku.day) - new Date(baku.year, 0, 0)) / (24 * 60 * 60 * 1000));
    const allHadith = [...RAMADAN_DAILY_QUOTES, ...EXTENDED_HADITH_DB];
    const index = dayOfYear % allHadith.length;
    const hijriStr = formatHijriDate(baku.year, baku.month, baku.day);

    let msg = `📿 <b>Günün Hədisi</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🗓 ${baku.dateStr}  •  ☪️ ${hijriStr}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `<i>${allHadith[index]}</i>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 Hər gün yeni hədis üçün /hedis yazın.`;

    const kb = {
        inline_keyboard: [
            [{ text: '📿 Başqa hədis', callback_data: 'cmd_hedis_random' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  ZİKR (TƏSBEH) SAYĞAC
// ═══════════════════════════════════════════════════════════════

function getZikrKeyboard(counts) {
    const keyboard = [];
    for (const item of ZIKR_ITEMS) {
        const count = counts[item.id] || 0;
        const done = count >= item.target;
        const icon = done ? '✅' : '📿';
        keyboard.push([
            { text: `${icon} ${item.name}: ${count}/${item.target}`, callback_data: `zikr_info_${item.id}` },
            { text: '➕', callback_data: `zikr_plus_${item.id}` },
        ]);
    }
    keyboard.push([{ text: '🔄 Sıfırla', callback_data: 'zikr_reset' }]);
    keyboard.push([{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }]);
    return { inline_keyboard: keyboard };
}

async function cmdZikr(botToken, chatId, env) {
    // KV-dən sayğac oxu
    const key = `zikr:${chatId}`;
    const counts = await env.NOTIFICATIONS_KV.get(key, 'json') || {};

    let msg = `📿 <b>Rəqəmsal Təsbeh</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
    msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;

    // Ümumi statistika
    let totalCount = 0;
    for (const item of ZIKR_ITEMS) {
        totalCount += counts[item.id] || 0;
    }
    msg += `🔢 Ümumi zikr sayı: <b>${totalCount}</b>`;

    await telegramSendMessage(botToken, chatId, msg, getZikrKeyboard(counts));
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

function getQezaKeyboard(missed) {
    const keyboard = [];
    for (const p of QEZA_PRAYERS) {
        const count = missed[p.id] || 0;
        keyboard.push([
            { text: `${p.name}: ${count}`, callback_data: 'noop' },
            { text: '➖', callback_data: `qeza_sub_${p.id}` },
            { text: '➕', callback_data: `qeza_add_${p.id}` },
        ]);
    }
    keyboard.push([{ text: '🔄 Hamısını sıfırla', callback_data: 'qeza_reset' }]);
    keyboard.push([{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }]);
    return { inline_keyboard: keyboard };
}

async function cmdQeza(botToken, chatId, env) {
    const missed = await getMissedPrayers(chatId, env);

    let total = 0;
    for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }

    let msg = `🕌 <b>Qəza Namazı Hesablayıcısı</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Qılmadığınız namazların sayını izləyin.\n`;
    msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
    msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
    msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;

    await telegramSendMessage(botToken, chatId, msg, getQezaKeyboard(missed));
}

// ═══════════════════════════════════════════════════════════════
//  DİNİ GÜNLƏR TƏQVİMİ
// ═══════════════════════════════════════════════════════════════

async function cmdTeqvim(botToken, chatId) {
    const baku = getBakuNow();
    const todayStr = `${baku.year}-${String(baku.month).padStart(2, '0')}-${String(baku.day).padStart(2, '0')}`;

    let msg = `📅 <b>2026 Dini Günlər Təqvimi</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let upcomingCount = 0;

    for (const day of RELIGIOUS_DAYS_2026) {
        const isPast = day.date < todayStr;
        const isToday = day.date === todayStr;

        // Tarix formatla
        const parts = day.date.split('-');
        const dateStr = `${parts[2]}.${parts[1]}.${parts[0]}`;

        if (isToday) {
            msg += `👉 <b>${day.name}</b>\n`;
            msg += `    📅 ${dateStr} — <b>BU GÜN!</b>\n`;
            msg += `    <i>${day.desc}</i>\n\n`;
        } else if (isPast) {
            msg += `✅ <s>${day.name}</s>\n`;
            msg += `    📅 ${dateStr}\n\n`;
        } else {
            upcomingCount++;
            // Neçə gün qaldığını hesabla
            const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const todayDate = new Date(baku.year, baku.month - 1, baku.day);
            const diffDays = Math.ceil((targetDate - todayDate) / (24 * 60 * 60 * 1000));
            msg += `⏳ <b>${day.name}</b>\n`;
            msg += `    📅 ${dateStr} — <b>${diffDays} gün qalıb</b>\n`;
            msg += `    <i>${day.desc}</i>\n\n`;
        }
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 Əsas: Qafqaz Müsəlmanları İdarəsi`;

    await telegramSendMessage(botToken, chatId, msg, getBackKeyboard());
}

// ═══════════════════════════════════════════════════════════════
//  ƏSMA-ÜL HÜSNA (99 AD)
// ═══════════════════════════════════════════════════════════════

async function cmdAsma(botToken, chatId) {
    const randomIdx = Math.floor(Math.random() * ASMA_UL_HUSNA.length);
    const name = ASMA_UL_HUSNA[randomIdx];

    let msg = `📿 <b>Əsma-ül Hüsna — Allahın 99 Adı</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `<b>${name.num}/99</b>\n\n`;
    msg += `<b>${name.ar}</b>\n\n`;
    msg += `🔤 <b>${name.az}</b>\n\n`;
    msg += `📖 <i>${name.meaning}</i>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 Başqa ad üçün düyməyə basın.`;

    const kb = {
        inline_keyboard: [
            [{ text: '📿 Başqa ad', callback_data: 'cmd_asma_random' }],
            [{ text: '📋 Hamısını göstər (1-33)', callback_data: 'asma_list_1' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

async function cmdAsmaList(botToken, chatId, page) {
    const perPage = 33;
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, 99);
    const totalPages = 3;

    let msg = `📿 <b>Əsma-ül Hüsna</b> (${start + 1}-${end}/99)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (let i = start; i < end; i++) {
        const n = ASMA_UL_HUSNA[i];
        msg += `<b>${n.num}.</b> ${n.ar} — <b>${n.az}</b>\n    <i>${n.meaning}</i>\n\n`;
    }

    const navRow = [];
    if (page > 1) navRow.push({ text: '◀️ Əvvəlki', callback_data: `asma_list_${page - 1}` });
    if (page < totalPages) navRow.push({ text: 'Növbəti ▶️', callback_data: `asma_list_${page + 1}` });

    const kb = {
        inline_keyboard: [
            navRow,
            [{ text: '📿 Təsadüfi ad', callback_data: 'cmd_asma_random' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
        ],
    };
    await telegramSendMessage(botToken, chatId, msg, kb);
}

// ═══════════════════════════════════════════════════════════════
//  CÜMƏ TƏBRİKLƏRİ
// ═══════════════════════════════════════════════════════════════

async function cmdCume(botToken, chatId) {
    const randomIdx = Math.floor(Math.random() * FRIDAY_MESSAGES.length);
    const msg = FRIDAY_MESSAGES[randomIdx];

    const kb = {
        inline_keyboard: [
            [{ text: '✨ Başqa təbrik', callback_data: 'cmd_cume_random' }],
            [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
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
        // Mövcud istifadəçi — lastActive-i yenilə
        existing.lastActive = now;
        if (userObj?.first_name) existing.firstName = userObj.first_name;
        if (userObj?.last_name) existing.lastName = userObj.last_name;
        if (userObj?.username) existing.username = userObj.username;
        await env.NOTIFICATIONS_KV.put(userKey, JSON.stringify(existing));
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
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅 Bugün');
        await cmdVaxtlar(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_sabah') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅 Sabah');
        await cmdSabah(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_heftelik') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📆 Həftəlik');
        await cmdHeftelik(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_ay') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🗓 Aylıq');
        await cmdAy(botToken, chatId, '', env);
        return;
    }
    if (data === 'cmd_more') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '➕ Daha çox');
        let msg = `➕ <b>Əlavə Funksiyalar</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Aşağıdakı düymələrdən istifadə edin:`;
        await telegramSendMessage(botToken, chatId, msg, getSecondaryMenuKeyboard());
        return;
    }
    if (data === 'cmd_help') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '❓ Kömək');
        await cmdHelp(botToken, chatId);
        return;
    }
    if (data === 'cmd_ayarlar') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '⚙️ Ayarlar');
        await cmdAyarlar(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_menu') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🏠 Menyu');
        const baku = getBakuNow();
        const dayData = await getDayData(baku.year, baku.month, baku.day, env);
        if (dayData) {
            const currentMinutes = baku.hours * 60 + baku.minutes;
            const isRam = isRamadan(baku.year, baku.month, baku.day);
            const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(baku.year, baku.month, baku.day) } : null;
            const reply = formatPrayerTimesMessage(dayData, baku.dateStr, currentMinutes, '📅 Bugünkü Namaz Vaxtları', ramadanInfo);
            await telegramEditMessage(botToken, chatId, messageId, reply, getMainMenuKeyboard());
        } else {
            await telegramEditMessage(botToken, chatId, messageId, '🕌 Bakı Namaz Vaxtları Botu\n\nAşağıdakı düymələrdən istifadə edin:', getMainMenuKeyboard());
        }
        return;
    }

    // ── Yeni əmrlər: Zikr, Hədis, Hicri ──
    if (data === 'cmd_zikr') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿 Təsbeh');
        await cmdZikr(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_hedis') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📖 Hədis');
        await cmdHedis(botToken, chatId);
        return;
    }
    if (data === 'cmd_hedis_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿 Yeni hədis');
        const allHadith = [...RAMADAN_DAILY_QUOTES, ...EXTENDED_HADITH_DB];
        const randomIdx = Math.floor(Math.random() * allHadith.length);
        const baku = getBakuNow();
        const hijriStr = formatHijriDate(baku.year, baku.month, baku.day);
        let msg = `📿 <b>Təsadüfi Hədis</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `<i>${allHadith[randomIdx]}</i>\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `☪️ ${hijriStr}`;
        const kb = {
            inline_keyboard: [
                [{ text: '📿 Başqa hədis', callback_data: 'cmd_hedis_random' }],
                [{ text: '🔙 Əsas menyu', callback_data: 'cmd_menu' }],
            ],
        };
        await telegramSendMessage(botToken, chatId, msg, kb);
        return;
    }
    if (data === 'cmd_cevir_today') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅 Hicri');
        const baku = getBakuNow();
        await cmdCevir(botToken, chatId, baku.dateStr);
        return;
    }

    // ── Yeni əmrlər: Qəza, Təqvim, Əsma, Cümə ──
    if (data === 'cmd_qeza') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🕌 Qəza');
        await cmdQeza(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_teqvim') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📅 Təqvim');
        await cmdTeqvim(botToken, chatId);
        return;
    }
    if (data === 'cmd_asma') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿 Əsma');
        await cmdAsma(botToken, chatId);
        return;
    }
    if (data === 'cmd_asma_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📿 Başqa ad');
        await cmdAsma(botToken, chatId);
        return;
    }
    if (data.startsWith('asma_list_')) {
        const page = parseInt(data.replace('asma_list_', ''), 10);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `📋 Səhifə ${page}`);
        await cmdAsmaList(botToken, chatId, page);
        return;
    }
    if (data === 'cmd_cume' || data === 'cmd_cume_random') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '✨ Cümə');
        await cmdCume(botToken, chatId);
        return;
    }

    // ── Qəza namazı düymələri ──
    if (data.startsWith('qeza_add_')) {
        const prayerId = data.replace('qeza_add_', '');
        const missed = await getMissedPrayers(chatId, env);
        missed[prayerId] = (missed[prayerId] || 0) + 1;
        await saveMissedPrayers(chatId, missed, env);
        const prayerItem = QEZA_PRAYERS.find(p => p.id === prayerId);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `➕ ${prayerItem ? prayerItem.name : prayerId}: ${missed[prayerId]}`);
        let total = 0;
        for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }
        let msg = `🕌 <b>Qəza Namazı Hesablayıcısı</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Qılmadığınız namazların sayını izləyin.\n`;
        msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
        msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
        msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(missed));
        return;
    }
    if (data.startsWith('qeza_sub_')) {
        const prayerId = data.replace('qeza_sub_', '');
        const missed = await getMissedPrayers(chatId, env);
        if ((missed[prayerId] || 0) > 0) {
            missed[prayerId] = missed[prayerId] - 1;
            await saveMissedPrayers(chatId, missed, env);
        }
        const prayerItem = QEZA_PRAYERS.find(p => p.id === prayerId);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `➖ ${prayerItem ? prayerItem.name : prayerId}: ${missed[prayerId]}`);
        let total = 0;
        for (const p of QEZA_PRAYERS) { total += missed[p.id] || 0; }
        let msg = `🕌 <b>Qəza Namazı Hesablayıcısı</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Qılmadığınız namazların sayını izləyin.\n`;
        msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
        msg += `📊 Ümumi qəza borcu: <b>${total}</b> namaz\n\n`;
        msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(missed));
        return;
    }
    if (data === 'qeza_reset') {
        const defaults = {};
        for (const p of QEZA_PRAYERS) { defaults[p.id] = 0; }
        await saveMissedPrayers(chatId, defaults, env);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🔄 Sıfırlandı!');
        let msg = `🕌 <b>Qəza Namazı Hesablayıcısı</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Qılmadığınız namazların sayını izləyin.\n`;
        msg += `➕ ilə artırın, ➖ ilə azaldın.\n\n`;
        msg += `📊 Ümumi qəza borcu: <b>0</b> namaz\n\n`;
        msg += `💡 <i>Hər qəza namazı qıldıqda ➖ basın.</i>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getQezaKeyboard(defaults));
        return;
    }
    if (data === 'noop') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        return;
    }

    // ── Zikr sayğac düymələri ──
    if (data.startsWith('zikr_plus_')) {
        const zikrId = data.replace('zikr_plus_', '');
        const key = `zikr:${chatId}`;
        const counts = await env.NOTIFICATIONS_KV.get(key, 'json') || {};
        counts[zikrId] = (counts[zikrId] || 0) + 1;
        await env.NOTIFICATIONS_KV.put(key, JSON.stringify(counts));
        const item = ZIKR_ITEMS.find(z => z.id === zikrId);
        const label = item ? item.name : zikrId;
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `${label}: ${counts[zikrId]}`);
        // Mesajı yenilə
        let totalCount = 0;
        for (const zi of ZIKR_ITEMS) { totalCount += counts[zi.id] || 0; }
        let msg = `📿 <b>Rəqəmsal Təsbeh</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
        msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;
        msg += `🔢 Ümumi zikr sayı: <b>${totalCount}</b>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getZikrKeyboard(counts));
        return;
    }
    if (data.startsWith('zikr_info_')) {
        const zikrId = data.replace('zikr_info_', '');
        const item = ZIKR_ITEMS.find(z => z.id === zikrId);
        if (item) {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `${item.label} — ${item.name}`);
        } else {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        }
        return;
    }
    if (data === 'zikr_reset') {
        const key = `zikr:${chatId}`;
        await env.NOTIFICATIONS_KV.put(key, JSON.stringify({}));
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🔄 Sıfırlandı!');
        let msg = `📿 <b>Rəqəmsal Təsbeh</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `Aşağıdakı düymələrə basaraq zikr edin.\n`;
        msg += `Hər zikrin hədəfinə çatdıqda ✅ görünəcək.\n\n`;
        msg += `🔢 Ümumi zikr sayı: <b>0</b>`;
        await telegramEditMessage(botToken, chatId, messageId, msg, getZikrKeyboard({}));
        return;
    }

    // ── Ayarlar toggle ──
    if (data === 'noop') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        return;
    }

    if (data === 'set_notifications_off') {
        const settings = await getSettings(chatId, env);
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

        let msg = `⚙️ <b>Bildiriş Ayarları</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `🔕 Bütün bildirişlər bağlandı!\n\n`;
        msg += `Bildirişləri fərdiləşdirmək üçün\naşağıdakı düymələrə basın:\n\n`;
        msg += `✅ = Aktiv  |  ❌ = Deaktiv`;

        await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings));
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🔕 Bütün bildirişlər bağlandı!');
        return;
    }

    if (data.startsWith('set_')) {
        const settings = await getSettings(chatId, env);
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
            if (settings.hasOwnProperty(settingName)) {
                settings[settingName] = !settings[settingName];
                changed = true;
            }
        }

        if (changed) {
            await saveSettings(chatId, settings, env);

            let msg = `⚙️ <b>Bildiriş Ayarları</b>\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `Bildirişləri fərdiləşdirmək üçün\naşağıdakı düymələrə basın:\n\n`;
            msg += `✅ = Aktiv  |  ❌ = Deaktiv`;

            await telegramEditMessage(botToken, chatId, messageId, msg, getSettingsKeyboard(settings));
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '✅ Yeniləndi!');
        } else {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id);
        }
        return;
    }

    // ── Ramazan əmrləri ──
    if (data === 'cmd_ramazan') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🌙 Ramazan');
        await cmdRamazan(botToken, chatId, env, 1);
        return;
    }
    if (data === 'cmd_stats') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '📊 Statistika');
        await cmdRamazanStats(botToken, chatId, env);
        return;
    }
    if (data === 'cmd_dua') {
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '🤲 Dua');
        await cmdDua(botToken, chatId);
        return;
    }

    // ── Ramazan səhifə naviqasiyası ──
    if (data.startsWith('ramazan_page_')) {
        const page = parseInt(data.replace('ramazan_page_', ''), 10);
        await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `📄 Səhifə ${page}`);
        await cmdRamazan(botToken, chatId, env, page);
        return;
    }

    // ── Oruc statusu düymələri ──
    if (data.startsWith('fast_')) {
        const baku = getBakuNow();
        const year = baku.year;
        const parts = data.split('_');
        const action = parts[1]; // yes, no, undo
        const dayNum = parseInt(parts[2], 10);

        if (!canMarkFasting(dayNum, year)) {
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, '⚠️ Bu gün üçün qeyd edilə bilməz!');
            return;
        }

        const fastingStatus = await getFastingStatus(chatId, year, env);

        if (action === 'yes') {
            fastingStatus[dayNum] = true;
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `✅ ${dayNum}-ci gün: Oruc tutuldu!`);
        } else if (action === 'no') {
            fastingStatus[dayNum] = false;
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `❌ ${dayNum}-ci gün: Oruc tutulmadı`);
        } else if (action === 'undo') {
            delete fastingStatus[dayNum];
            await saveFastingStatus(chatId, year, fastingStatus, env);
            await telegramAnswerCallbackQuery(botToken, callbackQuery.id, `🔄 ${dayNum}-ci gün: Qeyd ləğv edildi`);
        }

        // TODO: Mesajı yeniləmək üçün burada editMessage istifadə edilə bilər
        // Hazırda sadəcə yeni Ramazan təqvimi göndərilir
        // Hansı səhifədə dayNum var tapaq
        const pageNum = Math.ceil(dayNum / 10);
        await cmdRamazan(botToken, chatId, env, pageNum);
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

    // ── /vaxtlar ──
    if (text.startsWith('/vaxtlar') || text.startsWith('/bugün') || text.startsWith('/bugun') || text.startsWith('/today') || text.startsWith('/namaz')) {
        await cmdVaxtlar(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /sabah ──
    if (text.startsWith('/sabah') || text.startsWith('/tomorrow')) {
        await cmdSabah(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /heftelik ──
    if (text.startsWith('/heftelik') || text.startsWith('/həftəlik') || text.startsWith('/weekly') || text.startsWith('/heftə')) {
        await cmdHeftelik(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /tarix ──
    if (text.startsWith('/tarix') || text.startsWith('/date')) {
        const dateText = text.replace(/^\/(tarix|date)\s*/, '').trim();
        if (!dateText) {
            let reply = `ℹ️ <b>Tarix əmri istifadəsi:</b>\n\n`;
            reply += `/tarix 25.03.2026\n`;
            reply += `/tarix 25.03\n`;
            reply += `/tarix 25 mart\n`;
            reply += `/tarix 25 mart 2026`;
            await telegramSendMessage(botToken, chatId, reply, getBackKeyboard());
        } else {
            await cmdTarix(botToken, chatId, dateText, env);
        }
        return new Response('OK', { status: 200 });
    }

    // ── /ay ──
    if (text.startsWith('/ayliq') || text.startsWith('/aylıq') || text.startsWith('/monthly')) {
        const argText = text.replace(/^\/(ayliq|ayl\u0131q|monthly)\s*/, '').trim();
        await cmdAy(botToken, chatId, argText, env);
        return new Response('OK', { status: 200 });
    }
    if (text.startsWith('/ay')) {
        const argText = text.replace(/^\/ay\s*/, '').trim();
        await cmdAy(botToken, chatId, argText, env);
        return new Response('OK', { status: 200 });
    }

    // /qible silindi — artıq dəstəklənmir

    // ── /help ──
    if (text.startsWith('/help') || text.startsWith('/komek') || text.startsWith('/kömək')) {
        await cmdHelp(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /ayarlar ──
    if (text.startsWith('/ayarlar') || text.startsWith('/settings')) {
        await cmdAyarlar(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /ramazan ──
    if (text.startsWith('/ramazan') || text.startsWith('/ramadan') || text.startsWith('/oruc')) {
        await cmdRamazan(botToken, chatId, env, 1);
        return new Response('OK', { status: 200 });
    }

    // ── /statistika ──
    if (text.startsWith('/statistika') || text.startsWith('/stats')) {
        await cmdRamazanStats(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /dua ──
    if (text.startsWith('/dua')) {
        await cmdDua(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /cevir ──
    if (text.startsWith('/cevir') || text.startsWith('/çevir') || text.startsWith('/hicri')) {
        const dateText = text.replace(/^\/(cevir|\u00e7evir|hicri)\s*/, '').trim();
        if (!dateText) {
            const baku = getBakuNow();
            await cmdCevir(botToken, chatId, baku.dateStr);
        } else {
            await cmdCevir(botToken, chatId, dateText);
        }
        return new Response('OK', { status: 200 });
    }

    // ── /hedis ──
    if (text.startsWith('/hedis') || text.startsWith('/hadis')) {
        await cmdHedis(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /zikr | /tesbeh ──
    if (text.startsWith('/zikr') || text.startsWith('/tesbeh') || text.startsWith('/təsbeh')) {
        await cmdZikr(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /qeza ──
    if (text.startsWith('/qeza') || text.startsWith('/qəza')) {
        await cmdQeza(botToken, chatId, env);
        return new Response('OK', { status: 200 });
    }

    // ── /teqvim ──
    if (text.startsWith('/teqvim') || text.startsWith('/təqvim') || text.startsWith('/calendar')) {
        await cmdTeqvim(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /asma ──
    if (text.startsWith('/asma') || text.startsWith('/esma') || text.startsWith('/husna') || text.startsWith('/99')) {
        await cmdAsma(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /cume ──
    if (text.startsWith('/cume') || text.startsWith('/cümə') || text.startsWith('/friday') || text.startsWith('/juma')) {
        await cmdCume(botToken, chatId);
        return new Response('OK', { status: 200 });
    }

    // ── /broadcast (admin) ──
    if (text.startsWith('/broadcast')) {
        const messageText = text.replace(/^\/broadcast\s*/, '').trim();
        await cmdBroadcast(botToken, chatId, messageText, env);
        return new Response('OK', { status: 200 });
    }

    // Tanınmayan əmr
    return new Response('OK', { status: 200 });
}

// ═══════════════════════════════════════════════════════════════
//  SCHEDULED HANDLER (Cron — Hər Dəqiqə)
// ═══════════════════════════════════════════════════════════════

async function handleScheduled(env) {
    const botToken = env.BOT_TOKEN;
    const chatId = env.ALLOWED_CHAT_ID;

    const baku = getBakuNow();
    const currentMinutes = baku.hours * 60 + baku.minutes;
    const isRam = isRamadan(baku.year, baku.month, baku.day);

    // Chat ayarlarını oxu
    const settings = await getSettings(chatId, env);

    // ── Hər gün 05:00 — bugünkü vaxtları avtomatik göndər ──
    if (settings.morningSchedule && baku.hours === 5 && baku.minutes === 0) {
        const morningKey = `sent:${baku.isoDate}:morning_schedule:0`;
        const alreadySent = await env.NOTIFICATIONS_KV.get(morningKey);
        if (!alreadySent) {
            const dayData = await getDayData(baku.year, baku.month, baku.day, env);
            if (dayData) {
                let title = '🌄 Sabahınız xeyir! Bugünkü Namaz Vaxtları';
                if (isRam) {
                    const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                    const isQadr = QADR_NIGHTS.includes(ramDay);
                    title = `🌙 Ramazan Mübarək! (${ramDay}-ci gün)\n🌄 Bugünkü Namaz Vaxtları`;
                    if (isQadr) {
                        title += `\n⭐ Bu gecə Qadr gecəsi ola bilər!`;
                    }
                }

                const ramadanInfo = isRam ? { dayNumber: getRamadanDayNumber(baku.year, baku.month, baku.day) } : null;
                let msg = formatPrayerTimesMessage(dayData, baku.dateStr, currentMinutes, title, ramadanInfo);

                // Günün hədisini əlavə et
                if (isRam) {
                    const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                    const quoteIndex = ramDay > 0 && ramDay <= 30 ? ramDay - 1 : 0;
                    msg += `\n\n📿 ${RAMADAN_DAILY_QUOTES[quoteIndex]}`;
                    msg += `\n💬 ${MOTIVASIYA_MESAJLARI[quoteIndex]}`;
                }

                await telegramSendMessage(botToken, chatId, msg);
                await env.NOTIFICATIONS_KV.put(morningKey, '1', { expirationTtl: 86400 });
                console.log(`✅ Səhər cədvəli göndərildi: ${baku.isoDate}`);
            }
        }
    }

    // ── Namaz vaxtı bildirişləri ──
    const dayData = await getDayData(baku.year, baku.month, baku.day, env);
    if (!dayData) {
        console.log(`Data tapılmadı: ${baku.monthKey}, gün ${baku.day}`);
        return;
    }

    for (const prayer of NOTIFY_PRAYERS) {
        // Bu namaz üçün ayar aktiv deyilsə, keç
        if (!settings.prayers[prayer]) continue;

        const prayerTimeStr = dayData[prayer];
        if (!prayerTimeStr) continue;

        const prayerMinutes = timeToMinutes(prayerTimeStr, false);
        const diff = prayerMinutes - currentMinutes;

        // ── Ramazan: İftara (Məğrib) 30 dəq qalmış xüsusi xəbərdarlıq ──
        if (isRam && prayer === 'meqrib' && diff === 30) {
            const kvKey = `sent:${baku.isoDate}:iftar_30:0`;
            const alreadySent = await env.NOTIFICATIONS_KV.get(kvKey);
            if (!alreadySent) {
                const msg = `🌙 <b>İftara 30 dəqiqə qalıb!</b>\n\n🕐 İftar vaxtı: ${prayerTimeStr}\n📍 Bakı\n\n🤲 Allahım, orucumuzu qəbul et!`;
                await telegramSendMessage(botToken, chatId, msg);
                await env.NOTIFICATIONS_KV.put(kvKey, '1', { expirationTtl: 86400 });
                console.log(`✅ İftar 30dəq xəbərdarlığı göndərildi`);
            }
        }

        // ── Xəbərdarlıq mesajları (15, 10, 5 dəqiqə qabaq) ──
        for (const reminderMin of REMINDER_MINUTES) {
            // Ayarlara uyğun yoxla
            const settingKey = `reminder${reminderMin}`;
            if (!settings[settingKey]) continue;

            if (diff === reminderMin) {
                const kvKey = `sent:${baku.isoDate}:${prayer}:${reminderMin}`;
                const alreadySent = await env.NOTIFICATIONS_KV.get(kvKey);
                if (!alreadySent) {
                    const emoji = reminderMin === 5 ? '🔴' : reminderMin === 10 ? '🟡' : '🟢';
                    let msg;

                    if (isRam && prayer === 'meqrib') {
                        msg = `${emoji} 🌙 <b>İftara ${reminderMin} dəqiqə</b> qalıb!\n\n🕐 İftar vaxtı: ${prayerTimeStr}\n📍 Bakı\n\n🤲 Az qaldı, səbr et!`;
                    } else if (isRam && prayer === 'imsak') {
                        msg = `${emoji} 🌙 <b>Səhərə (İmsak) ${reminderMin} dəqiqə</b> qalıb!\n\n🕐 İmsak vaxtı: ${prayerTimeStr}\n📍 Bakı\n\n🍽 Son yemək vaxtı yaxınlaşır!`;
                    } else {
                        msg = `${emoji} <b>${PRAYER_NAMES[prayer]}</b> vaxtına <b>${reminderMin} dəqiqə</b> qalıb!\n\n🕐 Vaxt: ${prayerTimeStr}`;
                    }

                    await telegramSendMessage(botToken, chatId, msg);
                    await env.NOTIFICATIONS_KV.put(kvKey, '1', { expirationTtl: 86400 });
                    console.log(`✅ Göndərildi: ${prayer} -${reminderMin}dəq (${baku.isoDate})`);
                }
            }
        }

        // ── Vaxt gəldi mesajı (fərq 0) ──
        if (diff === 0 && settings.reminderOnTime) {
            const kvKey = `sent:${baku.isoDate}:${prayer}:0`;
            const alreadySent = await env.NOTIFICATIONS_KV.get(kvKey);
            if (!alreadySent) {
                let msg;

                if (isRam && prayer === 'meqrib') {
                    const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
                    const motIdx = ramDay > 0 && ramDay <= 30 ? ramDay - 1 : 0;
                    msg = `🌙🎉 <b>İFTAR VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 Bakı\n\n🤲 Allahım orucumuzu, dualarımızı qəbul et!\nBismillah, buyurun!\n\n💬 ${MOTIVASIYA_MESAJLARI[motIdx]}`;
                } else if (isRam && prayer === 'imsak') {
                    msg = `🌙 <b>İMSAK VAXTIDIR!</b>\n\n🕐 ${prayerTimeStr}\n📍 Bakı\n\nOruc başlayır. Niyyət etməyi unutmayın!\n🤲 Allah qəbul etsin!`;
                } else {
                    msg = `🕌 <b>${PRAYER_NAMES[prayer]} vaxtıdır!</b>\n\n🕐 ${prayerTimeStr}\n📍 Bakı\n\n🤲 Allah qəbul etsin!`;
                }

                await telegramSendMessage(botToken, chatId, msg);
                await env.NOTIFICATIONS_KV.put(kvKey, '1', { expirationTtl: 86400 });
                console.log(`✅ Göndərildi: ${prayer} vaxtı gəldi! (${baku.isoDate})`);
            }
        }
    }

    // ── Ramazan: İftar + 30 dəq sonra oruc sualı ──
    if (isRam && dayData) {
        const iftarTimeStr = dayData.meqrib;
        const iftarMinutes = timeToMinutes(iftarTimeStr, false);
        const diff = currentMinutes - iftarMinutes;

        if (diff === 30) {
            const ramDay = getRamadanDayNumber(baku.year, baku.month, baku.day);
            const kvKey = `sent:${baku.isoDate}:fasting_prompt:0`;
            const alreadySent = await env.NOTIFICATIONS_KV.get(kvKey);
            if (!alreadySent) {
                // Oruc statusunu yoxla — hələ qeyd edilməyibsə soruş
                const fastingStatus = await getFastingStatus(chatId, baku.year, env);
                if (fastingStatus[ramDay] === undefined) {
                    const msg = `🌙 <b>Ramazanın ${ramDay}-ci günü</b>\n\nBugün oruc tutdunuzmu?`;
                    const kb = {
                        inline_keyboard: [
                            [
                                { text: '✅ Bəli, tutdum', callback_data: `fast_yes_${ramDay}` },
                                { text: '❌ Xeyr', callback_data: `fast_no_${ramDay}` },
                            ],
                        ],
                    };
                    await telegramSendMessage(botToken, chatId, msg, kb);
                    console.log(`✅ Oruc sualı göndərildi: Ramazan ${ramDay}-ci gün`);
                }
                await env.NOTIFICATIONS_KV.put(kvKey, '1', { expirationTtl: 86400 });
            }
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
let h='<table><tr><th>Ad</th><th>Username</th><th>ID</th><th>Qoşulub</th><th>Son aktivlik</th></tr>';
for(const u of d.users){
const name=(u.firstName||'')+(u.lastName?' '+u.lastName:'');
const uname=u.username?'<span class="username">@'+u.username+'</span>':'-';
const joined=u.joined?new Date(u.joined).toLocaleDateString('az'):'?';
const last=u.lastActive?timeAgo(u.lastActive):'?';
h+='<tr><td>'+name+'</td><td>'+uname+'</td><td>'+u.id+'</td><td>'+joined+'</td><td>'+last+'</td></tr>'}
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
        const users = [];
        let cursor = null;
        do {
            const result = await env.NOTIFICATIONS_KV.list({ prefix: 'user:', cursor, limit: 1000 });
            for (const key of result.keys) {
                if (key.name === 'users:count') continue;
                const id = key.name.replace('user:', '');
                const data = await env.NOTIFICATIONS_KV.get(key.name, 'json');
                if (data && typeof data === 'object') {
                    users.push({ id, ...data });
                } else {
                    users.push({ id, firstName: 'Naməlum', joined: data || '?', lastActive: null });
                }
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

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

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
        ctx.waitUntil(handleScheduled(env));
    },
};

