import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProfileSettings from '../components/ProfileSettings';

export default function Settings() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pickleball-user');
    if (!stored) {
      router.push('/login');
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/pickleball-hero.jpg"
          alt="Pickleball court"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-8 pt-5 pb-4">
          <Link href="/">
            <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-64 w-64 md:h-80 md:w-80 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 md:px-8 py-4 pb-12">
          <ProfileSettings />
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-32 left-[8%] w-5 h-5 bg-ball rounded-full opacity-40 animate-float" />
      <div className="absolute top-60 right-[12%] w-3 h-3 bg-court rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-60 left-[15%] w-4 h-4 bg-ball rounded-full opacity-35 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 right-[10%] w-2 h-2 bg-court rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }} />
    </div>
  );
}
