"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import { createAutomation } from "@/app/actions/automation";
import { useRouter } from "next/navigation";

export default function SellPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 0,
        category: "n8n",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl) return alert("Veuillez uploader votre fichier d'automatisation");

        setLoading(true);
        try {
            await createAutomation({ ...formData, fileUrl });
            alert("Produit mis en ligne !");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise en vente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Vendre une automatisation</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Titre de l'automatisation</label>
                    <input
                        required
                        className="w-full p-2 border rounded"
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block mb-1">Description</label>
                    <textarea
                        required
                        className="w-full p-2 border rounded"
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1">Prix (€)</label>
                        <input
                            type="number"
                            required
                            className="w-full p-2 border rounded"
                            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Catégorie</label>
                        <select
                            className="w-full p-2 border rounded"
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="n8n">n8n</option>
                            <option value="Make">Make</option>
                            <option value="Zapier">Zapier</option>
                        </select>
                    </div>
                </div>

                <div className="py-4">
                    <label className="block mb-2 font-semibold">Fichier JSON de l'automatisation</label>
                    <FileUpload onUploadSuccess={(url) => setFileUrl(url)} />
                    {fileUrl && <p className="text-green-600 text-sm mt-1">✓ Fichier prêt</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? "Chargement..." : "Publier sur Koda"}
                </button>
            </form>
        </div>
    );
}