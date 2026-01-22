export interface IAutomation {
    _id: string;
    title: string;
    description: string;
    price: number;
    category: 'n8n' | 'Make' | 'Zapier' | 'Autre'; // On utilise les valeurs exactes de votre enum
    fileUrl: string;
    previewImageUrl?: string;
    sellerId: string;
    createdAt: Date;
}

// Type pour la création (sans l'ID ni la date ni le sellerId qui est géré par le serveur)
export type CreateAutomationInput = Omit<IAutomation, '_id' | 'createdAt' | 'sellerId'>;