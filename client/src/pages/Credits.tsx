import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  DollarSign,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  CreditCard,
  History,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditBalance: number;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    sales: number;
    creditTransactions: number;
  };
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: "purchase" | "payment" | "adjustment";
  description?: string;
  reference?: string;
  balanceAfter: number;
  createdAt: string;
  sale?: {
    receiptNumber: string;
    total: number;
  };
}

interface CustomerDetails extends Customer {
  creditTransactions: CreditTransaction[];
  sales: {
    id: string;
    receiptNumber: string;
    total: number;
    paymentMethod: string;
    createdAt: string;
  }[];
}

export default function Credits() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: "",
  });

  // Fetch customers with credit
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers-credit", searchQuery],
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: { search: searchQuery, pageSize: 100 },
      });
      return response.data.data.customers as Customer[];
    },
  });

  // Fetch credit summary
  const { data: creditSummary } = useQuery({
    queryKey: ["credit-summary"],
    queryFn: async () => {
      const response = await api.get("/customers/credit/summary");
      return response.data.data;
    },
  });

  // Fetch customer details
  const fetchCustomerDetails = async (customerId: string) => {
    const response = await api.get(`/customers/${customerId}`);
    setSelectedCustomer(response.data.data);
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({
      customerId,
      amount,
      reference,
    }: {
      customerId: string;
      amount: number;
      reference?: string;
    }) => {
      const response = await api.post(`/customers/${customerId}/pay-credit`, {
        amount,
        reference,
        description: "Credit payment",
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Payment recorded successfully");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentReference("");
      queryClient.invalidateQueries({ queryKey: ["customers-credit"] });
      queryClient.invalidateQueries({ queryKey: ["credit-summary"] });
      if (selectedCustomer) {
        fetchCustomerDetails(selectedCustomer.id);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to record payment");
    },
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomer) => {
      const response = await api.post("/customers", {
        ...data,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : 0,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Customer added successfully");
      setShowAddCustomerModal(false);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        creditLimit: "",
      });
      queryClient.invalidateQueries({ queryKey: ["customers-credit"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add customer");
    },
  });

  const handleRecordPayment = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    paymentMutation.mutate({
      customerId: selectedCustomer.id,
      amount,
      reference: paymentReference || undefined,
    });
  };

  const customersWithCredit =
    customersData?.filter((c) => Number(c.creditBalance) > 0) || [];
  const allCustomers = customersData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Credit Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage customer credits
          </p>
        </div>
        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 icon-animated w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 transition-transform" />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-red-600">
                ₱{Number(creditSummary?.totalOutstanding || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customers with Credit
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {creditSummary?.customersWithCredit || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {allCustomers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Customers with Outstanding Credit */}
      {customersWithCredit.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Outstanding Credits
            </h2>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {customersWithCredit.map((customer) => (
              <div key={customer.id} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    if (expandedCustomer === customer.id) {
                      setExpandedCustomer(null);
                    } else {
                      setExpandedCustomer(customer.id);
                      fetchCustomerDetails(customer.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.phone || "No phone"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        ₱{Number(customer.creditBalance).toFixed(2)}
                      </p>
                      {Number(customer.creditLimit) > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Limit: ₱{Number(customer.creditLimit).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchCustomerDetails(customer.id);
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                    >
                      Pay
                    </button>
                    {expandedCustomer === customer.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCustomer === customer.id && selectedCustomer && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Recent Transactions
                    </h4>
                    {selectedCustomer.creditTransactions.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedCustomer.creditTransactions
                          .slice(0, 10)
                          .map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                            >
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {tx.type === "purchase" && "Purchase"}
                                  {tx.type === "payment" && "Payment"}
                                  {tx.type === "adjustment" && "Adjustment"}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">
                                  {tx.reference || tx.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-medium ${tx.type === "payment"
                                      ? "text-green-600"
                                      : tx.type === "purchase"
                                        ? "text-red-600"
                                        : "text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                  {tx.type === "payment" ? "-" : "+"}₱
                                  {Number(tx.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No transactions yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            All Customers
          </h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : allCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Credit Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Credit Limit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {allCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.phone || "-"}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {customer.email || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${Number(customer.creditBalance) > 0
                            ? "text-red-600"
                            : "text-green-600"
                          }`}
                      >
                        ₱{Number(customer.creditBalance).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {Number(customer.creditLimit) > 0
                        ? `₱${Number(customer.creditLimit).toFixed(2)}`
                        : "No limit"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {Number(customer.creditBalance) > 0 && (
                        <button
                          onClick={() => {
                            fetchCustomerDetails(customer.id);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Record Payment
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setPaymentReference("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedCustomer.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCustomer.phone}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Outstanding Balance:
                  </span>
                  <span className="text-xl font-bold text-red-600">
                    ₱{Number(selectedCustomer.creditBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                  <button
                    onClick={() =>
                      setPaymentAmount(
                        Number(selectedCustomer.creditBalance).toFixed(2)
                      )
                    }
                    className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Pay full amount
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Receipt #, transaction ID, etc."
                  />
                </div>
              </div>

              <button
                onClick={handleRecordPayment}
                disabled={paymentMutation.isPending}
                className="w-full mt-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {paymentMutation.isPending ? "Processing..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Add New Customer
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Credit Limit
                </label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      creditLimit: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00 (0 = no limit)"
                />
              </div>

              <button
                onClick={() => {
                  if (!newCustomer.name.trim()) {
                    toast.error("Customer name is required");
                    return;
                  }
                  addCustomerMutation.mutate(newCustomer);
                }}
                disabled={addCustomerMutation.isPending}
                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
