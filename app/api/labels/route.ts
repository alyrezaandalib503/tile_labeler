import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// CREATE
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Array of labels
        if (Array.isArray(body)) {
            const createdLabels = await Promise.all(
                body.map(async (label: { name: string; values: { faName: string; enName: string }[] }) =>
                    prisma.label.create({
                        data: {
                            name: label.name,
                            values: {
                                create: label.values.map((v) => ({
                                    faName: v.faName,
                                    enName: v.enName,
                                })),
                            },
                        },
                        include: { values: true },
                    })
                )
            );

            return NextResponse.json(createdLabels);
        }

        // Single label
        const { name, values } = body;
        const label = await prisma.label.create({
            data: {
                name,
                values: {
                    create: values.map((v: { faName: string; enName: string }) => ({
                        faName: v.faName,
                        enName: v.enName,
                    })),
                },
            },
            include: { values: true },
        });

        return NextResponse.json(label);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ذخیره داده‌ها" }, { status: 500 });
    }
}

// READ
export async function GET() {
    try {
        const labels = await prisma.label.findMany({
            select: {
                id: true,
                name: true,
                values: {
                    select: {
                        id: true,
                        faName: true,
                        enName: true,
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return NextResponse.json(labels);
    } catch (error) {
        console.error("Error fetching labels:", error);
        return NextResponse.json({ error: "خطا در دریافت داده‌ها" }, { status: 500 });
    }
}

// UPDATE
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, values } = body;

        const updatedLabel = await prisma.label.update({
            where: { id },
            data: {
                name,
                values: {
                    deleteMany: {},
                    create: values.map((v: { faName: string; enName: string }) => ({
                        faName: v.faName,
                        enName: v.enName,
                    })),
                },
            },
            include: { values: true },
        });

        return NextResponse.json(updatedLabel);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ویرایش داده‌ها" }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        await prisma.label.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Label deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در حذف داده‌ها" }, { status: 500 });
    }
}
