'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CameraIcon as CameraIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  MapIcon as MapIconSolid,
} from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconActive : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
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

