const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // حذف داده‌های قبلی (اختیاری)
    await prisma.designLabelValue.deleteMany();
    await prisma.designImage.deleteMany();
    await prisma.design.deleteMany();
    await prisma.labelValue.deleteMany();
    await prisma.label.deleteMany();

    console.log('Cleared existing data');

    // ایجاد Label برای رنگ
    const colorLabel = await prisma.label.create({
        data: {
            name: 'رنگ',
            values: {
                create: [
                    { faName: 'قرمز', enName: 'red' },
                    { faName: 'آبی', enName: 'blue' },
                    { faName: 'سبز', enName: 'green' },
                    { faName: 'زرد', enName: 'yellow' },
                    { faName: 'مشکی', enName: 'black' },
                    { faName: 'سفید', enName: 'white' },
                ],
            },
        },
        include: { values: true },
    });

    console.log('✅ Created Color label with values:', colorLabel.values.length);

    // ایجاد Label برای سایز
    const sizeLabel = await prisma.label.create({
        data: {
            name: 'سایز',
            values: {
                create: [
                    { faName: 'کوچک', enName: 'small' },
                    { faName: 'متوسط', enName: 'medium' },
                    { faName: 'بزرگ', enName: 'large' },
                    { faName: 'خیلی بزرگ', enName: 'xlarge' },
                ],
            },
        },
        include: { values: true },
    });

    console.log('✅ Created Size label with values:', sizeLabel.values.length);

    // ایجاد Label برای طرح
    const patternLabel = await prisma.label.create({
        data: {
            name: 'طرح',
            values: {
                create: [
                    { faName: 'ساده', enName: 'plain' },
                    { faName: 'گلدار', enName: 'floral' },
                    { faName: 'هندسی', enName: 'geometric' },
                    { faName: 'مدرن', enName: 'modern' },
                    { faName: 'کلاسیک', enName: 'classic' },
                ],
            },
        },
        include: { values: true },
    });

    console.log('✅ Created Pattern label with values:', patternLabel.values.length);

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

