export const CATEGORIES = [
  { id: "all", label: "전체 게시글" },
  { id: "free", label: "자유 게시판" },
  { id: "lck", label: "LCK" },
  { id: "baseball", label: "KBO" },
  { id: "soccer", label: "K-LEAGUE" },
];

export const BOARD_FILTERS = [
  { id: "all", label: "전체 게시글" },
  ...CATEGORIES.slice(1),
  { id: "my-posts", label: "작성한 글" },
  { id: "my-comments", label: "작성한 댓글" },
];
