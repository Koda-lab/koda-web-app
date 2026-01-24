
import { IProduct } from './product';

export type AutomationPlatform = 'n8n' | 'Make' | 'Zapier' | 'Python' | 'Other';

// Principe de substitution de Liskov
export interface IAutomation extends IProduct {
    platform: AutomationPlatform;
    fileUrl: string; // Le fichier d'export JSON ou blueprint
    version?: string;
}


export type CreateAutomationInput = Omit<IAutomation, '_id' | 'createdAt' | 'updatedAt' | 'sellerId'>;