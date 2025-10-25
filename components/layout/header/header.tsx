// icons
import {BsDatabase} from "react-icons/bs";

export default function Header() {


    return (
        <div className="flex items-center justify-between navbar bg-white text-black shadow-sm px-20 py-5">
            <div className="flex items-center justify-between gap-2">
                <div className="bg-info/10 text-info/80 p-1.5 rounded-xl">
                    <BsDatabase className="text-3xl"/>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-black">سیستم مدیریت طرح‌های کاشی و سرامیک</div>
                    <div className="text-xs text-gray-500">لیبل‌گذاری و مدیریت دیتاست</div>
                </div>
            </div>
        </div>
    );
}
