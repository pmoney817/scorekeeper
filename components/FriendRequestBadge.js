import { useState, useEffect } from 'react';

export default function FriendRequestBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (!stored) return;
      const user = JSON.parse(stored);
      loadCount(user.email);
    } catch {}
  }, []);

  const loadCount = async (email) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pending', email }),
      });
      const data = await res.json();
      if (data.requests) setCount(data.requests.length);
    } catch {}
  };

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}
