"use client";

import {ChangeEvent, useRef, useState} from "react";
import {useForm, useFieldArray} from "react-hook-form";
import Header from "@/components/layout/header/header";
import {toast} from "react-hot-toast";
import DeleteConfirmModal from "@/components/deleteConfirmModal";

// Icons
import {FaTrash, FaUpload, FaImage} from "react-icons/fa";
import {CiEdit} from "react-icons/ci";

// Types
import type {Label, DesignFace} from "@/app/type";

// Services
import {useService} from "@/app/service";
import {toJalali} from "@/utils/toJalali";
import AddLabel from "@/components/addLabel/addLabel";

export default function Home() {
    const {
        getLabels,
        updateLabel,
        deleteDesign,
        getDesigns,
        upsertDesign,
    } = useService();

    const {data: LabelsData, isLoading: LabelsIsLoading, isError: LabelsIsError, refetch: LabelsRefetch} = getLabels;
    const {data: DesignData, refetch: DesignRefetch} = getDesigns;

    // ---------- Label editing & deletion ----------
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);

    // ---------- Design editing & creation ----------
    const [designId, setDesignId] = useState<number | null>(null);
    const [editMode, setEditMode] = useState<boolean | null>(null);
    const [deleteDesignId, setDeleteDesignId] = useState<number | null>(null);
    const [tempLabels, setTempLabels] = useState<Label[]>([]);

    // ---------- React Hook Form Setup ----------
    const {register, handleSubmit, watch, setValue, reset, control} = useForm({
        defaultValues: {
            name: "",
            size: "",
            code: "",
            mainImage: null as File | null,
            mainPreview: null as string | null,
            faces: [] as DesignFace[],
            selectedLabelValueIds: [] as number[],
        }
    });

    const {fields: faceFields, append: appendFace, remove: removeFace} = useFieldArray({
        control,
        name: "faces"
    });

    const watchedValues = watch();
    const {name, size, code, mainPreview, faces, selectedLabelValueIds} = watchedValues;

    // Label save
    const handleSaveLabel = (label: Label) => {
        const cleanedValues = label.values.filter(
            (v) => v.faName.trim() || v.enName.trim()
        );
        updateLabel.mutate(
            {...label, values: cleanedValues},
            {
                onSuccess: () => {
                    LabelsRefetch();
                    DesignRefetch(); // Also refresh designs to show updated labels
                    setEditingLabel(null);
                    toast.success("لیبل و طرح‌های مرتبط با موفقیت به‌روزرسانی شدند ✨");
                },
            }
        );
    };

    // Handle main image upload
    const handleMainImage = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setValue("mainImage", file);
        setValue("mainPreview", URL.createObjectURL(file));
    };

    // Handle face images upload
    const handleFaceImages = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFaces: DesignFace[] = Array.from(e.target.files).map((file, idx) => ({
            id: Date.now() + idx,
            file,
            preview: URL.createObjectURL(file),
        }));
        newFaces.forEach(face => appendFace(face));
    };

    // Toggle label selection
    const toggleLabelValue = (id: number, checked: boolean) => {
        const currentIds = selectedLabelValueIds || [];
        const newIds = checked
            ? [...currentIds, id]
            : currentIds.filter((x) => x !== id);
        setValue("selectedLabelValueIds", newIds);
    };

    // Save or update a design
    const handleSaveDesign = async (data: any) => {
        if (!data.name.trim()) return toast.error("Design name cannot be empty");
        if (!data.mainPreview) return toast.error("Main design image not selected");

        try {
            const formData = new FormData();

            if (editMode && designId) formData.append("id", designId.toString());
            formData.append("name", data.name);
            formData.append("size", data.size);
            formData.append("code", data.code);

            if (data.mainImage instanceof File) formData.append("mainImage", data.mainImage);

            // ارسال تمام تصاویر فیس (شامل تصاویر جدید و موجود)
            data.faces.forEach((face: DesignFace) => {
                if (face.file) formData.append("faces", face.file);
            });

            // اگر در حالت ویرایش هستیم، اطلاعات دقیق‌تری ارسال کن
            if (editMode && designId) {
                const existingDesign = DesignData?.find((d: any) => d.id === designId);
                
                if (existingDesign) {
                    // اگر تعداد فیس‌ها کاهش یافته، مشخص کن که آیا همه حذف شده‌اند یا نه
                    if (existingDesign.faceCount > data.faces.length) {
                        if (data.faces.length === 0) {
                            // همه فیس‌ها حذف شده‌اند
                            formData.append("facesRemoved", "true");
                        } else {
                            // فقط برخی فیس‌ها حذف شده‌اند
                            formData.append("facesPartiallyRemoved", "true");
                            formData.append("remainingFacesCount", data.faces.length.toString());
                        }
                    }
                }
            }

            // Convert selected label value IDs to the expected labels structure
            const selectedLabels = LabelsData?.filter((label: Label) =>
                label.values.some((value) => data.selectedLabelValueIds.includes(value.id!))
            ).map((label: Label) => ({
                name: label.name,
                values: label.values.filter((value) =>
                    data.selectedLabelValueIds.includes(value.id!)
                ).map((value) => ({
                    id: value.id,
                    faName: value.faName,
                    enName: value.enName
                }))
            })) || [];

            // Also include temporary labels that were selected (for display purposes)
            const selectedTempLabels = tempLabels?.filter((label: Label) =>
                label.values.some((value) => data.selectedLabelValueIds.includes(value.id!))
            ).map((label: Label) => ({
                name: label.name,
                values: label.values.filter((value) =>
                    data.selectedLabelValueIds.includes(value.id!)
                ).map((value) => ({
                    id: value.id,
                    faName: value.faName,
                    enName: value.enName
                }))
            })) || [];

            // Combine both existing and temporary labels
            const allSelectedLabels = [...selectedLabels, ...selectedTempLabels];

            formData.append("labelsJson", JSON.stringify(allSelectedLabels));

            await upsertDesign.mutateAsync(formData);

            toast.success(editMode ? "Design updated successfully ✏️" : "New design created 🎉");
            DesignRefetch();

            // Reset form state
            setEditMode(false);
            setDesignId(null);
            setTempLabels([]);
            reset({
                name: "",
                size: "",
                code: "",
                mainImage: null,
                mainPreview: null,
                faces: [],
                selectedLabelValueIds: [],
            });
        } catch (error: any) {
            console.error(error);
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.details ||
                "Failed to save design";
            toast.error(errorMessage);
        }
    };

    // Enter edit mode for a design
    const handleEditDesign = (design: any) => {
        setDesignId(design.id);
        setEditMode(true);

        // Extract label value IDs from labelsJson
        const selectedLabelValueIds = design.labelsJson?.flatMap((label: any) =>
            label.values?.map((value: any) => value.id)
        ).filter(Boolean) || [];

        // Create temporary labels for display if they don't exist in current database
        const tempLabels = design.labelsJson?.map((labelData: any) => {
            // Check if this label exists in current LabelsData
            const existingLabel = LabelsData?.find((l: Label) => l.name === labelData.name);

            if (existingLabel) {
                // Label exists, use existing data
                return existingLabel;
            } else {
                // Label doesn't exist, create temporary label for display only
                return {
                    id: `temp_${Date.now()}_${Math.random()}`,
                    name: labelData.name,
                    values: labelData.values?.map((value: any) => ({
                        id: value.id || `temp_value_${Date.now()}_${Math.random()}`,
                        faName: value.faName,
                        enName: value.enName,
                        labelId: `temp_${Date.now()}_${Math.random()}`
                    })) || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
        }) || [];

        // Store temporary labels for display
        const filteredTempLabels = tempLabels.filter((tempLabel: any) =>
            !LabelsData?.some((existing: Label) => existing.name === tempLabel.name)
        );
        setTempLabels(filteredTempLabels);

        reset({
            name: design.name,
            size: design.size || "",
            code: design.code || "",
            mainImage: null,
            mainPreview: design.mainImage,
            faces: design.images.map((img: any) => ({
                id: img.id || Date.now(),
                preview: img.url,
            })),
            selectedLabelValueIds: selectedLabelValueIds,
        });

        toast("Edit mode activated 📝", {icon: "✏️"});
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setEditMode(false);
        setDesignId(null);
        setTempLabels([]);
        reset({
            name: "",
            size: "",
            code: "",
            mainImage: null,
            mainPreview: null,
            faces: [],
            selectedLabelValueIds: [],
        });
        toast("Edit mode deactivated 📝", {icon: "✏️"});
    };

    const inputRef = useRef<HTMLInputElement | null>(null);
    const handleRemove = (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        setValue("mainImage", null);
        setValue("mainPreview", null);

        // 👇 پاک کردن مقدار input تا بتوان دوباره همان فایل را آپلود کرد
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };
    // ---------- Render ----------
    return (
        <div className="bg-gray-100 min-h-screen w-full">
            <Header/>

            <div className="container max-w-[70%] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 gap-5">

                {/* ---------- Add & Manage Section ---------- */}
                <div className={"bg-white rounded-xl p-6 shadow-sm"}>
                    <div className="flex flex-wrap lg:flex-nowrap gap-8">

                        {/* ---------- Add New Design ---------- */}
                        <div className="w-full lg:w-2/3 flex flex-col">
                            <h2 className="text-2xl font-bold mb-6">{editMode ? "ویرایش طرح" : "ایجاد طرح جدید"}</h2>

                            <div className={"flex gap-2 w-full"}>
                                <div className="form-control mb-6 w-full">
                                    <label className="label mb-1.5">
                                        <span className="label-text font-medium">نام طرح</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        {...register("name")}
                                    />
                                </div>
                                <div className="form-control mb-6 w-full">
                                    <label className="label mb-1.5">
                                        <span className="label-text font-medium">سایز</span>
                                    </label>
                                    <select {...register("size")} defaultValue="Pick a color" className="select">
                                        <option disabled={true}>سایزی را انتخاب کنید</option>
                                        <option>60x60</option>
                                        <option>50x50</option>
                                        <option>45x45</option>
                                    </select>
                                </div>

                                <div className="form-control mb-6 w-full">
                                    <label className="label mb-1.5">
                                        <span className="label-text font-medium">کد طرح</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        {...register("code")}
                                    />
                                </div>
                            </div>
                            {/* Main Image Upload */}
                            <div className="form-control mb-6">
                                <label className="label mb-1.5">
                                    <span className="label-text font-medium">تصویر اصلی طرح</span>
                                </label>

                                <input
                                    id="mainImageInput"
                                    ref={inputRef} // ✅
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleMainImage}
                                />

                                <label
                                    htmlFor="mainImageInput"
                                    className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition 
        ${mainPreview ? "border-gray-400 bg-gray-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
                                >
                                    {!mainPreview ? (
                                        <>
                                            <FaImage className="text-5xl text-gray-400 mb-3" />
                                            <p className="text-gray-600 mb-2">کلیک کنید یا تصویر را بکشید</p>
                                        </>
                                    ) : (
                                        <div
                                            className="relative w-full h-76"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <img
                                                src={mainPreview}
                                                alt="Main"
                                                className="w-full h-full object-contain rounded-lg cursor-default"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 btn btn-circle"
                                                onClick={handleRemove}
                                            >
                                                <FaTrash className="text-error" />
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
                                {faceFields.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {faceFields.map((face, index) => (
                                            <div key={face.id} className="relative">
                                                <img
                                                    src={face.preview}
                                                    className="w-full h-32 object-cover rounded-lg shadow-sm"
                                                />
                                                <button
                                                    className="absolute top-1 right-1 btn btn-circle !bg-none !border-none"
                                                    onClick={() => removeFace(index)}
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
                        <div className="flex flex-col w-full lg:w-1/3 max-h-[650px]">
                            <div className={"flex items-center justify-between mb-6"}>
                                <h1 className="text-xl font-bold">مدیریت لیبل ها</h1>
                                <AddLabel/>
                            </div>

                            {LabelsIsLoading && <p className="text-gray-500">Loading...</p>}
                            {LabelsIsError && <p className="text-red-500">خطا در دریافت دیتا.</p>}
                            {LabelsData?.length <= 0 && <p className="text-gray-500">لیبلی یافت نشد.</p>}

                            {/* Label Values Selection */}
                            <div className="form-control mb-6 overflow-y-auto">
                                {/* Combine existing labels with temporary labels for display */}
                                {(() => {
                                    const allLabels = [...(LabelsData || []), ...tempLabels];
                                    return allLabels?.map((label: Label) => (
                                        <div key={label.id} className="mb-4 bg-gray-50 rounded-lg p-4">
                                            <div className={"flex items-center justify-between mb-3"}>
                                                <p className="font-semibold text-gray-700 mb-2">{label.name}</p>
                                                <div className="flex gap-2">
                                                    {/* Only show edit button for existing labels, not temporary ones */}
                                                    {!label.id?.toString().startsWith('temp_') && (
                                                        <button
                                                            className="btn btn-square text-blue-500"
                                                            onClick={() => setEditingLabel(label)}
                                                        >
                                                            <CiEdit className="text-2xl"/>
                                                        </button>
                                                    )}
                                                    {/* Show indicator for temporary labels */}
                                                    {label.id?.toString().startsWith('temp_') && (
                                                        <span className="badge badge-warning badge-sm">قدیمی</span>
                                                    )}
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
                                                            onChange={(e) => toggleLabelValue(value.id!, e.target.checked)}
                                                        />
                                                        <span className="text-sm">{value.faName} ({value.enName})</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Save Buttons */}
                    <div className="flex justify-end mt-6 gap-2">
                        <button onClick={handleSubmit(handleSaveDesign)} className={`btn btn-primary px-6`}>
                            {upsertDesign.isPending ? <span className="loading loading-spinner"></span> :
                                <span>{editMode ? "ویرایش طرح" : "ایجاد طرح جدید"}</span>}
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="btn btn-error px-6"
                            hidden={!editMode}
                        >
                            انصراف
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
                            <th>کد طرح</th>
                            <th>سایز طرح</th>
                            <th>تصویر اصلی</th>
                            <th>تعداد فیس ها</th>
                            <th>لیبل ها</th>
                            <th>تاریخ ایجاد</th>
                            <th>آخرین ویرایش</th>
                            <th>عملیات</th>
                        </tr>
                        </thead>
                        <tbody>
                        {DesignData && DesignData.length > 0 &&
                            DesignData.map((design: any, index: number) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>{design.name}</td>
                                    <td>{design.size}</td>
                                    <td>{design.code}</td>
                                    <td>
                                        <div className="avatar">
                                            <div className="mask mask-squircle h-12 w-12">
                                                <img src={design.mainImage} alt="design"/>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{design.faceCount}</td>
                                    <td className="flex flex-wrap gap-1">
                                        {design?.labelsJson?.map((label: any, i: number) => (
                                            <div key={i} className="flex flex-wrap gap-1">
                                                {label?.values?.map((value: any, j: number) => (
                                                    <div
                                                        key={`${i}-${j}`}
                                                        className="badge badge-soft badge-info text-xs text-nowrap"
                                                    >
                                                        {`${value?.enName} (${value?.faName})`}
                                                    </div>
                                                ))}
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
            <DeleteConfirmModal
                isOpen={deleteDesignId !== null}
                title={`طرح`}
                onCancel={() => {
                    setDeleteDesignId(null);
                }}
                onConfirm={() => {
                    if (deleteDesignId) {
                        deleteDesign.mutate(deleteDesignId, {
                            onSuccess: () => {
                                toast.success("Design deleted successfully");
                                DesignRefetch();
                                setDeleteDesignId(null);
                            },
                        });
                    }
                }}
            />

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
                                placeholder="Label Name"
                            />
                            {editingLabel.values.map((value, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="Persian Name"
                                        value={value.faName}
                                        onChange={e => {
                                            const newValues = [...editingLabel.values];
                                            newValues[index].faName = e.target.value;
                                            setEditingLabel({...editingLabel, values: newValues});
                                        }}
                                    />
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="English Name"
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
                            })}>مقدار جدید
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
