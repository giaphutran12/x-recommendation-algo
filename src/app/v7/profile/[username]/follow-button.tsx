'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;

    const wasFollowing = isFollowing;
    setIsPending(true);
    setIsFollowing(!wasFollowing);

    try {
      if (!wasFollowing) {
        await supabase.from('follows').insert({
          follower_id: VIEWER_ID,
          following_id: userId,
        });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', VIEWER_ID)
          .eq('following_id', userId);
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      variant={isFollowing ? 'outline' : 'default'}
      className={cn(
        'rounded-full px-5 text-sm font-bold transition-all',
        isFollowing
          ? isHovering
            ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50'
            : 'border-muted-foreground bg-transparent text-foreground hover:bg-transparent hover:border-muted-foreground'
          : 'bg-foreground text-background hover:bg-foreground/90 border-transparent',
      )}
    >
      {isFollowing ? (isHovering ? 'Unfollow' : 'Following') : 'Follow'}
    </Button>
  );
}
