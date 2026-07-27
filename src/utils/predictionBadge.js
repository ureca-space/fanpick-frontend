import {
  TbBallBaseball,
  TbBallFootball,
  TbCrown,
  TbDeviceGamepad2,
  TbSeedling,
  TbShield,
  TbStar,
  TbTargetOff,
  TbTrophy,
} from "react-icons/tb";

const PREDICTION_SPORT_META = {
  overall: {
    label: "ALL",
    koreanName: "전체",
    SportIcon: TbTrophy,
  },
  soccer: {
    label: "SOCCER",
    koreanName: "축구",
    SportIcon: TbBallFootball,
  },
  baseball: {
    label: "BASEBALL",
    koreanName: "야구",
    SportIcon: TbBallBaseball,
  },
  esports: {
    label: "LOL",
    koreanName: "롤",
    SportIcon: TbDeviceGamepad2,
  },
};

const BADGES = {
  overall: {
    beginner: "팬픽 입문자",
    god: "팬픽의 신",
    expert: "예측 고수",
    normal: "평범한 픽커",
    poor: "감각 조율 중",
    worst: "반대로 가는 픽커",
  },
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

const BADGE_TIERS = [
  {
    id: "beginner",
    label: "입문",
    Icon: TbSeedling,
    matches: (totalCount) => totalCount < 5,
  },
  {
    id: "god",
    label: "마스터",
    Icon: TbCrown,
    matches: (_, accuracyRate) => accuracyRate >= 80,
  },
  {
    id: "expert",
    label: "고수",
    Icon: TbTrophy,
    matches: (_, accuracyRate) => accuracyRate >= 60,
  },
  {
    id: "normal",
    label: "팬",
    Icon: TbStar,
    matches: (_, accuracyRate) => accuracyRate >= 40,
  },
  {
    id: "poor",
    label: "도전",
    Icon: TbShield,
    matches: (_, accuracyRate) => accuracyRate >= 20,
  },
  {
    id: "worst",
    label: "역배",
    Icon: TbTargetOff,
    matches: () => true,
  },
];

const BADGE_TIER_MAP = Object.fromEntries(
  BADGE_TIERS.map((tier) => [tier.id, tier]),
);

const BADGE_GUIDE_ORDER = [
  "god",
  "expert",
  "normal",
  "poor",
  "worst",
  "beginner",
];

const BADGE_STATUS_LABELS = {
  current: "현재 배지",
  default: "",
};

const BADGE_REQUIREMENTS = {
  beginner: {
    condition: "정산된 예측 5경기 전까지 적용",
    getProgress: (totalCount) => ({
      percent: Math.min((totalCount / 5) * 100, 100),
      text: `${Math.min(totalCount, 5)} / 5경기 정산`,
    }),
  },
  poor: {
    condition: "정산된 예측 5경기 이상 · 적중률 20% 이상",
    getProgress: (totalCount, accuracyRate) => {
      if (totalCount < 5) {
        return {
          percent: Math.min((totalCount / 5) * 100, 100),
          text: `${totalCount} / 5경기 정산`,
        };
      }

      return {
        percent: Math.min((accuracyRate / 20) * 100, 100),
        text: `${accuracyRate}% / 20%`,
      };
    },
  },
  normal: {
    condition: "정산된 예측 5경기 이상 · 적중률 40% 이상",
    getProgress: (totalCount, accuracyRate) => {
      if (totalCount < 5) {
        return {
          percent: Math.min((totalCount / 5) * 100, 100),
          text: `${totalCount} / 5경기 정산`,
        };
      }

      return {
        percent: Math.min((accuracyRate / 40) * 100, 100),
        text: `${accuracyRate}% / 40%`,
      };
    },
  },
  expert: {
    condition: "정산된 예측 5경기 이상 · 적중률 60% 이상",
    getProgress: (totalCount, accuracyRate) => {
      if (totalCount < 5) {
        return {
          percent: Math.min((totalCount / 5) * 100, 100),
          text: `${totalCount} / 5경기 정산`,
        };
      }

      return {
        percent: Math.min((accuracyRate / 60) * 100, 100),
        text: `${accuracyRate}% / 60%`,
      };
    },
  },
  god: {
    condition: "정산된 예측 5경기 이상 · 적중률 80% 이상",
    getProgress: (totalCount, accuracyRate) => {
      if (totalCount < 5) {
        return {
          percent: Math.min((totalCount / 5) * 100, 100),
          text: `${totalCount} / 5경기 정산`,
        };
      }

      return {
        percent: Math.min((accuracyRate / 80) * 100, 100),
        text: `${accuracyRate}% / 80%`,
      };
    },
  },
  worst: {
    condition: "정산된 예측 5경기 이상 · 적중률 20% 미만이면 자동 적용",
    getProgress: (totalCount, accuracyRate) => {
      if (totalCount < 5) {
        return {
          percent: Math.min((totalCount / 5) * 100, 100),
          text: `${totalCount} / 5경기 정산`,
        };
      }

      return {
        percent: accuracyRate < 20 ? 100 : 0,
        text: `현재 적중률 ${accuracyRate}%`,
      };
    },
  },
};

const getPredictionBadgeTier = (totalCount, accuracyRate) =>
  BADGE_TIERS.find((tier) => tier.matches(totalCount, accuracyRate)) ??
  BADGE_TIERS[BADGE_TIERS.length - 1];

const getBadgeGuideStatus = (tierId, currentTier) =>
  currentTier.id === tierId ? "current" : "default";

export const getPredictionBadgeMeta = (sport, totalCount, accuracyRate) => {
  const sportMeta = PREDICTION_SPORT_META[sport] ?? {
    label: "SPORT",
    koreanName: "스포츠",
    SportIcon: TbTrophy,
  };

  const badges = BADGES[sport] ?? {};
  const tier = getPredictionBadgeTier(totalCount, accuracyRate);

  return {
    sport,
    sportLabel: sportMeta.label,
    sportName: sportMeta.koreanName,
    name: badges[tier.id] ?? `${sportMeta.koreanName} ${tier.label}`,
    tier: tier.id,
    tierLabel: tier.label,
    SportIcon: sportMeta.SportIcon,
    TierIcon: tier.Icon,
  };
};

export const getPredictionBadgeGuide = (sport, totalCount, accuracyRate) => {
  const sportMeta = PREDICTION_SPORT_META[sport] ?? {
    label: "SPORT",
    koreanName: "스포츠",
    SportIcon: TbTrophy,
  };
  const badges = BADGES[sport] ?? {};
  const currentTier = getPredictionBadgeTier(totalCount, accuracyRate);

  return BADGE_GUIDE_ORDER.map((tierId) => {
    const tier = BADGE_TIER_MAP[tierId];
    const requirement = BADGE_REQUIREMENTS[tierId];
    const progress = requirement.getProgress(totalCount, accuracyRate);
    const status = getBadgeGuideStatus(tierId, currentTier);

    return {
      id: tierId,
      sport,
      sportLabel: sportMeta.label,
      sportName: sportMeta.koreanName,
      name: badges[tierId] ?? `${sportMeta.koreanName} ${tier.label}`,
      label: tier.label,
      condition: requirement.condition,
      progressPercent: progress.percent,
      progressText: progress.text,
      status,
      statusLabel: BADGE_STATUS_LABELS[status],
      Icon: tier.Icon,
    };
  });
};
