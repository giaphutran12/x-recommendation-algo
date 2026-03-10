'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  viewerId: string;
  targetId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ viewerId, targetId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    const optimistic = !isFollowing;
    setIsFollowing(optimistic);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      if (optimistic) {
        await supabase.from('follows').insert({
          follower_id: viewerId,
          following_id: targetId,
        });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('following_id', targetId);
      }
    } catch {
      setIsFollowing(!optimistic);
    } finally {
      setIsPending(false);
    }
  };

  if (isFollowing) {
    return (
      <Button
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        variant="outline"
        className={
          isHovering
            ? 'border-red-500/50 text-red-500 hover:bg-red-500/10 font-semibold'
            : 'border-[#2F3336] text-[#E7E9EA] hover:border-red-500/50 font-semibold'
        }
        size="sm"
      >
        {isHovering ? 'Unfollow' : 'Following'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="bg-[#E7E9EA] text-black hover:bg-[#D7D9DA] font-semibold"
      size="sm"
    >
      Follow
    </Button>
  );
}
