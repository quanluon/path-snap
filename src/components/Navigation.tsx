'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  CameraIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import {
  CameraIcon as CameraIconSolid,
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  MapIcon as MapIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    // If clicking on the current page, scroll to top instead of navigating
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    {
      name: t.nav.home,
      href: '/',
      icon: HomeIcon,
      iconActive: HomeIconSolid,
    },
    {
      name: t.nav.upload,
      href: '/upload',
      icon: CameraIcon,
      iconActive: CameraIconSolid,
    },
    {
      name: t.nav.search,
      href: '/search',
      icon: MagnifyingGlassIcon,
      iconActive: MagnifyingGlassIconSolid,
    },
    {
      name: t.nav.plan,
      href: '/plan',
      icon: MapIcon,
      iconActive: MapIconSolid,
    },
    {
      name: t.nav.settings,
      href: '/settings',
      icon: Cog6ToothIcon,
      iconActive: Cog6ToothIconSolid,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-md border-t border-dark-primary shadow-dark-primary z-40 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconActive : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(item.href, e)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 hover:bg-dark-hover ${
                isActive ? 'text-dark-primary' : 'text-dark-secondary hover:text-dark-primary'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

