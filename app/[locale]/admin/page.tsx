import { getAllUsers } from "@/app/actions/admin";
import { AdminRestoreButton } from "@/app/components/admin/admin-restore-button";
import { AdminBanButton } from "@/app/components/admin/admin-ban-button";
import { AdminRoleButton } from "@/app/components/admin/admin-role-button";

export default async function AdminDashboard() {
    const users = await getAllUsers();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
                <AdminRestoreButton />
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="p-4">Utilisateur</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rôle</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: any) => (
                            <tr key={user._id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-900 ${user.isBanned ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                <td className="p-4 text-sm font-medium">
                                    <div className="font-medium">
                                        {user.username || user.firstName ?
                                            (user.username || `${user.firstName} ${user.lastName || ''}`) :
                                            <span className="text-gray-400 italic">Sans nom</span>
                                        }
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">
                                        {user.clerkId}
                                        {user.stripeConnectId && <span className="text-green-600 ml-2">(Seller)</span>}
                                        {user.isBanned && <span className="text-red-600 ml-2 font-bold">[BANNI]</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-sm">
                                    {user.email ? (
                                        user.email
                                    ) : (
                                        <span className="text-orange-300 text-xs px-2 py-1 bg-orange-900/20 rounded">Email manquant</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <AdminRoleButton userId={user._id} currentRole={user.role} />
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <AdminBanButton userId={user._id} isBanned={!!user.isBanned} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
