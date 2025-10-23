# 🎨 Tile Labeler

سیستم مدیریت و برچسب‌گذاری طرح‌های کاشی با Next.js و Prisma

## 🚀 نصب و راه‌اندازی

### 1. نصب وابستگی‌ها

```bash
npm install
```

### 2. تنظیم دیتابیس

پروژه از SQLite استفاده می‌کند و فایل `.env` قبلا تنظیم شده است.

```bash
# اجرای migrations
npx prisma migrate deploy

# یا push کردن schema
npx prisma db push

# ایجاد داده‌های اولیه
npm run db:seed
```

### 3. اجرای پروژه

```bash
npm run dev
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

## 📦 دستورات مفید

- `npm run dev` - اجرای سرور development
- `npm run build` - ساخت نسخه production
- `npm run start` - اجرای نسخه production
- `npm run db:seed` - ایجاد داده‌های اولیه
- `npm run db:studio` - باز کردن Prisma Studio برای مشاهده دیتابیس
- `npx prisma migrate dev` - ایجاد migration جدید
- `npx prisma generate` - generate کردن Prisma Client

## 🎯 ویژگی‌ها

### ✅ مدیریت لیبل‌ها
- ایجاد، ویرایش و حذف لیبل‌ها
- مدیریت مقادیر لیبل (فارسی و لاتین)
- دسته‌بندی طرح‌ها با لیبل‌های مختلف

### ✅ مدیریت طرح‌ها
- آپلود تصویر اصلی طرح
- آپلود چندین تصویر فیس
- انتخاب مقادیر لیبل برای هر طرح
- ذخیره‌سازی خودکار تصاویر در `public/images/designs`

### ✅ ساختار دیتابیس
- **Label**: لیبل‌های اصلی (رنگ، سایز، طرح و...)
- **LabelValue**: مقادیر هر لیبل
- **Design**: طرح‌های کاشی
- **DesignImage**: تصاویر فیس‌های هر طرح
- **DesignLabelValue**: رابطه بین طرح‌ها و مقادیر لیبل

## 🛠️ تکنولوژی‌ها

- **Framework**: Next.js 16
- **Database**: SQLite + Prisma ORM
- **UI**: TailwindCSS + DaisyUI
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Notifications**: React Hot Toast

## 📁 ساختار پروژه

```
├── app/
│   ├── api/          # API Routes
│   │   ├── designs/  # API طرح‌ها
│   │   └── labels/   # API لیبل‌ها
│   ├── lib/          # کتابخانه‌ها و utilities
│   ├── generated/    # Prisma Client (auto-generated)
│   ├── page.tsx      # صفحه اصلی
│   └── layout.tsx    # Layout کلی
├── components/       # کامپوننت‌های React
├── prisma/
│   ├── schema.prisma # Schema دیتابیس
│   ├── migrations/   # Migration files
│   ├── seed.js       # Seed script
│   └── dev.db        # فایل دیتابیس SQLite
└── public/
    ├── fonts/        # فونت‌های فارسی
    └── images/
        └── designs/  # تصاویر طرح‌ها (auto-generated)
```

## 🔧 عیب‌یابی

### خطای "Unable to open the database file"

اگر این خطا را دریافت کردید:

1. مطمئن شوید که فایل `.env` وجود دارد و محتوای آن:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. Prisma Client را دوباره generate کنید:
   ```bash
   npx prisma generate
   ```

3. سرور را Restart کنید

### خطای EPERM در Windows

اگر در هنگام `prisma generate` خطای EPERM دریافت کردید، سرور Next.js را متوقف کنید و دوباره تلاش کنید.

## 📝 نکات

- تصاویر طرح‌ها در `public/images/designs/{نام_طرح}/` ذخیره می‌شوند
- نام طرح‌ها باید یکتا باشند
- برای مشاهده و ویرایش دیتابیس از Prisma Studio استفاده کنید: `npm run db:studio`

## 👨‍💻 توسعه

برای ایجاد migration جدید پس از تغییر schema:

```bash
npx prisma migrate dev --name your_migration_name
```

## 📄 لایسنس

Private Project

