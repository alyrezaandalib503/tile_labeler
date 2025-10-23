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
