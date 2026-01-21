"use client";

import { useState } from "react";

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps ) {
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
        <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <input
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            {uploading && <p className="mt-2 text-blue-500">Téléchargement en cours...</p>}
        </div>
    );
}