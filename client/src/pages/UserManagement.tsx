import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import ConfirmModal from "../components/ConfirmModal";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "manager" | "cashier";
  isActive: boolean;
  createdAt: string;
  _count: {
    sales: number;
  };
}

const roleColors = {
  admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  cashier: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const roleIcons = {
  admin: ShieldCheck,
  manager: Shield,
  cashier: UserIcon,
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    role: "cashier" as "admin" | "manager" | "cashier",
    isActive: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data.data as User[],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/users", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const message = response.data.message || "User created successfully";
      if (response.data.emailSent) {
        toast.success(message, { duration: 5000 });
      } else {
        toast.success(message, { duration: 5000 });
        toast("Check server logs for temporary password", {
          icon: "ℹ️",
          duration: 6000,
        });
      }
      handleCloseModal();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<typeof formData>) =>
      api.put(`/users/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      handleCloseModal();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(response.data.message || "User deleted");
      setDeleteConfirm({ isOpen: false, user: null });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || "Failed to delete user");
    },
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        fullName: "",
        email: "",
        role: "cashier",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: "",
      fullName: "",
      email: "",
      role: "cashier",
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: Record<string, unknown> = { id: editingUser.id };
      if (formData.username !== editingUser.username)
        updateData.username = formData.username;
      if (formData.fullName !== editingUser.fullName)
        updateData.fullName = formData.fullName;
      if (formData.email !== editingUser.email)
        updateData.email = formData.email;
      if (formData.role !== editingUser.role) updateData.role = formData.role;
      if (formData.isActive !== editingUser.isActive)
        updateData.isActive = formData.isActive;
      updateMutation.mutate(
        updateData as { id: string } & Partial<typeof formData>
      );
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Cannot delete your own account");
      return;
    }
    setDeleteConfirm({ isOpen: true, user });
  };

  const activeUsers = users?.filter((u) => u.isActive) || [];
  const inactiveUsers = users?.filter((u) => !u.isActive) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage cashiers and staff accounts
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 icon-animated w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform" />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users?.length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeUsers.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inactive
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inactiveUsers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No users found</p>
            <p className="text-sm mt-1">Add your first user to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                    Sales
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Created
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  const isCurrentUser = user.id === currentUser?.id;
                  const canEdit =
                    currentUser?.role === "admin" ||
                    (currentUser?.role === "manager" &&
                      user.role === "cashier");

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!user.isActive ? "opacity-60" : ""
                        }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                              {(user.fullName || user.username)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.fullName || user.username}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-primary-500">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full capitalize ${roleColors[user.role]
                            }`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${user.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {user._count.sales}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg icon-hover-scale"
                            >
                              <Edit2 className="w-4 h-4 transition-transform" />
                            </button>
                            {!isCurrentUser && (
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg icon-hover-wiggle"
                              >
                                <Trash2 className="w-4 h-4 transition-transform" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Juan Dela Cruz"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                {!editingUser && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    A secure password will be auto-generated and sent to this
                    email
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "manager" | "cashier",
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={currentUser?.role === "manager"}
                  >
                    <option value="cashier">Cashier</option>
                    {currentUser?.role === "admin" && (
                      <>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </>
                    )}
                  </select>
                  {currentUser?.role === "manager" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Managers can only create cashiers
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "active",
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingUser ? (
                    "Update User"
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
        onConfirm={() =>
          deleteConfirm.user && deleteMutation.mutate(deleteConfirm.user.id)
        }
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.user?.fullName ||
          deleteConfirm.user?.username ||
          "this user"
          }? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
