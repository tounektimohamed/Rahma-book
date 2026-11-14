import React from 'react';

export function StoryCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-[#EADFD7] overflow-hidden animate-pulse flex flex-col"
    >
      <div className="aspect-[3/4] w-full bg-[#F8E8DC]/70" />
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="h-3 w-28 bg-[#EADFD7]/70 rounded" />
          <div className="h-5 w-3/4 bg-[#EADFD7] rounded" />
          <div className="h-3.5 w-full bg-[#F8E8DC] rounded" />
          <div className="h-3.5 w-5/6 bg-[#F8E8DC] rounded" />
        </div>
        <div className="pt-3 border-t border-[#EADFD7]/60 flex items-center justify-between">
          <div className="h-5 w-16 bg-[#EADFD7] rounded" />
          <div className="h-9 w-24 bg-[#F5B8B8]/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
