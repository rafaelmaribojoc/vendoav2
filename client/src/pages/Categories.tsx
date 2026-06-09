import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

export default function Categories() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({
    isOpen: false,
    id: null,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      handleCloseModal();
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData & { id: string }) =>
      api.put(`/categories/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      handleCloseModal();
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteConfirm({ isOpen: false, id: null });
    },
    onError: () => toast.error("Cannot delete category with products"),
  });

  const handleOpenModal = (category?: {
    id: string;
    name: string;
    description?: string;
  }) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ ...formData, id: editingId });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Organize your products by category
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600 icon-animated w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform" /> Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {categories?.map(
              (cat: {
                id: string;
                name: string;
                description?: string;
                _count: { products: number };
              }) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cat.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cat.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {cat._count.products} products
                    </span>
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 icon-hover-scale"
                    >
                      <Edit2 className="w-4 h-4 transition-transform" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ isOpen: true, id: cat.id })
                      }
                      className="p-2 text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 icon-hover-wiggle"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit" : "Add"} Category
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
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
                  className="px-4 py-2 text-white rounded-lg bg-primary-500"
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
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
