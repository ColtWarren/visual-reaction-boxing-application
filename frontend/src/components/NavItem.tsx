import { Link, useRoute } from 'wouter';

interface NavItemProps {
  to: string;
  label: string;
  /** Optional click handler — Block 4's mobile drawer uses it to close on tap. */
  onNavigate?: () => void;
}

/**
 * Single sidebar/drawer nav link. Wouter's <Link> renders the anchor itself and
 * forwards className/aria-current/onClick, so we style it directly — no nested
 * <a> (that would be an invalid nested-anchor). Active route uses the
 * --rd-bg-elevated token pill (zinc-800 equivalent) per Q11.
 */
export function NavItem({ to, label, onNavigate }: NavItemProps) {
  const [isActive] = useRoute(to);

  return (
    <Link
      href={to}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={
        'block rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary ' +
        (isActive
          ? 'bg-rd-bg-elevated text-rd-text-primary'
          : 'text-rd-text-secondary hover:bg-rd-bg-surface hover:text-rd-text-primary')
      }
    >
      {label}
    </Link>
  );
}
