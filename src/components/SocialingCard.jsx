import { useState } from 'react';
import { calcParticipantStats, findHost } from '../utils/socialingStats';
import HostIcon from '../assets/host.svg?react';

// 상태 라벨 매핑
const STATUS_LABELS = {
  scheduled: '예정',
  done: '완료',
  cancelled: '취소',
};

export default function SocialingCard({ event, isChecked = false, onToggleChecked }) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = calcParticipantStats(event.participants);
  const host = findHost(event.participants);

  const { totalAttended, totalNoShow } = stats;

  // 참석자 3명 이상이면 확정
  const isConfirmed = event.status === 'scheduled' && totalAttended >= 3;

  // 상태 라벨 결정
  const getStatusLabel = () => {
    if (event.status === 'scheduled') {
      return isConfirmed ? '확정' : '예정';
    }
    return STATUS_LABELS[event.status];
  };

  // 확인이 필요한 항목이 있는지
  const needsAttention = event.hasAlcohol || event.isNight || totalNoShow > 0;

  // 완료/취소된 모임인지
  const isInactive = event.status === 'done' || event.status === 'cancelled';

  return (
    <div className={`relative rounded-xl border bg-white border-slate-200 overflow-hidden transition-shadow ${isInactive ? 'opacity-50' : ''}`}>
      {/* 확인 필요 점 (조치완료시 초록색, 완료/취소시 회색) */}
      {needsAttention && (
        <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
          isInactive ? 'bg-slate-300' : isChecked ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
      )}

      {/* 카드 본문 (클릭 가능) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset ${
          event.status === 'cancelled' ? 'line-through' : ''
        }`}
      >
        {/* 1행: 제목 + 호스트 */}
        <div className="flex items-start justify-between gap-2 pr-4">
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {event.title}
            <span className="ml-4 text-[11px] text-slate-500">
              {host?.nickname || '-'}
            </span>
          </h3>
        </div>

        {/* 2행: 날짜 · 장소 */}
        <p className="text-[11px] text-slate-500 mt-1">
          {event.date} · {event.location}
        </p>

        {/* 3행: 참여 요약 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] font-medium text-slate-600 py-0.5">
            참석 {totalAttended}명
          </span>
        </div>

        {/* 4행: 상태 태그만 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] font-medium rounded-full bg-gray-100 text-slate-600 px-2 py-0.5">
            # {getStatusLabel()}
          </span>
        </div>
      </button>

      {/* 아코디언 상세 영역 */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* 참여자 목록 */}
          <div>
            <p className="text-[11px] font-semibold text-slate-700 mb-1.5">
              참여자 목록
            </p>
            <ul className="space-y-1">
              {event.participants.map((p) => (
                <li key={p.id} className="text-[11px] text-slate-600">
                  <span className={p.status === 'no_show' ? 'text-red-500 line-through' : ''}>
                    {p.nickname}
                  </span>
                  {' '}<span className="text-slate-400 text-[8px]">{p.sex === 'M' ? '남' : '여'}</span>
                  {p.role === 'host' && (
                    <HostIcon className="w-3 h-3 inline-block ml-1" />
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 안내 문구 + 조치완료 토글 */}
          {needsAttention && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px]">
                <span className="text-slate-500">
                  {[
                    event.hasAlcohol && '음주',
                    event.isNight && '야간',
                  ].filter(Boolean).join(' · ')}
                </span>
                {(event.hasAlcohol || event.isNight) && totalNoShow > 0 && (
                  <span className="text-slate-500"> · </span>
                )}
                {totalNoShow > 0 && (
                  <span className="text-red-500">노쇼</span>
                )}
                
              </p>

              {/* 조치완료 토글 */}
              {onToggleChecked && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-[11px] ${isChecked ? 'text-emerald-600' : 'text-slate-500'}`}>
                    조치완료
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={onToggleChecked}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              )}

              
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
