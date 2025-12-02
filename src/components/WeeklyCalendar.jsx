import { useState, useMemo } from 'react';
import {
  getWeekDays,
  getWeekRange,
  filterEventsByDateRange,
  groupEventsByDate,
  formatDateToString,
} from '../utils/socialingStats';
import SocialingCard from './SocialingCard';

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

export default function WeeklyCalendar({ events, onAddClick, onToggleChecked, onUpdateParticipantStatus, onCancelEvent, onEditClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 현재 주의 날짜들
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  
  // 현재 주의 이벤트들
  const weekEvents = useMemo(() => {
    const { start, end } = getWeekRange(currentDate);
    return filterEventsByDateRange(events, start, end);
  }, [events, currentDate]);

  // 날짜별로 그룹핑된 이벤트
  const groupedEvents = useMemo(() => groupEventsByDate(weekEvents), [weekEvents]);

  // 이전/다음 주 이동
  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
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

  // 주 범위 텍스트
  const { start, end } = getWeekRange(currentDate);
  const weekRangeText = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;

  return (
    <div className="space-y-4">
      {/* 네비게이션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevWeek}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{weekRangeText}</p>
          <button
            onClick={goToToday}
            className="text-[11px] text-slate-500 hover:text-[#0575E6] transition"
          >
            이번주 보기
          </button>
        </div>
        
        <button
          onClick={goToNextWeek}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 주간 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => {
          const dateStr = formatDateToString(day);
          const dayEvents = groupedEvents[dateStr] || [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isWeekend = index >= 5;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`
                flex flex-col items-center p-2 rounded-xl transition-all
                ${isSelected
                  ? 'bg-slate-700 text-white'
                  : isToday
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-50'
                }
              `}
            >
              <span className={`text-[10px] font-medium mb-1 ${
                isSelected ? 'text-slate-300' : isWeekend ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {DAY_NAMES[index]}
              </span>
              <span className={`text-sm font-semibold ${
                isSelected ? 'text-white' : isToday ? 'text-slate-900' : 'text-slate-700'
              }`}>
                {day.getDate()}
              </span>
              {/* 이벤트 인디케이터 */}
              <div className="flex gap-0.5 mt-1.5 h-1.5">
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
                {dayEvents.length > 3 && (
                  <span className={`text-[8px] ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
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
                  isChecked={event.isChecked || false}
                  onToggleChecked={onToggleChecked ? () => onToggleChecked(event.id) : undefined}
                  onUpdateParticipantStatus={onUpdateParticipantStatus}
                  onCancelEvent={onCancelEvent}
                  onEditClick={onEditClick}
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

      {/* 선택된 날짜가 없을 때 주간 요약 */}
      {!selectedDate && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">
            주간 소셜링 ({weekEvents.length}개)
          </p>
          {weekEvents.length > 0 ? (
            <div className="space-y-2">
              {weekEvents.map((event) => (
                <SocialingCard 
                  key={event.id} 
                  event={event}
                  isChecked={event.isChecked || false}
                  onToggleChecked={onToggleChecked ? () => onToggleChecked(event.id) : undefined}
                  onUpdateParticipantStatus={onUpdateParticipantStatus}
                  onCancelEvent={onCancelEvent}
                  onEditClick={onEditClick}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              예정된 소셜링이 없습니다
            </p>
          )}
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

