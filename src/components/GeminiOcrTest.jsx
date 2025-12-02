import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 설정
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function GeminiOcrTest() {
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages(imageUrls);
    setImageFiles(files);
    setResult(null);
    setError(null);
  };

  // 파일을 base64로 변환
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // data:image/png;base64,xxxxx 에서 base64 부분만 추출
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const runGeminiOcr = async () => {
    if (imageFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // 이미지들을 base64로 변환
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

      // Gemini에게 요청
      const prompt = `이 이미지들은 "문토" 앱의 소셜링(모임) 상세 페이지 캡처입니다.

이미지에서 다음 정보를 추출해주세요:

1. title (제목): 모임 제목 (예: "12/7 주토피아 보러 가자요!!" 같은 형태)
2. location (장소): 지역구 이름 (예: 영등포구, 종로구 등)
3. dateTime (날짜/시간): 날짜와 시간 (예: "12.7(일) 오후 2:00")
4. host (호스트): 모임을 만든 사람 이름 (멤버 목록에서 맨 위에 있는 사람, 보통 번개 아이콘이 있음)
5. members (참여 멤버): 호스트를 제외한 나머지 참여자 이름들 (클럽멤버 태그가 붙어있는 사람들)

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "title": "제목",
  "location": "장소",
  "dateTime": "날짜시간",
  "host": "호스트이름",
  "members": ["멤버1", "멤버2", "멤버3"]
}`;

      const response = await model.generateContent([prompt, ...imageParts]);
      const text = response.response.text();

      // JSON 파싱 시도
      try {
        // JSON 부분만 추출 (혹시 다른 텍스트가 섞여있을 경우)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult(parsed);
        } else {
          setError('JSON 형식을 찾을 수 없습니다: ' + text);
        }
      } catch (parseError) {
        setError('JSON 파싱 실패: ' + text);
      }
    } catch (err) {
      setError('API 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          🤖 Gemini AI 인식
        </h1>
        <p className="text-[13px] text-slate-500 mb-4">
          문토 앱 캡처 이미지를 AI가 분석합니다
        </p>

        {/* 파일 업로드 */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 transition"
          >
            📷 이미지 선택 (최대 2장)
          </button>
        </div>

        {/* 이미지 미리보기 */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {images.map((src, idx) => (
              <div
                key={idx}
                className="aspect-[9/16] rounded-lg overflow-hidden border border-slate-200 bg-white"
              >
                <img
                  src={src}
                  alt={`업로드 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* AI 분석 버튼 */}
        {images.length > 0 && (
          <button
            onClick={runGeminiOcr}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition mb-4"
          >
            {loading ? '🤖 AI 분석 중...' : '🤖 Gemini AI로 분석하기'}
          </button>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* 결과 표시 */}
        {result && (
          <div className="bg-white border-2 border-emerald-300 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-3">
              🎯 AI 분석 결과
            </p>
            <div className="space-y-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-500 mb-0.5">제목</p>
                <p className="text-[13px] font-medium text-slate-900">
                  {result.title || '-'}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-500 mb-0.5">장소 / 날짜</p>
                <p className="text-[13px] font-medium text-slate-900">
                  {result.location || '?'} · {result.dateTime || '?'}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-500 mb-0.5">호스트</p>
                <p className="text-[13px] font-medium text-slate-900">
                  {result.host || '-'}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-500 mb-0.5">
                  멤버 ({result.members?.length || 0}명)
                </p>
                <p className="text-[13px] font-medium text-slate-900">
                  {result.members?.length > 0
                    ? result.members.join(', ')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 뒤로가기 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            ← 소셜링 탭으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

