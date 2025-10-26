"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

export default function RootLayout({
                                       children,
                                   }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="fa" dir="rtl" data-theme="light">
        <body className="antialiased">

        {/* react-query */}
        <QueryClientProvider client={queryClient}>
            {children}

            {/* react-hot-toast */}
            <Toaster
                position="top-left"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: {
                        fontFamily: "inherit",
                        textAlign: "right",
                    },
                }}
            />
        </QueryClientProvider>
        </body>
        </html>
    );
}
