const createPredictionSearch = ({ matchId, teamCode } = {}) => {
  const searchParams = new URLSearchParams();

  if (matchId) {
    searchParams.set("matchId", matchId);
  }

  if (teamCode) {
    searchParams.set("team", teamCode);
  }

  const search = searchParams.toString();

  return search ? `?${search}` : "";
};

export const createPredictionPath = (params) =>
  `/prediction${createPredictionSearch(params)}`;

export const createPredictionLocation = (params) => ({
  pathname: "/prediction",
  search: createPredictionSearch(params),
  hash: "",
});
