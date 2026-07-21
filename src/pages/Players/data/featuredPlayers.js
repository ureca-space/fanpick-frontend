const createRatings = (ratings) =>
  Object.entries(ratings).map(([label, score]) => ({
    label,
    score,
  }));

const getUniqueValues = (values) =>
  [...new Set(values.filter((value) => Boolean(value?.trim())))];

const createDaumKboProfileImage = (kboId) =>
  `https://t1.daumcdn.net/sports/player/300/1/${kboId}.jpg`;

const createPlayer = (player) => {
  const imageCandidates = getUniqueValues([
    ...(player.imageCandidates || []),
    player.kboId ? createDaumKboProfileImage(player.kboId) : "",
  ]);

  return {
    team: "",
    ...player,
    image: player.image || imageCandidates[0] || "",
    imageCandidates,
  };
};

/* =========================================================
   SOCCER
========================================================= */

const SOCCER_PLAYERS = [
  createPlayer({
    id: "son-heung-min",
    searchName: "Son Heung-min",
    wikipediaTitles: ["Son Heung-min", "손흥민"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/r5abfl1778974278.jpg",
    ],
    sport: "soccer",
    name: "손흥민",
    englishName: "SON HEUNG-MIN",
    position: "LEFT WING",
    introduction:
      "폭발적인 스피드와 날카로운 양발 슈팅으로 경기를 결정짓는 대한민국 대표 공격수.",
    tags: ["캡틴", "양발 슈팅", "스피드"],
    ratings: createRatings({
      스피드: 5,
      슈팅: 5,
      드리블: 4,
      리더십: 5,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "kim-min-jae",
    searchName: "Kim Min-jae",
    wikipediaTitles: ["Kim Min-jae (footballer)", "김민재 (축구 선수)"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/flx3cd1778971805.jpg",
    ],
    sport: "soccer",
    name: "김민재",
    englishName: "KIM MIN-JAE",
    position: "CENTRE-BACK",
    introduction:
      "강한 피지컬과 빠른 커버 능력으로 상대 공격을 차단하는 대한민국 대표 수비수.",
    tags: ["철벽 수비", "피지컬", "커버 플레이"],
    ratings: createRatings({
      수비: 5,
      피지컬: 5,
      스피드: 4,
      빌드업: 4,
      집중력: 5,
    }),
  }),

  createPlayer({
    id: "lee-kang-in",
    searchName: "Lee Kang-in",
    wikipediaTitles: ["Lee Kang-in", "이강인"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/n0hew31778972474.jpg",
    ],
    sport: "soccer",
    name: "이강인",
    englishName: "LEE KANG-IN",
    position: "ATTACKING MIDFIELD",
    introduction:
      "정교한 왼발과 창의적인 패스로 경기의 흐름을 바꾸는 기술적인 미드필더.",
    tags: ["황금 왼발", "탈압박", "킬 패스"],
    ratings: createRatings({
      패스: 5,
      드리블: 5,
      킥: 5,
      시야: 5,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "hwang-hee-chan",
    searchName: "Hwang Hee-chan",
    wikipediaTitles: ["Hwang Hee-chan", "황희찬"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/cgr5971778971405.jpg",
    ],
    sport: "soccer",
    name: "황희찬",
    englishName: "HWANG HEE-CHAN",
    position: "FORWARD",
    introduction:
      "저돌적인 돌파와 강한 압박으로 상대 수비를 흔드는 공격적인 플레이어.",
    tags: ["황소", "저돌적인 돌파", "강한 압박"],
    ratings: createRatings({
      피지컬: 5,
      돌파: 5,
      스피드: 4,
      슈팅: 4,
      활동량: 5,
    }),
  }),

  createPlayer({
    id: "hwang-in-beom",
    searchName: "Hwang In-beom",
    wikipediaTitles: ["Hwang In-beom", "황인범"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/7pvfob1778971521.jpg",
    ],
    sport: "soccer",
    name: "황인범",
    englishName: "HWANG IN-BEOM",
    position: "CENTRAL MIDFIELD",
    introduction:
      "넓은 활동 범위와 안정적인 패스로 중원의 흐름을 조율하는 미드필더.",
    tags: ["중원 조율", "전진 패스", "활동량"],
    ratings: createRatings({
      패스: 5,
      활동량: 5,
      시야: 4,
      탈압박: 4,
      수비기여: 4,
    }),
  }),

  createPlayer({
    id: "lee-jae-sung",
    searchName: "Lee Jae-sung",
    wikipediaTitles: ["Lee Jae-sung", "이재성 (1992년)"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/c3so0c1778972640.jpg",
    ],
    sport: "soccer",
    name: "이재성",
    englishName: "LEE JAE-SUNG",
    position: "ATTACKING MIDFIELD",
    introduction:
      "끊임없는 움직임과 영리한 공간 활용로 공격과 수비를 연결하는 미드필더.",
    tags: ["공간 활용", "활동량", "연계 플레이"],
    ratings: createRatings({
      활동량: 5,
      연계: 5,
      위치선정: 5,
      패스: 4,
      수비기여: 4,
    }),
  }),

  createPlayer({
    id: "cho-gue-sung",
    searchName: "Cho Gue-sung",
    wikipediaTitles: ["Cho Gue-sung", "조규성"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/keelj71778970626.jpg",
    ],
    sport: "soccer",
    name: "조규성",
    englishName: "CHO GUE-SUNG",
    position: "STRIKER",
    introduction:
      "제공권과 적극적인 움직임을 바탕으로 페널티박스 안에서 위협을 만드는 공격수.",
    tags: ["헤더", "포스트 플레이", "스타성"],
    ratings: createRatings({
      제공권: 5,
      피지컬: 4,
      위치선정: 4,
      슈팅: 4,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "oh-hyeon-gyu",
    searchName: "Oh Hyeon-gyu",
    wikipediaTitles: ["Oh Hyeon-gyu", "오현규"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/5bzf6y1778973507.jpg",
    ],
    sport: "soccer",
    name: "오현규",
    englishName: "OH HYEON-GYU",
    position: "STRIKER",
    introduction:
      "강한 몸싸움과 과감한 슈팅으로 상대 수비진에 부담을 주는 공격수.",
    tags: ["파워 슈팅", "몸싸움", "적극성"],
    ratings: createRatings({
      피지컬: 5,
      슈팅: 4,
      제공권: 4,
      적극성: 5,
      성장성: 5,
    }),
  }),

  createPlayer({
    id: "bae-jun-ho",
    searchName: "Bae Jun-ho",
    wikipediaTitles: ["Bae Jun-ho", "배준호"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/k9nwjc1778970284.jpg",
    ],
    sport: "soccer",
    name: "배준호",
    englishName: "BAE JUN-HO",
    position: "ATTACKING MIDFIELD",
    introduction:
      "부드러운 볼 터치와 과감한 전진 드리블이 돋보이는 차세대 공격형 미드필더.",
    tags: ["전진 드리블", "볼 터치", "유망주"],
    ratings: createRatings({
      드리블: 5,
      볼터치: 5,
      패스: 4,
      민첩성: 4,
      성장성: 5,
    }),
  }),

  createPlayer({
    id: "yang-hyun-jun",
    searchName: "Yang Hyun-jun",
    wikipediaTitles: ["Yang Hyun-jun", "양현준"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/mlrn6y1778974742.jpg",
    ],
    sport: "soccer",
    name: "양현준",
    englishName: "YANG HYUN-JUN",
    position: "RIGHT WING",
    introduction:
      "빠른 발과 적극적인 일대일 돌파로 측면에서 변수를 만드는 윙어.",
    tags: ["측면 돌파", "스피드", "일대일"],
    ratings: createRatings({
      스피드: 5,
      돌파: 5,
      민첩성: 4,
      크로스: 4,
      성장성: 5,
    }),
  }),

  createPlayer({
    id: "seol-young-woo",
    searchName: "Seol Young-woo",
    wikipediaTitles: ["Seol Young-woo", "설영우"],
    imageCandidates: [
      "https://r2.thesportsdb.com/images/media/player/thumb/cy4mju1778973897.jpg",
    ],
    sport: "soccer",
    name: "설영우",
    englishName: "SEOL YOUNG-WOO",
    position: "RIGHT-BACK",
    introduction:
      "양쪽 측면을 소화하며 공격 가담과 수비 안정성을 함께 보여주는 풀백.",
    tags: ["멀티 플레이어", "오버래핑", "활동량"],
    ratings: createRatings({
      활동량: 5,
      수비: 4,
      오버래핑: 4,
      스피드: 4,
      활용도: 5,
    }),
  }),

  createPlayer({
    id: "kim-ji-soo",
    searchName: "Kim Ji-soo",
    wikipediaTitles: ["Kim Ji-soo (footballer)", "김지수 (축구 선수)"],
    imageCandidates: [
      "https://news.nateimg.co.kr/orgImg/fb/2025/10/09/670369_773288_335.jpg",
    ],
    sport: "soccer",
    name: "김지수",
    englishName: "KIM JI-SOO",
    position: "CENTRE-BACK",
    introduction:
      "침착한 수비와 안정적인 빌드업 능력이 기대되는 차세대 중앙 수비수.",
    tags: ["차세대 수비수", "빌드업", "침착함"],
    ratings: createRatings({
      수비: 4,
      빌드업: 4,
      제공권: 4,
      침착성: 4,
      성장성: 5,
    }),
  }),
];

/* =========================================================
   BASEBALL
========================================================= */

const BASEBALL_PLAYERS = [
  createPlayer({
    id: "lee-jung-hoo",
    searchName: "Jung Hoo Lee",
    wikipediaTitles: ["Jung Hoo Lee", "이정후"],
    kboId: "67341",
    sport: "baseball",
    name: "이정후",
    englishName: "JUNG HOO LEE",
    position: "OUTFIELDER",
    introduction:
      "정교한 타격과 뛰어난 콘택트 능력으로 안타를 만들어내는 대한민국 대표 외야수.",
    tags: ["바람의 손자", "콘택트", "정교한 타격"],
    ratings: createRatings({
      콘택트: 5,
      선구안: 5,
      주루: 4,
      수비: 4,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "kim-ha-seong",
    searchName: "Ha-Seong Kim",
    wikipediaTitles: ["Ha-seong Kim", "김하성"],
    kboId: "64300",
    sport: "baseball",
    name: "김하성",
    englishName: "HA-SEONG KIM",
    position: "INFIELDER",
    introduction:
      "넓은 수비 범위와 적극적인 주루로 경기 곳곳에서 존재감을 보여주는 내야수.",
    tags: ["멀티 내야수", "호수비", "허슬 플레이"],
    ratings: createRatings({
      수비: 5,
      주루: 5,
      파워: 4,
      콘택트: 4,
      활용도: 5,
    }),
  }),

  createPlayer({
    id: "kim-hye-seong",
    searchName: "Hye-Seong Kim",
    wikipediaTitles: ["Kim Hye-seong", "김혜성 (야구 선수)"],
    kboId: "67304",
    sport: "baseball",
    name: "김혜성",
    englishName: "HYE-SEONG KIM",
    position: "INFIELDER",
    introduction:
      "빠른 발과 안정적인 수비를 바탕으로 공수에서 활력을 불어넣는 내야수.",
    tags: ["빠른 발", "멀티 내야수", "주루 센스"],
    ratings: createRatings({
      주루: 5,
      수비: 5,
      콘택트: 4,
      활동량: 5,
      활용도: 5,
    }),
  }),

  createPlayer({
    id: "ryu-hyun-jin",
    searchName: "Hyun Jin Ryu",
    wikipediaTitles: ["Hyun-jin Ryu", "류현진"],
    kboId: "76715",
    sport: "baseball",
    name: "류현진",
    englishName: "HYUN JIN RYU",
    position: "PITCHER",
    introduction:
      "정교한 제구와 다양한 구종 조합으로 타자의 타이밍을 빼앗는 베테랑 투수.",
    tags: ["코리안 몬스터", "제구력", "체인지업"],
    ratings: createRatings({
      제구: 5,
      변화구: 5,
      경기운영: 5,
      위기관리: 5,
      경험: 5,
    }),
  }),

  createPlayer({
    id: "kim-do-young",
    searchName: "Do Yeong Kim",
    wikipediaTitles: ["Kim Do-yeong", "김도영 (야구 선수)"],
    kboId: "52605",
    sport: "baseball",
    name: "김도영",
    englishName: "DO YEONG KIM",
    position: "INFIELDER",
    introduction:
      "강한 타구와 빠른 발을 모두 갖추고 공격적인 야구를 보여주는 내야수.",
    tags: ["호타준족", "장타력", "차세대 스타"],
    ratings: createRatings({
      파워: 5,
      주루: 5,
      콘택트: 4,
      수비: 4,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "koo-ja-wook",
    searchName: "Ja Wook Koo",
    wikipediaTitles: ["Koo Ja-wook", "구자욱"],
    kboId: "62404",
    sport: "baseball",
    name: "구자욱",
    englishName: "JA WOOK KOO",
    position: "OUTFIELDER",
    introduction:
      "부드러운 스윙과 뛰어난 타격 감각으로 중심 타선의 무게감을 더하는 외야수.",
    tags: ["부드러운 스윙", "중심 타선", "클러치"],
    ratings: createRatings({
      콘택트: 5,
      파워: 4,
      클러치: 5,
      주루: 4,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "kang-baek-ho",
    searchName: "Baek Ho Kang",
    wikipediaTitles: ["Kang Baek-ho (baseball player)", "강백호 (야구 선수)"],
    kboId: "68050",
    sport: "baseball",
    name: "강백호",
    englishName: "BAEK HO KANG",
    position: "HITTER",
    introduction:
      "강력한 스윙과 장타 생산 능력으로 한 번에 경기 분위기를 바꾸는 타자.",
    tags: ["파워 히터", "장타", "강한 스윙"],
    ratings: createRatings({
      파워: 5,
      장타: 5,
      콘택트: 4,
      클러치: 4,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "moon-dong-ju",
    searchName: "Dong Ju Moon",
    wikipediaTitles: ["Moon Dong-ju", "문동주"],
    kboId: "52701",
    sport: "baseball",
    name: "문동주",
    englishName: "DONG JU MOON",
    position: "PITCHER",
    introduction:
      "압도적인 빠른 공과 공격적인 투구로 타자를 몰아붙이는 차세대 우완 투수.",
    tags: ["강속구", "파이어볼러", "차세대 에이스"],
    ratings: createRatings({
      구속: 5,
      구위: 5,
      탈삼진: 4,
      제구: 3,
      성장성: 5,
    }),
  }),

  createPlayer({
    id: "noh-si-hwan",
    searchName: "Si Hwan Noh",
    wikipediaTitles: ["Noh Si-hwan", "노시환"],
    kboId: "69737",
    sport: "baseball",
    name: "노시환",
    englishName: "SI HWAN NOH",
    position: "INFIELDER",
    introduction:
      "묵직한 장타력과 과감한 스윙으로 타선의 중심을 책임지는 내야수.",
    tags: ["홈런 타자", "장타력", "중심 타선"],
    ratings: createRatings({
      파워: 5,
      장타: 5,
      타점생산: 5,
      콘택트: 4,
      스타성: 4,
    }),
  }),

  createPlayer({
    id: "won-tae-in",
    searchName: "Tae In Won",
    wikipediaTitles: ["Won Tae-in", "원태인"],
    kboId: "68419",
    sport: "baseball",
    name: "원태인",
    englishName: "TAE IN WON",
    position: "PITCHER",
    introduction:
      "안정적인 제구와 다양한 구종을 활용해 긴 이닝을 책임지는 선발 투수.",
    tags: ["푸른 피의 에이스", "제구력", "이닝이터"],
    ratings: createRatings({
      제구: 5,
      경기운영: 5,
      변화구: 4,
      완급조절: 5,
      안정감: 5,
    }),
  }),

  createPlayer({
    id: "choi-jeong",
    searchName: "Jeong Choi",
    wikipediaTitles: ["Choi Jeong", "최정 (야구 선수)"],
    kboId: "75847",
    sport: "baseball",
    name: "최정",
    englishName: "JEONG CHOI",
    position: "INFIELDER",
    introduction:
      "꾸준한 장타 생산과 풍부한 경험으로 타선에 무게를 더하는 베테랑 내야수.",
    tags: ["홈런", "꾸준함", "베테랑"],
    ratings: createRatings({
      파워: 5,
      장타: 5,
      선구안: 4,
      경험: 5,
      꾸준함: 5,
    }),
  }),

  createPlayer({
    id: "yang-hyeon-jong",
    searchName: "Hyeon Jong Yang",
    wikipediaTitles: ["Yang Hyeon-jong", "양현종"],
    kboId: "77637",
    sport: "baseball",
    name: "양현종",
    englishName: "HYEON JONG YANG",
    position: "PITCHER",
    introduction:
      "풍부한 경험과 안정적인 경기 운영으로 마운드를 지키는 베테랑 좌완 투수.",
    tags: ["대투수", "좌완 에이스", "꾸준함"],
    ratings: createRatings({
      경기운영: 5,
      제구: 4,
      이닝소화: 5,
      위기관리: 5,
      경험: 5,
    }),
  }),
];

/* =========================================================
   LEAGUE OF LEGENDS
========================================================= */

const LOL_PLAYERS = [
  createPlayer({
    id: "faker",
    searchName: "Faker",
    wikipediaTitles: ["Faker (gamer)", "이상혁 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/3/31/Faker2014.jpg/revision/latest?cb=20170801215036",
    ],
    sport: "lol",
    name: "페이커",
    englishName: "FAKER",
    position: "MID",
    introduction:
      "압도적인 커리어와 끊임없는 자기관리로 오랜 시간 정상에 서 있는 전설적인 미드 라이너.",
    tags: ["살아있는 전설", "대상혁", "클러치"],
    ratings: createRatings({
      라인전: 5,
      운영: 5,
      판단력: 5,
      클러치: 5,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "chovy",
    searchName: "Chovy",
    wikipediaTitles: ["Chovy", "정지훈 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/2/25/GRF_Chovy_2018_Split_1.png/revision/latest?cb=20250426112706",
    ],
    sport: "lol",
    name: "쵸비",
    englishName: "CHOVY",
    position: "MID",
    introduction:
      "정교한 라인전과 압도적인 성장 능력으로 경기를 장악하는 미드 라이너.",
    tags: ["라인전", "CS 장인", "피지컬"],
    ratings: createRatings({
      라인전: 5,
      성장력: 5,
      피지컬: 5,
      한타: 5,
      안정감: 5,
    }),
  }),

  createPlayer({
    id: "showmaker",
    searchName: "ShowMaker",
    wikipediaTitles: ["ShowMaker", "허수 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/57/DWG_ShowMaker_2018_Split_1.png/revision/latest?cb=20250426111623",
    ],
    sport: "lol",
    name: "쇼메이커",
    englishName: "SHOWMAKER",
    position: "MID",
    introduction:
      "넓은 챔피언 폭과 과감한 플레이로 팀의 공격 흐름을 만드는 미드 라이너.",
    tags: ["쇼메이킹", "챔피언 폭", "공격적인 플레이"],
    ratings: createRatings({
      챔피언폭: 5,
      라인전: 4,
      로밍: 5,
      한타: 5,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "bdd",
    searchName: "Bdd",
    wikipediaTitles: ["Bdd (gamer)", "곽보성"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/4/49/CJ_Bdd_2016_Spring.png/revision/latest?cb=20170801173010",
    ],
    sport: "lol",
    name: "비디디",
    englishName: "BDD",
    position: "MID",
    introduction:
      "안정적인 라인전과 날카로운 스킬 적중으로 팀의 중심을 잡아주는 미드 라이너.",
    tags: ["정교한 스킬", "안정감", "베테랑"],
    ratings: createRatings({
      라인전: 5,
      스킬샷: 5,
      안정감: 5,
      한타: 4,
      경험: 5,
    }),
  }),

  createPlayer({
    id: "zeus",
    searchName: "Zeus",
    wikipediaTitles: ["Zeus (gamer)", "최우제"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/db/T1_Zeus_2021_Split_1.png/revision/latest/scale-to-width-down/900?cb=20210211041848",
    ],
    sport: "lol",
    name: "제우스",
    englishName: "ZEUS",
    position: "TOP",
    introduction:
      "강력한 라인전과 과감한 교전 능력으로 상체의 주도권을 만들어내는 탑 라이너.",
    tags: ["라인전", "캐리형 탑", "피지컬"],
    ratings: createRatings({
      라인전: 5,
      피지컬: 5,
      한타: 5,
      챔피언폭: 5,
      캐리력: 5,
    }),
  }),

  createPlayer({
    id: "kiin",
    searchName: "Kiin",
    wikipediaTitles: ["Kiin", "김기인"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/2/2e/AFS_Kiin_2018_Spring.png/revision/latest?cb=20180127001257",
    ],
    sport: "lol",
    name: "기인",
    englishName: "KIIN",
    position: "TOP",
    introduction:
      "단단한 라인전과 뛰어난 챔피언 이해도로 어떤 역할이든 수행하는 탑 라이너.",
    tags: ["육각형 탑", "안정감", "챔피언 폭"],
    ratings: createRatings({
      라인전: 5,
      챔피언폭: 5,
      안정감: 5,
      한타: 5,
      활용도: 5,
    }),
  }),

  createPlayer({
    id: "oner",
    searchName: "Oner",
    wikipediaTitles: ["Oner (gamer)", "문현준"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/73/T1_Oner_2021_Split_1.png/revision/latest/scale-to-width-down/900?cb=20210211041838",
    ],
    sport: "lol",
    name: "오너",
    englishName: "ONER",
    position: "JUNGLE",
    introduction:
      "강력한 교전 능력과 빠른 합류로 팀의 전투 흐름을 주도하는 정글러.",
    tags: ["교전", "피지컬", "빠른 합류"],
    ratings: createRatings({
      교전: 5,
      피지컬: 5,
      갱킹: 4,
      오브젝트: 5,
      한타: 5,
    }),
  }),

  createPlayer({
    id: "canyon",
    searchName: "Canyon",
    wikipediaTitles: ["Canyon (gamer)", "김건부"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/56/DWG_Canyon_2019_Split_1.png/revision/latest/scale-to-width-down/900?cb=20190722060534",
    ],
    sport: "lol",
    name: "캐니언",
    englishName: "CANYON",
    position: "JUNGLE",
    introduction:
      "효율적인 동선과 압도적인 성장 능력으로 정글의 흐름을 지배하는 플레이어.",
    tags: ["정글 동선", "성장력", "캐리형 정글"],
    ratings: createRatings({
      동선: 5,
      성장력: 5,
      교전: 5,
      오브젝트: 5,
      캐리력: 5,
    }),
  }),

  createPlayer({
    id: "viper",
    searchName: "Viper",
    wikipediaTitles: ["Viper (gamer)", "박도현 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/2/20/GRF_Viper_2018_Split_1.png/revision/latest?cb=20250426112816",
    ],
    sport: "lol",
    name: "바이퍼",
    englishName: "VIPER",
    position: "BOT",
    introduction:
      "정교한 포지셔닝과 높은 화력으로 후반 한타를 지배하는 원거리 딜러.",
    tags: ["한타", "포지셔닝", "캐리력"],
    ratings: createRatings({
      라인전: 5,
      포지셔닝: 5,
      한타: 5,
      생존력: 5,
      캐리력: 5,
    }),
  }),

  createPlayer({
    id: "ruler",
    searchName: "Ruler",
    wikipediaTitles: ["Ruler (gamer)", "박재혁 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/1/11/Ruler_Summer_2016.png/revision/latest?cb=20170802112350",
    ],
    sport: "lol",
    name: "룰러",
    englishName: "RULER",
    position: "BOT",
    introduction:
      "안정적인 라인전과 뛰어난 후반 집중력으로 승부를 결정짓는 원거리 딜러.",
    tags: ["후반 캐리", "안정감", "클러치"],
    ratings: createRatings({
      라인전: 5,
      한타: 5,
      포지셔닝: 5,
      안정감: 5,
      클러치: 5,
    }),
  }),

  createPlayer({
    id: "gumayusi",
    searchName: "Gumayusi",
    wikipediaTitles: ["Gumayusi", "이민형 (프로게이머)"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/a/ac/T1_Gumayusi_2020_Split_1.png/revision/latest?cb=20200307042719",
    ],
    sport: "lol",
    name: "구마유시",
    englishName: "GUMAYUSI",
    position: "BOT",
    introduction:
      "강한 라인전과 과감한 딜링으로 중요한 순간 존재감을 보여주는 원거리 딜러.",
    tags: ["라인전", "과감한 딜링", "큰 경기"],
    ratings: createRatings({
      라인전: 5,
      딜링: 5,
      한타: 5,
      클러치: 5,
      스타성: 5,
    }),
  }),

  createPlayer({
    id: "keria",
    searchName: "Keria",
    wikipediaTitles: ["Keria", "류민석"],
    imageCandidates: [
      "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/e/eb/DRX_Keria_2020_Split_1.png/revision/latest?cb=20200307042644",
    ],
    sport: "lol",
    name: "케리아",
    englishName: "KERIA",
    position: "SUPPORT",
    introduction:
      "창의적인 챔피언 선택과 정교한 플레이로 서포터의 가능성을 넓힌 선수.",
    tags: ["역천괴", "창의적인 픽", "플레이메이킹"],
    ratings: createRatings({
      챔피언폭: 5,
      시야장악: 5,
      플레이메이킹: 5,
      피지컬: 5,
      스타성: 5,
    }),
  }),
];

export const FEATURED_PLAYERS = [
  ...SOCCER_PLAYERS,
  ...BASEBALL_PLAYERS,
  ...LOL_PLAYERS,
];
