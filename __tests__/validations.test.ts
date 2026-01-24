import { describe, it, expect } from "vitest";
import { AutomationSchema } from "@/lib/validations";
import { ProductCategory } from "@/types/product";

describe("AutomationSchema Validation", () => {
    const validAutomation = {
        title: "Valid Automation",
        description: "This is a valid description with more than 20 chars.",
        price: 50,
        category: ProductCategory.SOCIAL_MEDIA,
        platform: "n8n",
        tags: ["test", "automation"],
        fileUrl: "https://example.com/file.json",
        previewImageUrl: "https://example.com/image.png",
        version: "1.0.0"
    };

    it("should validate a correct automation object", () => {
        const result = AutomationSchema.safeParse(validAutomation);
        expect(result.success).toBe(true);
    });

    it("should fail if title is too short", () => {
        const result = AutomationSchema.safeParse({ ...validAutomation, title: "No" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("3 caractères");
        }
    });

    it("should fail if price is out of range", () => {
        const resultLow = AutomationSchema.safeParse({ ...validAutomation, price: 0 });
        expect(resultLow.success).toBe(false);

        const resultHigh = AutomationSchema.safeParse({ ...validAutomation, price: 2000 });
        expect(resultHigh.success).toBe(false);
    });

    it("should fail if fileUrl is not a URL", () => {
        const result = AutomationSchema.safeParse({ ...validAutomation, fileUrl: "not-a-url" });
        expect(result.success).toBe(false);
    });

    it("should allow optional previewImageUrl to be empty or missing", () => {
        const resultEmpty = AutomationSchema.safeParse({ ...validAutomation, previewImageUrl: "" });
        expect(resultEmpty.success).toBe(true);

        const { previewImageUrl, ...missing } = validAutomation;
        const resultMissing = AutomationSchema.safeParse(missing);
        expect(resultMissing.success).toBe(true);
    });
});
