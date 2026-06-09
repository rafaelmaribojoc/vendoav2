import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({
    isOpen: false,
    id: null,
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await api.get("/suppliers")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created");
      handleCloseModal();
    },
    onError: () => toast.error("Failed to create supplier"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData & { id: string }) =>
      api.put(`/suppliers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated");
      handleCloseModal();
    },
    onError: () => toast.error("Failed to update supplier"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
      setDeleteConfirm({ isOpen: false, id: null });
    },
    onError: () => toast.error("Cannot delete supplier with products"),
  });

  const handleOpenModal = (supplier?: typeof formData & { id: string }) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingId
      ? updateMutation.mutate({ ...formData, id: editingId })
      : createMutation.mutate(formData);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suppliers
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your product suppliers
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 icon-animated w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform" /> Add Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {suppliers?.map(
              (
                sup: typeof formData & {
                  id: string;
                  _count: { products: number };
                }
              ) => (
                <div
                  key={sup.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {sup.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {sup.contactPerson} • {sup.email} • {sup.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {sup._count.products} products
                    </span>
                    <button
                      onClick={() => handleOpenModal(sup)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 icon-hover-scale"
                    >
                      <Edit2 className="w-4 h-4 transition-transform" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ isOpen: true, id: sup.id })
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-red-500 icon-hover-wiggle"
                    >
                      <Trash2 className="w-4 h-4 transition-transform" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit" : "Add"} Supplier
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() =>
          deleteConfirm.id && deleteMutation.mutate(deleteConfirm.id)
        }
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
