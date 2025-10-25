# 🎵 Discord Music Bot - نسخه پیشرفته

یک ربات موسیقی قدرتمند و کامل برای Discord با پشتیبانی از YouTube و SoundCloud

## ✨ ویژگی‌های اصلی

- 🎵 پخش موسیقی از YouTube و SoundCloud
- 🎚️ کنترل صدا (Volume Control)
- 🔀 پخش تصادفی (Shuffle)
- 🔁 حالت تکرار (Loop: Song/Queue/Off)
- ✨ پخش خودکار (Autoplay) با هوش مصنوعی
- 🔍 جستجوی پیشرفته با انتخاب از نتایج
- 🎮 پنل کنترل تعاملی با دکمه‌ها
- 📋 مدیریت صف موسیقی
- ⏸️ Pause/Resume
- ⏭️ Skip/Stop
- 🗑️ حذف آهنگ خاص یا پاک کردن کل صف
- ⏱️ Timeout protection برای جلوگیری از hang
- 🎨 Embeds زیبا و رنگی
- 🌐 پشتیبانی کامل از زبان فارسی

---

## 🚀 نصب و راه‌اندازی سریع

### 1️⃣ نصب Dependencies
```bash
npm install
```

### 2️⃣ ساخت فایل `.env`
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
SOUNDCLOUD_CLIENT_ID=YOUR_SOUNDCLOUD_CLIENT_ID
```

### 3️⃣ Deploy کردن Commands
```bash
node deploy-commands.js
```

### 4️⃣ اجرای Bot
```bash
npm start
```

📚 **راهنمای کامل نصب**: [INSTALLATION.md](./INSTALLATION.md)

---

## 📝 لیست دستورات

| دستور | توضیح | مثال |
|---------|------|-------|
| `/play <query>` | پخش موسیقی | `/play Yusuf Payambar` |
| `/pause` | متوقف کردن موقت | - |
| `/resume` | ادامه پخش | - |
| `/skip` | رد کردن آهنگ | - |
| `/stop` | متوقف کردن کامل | - |
| `/volume <0-100>` | تنظیم صدا | `/volume 70` |
| `/shuffle` | پخش تصادفی | - |
| `/loop <mode>` | تکرار (off/song/queue) | `/loop song` |
| `/queue` | نمایش صف | - |
| `/nowplaying` | آهنگ در حال پخش | - |
| `/search <query>` | جستجو و انتخاب | `/search Persian music` |
| `/remove <pos>` | حذف از صف | `/remove 3` |
| `/clear` | پاک کردن صف | - |
| `/autoplay` | پخش خودکار | - |
| `/controls` | پنل کنترل | - |

📖 **راهنمای کامل دستورات**: [COMMANDS.md](./COMMANDS.md)

---

## 💻 تکنولوژی‌های استفاده شده

- **Node.js** - Runtime Environment
- **Discord.js v14** - کتابخانه Discord API
- **@discordjs/voice** - Voice Channel Support
- **play-dl** - YouTube & SoundCloud Streaming
- **opusscript** - Audio Encoding
- **dotenv** - Environment Variables

---

## 🎓 ساختار پروژه

```
music-bot/
├── commands/              # 📂 تمام دستورات
│   ├── play.js
│   ├── pause.js
│   ├── volume.js
│   ├── shuffle.js
│   ├── search.js
│   ├── controls.js
│   └── ...
├── music-player.js       # 🎵 منطق اصلی پخش
├── index.js             # 🚀 فایل اصلی
├── deploy-commands.js   # 📦 ثبت Commands
├── package.json         # 📋 Dependencies
├── .env                # 🔐 تنظیمات
└── README.md           # 📖 مستندات
```

---

## ✨ ویژگی‌های پیشرفته

### 🤖 Autoplay با هوش مصنوعی
- تشخیص نوع پلتفرم (YouTube/SoundCloud)
- پیدا کردن آهنگ‌های مرتبط
- پخش بی‌وقفه موسیقی

### 🔍 جستجوی پیشرفته
- نمایش 5 نتیجه برتر
- منوی انتخاب تعاملی
- پخش فوری بعد از انتخاب

### 🎮 پنل کنترل تعاملی
- دکمه‌های Pause, Resume, Skip, Stop
- به‌روزرسانی لحظه‌ای
- Auto-disable بعد از 5 دقیقه

### ⏱️ Error Handling هوشمند
- Timeout Protection (30s)
- Auto Skip در صورت خطا
- پیام‌های خطای واضح

---

## 👨‍💻 توسعه‌دهنده

**Make By Reza** 💚

---

## 📝 License

MIT License - استفاده آزاد برای پروژه‌های شخصی و تجاری

---

## ⭐ پشتیبانی

اگر این پروژه برایتان مفید بود، یک ستاره ⭐ به پروژه بدید و با دیگران به اشتراک بگذارید!

---

**موفق باشید! 🎉**