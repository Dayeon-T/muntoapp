/**
 * 스켈레톤 로딩 컴포넌트
 */

// 기본 스켈레톤 박스
export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`bg-slate-200 rounded animate-pulse ${className}`}
    />
  );
}

// 소셜링 카드 스켈레톤
export function SocialingCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      {/* 제목 + 호스트 */}
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-4 w-12" />
      </div>
      
      {/* 날짜 · 장소 */}
      <SkeletonBox className="h-3 w-1/2" />
      
      {/* 참여 요약 */}
      <SkeletonBox className="h-3 w-1/3" />
      
      {/* 상태 태그 */}
      <div className="flex gap-2">
        <SkeletonBox className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

// 멤버 카드 스켈레톤
export function MemberCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      {/* 닉네임 + 상태 */}
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      
      {/* 성별 · 지역 */}
      <SkeletonBox className="h-3 w-1/3" />
      
      {/* 마지막 참여 */}
      <SkeletonBox className="h-3 w-1/2" />
      
      {/* 참석/노쇼 */}
      <SkeletonBox className="h-3 w-1/3" />
    </div>
  );
}

// 리스트 스켈레톤
export function ListSkeleton({ count = 3, CardSkeleton = SocialingCardSkeleton }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  SkeletonBox,
  SocialingCardSkeleton,
  MemberCardSkeleton,
  ListSkeleton,
};

