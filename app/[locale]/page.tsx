import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User";
import Purchase from "@/models/Purchase";
import { Link } from '@/i18n/routing';
import { Button } from "@/app/components/ui/button";
import { ProductCard } from "@/app/components/products/product-card";
import { SearchBar } from "@/app/components/search/search-bar";
import { FadeIn } from "@/app/components/ui/fade-in";
import { MovingIcons } from "@/app/components/home/moving-icons";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Koda - Marketplace d\'Automations No-Code',
  description: 'Achetez et vendez des workflows n8n, Make, Zapier, Python testés et approuvés.',
};

async function getAutomations(searchQuery?: string, platform?: string, category?: string, sellerId?: string) {
  "use server";
  try {
    await connectToDatabase();
    const filter: any = {};
    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: "i" };
      filter.$or = [{ title: regex }];
    }
    if (platform && platform !== "all") filter.platform = platform;
    if (category && category !== "all") filter.category = category;
    if (sellerId && sellerId !== "all") filter.sellerId = sellerId;

    // Limite à 18 pour un multiple de 3 (grille complète)
    const automations = await Automation.find(filter)
      .sort({ createdAt: -1 })
      .limit(9)
      .lean();

    const sellerIds = [...new Set(automations.map((a: any) => a.sellerId))];
    const sellers = await User.find({ clerkId: { $in: sellerIds } })
      .select("clerkId username firstName lastName")
      .lean();
    const sellerMap = new Map(sellers.map((s: any) => [s.clerkId, s]));

    return automations.map((a: any) => {
      const seller = sellerMap.get(a.sellerId);
      return {
        ...a,
        _id: a._id.toString(),
        createdAt: a.createdAt ? a.createdAt.toISOString() : null,
        seller: seller ? {
          username: seller.username || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || "Vendeur"
        } : null
      };
    });
  } catch (e) {
    console.error("Erreur MongoDB:", e);
    return [];
  }
}



interface HomeProps {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    category?: string;
    seller?: string;
  }>;
}

export default async function Home(props: HomeProps) {
  const t = await getTranslations('HomePage');
  const { userId } = await auth();
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const platform = searchParams.platform || "all";
  const category = searchParams.category || "all";
  const seller = searchParams.seller || "all";

  const automations = await getAutomations(query, platform, category, seller);

  const purchasedProductIds = new Set<string>();
  if (userId) {
    await connectToDatabase();
    const purchases = await Purchase.find({ buyerId: userId }).select("productId");
    purchases.forEach(p => purchasedProductIds.add(p.productId.toString()));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-44 pb-20 px-4 border-b bg-gradient-to-b from-muted/50 to-background overflow-hidden">
        <div className="container mx-auto text-center space-y-6 max-w-4xl relative z-10">
          <FadeIn direction="down" delay={0}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              {t('title')}
            </h1>
          </FadeIn>

          <FadeIn direction="down" delay={0.1}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.2} className="w-full pt-8">
            <MovingIcons />
          </FadeIn>

          <FadeIn direction="up" delay={0.4} className="pt-12 flex flex-col items-center gap-6 w-full">
            <div className="w-full flex justify-center">
              <SearchBar />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- CATALOGUE (GRILLE STANDARD) --- */}
      <main id="catalogue" className="container mx-auto py-24 px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {category !== "all" ? category : (query ? `Résultats pour "${query}"` : "Nouveautés")}
            </h2>
            <p className="text-muted-foreground mt-2">Découvrez les dernières automatisations ajoutées.</p>
          </div>

          {(query || category !== "all") && (
            <Link href="/" className="text-sm font-medium text-primary hover:underline bg-primary/10 px-4 py-2 rounded-full transition-colors hover:bg-primary/20">
              Tout effacer
            </Link>
          )}
        </div>

        {automations.length > 0 ? (
          // GRILLE STANDARD : 1 col mobile, 2 cols tablette, 3 cols desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {automations.map((item, index) => (
              <FadeIn
                key={item._id}
                // Délai progressif simple (0, 0.05, 0.10, 0.15...)
                // On garde le modulo pour éviter que les éléments tout en bas n'attendent 10 secondes pour apparaître
                delay={(index % 6) * 0.1}
                direction="up"
                className="h-full"
              >
                <ProductCard
                  product={item}
                  userId={userId}
                  isPurchased={purchasedProductIds.has(item._id.toString())}
                />
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn>
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
              <h3 className="text-lg font-semibold">Aucun résultat trouvé 🔍</h3>
              <p className="text-muted-foreground mt-2">
                Aucune automatisation ne correspond à vos filtres.
              </p>
              <Button variant="link" asChild className="mt-4">
                <Link href="/">Effacer les filtres</Link>
              </Button>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}