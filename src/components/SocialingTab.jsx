import { useState, useMemo, useEffect } from 'react';
import { sortEvents } from '../utils/socialingStats';
import SocialingCard from './SocialingCard';
import MemberTab from './MemberTab';
import WeeklyCalendar from './WeeklyCalendar';
import MonthlyCalendar from './MonthlyCalendar';
import NinetyLogo from '../assets/90.svg?react';
import { useToast } from './Toast';
import EmptyState from './EmptyState';
import { 
  getSocialings, 
  updateParticipantStatus as updateParticipantStatusAPI,
  cancelSocialing,
  toggleSocialingChecked,
} from '../services/socialingService';


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

export default function SocialingTab({ onAddClick, onEditClick }) {
  const [activeTab, setActiveTab] = useState('socialing');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'weekly' | 'monthly'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [selectedTags, setSelectedTags] = useState([]); // 선택된 필터 태그들
  const [events, setEvents] = useState([]); // 이벤트 상태 관리
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [loading, setLoading] = useState(true); // 로딩 상태
  const toast = useToast();

  // 데이터 로드
  useEffect(() => {
    loadSocialings();
  }, []);

  const loadSocialings = async () => {
    try {
      setLoading(true);
      const data = await getSocialings();
      setEvents(data);
    } catch (error) {
      toast.error('소셜링 목록을 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 조치완료 토글
  const toggleChecked = async (eventId) => {
    const event = events.find((e) => e.id === eventId);
    const newChecked = !event?.isChecked;
    
    // 낙관적 업데이트
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isChecked: newChecked } : e
      )
    );

    try {
      await toggleSocialingChecked(eventId, newChecked);
    } catch (error) {
      // 실패시 롤백
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, isChecked: !newChecked } : e
        )
      );
      toast.error('조치완료 상태 변경에 실패했습니다');
    }
  };

  // 참가자 상태 변경 (노쇼 토글)
  const updateParticipantStatus = async (eventId, participantId, newStatus) => {
    // 낙관적 업데이트
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        return {
          ...event,
          participants: event.participants.map((p) =>
            p.id === participantId ? { ...p, status: newStatus } : p
          ),
        };
      })
    );

    try {
      await updateParticipantStatusAPI(eventId, participantId, newStatus);
    } catch (error) {
      // 실패시 데이터 다시 로드
      toast.error('참가자 상태 변경에 실패했습니다');
      loadSocialings();
    }
  };

  // 이벤트 취소
  const cancelEvent = async (eventId) => {
    const event = events.find((e) => e.id === eventId);
    
    // 낙관적 업데이트
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, status: 'cancelled' } : e
      )
    );

    try {
      await cancelSocialing(eventId);
      toast.success(`"${event?.title}" 소셜링이 취소되었습니다`);
    } catch (error) {
      // 실패시 데이터 다시 로드
      toast.error('소셜링 취소에 실패했습니다');
      loadSocialings();
    }
  };

  // 이벤트 수정
  const updateEvent = (eventId, updatedData) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, ...updatedData } : e
      )
    );
    toast.success('소셜링이 수정되었습니다');
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
    let result = sortEvents(events, sortBy);
    
    // 검색 필터 적용
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((event) => {
        const host = event.participants?.find(p => p.role === 'host');
        return (
          event.title?.toLowerCase().includes(q) ||
          event.location?.toLowerCase().includes(q) ||
          host?.nickname?.toLowerCase().includes(q)
        );
      });
    }
    
    // 태그 필터가 없으면 검색 결과만 반환
    if (selectedTags.length === 0) return result;

    return result.filter((event) => {
      const totalParticipants = event.participants?.length || 0;
      const isConfirmed = event.status === 'scheduled' && totalParticipants >= 3;

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
            // 취소된 모임은 확인필요에서 제외
            if (event.status === 'cancelled') return false;
            // 음주/야간/노쇼 중 하나라도 있고, 조치완료되지 않은 것
            const hasAttention = event.hasAlcohol || event.isNight || event.participants?.some(p => p.status === 'no_show');
            return hasAttention && !event.isChecked;
          default:
            return false;
        }
      });
    });
  }, [events, sortBy, selectedTags, searchQuery]);

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
            : '클럽원들의 활동현황을 확인하세요'}
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
            <div className="shadow-inner inline-flex gap-1 p-1 bg-slate-100 rounded-full">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#0575E6] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-[#0575E6] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all   ${
                  viewMode === 'monthly'
                    ? 'bg-[#0575E6] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                월간
              </button>
            </div>
          </div>

          {/* 뷰 모드별 콘텐츠 렌더링 */}
          {viewMode === 'list' && (
            <>
              {/* 검색 */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="제목, 호스트, 장소로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0575E6] placeholder:text-slate-400"
                />
              </div>

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
                {(selectedTags.length > 0 || searchQuery) && (
                  <button
                    onClick={() => { setSelectedTags([]); setSearchQuery(''); }}
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
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0575E6]"></div>
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="space-y-3 pb-20">
                  {filteredEvents.map((event) => (
                    <SocialingCard 
                      key={event.id} 
                      event={event}
                      isChecked={event.isChecked || false}
                      onToggleChecked={() => toggleChecked(event.id)}
                      onUpdateParticipantStatus={updateParticipantStatus}
                      onCancelEvent={cancelEvent}
                      onEditClick={onEditClick}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  preset={
                    searchQuery
                      ? 'noSearchResults'
                      : selectedTags.includes('needsCheck') 
                        ? 'noNeedsCheck'
                        : selectedTags.includes('scheduled')
                          ? 'noScheduled'
                          : selectedTags.includes('done')
                            ? 'noDone'
                            : selectedTags.includes('cancelled')
                              ? 'noCancelled'
                              : selectedTags.length > 0
                                ? 'noFilterResults'
                                : 'noEvents'
                  }
                />
              )}
            </>
          )}

          {viewMode === 'weekly' && (
            <WeeklyCalendar 
              events={events} 
              onAddClick={onAddClick}
              onToggleChecked={toggleChecked}
              onUpdateParticipantStatus={updateParticipantStatus}
              onCancelEvent={cancelEvent}
              onEditClick={onEditClick}
            />
          )}

          {viewMode === 'monthly' && (
            <MonthlyCalendar 
              events={events} 
              onAddClick={onAddClick}
              onToggleChecked={toggleChecked}
              onUpdateParticipantStatus={updateParticipantStatus}
              onCancelEvent={cancelEvent}
              onEditClick={onEditClick}
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
            className="w-full py-3 bg-[#0575E6] text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
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

