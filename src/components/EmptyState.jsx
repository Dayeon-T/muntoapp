/**
 * 빈 상태 컴포넌트
 */

// 아이콘 타입
const ICONS = {
  search: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  check: (
    <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  party: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// 프리셋 메시지
const PRESETS = {
  // 소셜링 관련
  noEvents: {
    icon: 'calendar',
    message: '등록된 소셜링이 없어요',
    subMessage: '새로운 소셜링을 추가해보세요',
  },
  noScheduled: {
    icon: 'calendar',
    message: '예정된 소셜링이 없어요',
    subMessage: '새로운 소셜링을 추가해보세요',
  },
  noDone: {
    icon: 'check',
    message: '완료된 소셜링이 없어요',
  },
  noCancelled: {
    icon: 'party',
    message: '취소된 소셜링이 없어요',
    subMessage: '좋은 신호네요!',
  },
  noNeedsCheck: {
    icon: 'check',
    message: '확인이 필요한 소셜링이 없어요',
    subMessage: '모든 소셜링이 정상이에요!',
  },
  noSearchResults: {
    icon: 'search',
    message: '검색 결과가 없어요',
    subMessage: '다른 키워드로 검색해보세요',
  },
  noFilterResults: {
    icon: 'filter',
    message: '조건에 맞는 소셜링이 없어요',
    subMessage: '필터를 변경해보세요',
  },
  
  // 멤버 관련
  noMembers: {
    icon: 'users',
    message: '등록된 멤버가 없어요',
    subMessage: '새로운 멤버를 추가해보세요',
  },
  noActiveMembers: {
    icon: 'users',
    message: '활동중인 멤버가 없어요',
  },
  noNeedsAction: {
    icon: 'check',
    message: '조치가 필요한 멤버가 없어요',
    subMessage: '모든 멤버가 정상 활동중이에요!',
  },
  noDisabledMembers: {
    icon: 'users',
    message: '비활성화된 멤버가 없어요',
  },
  noMemberSearchResults: {
    icon: 'search',
    message: '검색 결과가 없어요',
    subMessage: '닉네임 또는 이름을 다시 확인해보세요',
  },
};

export default function EmptyState({ 
  preset, 
  icon, 
  message, 
  subMessage,
  className = '' 
}) {
  // 프리셋 사용 시
  const presetData = preset ? PRESETS[preset] : null;
  
  const finalIcon = icon || presetData?.icon || 'filter';
  const finalMessage = message || presetData?.message || '데이터가 없어요';
  const finalSubMessage = subMessage !== undefined ? subMessage : presetData?.subMessage;

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="mb-4">
        {ICONS[finalIcon]}
      </div>
      <p className="text-sm font-medium text-slate-500 text-center">
        {finalMessage}
      </p>
      {finalSubMessage && (
        <p className="text-xs text-slate-400 text-center mt-1">
          {finalSubMessage}
        </p>
      )}
    </div>
  );
}

// 프리셋 이름들 export
export { PRESETS };

