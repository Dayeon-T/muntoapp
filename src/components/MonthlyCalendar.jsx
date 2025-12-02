import { useState, useMemo } from 'react';
import {
  getCalendarDays,
  getMonthRange,
  filterEventsByDateRange,
  groupEventsByDate,
  formatDateToString,
} from '../utils/socialingStats';
import SocialingCard from './SocialingCard';

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

export default function MonthlyCalendar({ events, onAddClick, checkedEvents = {}, onToggleChecked }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 현재 월의 캘린더 날짜들
  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  // 현재 월의 이벤트들
  const monthEvents = useMemo(() => {
    const { start, end } = getMonthRange(currentDate);
    return filterEventsByDateRange(events, start, end);
  }, [events, currentDate]);

  // 날짜별로 그룹핑된 이벤트
  const groupedEvents = useMemo(() => groupEventsByDate(monthEvents), [monthEvents]);

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // 오늘 날짜 확인
  const today = formatDateToString(new Date());

  // 선택된 날짜의 이벤트
  const selectedDateEvents = selectedDate ? (groupedEvents[selectedDate] || []) : [];

  return (
    <div className="space-y-4">
      {/* 네비게이션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </p>
          <button
            onClick={goToToday}
            className="text-[11px] text-slate-500 hover:text-slate-700 transition"
          >
            오늘로
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name, index) => (
          <div
            key={name}
            className={`text-center text-[10px] font-semibold py-1 ${
              index >= 5 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 월간 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => {
          const { date, isCurrentMonth } = dayInfo;
          const dateStr = formatDateToString(date);
          const dayEvents = groupedEvents[dateStr] || [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = index % 7;
          const isWeekend = dayOfWeek >= 5;

          return (
            <button
              key={`${dateStr}-${index}`}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`
                relative flex flex-col items-center justify-start p-1.5 min-h-[52px] rounded-lg transition-all
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isSelected
                  ? 'bg-slate-900 text-white'
                  : isToday
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-50'
                }
              `}
            >
              <span className={`text-xs font-medium ${
                isSelected 
                  ? 'text-white' 
                  : isToday 
                    ? 'text-slate-900' 
                    : isWeekend 
                      ? 'text-rose-400' 
                      : 'text-slate-700'
              }`}>
                {date.getDate()}
              </span>
              
              {/* 이벤트 인디케이터 */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : event.status === 'scheduled'
                            ? 'bg-emerald-400'
                            : event.status === 'done'
                              ? 'bg-slate-400'
                              : 'bg-rose-400'
                      }`}
                    />
                  ))}
                </div>
              )}
              {dayEvents.length > 3 && (
                <span className={`text-[8px] mt-0.5 ${
                  isSelected ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  +{dayEvents.length - 3}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-500">예정</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-[10px] text-slate-500">완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-[10px] text-slate-500">취소</span>
        </div>
      </div>

      {/* 선택된 날짜의 이벤트 목록 */}
      {selectedDate && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">
            {new Date(selectedDate).getMonth() + 1}월 {new Date(selectedDate).getDate()}일 소셜링
          </p>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <SocialingCard 
                  key={event.id} 
                  event={event}
                  isChecked={checkedEvents[event.id] || false}
                  onToggleChecked={onToggleChecked ? () => onToggleChecked(event.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              이 날짜에 예정된 소셜링이 없습니다
            </p>
          )}
        </div>
      )}

      {/* 선택된 날짜가 없을 때 월간 요약 */}
      {!selectedDate && monthEvents.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">
            이번 달 소셜링 ({monthEvents.length}개)
          </p>
          <div className="space-y-2">
            {monthEvents.slice(0, 5).map((event) => (
              <SocialingCard 
                key={event.id} 
                event={event}
                isChecked={checkedEvents[event.id] || false}
                onToggleChecked={onToggleChecked ? () => onToggleChecked(event.id) : undefined}
              />
            ))}
            {monthEvents.length > 5 && (
              <p className="text-xs text-slate-400 text-center py-2">
                +{monthEvents.length - 5}개 더...
              </p>
            )}
          </div>
        </div>
      )}

      {/* 소셜링 추가 버튼 - 항상 표시 */}
      {onAddClick && (
        <button
          onClick={onAddClick}
          className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          소셜링 추가하기
        </button>
      )}
    </div>
  );
}

