import path from "path";

// 🧩 تنظیمات مشترک برای فایل‌های طرح‌ها
export const DESIGNS_CONFIG = {
    // مسیر اصلی ذخیره‌سازی طرح‌ها (خارج از public برای امنیت بیشتر)
    BASE_DIR: path.join(process.cwd(), "uploads/designs"),
    
    // URL base برای دسترسی به فایل‌ها
    URL_BASE: "/uploads/designs",
    
    // پسوندهای مجاز برای تصاویر
    ALLOWED_IMAGE_EXTENSIONS: ["jpg", "jpeg", "png", "webp", "avif"],
    
    // MIME type mapping
    MIME_TO_EXT: {
        "image/jpeg": "jpg",
        "image/png": "png", 
        "image/webp": "webp",
        "image/avif": "avif",
    } as Record<string, string>,
} as const;

// 🧩 ابزار کمکی برای تعیین پسوند فایل بر اساس MIME type
export const getFileExtension = (mime: string): string => {
    return DESIGNS_CONFIG.MIME_TO_EXT[mime] || "jpg";
};

// 🧩 ابزار کمکی برای ساخت مسیر کامل فایل
export const getFilePath = (folderName: string, fileName: string): string => {
    return path.join(DESIGNS_CONFIG.BASE_DIR, folderName, fileName);
};

// 🧩 ابزار کمکی برای ساخت URL فایل
export const getFileUrl = (folderName: string, fileName: string): string => {
    return `${DESIGNS_CONFIG.URL_BASE}/${folderName}/${fileName}`;
};

// 🧩 ابزار کمکی برای ساخت نام فولدر
export const getFolderName = (name: string, size: string): string => {
    return `${name}_${size}`;
};
