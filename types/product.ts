export enum ProductCategory {
    SOCIAL_MEDIA = 'Social Media',
    EMAIL_MARKETING = 'Email Marketing',
    PRODUCTIVITY = 'Productivity',
    SALES = 'Sales',
    OTHER = 'Other'
}



export interface IProduct {
    _id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    category: ProductCategory;
    previewImageUrl?: string;
    tags?: string[];
    createdAt: string | Date;
    updatedAt: string | Date;

    averageRating?: number;
    reviewCount?: number;
    seller?: {
        username?: string;
        firstName?: string;
    };
}