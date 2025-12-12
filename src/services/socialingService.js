import { supabase } from "../lib/supabase";

/**
 * 날짜가 지났는지 확인
 * @param {string} dateString - 날짜 문자열
 * @returns {boolean} 지난 날짜면 true
 */
function isPastDate(dateString) {
  if (!dateString) return false;
  const eventDate = new Date(dateString);
  const today = new Date();
  // 날짜만 비교 (시간 제외)
  eventDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝까지 유효
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

/**
 * 지난 소셜링 자동 완료 처리 (status: done, 신청자→참석)
 * @param {number} socialingId - 소셜링 ID
 */
async function autoCompleteSocialing(socialingId) {
  // 1. 소셜링 상태를 done으로 변경
  await supabase
    .from("socialings")
    .update({
      status: "done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", socialingId);

  // 2. 해당 소셜링의 모든 신청자(registered)를 참석(attended)으로 변경
  await supabase
    .from("participants")
    .update({ status: "attended" })
    .eq("socialing_id", socialingId)
    .eq("status", "registered");
}

/**
 * 모든 소셜링 조회 (참가자 포함)
 */
export async function getSocialings() {
  const { data: socialings, error } = await supabase
    .from("socialings")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("소셜링 조회 실패:", error);
    throw error;
  }

  // 지난 날짜의 예정 소셜링 자동 완료 처리
  const pastScheduledSocialings = socialings.filter(
    (s) => s.status === "scheduled" && isPastDate(s.date)
  );

  // 지난 소셜링 자동 완료 처리 (백그라운드에서 병렬 처리)
  if (pastScheduledSocialings.length > 0) {
    await Promise.all(
      pastScheduledSocialings.map((s) => autoCompleteSocialing(s.id))
    );

    // 상태 업데이트 후 로컬 데이터도 갱신
    pastScheduledSocialings.forEach((s) => {
      s.status = "done";
    });
  }

  // 각 소셜링의 참가자 조회
  const socialingsWithParticipants = await Promise.all(
    socialings.map(async (socialing) => {
      const { data: participants } = await supabase
        .from("participants")
        .select(
          `
          *,
          members (id, nickname, sex, name)
        `
        )
        .eq("socialing_id", socialing.id);

      // 지난 소셜링의 경우 신청자를 참석으로 처리
      const wasPastScheduled = pastScheduledSocialings.some(
        (s) => s.id === socialing.id
      );

      const participantsList = (participants || []).map((p) => ({
        id: p.members.id,
        nickname: p.members.nickname,
        sex: p.members.sex,
        name: p.members.name,
        status:
          wasPastScheduled && p.status === "registered" ? "attended" : p.status,
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
 * 한국어 날짜 형식을 ISO 날짜로 변환
 * 예: "12.31(수) 오후 6:00" -> "2025-12-31T18:00:00"
 * 예: "1.5(일) 오전 11:00" -> "2026-01-05T11:00:00"
 */
function parseKoreanDateTime(dateStr) {
  if (!dateStr) return null;

  // 이미 ISO 형식이거나 YYYY-MM-DD 형식이면 그대로 반환
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr;
  }

  try {
    // "12.31(수) 오후 6:00" 또는 "1.5(일) 오전 11:00" 형태 파싱
    const match = dateStr.match(
      /(\d{1,2})\.(\d{1,2})\([^)]+\)\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/
    );

    if (match) {
      let [, month, day, ampm, hour, minute] = match;
      month = parseInt(month, 10);
      day = parseInt(day, 10);
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);

      // 오후면 12시간 추가 (단, 12시는 제외)
      if (ampm === "오후" && hour !== 12) {
        hour += 12;
      }
      // 오전 12시는 0시
      if (ampm === "오전" && hour === 12) {
        hour = 0;
      }

      // 현재 년도 기준으로 날짜 결정
      const now = new Date();
      let year = now.getFullYear();

      // 현재 월보다 작은 월이면 내년으로 간주
      if (month < now.getMonth() + 1) {
        year += 1;
      }

      // ISO 형식으로 변환
      const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}:00`;
      return isoDate;
    }

    // 시간 없이 날짜만 있는 경우 "12.31(수)"
    const dateOnlyMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})/);
    if (dateOnlyMatch) {
      let [, month, day] = dateOnlyMatch;
      month = parseInt(month, 10);
      day = parseInt(day, 10);

      const now = new Date();
      let year = now.getFullYear();
      if (month < now.getMonth() + 1) {
        year += 1;
      }

      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    }

    return dateStr;
  } catch (e) {
    console.warn("날짜 파싱 실패:", dateStr, e);
    return dateStr;
  }
}

/**
 * 소셜링 추가
 */
export async function addSocialing(socialingData) {
  // 날짜 형식 변환
  const parsedDate = parseKoreanDateTime(socialingData.date);

  // 1. 소셜링 생성
  const { data: socialing, error: socialingError } = await supabase
    .from("socialings")
    .insert({
      title: socialingData.title,
      date: parsedDate,
      location: socialingData.location,
      status: socialingData.status || "scheduled",
      has_alcohol: socialingData.hasAlcohol || false,
      is_night: socialingData.isNight || false,
      min_participants: socialingData.minParticipants,
      max_participants: socialingData.maxParticipants,
    })
    .select()
    .single();

  if (socialingError) {
    console.error("소셜링 추가 실패:", socialingError);
    throw socialingError;
  }

  // 2. 참가자 추가 (닉네임으로 멤버 찾아서 연결)
  if (socialingData.participants && socialingData.participants.length > 0) {
    // 닉네임 목록 추출
    const nicknames = socialingData.participants.map((p) => p.nickname);

    // 닉네임으로 멤버 조회
    const { data: members } = await supabase
      .from("members")
      .select("id, nickname")
      .in("nickname", nicknames);

    // 닉네임 -> 멤버ID 매핑
    const nicknameToId = {};
    (members || []).forEach((m) => {
      nicknameToId[m.nickname] = m.id;
    });

    // 실제 멤버가 있는 참가자만 추가
    const participantsToInsert = socialingData.participants
      .filter((p) => nicknameToId[p.nickname]) // 멤버가 존재하는 경우만
      .map((p) => ({
        socialing_id: socialing.id,
        member_id: nicknameToId[p.nickname],
        role: p.role || "member",
        status: p.status || "registered",
      }));

    if (participantsToInsert.length > 0) {
      const { error: participantsError } = await supabase
        .from("participants")
        .insert(participantsToInsert);

      if (participantsError) {
        console.error("참가자 추가 실패:", participantsError);
        // 소셜링은 유지하고 경고만 출력 (참가자는 나중에 수정 가능)
        console.warn("참가자 추가 실패, 소셜링만 저장됨");
      }
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
  if (socialingData.date !== undefined) {
    // 날짜 형식 변환
    updateData.date = parseKoreanDateTime(socialingData.date);
  }
  if (socialingData.location !== undefined)
    updateData.location = socialingData.location;
  if (socialingData.status !== undefined)
    updateData.status = socialingData.status;
  if (socialingData.hasAlcohol !== undefined)
    updateData.has_alcohol = socialingData.hasAlcohol;
  if (socialingData.isNight !== undefined)
    updateData.is_night = socialingData.isNight;
  if (socialingData.minParticipants !== undefined)
    updateData.min_participants = socialingData.minParticipants;
  if (socialingData.maxParticipants !== undefined)
    updateData.max_participants = socialingData.maxParticipants;
  if (socialingData.isChecked !== undefined)
    updateData.is_checked = socialingData.isChecked;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("socialings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("소셜링 수정 실패:", error);
    throw error;
  }

  // 참가자 업데이트가 필요한 경우
  if (socialingData.participants) {
    // 1. 먼저 기존 참가자 정보 조회 (status 유지를 위해)
    const { data: existingParticipants } = await supabase
      .from("participants")
      .select("member_id, status, role")
      .eq("socialing_id", id);

    // member_id -> 기존 status/role 매핑
    const existingStatusMap = {};
    (existingParticipants || []).forEach((p) => {
      existingStatusMap[p.member_id] = { status: p.status, role: p.role };
    });

    // 2. 기존 참가자 삭제
    await supabase.from("participants").delete().eq("socialing_id", id);

    // 3. 새 참가자 추가 (닉네임으로 멤버 찾아서 연결)
    if (socialingData.participants.length > 0) {
      // 닉네임 목록 추출
      const nicknames = socialingData.participants.map((p) => p.nickname);

      // 닉네임으로 멤버 조회
      const { data: members } = await supabase
        .from("members")
        .select("id, nickname")
        .in("nickname", nicknames);

      // 닉네임 -> 멤버ID 매핑
      const nicknameToId = {};
      (members || []).forEach((m) => {
        nicknameToId[m.nickname] = m.id;
      });

      // 실제 멤버가 있는 참가자만 추가 (기존 status 유지)
      const participantsToInsert = socialingData.participants
        .filter((p) => nicknameToId[p.nickname]) // 멤버가 존재하는 경우만
        .map((p) => {
          const memberId = nicknameToId[p.nickname];
          const existing = existingStatusMap[memberId];
          return {
            socialing_id: id,
            member_id: memberId,
            role: p.role || existing?.role || "member",
            // 기존 status 유지, 없으면 전달받은 값 또는 기본값
            status: existing?.status || p.status || "registered",
          };
        });

      if (participantsToInsert.length > 0) {
        const { error: participantsError } = await supabase
          .from("participants")
          .insert(participantsToInsert);

        if (participantsError) {
          console.error("참가자 수정 실패:", participantsError);
        }
      }
    }
  }

  return data;
}

/**
 * 소셜링 취소
 */
export async function cancelSocialing(id) {
  const { data, error } = await supabase
    .from("socialings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("소셜링 취소 실패:", error);
    throw error;
  }

  return data;
}

/**
 * 참가자 상태 변경 (노쇼 토글)
 */
export async function updateParticipantStatus(
  socialingId,
  memberId,
  newStatus
) {
  const { data, error } = await supabase
    .from("participants")
    .update({ status: newStatus })
    .eq("socialing_id", socialingId)
    .eq("member_id", memberId)
    .select()
    .single();

  if (error) {
    console.error("참가자 상태 변경 실패:", error);
    throw error;
  }

  return data;
}

/**
 * 조치완료 토글
 */
export async function toggleSocialingChecked(id, isChecked) {
  const { data, error } = await supabase
    .from("socialings")
    .update({
      is_checked: isChecked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("조치완료 토글 실패:", error);
    throw error;
  }

  return data;
}
