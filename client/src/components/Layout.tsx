import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  BoxesIcon,
  CreditCard,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Credits", href: "/credits", icon: CreditCard },
  { name: "Stock", href: "/stock", icon: BoxesIcon },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users, managerOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out flex flex-col
          lg:relative lg:translate-x-0 lg:z-0 lg:shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Vendoa
            </span>
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg icon-hover-rotate icon-click-bounce"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 dark:text-gray-300 transition-transform" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation
            .filter((item) => {
              // Filter out manager-only items for cashiers
              if ("managerOnly" in item && item.managerOnly) {
                return user?.role === "admin" || user?.role === "manager";
              }
              return true;
            })
            .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors icon-animated
                  ${isActive
                      ? "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }
                `}
                >
                  <item.icon className="w-5 h-5 transition-transform" />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                {(user?.fullName || user?.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors icon-hover-rotate icon-click-bounce"
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500 transition-transform" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 flex-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors icon-animated"
            >
              <LogOut className="w-4 h-4 transition-transform" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm shrink-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg icon-hover-wiggle icon-click-bounce"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 dark:text-gray-300 transition-transform" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
