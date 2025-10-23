"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

// services
import { useService } from "./service";

// types
import type { Label } from "./type";

// icons
import { FaPlus, FaTrash } from "react-icons/fa";
import { BsDatabase } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";

export default function Header() {
    const { addLabel } = useService();

    const [newLabelName, setNewLabelName] = useState("");
    const [labels, setLabels] = useState<Label[]>([]);

    // Add new label
    const addNewLabel = () => {
        if (!newLabelName.trim()) return;
        const newLabel: Label = {
            name: newLabelName.trim(),
            values: [],
        };
        setLabels([...labels, newLabel]);
        setNewLabelName("");
    };

    // Delete label
    const deleteLabel = (labelIndex: number) => {
        setLabels(labels.filter((_, index) => index !== labelIndex));
    };

    // Add value to label
    const addValueToLabel = (labelIndex: number) => {
        setLabels(
            labels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: [...label.values, { faName: "", enName: "" }],
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
        setLabels(
            labels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: label.values.map((val, valIndex) =>
                            valIndex === valueIndex ? { ...val, [field]: value } : val
                        ),
                    }
                    : label
            )
        );
    };

    // Delete value from label
    const deleteValue = (labelIndex: number, valueIndex: number) => {
        setLabels(
            labels.map((label, index) =>
                index === labelIndex
                    ? {
                        ...label,
                        values: label.values.filter((_, valIndex) => valIndex !== valueIndex),
                    }
                    : label
            )
        );
    };

    // Save labels
    const handleSave = () => {
        const cleanedLabels = labels
            .map((label) => ({
                ...label,
                values: label.values.filter(
                    (v) => v.faName.trim() !== "" || v.enName.trim() !== ""
                ),
            }))
            .filter((label) => label.name.trim() !== "");

        if (cleanedLabels.length === 0) {
            toast.error("هیچ داده معتبری برای ذخیره وجود ندارد ❌");
            return;
        }

        addLabel.mutate(cleanedLabels, {
            onSuccess: () => {
                toast.success("ذخیره با موفقیت انجام شد 🎉");
                setLabels([]);
                setNewLabelName("");
                const dialog = document.getElementById(
                    "basevalues_management"
                ) as HTMLDialogElement;
                dialog?.close();
            },
            onError: () => toast.error("خطا در ذخیره داده‌ها"),
        });
    };

    return (
        <div className="flex items-center justify-between navbar bg-white text-black shadow-sm px-20 py-5">
            <div className="flex items-center justify-between gap-2">
                <div className="bg-info/10 text-info/80 p-1.5 rounded-xl">
                    <BsDatabase className="text-3xl" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-black">سیستم مدیریت طرح‌های کاشی و سرامیک</div>
                    <div className="text-xs text-gray-500">لیبل‌گذاری و مدیریت دیتاست</div>
                </div>
            </div>

            <button
                className="btn"
                onClick={() =>
                    (document.getElementById("basevalues_management") as HTMLDialogElement)?.showModal()
                }
            >
                مدیریت مقادیر پایه
            </button>

            {/* Keep modal structure unchanged */}
            <dialog id="basevalues_management" className="modal">
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
                            <IoMdClose className="text-xl" />
                        </button>
                    </div>

                    {/* Add new label */}
                    <div className="flex items-center gap-3 mb-8">
                        <input
                            type="text"
                            placeholder="نام لیبل جدید..."
                            className="input input-bordered w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-primary btn-square text-lg shadow-md hover:scale-105 transition"
                            onClick={addNewLabel}
                        >
                            <FaPlus />
                        </button>
                    </div>

                    {/* Labels List */}
                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                        {labels.length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-6">
                                هنوز هیچ لیبلی اضافه نکرده‌اید
                            </div>
                        )}

                        {labels.map((label, labelIndex) => (
                            <div
                                key={labelIndex}
                                className="border border-gray-200 bg-gray-50 rounded-xl p-5 mb-5 shadow-sm hover:shadow transition-all"
                            >
                                {/* Label Header */}
                                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-lg text-gray-800">
                    {label.name}
                  </span>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-100"
                                        onClick={() => deleteLabel(labelIndex)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>

                                {/* Label Values */}
                                <div className="space-y-3">
                                    {label.values.map((value, valueIndex) => (
                                        <div
                                            key={valueIndex}
                                            className="flex gap-2 items-center bg-white rounded-lg border border-gray-200 p-2 shadow-sm"
                                        >
                                            <input
                                                className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                                placeholder="نام فارسی"
                                                value={value.faName}
                                                onChange={(e) =>
                                                    updateValue(labelIndex, valueIndex, "faName", e.target.value)
                                                }
                                            />
                                            <input
                                                className="input input-sm input-bordered w-full text-right focus:ring-2 focus:ring-blue-300"
                                                placeholder="نام لاتین"
                                                value={value.enName}
                                                onChange={(e) =>
                                                    updateValue(labelIndex, valueIndex, "enName", e.target.value)
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-error btn-sm btn-square hover:scale-105 transition"
                                                onClick={() => deleteValue(labelIndex, valueIndex)}
                                            >
                                                <FaTrash className="text-sm" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Value Button */}
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-primary btn-sm rounded-lg hover:scale-105 transition"
                                        onClick={() => addValueToLabel(labelIndex)}
                                    >
                                        <FaPlus className="ml-2" /> افزودن مقدار
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Modal Actions */}
                    <div className="modal-action flex justify-end gap-3 mt-8 border-t pt-4">
                        <button
                            type="button"
                            onClick={handleSave}
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
            </dialog>
        </div>
    );
}
