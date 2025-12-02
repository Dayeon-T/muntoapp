import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 설정
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function AddMember({ onClose, onSubmit, members = [], onRestoreMember }) {
  // 모드: 'single' | 'batch'
  const [mode, setMode] = useState('batch');

  // 일괄 등록 상태
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [extractedMembers, setExtractedMembers] = useState([]); // AI로 추출된 멤버 목록
  const [selectedMembers, setSelectedMembers] = useState([]); // 등록할 멤버 선택

  // 단일 등록 폼 상태
  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    birthYear: '',
    sex: '',
    region: '',
    joinDate: '',
  });

  const fileInputRef = useRef(null);

  // 파일 선택
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...imageUrls]);
    setImageFiles((prev) => [...prev, ...files]);
    setAiError(null);
  };

  // 이미지 삭제
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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

  // AI 일괄 분석 실행
  const runBatchAiAnalysis = async () => {
    if (imageFiles.length === 0) return;

    setAiLoading(true);
    setAiError(null);
    setExtractedMembers([]);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const results = [];

      // 각 이미지 분석
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const base64 = await fileToBase64(file);
        
        const imagePart = {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        };

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

        try {
          const response = await model.generateContent([prompt, imagePart]);
          const text = response.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const existingMember = members.find(
              (m) => m.nickname?.toLowerCase() === parsed.nickname?.toLowerCase()
            );
            
            results.push({
              id: Date.now() + i,
              ...parsed,
              imageIndex: i,
              isDuplicate: !!existingMember,
              existingMember: existingMember || null,
              isDisabled: existingMember?.status === 'disabled',
            });
          }
        } catch (err) {
          console.error(`이미지 ${i + 1} 분석 실패:`, err);
        }
      }

      setExtractedMembers(results);
      // 중복 아닌 멤버만 기본 선택
      setSelectedMembers(results.filter((m) => !m.isDuplicate).map((m) => m.id));
    } catch (err) {
      setAiError('AI 오류: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 멤버 선택 토글
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const nonDuplicates = extractedMembers.filter((m) => !m.isDuplicate);
    if (selectedMembers.length === nonDuplicates.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(nonDuplicates.map((m) => m.id));
    }
  };

  // 추출된 멤버 정보 수정
  const updateExtractedMember = (memberId, field, value) => {
    setExtractedMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, [field]: value } : m
      )
    );
  };

  // 일괄 등록
  const handleBatchSubmit = async () => {
    const membersToAdd = extractedMembers.filter((m) => selectedMembers.includes(m.id));
    
    for (const member of membersToAdd) {
      const memberData = {
        nickname: member.nickname,
        name: member.name || null,
        birthYear: member.birthYear ? parseInt(member.birthYear, 10) : null,
        sex: member.sex || 'M',
        region: member.region || null,
        joinDate: member.joinDate,
      };
      
      try {
        await onSubmit?.(memberData);
      } catch (error) {
        console.error(`${member.nickname} 등록 실패:`, error);
      }
    }
    
    onClose?.();
  };

  // 비활성화 멤버 복구
  const handleRestore = (existingMember) => {
    onRestoreMember?.(existingMember.id);
    // 해당 멤버를 목록에서 제거
    setExtractedMembers((prev) =>
      prev.filter((m) => m.existingMember?.id !== existingMember.id)
    );
  };

  // 나이 계산
  const calculateAge = (birthYear) => {
    if (!birthYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(birthYear, 10);
  };

  // 단일 등록 핸들러
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    
    const memberData = {
      nickname: formData.nickname,
      name: formData.name || null,
      birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
      sex: formData.sex || 'M',
      region: formData.region || null,
      joinDate: formData.joinDate,
    };

    await onSubmit?.(memberData);
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
        <h1 className="text-sm font-semibold text-slate-900">멤버 추가</h1>
        <div className="w-10" />
      </header>

      {/* 모드 선택 탭 */}
      <div className="flex bg-white border-b border-slate-200">
        <button
          onClick={() => setMode('batch')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mode === 'batch'
              ? 'text-slate-900 border-b-2 border-[#0575E6]'
              : 'text-slate-500'
          }`}
        >
          📷 일괄 등록
        </button>
        <button
          onClick={() => setMode('single')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mode === 'single'
              ? 'text-slate-900 border-b-2 border-[#0575E6]'
              : 'text-slate-500'
          }`}
        >
          ✏️ 개별 등록
        </button>
      </div>

      <div className="px-4 py-4">
        {mode === 'batch' ? (
          /* ======== 일괄 등록 모드 ======== */
          <div className="space-y-4">
            {/* 이미지 업로드 */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                프로필 캡처 업로드 (여러 장)
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
                  className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:border-slate-400 hover:bg-slate-100 transition"
                >
                  문토 앱 멤버 프로필 캡처 선택<br />
                  <span className="text-[10px] text-slate-400">(여러 장 선택 가능)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* 이미지 미리보기 */}
                  <div className="flex flex-wrap gap-2">
                    {images.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-20 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img
                          src={src}
                          alt={`이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-lg hover:border-slate-400"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {images.length}장 선택됨
                  </p>

                  {/* AI 분석 버튼 */}
                  {extractedMembers.length === 0 && (
                    <button
                      onClick={runBatchAiAnalysis}
                      disabled={aiLoading}
                      className="w-full py-2.5 bg-[#0575E6] text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
                    >
                      {aiLoading ? `분석 중... (${images.length}장)` : `${images.length}장 일괄 분석하기`}
                    </button>
                  )}

                  {aiError && (
                    <p className="text-xs text-red-600 text-center">{aiError}</p>
                  )}
                </div>
              )}
            </div>

            {/* 추출된 멤버 목록 */}
            {extractedMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600">
                    추출된 멤버 ({extractedMembers.length}명)
                  </p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-[10px] text-[#0575E6] hover:underline"
                  >
                    {selectedMembers.length === extractedMembers.filter((m) => !m.isDuplicate).length
                      ? '전체 해제'
                      : '전체 선택'}
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {extractedMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border ${
                        member.isDuplicate
                          ? 'bg-amber-50 border-amber-200'
                          : selectedMembers.includes(member.id)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 체크박스 */}
                        {!member.isDuplicate && (
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="mt-1 w-4 h-4 text-[#0575E6] border-slate-300 rounded focus:ring-[#0575E6]"
                          />
                        )}

                        {/* 이미지 썸네일 */}
                        <div className="w-10 h-14 rounded overflow-hidden shrink-0">
                          <img
                            src={images[member.imageIndex]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* 멤버 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="text"
                              value={member.nickname || ''}
                              onChange={(e) => updateExtractedMember(member.id, 'nickname', e.target.value)}
                              className="text-sm font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0575E6] focus:outline-none px-0 py-0.5 w-24"
                            />
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              member.sex === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                            }`}>
                              {member.sex === 'M' ? '남' : '여'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                            {member.birthYear && (
                              <span>{member.birthYear}년생 ({calculateAge(member.birthYear)}세)</span>
                            )}
                            {member.region && <span>{member.region}</span>}
                            {member.joinDate && <span>가입: {member.joinDate}</span>}
                          </div>

                          {/* 중복 경고 */}
                          {member.isDuplicate && (
                            <div className="mt-2">
                              <p className="text-[10px] text-amber-600 mb-1">
                                ⚠️ {member.isDisabled ? '비활성화된 멤버' : '이미 등록된 멤버'}
                              </p>
                              {member.isDisabled && (
                                <button
                                  onClick={() => handleRestore(member.existingMember)}
                                  className="text-[10px] text-emerald-600 hover:underline"
                                >
                                  → 다시 활성화하기
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 일괄 등록 버튼 */}
                <button
                  onClick={handleBatchSubmit}
                  disabled={selectedMembers.length === 0}
                  className="w-full py-3 bg-[#0575E6] text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                >
                  {selectedMembers.length}명 일괄 등록하기
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ======== 개별 등록 모드 ======== */
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            {/* 닉네임 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                닉네임 *
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                required
              />
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                이름 (선택)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
              className="w-full py-3 bg-[#0575E6] text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition mt-6"
            >
              멤버 추가하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
