import { useState } from 'react';
import { calcMemberStats } from '../utils/memberStats';
import { formatDaysAgo } from '../utils/dateUtils';
import EditMember from './EditMember';

// 비활성화 사유 옵션
const DISABLE_REASONS = [
  { value: 'noshow', label: '노쇼 누적' },
  { value: 'inactive', label: '장기 미활동' },
  { value: 'request', label: '본인 요청' },
  { value: 'other', label: '기타' },
];

// 조치 필요 메시지
const ACTION_MESSAGES = {
  noshow: '노쇼가 2회 이상이에요',
  inactive: '2개월간 소셜링에 참여하지 않았어요',
};

export default function MemberCard({ member, onDisable, onRestore, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const stats = calcMemberStats(member);
  const {
    totalAttended,
    totalNoShow,
    lastParticipationAt,
    daysSinceLast,
    statusFlag,
    actionReason,
    needsAction,
  } = stats;

  // 최근 참여 기록 (최대 5개)
  const recentLogs = [...(member.participationLogs || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // 마지막 참여 텍스트
  const lastParticipationText = lastParticipationAt
    ? `${lastParticipationAt} (${formatDaysAgo(daysSinceLast)})`
    : '참여 이력 없음';

  // 비활성화 처리
  const handleDisable = () => {
    if (selectedReason && onDisable) {
      onDisable(member.id, selectedReason);
      setShowDisableModal(false);
      setSelectedReason('');
    }
  };

  // 이미 비활성화된 멤버
  const isDisabled = member.status === 'DISABLED';

  // 모달이 열려있으면 hover 효과 비활성화
  const hasModalOpen = showDisableModal || showEditModal;

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 ${
      isDisabled ? 'border-slate-300 opacity-50' : hasModalOpen ? 'border-slate-200' : 'border-slate-200 hover:shadow-md hover:-translate-y-0.5'
    }`}>
      {/* 카드 본문 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset"
      >
        {/* 1행: 닉네임 + 상태 뱃지 */}
        <div className="flex items-center justify-between gap-2">
          <h3 className={`text-sm font-semibold ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {member.nickname}
            {member.name && (
              <span className="font-normal text-xs text-slate-500 ml-1">
                {member.name}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            {/* 조치 필요 태그 */}
            {needsAction && !isDisabled && (
              <span className="text-[10px] font-medium rounded-full bg-red-100 text-red-600 px-2 py-0.5">
                # 조치필요
              </span>
            )}
            {/* 상태 태그 */}
            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
              isDisabled 
                ? 'bg-slate-200 text-slate-500' 
                : 'bg-gray-100 text-slate-600'
            }`}>
              # {isDisabled ? '비활성화' : '활동중'}
            </span>
          </div>
        </div>

        {/* 2행: 성별 · 지역 */}
        <p className="text-[11px] text-slate-500 mt-1">
          {member.sex === 'M' ? '남' : '여'} · {member.region || '-'}
          {member.age ? ` · ${member.age}세` : ''}
        </p>

        {/* 3행: 마지막 참여일 */}
        <p className="text-[11px] text-slate-500 mt-1">
          마지막 참여: {lastParticipationText}
        </p>

        {/* 4행: 참석/노쇼 횟수 */}
        <p className="text-[11px] mt-1">
          <span className="text-slate-600">참여 {totalAttended}회</span>
          <span className="text-slate-400 mx-1">·</span>
          {totalNoShow > 0 ? (
            <span className="text-red-600">노쇼 {totalNoShow}회</span>
          ) : (
            <span className="text-slate-600">노쇼 0회</span>
          )}
        </p>

        {/* 비활성화된 경우 사유 표시 */}
        {isDisabled && member.disableReason && (
          <p className="text-[10px] text-slate-400 mt-1">
            비활성화 사유: {DISABLE_REASONS.find(r => r.value === member.disableReason)?.label || member.disableReason}
          </p>
        )}
      </button>

      {/* 아코디언 상세 영역 */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? 'max-h-[400px]' : 'max-h-0'
        }`}
      >
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* 최근 참여 기록 */}
          <div>
            <p className="text-[11px] font-semibold text-slate-700 mb-2">
              최근 참여 기록
            </p>

            {recentLogs.length > 0 ? (
              <ul className="space-y-1.5">
                {recentLogs.map((log, idx) => (
                  <li
                    key={idx}
                    className={`text-[11px] ${
                      log.status === 'no_show' ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    <span className="text-slate-400 mr-2">{log.date}</span>
                    {' '}
                    {log.eventTitle}
                    {log.status === 'attended' ? '' : ' 노쇼'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-400">참여 기록이 없습니다</p>
            )}

            {/* 조치 필요 메시지 */}
            {needsAction && !isDisabled && actionReason && (
              <p className="text-[11px] text-red-500 mt-3">
                {ACTION_MESSAGES[actionReason]}
              </p>
            )}
          </div>

          {/* 수정/비활성화 버튼 */}
          {!isDisabled && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {onUpdate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="w-full py-2 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  정보 수정
                </button>
              )}
              {onDisable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDisableModal(true);
                    setSelectedReason(actionReason || '');
                  }}
                  className={`w-full py-2 text-[11px] font-medium rounded-lg transition-colors ${
                    needsAction 
                      ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                      : 'text-slate-500 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  멤버 비활성화
                </button>
              )}
            </div>
          )}

          {/* 비활성화된 멤버 복구 버튼 */}
          {isDisabled && onRestore && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(member.id);
                }}
                className="w-full py-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                멤버 복구하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 비활성화 사유 선택 모달 */}
      {showDisableModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDisableModal(false)}
        >
          <div 
            className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              비활성화 사유 선택
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {member.nickname}님을 비활성화합니다.
            </p>
            
            <div className="space-y-2 mb-4">
              {DISABLE_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    selectedReason === reason.value
                      ? 'bg-slate-100 border border-slate-300'
                      : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="disableReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-3.5 h-3.5 text-slate-600"
                  />
                  <span className="text-[11px] text-slate-700">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDisableModal(false)}
                className="flex-1 py-2 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={!selectedReason}
                className="flex-1 py-2 text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                비활성화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 수정 모달 */}
      {showEditModal && (
        <EditMember
          member={member}
          onClose={() => setShowEditModal(false)}
          onSubmit={onUpdate}
        />
      )}
    </div>
  );
}
