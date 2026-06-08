import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import Pagination from "../components/Pagination";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

export default function StockMovements() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    reason: "purchase",
    notes: "",
  });
  const [actionType, setActionType] = useState<"receive" | "adjust">("receive");

  // Searchable product selector state
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["stock-movements", currentPage, pageSize],
    queryFn: async () =>
      (
        await api.get("/stock/movements", {
          params: { page: currentPage, pageSize },
        })
      ).data.data,
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () =>
      (await api.get("/products?pageSize=500")).data.data.products,
  });

  // Filter products based on search
  const filteredProducts =
    products?.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, productId: product.id });
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const clearSelectedProduct = () => {
    setSelectedProduct(null);
    setFormData({ ...formData, productId: "" });
    setProductSearch("");
  };

  const receiveMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      quantity: number;
      reason: string;
      notes: string;
    }) => api.post("/stock/receive", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock received");
      setShowModal(false);
    },
    onError: () => toast.error("Failed to receive stock"),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      quantity: number;
      reason: string;
      notes: string;
    }) => api.post("/stock/adjust", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock adjusted");
      setShowModal(false);
    },
    onError: () => toast.error("Failed to adjust stock"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      toast.error("Please select a product");
      return;
    }
    const data = { ...formData, quantity: parseInt(formData.quantity) };
    actionType === "receive"
      ? receiveMutation.mutate(data)
      : adjustMutation.mutate(data);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stock Movements
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track inventory changes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActionType("receive");
              setShowModal(true);
              setFormData({
                productId: "",
                quantity: "",
                reason: "purchase",
                notes: "",
              });
              setSelectedProduct(null);
              setProductSearch("");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 icon-animated text-sm sm:text-base"
          >
            <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" />{" "}
            <span className="hidden sm:inline">Receive</span> Stock
          </button>
          <button
            onClick={() => {
              setActionType("adjust");
              setShowModal(true);
              setFormData({
                productId: "",
                quantity: "",
                reason: "adjustment",
                notes: "",
              });
              setSelectedProduct(null);
              setProductSearch("");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 icon-animated text-sm sm:text-base"
          >
            <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" />{" "}
            <span className="hidden sm:inline">Adjust</span> Stock
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {movementsData?.movements?.map(
                  (m: {
                    id: string;
                    createdAt: string;
                    product: { name: string; sku: string };
                    type: string;
                    reason: string;
                    quantity: number;
                    user: { username: string };
                  }) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {m.product.name}
                        </span>
                        <br />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {m.product.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${m.type === "in"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                        >
                          {m.type === "in" ? "IN" : "OUT"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">
                        {m.reason.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {m.type === "in" ? "+" : "-"}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {m.user.username}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {movementsData && movementsData.totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={movementsData.totalPages}
            totalItems={movementsData.total}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            showPageSizeSelector={false}
          />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
              {actionType === "receive" ? "Receive Stock" : "Adjust Stock"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Product
                </label>
                <div ref={dropdownRef} className="relative">
                  {selectedProduct ? (
                    // Selected product display
                    <div className="flex items-center justify-between w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedProduct.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({selectedProduct.sku})
                        </span>
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                          Stock: {selectedProduct.stock}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedProduct}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    // Search input
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Search by name or SKU..."
                          className="w-full pl-10 pr-10 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                        <ChevronDown
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showProductDropdown ? "rotate-180" : ""
                            }`}
                        />
                      </div>

                      {/* Dropdown list */}
                      {showProductDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {productSearch
                                ? "No products found"
                                : "Type to search products"}
                            </div>
                          ) : (
                            filteredProducts
                              .slice(0, 50)
                              .map((product: Product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSelectProduct(product)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b dark:border-gray-600 last:border-b-0"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                      </span>
                                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                        ({product.sku})
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      Stock: {product.stock}
                                    </span>
                                  </div>
                                </button>
                              ))
                          )}
                          {filteredProducts.length > 50 && (
                            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                              Showing 50 of {filteredProducts.length} results.
                              Type more to narrow down.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {/* Hidden input for form validation */}
                  <input type="hidden" value={formData.productId} required />
                </div>
                {!selectedProduct && !showProductDropdown && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click to search and select a product
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Quantity{" "}
                  {actionType === "adjust" && "(use negative to subtract)"}
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              {actionType === "adjust" && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Reason
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="adjustment">Adjustment</option>
                    <option value="damaged">Damaged</option>
                    <option value="theft">Theft</option>
                    <option value="return_item">Return</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${actionType === "receive"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-orange-500 hover:bg-orange-600"
                    }`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
