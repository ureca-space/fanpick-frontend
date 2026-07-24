import SubNav from "../../../../components/SubNav/SubNav";

const COMMUNITY_SUB_NAV_ITEMS = [
  {
    id: "community",
    label: "커뮤니티",
    to: "/community",
  },
  {
    id: "standings",
    label: "순위",
    to: "/community/standings",
  },
  {
    id: "results",
    label: "경기 결과",
    to: "/community/results",
  },
  {
    id: "prediction-results",
    label: "승부 예측 결과",
    to: "/community/prediction-results",
  },
];

const CommunitySubNav = ({ activeItemId = "" }) => (
  <SubNav
    activeItemId={activeItemId}
    ariaLabel="커뮤니티 스포츠 메뉴"
    items={COMMUNITY_SUB_NAV_ITEMS}
  />
);

export default CommunitySubNav;
