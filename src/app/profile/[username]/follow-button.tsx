'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
        console.log(`[PROFILE] Unfollowed user ${userId}`);
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: VIEWER_ID,
          following_id: userId,
        });

        if (error) throw error;
        console.log(`[PROFILE] Followed user ${userId}`);
      }
    } catch (err) {
      setIsFollowing(prevState);
      console.error('[PROFILE] Follow action failed:', err);
    } finally {
      setIsPending(false);
    }
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isPending}
        className={`
          px-4 py-1.5 rounded-full text-sm font-bold border transition-colors min-w-[100px]
          ${isHovering
            ? 'bg-[#f4212e]/10 text-[#f4212e] border-[#f4212e]/30'
            : 'bg-transparent text-[#e7e9ea] border-[#536471]'
          }
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
        aria-label={isHovering ? 'Unfollow this user' : 'You are following this user'}
        aria-pressed={true}
      >
        {isHovering ? 'Unfollow' : 'Following'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#e7e9ea] text-black hover:bg-[#d7d9db] transition-colors min-w-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Follow this user"
      aria-pressed={false}
    >
      Follow
    </button>
  );
}
