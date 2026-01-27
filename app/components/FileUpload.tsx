"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useLocalizedToast } from "@/hooks/use-localized-toast";

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
    accept?: string;
    label?: string;
    endpoint?: string;
    children?: React.ReactNode;
    className?: string;
}

export default function FileUpload({ onUploadSuccess, accept, label = "Automation JSON File", endpoint = "/api/upload", children, className }: FileUploadProps) {
    const { showSuccess, showError, showLoading, dismiss } = useLocalizedToast();
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = showLoading("Uploading...");

        try {
            // 1. Get presigned URL
            const res = await fetch(endpoint, {
                method: "POST",
                body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Presign error");
            }

            const { uploadUrl, fileUrl } = await res.json();

            // 2. Upload to AWS S3
            // CRITICAL FIX: Check response status of the S3 upload
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error("S3 Upload Failed:", uploadRes.status, errorText);
                throw new Error(`S3 Upload failed: ${uploadRes.statusText}`);
            }

            onUploadSuccess(fileUrl);
            showSuccess('fileUploadSuccess');
        } catch (error: any) {
            console.error("Upload process failed:", error);
            Sentry.captureException(error);
            showError(error.message || "File upload failed.");
        } finally {
            setUploading(false);
            dismiss(toastId);
        }
    };

    return (
        <div className={className || "border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-muted/50 transition-colors"}>
            {uploading ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-primary font-medium animate-pulse">Uploading...</p>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        id={`file-upload-${label}`}
                        onChange={handleFileChange}
                        disabled={uploading}
                        accept={accept}
                        className="hidden"
                    />
                    <label
                        htmlFor={`file-upload-${label}`}
                        className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                    >
                        {children ? (
                            children
                        ) : (
                            <>
                                <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
                                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                                    Choose a file
                                </span>
                            </>
                        )}
                    </label>
                </>
            )}
        </div>
    );
}