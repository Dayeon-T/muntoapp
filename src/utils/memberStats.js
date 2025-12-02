/**
 * 멤버 통계·상태 계산 유틸 함수
 */

/**
 * 멤버의 통계 및 상태 계산
 * @param {Object} member - 멤버 객체
 * @param {Date} today - 기준 날짜 (기본: 오늘)
 * @returns {Object} 계산된 통계
 */
export function calcMemberStats(member, today = new Date()) {
  const logs = member.participationLogs || [];

  // 참석/노쇼 횟수
  const totalAttended = logs.filter((l) => l.status === 'attended').length;
  const totalNoShow = logs.filter((l) => l.status === 'no_show').length;

  // 마지막 참여일 (attended만)
  const attendedLogs = logs.filter((l) => l.status === 'attended');
  let lastParticipationAt = null;
  let daysSinceLast = null;

  if (attendedLogs.length > 0) {
    const sortedLogs = [...attendedLogs].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    lastParticipationAt = sortedLogs[0].date;

    const lastDate = new Date(lastParticipationAt);
    const diffTime = today.getTime() - lastDate.getTime();
    daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // 가입일로부터 경과일 계산
  let daysSinceJoin = null;
  if (member.joinDate) {
    const joinDate = new Date(member.joinDate);
    const diffTime = today.getTime() - joinDate.getTime();
    daysSinceJoin = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // 60일 이상 미참여 여부
  const inactive60d = daysSinceLast !== null && daysSinceLast >= 60;

  // 가입 후 60일 이상 경과했는데 참여 0회인 경우
  const inactiveNoParticipation = totalAttended === 0 && daysSinceJoin !== null && daysSinceJoin >= 60;

  // 조치 필요 사유 결정 (비활성화 전까지는 ACTIVE 유지)
  let actionReason = null;
  
  if (totalNoShow >= 2) {
    actionReason = 'noshow'; // 노쇼 2회 이상
  } else if (inactive60d || inactiveNoParticipation) {
    actionReason = 'inactive'; // 2개월 미활동
  }

  // 조치 필요 여부
  const needsAction = actionReason !== null;

  // 상태 플래그: 비활성화 전까지는 ACTIVE
  let statusFlag = 'ACTIVE';
  if (member.status === 'disabled') {
    statusFlag = 'DISABLED';
  }

  return {
    totalAttended,
    totalNoShow,
    lastParticipationAt,
    daysSinceLast,
    daysSinceJoin,
    inactive60d,
    inactiveNoParticipation,
    statusFlag,
    actionReason,
    needsAction,
  };
}

/**
 * 멤버 배열을 최근 참여일 기준 내림차순 정렬
 * @param {Array} members - 멤버 배열
 * @returns {Array} 정렬된 배열
 */
export function sortMembers(members, sortOption = 'LATEST') {
  return [...members].sort((a, b) => {
    // 비활성화 멤버는 항상 맨 마지막으로
    const isDisabledA = a.status === 'disabled';
    const isDisabledB = b.status === 'disabled';
    if (isDisabledA && !isDisabledB) return 1;
    if (!isDisabledA && isDisabledB) return -1;

    const statsA = calcMemberStats(a);
    const statsB = calcMemberStats(b);

    switch (sortOption) {
      case 'NICKNAME_ASC':
        return a.nickname.localeCompare(b.nickname, 'ko');
      case 'NAME_ASC':
        return (a.name || '').localeCompare(b.name || '', 'ko');
      case 'AGE_ASC':
        return (a.age || 0) - (b.age || 0);
      case 'ACTIVITY_DESC': {
        const diff = statsB.totalAttended - statsA.totalAttended;
        if (diff !== 0) return diff;
        return statsA.totalNoShow - statsB.totalNoShow;
      }
      case 'ACTIVITY_ASC': {
        const diff = statsA.totalAttended - statsB.totalAttended;
        if (diff !== 0) return diff;
        return statsB.totalNoShow - statsA.totalNoShow;
      }
      case 'LATEST':
      default: {
        const hasLastA = !!statsA.lastParticipationAt;
        const hasLastB = !!statsB.lastParticipationAt;
        if (!hasLastA && !hasLastB) return 0;
        if (!hasLastA) return 1;
        if (!hasLastB) return -1;
        return (
          new Date(statsB.lastParticipationAt) -
          new Date(statsA.lastParticipationAt)
        );
      }
    }
  });
}

/**
 * 상태 필터 적용
 * @param {Array} members - 멤버 배열
 * @param {string} statusFilter - 'ALL' | 'ACTIVE' | 'INACTIVE' | 'WARN'
 * @returns {Array} 필터된 배열
 */
export function filterByStatus(members, statusFilter) {
  // 전체: 비활성화 멤버 제외
  if (statusFilter === 'ALL') {
    return members.filter((m) => m.status !== 'disabled');
  }

  return members.filter((m) => {
    const stats = calcMemberStats(m);
    
    // 조치필요: WARN(노쇼) + INACTIVE(미활동) 모두 포함 (비활성화된 멤버 제외)
    if (statusFilter === 'NEEDS_ACTION') {
      return stats.needsAction && m.status !== 'disabled';
    }
    
    // 비활성화 필터
    if (statusFilter === 'DISABLED') {
      return m.status === 'disabled';
    }
    
    return stats.statusFlag === statusFilter;
  });
}

/**
 * 성별 필터 적용
 * @param {Array} members - 멤버 배열
 * @param {string} sexFilter - 'ALL' | 'M' | 'F'
 * @returns {Array} 필터된 배열
 */
export function filterBySex(members, sexFilter) {
  if (sexFilter === 'ALL') return members;
  return members.filter((m) => m.sex === sexFilter);
}

/**
 * 검색 필터 적용
 * @param {Array} members - 멤버 배열
 * @param {string} query - 검색어
 * @returns {Array} 필터된 배열
 */
export function filterBySearch(members, query) {
  if (!query.trim()) return members;

  const q = query.toLowerCase().trim();
  return members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(q) ||
      (m.name && m.name.toLowerCase().includes(q))
  );
}

/**
 * 모든 필터 적용
 * @param {Array} members - 멤버 배열
 * @param {Object} filters - { status, sex, search }
 * @returns {Array} 필터된 배열
 */
export function applyMemberFilters(members, filters = {}) {
  let result = members;

  if (filters.status && filters.status !== 'ALL') {
    result = filterByStatus(result, filters.status);
  }

  if (filters.sex && filters.sex !== 'ALL') {
    result = filterBySex(result, filters.sex);
  }

  if (filters.search) {
    result = filterBySearch(result, filters.search);
  }

  return result;
}

