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

export default function Home() {
    const {getLabels, deleteLabel, updateLabel , deleteDesign , getDesigns , upsertDesign} = useService();
    const {data, isLoading, isError, refetch} = getLabels;

    // Label editing & deletion
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // New Design state
    const [designName, setDesignName] = useState("");
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainPreview, setMainPreview] = useState<string | null>(null);
    const [faces, setFaces] = useState<DesignFace[]>([]);
    const [selectedLabelValueIds, setSelectedLabelValueIds] = useState<number[]>([]);

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
                    refetch();
                    setEditingLabel(null);
                }
            }
        );
    };

    // Label delete
    const handleDeleteLabel = (id: number) => {
        deleteLabel.mutate(id, {
            onSuccess: () => {
                refetch();
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


    // ---------- Render ----------
    return (
        <div className="bg-gray-100 min-h-screen w-full">
            <Header/>

            <div className="container mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ---------- Add New Design ---------- */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">افزودن طرح جدید</h2>
                    {/* Design Name */}
                    <div className="form-control mb-6">
                        <label className="label mb-1.5"><span className="label-text font-medium">نام یا کد طرح</span></label>
                        <input type="text" className="input input-bordered w-full"
                               value={designName} onChange={e => setDesignName(e.target.value)} />
                    </div>
                    {/* Main Image Upload */}
                    <div className="form-control mb-6">
                        <label className="label mb-1.5"><span className="label-text font-medium">تصویر اصلی طرح</span></label>
                        <label className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition 
      ${mainPreview ? "border-gray-400 bg-gray-100" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}>
                            {!mainPreview ? (
                                <>
                                    <FaImage className="text-5xl text-gray-400 mb-3"/>
                                    <p className="text-gray-600 mb-2">کلیک کنید یا تصویر را بکشید</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleMainImage}/>
                                </>
                            ) : (
                                <div className="relative w-full h-64">
                                    <img src={mainPreview} alt="Main" className="w-full h-full object-contain rounded-lg"/>
                                    <button type="button" className="absolute top-1 right-1 btn btn-circle"
                                            onClick={(e) => { e.stopPropagation(); setMainImage(null); setMainPreview(null); }}>
                                        <FaTrash className={"text-error"}/>
                                    </button>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Face Images Upload */}
                    <div className="form-control mb-6">
                        <label className="label mb-1.5"><span className="label-text font-medium">تصاویر فیس ها</span></label>
                        <label className="btn btn-primary w-full">
                            <FaUpload className=" ml-2"/> افزودن فیس
                            <input type="file" accept="image/*" multiple className="hidden"
                                   onChange={handleFaceImages}/>
                        </label>
                        {faces.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                {faces.map(face => (
                                    <div key={face.id} className="relative">
                                        <img src={face.preview} className="w-full h-32 object-cover rounded-lg shadow-sm"/>
                                        <button className="absolute top-1 right-1 btn btn-circle !bg-none !border-none"
                                                onClick={() => removeFace(face.id)}><FaTrash className={"text-error"}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Label Values Selection */}
                    <div className="form-control mb-6">
                        <label className="label mb-1.5"><span className="label-text font-medium">انتخاب مقادیر لیبل</span></label>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                            {data?.map((label: Label) => (
                                <div key={label.id} className="mb-4">
                                    <p className="font-semibold text-gray-700 mb-2">{label.name}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {label.values?.map((value) => (
                                            <label key={value.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary checkbox-sm"
                                                    checked={selectedLabelValueIds.includes(value.id!)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedLabelValueIds([...selectedLabelValueIds, value.id!]);
                                                        } else {
                                                            setSelectedLabelValueIds(selectedLabelValueIds.filter(id => id !== value.id));
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

                    {/* Save Button */}
                    <div className="flex justify-end mt-6">
                        <button onClick={handleSaveDesign} className="btn btn-primary px-6">
                            افزودن به دیتاست
                        </button>
                    </div>
                </div>

                {/* ---------- Labels Management ---------- */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-5">
                    <h1 className="text-xl font-bold mb-6">مدیریت لیبل‌ها</h1>

                    {isLoading && <p className="text-gray-500">در حال بارگذاری...</p>}
                    {isError && <p className="text-red-500">خطا در دریافت داده‌ها!</p>}

                    <div className="flex flex-col gap-4">
                        {data?.map((label: any) => (
                            <div key={label.id}
                                 className="bg-gray-50 rounded-xl p-4 shadow-sm flex flex-col gap-2 hover:shadow transition">
                                <div className="flex justify-between items-center">
                                    <div className="font-semibold text-gray-700">{label.name}</div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-square text-blue-500"
                                                onClick={() => setEditingLabel(label)}>
                                            <CiEdit className="text-2xl"/>
                                        </button>
                                        <button className="btn btn-square text-red-500"
                                                onClick={() => setDeleteConfirmId(label.id)}>
                                            <FaTrash size={16}/>
                                        </button>
                                    </div>
                                </div>
                                {label.values?.length > 0 && (
                                    <select defaultValue="انتخاب مقدار"
                                            className="select w-full mt-2 border border-gray-300 rounded-lg p-2">
                                        <option disabled>انتخاب مقدار</option>
                                        {label.values.map((value: any) => (
                                            <option key={value.id}
                                                    value={value.enName}>{`${value.enName} (${value.faName})`}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ---------- Delete Modal ---------- */}
            <input type="checkbox" id="delete-modal" className="modal-toggle" checked={deleteConfirmId !== null}
                   readOnly/>
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">حذف لیبل</h3>
                    <p className="py-4 text-gray-600">آیا مطمئن هستید که می‌خواهید این لیبل را حذف کنید؟ این عمل قابل
                        بازگشت نیست.</p>
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => setDeleteConfirmId(null)}>انصراف</button>
                        <button className="btn btn-error"
                                onClick={() => deleteConfirmId && handleDeleteLabel(deleteConfirmId)}>حذف
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
        </div>
    );
}
