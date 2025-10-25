# 🚀 راهنمای نصب و راه‌اندازی

## 📋 پیش‌نیازها

قبل از نصب، مطمئن شوید این موارد را نصب دارید:

- **Node.js** نسخه 16.9.0 یا بالاتر
- **npm** (همراه با Node.js نصب می‌شود)
- **Git** (اختیاری)

## 📥 مرحله 1: دانلود پروژه

### روش 1: با Git
```bash
git clone <repository-url>
cd music-bot
```

### روش 2: دانلود مستقیم
1. فایل ZIP پروژه را دانلود کنید
2. Extract کنید
3. با CMD یا Terminal به پوشه پروژه بروید

## 📦 مرحله 2: نصب Dependencies

```bash
npm install
```

این دستور تمام کتابخانه‌های زیر را نصب می‌کند:
- `discord.js` - کتابخانه اصلی Discord
- `@discordjs/voice` - برای Voice Channels
- `play-dl` - برای پخش از YouTube و SoundCloud
- `opusscript` - برای Audio Encoding
- `sodium-native` - برای بهبود Performance
- `dotenv` - برای مدیریت Environment Variables
- `nodemon` - برای Development (Auto Restart)

## 🔑 مرحله 3: ساخت Discord Bot

### 1. رفتن به Discord Developer Portal
https://discord.com/developers/applications

### 2. ساخت Application جدید
- کلیک روی "New Application"
- یک نام انتخاب کنید (مثلاً "My Music Bot")
- Save کنید

### 3. ساخت Bot
- از منوی سمت چپ، "Bot" را انتخاب کنید
- کلیک روی "Add Bot"
- "Yes, do it!" را تایید کنید

### 4. گرفتن Token
- زیر قسمت "TOKEN" کلیک روی "Reset Token"
- Token را کپی کنید (⚠️ هرگز این Token را با کسی شریک نکنید!)

### 5. فعال کردن Intents
در قسمت "Privileged Gateway Intents":
- ✅ `PRESENCE INTENT`
- ✅ `SERVER MEMBERS INTENT`  
- ✅ `MESSAGE CONTENT INTENT`
- Save Changes

### 6. دعوت Bot به سرور
1. از منوی سمت چپ "OAuth2" > "URL Generator"
2. در **Scopes** انتخاب کنید:
   - ✅ `bot`
   - ✅ `applications.commands`
3. در **Bot Permissions** انتخاب کنید:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Connect`
   - ✅ `Speak`
   - ✅ `Use Voice Activity`
4. URL تولید شده را کپی کنید و در مرورگر باز کنید
5. سرور خود را انتخاب کنید و Authorize کنید

## 🔧 مرحله 4: تنظیمات (Configuration)

### 1. ساخت فایل `.env`
یک فایل با نام `.env` در ریشه پروژه بسازید:

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
SOUNDCLOUD_CLIENT_ID=YOUR_SOUNDCLOUD_CLIENT_ID
```

### 2. گرفتن SoundCloud Client ID (اختیاری اما توصیه می‌شود)

#### روش آسان:
1. به https://soundcloud.com بروید
2. F12 بزنید (Developer Tools)
3. به تب Network بروید
4. یک آهنگ پخش کنید
5. فیلتر روی "client_id" بگذارید
6. در URL ها دنبال پارامتر `client_id=...` بگردید
7. مقدار آن را کپی کنید

#### نکته:
اگر SoundCloud Client ID نگذارید، فقط YouTube کار می‌کند.

## 🎯 مرحله 5: Deploy کردن Commands

قبل از اجرای بات، باید Commands را به Discord ثبت کنید:

```bash
node deploy-commands.js
```

اگر موفقیت‌آمیز بود، پیام زیر را می‌بینید:
```
✅ Successfully reloaded application (/) commands.
```

## ▶️ مرحله 6: اجرای Bot

### برای Development (با Auto Restart):
```bash
npm start
```

### برای Production:
```bash
node index.js
```

اگر همه چیز درست باشد، پیام زیر را می‌بینید:
```
✅ Ready! Logged in as YourBotName#1234
💡Make By Reza
```

## ✅ تست Bot

1. در Discord به سرور خود بروید
2. به یک Voice Channel بپیوندید
3. دستور `/play test` را تایپ کنید
4. اگر بات به Voice Channel پیوست و شروع به پخش کرد، همه چیز کار می‌کند! 🎉

## 🐛 عیب‌یابی (Troubleshooting)

### مشکل: Bot به Voice Channel نمی‌پیوندد
**راه‌حل:**
- مطمئن شوید بات Permission های Connect و Speak دارد
- چک کنید که `opusscript` یا `sodium-native` نصب شده باشد

### مشکل: Commands نمایش داده نمی‌شوند
**راه‌حل:**
```bash
node deploy-commands.js
```
منتظر بمانید 5-10 دقیقه (Discord کمی طول می‌کشد تا Commands را sync کند)

### مشکل: خطای "Invalid Token"
**راه‌حل:**
- Token را دوباره از Discord Developer Portal کپی کنید
- مطمئن شوید در `.env` هیچ space یا کاراکتر اضافی نیست

### مشکل: SoundCloud کار نمی‌کند
**راه‌حل:**
- یک Client ID معتبر در `.env` قرار دهید
- یا فقط از YouTube استفاده کنید

### مشکل: خطای "Cannot find module"
**راه‌حل:**
```bash
npm install
```

## 📊 ساختار پروژه

```
music-bot/
├── commands/           # تمام دستورات Bot
│   ├── play.js
│   ├── pause.js
│   ├── volume.js
│   └── ...
├── music-player.js     # منطق اصلی پخش موسیقی
├── index.js           # فایل اصلی Bot
├── deploy-commands.js # ثبت Commands در Discord
├── package.json       # Dependencies
├── .env              # تنظیمات محرمانه
└── README.md         # مستندات
```

## 🔒 امنیت

⚠️ **مهم**: هرگز فایل `.env` را commit نکنید!

فایل `.gitignore` باید شامل این موارد باشد:
```
node_modules/
.env
*.log
```

## 🚀 Deploy در Production

### روش 1: VPS/Dedicated Server
```bash
# نصب PM2 برای مدیریت Process
npm install -g pm2

# اجرای Bot با PM2
pm2 start index.js --name music-bot

# Auto restart در صورت ریبوت سرور
pm2 startup
pm2 save
```

### روش 2: Heroku
1. `Procfile` بسازید:
```
worker: node index.js
```

2. Deploy کنید:
```bash
git push heroku main
```

### روش 3: Railway/Render
- پروژه را از GitHub import کنید
- Environment Variables را تنظیم کنید
- Deploy کنید

## 🆘 دریافت کمک

اگر مشکلی دارید:
1. [مستندات Discord.js](https://discord.js.org/)
2. [مستندات play-dl](https://github.com/play-dl/play-dl)
3. Issue در GitHub باز کنید

---

**موفق باشید! 🎉**
