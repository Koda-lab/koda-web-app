import { describe, it, expect } from 'vitest'
import { getPublicImageUrl } from '@/lib/image-helper'

describe('getPublicImageUrl', () => {
    it('returns the s3 url when provided', () => {
        const url = 'https://bucket.s3.amazonaws.com/image.jpg'
        expect(getPublicImageUrl(url)).toBe(url)
    })

    it('returns placeholder when url is null', () => {
        expect(getPublicImageUrl(null)).toBe('/placeholder-image.jpg')
    })

    it('returns placeholder when url is undefined', () => {
        expect(getPublicImageUrl(undefined)).toBe('/placeholder-image.jpg')
    })

    it('returns placeholder when url is empty string', () => {
        expect(getPublicImageUrl('')).toBe('/placeholder-image.jpg')
    })
})
