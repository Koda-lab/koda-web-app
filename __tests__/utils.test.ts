import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
    it('cn() merges class names correctly', () => {
        const result = cn('bg-red-500', 'text-white', { 'p-4': true, 'hidden': false })
        expect(result).toContain('bg-red-500')
        expect(result).toContain('text-white')
        expect(result).toContain('p-4')
        expect(result).not.toContain('hidden')
    })
})
