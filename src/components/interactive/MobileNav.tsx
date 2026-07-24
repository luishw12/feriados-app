import { useEffect, useState } from 'react';
import StaggeredMenu from '@/components/ui/StaggeredMenu';
import type { StaggeredMenuItem, StaggeredMenuSocialItem } from '@/components/ui/StaggeredMenu';
import { formatVersionLabel } from '@/lib/version';

interface NavItem {
  href: string;
  label: string;
  active: boolean;
}

interface Props {
  items: NavItem[];
  githubUrl?: string;
  linkedinUrl?: string;
}

const BRAND_LAYERS = ['#6ee7b7', '#10b981', '#047857'];
const ACCENT = '#10b981';

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function MobileNav({
  items,
  githubUrl = 'https://github.com/luishw12/feriados-app',
  linkedinUrl = 'https://linkedin.com/in/luishw',
}: Props) {
  const isDark = useIsDark();

  const menuItems: StaggeredMenuItem[] = items.map((item) => ({
    label: item.label,
    ariaLabel: `Ir para ${item.label}`,
    link: item.href,
  }));

  const socialItems: StaggeredMenuSocialItem[] = [
    { label: 'GitHub', link: githubUrl },
    { label: 'LinkedIn', link: linkedinUrl },
  ];

  return (
    <div className="md:hidden">
      <StaggeredMenu
        embedded
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering
        colors={BRAND_LAYERS}
        accentColor={ACCENT}
        menuButtonColor={isDark ? '#a3a3a3' : '#525252'}
        openMenuButtonColor={isDark ? '#34d399' : '#059669'}
        changeMenuColorOnOpen
        closeOnClickAway
        versionLabel={formatVersionLabel()}
        versionHref="/changelog/"
      />
    </div>
  );
}
