"use client";

import {ChangeEvent, useState} from "react";
import Header from "@/components/layout/header/header";
import {toast} from "react-hot-toast";
// icons
import {FaTrash, FaUpload, FaImage} from "react-icons/fa";
import {CiEdit} from "react-icons/ci";
import {IoCloseOutline} from "react-icons/io5";

// types
import type {Label, DesignFace} from "@/app/type";

// services
import {useService} from "@/app/service";
import {toJalali} from "@/utils/toJalali";

export default function Home() {
    const {getLabels, deleteLabel, updateLabel, deleteDesign, getDesigns, upsertDesign} = useService();
    const {data: LabelsData, isLoading: LabelsIsLoading, isError: LabelsIsError, refetch: LabelsRefetch} = getLabels;
    const {data: DesignData, isLoading: DesignIsLoading, isError: DesignIsError, refetch: DesignRefetch} = getDesigns;

    // Label editing & deletion
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // New Design state
    const [designName, setDesignName] = useState("");
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainPreview, setMainPreview] = useState<string | null>(null);
    const [faces, setFaces] = useState<DesignFace[]>([]);
    const [selectedLabelValueIds, setSelectedLabelValueIds] = useState<number[]>([]);
    // --- برای حذف و ویرایش طرح ---
    const [editingDesign, setEditingDesign] = useState<any | null>(null);
    const [deleteDesignId, setDeleteDesignId] = useState<number | null>(null);

    // ---------- Handlers ----------

    // Label edit
    const handleSaveLabel = (label: Label) => {
        const cleanedValues = label.values.filter(
            (v) => v.faName.trim() || v.enName.trim()
        );
        updateLabel.mutate(
            {...label, values: cleanedValues},
            {
                onSuccess: () => {
                    LabelsRefetch();
                    setEditingLabel(null);
                }
            }
        );
    };

    // Label delete
    const handleDeleteLabel = (id: number) => {
        deleteLabel.mutate(id, {
            onSuccess: () => {
                LabelsRefetch();
                setDeleteConfirmId(null);
            },
        });
    };

    const handleMainImage = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setMainImage(file);
        setMainPreview(URL.createObjectURL(file));
    };

    const handleFaceImages = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFaces: DesignFace[] = Array.from(e.target.files).map((file, idx) => ({
            id: Date.now() + idx,
            file,
            preview: URL.createObjectURL(file),
        }));
        setFaces([...faces, ...newFaces]);
    };

    const removeFace = (id: number) => setFaces(faces.filter(f => f.id !== id));

    // Save new design
    const handleSaveDesign = async () => {
        if (!designName.trim()) return toast.error("نام طرح نمی‌تواند خالی باشد");
        if (!mainImage) return toast.error("تصویر اصلی طرح انتخاب نشده است");

        try {
            const formData = new FormData();
            formData.append("name", designName);
            formData.append("mainImage", mainImage);

            faces.forEach((face) => formData.append("faces", face.file));

            selectedLabelValueIds.forEach(id => formData.append("labelValueIds", id.toString()));

            await upsertDesign.mutateAsync(formData);

            toast.success("طرح با موفقیت ثبت شد 🎉");
            DesignRefetch()

            setDesignName("");
            setMainImage(null);
            setMainPreview(null);
            setFaces([]);
            setSelectedLabelValueIds([]);
        } catch (error: any) {
            console.error(error);
            // نمایش خطای دقیق‌تر از سرور
            const errorMessage = error?.response?.data?.error || error?.response?.data?.details || "ثبت طرح با خطا مواجه شد";
            toast.error(errorMessage);
        }
    };

    // Design delete
    const handleDeleteDesign = async (id: number) => {
        try {
            await deleteDesign.mutateAsync(id);
            toast.success("طرح با موفقیت حذف شد 🗑️");
            DesignRefetch();
            setDeleteDesignId(null);
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.error || "خطا در حذف طرح";
            toast.error(message);
        }
    };

    // Design Edit
    const handleEditDesign = (design: any) => {
        // setEditingDesignId(design.id);
        setDesignName(design.name);
        setMainPreview(design.mainImage);
        setSelectedLabelValueIds(design.labels.map((l: any) => l.labelValueId));
        toast("حالت ویرایش فعال شد 📝", {icon: "✏️"});
    };

    // ---------- Render ----------
    return (
        <div className="bg-gray-100 min-h-screen w-full">
            <Header/>

            <div className="container mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 gap-5">

                {/* ---------- Add & Manage Section ---------- */}
                <div className={"bg-white rounded-xl p-6 shadow-sm"}>
                    <div className="flex flex-wrap lg:flex-nowrap gap-8">

                        {/* ---------- Add New Design ---------- */}
                        <div className="w-full lg:w-2/3 flex flex-col">
                            <h2 className="text-2xl font-bold mb-6">افزودن طرح جدید</h2>

                            {/* Design Name */}
                            <div className="form-control mb-6">
                                <label className="label mb-1.5">
                                    <span className="label-text font-medium">نام یا کد طرح</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={designName}
                                    onChange={(e) => setDesignName(e.target.value)}
                                />
                            </div>

                            {/* Main Image Upload */}
                            <div className="form-control mb-6">
                                <label className="label mb-1.5">
                                    <span className="label-text font-medium">تصویر اصلی طرح</span>
                                </label>
                                <label
                                    className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition 
          ${mainPreview ? "border-gray-400 bg-gray-100" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
                                >
                                    {!mainPreview ? (
                                        <>
                                            <FaImage className="text-5xl text-gray-400 mb-3"/>
                                            <p className="text-gray-600 mb-2">کلیک کنید یا تصویر را بکشید</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleMainImage}
                                            />
                                        </>
                                    ) : (
                                        <div className="relative w-full h-64">
                                            <img
                                                src={mainPreview}
                                                alt="Main"
                                                className="w-full h-full object-contain rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 btn btn-circle"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMainImage(null);
                                                    setMainPreview(null);
                                                }}
                                            >
                                                <FaTrash className="text-error"/>
                                            </button>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Face Images Upload */}
                            <div className="form-control mb-6">
                                <label className="label mb-1.5">
                                    <span className="label-text font-medium">تصاویر فیس‌ها</span>
                                </label>
                                <label className="btn btn-primary w-full">
                                    <FaUpload className="ml-2"/> افزودن فیس
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFaceImages}
                                    />
                                </label>
                                {faces.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {faces.map((face) => (
                                            <div key={face.id} className="relative">
                                                <img
                                                    src={face.preview}
                                                    className="w-full h-32 object-cover rounded-lg shadow-sm"
                                                />
                                                <button
                                                    className="absolute top-1 right-1 btn btn-circle !bg-none !border-none"
                                                    onClick={() => removeFace(face.id)}
                                                >
                                                    <FaTrash className="text-error"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* ---------- Divider ---------- */}
                        <div className="hidden lg:flex justify-center">
                            <div className="w-px bg-gray-300 h-full mx-auto"></div>
                        </div>

                        {/* ---------- Labels Management ---------- */}
                        <div className="flex flex-col w-full lg:w-1/3">
                            <h1 className="text-xl font-bold mb-6">مدیریت لیبل‌ها</h1>

                            {LabelsIsLoading && (
                                <p className="text-gray-500">در حال بارگذاری...</p>
                            )}
                            {LabelsIsError && <p className="text-red-500">خطا در دریافت داده‌ها!</p>}

                            {/* Label Values Selection */}
                            <div className="form-control mb-6 overflow-y-auto">
                                {LabelsData?.map((label: Label) => (
                                    <div key={label.id} className="mb-4 bg-gray-50 rounded-lg p-4">
                                        <div className={"flex items-center justify-between mb-3"}>
                                            <p className="font-semibold text-gray-700 mb-2">{label.name}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-square text-blue-500"
                                                    onClick={() => setEditingLabel(label)}
                                                >
                                                    <CiEdit className="text-2xl"/>
                                                </button>
                                                <button
                                                    className="btn btn-square text-red-500"
                                                    onClick={() => setDeleteConfirmId(label.id ?? null)}
                                                >
                                                    <FaTrash size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {label.values?.map((value) => (
                                                <label
                                                    key={value.id}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary checkbox-sm"
                                                        checked={selectedLabelValueIds.includes(value.id!)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedLabelValueIds([
                                                                    ...selectedLabelValueIds,
                                                                    value.id!,
                                                                ]);
                                                            } else {
                                                                setSelectedLabelValueIds(
                                                                    selectedLabelValueIds.filter(
                                                                        (id) => id !== value.id
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm">{value.faName} ({value.enName})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Save Button */}
                    <div className="flex justify-end mt-6">
                        <button onClick={handleSaveDesign} className="btn btn-primary px-6">
                            ایجاد طرح جدید
                        </button>
                    </div>
                </div>

                {/* ---------- All Designs ---------- */}
                <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 shadow-sm">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>نام طرح</th>
                            <th>تصویر اصلی</th>
                            <th>تعداد فیس‌ها</th>
                            <th>لیبل‌ها</th>
                            <th>تاریخ ایجاد</th>
                            <th>آخرین ویرایش</th>
                            <th>عملیات</th>
                        </tr>
                        </thead>
                        <tbody>
                        {DesignData && DesignData?.length > 0 &&
                            DesignData.map((design: any, index: number) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>{design.name}</td>
                                    <td>
                                        <div className="avatar">
                                            <div className="mask mask-squircle h-12 w-12">
                                                <img src={design.mainImage} alt="design"/>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{design.faceCount}</td>
                                    <td className="flex flex-wrap gap-1">
                                        {design.labels.map((label: any, i: number) => (
                                            <div
                                                key={i}
                                                className="badge badge-soft badge-info text-xs text-nowrap"
                                            >
                                                {`${label.labelValue.enName} (${label.labelValue.faName})`}
                                            </div>
                                        ))}
                                    </td>
                                    <td>{toJalali(design.createdAt)}</td>
                                    <td>{toJalali(design.updatedAt)}</td>
                                    <td className="flex gap-2">
                                        <button
                                            className="btn btn-square btn-ghost text-blue-500"
                                            onClick={() => handleEditDesign(design)}
                                        >
                                            <CiEdit className="text-lg"/>
                                        </button>
                                        <button
                                            className="btn btn-square btn-ghost text-red-500"
                                            onClick={() => setDeleteDesignId(design.id)}
                                        >
                                            <FaTrash size={13}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* ---------- Delete Modal ---------- */}
            <input
                type="checkbox"
                id="delete-modal"
                className="modal-toggle"
                checked={deleteConfirmId !== null || deleteDesignId !== null}
                readOnly
            />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">
                        حذف {deleteDesignId ? "طرح" : "لیبل"}
                    </h3>
                    <p className="py-4 text-gray-600">
                        آیا مطمئن هستید که می‌خواهید این مورد را حذف کنید؟ این عمل قابل بازگشت نیست.
                    </p>
                    <div className="modal-action">
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setDeleteConfirmId(null);
                                setDeleteDesignId(null);
                            }}
                        >
                            انصراف
                        </button>
                        <button
                            className="btn btn-error"
                            onClick={() => {
                                if (deleteConfirmId) handleDeleteLabel(deleteConfirmId);
                                if (deleteDesignId) {
                                    deleteDesign.mutate(deleteDesignId, {
                                        onSuccess: () => {
                                            toast.success("طرح با موفقیت حذف شد");
                                            DesignRefetch();
                                            setDeleteDesignId(null);
                                        },
                                    });
                                }
                            }}
                        >
                            حذف
                        </button>
                    </div>
                </div>
            </div>


            {/* ---------- Edit Label Modal ---------- */}
            <input type="checkbox" id="update-modal" className="modal-toggle" checked={editingLabel !== null} readOnly/>
            <div className="modal">
                <div className="modal-box max-w-3xl">
                    <h3 className="font-bold text-xl mb-4">ویرایش لیبل</h3>
                    {editingLabel && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={editingLabel.name}
                                onChange={e => setEditingLabel({...editingLabel, name: e.target.value})}
                                placeholder="نام لیبل"
                            />
                            {editingLabel.values.map((value, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="نام فارسی"
                                        value={value.faName}
                                        onChange={e => {
                                            const newValues = [...editingLabel.values];
                                            newValues[index].faName = e.target.value;
                                            setEditingLabel({...editingLabel, values: newValues});
                                        }}
                                    />
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="نام لاتین"
                                        value={value.enName}
                                        onChange={e => {
                                            const newValues = [...editingLabel.values];
                                            newValues[index].enName = e.target.value;
                                            setEditingLabel({...editingLabel, values: newValues});
                                        }}
                                    />
                                    <button className="btn btn-error btn-sm btn-square" onClick={() => {
                                        const newValues = editingLabel.values.filter((_, i) => i !== index);
                                        setEditingLabel({...editingLabel, values: newValues});
                                    }}>
                                        <FaTrash size={14}/>
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn-outline btn-primary mt-2" onClick={() => setEditingLabel({
                                ...editingLabel,
                                values: [...editingLabel.values, {faName: "", enName: ""}]
                            })}>افزودن مقدار جدید
                            </button>
                        </div>
                    )}
                    <div className="modal-action mt-4">
                        <button className="btn btn-ghost" onClick={() => setEditingLabel(null)}>انصراف</button>
                        <button className="btn btn-primary"
                                onClick={() => editingLabel && handleSaveLabel(editingLabel)}>ذخیره تغییرات
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------- Edit Design Modal ---------- */}
            <input
                type="checkbox"
                id="update-design-modal"
                className="modal-toggle"
                checked={editingDesign !== null}
                readOnly
            />
            <div className="modal">
                <div className="modal-box max-w-3xl">
                    <h3 className="font-bold text-xl mb-4">ویرایش طرح</h3>
                    {editingDesign && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={editingDesign.name}
                                onChange={(e) =>
                                    setEditingDesign({ ...editingDesign, name: e.target.value })
                                }
                                placeholder="نام طرح"
                            />

                            {/* تصویر فعلی */}
                            <div className="flex items-center gap-4">
                                <img
                                    src={editingDesign.mainImage}
                                    alt="main"
                                    className="w-24 h-24 rounded-lg object-cover border"
                                />
                                <label className="btn btn-outline btn-primary cursor-pointer">
                                    تغییر تصویر
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (!e.target.files?.[0]) return;
                                            const file = e.target.files[0];
                                            setEditingDesign({
                                                ...editingDesign,
                                                newMainImage: file,
                                                mainImagePreview: URL.createObjectURL(file),
                                            });
                                        }}
                                    />
                                </label>
                            </div>

                            {/* فیس‌ها */}
                            <div>
                                <p className="font-medium mb-2">تعداد فیس‌ها: {editingDesign.faceCount}</p>
                                <label className="btn btn-outline btn-primary cursor-pointer">
                                    افزودن فیس جدید
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            if (!e.target.files) return;
                                            const files = Array.from(e.target.files);
                                            setEditingDesign({
                                                ...editingDesign,
                                                newFaces: files,
                                            });
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="modal-action mt-4">
                        <button
                            className="btn btn-ghost"
                            onClick={() => setEditingDesign(null)}
                        >
                            انصراف
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={async () => {
                                if (!editingDesign) return;
                                const formData = new FormData();
                                formData.append("id", editingDesign.id);
                                formData.append("name", editingDesign.name);
                                if (editingDesign.newMainImage)
                                    formData.append("mainImage", editingDesign.newMainImage);
                                if (editingDesign.newFaces) {
                                    editingDesign.newFaces.forEach((file: File) =>
                                        formData.append("faces", file)
                                    );
                                }

                                await upsertDesign.mutateAsync(formData);
                                toast.success("تغییرات طرح ذخیره شد ✅");
                                setEditingDesign(null);
                                DesignRefetch();
                            }}
                        >
                            ذخیره تغییرات
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
