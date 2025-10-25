import React, {ChangeEvent, useEffect, useState} from "react";
import {useForm, useFieldArray} from "react-hook-form";
import {toast} from "react-hot-toast";

// services
import {useService} from "./service";

// types
import type {Label} from "./type";

// icons
import {FaPlus, FaTrash, FaEdit} from "react-icons/fa";
import {IoMdClose} from "react-icons/io";
import {CiEdit} from "react-icons/ci";
import DeleteConfirmModal from "@/components/deleteConfirmModal";

export default function AddLabel() {
    const {addLabel, updateLabel, deleteLabel, getLabels} = useService();

    const [existingLabels, setExistingLabels] = useState<Label[]>([]);
    const [newLabels, setNewLabels] = useState<Label[]>([]);
    const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // React Hook Form setup
    const {register, handleSubmit, watch, setValue, reset, control} = useForm({
        defaultValues: {
            newLabelName: "",
        }
    });

    const watchedValues = watch();
    const {newLabelName} = watchedValues;

    useEffect(() => {
        if (getLabels.data) {
            setExistingLabels(getLabels.data);
        }
    }, [getLabels.data]);

    // Add new label
    const addNewLabel = () => {
        if (!newLabelName.trim()) return;
        const newLabel: Label = {
            name: newLabelName.trim(),
            values: [],
        };
        setNewLabels(prevNewLabels => [...prevNewLabels, newLabel]);
        setValue("newLabelName", "");
    };

    // Delete label (for new labels only)
    const deleteNewLabel = (labelIndex: number) => {
        setNewLabels(prevNewLabels => prevNewLabels.filter((_, index) => index !== labelIndex));
    };

    // Delete existing label (with API call)
    const handleDeleteExistingLabel = (id: number) => {
        deleteLabel.mutate(id, {
            onSuccess: () => {
                toast.success("لیبل با موفقیت حذف شد");
                setExistingLabels(prevExistingLabels => prevExistingLabels.filter(label => label.id !== id));
                setDeleteConfirmId(null);
            },
            onError: () => {
                toast.error("خطا در حذف لیبل");
            }
        });
    };

    // Toggle edit mode for existing label
    const toggleEditLabel = (labelId: number) => {
        setEditingLabelId(editingLabelId === labelId ? null : labelId);
    };

    // Update existing label
    const updateExistingLabel = (labelId: number, updatedLabel: Label) => {
        const cleanedValues = updatedLabel.values.filter(
            (v) => v.faName.trim() || v.enName.trim()
        );

        const cleanedLabel = {...updatedLabel, values: cleanedValues};

        updateLabel.mutate(cleanedLabel, {
            onSuccess: () => {
                toast.success("لیبل با موفقیت ویرایش شد");
                // Only update existing labels, don't affect new labels
                setExistingLabels(prevExistingLabels => prevExistingLabels.map(label =>
                    label.id === labelId ? cleanedLabel : label
                ));
                setEditingLabelId(null);
            },
            onError: () => {
                toast.error("خطا در ویرایش لیبل");
            }
        });
    };

    // Update label name
    const updateLabelName = (labelId: number, newName: string) => {
        setExistingLabels(prevExistingLabels => prevExistingLabels.map(label =>
            label.id === labelId ? {...label, name: newName} : label
        ));
    };

    // Update label value
    const updateLabelValue = (labelId: number, valueIndex: number, field: "faName" | "enName", value: string) => {
        setExistingLabels(prevExistingLabels => prevExistingLabels.map(label =>
            label.id === labelId ? {
                ...label,
                values: label.values.map((val, index) =>
                    index === valueIndex ? {...val, [field]: value} : val
                )
            } : label
        ));
    };

    // Add value to existing label
    const addValueToExistingLabel = (labelId: number) => {
        setExistingLabels(prevExistingLabels => prevExistingLabels.map(label =>
            label.id === labelId ? {
                ...label,
                values: [...label.values, {faName: "", enName: ""}]
            } : label
        ));
    };

    // Delete value from existing label
    const deleteValueFromExistingLabel = (labelId: number, valueIndex: number) => {
        setExistingLabels(prevExistingLabels => prevExistingLabels.map(label =>
            label.id === labelId ? {
                ...label,
                values: label.values.filter((_, index) => index !== valueIndex)
            } : label
        ));
    };

    // Add value to label
    const addValueToLabel = (labelIndex: number) => {
        setNewLabels(prevNewLabels =>
            prevNewLabels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: [...label.values, {faName: "", enName: ""}],
                    }
                    : label
            )
        );
    };

    // Update value field
    const updateValue = (
        labelIndex: number,
        valueIndex: number,
        field: "faName" | "enName",
        value: string
    ) => {
        setNewLabels(prevNewLabels =>
            prevNewLabels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: label.values.map((val, valIndex) =>
                            valIndex === valueIndex ? {...val, [field]: value} : val
                        ),
                    }
                    : label
            )
        );
    };

    // Delete value from label
    const deleteValue = (labelIndex: number, valueIndex: number) => {
        setNewLabels(prevNewLabels =>
            prevNewLabels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: label.values.filter((_, valIndex) => valIndex !== valueIndex),
                    }
                    : label
            )
        );
    };

    // Save labels (only new labels without id)
    const handleSave = (data: any) => {
        const cleanedLabels = newLabels
            .map((label) => ({
                ...label,
                values: label.values.filter(
                    (v) => v.faName.trim() !== "" || v.enName.trim() !== ""
                ),
            }))
            .filter((label) => label.name.trim() !== "");

        if (cleanedLabels.length === 0) {
            toast.error("هیچ لیبل جدیدی برای ذخیره وجود ندارد");
            return;
        }

        addLabel.mutate(cleanedLabels, {
            onSuccess: () => {
                toast.success("ذخیره با موفقیت انجام شد 🎉");
                // Clear new labels after successful save
                setNewLabels([]);
                reset({newLabelName: ""});
                const dialog = document.getElementById(
                    "basevalues_management"
                ) as HTMLDialogElement;
                dialog?.close();
            },
            onError: () => toast.error("خطا در ذخیره داده‌ها"),
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/json") {
            toast.error("Only JSON files are allowed!");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const importedLabels = Array.isArray(json) ? json : [json];

                setNewLabels(prevNewLabels => [...prevNewLabels, ...importedLabels])
            } catch (error) {
                console.error(error);
                toast.error("Invalid JSON file!");
            }
        };

        reader.readAsText(file);
    };

    return <div>
        <button
            className="btn btn-primary btn-square"
            onClick={() =>
                (document.getElementById("basevalues_management") as HTMLDialogElement)?.showModal()
            }
        >
            <FaPlus/>
        </button>

        {/* Keep modal structure unchanged */}
        <dialog id="basevalues_management" className="modal" style={{zIndex: 5}}>
            <div className="modal-box w-11/12 max-w-2xl p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-8 border-b pb-3">
                    <h3 className="font-bold text-2xl text-gray-800">
                        مدیریت مقادیر پایه
                    </h3>
                    <button
                        onClick={() => {
                            const dialog = document.getElementById(
                                "basevalues_management"
                            ) as HTMLDialogElement;
                            dialog?.close();
                        }}
                        className="btn btn-sm btn-circle btn-ghost hover:bg-gray-100"
                    >
                        <IoMdClose className="text-xl"/>
                    </button>
                </div>

                {/* Add new label */}
                <label className="btn btn-primary mb-4 cursor-pointer">
                    Import JSON
                    <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
                <div className="flex items-center gap-3 mb-8">
                    <input
                        type="text"
                        placeholder="نام لیبل جدید..."
                        className="input input-bordered w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        {...register("newLabelName")}
                    />
                    <button
                        type="button"
                        className="btn btn-primary btn-square text-lg shadow-md hover:scale-105 transition"
                        onClick={addNewLabel}
                    >
                        <FaPlus/>
                    </button>
                </div>

                {/* Labels List */}
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                    {newLabels?.length === 0 && existingLabels?.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-6">
                            هنوز هیچ لیبلی اضافه نکرده‌اید
                        </div>
                    )}

                    {/* New Labels (displayed first) */}
                    {newLabels && newLabels.map((label: any, labelIndex: any) => (
                        <div
                            key={label.id || labelIndex}
                            className={`border rounded-xl p-5 mb-5 shadow-sm hover:shadow transition-all ${
                                label.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            {/* Label Header */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    {label.id && editingLabelId === label.id ? (
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm"
                                            value={label.name}
                                            onChange={(e) => updateLabelName(label.id!, e.target.value)}
                                        />
                                    ) : (
                  <span className="font-semibold text-lg text-gray-800">
                    {label.name}
                  </span>
                                    )}
                                    {label.id && (
                                        <span className="badge badge-primary badge-sm">موجود</span>
                                    )}
                                    {!label.id && (
                                        <span className="badge badge-secondary badge-sm">جدید</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {label.id && (
                                        <>
                                            <button
                                                type="button"
                                                className={`btn btn-ghost btn-circle ${
                                                    editingLabelId === label.id
                                                        ? 'text-green-500 hover:bg-green-100'
                                                        : 'text-blue-500 hover:bg-blue-100'
                                                }`}
                                                onClick={() => {
                                                    if (editingLabelId === label.id) {
                                                        updateExistingLabel(label.id, label);
                                                    } else {
                                                        toggleEditLabel(label.id);
                                                    }
                                                }}
                                            >
                                                {editingLabelId === label.id ? (
                                                    "تایید"
                                                ) : (
                                                    <CiEdit className="text-xl"/>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-circle btn-ghost text-red-500 hover:bg-red-100"
                                                onClick={() => setDeleteConfirmId(label.id)}
                                            >
                                                <FaTrash/>
                                            </button>
                                        </>
                                    )}
                                    {!label.id && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-100"
                                            onClick={() => deleteNewLabel(labelIndex)}
                                >
                                    <FaTrash/>
                                </button>
                                    )}
                                </div>
                            </div>

                            {/* Label Values */}
                            <div className="space-y-3">
                                {label.values.map((value: any, valueIndex: any) => (
                                    <div
                                        key={valueIndex}
                                        className="flex gap-2 items-center bg-white rounded-lg border border-gray-200 p-2 shadow-sm"
                                    >
                                        <input
                                            className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                            placeholder="نام فارسی"
                                            value={value.faName}
                                            onChange={(e) => {
                                                if (label.id && editingLabelId === label.id) {
                                                    updateLabelValue(label.id, valueIndex, "faName", e.target.value);
                                                } else {
                                                    updateValue(labelIndex, valueIndex, "faName", e.target.value);
                                                }
                                            }}
                                        />
                                        <input
                                            className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                            placeholder="نام لاتین"
                                            value={value.enName}
                                            onChange={(e) => {
                                                if (label.id && editingLabelId === label.id) {
                                                    updateLabelValue(label.id, valueIndex, "enName", e.target.value);
                                                } else {
                                                    updateValue(labelIndex, valueIndex, "enName", e.target.value);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs btn-square hover:scale-105 transition"
                                            onClick={() => {
                                                if (label.id && editingLabelId === label.id) {
                                                    deleteValueFromExistingLabel(label.id, valueIndex);
                                                } else {
                                                    deleteValue(labelIndex, valueIndex);
                                                }
                                            }}
                                        >
                                            <FaTrash className="text-xs text-red-500"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Value Button */}
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-primary btn-sm rounded-lg hover:scale-105 transition"
                                    onClick={() => {
                                        if (label.id && editingLabelId === label.id) {
                                            addValueToExistingLabel(label.id);
                                        } else {
                                            addValueToLabel(labelIndex);
                                        }
                                    }}
                                >
                                    <FaPlus className="ml-2"/> افزودن مقدار
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Existing Labels (displayed after new labels) */}
                    {existingLabels && existingLabels.map((label: any, labelIndex: any) => (
                        <div
                            key={label.id || labelIndex}
                            className={`border rounded-xl p-5 mb-5 shadow-sm hover:shadow transition-all ${
                                label.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            {/* Label Header */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    {label.id && editingLabelId === label.id ? (
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm"
                                            value={label.name}
                                            onChange={(e) => updateLabelName(label.id!, e.target.value)}
                                        />
                                    ) : (
                                        <span className="font-semibold text-lg text-gray-800">
                                            {label.name}
                                        </span>
                                    )}
                                    {label.id && (
                                        <span className="badge badge-primary badge-sm">موجود</span>
                                    )}
                                    {!label.id && (
                                        <span className="badge badge-secondary badge-sm">جدید</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {label.id && (
                                        <>
                                            <button
                                                type="button"
                                                className={`btn btn-ghost btn-circle ${
                                                    editingLabelId === label.id
                                                        ? 'text-green-500 hover:bg-green-100'
                                                        : 'text-blue-500 hover:bg-blue-100'
                                                }`}
                                                onClick={() => {
                                                    if (editingLabelId === label.id) {
                                                        updateExistingLabel(label.id, label);
                                                    } else {
                                                        toggleEditLabel(label.id);
                                                    }
                                                }}
                                            >
                                                {editingLabelId === label.id ? (
                                                    "تایید"
                                                ) : (
                                                    <CiEdit className="text-xl"/>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-circle btn-ghost text-red-500 hover:bg-red-100"
                                                onClick={() => setDeleteConfirmId(label.id)}
                                            >
                                                <FaTrash/>
                                            </button>
                                        </>
                                    )}
                                    {!label.id && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm text-red-500 hover:bg-red-100"
                                            onClick={() => deleteNewLabel(labelIndex)}
                                        >
                                            <FaTrash/>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Label Values */}
                            <div className="space-y-3">
                                {label.values.map((value: any, valueIndex: any) => (
                                    <div
                                        key={valueIndex}
                                        className="flex gap-2 items-center bg-white rounded-lg border border-gray-200 p-2 shadow-sm"
                                    >
                                        <input
                                            className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                            placeholder="نام فارسی"
                                            value={value.faName}
                                            onChange={(e) => {
                                                if (label.id && editingLabelId === label.id) {
                                                    updateLabelValue(label.id, valueIndex, "faName", e.target.value);
                                                } else {
                                                    updateValue(labelIndex, valueIndex, "faName", e.target.value);
                                                }
                                            }}
                                        />
                                        <input
                                            className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                            placeholder="نام لاتین"
                                            value={value.enName}
                                            onChange={(e) => {
                                                if (label.id && editingLabelId === label.id) {
                                                    updateLabelValue(label.id, valueIndex, "enName", e.target.value);
                                                } else {
                                                    updateValue(labelIndex, valueIndex, "enName", e.target.value);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs btn-square hover:scale-105 transition"
                                            onClick={() => {
                                                if (label.id && editingLabelId === label.id) {
                                                    deleteValueFromExistingLabel(label.id, valueIndex);
                                                } else {
                                                    deleteValue(labelIndex, valueIndex);
                                                }
                                            }}
                                        >
                                            <FaTrash className="text-xs text-red-500"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Value Button */}
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-primary btn-sm rounded-lg hover:scale-105 transition"
                                    onClick={() => {
                                        if (label.id && editingLabelId === label.id) {
                                            addValueToExistingLabel(label.id);
                                        } else {
                                            addValueToLabel(labelIndex);
                                        }
                                    }}
                                >
                                    <FaPlus className="ml-2"/> افزودن مقدار
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Actions */}
                <div className="modal-action flex justify-end gap-3 mt-8 border-t pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit(handleSave)}
                        className="btn btn-primary px-6 shadow-md hover:scale-105 transition"
                    >
                        {addLabel.isPending ? (
                            <span className="loading loading-spinner"></span>
                        ) : (
                            "ذخیره مقادیر پایه"
                        )}
                    </button>
                    <button
                        className="btn btn-ghost px-6 hover:bg-gray-100"
                        onClick={() => {
                            const dialog = document.getElementById(
                                "basevalues_management"
                            ) as HTMLDialogElement;
                            dialog?.close();
                        }}
                    >
                        انصراف
                    </button>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            <div>
                <DeleteConfirmModal
                    isOpen={deleteConfirmId !== null}
                    title={`لیبل`}
                    onCancel={() => {
                        setDeleteConfirmId(null);
                    }}
                    onConfirm={() => {
                        if (deleteConfirmId) {
                            handleDeleteExistingLabel(deleteConfirmId);
                        }
                    }}
                />
            </div>
        </dialog>


    </div>
}