'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
}

export default function FollowButton({
  userId,
  initialFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [hover, setHover] = useState(false);

  const handleToggle = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    setPending(true);

    try {
      if (next) {
        await supabase
          .from('follows')
          .insert({ follower_id: VIEWER_ID, following_id: userId });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', VIEWER_ID)
          .eq('following_id', userId);
      }
    } catch {
      setIsFollowing(!next);
    } finally {
      setPending(false);
    }
  };

  const label = isFollowing ? (hover ? 'Unfollow' : 'Following') : 'Follow';

  return (
    <Button
      onClick={handleToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={pending}
      className={
        isFollowing
          ? 'min-w-[110px] rounded-full border border-[#536471] bg-transparent font-bold text-[#E7E9EA] transition-colors hover:border-[#F4212E] hover:bg-[#F4212E]/10 hover:text-[#F4212E]'
          : 'min-w-[110px] rounded-full bg-[#EFF3F4] font-bold text-[#0F1419] transition-colors hover:bg-[#D7DBDC]'
      }
    >
      {label}
    </Button>
  );
}
