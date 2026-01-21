export interface IAutomation {
    _id: string;
    title: string;
    description: string;
    price: number;
    category: 'n8n' | 'Make' | 'Zapier'; // On utilise les valeurs exactes de votre enum
    fileUrl: string;
    previewImageUrl?: string;
    sellerId: string;
    createdAt: Date;
}

// Type pour la création (sans l'ID ni la date)
export type CreateAutomationInput = Omit<IAutomation, '_id' | 'createdAt'>;