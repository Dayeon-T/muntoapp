import { useState } from 'react';

/**
 * 멤버 수정 모달
 */
export default function EditMember({ member, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    nickname: member.nickname || '',
    name: member.name || '',
    sex: member.sex || 'M',
    region: member.region || '',
    age: member.age || '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(member.id, formData);
    onClose();
  };

  const isFormValid = () => {
    return formData.nickname.trim();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">멤버 정보 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 닉네임 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              닉네임 *
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              placeholder="닉네임 입력"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0575E6] focus:border-transparent"
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="실명 입력 (선택)"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0575E6] focus:border-transparent"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              성별
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="M"
                  checked={formData.sex === 'M'}
                  onChange={() => handleChange('sex', 'M')}
                  className="w-4 h-4 text-[#0575E6]"
                />
                <span className="text-sm text-slate-700">남</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="F"
                  checked={formData.sex === 'F'}
                  onChange={() => handleChange('sex', 'F')}
                  className="w-4 h-4 text-[#0575E6]"
                />
                <span className="text-sm text-slate-700">여</span>
              </label>
            </div>
          </div>

          {/* 나이 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              나이
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value) || '')}
              placeholder="나이 입력"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0575E6] focus:border-transparent"
            />
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              지역
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
              placeholder="예: 강남구"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0575E6] focus:border-transparent"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-[#0575E6] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              수정하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

