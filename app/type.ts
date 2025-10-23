// نوع مربوط به مقدار هر لیبل
export interface LabelValue {
    id?: number;
    faName: string;
    enName: string;
    labelId?: number;
}

// نوع مربوط به لیبل
export interface Label {
    id?: number;
    name: string;
    values: LabelValue[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DesignFace  {
    id: number;
    file: File;
    preview: string;
}

export interface DesignImage {
    id: number;
    designId: number;
    index: number;
    url: string;
}

export interface DesignLabelValue {
    id: number;
    designId: number;
    labelValueId: number;
    labelValue: {
        id: number;
        faName: string;
        enName: string;
        labelId: number;
    };
}

export interface Design {
    id?: number; // id اختیاری برای ساخت طرح جدید
    name: string;
    faceCount: number;
    mainImage: File | null; // ← تغییر داده شد
    images: { index: number; url: string }[];
    labels: DesignLabelValue[]; // لیبل‌های انتخاب شده
}
