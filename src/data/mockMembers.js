/**
 * 멤버 목업 데이터
 * - 다양한 상태(ACTIVE/INACTIVE/WARN) 조합 포함
 */

export const mockMembers = [
  {
    id: 1,
    nickname: 'JA',
    name: '김JA',
    sex: 'F',
    region: '금천구',
    participationLogs: [
      { eventId: 1, eventTitle: '압구정 카페 벙', date: '2025-02-03', status: 'attended' },
      { eventId: 2, eventTitle: '홍대 와인바 모임', date: '2025-01-20', status: 'attended' },
      { eventId: 3, eventTitle: '신림 보드게임', date: '2025-01-10', status: 'attended' },
    ],
  },
  {
    id: 2,
    nickname: '루다',
    name: '김루다',
    sex: 'F',
    region: '영등포구',
    participationLogs: [
      { eventId: 4, eventTitle: '주토피아 영화', date: '2025-02-07', status: 'attended' },
      { eventId: 5, eventTitle: '연남동 브런치', date: '2025-02-01', status: 'attended' },
    ],
  },
  {
    id: 3,
    nickname: '민수',
    name: '김민수',
    sex: 'M',
    region: '관악구',
    participationLogs: [
      { eventId: 1, eventTitle: '압구정 카페 벙', date: '2025-02-03', status: 'attended' },
      { eventId: 6, eventTitle: '강남 번개', date: '2024-12-15', status: 'no_show' },
      { eventId: 7, eventTitle: '송파 모임', date: '2024-12-01', status: 'no_show' },
    ],
  },
  {
    id: 4,
    nickname: '다연',
    name: '김다연',
    sex: 'F',
    region: '마포구',
    participationLogs: [
      { eventId: 4, eventTitle: '주토피아 영화', date: '2025-02-07', status: 'attended' },
      { eventId: 8, eventTitle: '합정 독서모임', date: '2025-01-25', status: 'attended' },
      { eventId: 9, eventTitle: '홍대 카페', date: '2025-01-15', status: 'no_show' },
    ],
  },
  {
    id: 5,
    nickname: '참크래커',
    name: '김참크래커',
    sex: 'M',
    region: '서초구',
    participationLogs: [
      { eventId: 4, eventTitle: '주토피아 영화', date: '2025-02-07', status: 'attended' },
    ],
  },
  {
    id: 6,
    nickname: '유림',
    name: '김유림',
    sex: 'F',
    region: '강남구',
    participationLogs: [
      { eventId: 10, eventTitle: '강남 점심', date: '2024-11-20', status: 'attended' },
      { eventId: 11, eventTitle: '압구정 저녁', date: '2024-11-05', status: 'attended' },
    ],
  },
  {
    id: 7,
    nickname: 'J',
    name: '김J',
    sex: 'M',
    region: '용산구',
    participationLogs: [
      { eventId: 4, eventTitle: '주토피아 영화', date: '2025-02-07', status: 'attended' },
      { eventId: 12, eventTitle: '이태원 모임', date: '2025-01-30', status: 'attended' },
      { eventId: 13, eventTitle: '한남동 카페', date: '2025-01-20', status: 'no_show' },
      { eventId: 14, eventTitle: '용산 번개', date: '2025-01-10', status: 'no_show' },
    ],
  },
  {
    id: 8,
    nickname: '지원',
    name: '김지원',
    sex: 'F',
    region: '송파구',
    participationLogs: [], // 신규 멤버, 참여 이력 없음
  },
  {
    id: 9,
    nickname: '동기',
    name: '김동기',
    sex: 'M',
    region: '강동구',
    participationLogs: [
      { eventId: 15, eventTitle: '잠실 모임', date: '2024-10-15', status: 'attended' },
    ],
  },
];
