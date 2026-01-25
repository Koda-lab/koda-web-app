import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAutomation } from '@/app/actions/automation'
import { getFilteredProducts } from '@/app/actions/products'
import { deleteProduct, updateProduct } from '@/app/actions/product-management'
import * as Clerk from '@clerk/nextjs/server'
import Automation from '@/models/Automation'
import { Product } from '@/models/Product'
import User from '@/models/User'
import { revalidatePath } from 'next/cache'
import { getOrSetCache, invalidateCache } from '@/lib/cache-utils'

// Mock Redis first to prevent initialization errors
vi.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: vi.fn(() => ({
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            keys: vi.fn(),
        })),
    },
}))

// Mocks
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
    currentUser: vi.fn(),
    clerkClient: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
    connectToDatabase: vi.fn(),
}))

vi.mock('@/models/Automation', () => ({
    default: {
        create: vi.fn(),
        findOne: vi.fn(),
    }
}))

vi.mock('@/models/Product', () => ({
    Product: {
        find: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn()
            })
        }),
        findOne: vi.fn(),
        deleteOne: vi.fn(),
    }
}))

vi.mock('@/models/User', () => ({
    default: {
        findOne: vi.fn(),
        find: vi.fn().mockReturnValue({
            lean: vi.fn()
        })
    }
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('@/lib/cache-utils', () => ({
    getOrSetCache: vi.fn((key, fn) => fn()),
    invalidateCache: vi.fn(),
}))

vi.mock('@/lib/stripe-utils', () => ({
    ensureSellerIsReady: vi.fn(),
}))

describe('Product Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Product Creation (createAutomation)', () => {
        it('should throw error if user is not authenticated', async () => {
            vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: null } as any)
            const formData = { title: 'Test' } as any
            await expect(createAutomation(formData)).rejects.toThrow("Unauthorized: User is declared but not authenticated")
        })

        it('should create automation if everything is valid', async () => {
            vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)
            vi.mocked(User.findOne).mockResolvedValue({ stripeConnectId: 'acct_123', onboardingComplete: true })
            vi.mocked(Automation.create).mockResolvedValue({ _id: 'auto_123' })

            const validData = {
                title: 'Valid Auto',
                description: 'Long enough description more than 20 chars',
                price: 10,
                platform: 'n8n',
                fileUrl: 'https://example.com/file',
                category: 'Social Media',
                version: '1.0'
            } as any

            const result = await createAutomation(validData)
            expect(result.success).toBe(true)
            expect(Automation.create).toHaveBeenCalled()
        })
    })

    describe('Product Management (update/delete)', () => {
        it('deleteProduct should succeed if user is owner', async () => {
            vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)
            vi.mocked(User.findOne).mockResolvedValue({ clerkId: 'user_123' })
            vi.mocked(Product.findOne).mockResolvedValue({ sellerId: 'user_123' })
            vi.mocked(Product.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

            const result = await deleteProduct('prod_123')
            expect(result.success).toBe(true)
            expect(Product.deleteOne).toHaveBeenCalledWith({ _id: 'prod_123' })
        })

        it('updateProduct should update fields correctly', async () => {
            vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)
            vi.mocked(User.findOne).mockResolvedValue({ clerkId: 'user_123' })
            const mockProduct = {
                sellerId: 'user_123',
                save: vi.fn().mockResolvedValue({}),
                title: '', description: '', price: 0
            }
            vi.mocked(Automation.findOne).mockResolvedValue(mockProduct as any)

            const updateData = { title: 'New Title', description: 'Updated description over 20 chars', price: 99 }
            const result = await updateProduct('prod_123', updateData)

            expect(result.success).toBe(true)
            expect(mockProduct.title).toBe('New Title')
            expect(mockProduct.save).toHaveBeenCalled()
        })
    })

    describe('Product Filtering (getFilteredProducts)', () => {
        it('should call getOrSetCache and return list from DB', async () => {
            const mockProducts = [{ title: 'P1', sellerId: 's1', _id: { toString: () => 'id1' } }]
            vi.mocked(Product.find().sort().lean as any).mockResolvedValue(mockProducts)
            vi.mocked(User.find().lean as any).mockResolvedValue([{ clerkId: 's1', username: 'seller1' }])

            const result = await getFilteredProducts({ query: 'test' })
            expect(getOrSetCache).toHaveBeenCalled()
            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('P1')
            expect(result[0].seller.username).toBe('seller1')
        })
    })
})
