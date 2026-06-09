import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    button: "bg-red-500 hover:bg-red-600 text-white",
  },
  warning: {
    icon: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  info: {
    icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    button: "bg-blue-500 hover:bg-blue-600 text-white",
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-4 sm:p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${styles.icon}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${styles.button} disabled:opacity-50 flex items-center gap-2`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
