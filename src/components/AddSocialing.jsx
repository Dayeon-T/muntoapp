import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 설정
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function AddSocialing({ onClose, onSubmit, editEvent }) {
  // 수정 모드인지 확인
  const isEditMode = !!editEvent;

  // 기존 이벤트 데이터로 폼 초기화 (수정 모드)
  const getInitialFormData = () => {
    if (editEvent) {
      const host = editEvent.participants?.find(p => p.role === 'host');
      const members = editEvent.participants
        ?.filter(p => p.role !== 'host')
        ?.map(p => p.nickname)
        ?.join(', ') || '';
      
      return {
        title: editEvent.title || '',
        location: editEvent.location || '',
        dateTime: editEvent.date || '',
        host: host?.nickname || '',
        members: members,
        minParticipants: editEvent.minParticipants?.toString() || '',
        maxParticipants: editEvent.maxParticipants?.toString() || '',
        hasAlcohol: editEvent.hasAlcohol || false,
        isNight: editEvent.isNight || false,
      };
    }
    return {
      title: '',
      location: '',
      dateTime: '',
      host: '',
      members: '',
      minParticipants: '',
      maxParticipants: '',
      hasAlcohol: false,
      isNight: false,
    };
  };

  // 폼 상태
  const [formData, setFormData] = useState(getInitialFormData());

  // AI 관련 상태
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiDone, setAiDone] = useState(false);

  const fileInputRef = useRef(null);

  // 파일 선택
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages(imageUrls);
    setImageFiles(files);
    setAiError(null);
    setAiDone(false);
  };

  // 파일을 base64로 변환
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // AI 분석 실행
  const runAiAnalysis = async () => {
    if (imageFiles.length === 0) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const imageParts = await Promise.all(
        imageFiles.map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            inlineData: {
              data: base64,
              mimeType: file.type,
            },
          };
        })
      );

      const prompt = `이 이미지들은 "문토" 앱의 소셜링(모임) 상세 페이지 캡처입니다.

이미지에서 다음 정보를 추출해주세요:

1. title (제목): 모임 제목 (예: "12/7 주토피아 보러 가자요!!" 같은 형태)
2. location (장소): 지역명 또는 "온라인" (예: 영등포구, 종로구, 온라인 등)
3. dateTime (날짜/시간): 날짜와 시간 (예: "12.7(일) 오후 2:00")
4. host (호스트): 모임을 만든 사람 이름 (멤버 목록에서 맨 위에 있는 사람, 보통 번개 아이콘이 있음)
5. members (참여 멤버): 호스트를 제외한 나머지 참여자 이름들 (클럽멤버 태그가 붙어있는 사람들)
6. minParticipants (최소 인원): "최소 N명" 형태에서 N 추출 (숫자만)
7. maxParticipants (최대 인원): "최대 N명" 형태에서 N 추출 (숫자만)

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "title": "제목",
  "location": "장소",
  "dateTime": "날짜시간",
  "host": "호스트이름",
  "members": ["멤버1", "멤버2", "멤버3"],
  "minParticipants": 3,
  "maxParticipants": 4
}`;

      const response = await model.generateContent([prompt, ...imageParts]);
      const text = response.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 폼에 자동 입력 (기존 음주/야간 설정 유지)
        setFormData((prev) => ({
          ...prev,
          title: parsed.title || '',
          location: parsed.location || '',
          dateTime: parsed.dateTime || '',
          host: parsed.host || '',
          members: parsed.members?.join(', ') || '',
          minParticipants: parsed.minParticipants?.toString() || '',
          maxParticipants: parsed.maxParticipants?.toString() || '',
        }));
        setAiDone(true);
      } else {
        setAiError('AI 응답을 파싱할 수 없습니다');
      }
    } catch (err) {
      setAiError('AI 오류: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 제출
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // members 문자열을 배열로 변환
    const membersArray = formData.members
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m);

    // 수정 모드일 때는 기존 참가자 데이터 유지하면서 업데이트
    let participants;
    if (isEditMode && editEvent.participants) {
      // 호스트 찾기/업데이트
      const existingHost = editEvent.participants.find(p => p.role === 'host');
      const hostParticipant = {
        ...(existingHost || { id: Date.now(), sex: 'M', status: 'registered' }),
        nickname: formData.host,
        role: 'host',
      };
      
      // 멤버들 업데이트 (기존 멤버 중 매칭되는 건 유지, 새로운 건 추가)
      const memberParticipants = membersArray.map((nickname, idx) => {
        const existing = editEvent.participants.find(p => p.nickname === nickname && p.role !== 'host');
        if (existing) return existing;
        return {
          id: Date.now() + idx + 1,
          nickname,
          sex: 'M',
          status: 'registered',
          role: 'member',
        };
      });
      
      participants = [hostParticipant, ...memberParticipants];
    } else {
      // 새로 추가할 때
      participants = [
        { id: Date.now(), nickname: formData.host, sex: 'M', status: 'registered', role: 'host' },
        ...membersArray.map((nickname, idx) => ({
          id: Date.now() + idx + 1,
          nickname,
          sex: 'M',
          status: 'registered',
          role: 'member',
        })),
      ];
    }

    const eventData = {
      id: isEditMode ? editEvent.id : Date.now(),
      title: formData.title,
      location: formData.location,
      date: formData.dateTime,
      participants,
      minParticipants: formData.minParticipants ? parseInt(formData.minParticipants, 10) : null,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null,
      status: isEditMode ? editEvent.status : 'scheduled',
      hasAlcohol: formData.hasAlcohol,
      isNight: formData.isNight,
    };

    onSubmit?.(eventData, isEditMode);
    onClose?.();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← 취소
        </button>
        <h1 className="text-sm font-semibold text-slate-900">
          {isEditMode ? '소셜링 수정' : '소셜링 추가'}
        </h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-4">
        {/* AI 이미지 업로드 섹션 */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            📷 이미지로 자동 입력 (선택)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {images.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:border-slate-400 hover:bg-slate-100 transition"
            >
              문토 앱 캡처 이미지 선택
            </button>
          ) : (
            <div className="space-y-2">
              {/* 이미지 미리보기 */}
              <div className="flex gap-2">
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-24 rounded-lg overflow-hidden border border-slate-200"
                  >
                    <img
                      src={src}
                      alt={`이미지 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-lg hover:border-slate-400"
                >
                  +
                </button>
              </div>

              {/* AI 분석 버튼 */}
              {!aiDone && (
                <button
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-[#0575E6] text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
                >
                  {aiLoading ? '분석 중...' : '자동 입력하기'}
                </button>
              )}

              {aiDone && (
                <p className="text-xs text-emerald-600 text-center">
                  ✅ AI 분석 완료! 아래에서 수정 후 저장하세요
                </p>
              )}

              {aiError && (
                <p className="text-xs text-red-600 text-center">{aiError}</p>
              )}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400">또는 직접 입력</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              required
            />
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              장소
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* 날짜/시간 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              날짜 / 시간
            </label>
            <input
              type="text"
              value={formData.dateTime}
              onChange={(e) => handleInputChange('dateTime', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* 호스트 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              호스트 *
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              required
            />
          </div>

          {/* 멤버 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              참여 멤버 (쉼표로 구분)
            </label>
            <textarea
              value={formData.members}
              onChange={(e) => handleInputChange('members', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none"
            />
          </div>

          {/* 최소/최대 인원 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                최소 인원
              </label>
              <input
                type="number"
                value={formData.minParticipants}
                onChange={(e) => handleInputChange('minParticipants', e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                최대 인원
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 음주/야간 설정 */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasAlcohol}
                onChange={(e) => handleInputChange('hasAlcohol', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0575E6] focus:ring-[#0575E6]"
              />
              <span className="text-sm text-slate-700">음주 포함</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNight}
                onChange={(e) => handleInputChange('isNight', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0575E6] focus:ring-[#0575E6]"
              />
              <span className="text-sm text-slate-700">야간 모임</span>
            </label>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0575E6] text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition mt-6"
          >
            {isEditMode ? '수정 완료' : '소셜링 추가하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

