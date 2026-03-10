'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  viewerId: string;
  targetId: string;
  initialFollowing: boolean;
}

export function FollowButton({ viewerId, targetId, initialFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (isPending) return;

    const optimisticNext = !isFollowing;
    setIsFollowing(optimisticNext);
    setIsPending(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      if (optimisticNext) {
        await supabase.from('follows').insert({
          follower_id: viewerId,
          following_id: targetId,
          created_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('following_id', targetId);
      }
    } catch {
      setIsFollowing(!optimisticNext);
    } finally {
      setIsPending(false);
    }
  };

  const label = isFollowing
    ? isHovering
      ? 'Unfollow'
      : 'Following'
    : 'Follow';

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={cn(
        'px-5 py-1.5 rounded-full text-[15px] font-bold transition-all border',
        isFollowing
          ? isHovering
            ? 'bg-transparent border-red-500/70 text-red-400'
            : 'bg-transparent border-[#2F3336] text-[#E7E9EA]'
          : 'bg-[#E7E9EA] border-transparent text-black hover:bg-[#D4D8D9]',
        isPending && 'opacity-60 cursor-not-allowed'
      )}
    >
      {label}
    </button>
  );
}
