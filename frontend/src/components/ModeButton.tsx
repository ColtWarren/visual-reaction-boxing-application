interface ModeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-md transition-colors ${
        active
          ? 'bg-white text-black'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
