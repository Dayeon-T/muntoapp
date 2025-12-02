import { useState } from 'react';
import { calcMemberStats } from '../utils/memberStats';

// 상태 뱃지 스타일
const STATUS_STYLES = {
  ACTIVE: 'bg-blue-100 text-blue-700 border-blue-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  WARN: 'bg-red-100 text-red-700 border-red-200',
};

export default function MemberCard({ member }) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = calcMemberStats(member);
  const {
    totalAttended,
    totalNoShow,
    lastParticipationAt,
    daysSinceLast,
    statusFlag,
  } = stats;

  // 최근 참여 기록 (최대 5개)
  const recentLogs = [...(member.participationLogs || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // 마지막 참여 텍스트
  const lastParticipationText = lastParticipationAt
    ? `${lastParticipationAt} (${daysSinceLast}일 전)`
    : '참여 이력 없음';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* 카드 본문 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset"
      >
        {/* 1행: 닉네임 + 상태 뱃지 */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {member.nickname}
            {member.name && (
              <span className="font-normal text-slate-500 ml-1">
                ({member.name})
              </span>
            )}
          </h3>
          <span
            className={`text-[11px] font-medium rounded-full border px-2 py-0.5 ${STATUS_STYLES[statusFlag]}`}
          >
            {statusFlag}
          </span>
        </div>

        {/* 2행: 성별 · 지역 */}
        <p className="text-[11px] text-slate-500 mt-1">
          {member.sex === 'M' ? '남' : '여'} · {member.region || '-'}
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
            <span className="text-red-600">❌ 노쇼 {totalNoShow}회</span>
          ) : (
            <span className="text-slate-600">노쇼 0회</span>
          )}
        </p>
      </button>

      {/* 아코디언 상세 영역 */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? 'max-h-[300px]' : 'max-h-0'
        }`}
      >
        <div className="border-t border-slate-100 px-4 py-3">
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
                  <span className="text-slate-400">{log.date}</span>
                  {' '}
                  {log.eventTitle}
                  {' — '}
                  {log.status === 'attended' ? '참석' : '❌ 노쇼'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-400">참여 기록이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

