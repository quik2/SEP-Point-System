'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types';
import { Triangle, TrendingUp, Crown } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getPhotoPath } from '@/lib/photoMapping';

export default function LeaderboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMembers();

    // Subscribe to real-time updates only for rank_change field updates
    // This prevents auto-refresh when points are adjusted, but will refresh when rankings are recalculated
    const channel = supabase
      .channel('members-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'members',
        },
        (payload) => {
          // Only refresh if rank_change was updated (indicating a ranking refresh was triggered)
          if (payload.new && 'rank_change' in payload.new && payload.old && payload.new.rank_change !== payload.old.rank_change) {
            fetchMembers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('points', { ascending: false })
      .order('name', { ascending: true }); // Secondary sort by name for consistent ordering

    if (data && !error) {
      setMembers(data);
    }
    setLoading(false);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <TrendingUp className="w-12 h-12 text-primary animate-bounce" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const top3 = members.slice(0, 3);
  const rest = members.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/logo.png"
              alt="SEP Logo"
              width={60}
              height={60}
              className="object-contain"
            />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              SEPoints Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Maintain 80+ points to stay active
          </p>
        </div>

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 md:gap-8 max-w-3xl mx-auto">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-400">
                    <Image
                      src={getPhotoPath(top3[1].name)}
                      alt={top3[1].name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                </div>
                <h3 className="font-semibold text-sm md:text-base text-center mb-1 max-w-[120px]">
                  {top3[1].name}
                </h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-400 mb-1">
                  {top3[1].points}
                </p>
                {/* {top3[1].rank_change !== 0 && (
                  <div className="flex items-center gap-1">
                    {top3[1].rank_change > 0 ? (
                      <>
                        <Triangle className="w-3 h-3 text-green-500 fill-green-500" />
                        <span className="text-xs font-medium text-white">
                          {top3[1].rank_change}
                        </span>
                      </>
                    ) : (
                      <>
                        <Triangle className="w-3 h-3 text-red-500 fill-red-500 rotate-180" />
                        <span className="text-xs font-medium text-white">
                          {Math.abs(top3[1].rank_change)}
                        </span>
                      </>
                    )}
                  </div>
                )} */}
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 mb-2 animate-pulse" />
                <div className="relative mb-3">
                  <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg shadow-yellow-400/50">
                    <Image
                      src={getPhotoPath(top3[0].name)}
                      alt={top3[0].name}
                      fill
                      className="object-cover"
                      sizes="144px"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                </div>
                <h3 className="font-semibold text-base md:text-lg text-center mb-1 max-w-[150px]">
                  {top3[0].name}
                </h3>
                <p className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">
                  {top3[0].points}
                </p>
                {/* {top3[0].rank_change !== 0 && (
                  <div className="flex items-center gap-1">
                    {top3[0].rank_change > 0 ? (
                      <>
                        <Triangle className="w-3 h-3 text-green-500 fill-green-500" />
                        <span className="text-sm font-medium text-white">
                          {top3[0].rank_change}
                        </span>
                      </>
                    ) : (
                      <>
                        <Triangle className="w-3 h-3 text-red-500 fill-red-500 rotate-180" />
                        <span className="text-sm font-medium text-white">
                          {Math.abs(top3[0].rank_change)}
                        </span>
                      </>
                    )}
                  </div>
                )} */}
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-orange-400">
                    <Image
                      src={getPhotoPath(top3[2].name)}
                      alt={top3[2].name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-orange-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                </div>
                <h3 className="font-semibold text-sm md:text-base text-center mb-1 max-w-[120px]">
                  {top3[2].name}
                </h3>
                <p className="text-2xl md:text-3xl font-bold text-orange-400 mb-1">
                  {top3[2].points}
                </p>
                {/* {top3[2].rank_change !== 0 && (
                  <div className="flex items-center gap-1">
                    {top3[2].rank_change > 0 ? (
                      <>
                        <Triangle className="w-3 h-3 text-green-500 fill-green-500" />
                        <span className="text-xs font-medium text-white">
                          {top3[2].rank_change}
                        </span>
                      </>
                    ) : (
                      <>
                        <Triangle className="w-3 h-3 text-red-500 fill-red-500 rotate-180" />
                        <span className="text-xs font-medium text-white">
                          {Math.abs(top3[2].rank_change)}
                        </span>
                      </>
                    )}
                  </div>
                )} */}
              </div>
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="space-y-2 max-w-3xl mx-auto">
          {rest.map((member, index) => {
            const actualIndex = index + 3;
            const isAtRisk = member.points < 80;
            // const rankChange = member.rank_change;

            return (
              <div
                key={member.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border transition-all duration-200",
                  !isAtRisk && "border-border hover:border-primary/30 bg-card",
                  isAtRisk && "border-destructive/50 bg-destructive/5"
                )}
              >
                <div className="relative flex items-center gap-3 md:gap-4 p-3 md:p-4">
                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg font-bold text-base md:text-lg shrink-0",
                      !isAtRisk && "bg-secondary text-secondary-foreground",
                      isAtRisk && "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {actualIndex + 1}
                  </div>

                  {/* Profile Photo */}
                  <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-border shrink-0">
                    <Image
                      src={getPhotoPath(member.name)}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">
                      {member.name}
                    </h3>
                  </div>

                  {/* Points Display with Rank Change */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Rank Change Indicator */}
                    {/* {rankChange !== 0 && (
                      <div className="flex items-center gap-1">
                        {rankChange > 0 ? (
                          <>
                            <Triangle className="w-2 h-2 text-green-500 fill-green-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {rankChange}
                            </span>
                          </>
                        ) : (
                          <>
                            <Triangle className="w-2 h-2 text-red-500 fill-red-500 rotate-180" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {Math.abs(rankChange)}
                            </span>
                          </>
                        )}
                      </div>
                    )} */}

                    <div className="text-right">
                      <div className={cn(
                        "text-xl md:text-2xl font-bold tabular-nums",
                        !isAtRisk && "text-foreground",
                        isAtRisk && "text-destructive"
                      )}>
                        {member.points}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Points
                      </div>
                      {isAtRisk && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            At Risk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No active members found</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Updates in real-time</p>
        </div>
      </div>
    </div>
  );
}
