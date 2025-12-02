import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function OcrTest() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages(imageUrls);
    setResults([]);
  };

  const runOcr = async () => {
    if (images.length === 0) return;

    setLoading(true);
    setProgress(0);
    const ocrResults = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];

      try {
        const result = await Tesseract.recognize(imageUrl, 'kor+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // 전체 진행률 계산
              const singleProgress = m.progress * 100;
              const totalProgress =
                ((i + m.progress) / images.length) * 100;
              setProgress(Math.round(totalProgress));
            }
          },
        });

        ocrResults.push({
          imageIndex: i + 1,
          text: result.data.text,
          confidence: result.data.confidence,
        });
      } catch (error) {
        ocrResults.push({
          imageIndex: i + 1,
          text: `에러 발생: ${error.message}`,
          confidence: 0,
        });
      }
    }

    setResults(ocrResults);
    setLoading(false);
    setProgress(100);
  };

  // 텍스트에서 정보 파싱 시도 (두 이미지 합쳐서 분석)
  const parseEventInfo = (text, allTexts = []) => {
    // 모든 이미지 텍스트 합치기
    const combinedText = allTexts.length > 0 ? allTexts.join('\n') : text;

    // 1. 호스트 찾기 - "루다" 같은 이름 뒤에 제목이 오는 패턴 (이미지1)
    // 호스트는 보통 프로필 이미지 영역에서 이름만 단독으로 나옴
    const hostPattern = /\n\s*([가-힣a-zA-Z]{1,10})\s*\n\s*(\d{1,2}\/\d{1,2})/;
    const hostMatch = text.match(hostPattern);
    const host = hostMatch ? hostMatch[1].trim() : null;

    // 2. 제목 찾기 - 날짜로 시작하는 문장 (12/7 주토피아 보러 가자요!!)
    const titlePattern = /(\d{1,2}\/\d{1,2}\s*[^영\n]{3,50})/;
    const titleMatch = text.match(titlePattern);
    let title = titleMatch ? titleMatch[1].trim() : null;
    
    // 제목에서 불필요한 문자 정리
    if (title) {
      title = title.replace(/[!'ㄴ@]+$/, '').trim();
      // 이모지는 유지하되 깨진 문자 제거
      title = title.replace(/[^\w\s가-힣\d\/\-\.\,\!\?\~\@\#\$\%\^\&\*\(\)\[\]\{\}\<\>\:\;\'\"\`\+\=\|\\💜🐰🦊🍓]/g, ' ').trim();
    }

    // 3. 장소+날짜 찾기 - "영등포구ㆍ12.7(일) 오후 2:00" 패턴
    const locDatePattern = /([가-힣]+구)\s*[ㆍ·.]\s*(\d{1,2}\.\d{1,2}\s*\([월화수목금토일]\)\s*(오전|오후)?\s*\d{1,2}:\d{2})/;
    const locDateMatch = text.match(locDatePattern);
    
    let location = null;
    let dateTime = null;
    
    if (locDateMatch) {
      location = locDateMatch[1];
      dateTime = locDateMatch[2];
    } else {
      // 따로 찾기
      const locationPattern = /([가-힣]+구)\s*[ㆍ·.]/;
      const locationMatch = text.match(locationPattern);
      location = locationMatch ? locationMatch[1] : null;

      const datePattern = /(\d{1,2}\.\d{1,2})\s*\([월화수목금토일]\)\s*(오전|오후)?\s*(\d{1,2}:\d{2})?/;
      const dateMatch = text.match(datePattern);
      dateTime = dateMatch ? dateMatch[0] : null;
    }

    // 4. 멤버 찾기 - "이름 + 클럽멤버" 또는 "이름 + 클럼멤버" 패턴 (OCR 오타 포함)
    const memberPattern = /([가-힣a-zA-Z]{1,10})\s*[ⓒ@®©()0-9]*\s*클[럽럼]멤버/g;
    const members = [];
    let memberMatch;
    while ((memberMatch = memberPattern.exec(combinedText)) !== null) {
      const name = memberMatch[1].trim();
      // 중복 제거, 호스트는 멤버 목록에서 제외
      if (name && !members.includes(name) && name !== host) {
        members.push(name);
      }
    }

    return {
      title,
      dateTime,
      location,
      members,
      host,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          OCR 테스트
        </h1>
        <p className="text-[13px] text-slate-500 mb-4">
          문토 앱 캡처 이미지를 올려서 텍스트 인식 테스트
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

        {/* OCR 실행 버튼 */}
        {images.length > 0 && (
          <button
            onClick={runOcr}
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:bg-slate-400 transition mb-4"
          >
            {loading ? `인식 중... ${progress}%` : '🔍 텍스트 인식 시작'}
          </button>
        )}

        {/* 진행률 바 */}
        {loading && (
          <div className="w-full h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 결과 출력 */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* 통합 파싱 결과 (모든 이미지 합쳐서) */}
            {(() => {
              const allTexts = results.map(r => r.text);
              const combinedParsed = parseEventInfo(allTexts.join('\n'), allTexts);
              
              return (
                <div className="bg-white border-2 border-emerald-300 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">
                    🎯 통합 파싱 결과
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-[12px] text-slate-700">
                      <span className="font-semibold">제목:</span> {combinedParsed.title || '(못 찾음)'}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      <span className="font-semibold">장소/날짜:</span> {combinedParsed.location || '?'} · {combinedParsed.dateTime || '?'}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      <span className="font-semibold">호스트:</span> {combinedParsed.host || '(못 찾음)'}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      <span className="font-semibold">멤버:</span> {combinedParsed.members.length > 0 ? combinedParsed.members.join(', ') : '(못 찾음)'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 개별 이미지 원본 텍스트 */}
            {results.map((result, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    이미지 {result.imageIndex} 원본
                  </span>
                  <span className="text-[11px] text-slate-500">
                    신뢰도: {Math.round(result.confidence)}%
                  </span>
                </div>

                {/* 원본 텍스트 */}
                <div>
                  <pre className="text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded-lg max-h-48 overflow-y-auto">
                    {result.text || '(인식된 텍스트 없음)'}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 뒤로가기 */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            ← 소셜링 탭으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

