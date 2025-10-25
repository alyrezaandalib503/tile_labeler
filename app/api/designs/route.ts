import fs from "fs";
import path from "path";
import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";

// GET all designs
export async function GET() {
    try {
        const designs = await prisma.design.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                mainImage: true,
                faceCount: true,
                images : {},
                labels: {
                    select: {
                        labelValue: {
                            select: {
                                id : true ,
                                faName: true,
                                enName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {createdAt: "desc"},
        });
        return NextResponse.json(designs);
    } catch (error) {
        return NextResponse.json({error: "Failed to fetch designs"}, {status: 500});
    }
}

// POST create a new design
export async function POST(req: Request) {
    try {
        console.log("=== POST /api/designs START ===");

        const formData = await req.formData();
        console.log("FormData received");

        const name = formData.get("name")?.toString();
        console.log("Name:", name);
        if (!name) return NextResponse.json({error: "Name is required"}, {status: 400});

        const mainImageFile = formData.get("mainImage");
        console.log("Main image:", mainImageFile instanceof File ? "File received" : "Not a file");
        if (!(mainImageFile instanceof File)) return NextResponse.json({error: "Main image is required"}, {status: 400});

        const faceFiles = formData.getAll("faces").filter(f => f instanceof File) as File[];
        const labelValueIds = formData.getAll("labelValueIds").map(id => Number(id));
        console.log("Creating design:", {name, faceCount: faceFiles.length, labelValueIds});

        // بررسی اینکه آیا طرحی با این نام قبلا وجود دارد
        console.log("Checking for existing design...");
        const existingDesign = await prisma.design.findUnique({where: {name}});
        if (existingDesign) {
            console.log("Design already exists");
            return NextResponse.json({error: `طرحی با نام "${name}" قبلا ثبت شده است`}, {status: 400});
        }
        console.log("No existing design found, proceeding...");

        // ساخت فولدر
        const folderPath = path.join(process.cwd(), "public/images/designs", name);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});

        // ذخیره تصویر اصلی
        const mainImagePath = path.join(folderPath, "main.png");
        const mainBuffer = Buffer.from(await mainImageFile.arrayBuffer());
        fs.writeFileSync(mainImagePath, mainBuffer);

        // ذخیره فیس‌ها
        const imageUrls: { index: number; url: string }[] = [];
        for (let i = 0; i < faceFiles.length; i++) {
            const faceFile = faceFiles[i];
            const facePath = path.join(folderPath, `face_${i + 1}.png`);
            const buffer = Buffer.from(await faceFile.arrayBuffer());
            fs.writeFileSync(facePath, buffer);
            imageUrls.push({index: i + 1, url: `/images/designs/${name}/face_${i + 1}.png`});
        }

        const design = await prisma.design.create({
            data: {
                name,
                faceCount: faceFiles.length,
                mainImage: `/images/designs/${name}/main.png`,
                images: {create: imageUrls},
                labels: {create: labelValueIds.map(id => ({labelValueId: id}))},
            },
            include: {images: true, labels: true},
        });

        console.log("Design created successfully:", design.id);
        return NextResponse.json(design);

    } catch (error: any) {
        console.error("POST /api/designs error:", error);
        console.error("Error stack:", error?.stack);

        // نمایش خطای دقیق‌تر برای دیباگ
        let errorMessage = "Failed to create design";
        let errorDetails = error?.message || String(error);

        // خطاهای رایج Prisma
        if (error?.code === 'P2002') {
            errorMessage = "نام طرح تکراری است";
            errorDetails = "لطفا نام دیگری انتخاب کنید";
        } else if (error?.code?.startsWith('P')) {
            errorMessage = "خطای دیتابیس";
        } else if (error?.message?.includes('PrismaClient')) {
            errorMessage = "خطای اتصال به دیتابیس";
            errorDetails = "لطفا مطمئن شوید که فایل .env موجود است و DATABASE_URL تنظیم شده است";
        }

        return NextResponse.json({
            error: errorMessage,
            details: errorDetails,
            code: error?.code
        }, {status: 500});
    }
}

// PUT update a design
export async function PUT(req: Request) {
    try {
        console.log("=== PUT /api/designs START ===");

        const formData = await req.formData();
        console.log("FormData received");

        const id = Number(formData.get("id"));
        const name = formData.get("name")?.toString();
        if (!id || !name) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        console.log("Updating design:", { id, name });

        const mainImageFile = formData.get("mainImage");
        const faceFiles = formData.getAll("faces").filter(f => f instanceof File) as File[];
        const labelValueIds = formData.getAll("labelValueIds").map(id => Number(id));

        const existingDesign = await prisma.design.findUnique({
            where: { id },
            include: { images: true, labels: true },
        });

        if (!existingDesign) {
            return NextResponse.json({ error: "Design not found" }, { status: 404 });
        }

        const oldFolderPath = path.join(process.cwd(), "public/images/designs", existingDesign.name);
        const newFolderPath = path.join(process.cwd(), "public/images/designs", name);

        if (existingDesign.name !== name) {
            if (fs.existsSync(oldFolderPath)) {
                fs.renameSync(oldFolderPath, newFolderPath);
            } else {
                fs.mkdirSync(newFolderPath, { recursive: true });
            }
        } else if (!fs.existsSync(newFolderPath)) {
            fs.mkdirSync(newFolderPath, { recursive: true });
        }

        let mainImagePath = existingDesign.mainImage;
        if (mainImageFile instanceof File) {
            const newMainPath = path.join(newFolderPath, "main.png");
            const buffer = Buffer.from(await mainImageFile.arrayBuffer());
            fs.writeFileSync(newMainPath, buffer);
            mainImagePath = `/images/designs/${name}/main.png`;
        }

        let imageUrls: { index: number; url: string }[] = [];
        if (faceFiles.length > 0) {
            existingDesign.images.forEach(img => {
                const imgPath = path.join(process.cwd(), "public", img.url);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });

            for (let i = 0; i < faceFiles.length; i++) {
                const faceFile = faceFiles[i];
                const facePath = path.join(newFolderPath, `face_${i + 1}.png`);
                const buffer = Buffer.from(await faceFile.arrayBuffer());
                fs.writeFileSync(facePath, buffer);
                imageUrls.push({ index: i + 1, url: `/images/designs/${name}/face_${i + 1}.png` });
            }
        } else {
            imageUrls = existingDesign.images.map((img, i) => ({
                index: i + 1,
                url: img.url,
            }));
        }

        const design = await prisma.design.update({
            where: { id },
            data: {
                name,
                mainImage: mainImagePath,
                faceCount: imageUrls.length,
                images: {
                    deleteMany: {},
                    create: imageUrls.map(img => ({
                        index: img.index,
                        url: img.url,
                    })),
                },
                labels: {
                    deleteMany: {},
                    create: labelValueIds.map(labelValueId => ({ labelValueId })),
                },
            },
            include: { images: true, labels: true },
        });

        console.log("Design updated successfully:", design.id);
        return NextResponse.json(design);

    } catch (error: any) {
        console.error("PUT /api/designs error:", error);
        return NextResponse.json({
            error: "Failed to update design",
            details: error?.message || String(error),
        }, { status: 500 });
    }
}

// DELETE a design
export async function DELETE(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const id = Number(searchParams.get("id"));

        await prisma.design.delete({where: {id}});

        return NextResponse.json({message: "Design deleted"});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to delete design"}, {status: 500});
    }
}
