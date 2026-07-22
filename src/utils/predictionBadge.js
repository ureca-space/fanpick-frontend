// - 종목별 적중률 배지 이름
const BADGES = {
  soccer: {
    beginner: "축구 입문자",
    god: "축구의 신",
    expert: "축잘알",
    normal: "평범한 축구팬",
    poor: "축알못",
    worst: "축구 반대로 가는 자",
  },
  baseball: {
    beginner: "야구 입문자",
    god: "야구의 신",
    expert: "야잘알",
    normal: "평범한 야구팬",
    poor: "야알못",
    worst: "역배 장인",
  },
  esports: {
    beginner: "새싹 소환사",
    god: "롤도사",
    expert: "롤잘알",
    normal: "평범한 소환사",
    poor: "롤알못",
    worst: "브론즈 예언가",
  },
};

// - Supabase가 계산한 경기 수와 적중률로 배지 결정
export const getPredictionBadge = (sport, totalCount, accuracyRate) => {
  const badges = BADGES[sport];

  if (!badges) return "";
  if (totalCount < 5) return badges.beginner;
  if (accuracyRate >= 80) return badges.god;
  if (accuracyRate >= 60) return badges.expert;
  if (accuracyRate >= 40) return badges.normal;
  if (accuracyRate >= 20) return badges.poor;

  return badges.worst;
};
