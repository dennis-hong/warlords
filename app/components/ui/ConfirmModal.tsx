interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 모달 */}
      <div className="relative silk-card rounded-xl overflow-hidden shadow-2xl max-w-sm w-full animate-scale-in">
        {/* 헤더 */}
        <div className="bg-wood px-4 py-3 border-b-2 border-gold/30">
          <h3 className="text-lg font-bold text-gold title-glow flex items-center gap-2">
            {variant === 'danger' ? '⚠️' : '📜'} {title}
          </h3>
        </div>

        {/* 내용 */}
        <div className="p-4">
          <p className="text-dynasty-black text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* 버튼 */}
        <div className="p-4 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[48px] py-2.5 px-4 rounded-lg bg-dynasty-medium/50 text-parchment/80
                       active:bg-dynasty-medium transition-colors font-medium active:scale-[0.97]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-lg font-medium transition-all active:scale-[0.97]
              ${variant === 'danger'
                ? 'btn-war'
                : 'btn-peace'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
