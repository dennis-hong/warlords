import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: number) => void;
}

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {messages.map(msg => (
        <ToastItem key={msg.id} message={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ message, onRemove }: { message: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(message.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [message.id, onRemove]);

  const bgColor = {
    success: 'bg-jade/90 border-jade-light',
    error: 'bg-crimson/90 border-crimson-light',
    info: 'bg-wood/90 border-gold'
  }[message.type];

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  }[message.type];

  return (
    <div
      className={`
        ${bgColor} border-2 px-4 py-2 rounded-lg shadow-lg
        text-parchment text-sm font-medium
        animate-slide-up pointer-events-auto
        flex items-center gap-2 min-w-[200px] max-w-[300px]
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{message.text}</span>
    </div>
  );
}

// 토스트 훅
let toastId = 0;
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastId;
    setMessages(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return { messages, showToast, removeToast };
}
