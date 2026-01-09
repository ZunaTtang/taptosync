import { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
}

interface ToastProps {
    message: ToastMessage;
    onDismiss: (id: string) => void;
}

function Toast({ message, onDismiss }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        setIsVisible(true);

        // Auto-dismiss after duration
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(message.id), 150); // Wait for fade out
        }, message.duration);

        return () => clearTimeout(timer);
    }, [message, onDismiss]);

    const typeStyles = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-orange-500',
        error: 'bg-red-500',
    };

    return (
        <div
            className={`
        fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
        px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium
        transition-all duration-150
        ${typeStyles[message.type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
        >
            {message.message}
        </div>
    );
}

interface ToastContainerProps {
    messages: ToastMessage[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
    return (
        <>
            {messages.map((msg) => (
                <Toast key={msg.id} message={msg} onDismiss={onDismiss} />
            ))}
        </>
    );
}

// Hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = (message: string, duration: number = 3000, type: ToastMessage['type'] = 'info') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const dismissToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return {
        toasts,
        showToast,
        dismissToast,
    };
}
