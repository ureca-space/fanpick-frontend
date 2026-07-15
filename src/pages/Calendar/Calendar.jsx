import React from "react";
import MatchCard from "../../components/MatchCard/MatchCard";

const MATCHES = [
   {
    id: 1,
    sport: "baseball",
    sportLabel: "BASEBALL",
    league: "KBO",
    date: "2026-07-16",
    day: "목",
    time: "18:30",
    venue: "잠실",
    homeTeam: {
      name: "두산 베어스",
      shortName: "두산",
      logo: "/images/team-logos/doosan.png",
    },
    awayTeam: {
      name: "NC 다이노스",
      shortName: "NC",
      logo: "/images/team-logos/nc.png",
    },
    homeVotes: 634,
    awayVotes: 366,
  },
];
const Calendar = () => {
  return (
  <div>
    {MATCHES.map((match) => (
    <MatchCard key={match.id} match={match} mode="calendar" />
  ))}
  </div>
);
};
export default Calendar;
