// Who each club actually is — the layer the data feed has no field for.
//
// The feed knows a club's name, crest, colours and founding year. It does not
// know that Coventry have been away for twenty-five years, that Forest won the
// European Cup twice, or that Everton left Goodison Park. Without that, a
// reader who does not follow English football sees twenty interchangeable names
// and a table of numbers that mean nothing.
//
// Sources: the 2026–27 Premier League, List of English football champions,
// List of European Cup and UEFA Champions League finals, and List of FA Cup
// finals articles on Wikipedia. Cited on the page, since these are claims the
// site cannot derive from its own data.
//
// Stadium names live here rather than coming from the feed: the feed's `venue`
// is stale for several clubs (it still has Everton at Goodison Park, Brentford
// at Griffin Park, Hull at the Kingston Communications Stadium and Coventry at
// St Andrew's), and a wrong ground is worse than no ground.

/** What a club is, in terms that do not change from week to week. */
export type ClubTier = "big6" | "midtable" | "promoted";

export const TIER_LABELS: Record<ClubTier, string> = {
  big6: "ビッグ6",
  midtable: "中堅",
  promoted: "昇格組",
};

export const TIER_DESCRIPTIONS: Record<ClubTier, string> = {
  big6: "資金力と成績で長くリーグを引っ張ってきた6クラブ。順位が落ちてもこの括りからは外れない",
  midtable: "ビッグ6にも昇格組にも入らない11クラブ。優勝争いから残留争いまで、季節によって立ち位置が変わる",
  promoted: "今季2部から上がってきた3クラブ。プレミアリーグでの戦いはここから",
};

export interface ClubProfile {
  /** Where the club is, in the terms a Japanese reader can place on a map. */
  city: string;
  venueJa: string;
  venueEn: string;
  tier: ClubTier;
  /** Years spent outside the top flight before this season, for promoted clubs. */
  promotedAfterYears?: number;
  /** English top-flight titles. */
  leagueTitles: number;
  /** European Cup / Champions League titles. */
  europeanCups: number;
  /** One to three sentences: what this club is, and why anyone should care. */
  identity: string;
}

export const CLUB_SOURCES = [
  { label: "2026–27 Premier League", url: "https://en.wikipedia.org/wiki/2026%E2%80%9327_Premier_League" },
  { label: "List of English football champions", url: "https://en.wikipedia.org/wiki/List_of_English_football_champions" },
  {
    label: "List of European Cup and UEFA Champions League finals",
    url: "https://en.wikipedia.org/wiki/List_of_European_Cup_and_UEFA_Champions_League_finals",
  },
  { label: "List of FA Cup finals", url: "https://en.wikipedia.org/wiki/List_of_FA_Cup_finals" },
] as const;

const CLUB_PROFILES: Record<number, ClubProfile> = {
  57: {
    city: "ロンドン（ホロウェイ）",
    venueJa: "エミレーツ・スタジアム",
    venueEn: "Emirates Stadium",
    tier: "big6",
    leagueTitles: 14,
    europeanCups: 0,
    identity:
      "ロンドン北部の名門で、1部優勝14回はリーグ3位の記録。2003-04シーズンに1シーズン無敗で優勝した唯一のクラブとして知られる。欧州の頂点にはまだ届いていない。",
  },
  58: {
    city: "バーミンガム（アストン）",
    venueJa: "ヴィラ・パーク",
    venueEn: "Villa Park",
    tier: "midtable",
    leagueTitles: 7,
    europeanCups: 1,
    identity:
      "1872年創設、リーグ創設メンバーのひとつ。1部優勝7回は歴代6位だが、最後の優勝は1981年。その翌年に欧州王者になっている。",
  },
  61: {
    city: "ロンドン（フラム）",
    venueJa: "スタンフォード・ブリッジ",
    venueEn: "Stamford Bridge",
    tier: "big6",
    leagueTitles: 6,
    europeanCups: 2,
    identity:
      "ロンドン西部。1部優勝6回のうち5回は2005年以降で、優勝の大半がこの20年に集中している。欧州制覇も2012年と2021年の2回。",
  },
  62: {
    city: "リヴァプール",
    venueJa: "ヒル・ディキンソン・スタジアム",
    venueEn: "Hill Dickinson Stadium",
    tier: "midtable",
    leagueTitles: 9,
    europeanCups: 0,
    identity:
      "1部優勝9回はリーグ5位。1892年から本拠地だったグディソン・パークを離れ、2025年に新スタジアムへ移った。同じ街のリヴァプールとは、イングランドでもっとも対戦回数の多いライバル関係にある。",
  },
  63: {
    city: "ロンドン（フラム）",
    venueJa: "クレイヴン・コテージ",
    venueEn: "Craven Cottage",
    tier: "midtable",
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "テムズ川のほとりに建つクレイヴン・コテージが本拠地で、リーグでも屈指の古い競技場。1部優勝はなく、1975年のFAカップ決勝が最も近づいた瞬間だった。",
  },
  64: {
    city: "リヴァプール（アンフィールド）",
    venueJa: "アンフィールド",
    venueEn: "Anfield",
    tier: "big6",
    leagueTitles: 20,
    europeanCups: 6,
    identity:
      "1部優勝20回はマンチェスター・ユナイテッドと並ぶ最多。欧州制覇6回はイングランドのクラブで断然の最多で、1970年代から80年代にかけて欧州を支配した。",
  },
  65: {
    city: "マンチェスター",
    venueJa: "エティハド・スタジアム",
    venueEn: "City of Manchester Stadium",
    tier: "big6",
    leagueTitles: 10,
    europeanCups: 1,
    identity:
      "長く街の二番手だったが、2008年の買収以降に一変。1部優勝10回のうち8回がプレミアリーグ時代で、そのほとんどがここ15年に集中している。2023年に初の欧州制覇。",
  },
  66: {
    city: "マンチェスター（トラフォード）",
    venueJa: "オールド・トラッフォード",
    venueEn: "Old Trafford",
    tier: "big6",
    leagueTitles: 20,
    europeanCups: 3,
    identity:
      "1部優勝20回はリヴァプールと並ぶ最多で、うち12回がプレミアリーグ時代。1990年代から2000年代にかけてリーグを支配した。欧州制覇は1968年・1999年・2008年の3回。",
  },
  67: {
    city: "ニューカッスル・アポン・タイン",
    venueJa: "セント・ジェームズ・パーク",
    venueEn: "St James' Park",
    tier: "midtable",
    leagueTitles: 4,
    europeanCups: 0,
    identity:
      "1部優勝4回はすべて1927年以前、FAカップ6回も最後は1955年。街の中心に建つスタジアムと熱狂的な観客で知られる一方、主要タイトルからは70年遠ざかっている。",
  },
  71: {
    city: "サンダーランド",
    venueJa: "スタジアム・オブ・ライト",
    venueEn: "Stadium of Light",
    tier: "midtable",
    leagueTitles: 6,
    europeanCups: 0,
    identity:
      "1部優勝6回は歴代7位だが、すべて1936年以前のもの。近隣のニューカッスルとは激しいライバル関係にある。近年は1部と2部を行き来してきた。",
  },
  73: {
    city: "ロンドン（トッテナム）",
    venueJa: "トッテナム・ホットスパー・スタジアム",
    venueEn: "Tottenham Hotspur Stadium",
    tier: "big6",
    leagueTitles: 2,
    europeanCups: 0,
    identity:
      "ビッグ6のなかで唯一プレミアリーグ時代の優勝がなく、1部優勝2回は1961年と1962年。FAカップは8回。本拠地は2019年に開場した新しいスタジアム。",
  },
  322: {
    city: "キングストン・アポン・ハル",
    venueJa: "MKMスタジアム",
    venueEn: "MKM Stadium",
    tier: "promoted",
    promotedAfterYears: 9,
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "イングランド北東部の港町のクラブ。1部での歴史は浅く、2014年のFAカップ決勝進出が最大の実績。9年ぶりにプレミアリーグへ戻ってきた。",
  },
  341: {
    city: "リーズ",
    venueJa: "エランド・ロード",
    venueEn: "Elland Road",
    tier: "midtable",
    leagueTitles: 3,
    europeanCups: 0,
    identity:
      "1992年、プレミアリーグ発足直前の最後の1部王者。その後は長く2部で過ごし、いまも当時を知る世代には「リーグ最後のチャンピオン」として記憶されている。",
  },
  349: {
    city: "イプスウィッチ",
    venueJa: "ポートマン・ロード",
    venueEn: "Portman Road",
    tier: "promoted",
    promotedAfterYears: 1,
    leagueTitles: 1,
    europeanCups: 0,
    identity:
      "イングランド東部の小さな街のクラブながら、1962年に1部優勝、1978年にFAカップを制している。1年でプレミアリーグへ戻ってきた。",
  },
  351: {
    city: "ノッティンガム（ウェスト・ブリッジフォード）",
    venueJa: "シティ・グラウンド",
    venueEn: "City Ground",
    tier: "midtable",
    leagueTitles: 1,
    europeanCups: 2,
    identity:
      "1979年と1980年に欧州王者。1部優勝1回のクラブが欧州を連覇したのは、いまも語り継がれる出来事になっている。1865年創設は世界最古級のプロクラブ。",
  },
  354: {
    city: "ロンドン（セルハースト）",
    venueJa: "セルハースト・パーク",
    venueEn: "Selhurst Park",
    tier: "midtable",
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "ロンドン南部。1部優勝はないが、2025年にFAカップを制し、創設から120年目にして初の主要タイトルを手にした。",
  },
  397: {
    city: "ブライトン・アンド・ホーヴ",
    venueJa: "アメリカン・エキスプレス・スタジアム",
    venueEn: "Falmer Stadium",
    tier: "midtable",
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "イングランド南岸の海辺の街。1983年のFAカップ決勝進出が長く唯一の見せ場だったが、2017年の昇格以降は定着し、近年は上位を脅かす存在になっている。",
  },
  402: {
    city: "ロンドン（ブレントフォード）",
    venueJa: "ブレントフォード・コミュニティ・スタジアム",
    venueEn: "Brentford Community Stadium",
    tier: "midtable",
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "ロンドン西部の小さなクラブ。1部優勝もFAカップ決勝進出もなく、20クラブでもっともタイトルから遠い部類にある。長く下位リーグにいたが、近年になって初めてプレミアリーグに定着した。",
  },
  1044: {
    city: "ボーンマス",
    venueJa: "ヴァイタリティ・スタジアム",
    venueEn: "Dean Court",
    tier: "midtable",
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "イングランド南岸のリゾート地のクラブ。1部優勝もFAカップ決勝進出もない。ヴァイタリティ・スタジアムはプレミアリーグ最小級の規模で、下部リーグから這い上がってきたクラブの歩みをそのまま映している。",
  },
  1076: {
    city: "コヴェントリー",
    venueJa: "コヴェントリー・ビルディング・ソサエティ・アリーナ",
    venueEn: "Coventry Building Society Arena",
    tier: "promoted",
    promotedAfterYears: 25,
    leagueTitles: 0,
    europeanCups: 0,
    identity:
      "1967年から34年間、1部に居続けた古豪。2001年の降格から25年を経て、ようやく戻ってきた。1987年のFAカップが唯一の主要タイトル。",
  },
};

export function getClubProfile(teamId: number): ClubProfile | undefined {
  return CLUB_PROFILES[teamId];
}

/** True for the three clubs that came up from the Championship this season. */
export function isPromotedThisSeason(teamId: number): boolean {
  return CLUB_PROFILES[teamId]?.tier === "promoted";
}
