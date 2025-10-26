import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import fs from "fs";

// 🧩 ابزار کمکی برای تعیین پسوند فایل بر اساس MIME type
const getExt = (mime: string) => {
    const map: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
    };
    return map[mime] || "jpg";
};

// 🧩 مسیر پوشه ذخیره‌سازی طرح‌ها
const BASE_DIR = path.join(process.cwd(), "public/images/designs");

// ========================
// 🟢 GET — دریافت همه طرح‌ها
// ========================
export async function GET() {
    try {
        const designs = await prisma.design.findMany({
            include: { images: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(designs);
    } catch (error) {
        console.error("❌ GET /api/designs error:", error);
        return NextResponse.json(
            { error: "Failed to fetch designs" },
            { status: 500 }
        );
    }
}

// ========================
// 🟡 POST — ساخت طرح جدید
// ========================
export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const name = formData.get("name")?.toString();
        const code = formData.get("code")?.toString() || "";
        const size = formData.get("size")?.toString() || "";

        if (!name)
            return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const mainImageFile = formData.get("mainImage");
        if (!(mainImageFile instanceof File))
            return NextResponse.json(
                { error: "Main image is required" },
                { status: 400 }
            );

        const faceFiles = formData
            .getAll("faces")
            .filter((f) => f instanceof File) as File[];

        const labelsJsonRaw = formData.get("labelsJson")?.toString();
        const labelsJson = labelsJsonRaw ? JSON.parse(labelsJsonRaw) : [];

        const folderPath = path.join(BASE_DIR, `${name}_${size}`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const mainExt = getExt(mainImageFile.type);
        const mainFilename = `${name}_${size}_main.${mainExt}`;
        const mainPath = path.join(folderPath, mainFilename);
        fs.writeFileSync(mainPath, Buffer.from(await mainImageFile.arrayBuffer()));
        const mainImageUrl = `/images/designs/${name}_${size}/${mainFilename}`;

        const imageUrls: { index: number; url: string }[] = [];
        for (let i = 0; i < faceFiles.length; i++) {
            const f = faceFiles[i];
            const ext = getExt(f.type);
            const filename = `${name}_${size}_face_${i + 1}.${ext}`;
            fs.writeFileSync(path.join(folderPath, filename), Buffer.from(await f.arrayBuffer()));
            imageUrls.push({ index: i + 1, url: `/images/designs/${name}_${size}/${filename}` });
        }

        const design = await prisma.design.create({
            data: {
                name,
                code,
                size,
                faceCount: imageUrls.length,
                mainImage: mainImageUrl,
                labelsJson,
                images: { create: imageUrls },
            },
            include: { images: true },
        });

        // json
        const metadata = {
            id: design.id,
            name: design.name,
            size: design.size,
            code: design.code,
            labels: design.labelsJson || [],
        };

        const metadataPath = path.join(folderPath, `${name}_${size}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

        return NextResponse.json(design);
    } catch (error: any) {
        console.error("❌ POST /api/designs error:", error);
        return NextResponse.json(
            { error: "Failed to create design", details: error.message },
            { status: 500 }
        );
    }
}

// ========================
// 🟠 PUT — ویرایش طرح موجود
// ========================
export async function PUT(req: Request) {
    try {
        const formData = await req.formData();
        const id = Number(formData.get("id"));
        if (!id)
            return NextResponse.json({ error: "Design ID is required" }, { status: 400 });

        const existing = await prisma.design.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!existing)
            return NextResponse.json({ error: "Design not found" }, { status: 404 });

        const name = formData.get("name")?.toString() || existing.name;
        const code = formData.get("code")?.toString() || existing.code;
        const size = formData.get("size")?.toString() || existing.size;

        const mainImageFile = formData.get("mainImage");
        const faceFiles = formData
            .getAll("faces")
            .filter((f) => f instanceof File) as File[];
        const facesRemoved = formData.get("facesRemoved")?.toString() === "true";
        const facesPartiallyRemoved = formData.get("facesPartiallyRemoved")?.toString() === "true";
        const remainingFacesCount = Number(formData.get("remainingFacesCount")?.toString()) || 0;

        const labelsJsonRaw = formData.get("labelsJson")?.toString();
        const labelsJson = labelsJsonRaw
            ? JSON.parse(labelsJsonRaw)
            : existing.labelsJson;

        // بررسی آیا نام یا سایز تغییر کرده است
        const nameOrSizeChanged = name !== existing.name || size !== existing.size;
        const oldFolderPath = path.join(BASE_DIR, `${existing.name}_${existing.size}`);
        const newFolderPath = path.join(BASE_DIR, `${name}_${size}`);

        // ایجاد فولدر جدید
        if (!fs.existsSync(newFolderPath)) {
            fs.mkdirSync(newFolderPath, { recursive: true });
        }

        let mainImageUrl = existing.mainImage;

        // اگر نام یا سایز تغییر کرده، تصاویر موجود را کپی کن
        if (nameOrSizeChanged) {
            // کپی کردن تصویر اصلی
            if (existing.mainImage) {
                const oldMainImagePath = path.join(process.cwd(), "public", existing.mainImage);
                if (fs.existsSync(oldMainImagePath)) {
                    const ext = path.extname(existing.mainImage).substring(1) || 'jpg';
                    const newMainFilename = `${name}_${size}_main.${ext}`;
                    const newMainPath = path.join(newFolderPath, newMainFilename);
                    
                    try {
                        fs.copyFileSync(oldMainImagePath, newMainPath);
                        mainImageUrl = `/images/designs/${name}_${size}/${newMainFilename}`;
                        console.log(`📁 Main image copied to new folder: ${newMainPath}`);
                    } catch (fileErr) {
                        console.warn(`⚠️ Failed to copy main image:`, fileErr);
                    }
                }
            }

            // کپی کردن تصاویر فیس
            existing.images.forEach((img, index) => {
                const oldFaceImagePath = path.join(process.cwd(), "public", img.url);
                if (fs.existsSync(oldFaceImagePath)) {
                    const ext = path.extname(img.url).substring(1) || 'jpg';
                    const newFaceFilename = `${name}_${size}_face_${index + 1}.${ext}`;
                    const newFacePath = path.join(newFolderPath, newFaceFilename);
                    
                    try {
                        fs.copyFileSync(oldFaceImagePath, newFacePath);
                        console.log(`📁 Face image copied to new folder: ${newFacePath}`);
                    } catch (fileErr) {
                        console.warn(`⚠️ Failed to copy face image:`, fileErr);
                    }
                }
            });
        }

        // اگر تصویر اصلی جدید آپلود شده، تصویر قبلی را پاک کن و تصویر جدید را ذخیره کن
        if (mainImageFile instanceof File) {
            // پاک کردن تصویر اصلی قبلی (اگر در همان فولدر باشد)
            if (existing.mainImage && !nameOrSizeChanged) {
                const oldMainImagePath = path.join(process.cwd(), "public", existing.mainImage);
                if (fs.existsSync(oldMainImagePath)) {
                    try {
                        fs.unlinkSync(oldMainImagePath);
                        console.log(`🗑️ Old main image deleted: ${oldMainImagePath}`);
                    } catch (fileErr) {
                        console.warn(`⚠️ Failed to delete old main image ${oldMainImagePath}:`, fileErr);
                    }
                }
            }

            const ext = getExt(mainImageFile.type);
            const filename = `${name}_${size}_main.${ext}`;
            const filePath = path.join(newFolderPath, filename);
            fs.writeFileSync(filePath, Buffer.from(await mainImageFile.arrayBuffer()));
            mainImageUrl = `/images/designs/${name}_${size}/${filename}`;
        }

        // مدیریت تصاویر فیس
        const newImages: { index: number; url: string }[] = [];
        
        // اگر همه تصاویر حذف شده‌اند
        if (facesRemoved) {
            // پاک کردن تصاویر فیس قبلی (فقط اگر در همان فولدر باشند)
            if (!nameOrSizeChanged) {
                existing.images.forEach((img) => {
                    const oldFaceImagePath = path.join(process.cwd(), "public", img.url);
                    if (fs.existsSync(oldFaceImagePath)) {
                        try {
                            fs.unlinkSync(oldFaceImagePath);
                            console.log(`🗑️ Old face image deleted: ${oldFaceImagePath}`);
                        } catch (fileErr) {
                            console.warn(`⚠️ Failed to delete old face image ${oldFaceImagePath}:`, fileErr);
                        }
                    }
                });
            }
            // newImages خالی می‌ماند (همه تصاویر حذف شده‌اند)
        }
        // اگر فقط برخی تصاویر حذف شده‌اند (حذف جزئی)
        else if (facesPartiallyRemoved) {
            // ابتدا تصاویر موجود را نگه دار (فقط تعداد مشخص شده)
            if (!nameOrSizeChanged) {
                // نگه داشتن فقط تعداد مشخص شده از تصاویر موجود
                const imagesToKeep = existing.images.slice(0, remainingFacesCount);
                imagesToKeep.forEach((img) => {
                    newImages.push({
                        index: img.index,
                        url: img.url,
                    });
                });
                
                // پاک کردن تصاویر اضافی
                const imagesToDelete = existing.images.slice(remainingFacesCount);
                imagesToDelete.forEach((img) => {
                    const oldFaceImagePath = path.join(process.cwd(), "public", img.url);
                    if (fs.existsSync(oldFaceImagePath)) {
                        try {
                            fs.unlinkSync(oldFaceImagePath);
                            console.log(`🗑️ Old face image deleted: ${oldFaceImagePath}`);
                        } catch (fileErr) {
                            console.warn(`⚠️ Failed to delete old face image ${oldFaceImagePath}:`, fileErr);
                        }
                    }
                });
            } else {
                // اگر نام یا سایز تغییر کرده، فقط تعداد مشخص شده را کپی کن
                const imagesToKeep = existing.images.slice(0, remainingFacesCount);
                imagesToKeep.forEach((img, index) => {
                    const ext = path.extname(img.url).substring(1) || 'jpg';
                    const newFaceFilename = `${name}_${size}_face_${index + 1}.${ext}`;
                    newImages.push({
                        index: index + 1,
                        url: `/images/designs/${name}_${size}/${newFaceFilename}`,
                    });
                });
            }

            // سپس تصاویر جدید را اضافه کن (اگر وجود دارند)
            if (faceFiles.length > 0) {
                const startIndex = newImages.length + 1;
                for (let i = 0; i < faceFiles.length; i++) {
                    const f = faceFiles[i];
                    const ext = getExt(f.type);
                    const filename = `${name}_${size}_face_${startIndex + i}.${ext}`;
                    fs.writeFileSync(path.join(newFolderPath, filename), Buffer.from(await f.arrayBuffer()));
                    newImages.push({
                        index: startIndex + i,
                        url: `/images/designs/${name}_${size}/${filename}`,
                    });
                }
            }
        }
        // اگر تصاویر فیس جدید آپلود شده‌اند (بدون حذف)
        else if (faceFiles.length > 0) {
            // ابتدا تصاویر موجود را نگه دار (اگر نام یا سایز تغییر نکرده)
            if (!nameOrSizeChanged) {
                existing.images.forEach((img) => {
                    newImages.push({
                        index: img.index,
                        url: img.url,
                    });
                });
            } else {
                // اگر نام یا سایز تغییر کرده، تصاویر کپی شده را اضافه کن
                existing.images.forEach((img, index) => {
                    const ext = path.extname(img.url).substring(1) || 'jpg';
                    const newFaceFilename = `${name}_${size}_face_${index + 1}.${ext}`;
                    newImages.push({
                        index: index + 1,
                        url: `/images/designs/${name}_${size}/${newFaceFilename}`,
                    });
                });
            }

            // سپس تصاویر جدید را اضافه کن
            const startIndex = newImages.length + 1;
            for (let i = 0; i < faceFiles.length; i++) {
                const f = faceFiles[i];
                const ext = getExt(f.type);
                const filename = `${name}_${size}_face_${startIndex + i}.${ext}`;
                fs.writeFileSync(path.join(newFolderPath, filename), Buffer.from(await f.arrayBuffer()));
                newImages.push({
                    index: startIndex + i,
                    url: `/images/designs/${name}_${size}/${filename}`,
                });
            }
        }
        // اگر فقط نام یا سایز تغییر کرده و تصاویر فیس جدیدی آپلود نشده
        else if (nameOrSizeChanged) {
            // تصاویر کپی شده در فولدر جدید موجود هستند، فقط مسیرها را به‌روزرسانی کن
            existing.images.forEach((img, index) => {
                const ext = path.extname(img.url).substring(1) || 'jpg';
                const newFaceFilename = `${name}_${size}_face_${index + 1}.${ext}`;
                newImages.push({
                    index: index + 1,
                    url: `/images/designs/${name}_${size}/${newFaceFilename}`,
                });
            });
        }
        // اگر هیچ تغییری در تصاویر فیس نبوده
        else {
            // تصاویر موجود را نگه دار
            existing.images.forEach((img) => {
                newImages.push({
                    index: img.index,
                    url: img.url,
                });
            });
        }

        const updated = await prisma.design.update({
            where: { id },
            data: {
                name,
                code,
                size,
                mainImage: mainImageUrl,
                labelsJson,
                faceCount: facesRemoved ? 0 : newImages.length,
                images: (faceFiles.length > 0 || facesRemoved || facesPartiallyRemoved || nameOrSizeChanged)
                    ? {
                        deleteMany: { designId: id },
                        create: newImages,
                    }
                    : undefined,
            },
            include: { images: true },
        });

        const metadata = {
            id: updated.id,
            name: updated.name,
            size: updated.size,
            code: updated.code,
            labels: updated.labelsJson || [],
        };

        const metadataPath = path.join(newFolderPath, `${name}_${size}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

        // در انتها فولدر قدیمی را پاک کن (اگر نام یا سایز تغییر کرده باشد)
        if (nameOrSizeChanged && fs.existsSync(oldFolderPath)) {
            try {
                // @ts-ignore
                await fs.rm(oldFolderPath, { recursive: true, force: true });
                console.log(`🗑️ Old folder deleted: ${oldFolderPath}`);
            } catch (fileErr) {
                console.warn(`⚠️ Failed to delete old folder ${oldFolderPath}:`, fileErr);
            }
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("❌ PUT /api/designs error:", error);
        return NextResponse.json(
            { error: "Failed to update design", details: error.message },
            { status: 500 }
        );
    }
}

// ========================
// 🔴 DELETE — حذف طرح
// ========================
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = Number(searchParams.get("id"));

        if (!id) {
            return NextResponse.json({ error: "Design ID is required" }, { status: 400 });
        }

        const design = await prisma.design.findUnique({ where: { id } });
        if (!design) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        const folderName = `${design.name}_${design.size}`;
        const folderPath = path.join(BASE_DIR, folderName);

        await prisma.design.delete({ where: { id } });

        try {
            // @ts-ignore
            await fs.rm(folderPath, { recursive: true, force: true });
            console.log(`🗑️ Folder deleted: ${folderPath}`);
        } catch (fileErr) {
            console.warn(`⚠️ Failed to delete folder ${folderPath}:`, fileErr);
        }

        return NextResponse.json({ message: "✅ Design deleted successfully" });
    } catch (error: any) {
        console.error("❌ DELETE /api/designs error:", error);
        return NextResponse.json(
            { error: "Failed to delete design", details: error.message },
            { status: 500 }
        );
    }
}

