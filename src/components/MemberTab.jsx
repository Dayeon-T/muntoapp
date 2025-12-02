import { useState, useMemo, useEffect } from 'react';
import { sortMembers, applyMemberFilters } from '../utils/memberStats';
import MemberCard from './MemberCard';
import AddMember from './AddMember';
import { useToast } from './Toast';
import EmptyState from './EmptyState';
import {
  getMembers,
  disableMember as disableMemberAPI,
  restoreMember as restoreMemberAPI,
  addMember as addMemberAPI,
  updateMember as updateMemberAPI,
} from '../services/memberService';

const SORT_OPTIONS = [
  { value: 'LATEST', label: '최신 참여순' },
  { value: 'NICKNAME_ASC', label: '닉네임순' },
  { value: 'NAME_ASC', label: '이름순' },
  { value: 'AGE_ASC', label: '나이순' },
  { value: 'ACTIVITY_DESC', label: '활동많은 순' },
  { value: 'ACTIVITY_ASC', label: '활동적은 순' },
];

export default function MemberTab() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sexFilter, setSexFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('LATEST');
  const [members, setMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // 데이터 로드
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      toast.error('멤버 목록을 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 멤버 비활성화 처리
  const handleDisableMember = async (memberId, reason) => {
    const member = members.find((m) => m.id === memberId);
    
    // 낙관적 업데이트
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, status: 'disabled', disabledReason: reason }
          : m
      )
    );

    try {
      await disableMemberAPI(memberId, reason);
      toast.success(`${member?.nickname}님이 비활성화되었습니다`);
    } catch (error) {
      toast.error('멤버 비활성화에 실패했습니다');
      loadMembers();
    }
  };

  // 멤버 복구 처리
  const handleRestoreMember = async (memberId) => {
    const member = members.find((m) => m.id === memberId);
    
    // 낙관적 업데이트
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, status: 'active', disabledReason: null }
          : m
      )
    );

    try {
      await restoreMemberAPI(memberId);
      toast.success(`${member?.nickname}님이 복구되었습니다`);
    } catch (error) {
      toast.error('멤버 복구에 실패했습니다');
      loadMembers();
    }
  };

  // 멤버 추가 처리
  const handleAddMember = async (newMemberData) => {
    try {
      const newMember = await addMemberAPI(newMemberData);
      setMembers((prev) => [{ ...newMember, participationLogs: [] }, ...prev]);
      toast.success(`${newMemberData.nickname}님이 등록되었습니다`);
    } catch (error) {
      toast.error('멤버 등록에 실패했습니다');
      throw error;
    }
  };

  // 멤버 정보 수정 처리
  const handleUpdateMember = async (memberId, updatedData) => {
    // 낙관적 업데이트
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, ...updatedData } : m
      )
    );

    try {
      await updateMemberAPI(memberId, updatedData);
      toast.success('멤버 정보가 수정되었습니다');
    } catch (error) {
      toast.error('멤버 정보 수정에 실패했습니다');
      loadMembers();
    }
  };

  // 활성 멤버 수 (비활성화 제외)
  const activeMemberCount = useMemo(() => {
    return members.filter(m => m.status !== 'disabled').length;
  }, [members]);

  // 정렬 + 필터 적용
  const filteredMembers = useMemo(() => {
    const sorted = sortMembers(members, sortOption);
    return applyMemberFilters(sorted, {
      status: statusFilter,
      sex: sexFilter,
      search: searchQuery,
    });
  }, [members, statusFilter, sexFilter, searchQuery, sortOption]);

  // 멤버 추가 모달이 열려 있으면 모달 표시
  if (showAddMember) {
    return (
      <AddMember
        onClose={() => setShowAddMember(false)}
        onSubmit={handleAddMember}
        members={members}
        onUpdateMember={handleUpdateMember}
        onRestoreMember={handleRestoreMember}
      />
    );
  }

  return (
    <div className="px-4 pt-3 pb-24">
      {/* 검색 */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="닉네임 또는 이름 검색"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
      </div>

      {/* 정렬 옵션 */}
      <div className="mb-3">
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="text-[11px] text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0575E6] cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* 상태 필터 */}
        <div className="flex gap-1">
          {[
            { value: 'ALL', label: '전체' },
            { value: 'ACTIVE', label: '# 활동중' },
            { value: 'NEEDS_ACTION', label: '# 조치필요' },
            { value: 'DISABLED', label: '# 비활성화' },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-2 py-1 text-[10px] font-medium rounded-full transition ${
                statusFilter === status.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-200 text-slate-600 hover:bg-gray-300'
              }`}
            >
              {status.label}
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
        {statusFilter === 'DISABLED' 
          ? `비활성화 ${filteredMembers.length}명`
          : statusFilter === 'ALL'
            ? `활동중인 클럽원 ${activeMemberCount}명`
            : `${filteredMembers.length}명`
        }
      </p>

      {/* 멤버 리스트 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0575E6]"></div>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <MemberCard 
              key={member.id} 
              member={member}
              onDisable={handleDisableMember}
              onRestore={handleRestoreMember}
              onUpdate={handleUpdateMember}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          preset={
            searchQuery
              ? 'noMemberSearchResults'
              : statusFilter === 'NEEDS_ACTION'
                ? 'noNeedsAction'
                : statusFilter === 'DISABLED'
                  ? 'noDisabledMembers'
                  : statusFilter === 'ACTIVE'
                    ? 'noActiveMembers'
                    : 'noMembers'
          }
        />
      )}

      {/* 플로팅 멤버 추가 버튼 */}
      <button
        onClick={() => setShowAddMember(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 bg-[#0575E6] text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
        멤버 추가하기
      </button>
    </div>
  );
}
