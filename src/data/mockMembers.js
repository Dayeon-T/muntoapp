/**
 * 멤버 목업 데이터
 * - mockEvents의 participants와 일치하도록 구성
 * - participationLogs는 완료된(done) 이벤트 기준
 * - joinDate: 가입일 (참여전 판단용)
 */

export const mockMembers = [
  {
    id: 101,
    nickname: '영희',
    name: '김영희',
    sex: 'F',
    region: '강남구',
    age: 28,
    joinDate: '2025-12-01', // 최근 가입, 아직 참여전
    participationLogs: [],
  },
  {
    id: 102,
    nickname: 'JA',
    name: '김JA',
    sex: 'F',
    region: '금천구',
    age: 27,
    joinDate: '2025-11-30', // 최근 가입, 아직 참여전
    participationLogs: [],
  },
  {
    id: 201,
    nickname: '민수',
    name: '김민수',
    sex: 'M',
    region: '관악구',
    age: 31,
    joinDate: '2025-10-15',
    participationLogs: [
      { eventId: 2, eventTitle: '홍대 와인바 모임', date: '2025-11-28', status: 'attended', role: 'host' },
    ],
  },
  {
    id: 202,
    nickname: '지영',
    name: '박지영',
    sex: 'F',
    region: '마포구',
    age: 29,
    joinDate: '2025-11-01',
    participationLogs: [
      { eventId: 2, eventTitle: '홍대 와인바 모임', date: '2025-11-28', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 203,
    nickname: '철수',
    name: '이철수',
    sex: 'M',
    region: '영등포구',
    age: 32,
    joinDate: '2025-11-10',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'no_show', role: 'member' },
      { eventId: 2, eventTitle: '홍대 와인바 모임', date: '2025-11-28', status: 'no_show', role: 'member' },
    ],
  },
  {
    id: 204,
    nickname: '수진',
    name: '최수진',
    sex: 'F',
    region: '서초구',
    age: 30,
    joinDate: '2025-09-20',
    participationLogs: [
      { eventId: 2, eventTitle: '홍대 와인바 모임', date: '2025-11-28', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 401,
    nickname: '태희',
    name: '김태희',
    sex: 'F',
    region: '강남구',
    age: 33,
    joinDate: '2025-08-01',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'attended', role: 'host' },
    ],
  },
  {
    id: 402,
    nickname: '동현',
    name: '박동현',
    sex: 'M',
    region: '송파구',
    age: 34,
    joinDate: '2025-10-01',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 403,
    nickname: '서연',
    name: '이서연',
    sex: 'F',
    region: '강동구',
    age: 27,
    joinDate: '2025-11-15',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 404,
    nickname: '재민',
    name: '최재민',
    sex: 'M',
    region: '용산구',
    age: 30,
    joinDate: '2025-09-01',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'attended', role: 'member' },
      { eventId: 9, eventTitle: '신촌 맥주 번개', date: '2025-12-01', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 405,
    nickname: '유나',
    name: '한유나',
    sex: 'F',
    region: '마포구',
    age: 26,
    joinDate: '2025-11-20',
    participationLogs: [
      { eventId: 4, eventTitle: '강남 보드게임 번개', date: '2025-11-25', status: 'no_show', role: 'member' },
    ],
  },
  {
    id: 901,
    nickname: '준서',
    name: '김준서',
    sex: 'M',
    region: '서대문구',
    age: 35,
    joinDate: '2025-07-15',
    participationLogs: [
      { eventId: 9, eventTitle: '신촌 맥주 번개', date: '2025-12-01', status: 'attended', role: 'host' },
    ],
  },
  {
    id: 902,
    nickname: '서아',
    name: '박서아',
    sex: 'F',
    region: '서대문구',
    age: 28,
    joinDate: '2025-10-20',
    participationLogs: [
      { eventId: 9, eventTitle: '신촌 맥주 번개', date: '2025-12-01', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 903,
    nickname: '예준',
    name: '이예준',
    sex: 'M',
    region: '은평구',
    age: 29,
    joinDate: '2025-11-05',
    participationLogs: [
      { eventId: 9, eventTitle: '신촌 맥주 번개', date: '2025-12-01', status: 'attended', role: 'member' },
    ],
  },
  {
    id: 904,
    nickname: '수아',
    name: '최수아',
    sex: 'F',
    region: '마포구',
    age: 25,
    joinDate: '2025-11-25',
    participationLogs: [
      { eventId: 9, eventTitle: '신촌 맥주 번개', date: '2025-12-01', status: 'no_show', role: 'member' },
    ],
  },
  {
    id: 501,
    nickname: '지훈',
    name: '김지훈',
    sex: 'M',
    region: '용산구',
    age: 24,
    joinDate: '2025-12-02', // 오늘 가입, 참여전
    participationLogs: [],
  },
  {
    id: 701,
    nickname: '은지',
    name: '박은지',
    sex: 'F',
    region: '마포구',
    age: 27,
    joinDate: '2025-11-28', // 최근 가입, 참여전
    participationLogs: [],
  },
  {
    id: 801,
    nickname: '시우',
    name: '이시우',
    sex: 'M',
    region: '송파구',
    age: 26,
    joinDate: '2025-11-29', // 최근 가입, 참여전
    participationLogs: [],
  },
  {
    id: 1001,
    nickname: '유령',
    name: '김유령',
    sex: 'M',
    region: '강서구',
    age: 36,
    joinDate: '2025-09-15', // 가입 후 78일, 참여 0회 → INACTIVE (가입 후 미참여)
    participationLogs: [],
  },
  {
    id: 1002,
    nickname: '옛날',
    name: '박옛날',
    sex: 'F',
    region: '중구',
    age: 38,
    joinDate: '2025-06-01', // 오래 전 가입
    participationLogs: [
      { eventId: 100, eventTitle: '여름 피크닉', date: '2025-09-20', status: 'attended', role: 'member' },
    ], // 마지막 참여 73일 전 → INACTIVE (60일 이상 미참여)
  },
];
