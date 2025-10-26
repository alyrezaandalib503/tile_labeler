import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// CREATE
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Ensure body is always an array
        const labels = Array.isArray(body) ? body : [body];

        // Optional: filter out invalid labels
        const validLabels = labels.filter(
            (label) =>
                label.name && label.name.trim() &&
                Array.isArray(label.values) &&
                label.values.every((v : any) => v.faName && v.enName)
        );

        if (validLabels.length === 0) {
            return NextResponse.json({ error: "No valid labels provided" }, { status: 400 });
        }

        const createdLabels = await Promise.all(
            validLabels.map(async (label: { name: string; values: { faName: string; enName: string }[] }) =>
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
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error saving data" }, { status: 500 });
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

        // Get the old label data before updating
        const oldLabel = await prisma.label.findUnique({
            where: { id },
            include: { values: true },
        });

        if (!oldLabel) {
            return NextResponse.json({ error: "Label not found" }, { status: 404 });
        }

        // Update label name first
        await prisma.label.update({
            where: { id },
            data: { name }
        });

        // Update existing values and create new ones
        const existingValues = oldLabel.values;
        const newValues = values;

        // Update existing values by their position/index
        for (let i = 0; i < Math.min(existingValues.length, newValues.length); i++) {
            const existingValue = existingValues[i];
            const newValue = newValues[i];
            
            // Update the existing value with new data but keep the same ID
            await prisma.labelValue.update({
                where: { id: existingValue.id },
                data: {
                    faName: newValue.faName,
                    enName: newValue.enName
                }
            });
        }

        // Create new values if there are more new values than existing ones
        if (newValues.length > existingValues.length) {
            const newValuesToCreate = newValues.slice(existingValues.length);
            await prisma.labelValue.createMany({
                data: newValuesToCreate.map((v: any) => ({
                    labelId: id,
                    faName: v.faName,
                    enName: v.enName
                }))
            });
        }

        // Delete excess values if there are fewer new values than existing ones
        if (newValues.length < existingValues.length) {
            const valuesToDelete = existingValues.slice(newValues.length);
            await prisma.labelValue.deleteMany({
                where: {
                    id: { in: valuesToDelete.map((v: any) => v.id) }
                }
            });
        }

        // Get the updated label with all values
        const updatedLabel = await prisma.label.findUnique({
            where: { id },
            include: { values: true }
        });

        // Find and update designs that use this label
        await updateDesignsUsingLabel(oldLabel, updatedLabel);

        return NextResponse.json(updatedLabel);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ویرایش داده‌ها" }, { status: 500 });
    }
}

// Helper function to update designs that use the edited label
async function updateDesignsUsingLabel(oldLabel: any, newLabel: any) {
    try {
        // Find all designs that contain this label in their labelsJson
        const allDesigns = await prisma.design.findMany();
        const designs = allDesigns.filter(design => {
            const labelsJson = design.labelsJson as any[];
            return labelsJson.some((label: any) => label.name === oldLabel.name);
        });

        for (const design of designs) {
            const labelsJson = design.labelsJson as any[];
            
            // Find the label in the design's labelsJson
            const labelIndex = labelsJson.findIndex((label: any) => label.name === oldLabel.name);
            
            if (labelIndex !== -1) {
                // Get the old values that were selected in this design
                const oldSelectedValues = labelsJson[labelIndex].values || [];
                
                // Update only the values that were previously selected in this design
                const updatedValues = oldSelectedValues.map((oldValue: any) => {
                    // Find the corresponding new value by matching the old value's position/index
                    // We need to find which position this old value had in the original label
                    const oldLabelValueIndex = oldLabel.values.findIndex((ov: any) => 
                        ov.id === oldValue.id
                    );
                    
                    if (oldLabelValueIndex !== -1 && oldLabelValueIndex < newLabel.values.length) {
                        // Get the new value at the same position
                        const newValue = newLabel.values[oldLabelValueIndex];
                        return {
                            id: newValue.id,
                            faName: newValue.faName,
                            enName: newValue.enName
                        };
                    } else {
                        // If we can't find the corresponding new value, keep the old one
                        return {
                            id: oldValue.id,
                            faName: oldValue.faName,
                            enName: oldValue.enName
                        };
                    }
                }).filter(value => value); // Remove any undefined values

                // Update the label values in the design's labelsJson
                const updatedLabelsJson = [...labelsJson];
                updatedLabelsJson[labelIndex] = {
                    name: newLabel.name, // Update the label name
                    values: updatedValues
                };

                // Update the design in database
                await prisma.design.update({
                    where: { id: design.id },
                    data: { labelsJson: updatedLabelsJson }
                });

                // Update the metadata file
                await updateDesignMetadataFile(design, updatedLabelsJson);
            }
        }

        console.log(`✅ Updated ${designs.length} designs that used label "${oldLabel.name}"`);
    } catch (error) {
        console.error("Error updating designs:", error);
    }
}

// Helper function to update the metadata JSON file
async function updateDesignMetadataFile(design: any, updatedLabelsJson: any[]) {
    try {
        const path = require('path');
        const fs = require('fs');
        
        const folderName = `${design.name}_${design.size}`;
        const folderPath = path.join(process.cwd(), "public/images/designs", folderName);
        const metadataPath = path.join(folderPath, `${design.name}_${design.size}_metadata.json`);
        
        if (fs.existsSync(metadataPath)) {
            const metadata = {
                id: design.id,
                name: design.name,
                size: design.size,
                code: design.code,
                labels: updatedLabelsJson,
            };
            
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
            console.log(`✅ Updated metadata file: ${metadataPath}`);
        }
    } catch (error) {
        console.error("Error updating metadata file:", error);
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
