/**
 * 날짜 관련 유틸 함수
 */

/**
 * 상대 날짜 텍스트 반환
 * @param {string|Date} date - 날짜
 * @param {Date} baseDate - 기준 날짜 (기본: 오늘)
 * @returns {string} 상대 날짜 텍스트
 */
export function getRelativeDateText(date, baseDate = new Date()) {
  if (!date) return '';

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date(baseDate);
  
  // 날짜만 비교 (시간 제외)
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // 오늘
  if (diffDays === 0) {
    return '오늘';
  }
  
  // 내일
  if (diffDays === 1) {
    return '내일';
  }
  
  // 모레
  if (diffDays === 2) {
    return '모레';
  }
  
  // 어제
  if (diffDays === -1) {
    return '어제';
  }
  
  // 그저께
  if (diffDays === -2) {
    return '그저께';
  }

  // 일주일 이내 미래
  if (diffDays > 0 && diffDays <= 7) {
    return `${diffDays}일 후`;
  }
  
  // 일주일 이내 과거
  if (diffDays < 0 && diffDays >= -7) {
    return `${Math.abs(diffDays)}일 전`;
  }

  // 그 외
  const month = target.getMonth() + 1;
  const day = target.getDate();
  
  // 같은 해면 월/일만
  if (target.getFullYear() === today.getFullYear()) {
    return `${month}월 ${day}일`;
  }
  
  // 다른 해면 년/월/일
  return `${target.getFullYear()}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 "MM/DD (요일)" 형식으로 포맷
 * @param {string|Date} date - 날짜
 * @returns {string} 포맷된 날짜
 */
export function formatDateWithDay(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = days[d.getDay()];
  
  return `${month}/${day} (${dayOfWeek})`;
}

/**
 * 날짜와 상대 날짜를 함께 표시
 * @param {string|Date} date - 날짜
 * @returns {string} "YYYY-MM-DD (상대날짜)" 형식
 */
export function formatDateWithRelative(date) {
  if (!date) return '';
  
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const relative = getRelativeDateText(date);
  
  return `${dateStr} (${relative})`;
}

/**
 * "N일 전" 형식으로 경과일 표시
 * @param {number} days - 경과일
 * @returns {string} 경과일 텍스트
 */
export function formatDaysAgo(days) {
  if (days === null || days === undefined) return '';
  
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

