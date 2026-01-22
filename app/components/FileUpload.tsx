"use client";

import { useState } from "react";

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
    accept?: string;
    label?: string;
}

export default function FileUpload({ onUploadSuccess, accept, label = "Fichier JSON de l'automatisation" }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // 1. Demander l'URL présignée à notre API
            const res = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            });

            // VERIFICATION CRUCIALE
            if (!res.ok) {
                const errorText = await res.text(); // On lit le texte si ce n'est pas du JSON
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || "Erreur upload");
                } catch {
                    throw new Error(errorText || "Erreur serveur");
                }
            }

            const { uploadUrl, fileUrl } = await res.json();

            // 2. Envoyer le fichier directement à AWS S3
            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            onUploadSuccess(fileUrl);
            alert("Fichier envoyé avec succès !");
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-muted/50 transition-colors">
            {uploading ? (
                <p className="text-blue-500 font-medium animate-pulse">Téléchargement en cours...</p>
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
                        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
                        <span className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                            Choisir un fichier
                        </span>
                    </label>
                </>
            )}
        </div>
    );
}