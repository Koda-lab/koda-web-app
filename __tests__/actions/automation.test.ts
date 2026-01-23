import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAutomation } from '@/app/actions/automation'
import * as Clerk from '@clerk/nextjs/server'
import Automation from '@/models/Automation'
import User from '@/models/User'

// Mocks
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
    currentUser: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
    connectToDatabase: vi.fn(),
}))

vi.mock('@/models/Automation', () => ({
    default: {
        create: vi.fn(),
    }
}))

vi.mock('@/models/User', () => ({
    default: {
        findOne: vi.fn(),
    }
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('createAutomation Action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should throw error if user is not authenticated', async () => {
        // Mock auth to return null
        vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: null } as any)

        const formData = {
            title: 'Test Auto',
            description: 'Desc',
            price: 10,
            platform: 'n8n',
            fileUrl: 'http://foo.com',
            category: 'Sales',
            version: '1.0'
        } as any

        await expect(createAutomation(formData)).rejects.toThrow("Vous devez être connecté")
    })

    it('should throw error if data is invalid (zod)', async () => {
        vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)

        const invalidData = {
            title: '', // Invalid empty title
            price: -5, // Invalid price
        } as any

        await expect(createAutomation(invalidData)).rejects.toThrow()
    })

    it('should throw check for stripe onboarding', async () => {
        vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)

        // Mock User found but NO stripe connected
        vi.mocked(User.findOne).mockResolvedValue({
            stripeConnectId: null
        })

        const validData = {
            title: 'Valid Auto',
            description: 'Long enough description',
            price: 10,
            platform: 'n8n',
            fileUrl: 'https://example.com/file',
            category: 'Sales',
            version: '1.0'
        } as any

        await expect(createAutomation(validData)).rejects.toThrow("Veuillez configurer votre compte de paiement")
    })

    it('should create automation if everything is valid', async () => {
        vi.spyOn(Clerk, 'auth').mockResolvedValue({ userId: 'user_123' } as any)

        // Mock User WITH stripe connected
        vi.mocked(User.findOne).mockResolvedValue({
            stripeConnectId: 'acct_123',
            onboardingComplete: true
        })

        // Mock Create success
        vi.mocked(Automation.create).mockResolvedValue({
            _id: 'auto_123'
        })

        const validData = {
            title: 'Valid Auto',
            description: 'Long enough description',
            price: 10,
            platform: 'n8n',
            fileUrl: 'https://example.com/file',
            category: 'Sales', // Must match enum
            version: '1.0'
        } as any

        const result = await createAutomation(validData)

        expect(result.success).toBe(true)
        expect(result.id).toBe('auto_123')
        expect(Automation.create).toHaveBeenCalled()
    })
})
