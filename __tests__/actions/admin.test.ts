import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllUsers, updateUserRole, toggleBanUser } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth-utils";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

// Mock Stripe first to prevent initialization errors
vi.mock("stripe", () => ({
    default: vi.fn().mockImplementation(() => ({
        accounts: {
            retrieve: vi.fn(),
            del: vi.fn(),
        },
    })),
}));

// Mocks
vi.mock("@/lib/auth-utils", () => ({
    requireAdmin: vi.fn(),
}));

vi.mock("@/models/User", () => ({
    default: {
        find: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    lean: vi.fn()
                })
            })
        }),
        findOneAndUpdate: vi.fn(),
        findOne: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    }
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
    clerkClient: vi.fn().mockResolvedValue({
        users: {
            getUser: vi.fn().mockResolvedValue({
                emailAddresses: [{ emailAddress: "test@test.com" }],
                firstName: "Test",
                lastName: "User",
                imageUrl: "img",
                username: "testuser"
            }),
            getUserList: vi.fn(),
        }
    }),
}));

describe("admin actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAllUsers", () => {
        it("should return list of users", async () => {
            const mockUsers = [
                { _id: "u1", clerkId: "c1", email: "u1@test.com", createdAt: new Date() }
            ];
            vi.mocked(requireAdmin).mockResolvedValue({} as any);
            vi.mocked(User.find().select().sort().lean as any).mockResolvedValue(mockUsers);

            const result = await getAllUsers();
            expect(result).toHaveLength(1);
            expect(result[0]._id).toBe("u1");
        });
    });

    describe("updateUserRole", () => {
        it("should update user role and revalidate", async () => {
            vi.mocked(requireAdmin).mockResolvedValue({} as any);
            const result = await updateUserRole("user_123", "admin");
            expect(result.success).toBe(true);
            expect(User.findOneAndUpdate).toHaveBeenCalledWith({ clerkId: "user_123" }, { role: "admin" });
            expect(revalidatePath).toHaveBeenCalledWith("/admin");
        });
    });

    describe("toggleBanUser", () => {
        it("should throw error if admin tries to ban themselves", async () => {
            const adminId = "admin_123";
            vi.mocked(requireAdmin).mockResolvedValue({ clerkId: adminId } as any);
            await expect(toggleBanUser(adminId)).rejects.toThrow("You cannot ban yourself.");
        });

        it("should toggle ban status of a user", async () => {
            vi.mocked(requireAdmin).mockResolvedValue({ clerkId: "admin" } as any);
            const mockUser = { clerkId: "u1", isBanned: false, save: vi.fn() };
            vi.mocked(User.findOne).mockResolvedValue(mockUser);

            const result = await toggleBanUser("u1");
            expect(result.isBanned).toBe(true);
            expect(mockUser.save).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith("/admin");
        });
    });
});
