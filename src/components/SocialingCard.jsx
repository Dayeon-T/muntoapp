import { useState } from 'react';
import { calcParticipantStats, findHost } from '../utils/socialingStats';
import { getRelativeDateText } from '../utils/dateUtils';
import HostIcon from '../assets/host.svg?react';
import ConfirmModal from './ConfirmModal';

// 상태 라벨 매핑
const STATUS_LABELS = {
  scheduled: '예정',
  done: '완료',
  cancelled: '취소',
};

export default function SocialingCard({ 
  event, 
  isChecked = false, 
  onToggleChecked,
  onUpdateParticipantStatus, // 참가자 상태 변경 콜백
  onCancelEvent, // 이벤트 취소 콜백
  onEditClick, // 이벤트 수정 페이지로 이동 콜백
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const stats = calcParticipantStats(event.participants);
  const host = findHost(event.participants);

  const { totalParticipants, totalAttended, totalNoShow, totalRegistered } = stats;

  // 참석자 3명 이상이면 확정 (예정 이벤트에서)
  const isConfirmed = event.status === 'scheduled' && totalParticipants >= 3;

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

  // 참가자 수 표시 텍스트
  const getParticipantText = () => {
    if (event.status === 'scheduled') {
      return `신청 ${totalRegistered}명`;
    }
    if (event.status === 'done') {
      if (totalNoShow > 0) {
        return `참석 ${totalAttended}명 · 노쇼 ${totalNoShow}명`;
      }
      return `참석 ${totalAttended}명`;
    }
    return `신청 ${event.participants.length}명`;
  };

  // 노쇼 토글 핸들러
  const handleToggleNoShow = (participantId, currentStatus) => {
    if (!onUpdateParticipantStatus || event.status !== 'done') return;
    
    const newStatus = currentStatus === 'no_show' ? 'attended' : 'no_show';
    onUpdateParticipantStatus(event.id, participantId, newStatus);
  };

  return (
    <div className={`relative rounded-xl border bg-white border-slate-200 overflow-hidden transition-all duration-200 ${
      isInactive ? 'opacity-60' : showCancelModal ? '' : 'hover:shadow-md hover:-translate-y-0.5'
    }`}>
      {/* 확인 필요 점 (조치완료되면 숨김) */}
      {needsAttention && !isChecked && (
        <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
          isInactive ? 'bg-slate-300' : 'bg-red-500'
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
          {getRelativeDateText(event.date)} · {event.location}
        </p>

        {/* 3행: 참여 요약 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className={`text-[11px] font-medium py-0.5 ${totalNoShow > 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {getParticipantText()}
          </span>
          {/* 최소/최대 인원 표시 */}
          {(event.minParticipants || event.maxParticipants) && (
            <span className="text-[10px] text-slate-400">
              ({event.minParticipants && `최소 ${event.minParticipants}명`}
              {event.minParticipants && event.maxParticipants && ' ~ '}
              {event.maxParticipants && `최대 ${event.maxParticipants}명`})
            </span>
          )}
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
          isOpen ? 'max-h-[600px]' : 'max-h-0'
        }`}
      >
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* 참여자 목록 */}
          <div>
            <p className="text-[11px] font-semibold text-slate-700 mb-1.5">
              참여자 목록 {event.status === 'done' && <span className="font-normal text-slate-400">(탭하여 노쇼 표시)</span>}
            </p>
            <ul className="space-y-1">
              {event.participants.map((p) => (
                <li key={p.id} className="text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className={p.status === 'no_show' ? 'text-red-500 line-through' : ''}>
                      {p.nickname}
                    </span>
                    {' '}<span className="text-slate-400 text-[8px]">{p.sex === 'M' ? '남' : '여'}</span>
                    {p.role === 'host' && (
                      <HostIcon className="w-3 h-3 inline-block ml-1" />
                    )}
                  </div>
                  
                  {/* 완료된 이벤트에서만 노쇼 토글 버튼 표시 */}
                  {event.status === 'done' && onUpdateParticipantStatus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNoShow(p.id, p.status);
                      }}
                      className={`w-10 py-0.5 rounded text-[10px] font-medium transition-all ${
                        p.status === 'no_show'
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p.status === 'no_show' ? '노쇼' : '참석'}
                    </button>
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
                  <span className="text-red-500">노쇼 {totalNoShow}명</span>
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

          {/* 예정된 이벤트: 수정/취소 버튼 */}
          {event.status === 'scheduled' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {onEditClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(event);
                  }}
                  className="w-full py-2 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  소셜링 수정
                </button>
              )}
              {onCancelEvent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelModal(true);
                  }}
                  className="w-full py-2 text-[11px] font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  소셜링 취소
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 소셜링 취소 확인 모달 */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => onCancelEvent(event.id)}
        title="소셜링 취소"
        message={`"${event.title}" 소셜링을 취소하시겠습니까?`}
        confirmText="취소하기"
        cancelText="돌아가기"
        variant="danger"
      />
    </div>
  );
}
