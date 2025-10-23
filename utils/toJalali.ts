export const toJalali = (date: string | Date) =>
    new Intl.DateTimeFormat('fa-IR').format(new Date(date))


