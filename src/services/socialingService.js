import { supabase } from '../lib/supabase';

/**
 * 모든 소셜링 조회 (참가자 포함)
 */
export async function getSocialings() {
  const { data: socialings, error } = await supabase
    .from('socialings')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('소셜링 조회 실패:', error);
    throw error;
  }

  // 각 소셜링의 참가자 조회
  const socialingsWithParticipants = await Promise.all(
    socialings.map(async (socialing) => {
      const { data: participants } = await supabase
        .from('participants')
        .select(`
          *,
          members (id, nickname, sex, name)
        `)
        .eq('socialing_id', socialing.id);

      const participantsList = (participants || []).map((p) => ({
        id: p.members.id,
        nickname: p.members.nickname,
        sex: p.members.sex,
        name: p.members.name,
        status: p.status,
        role: p.role,
      }));

      return {
        id: socialing.id,
        title: socialing.title,
        date: socialing.date,
        location: socialing.location,
        status: socialing.status,
        hasAlcohol: socialing.has_alcohol,
        isNight: socialing.is_night,
        minParticipants: socialing.min_participants,
        maxParticipants: socialing.max_participants,
        isChecked: socialing.is_checked,
        participants: participantsList,
      };
    })
  );

  return socialingsWithParticipants;
}

/**
 * 소셜링 추가
 */
export async function addSocialing(socialingData) {
  // 1. 소셜링 생성
  const { data: socialing, error: socialingError } = await supabase
    .from('socialings')
    .insert({
      title: socialingData.title,
      date: socialingData.date,
      location: socialingData.location,
      status: socialingData.status || 'scheduled',
      has_alcohol: socialingData.hasAlcohol || false,
      is_night: socialingData.isNight || false,
      min_participants: socialingData.minParticipants,
      max_participants: socialingData.maxParticipants,
    })
    .select()
    .single();

  if (socialingError) {
    console.error('소셜링 추가 실패:', socialingError);
    throw socialingError;
  }

  // 2. 참가자 추가
  if (socialingData.participants && socialingData.participants.length > 0) {
    const participantsToInsert = socialingData.participants.map((p) => ({
      socialing_id: socialing.id,
      member_id: p.id,
      role: p.role || 'member',
      status: p.status || 'registered',
    }));

    const { error: participantsError } = await supabase
      .from('participants')
      .insert(participantsToInsert);

    if (participantsError) {
      console.error('참가자 추가 실패:', participantsError);
      // 소셜링 삭제 (롤백)
      await supabase.from('socialings').delete().eq('id', socialing.id);
      throw participantsError;
    }
  }

  return socialing;
}

/**
 * 소셜링 수정
 */
export async function updateSocialing(id, socialingData) {
  const updateData = {};

  if (socialingData.title !== undefined) updateData.title = socialingData.title;
  if (socialingData.date !== undefined) updateData.date = socialingData.date;
  if (socialingData.location !== undefined) updateData.location = socialingData.location;
  if (socialingData.status !== undefined) updateData.status = socialingData.status;
  if (socialingData.hasAlcohol !== undefined) updateData.has_alcohol = socialingData.hasAlcohol;
  if (socialingData.isNight !== undefined) updateData.is_night = socialingData.isNight;
  if (socialingData.minParticipants !== undefined) updateData.min_participants = socialingData.minParticipants;
  if (socialingData.maxParticipants !== undefined) updateData.max_participants = socialingData.maxParticipants;
  if (socialingData.isChecked !== undefined) updateData.is_checked = socialingData.isChecked;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('socialings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('소셜링 수정 실패:', error);
    throw error;
  }

  // 참가자 업데이트가 필요한 경우
  if (socialingData.participants) {
    // 기존 참가자 삭제
    await supabase.from('participants').delete().eq('socialing_id', id);

    // 새 참가자 추가
    if (socialingData.participants.length > 0) {
      const participantsToInsert = socialingData.participants.map((p) => ({
        socialing_id: id,
        member_id: p.id,
        role: p.role || 'member',
        status: p.status || 'registered',
      }));

      await supabase.from('participants').insert(participantsToInsert);
    }
  }

  return data;
}

/**
 * 소셜링 취소
 */
export async function cancelSocialing(id) {
  const { data, error } = await supabase
    .from('socialings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('소셜링 취소 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 참가자 상태 변경 (노쇼 토글)
 */
export async function updateParticipantStatus(socialingId, memberId, newStatus) {
  const { data, error } = await supabase
    .from('participants')
    .update({ status: newStatus })
    .eq('socialing_id', socialingId)
    .eq('member_id', memberId)
    .select()
    .single();

  if (error) {
    console.error('참가자 상태 변경 실패:', error);
    throw error;
  }

  return data;
}

/**
 * 조치완료 토글
 */
export async function toggleSocialingChecked(id, isChecked) {
  const { data, error } = await supabase
    .from('socialings')
    .update({
      is_checked: isChecked,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('조치완료 토글 실패:', error);
    throw error;
  }

  return data;
}

