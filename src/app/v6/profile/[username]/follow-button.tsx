'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  viewerId: string;
  targetId: string;
  initialFollowing: boolean;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function FollowButton({ viewerId, targetId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    setPending(true);
    const optimistic = !following;
    setFollowing(optimistic);

    try {
      const db = getSupabase();
      if (optimistic) {
        const { error } = await db
          .from('follows')
          .insert({ follower_id: viewerId, following_id: targetId });
        if (error) throw error;
      } else {
        const { error } = await db
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('following_id', targetId);
        if (error) throw error;
      }
    } catch (err: unknown) {
      console.error('[FollowButton] toggle error:', err);
      setFollowing(!optimistic);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={following ? 'outline' : 'default'}
      size="sm"
      className={
        following
          ? 'border-[#2F3336] text-[#E7E9EA] hover:border-[#F91A82] hover:text-[#F91A82] hover:bg-[#F91A82]/10 font-bold px-4'
          : 'bg-[#E7E9EA] text-black hover:bg-white font-bold px-4'
      }
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
