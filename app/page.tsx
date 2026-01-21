import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ProductCard } from "@/app/components/products/product-card";
import { IAutomation } from "@/types/automation";


export default async function Home() {
  // Fonction serveur pour récupérer les données
  async function getAutomations() {
    "use server";
    try {
      await connectToDatabase();
      // On récupère les items et on transforme _id et createdAt en string/value simple
      // pour éviter les warnings de sérialisation React
      const automations = await Automation.find().sort({ createdAt: -1 }).limit(12).lean();

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

  const automations = await getAutomations();

  return (
    <div className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative py-20 px-4 border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto text-center space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Automatisez votre business <span className="text-primary">sans coder</span>.
          </h1>
          <p className="text-xl text-muted-foreground">
            Découvrez des workflows vérifiés, prêts à l'emploi. Gagnez du temps dès aujourd'hui.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full text-base px-8">
              <Link href="#catalogue">Explorer le catalogue</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full text-base px-8">
              <Link href="/sell">Vendre une automatisation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- CATALOGUE --- */}
      <main id="catalogue" className="container mx-auto py-16 px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Nouveautés</h2>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline underline-offset-4">
            Tout voir &rarr;
          </Link>
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
          /* Empty State (État vide joli) */
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
            <h3 className="text-xl font-semibold">Le catalogue est vide pour le moment</h3>
            <p className="text-muted-foreground mt-2">Soyez le premier à publier une automatisation !</p>
            <Button asChild className="mt-6">
              <Link href="/sell">Créer une annonce</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}