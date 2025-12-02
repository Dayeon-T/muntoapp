import { useState, useRef, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 설정
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 비활성화 사유 라벨
const DISABLE_REASON_LABELS = {
  noshow: '노쇼 누적',
  inactive: '장기 미활동',
  request: '본인 요청',
  other: '기타',
};

export default function AddMember({ onClose, onSubmit, members = [], onUpdateMember, onRestoreMember }) {
  // 폼 상태
  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    birthYear: '',
    sex: '',
    region: '',
    joinDate: '',
  });

  // AI 관련 상태
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiDone, setAiDone] = useState(false);

  // 중복 체크 관련 상태
  const [duplicateAction, setDuplicateAction] = useState(null); // null | 'edit' | 'new'

  const fileInputRef = useRef(null);

  // 닉네임으로 기존 멤버 검색
  const matchedMember = useMemo(() => {
    if (!formData.nickname.trim()) return null;
    return members.find(
      (m) => m.nickname.toLowerCase() === formData.nickname.toLowerCase().trim()
    );
  }, [formData.nickname, members]);

  // 중복 멤버가 비활성화 상태인지
  const isMatchedMemberDisabled = matchedMember?.status === 'DISABLED';

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

      const prompt = `이 이미지는 "문토" 앱의 멤버 프로필 화면 캡처입니다.

이미지에서 다음 정보를 추출해주세요:

1. nickname (닉네임): 프로필 상단에 표시된 닉네임
2. joinDate (가입일): "YYYY.M.D 가입" 형태로 표시된 날짜 → "YYYY-MM-DD" 형식으로 변환
3. birthYear (출생년도): 자기소개에서 "XX년생" 형태 → 4자리 년도로 변환 (예: 94년생 → 1994)
4. sex (성별): 자기소개에서 남자/여자 언급 → "M" 또는 "F"
5. region (지역): 지역 정보가 있으면 추출 (예: 강남구, 마포구 등)

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "nickname": "닉네임",
  "joinDate": "2025-12-02",
  "birthYear": "1994",
  "sex": "M",
  "region": "지역명 또는 빈문자열"
}

참고:
- 년생이 두 자리면 1900년대(예: 94 → 1994) 또는 2000년대(예: 04 → 2004)로 적절히 변환
- 성별을 찾을 수 없으면 빈 문자열
- 지역을 찾을 수 없으면 빈 문자열`;

      const response = await model.generateContent([prompt, ...imageParts]);
      const text = response.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 폼에 자동 입력
        setFormData({
          nickname: parsed.nickname || '',
          name: '',
          birthYear: parsed.birthYear || '',
          sex: parsed.sex || '',
          region: parsed.region || '',
          joinDate: parsed.joinDate || '',
        });
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

  // 나이 계산
  const calculateAge = (birthYear) => {
    if (!birthYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(birthYear, 10);
  };

  // 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    // 중복 멤버가 있는데 아직 선택하지 않은 경우
    if (matchedMember && !duplicateAction) {
      return;
    }

    // 기존 멤버 수정 모드
    if (duplicateAction === 'edit' && matchedMember) {
      const updatedData = {
        nickname: formData.nickname,
        name: formData.name || null,
        birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
        age: calculateAge(formData.birthYear),
        sex: formData.sex || matchedMember.sex,
        region: formData.region || null,
      };
      onUpdateMember?.(matchedMember.id, updatedData);
      onClose?.();
      return;
    }
    
    // 새 멤버 등록
    const memberData = {
      id: Date.now(),
      nickname: formData.nickname,
      name: formData.name || null,
      birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
      age: calculateAge(formData.birthYear),
      sex: formData.sex || 'M',
      region: formData.region || null,
      joinDate: formData.joinDate,
      participationLogs: [],
    };

    onSubmit?.(memberData);
    onClose?.();
  };

  // 중복 시 제출 가능 여부
  const canSubmit = !matchedMember || duplicateAction !== null;

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
        <h1 className="text-sm font-semibold text-slate-900">멤버 추가</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-4">
        {/* AI 이미지 업로드 섹션 */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            📷 프로필 캡처로 자동 입력 (선택)
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
              문토 앱 멤버 프로필 캡처 선택
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
                  {aiLoading ? '🤖 AI 분석 중...' : '🤖 AI로 자동 입력하기'}
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
          {/* 닉네임 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              닉네임 *
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => {
                handleInputChange('nickname', e.target.value);
                setDuplicateAction(null); // 닉네임 변경 시 선택 초기화
              }}
              placeholder="예: 겸결"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${
                matchedMember && !duplicateAction
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200'
              }`}
              required
            />

            {/* 중복 멤버 발견 알림 */}
            {matchedMember && !duplicateAction && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                {isMatchedMemberDisabled ? (
                  <>
                    <p className="text-xs font-medium text-amber-700 mb-1">
                      ⚠️ 비활성화된 멤버예요
                    </p>
                    <p className="text-[11px] text-amber-600 mb-2">
                      {matchedMember.nickname}
                      {matchedMember.name && ` (${matchedMember.name})`} · 
                      {matchedMember.sex === 'M' ? ' 남' : ' 여'}
                      {matchedMember.region && ` · ${matchedMember.region}`}
                    </p>
                    <p className="text-[10px] text-slate-500 mb-3">
                      비활성화 사유: {DISABLE_REASON_LABELS[matchedMember.disableReason] || '알 수 없음'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreMember?.(matchedMember.id);
                          onClose?.();
                        }}
                        className="flex-1 py-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        다시 활성화
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateAction('new')}
                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        다른 사람으로 등록
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-amber-700 mb-1">
                      ⚠️ 이미 있는 멤버예요
                    </p>
                    <p className="text-[11px] text-amber-600 mb-3">
                      {matchedMember.nickname}
                      {matchedMember.name && ` (${matchedMember.name})`} · 
                      {matchedMember.sex === 'M' ? ' 남' : ' 여'}
                      {matchedMember.region && ` · ${matchedMember.region}`}
                      {matchedMember.age && ` · ${matchedMember.age}세`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDuplicateAction('edit')}
                        className="flex-1 py-2 text-[11px] font-medium text-[#0575E6] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        기존 멤버 수정
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateAction('new')}
                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        다른 사람으로 등록
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 선택 결과 표시 */}
            {duplicateAction === 'new' && matchedMember && (
              <p className="text-[10px] text-slate-500 mt-1">
                ✓ 같은 닉네임의 다른 사람으로 등록합니다
              </p>
            )}
            {duplicateAction === 'edit' && matchedMember && (
              <p className="text-[10px] text-[#0575E6] mt-1">
                ✓ 기존 멤버 정보를 수정합니다
              </p>
            )}
          </div>

          {/* 이름 (선택) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              이름 (선택)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: 김철수"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* 출생년도 & 성별 */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                출생년도
              </label>
              <input
                type="text"
                value={formData.birthYear}
                onChange={(e) => handleInputChange('birthYear', e.target.value)}
                placeholder="예: 1994"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
              {formData.birthYear && (
                <p className="text-[10px] text-slate-400 mt-1">
                  → {calculateAge(formData.birthYear)}세
                </p>
              )}
            </div>
            <div className="shrink-0">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                성별
              </label>
              <div className="flex gap-4 py-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="M"
                    checked={formData.sex === 'M'}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                  />
                  <span className="text-sm text-slate-700">남</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="F"
                    checked={formData.sex === 'F'}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                  />
                  <span className="text-sm text-slate-700">여</span>
                </label>
              </div>
            </div>
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              지역
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              placeholder="예: 마포구"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* 가입일 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              가입일 *
            </label>
            <input
              type="date"
              value={formData.joinDate}
              onChange={(e) => handleInputChange('joinDate', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              required
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-[#0575E6] text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition mt-6"
          >
            {duplicateAction === 'edit' ? '멤버 정보 수정하기' : '멤버 추가하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

