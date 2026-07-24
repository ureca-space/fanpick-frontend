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

const getPredictionBadgeTier = (totalCount, accuracyRate) =>
  BADGE_TIERS.find((tier) => tier.matches(totalCount, accuracyRate)) ??
  BADGE_TIERS[BADGE_TIERS.length - 1];

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
