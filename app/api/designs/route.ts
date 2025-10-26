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

        const labelsJsonRaw = formData.get("labelsJson")?.toString();
        const labelsJson = labelsJsonRaw
            ? JSON.parse(labelsJsonRaw)
            : existing.labelsJson;

        const folderPath = path.join(BASE_DIR, `${name}_${size}`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        let mainImageUrl = existing.mainImage;

        if (mainImageFile instanceof File) {
            const ext = getExt(mainImageFile.type);
            const filename = `${name}_${size}_main.${ext}`;
            const filePath = path.join(folderPath, filename);
            fs.writeFileSync(filePath, Buffer.from(await mainImageFile.arrayBuffer()));
            mainImageUrl = `/images/designs/${name}_${size}/${filename}`;
        }

        const newImages: { index: number; url: string }[] = [];
        for (let i = 0; i < faceFiles.length; i++) {
            const f = faceFiles[i];
            const ext = getExt(f.type);
            const filename = `${name}_${size}_face_${i + 1}.${ext}`;
            fs.writeFileSync(path.join(folderPath, filename), Buffer.from(await f.arrayBuffer()));
            newImages.push({
                index: i + 1,
                url: `/images/designs/${name}_${size}/${filename}`,
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
                images: newImages.length
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

        const metadataPath = path.join(folderPath, `${name}_${size}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

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

