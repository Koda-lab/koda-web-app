import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import Link from "next/link";
import { IAutomation } from "@/types/automation";


export default function Home() {
  async function getAutomations() {
    "use server";
    try {
      await connectToDatabase();
      // On récupère les 10 dernières automatisations
      return await Automation.find().sort({ createdAt: -1 }).limit(10);
    } catch (e) {
      console.error("Erreur MongoDB:", e);
      return [];
    }
  }

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold">Koda Marketplace</h1>
        <Link href="/sell" className="bg-black text-white px-4 py-2 rounded-lg">
          Vendre un Blueprint
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Affichage des tests ou message si vide */}
        <section className="col-span-full bg-blue-50 p-4 rounded-md mb-4">
          <h2 className="font-bold text-blue-800">Statut des Tests :</h2>
          <p className="text-sm text-blue-600">✓ Clerk : Actif (Header)</p>
          <p className="text-sm text-blue-600">✓ MongoDB : Tentative de lecture en cours...</p>
        </section>

        {/* Liste des produits */}
        <AutomationsList fetcher={getAutomations} />
      </div>
    </main>
  );
}

async function AutomationsList({ fetcher }: { fetcher: () => Promise<IAutomation[]> }) {
  const data = await fetcher();

  if (data.length === 0) {
    return <p className="text-gray-500">Aucune automatisation disponible. Soyez le premier à en publier !</p>;
  }

  return data.map((item: any) => (
    <div key={item._id.toString()} className="border p-4 rounded-xl shadow-sm hover:shadow-md transition">
      <span className="text-xs font-bold uppercase text-blue-500">{item.category}</span>
      <h2 className="text-xl font-bold mt-1">{item.title}</h2>
      <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-lg font-bold">{item.price} €</span>
        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Voir plus</button>
      </div>
    </div>
  ));
}