import React, { useState } from "react";
import css from "./Player.module.css";

/* 임의로 넣은 종목별 포지션 데이터(나중에 옮길 예정) */

const positionOptions = {
  baseball: ["전체", "투수", "포수", "내야수", "외야수"],
  soccer: ["전체", "FW", "MF", "DF", "GK"],
  basketball: ["전체", "G", "F", "C"],
  lol: ["전체", "TOP", "JUNGLE", "MID", "ADC", "SUP"],
};

const players = [
  {
    id: 1,
    sport: "baseball",
    position: "투수",
    name: "박치국",
    englishName: "PARK CHIUK",
    number: 1,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L22669920.png&w=1920&q=75",
  },

  {
    id: 4,
    sport: "baseball",
    position: "투수",
    name: "김동주",
    englishName: "KIM DONG JU",
    number: 4,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2Fb0818e7c-fc27-42bc-b3c5-3f0ef839de5b.png&w=1920&q=75",
  },

  {
    id: 12,
    sport: "baseball",
    position: "투수",
    name: "타카다 타쿠토",
    englishName: "TAKADA TAKUTO",
    number: 12,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F292e2f2d-ec55-45ec-be79-d61b6656b59d.png&w=1920&q=75",
  },
  {
    id: 15,
    sport: "baseball",
    position: "투수",
    name: "최주형",
    englishName: "CHOI JU HYEONG",
    number: 15,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L20385200.png&w=1920&q=75",
  },
  {
    id: 16,
    sport: "baseball",
    position: "투수",
    name: "김정우",
    englishName: "KIM JEONG WOO",
    number: 16,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L26931500.png&w=1920&q=75npick_logo_gray.png",
  },
  {
    id: 17,
    sport: "baseball",
    position: "투수",
    name: "박정수",
    englishName: "PARK JUNG SOO",
    number: 17,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L17537290.png&w=1920&q=75",
  },
  {
    id: 19,
    sport: "baseball",
    position: "투수",
    name: "김민규",
    englishName: "KIM MIN GYU",
    number: 19,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L24846000.png&w=1920&q=75",
  },
  {
    id: 20,
    sport: "baseball",
    position: "투수",
    name: "김영현",
    englishName: "KIM YOUNG HYUN",
    number: 20,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F52f36ce2-e2cd-4e72-a2cd-4cfa2bfd20f7.png&w=1920&q=75",
  },
  {
    id: 28,
    sport: "baseball",
    position: "투수",
    name: "최승용",
    englishName: "CHOI SEUNG YONG",
    number: 28,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L4095360.png&w=1920&q=75",
  },
  {
    id: 29,
    sport: "baseball",
    position: "투수",
    name: "이병헌",
    englishName: "LEE BYEONG HEON",
    number: 29,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L6986680.png&w=1920&q=75",
  },
  {
    id: 30,
    sport: "baseball",
    position: "투수",
    name: "양재훈",
    englishName: "YANG JAE HUN",
    number: 30,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L16375100.png&w=1920&q=75",
  },
  {
    id: 35,
    sport: "baseball",
    position: "투수",
    name: "이주호",
    englishName: "LEE JOOHO",
    number: 35,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L20014350.png&w=1920&q=75",
  },
  {
    id: 39,
    sport: "baseball",
    position: "투수",
    name: "잭 로그",
    englishName: "ZACH LOGUE",
    number: 39,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F3ca12369-64db-4771-824c-04e5ed84650b.png&w=1920&q=75",
  },
  {
    id: 40,
    sport: "baseball",
    position: "투수",
    name: "최종인",
    englishName: "CHOI JONG IN",
    number: 40,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L673620.png&w=1920&q=75",
  },
  {
    id: 41,
    sport: "baseball",
    position: "투수",
    name: "서준오",
    englishName: "SEO JUNO",
    number: 41,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L19534330.png&w=1920&q=75",
  },
  {
    id: 42,
    sport: "baseball",
    position: "투수",
    name: "최지강",
    englishName: "CHOI JI KANG",
    number: 42,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L7279800.png&w=1920&q=75",
  },
  {
    id: 43,
    sport: "baseball",
    position: "투수",
    name: "이주엽",
    englishName: "LEE JU YEOP",
    number: 43,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L838400.png&w=1920&q=75",
  },
  {
    id: 45,
    sport: "baseball",
    position: "투수",
    name: "이용찬",
    englishName: "LEE YONG CHAN",
    number: 45,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L23003090.png&w=1920&q=75",
  },
  {
    id: 46,
    sport: "baseball",
    position: "투수",
    name: "김명신",
    englishName: "KIM MYEONG SIN",
    number: 46,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L21882920.png&w=1920&q=75",
  },
  {
    id: 47,
    sport: "baseball",
    position: "투수",
    name: "곽빈",
    englishName: "GWAK BEEN",
    number: 47,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L24742200.png&w=1920&q=75",
  },
  {
    id: 48,
    sport: "baseball",
    position: "투수",
    name: "웨스 벤자민",
    englishName: "WES BENJAMIN",
    number: 48,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F13f6ec43-131f-4b0b-9aef-eccc387c12ce.png&w=1920&q=75",
  },
  {
    id: 49,
    sport: "baseball",
    position: "투수",
    name: "박신지",
    englishName: "PARK SHIN ZI",
    number: 49,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L25571900.png&w=1920&q=75",
  },
  {
    id: 50,
    sport: "baseball",
    position: "투수",
    name: "이영하",
    englishName: "LEE YOUNG HA",
    number: 50,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L20005380.png&w=1920&q=75",
  },
  {
    id: 55,
    sport: "baseball",
    position: "투수",
    name: "김유성",
    englishName: "KIM YU SEONG",
    number: 55,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L9916480.png&w=1920&q=75",
  },
  {
    id: 56,
    sport: "baseball",
    position: "투수",
    name: "김호준",
    englishName: "KIM HO JUN",
    number: 56,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L25551210.png&w=1920&q=75",
  },
  {
    id: 59,
    sport: "baseball",
    position: "투수",
    name: "최준호",
    englishName: "CHOI JUN HO",
    number: 59,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L10722110.png&w=1920&q=75",
  },
  {
    id: 61,
    sport: "baseball",
    position: "투수",
    name: "최원준",
    englishName: "CHOI WON JOON",
    number: 61,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L23677380.png&w=1920&q=75",
  },
  {
    id: 63,
    sport: "baseball",
    position: "투수",
    name: "김택연",
    englishName: "KIM TAEK YEON",
    number: 63,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L13087410.png&w=1920&q=75",
  },
  {
    id: 65,
    sport: "baseball",
    position: "투수",
    name: "윤태호",
    englishName: "YUN TAE HO",
    number: 65,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L6936300.png&w=1920&q=75",
  },

  {
    id: 68,
    sport: "baseball",
    position: "투수",
    name: "최민석",
    englishName: "CHOI MIN SEOK",
    number: 68,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L17015640.png&w=1920&q=75",
  },

  {
    id: 95,
    sport: "baseball",
    position: "투수",
    name: "김한중",
    englishName: "KIM HAN JUNG",
    number: 95,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L16080680.png&w=1920&q=75",
  },

  {
    id: 101,
    sport: "baseball",
    position: "투수",
    name: "최우인",
    englishName: "CHOI WOO IN",
    number: 101,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L5083000.png&w=1920&q=75",
  },

  {
    id: 104,
    sport: "baseball",
    position: "투수",
    name: "김지윤",
    englishName: "KIM JI WOON",
    number: 104,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L15979320.png&w=1920&q=75",
  },
  /* ============================================= */
  {
    id: 22,
    sport: "baseball",
    position: "포수",
    name: "김기연",
    englishName: "KIM KI YEON",
    number: 22,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L30621120.png&w=3840&q=75",
  },

  {
    id: 25,
    sport: "baseball",
    position: "포수",
    name: "양의지",
    englishName: "YANG EUI JI",
    number: 25,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L31409280.png&w=1920&q=75",
  },

  {
    id: 26,
    sport: "baseball",
    position: "포수",
    name: "박민준",
    englishName: "PARK MIN JUN",
    number: 26,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L16116120.png&w=1920&q=75",
  },

  {
    id: 27,
    sport: "baseball",
    position: "포수",
    name: "윤준호",
    englishName: "YUN JUN HO",
    number: 27,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L16644800.png&w=1920&q=75",
  },

  {
    id: 67,
    sport: "baseball",
    position: "포수",
    name: "류현준",
    englishName: "RYU HYUN JUN",
    number: 67,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L21179380.png&w=1920&q=75",
  },
  /* ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝ */
  {
    id: 3,
    sport: "baseball",
    position: "내야수",
    name: "임종성",
    englishName: "IM JONG SUNG",
    number: 3,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L17494680.png&w=1920&q=75",
  },

  {
    id: 5,
    sport: "baseball",
    position: "내야수",
    name: "박성재",
    englishName: "PARK SEOUNG JAE",
    number: 5,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L9280700.png&w=1920&q=75",
  },

  {
    id: 6,
    sport: "baseball",
    position: "내야수",
    name: "오명진",
    englishName: "OH MYENG JIN",
    number: 6,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L854880.png&w=1920&q=75",
  },

  {
    id: 7,
    sport: "baseball",
    position: "내야수",
    name: "박찬호",
    englishName: "PARK CHAN HO",
    number: 7,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L18909220.png&w=1920&q=75",
  },

  {
    id: 10,
    sport: "baseball",
    position: "내야수",
    name: "김민혁",
    englishName: "KIM MIN HYEOK",
    number: 10,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L21234070.png&w=1920&q=75",
  },

  {
    id: 11,
    sport: "baseball",
    position: "내야수",
    name: "김동준",
    englishName: "KIM DONG JUN",
    number: 11,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L9113340.png&w=1920&q=75",
  },

  {
    id: 13,
    sport: "baseball",
    position: "내야수",
    name: "이유찬",
    englishName: "LEE YU CHAN",
    number: 13,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L29692840.png&w=1920&q=75",
  },

  {
    id: 23,
    sport: "baseball",
    position: "내야수",
    name: "강승호",
    englishName: "KANG SEUNG HO",
    number: 23,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L12523230.png&w=1920&q=75ng",
  },

  {
    id: 36,
    sport: "baseball",
    position: "내야수",
    name: "유니오 세베리노",
    englishName: "YUNIOR SEVERINO",
    number: 36,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F8139166b-b016-4a3e-8da6-b52df4cd8452.png&w=1920&q=75",
  },

  {
    id: 37,
    sport: "baseball",
    position: "내야수",
    name: "박지훈",
    englishName: "PARK JI HOON",
    number: 37,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L828240.png&w=1920&q=75",
  },

  {
    id: 52,
    sport: "baseball",
    position: "내야수",
    name: "박준순",
    englishName: "PARK JUN SOON",
    number: 52,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L21270600.png&w=1920&q=75",
  },
  {
    id: 53,
    sport: "baseball",
    position: "내야수",
    name: "양석환",
    englishName: "YANG SUK HWAN",
    number: 53,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L17027300.png&w=1920&q=75",
  },
  {
    id: 62,
    sport: "baseball",
    position: "내야수",
    name: "안재석",
    englishName: "AHN JAE SEOK",
    number: 62,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L4920270.png&w=1920&q=75",
  },
  {
    id: 117,
    sport: "baseball",
    position: "내야수",
    name: "심건보",
    englishName: "SHIM GEON BO",
    number: 117,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L25365360.png&w=1920&q=75",
  },
  /* ======================== */
  {
    id: 2,
    sport: "baseball",
    position: "외야수",
    name: "김민석",
    englishName: "KIM MIN SUK",
    number: 2,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L21395080.png&w=1920&q=75",
  },
  {
    id: 8,
    sport: "baseball",
    position: "외야수",
    name: "손야섭",
    englishName: "SON AH SUP",
    number: 8,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F0d260e7c-ad1d-492d-931e-5306366e7e84.png&w=1920&q=75",
  },
  {
    id: 9,
    sport: "baseball",
    position: "외야수",
    name: "전다민",
    englishName: "JEON DA MIN",
    number: 9,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L25536840.png&w=1920&q=75",
  },
  {
    id: 14,
    sport: "baseball",
    position: "외야수",
    name: "류승민",
    englishName: "RYU SEUNG MIN",
    number: 14,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2Fd9f1c428-db66-4872-9e40-8f10294d357a.png&w=1920&q=75",
  },
  {
    id: 31,
    sport: "baseball",
    position: "외야수",
    name: "정수빈",
    englishName: "JUNG SOO BIN",
    number: 31,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L56032170.png&w=1920&q=75",
  },
  {
    id: 32,
    sport: "baseball",
    position: "외야수",
    name: "김대한",
    englishName: "KIM DAE HAN",
    number: 32,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L55520380.png&w=1920&q=75",
  },
  {
    id: 33,
    sport: "baseball",
    position: "외야수",
    name: "김인태",
    englishName: "KIM IN TAE",
    number: 33,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L19639710.png&w=1920&q=75",
  },
  {
    id: 34,
    sport: "baseball",
    position: "외야수",
    name: "홍성호",
    englishName: "HONG SEONG HO",
    number: 34,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L38021300.png&w=1920&q=75",
  },
  {
    id: 51,
    sport: "baseball",
    position: "외야수",
    name: "조수행",
    englishName: "JO SOO HAENG",
    number: 51,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L37750720.png&w=1920&q=75",
  },
  {
    id: 66,
    sport: "baseball",
    position: "외야수",
    name: "김주오",
    englishName: "KIM JOO OH",
    number: 66,
    image: "https://www.doosanbears.com/_next/image?url=https%3A%2F%2Fd3uesnxiude69b.cloudfront.net%2Fplayer%2Flist%2F2026L37846640.png&w=1920&q=75",
  },
];

const Player = () => {
  const [selectedSport, setSelectedSport] = useState("baseball");
  const [selectedPosition, setSelectedPosition] = useState("전체");
  const [isPositionOpen, setIsPositionOpen] = useState(false);

  const currentPositions = positionOptions[selectedSport] || [];

  const filteredPlayers = players.filter((player) => {
    const sportMatch = player.sport === selectedSport;
    const positionMatch =
      selectedPosition === "전체" || player.position === selectedPosition;

    return sportMatch && positionMatch;
  });

  return (
    <div className={css.container}>
      {/* 필터 영역 */}

      <div className={css.filterSection}>
        <div className={css.positionFilter}>
          <button
            type="button"
            onClick={() => setIsPositionOpen((prev) => !prev)}
          >
            {selectedPosition}
          </button>

          {isPositionOpen && (
            <ul className={css.positionList}>
              {currentPositions.map((position) => (
                <li key={position}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition(position);
                      setIsPositionOpen(false);
                    }}
                  >
                    {position}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 카드 영역 */}
      <div className={css.cardContainer}>
        {filteredPlayers.map((player) => (
          <div className={css.card} key={player.id}>
            <img src={player.image} alt="선수 이미지" />
            <div className={css.bottomRow}>
              <div className={css.left}>
                <div className={css.leftUp}>
                  <h2>{player.name}</h2>
                  <p>{player.position}</p>
                </div>

                <div className={css.leftDown} />

                <h3>{player.englishName}</h3>
              </div>

              <div className={css.right}>
                <strong className={css.number}>{player.number}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Player;
