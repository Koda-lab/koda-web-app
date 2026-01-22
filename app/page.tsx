import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User"; // Ajout du modèle User
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ProductCard } from "@/app/components/products/product-card";
import { SearchBar } from "@/app/components/search/search-bar";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server"; // Import auth

export const metadata: Metadata = {
  title: 'Koda - Marketplace d\'Automations No-Code',
  description: 'Achetez et vendez des workflows n8n, Make, Zapier, Python testés et approuvés. Automatisez votre business avec des templates prêts à l\'emploi.',
  keywords: ['automations', 'n8n', 'Make', 'Zapier', 'workflows', 'no-code', 'marketplace'],
  openGraph: {
    title: 'Koda - Marketplace d\'Automations',
    description: 'Des workflows testés et approuvés pour automatiser votre business',
    type: 'website',
  },
};

//récupère les produits en fonction de la recherche et des filtres
async function getAutomations(searchQuery?: string, platform?: string, category?: string, sellerId?: string) {
  "use server";
  try {
    await connectToDatabase();

    const filter: any = {};

    // Filtre texte : recherche dans titre, description
    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: "i" };
      filter.$or = [
        { title: regex },
        // { description: regex }, // J'ai commenté la description pour prioriser le titre comme demandé
      ];
    }

    // Filtre plateforme
    if (platform && platform !== "all") {
      filter.platform = platform;
    }

    // Filtre catégorie
    if (category && category !== "all") {
      filter.category = category;
    }

    // Filtre vendeur
    if (sellerId && sellerId !== "all") {
      filter.sellerId = sellerId;
    }

    // On récupère les données
    const automations = await Automation.find(filter)
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    // On nettoie les données pour React (les IDs Mongo deviennent des strings)
    return automations.map((a: any) => ({
      ...a,
      _id: a._id.toString(),
      createdAt: a.createdAt ? a.createdAt.toISOString() : null
    }));
  } catch (e) {
    console.error("Erreur MongoDB:", e);
    return [];
  }
}

// Récupère la liste des vendeurs actifs (ceux qui ont des produits)
async function getActiveSellers() {
  "use server";
  try {
    await connectToDatabase();

    // 1. Trouver tous les IDs de vendeurs distincts dans les produits
    const sellerIds = await Automation.distinct("sellerId");

    // 2. Récupérer les infos utilisateurs correspondantes
    const users = await User.find({ clerkId: { $in: sellerIds } })
      .select("clerkId firstName lastName username")
      .lean();

    return users.map((u: any) => ({
      value: u.clerkId,
      label: u.username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || "Vendeur"
    }));
  } catch (e) {
    console.error("Erreur récup vendeurs:", e);
    return [];
  }
}

// composant FRONTEND (Page)
interface HomeProps {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    category?: string;
    seller?: string;
  }>;
}

export default async function Home(props: HomeProps) {
  const { userId } = await auth(); // Récupération de l'utilisateur connecté
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const platform = searchParams.platform || "all";
  const category = searchParams.category || "all";
  const seller = searchParams.seller || "all";

  // Récupération parallèle pour perf
  const [automations, sellers] = await Promise.all([
    getAutomations(query, platform, category, seller),
    getActiveSellers()
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative py-20 px-4 border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto text-center space-y-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Automatisez votre business.
          </h1>
          <p className="text-xl text-muted-foreground">
            Des workflows testés et approuvés pour gagner du temps.
          </p>

          {/* Barre de recherche centrée */}
          <div className="pt-4 flex justify-center w-full">
            <div className="w-full flex justify-center">
              <SearchBar sellers={sellers} />
            </div>
          </div>
        </div>
      </section>

      {/* --- RESULTATS --- */}
      <main id="catalogue" className="container mx-auto py-16 px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">
            {query ? `Résultats pour "${query}"` : "Nouveautés"}
          </h2>
          {query && (
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Tout afficher
            </Link>
          )}
        </div>

        {automations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {automations.map((item: any) => (
              //Utilisation de item en lui meme et non ses propriétés
              <ProductCard
                key={item._id}
                product={item}
                userId={userId} // On passe l'ID de l'utilisateur connecté
              />
            ))}
          </div>
        ) : (
          /* Cas où on ne trouve rien */
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
            <h3 className="text-lg font-semibold">Aucun résultat trouvé 🔍</h3>
            <p className="text-muted-foreground mt-2">Essayez avec d'autres mots-clés.</p>
            <Button variant="link" asChild className="mt-4">
              <Link href="/">Voir tout le catalogue</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}