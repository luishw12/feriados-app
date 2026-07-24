import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleStoredTheme } from '@/lib/theme-storage';
import { useTheme } from '@/lib/use-theme';

export default function ThemeToggle() {
  const isDark = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle() {
    toggleStoredTheme();
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-lg p-2 text-neutral-600 dark:text-neutral-400"
        aria-label="Alternar tema"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="rounded-lg p-2 text-neutral-600 transition-colors duration-300 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
