'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending) return;

    const prevState = isFollowing;
    setIsFollowing(!isFollowing);
    setIsPending(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      if (prevState) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', VIEWER_ID)
          .eq('following_id', userId);

        if (error) throw error;
        console.log(`[V3:PROFILE] Unfollowed user ${userId}`);
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: VIEWER_ID,
          following_id: userId,
        });

        if (error) throw error;
        console.log(`[V3:PROFILE] Followed user ${userId}`);
      }
    } catch (err) {
      setIsFollowing(prevState);
      console.error('[V3:PROFILE] Follow action failed:', err);
    } finally {
      setIsPending(false);
    }
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isPending}
        className={cn(
          'rounded-full min-w-[100px] px-4 py-1.5 text-sm font-bold transition-colors',
          isHovering
            ? 'bg-[#f4212e]/10 text-[#f4212e] border-[#f4212e]/30 hover:bg-[#f4212e]/10 hover:text-[#f4212e]'
            : 'bg-transparent text-[#E7E9EA] border-[#536471] hover:bg-transparent hover:text-[#E7E9EA]',
        )}
        aria-label={isHovering ? 'Unfollow this user' : 'You are following this user'}
        aria-pressed={true}
      >
        {isHovering ? 'Unfollow' : 'Following'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full min-w-[100px] px-4 py-1.5 text-sm font-bold bg-[#E7E9EA] text-black hover:bg-[#D7D9DB] transition-colors"
      aria-label="Follow this user"
      aria-pressed={false}
    >
      Follow
    </Button>
  );
}
