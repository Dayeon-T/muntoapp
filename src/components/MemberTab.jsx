import { useState, useMemo } from 'react';
import { mockMembers } from '../data/mockMembers';
import {
  sortMembersByLastParticipation,
  applyMemberFilters,
} from '../utils/memberStats';
import MemberCard from './MemberCard';

export default function MemberTab() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sexFilter, setSexFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 정렬 + 필터 적용
  const filteredMembers = useMemo(() => {
    const sorted = sortMembersByLastParticipation(mockMembers);
    return applyMemberFilters(sorted, {
      status: statusFilter,
      sex: sexFilter,
      search: searchQuery,
    });
  }, [statusFilter, sexFilter, searchQuery]);

  return (
    <div className="px-4 pt-3 pb-6">
      {/* 검색 */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 닉네임 또는 이름 검색"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* 상태 필터 */}
        <div className="flex gap-1">
          {['ALL', 'ACTIVE', 'INACTIVE', 'WARN'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full border transition ${
                statusFilter === status
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {status === 'ALL' ? '전체' : status}
            </button>
          ))}
        </div>

        {/* 성별 필터 */}
        <div className="flex gap-1 ml-auto">
          {['ALL', 'M', 'F'].map((sex) => (
            <button
              key={sex}
              onClick={() => setSexFilter(sex)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full border transition ${
                sexFilter === sex
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {sex === 'ALL' ? '전체' : sex === 'M' ? '남' : '여'}
            </button>
          ))}
        </div>
      </div>

      {/* 멤버 수 표시 */}
      <p className="text-[11px] text-slate-500 mb-2">
        총 {filteredMembers.length}명
      </p>

      {/* 멤버 리스트 */}
      {filteredMembers.length > 0 ? (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">조건에 맞는 멤버가 없습니다</p>
        </div>
      )}
    </div>
  );
}

