"use client";
import React from "react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({isOpen, title, onCancel, onConfirm,}) => {
    return (
        <>
            <input
                type="checkbox"
                id="delete-modal"
                className="modal-toggle"
                checked={isOpen}
                readOnly
            />
            <div className="modal !z-100">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">حذف {title}</h3>
                    <p className="py-4 text-gray-600">
                        آیا مطمئن هستید که می‌خواهید این {title} را حذف کنید؟ این اقدام قابل بازگشت نیست.
                    </p>
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={onCancel}>
                            انصراف
                        </button>
                        <button className="btn btn-error" onClick={onConfirm}>
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeleteConfirmModal;
