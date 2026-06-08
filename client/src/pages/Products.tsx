import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Camera,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";

// Lazy load BarcodeScanner to prevent @zxing/library from crashing the page
const BarcodeScanner = lazy(() => import("../components/BarcodeScanner"));

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  categoryId?: string;
  supplierId?: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

const emptyProduct = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  price: "",
  cost: "",
  stockQuantity: "",
  minStockLevel: "10",
  categoryId: "",
  supplierId: "",
};

export default function Products() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({
    isOpen: false,
    id: null,
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Handle barcode scan result from camera
  const handleBarcodeScan = (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode }));
    setShowBarcodeScanner(false);
    toast.success(`Barcode scanned: ${barcode}`);
  };

  // Fetch products with pagination
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", searchQuery, currentPage, pageSize],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: { search: searchQuery, page: currentPage, pageSize },
      });
      return response.data.data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data as Category[];
    },
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await api.get("/suppliers");
      return response.data.data as Supplier[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/products", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to create product");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const response = await api.put(`/products/${data.id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to update product");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleteConfirm({ isOpen: false, id: null });
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        description: product.description || "",
        price: product.price.toString(),
        cost: product.cost.toString(),
        stockQuantity: product.stockQuantity.toString(),
        minStockLevel: product.minStockLevel.toString(),
        categoryId: product.categoryId || "",
        supplierId: product.supplierId || "",
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
  };

  const handleGenerateSKU = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a product name first to generate a structured SKU");
      return;
    }

    // 1. Get Category Prefix (3 letters)
    let catPrefix = "GEN";
    if (formData.categoryId && categories) {
      const category = categories.find((c) => c.id === formData.categoryId);
      if (category) {
        catPrefix = category.name
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 3)
          .toUpperCase();
      }
    }

    // 2. Get Product Name abbreviation
    const cleanedName = formData.name.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    const words = cleanedName.split(/\s+/).filter(Boolean);
    let namePrefix = "";

    if (words.length >= 2) {
      // e.g. "Coca Cola" -> "CC"
      namePrefix = words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
    } else if (words.length === 1) {
      // e.g. "Apple" -> "APPL"
      namePrefix = words[0].slice(0, 4).toUpperCase();
    }

    if (!namePrefix) {
      namePrefix = "PROD";
    }

    // 3. Add random numeric suffix for uniqueness (100-999)
    const randomNum = Math.floor(100 + Math.random() * 900);

    const generatedSku = `${catPrefix}-${namePrefix}-${randomNum}`;
    setFormData((prev) => ({ ...prev, sku: generatedSku }));
    toast.success(`Generated SKU: ${generatedSku}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.price || !formData.cost) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ ...formData, id: editingProduct.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const products = productsData?.products || [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your product inventory
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white transition rounded-lg bg-primary-500 hover:bg-primary-600 icon-animated w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
        <div className="relative">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search products..."
            className="w-full py-2 pl-10 pr-4 text-gray-900 bg-white border rounded-lg outline-none dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-left text-gray-500 dark:text-gray-300">
                    Product
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left text-gray-500 dark:text-gray-300">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left text-gray-500 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-right text-gray-500 dark:text-gray-300">
                    Price
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-right text-gray-500 dark:text-gray-300">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-right text-gray-500 dark:text-gray-300">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-right text-gray-500 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {products.map((product: Product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      {product.barcode && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.barcode}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-right text-gray-900 dark:text-white">
                      ₱{Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                      ₱{Number(product.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 ${product.stockQuantity === 0
                            ? "text-red-600"
                            : product.stockQuantity <= product.minStockLevel
                              ? "text-orange-600"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                      >
                        {product.stockQuantity <= product.minStockLevel && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-gray-400 rounded-lg hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600 icon-hover-scale"
                        >
                          <Edit2 className="w-4 h-4 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 rounded-lg hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 icon-hover-wiggle"
                        >
                          <Trash2 className="w-4 h-4 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {productsData && productsData.totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={productsData.totalPages}
            totalItems={productsData.total}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            showPageSizeSelector={false}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="px-3 py-2 text-primary-600 transition bg-primary-50 border border-primary-200 rounded-lg dark:bg-primary-900/30 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 dark:text-primary-400 text-sm font-medium shrink-0"
                    >
                      Auto-Gen
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      placeholder="Enter or scan barcode"
                      className="flex-1 px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-700 transition bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 dark:text-gray-200 icon-animated shrink-0"
                      title="Scan barcode with camera"
                    >
                      <Camera className="w-4 h-4 transition-transform" />
                      <span className="hidden sm:inline text-sm">Scan</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    disabled={!!editingProduct}
                  />
                  {editingProduct && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use Stock page to adjust quantity
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockLevel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select supplier</option>
                    {suppliers?.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="w-full px-3 py-2 text-gray-900 bg-white border rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 border rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          }
        >
          <div className="z-[60]">
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setShowBarcodeScanner(false)}
            />
          </div>
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
