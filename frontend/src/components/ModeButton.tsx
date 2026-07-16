interface ModeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary ${
        active
          ? 'bg-rd-bg-elevated text-rd-text-primary'
          : 'text-rd-text-secondary hover:bg-rd-bg-surface hover:text-rd-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
