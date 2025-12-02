/**
 * 소셜링(이벤트) 통계·정렬·필터 유틸 함수
 */

/**
 * 참여자 배열에서 통계 계산
 * @param {Array} participants - 참여자 배열
 * @returns {Object} 통계 객체
 */
export function calcParticipantStats(participants = []) {
  let totalAttended = 0;
  let totalNoShow = 0;
  let maleCount = 0;
  let femaleCount = 0;

  participants.forEach((p) => {
    if (p.status === 'attended') {
      totalAttended++;
      if (p.sex === 'M') maleCount++;
      if (p.sex === 'F') femaleCount++;
    } else if (p.status === 'no_show') {
      totalNoShow++;
    }
  });

  // 성비 위험: 참석자 중 남자가 1명이거나 여자가 1명일 때
  const genderRiskFlag = maleCount === 1 || femaleCount === 1;

  return {
    totalAttended,
    totalNoShow,
    maleCount,
    femaleCount,
    genderRiskFlag,
  };
}

/**
 * 호스트 참여자 찾기
 * @param {Array} participants - 참여자 배열
 * @returns {Object|null} 호스트 참여자 또는 null
 */
export function findHost(participants = []) {
  return participants.find((p) => p.role === 'host') || null;
}

/**
 * 이벤트 배열을 날짜 기준 내림차순(최신 먼저) 정렬
 * @param {Array} events - 이벤트 배열
 * @returns {Array} 정렬된 배열 (원본 변경 안 함)
 */
export function sortEventsByDateDesc(events) {
  return [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 이벤트 배열을 날짜 기준 오름차순(오래된 먼저) 정렬
 * @param {Array} events - 이벤트 배열
 * @returns {Array} 정렬된 배열 (원본 변경 안 함)
 */
export function sortEventsByDateAsc(events) {
  return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 정렬 옵션에 따라 이벤트 정렬
 * @param {Array} events - 이벤트 배열
 * @param {string} sortBy - 정렬 기준 ('newest' | 'oldest')
 * @returns {Array} 정렬된 배열
 */
export function sortEvents(events, sortBy = 'newest') {
  if (sortBy === 'oldest') {
    return sortEventsByDateAsc(events);
  }
  return sortEventsByDateDesc(events);
}

/**
 * 예정된 이벤트만 필터
 * @param {Array} events - 이벤트 배열
 * @returns {Array} status가 'scheduled'인 이벤트만
 */
export function filterScheduledOnly(events) {
  return events.filter((e) => e.status === 'scheduled');
}

/**
 * 성비 위험 이벤트만 필터
 * @param {Array} events - 이벤트 배열
 * @returns {Array} genderRiskFlag가 true인 이벤트만
 */
export function filterGenderRiskOnly(events) {
  return events.filter((e) => {
    const stats = calcParticipantStats(e.participants);
    return stats.genderRiskFlag;
  });
}

/**
 * 필터 조합 적용 (예정만, 성비위험만)
 * @param {Array} events - 이벤트 배열
 * @param {Object} filters - { scheduledOnly: boolean, genderRiskOnly: boolean }
 * @returns {Array} 필터 적용된 배열
 */
export function applyFilters(events, filters = {}) {
  let result = events;

  if (filters.scheduledOnly) {
    result = filterScheduledOnly(result);
  }

  if (filters.genderRiskOnly) {
    result = filterGenderRiskOnly(result);
  }

  return result;
}

// ============================================
// 날짜 관련 유틸 함수
// ============================================

/**
 * 특정 날짜 기준 주의 시작(월요일)과 끝(일요일) 날짜 반환
 * @param {Date} date - 기준 날짜
 * @returns {Object} { start: Date, end: Date }
 */
export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  // 월요일을 주의 시작으로 (0=일요일이므로 조정)
  const diff = day === 0 ? -6 : 1 - day;
  
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * 특정 날짜 기준 월의 시작과 끝 날짜 반환
 * @param {Date} date - 기준 날짜
 * @returns {Object} { start: Date, end: Date }
 */
export function getMonthRange(date = new Date()) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * 날짜 범위로 이벤트 필터링
 * @param {Array} events - 이벤트 배열
 * @param {Date} start - 시작 날짜
 * @param {Date} end - 끝 날짜
 * @returns {Array} 필터링된 이벤트 배열
 */
export function filterEventsByDateRange(events, start, end) {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= start && eventDate <= end;
  });
}

/**
 * 이벤트 배열을 날짜별로 그룹핑
 * @param {Array} events - 이벤트 배열
 * @returns {Object} { 'YYYY-MM-DD': [events], ... }
 */
export function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const dateKey = event.date; // 'YYYY-MM-DD' 형식
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});
}

/**
 * 날짜를 'YYYY-MM-DD' 형식 문자열로 변환
 * @param {Date} date - 날짜 객체
 * @returns {string} 'YYYY-MM-DD' 형식 문자열
 */
export function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 특정 주의 모든 날짜 배열 반환
 * @param {Date} date - 기준 날짜
 * @returns {Array<Date>} 월~일 7일 배열
 */
export function getWeekDays(date = new Date()) {
  const { start } = getWeekRange(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * 캘린더 그리드용 날짜 배열 생성 (월간)
 * @param {Date} date - 기준 날짜
 * @returns {Array<Date|null>} 6주 x 7일 = 42개 날짜 (해당 월 외의 날짜는 Date 객체, 빈 공간은 null)
 */
export function getCalendarDays(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 월요일 시작 기준으로 첫 주의 시작점 계산
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1; // 월요일 = 0
  
  const days = [];
  
  // 이전 달 날짜 채우기
  const prevMonthLastDay = new Date(year, month, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
    days.push({ date: d, isCurrentMonth: false });
  }
  
  // 현재 달 날짜 채우기
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // 다음 달 날짜로 42개 채우기
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  
  return days;
}

