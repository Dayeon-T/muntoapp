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

  // 60일 이상 미참여 여부
  const inactive60d = daysSinceLast !== null && daysSinceLast >= 60;

  // 상태 플래그 결정
  let statusFlag = 'ACTIVE';
  if (totalNoShow >= 2) {
    statusFlag = 'WARN';
  } else if (inactive60d || (attendedLogs.length === 0 && logs.length === 0)) {
    // 참여 이력 없는 신규도 일단 ACTIVE로 (또는 별도 처리 가능)
    if (inactive60d) {
      statusFlag = 'INACTIVE';
    }
  }

  return {
    totalAttended,
    totalNoShow,
    lastParticipationAt,
    daysSinceLast,
    inactive60d,
    statusFlag,
  };
}

/**
 * 멤버 배열을 최근 참여일 기준 내림차순 정렬
 * @param {Array} members - 멤버 배열
 * @returns {Array} 정렬된 배열
 */
export function sortMembersByLastParticipation(members) {
  return [...members].sort((a, b) => {
    const statsA = calcMemberStats(a);
    const statsB = calcMemberStats(b);

    // 참여 이력 없는 경우 맨 뒤로
    if (!statsA.lastParticipationAt && !statsB.lastParticipationAt) return 0;
    if (!statsA.lastParticipationAt) return 1;
    if (!statsB.lastParticipationAt) return -1;

    return new Date(statsB.lastParticipationAt) - new Date(statsA.lastParticipationAt);
  });
}

/**
 * 상태 필터 적용
 * @param {Array} members - 멤버 배열
 * @param {string} statusFilter - 'ALL' | 'ACTIVE' | 'INACTIVE' | 'WARN'
 * @returns {Array} 필터된 배열
 */
export function filterByStatus(members, statusFilter) {
  if (statusFilter === 'ALL') return members;

  return members.filter((m) => {
    const stats = calcMemberStats(m);
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

