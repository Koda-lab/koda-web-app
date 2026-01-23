import {
    SiN8N,
    SiMake,
    SiZapier,
    SiPython,
    SiOpenai,
    SiGoogleads
} from "react-icons/si";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
    platform: string;
    className?: string;
}



export function PlatformIcon({ platform, className }: PlatformIconProps) {
    // Normalisation : on met tout en minuscule et on enlève les espaces
    const normalizedKey = platform?.toLowerCase().replace(/\s+/g, "") || "";



    // on peut ajouter d'autres icônes ici si besoin
    const icons: Record<string, React.ElementType> = {
        n8n: SiN8N,
        make: SiMake,
        zapier: SiZapier,
        python: SiPython,
        openai: SiOpenai,
        googleads: SiGoogleads,
        // Ajoute d'autres clés ici si besoin (ex: 'airtable', 'notion')
    };

    // Ajoute un mapping de couleurs
    const brandColors: Record<string, string> = {
        n8n: "group-hover:text-[#EA4B71]",   // Rose n8n
        make: "group-hover:text-[#663399]",  // Violet Make
        zapier: "group-hover:text-[#FF4F00]", // Orange Zapier
        python: "group-hover:text-[#3776AB]", // Bleu Python
    };

    const IconComponent = icons[normalizedKey] || Box; // Box est l'icône par défaut si non trouvé

    const colorClass = brandColors[normalizedKey] || "group-hover:text-primary";

    return (
        <IconComponent
            className={cn("w-5 h-5 transition-colors duration-300", colorClass, className)}
        />
    );

}