import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ProductCard } from "@/app/components/products/product-card";
import { SearchBar } from "@/app/components/search/search-bar";

//récupère les produits en fonction de la recherche
async function getAutomations(searchQuery?: string) {
  "use server";
  try {
    await connectToDatabase();

    const filter: any = {};

    //on filtre le titre la description ou la catégorie pour les recherches
    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: "i" };
      filter.$or = [
        { title: regex },
        { description: regex },
        { category: regex }
      ];
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

// composant FRONTEND (Page)
interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";

  const automations = await getAutomations(query);

  return (
    <div className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative py-20 px-4 border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto text-center space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Automatisez votre business.
          </h1>
          <p className="text-xl text-muted-foreground">
            Des workflows testés et approuvés pour gagner du temps.
          </p>

          {/* Barre de recherche centrée */}
          <div className="pt-4 flex justify-center w-full">
            <div className="w-full max-w-md">
              <SearchBar />
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
              <ProductCard
                key={item._id}
                id={item._id}
                title={item.title}
                description={item.description}
                price={item.price}
                category={item.category}
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