import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { notFound, redirect } from "next/navigation";
import { EditForm } from "@/app/components/forms/edit-form";

interface EditPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = await params;

    await connectToDatabase();
    const product = await Automation.findById(id).lean();

    if (!product) notFound();

    // Sécurité : seul le vendeur peut modifier
    if (product.sellerId !== userId) {
        return <div className="p-10 text-center text-red-500">Vous n'êtes pas autorisé à modifier ce produit.</div>;
    }

    // Conversion en objet simple pour le composant client
    const serializedProduct = {
        _id: product._id.toString(),
        title: product.title,
        description: product.description,
        price: product.price,
        previewImageUrl: product.previewImageUrl,
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 text-primary italic">Mode Édition</h1>
            <EditForm product={serializedProduct} />
        </div>
    );
}
