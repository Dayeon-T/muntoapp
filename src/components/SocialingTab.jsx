import { useState, useMemo } from 'react';
import { mockEvents } from '../data/mockEvents';
import { sortEvents } from '../utils/socialingStats';
import SocialingCard from './SocialingCard';
import MemberTab from './MemberTab';
import WeeklyCalendar from './WeeklyCalendar';
import MonthlyCalendar from './MonthlyCalendar';
import NinetyLogo from '../assets/90.svg?react';


// 필터 태그 옵션 - 상태
const STATUS_TAGS = [
  { id: 'scheduled', label: '예정' },
  { id: 'confirmed', label: '확정' },
  { id: 'done', label: '완료' },
  { id: 'cancelled', label: '취소' },
];

// 필터 태그 옵션 - 확인필요
const PROPERTY_TAGS = [
  { id: 'needsCheck', label: '확인필요' },
];

export default function SocialingTab({ onAddClick }) {
  const [activeTab, setActiveTab] = useState('socialing');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'weekly' | 'monthly'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [selectedTags, setSelectedTags] = useState([]); // 선택된 필터 태그들
  const [checkedEvents, setCheckedEvents] = useState({}); // 조치완료 상태 { eventId: boolean }

  // 조치완료 토글
  const toggleChecked = (eventId) => {
    setCheckedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // 태그 토글
  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  // 정렬 + 필터 적용
  const filteredEvents = useMemo(() => {
    const sorted = sortEvents(mockEvents, sortBy);
    
    // 태그 필터가 없으면 전체 반환
    if (selectedTags.length === 0) return sorted;

    return sorted.filter((event) => {
      const totalAttended = event.participants.filter(p => p.status === 'attended').length;
      const isConfirmed = event.status === 'scheduled' && totalAttended >= 3;

      // 선택된 태그 중 하나라도 매칭되면 표시
      return selectedTags.some((tag) => {
        switch (tag) {
          case 'scheduled':
            return event.status === 'scheduled' && !isConfirmed;
          case 'confirmed':
            return isConfirmed;
          case 'done':
            return event.status === 'done';
          case 'cancelled':
            return event.status === 'cancelled';
          case 'needsCheck':
            // 음주/야간/노쇼 중 하나라도 있고, 조치완료되지 않은 것
            const hasAttention = event.hasAlcohol || event.isNight || event.participants.some(p => p.status === 'no_show');
            return hasAttention && !checkedEvents[event.id];
          default:
            return false;
        }
      });
    });
  }, [sortBy, selectedTags, checkedEvents]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 영역 */}
      <header className="bg-white border-b border-slate-200 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 italic py-4">
          <span className="text-[#0575E6]">N</span>ineties <span className="text-[#0575E6]">C</span>lub</h1></div>
        
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 mt-1">
          {activeTab === 'socialing' ? '소셜링 관리' : '멤버 관리'}
        </h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {activeTab === 'socialing'
            ? '날짜별 소셜링 개최 현황을 확인하고 등록하세요'
            : '멤버 활동도와 출석 현황을 확인하세요'}
        </p>
      </header>

      {/* 탭 영역 */}
      <nav className="flex bg-white border-b border-slate-200">
        <button
          onClick={() => setActiveTab('socialing')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'socialing'
              ? 'text-slate-900 border-b-2 border-[#0575E6]'
              : 'text-slate-500'
          }`}
        >
          소셜링
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-slate-900 border-b-2 border-[#0575E6]'
              : 'text-slate-500'
          }`}
        >
          멤버
        </button>
      </nav>

      {/* 콘텐츠 영역 */}
      {activeTab === 'socialing' ? (
        <main className="px-4 pt-3 pb-6">
          {/* 뷰 모드 토글 */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-full">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#0575E6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-[#0575E6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                이번주
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-[#0575E6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                월별
              </button>
            </div>
          </div>

          {/* 뷰 모드별 콘텐츠 렌더링 */}
          {viewMode === 'list' && (
            <>
              {/* 정렬 */}
              <div className="flex items-center justify-between mb-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-[11px] text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0575E6] cursor-pointer"
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                </select>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    필터 초기화
                  </button>
                )}
              </div>

              {/* 필터 태그 */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {/* 상태 태그 */}
                {STATUS_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-[10px] font-medium rounded-full px-2.5 py-1 transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-slate-800 text-white'
                        : 'bg-gray-200 text-slate-600 hover:bg-gray-300'
                    }`}
                  >
                    # {tag.label}
                  </button>
                ))}

                {/* 구분선 */}
                <span className="text-slate-300 text-[10px] mx-1">|</span>

                {/* 특성 태그 */}
                {PROPERTY_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-[10px] font-medium rounded-full px-2.5 py-1 transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-slate-800 text-white'
                        : 'bg-gray-200 text-slate-600 hover:bg-gray-300'
                    }`}
                  >
                    # {tag.label}
                  </button>
                ))}
              </div>

              {/* 카드 리스트 */}
              {filteredEvents.length > 0 ? (
                <div className="space-y-3 pb-20">
                  {filteredEvents.map((event) => (
                    <SocialingCard 
                      key={event.id} 
                      event={event}
                      isChecked={checkedEvents[event.id] || false}
                      onToggleChecked={() => toggleChecked(event.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">
                    조건에 맞는 이벤트가 없습니다
                  </p>
                </div>
              )}
            </>
          )}

          {viewMode === 'weekly' && (
            <WeeklyCalendar 
              events={mockEvents} 
              onAddClick={onAddClick}
              checkedEvents={checkedEvents}
              onToggleChecked={toggleChecked}
            />
          )}

          {viewMode === 'monthly' && (
            <MonthlyCalendar 
              events={mockEvents} 
              onAddClick={onAddClick}
              checkedEvents={checkedEvents}
              onToggleChecked={toggleChecked}
            />
          )}
        </main>
      ) : (
        <MemberTab />
      )}

      {/* 전체 뷰 - 하단 고정 소셜링 추가 버튼 */}
      {activeTab === 'socialing' && viewMode === 'list' && onAddClick && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <button
            onClick={onAddClick}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            소셜링 추가하기
          </button>
        </div>
      )}
    </div>
  );
}

