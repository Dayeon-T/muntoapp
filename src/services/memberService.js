import { supabase } from '../lib/supabase';

/**
 * 모든 멤버 조회 (참여 로그 포함)
 */
export async function getMembers() {
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('멤버 조회 실패:', error);
    throw error;
  }

  // 각 멤버의 참여 로그 조회
  const membersWithLogs = await Promise.all(
    members.map(async (member) => {
      const { data: participations } = await supabase
        .from('participants')
        .select(`
          *,
          socialings (id, title, date, status)
        `)
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      // 완료된 이벤트의 참여 로그만 필터링
      const participationLogs = (participations || [])
        .filter((p) => p.socialings?.status === 'done')
        .map((p) => ({
          eventId: p.socialings.id,
          eventTitle: p.socialings.title,
          date: p.socialings.date,
          status: p.status,
          role: p.role,
        }));

      return {
        ...member,
        // DB 필드명을 프론트엔드 필드명으로 변환
        joinDate: member.join_date,
        birthYear: member.birth_year,
        disabledReason: member.disabled_reason,
        disabledAt: member.disabled_at,
        participationLogs,
      };
    })
  );

  return membersWithLogs;
}

/**
 * 멤버 추가
 */
export async function addMember(memberData) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      nickname: memberData.nickname,
      name: memberData.name,
      sex: memberData.sex,
      birth_year: memberData.birthYear,
      region: memberData.region,
      join_date: memberData.joinDate || new Date().toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('멤버 추가 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 멤버 수정
 */
export async function updateMember(id, memberData) {
  const updateData = {};
  
  if (memberData.nickname !== undefined) updateData.nickname = memberData.nickname;
  if (memberData.name !== undefined) updateData.name = memberData.name;
  if (memberData.sex !== undefined) updateData.sex = memberData.sex;
  if (memberData.birthYear !== undefined) updateData.birth_year = memberData.birthYear;
  if (memberData.region !== undefined) updateData.region = memberData.region;
  if (memberData.joinDate !== undefined) updateData.join_date = memberData.joinDate;
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('멤버 수정 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 멤버 비활성화
 */
export async function disableMember(id, reason) {
  const { data, error } = await supabase
    .from('members')
    .update({
      status: 'disabled',
      disabled_reason: reason,
      disabled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('멤버 비활성화 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 멤버 복구 (활성화)
 */
export async function restoreMember(id) {
  const { data, error } = await supabase
    .from('members')
    .update({
      status: 'active',
      disabled_reason: null,
      disabled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('멤버 복구 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 닉네임으로 멤버 검색 (중복 체크용)
 */
export async function findMemberByNickname(nickname) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.error('멤버 검색 실패:', error);
    throw error;
  }

  return data;
}

