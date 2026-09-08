// Which fixtures carry more than three points, and why.
//
// This is hand-written for the same reason clubProfiles.ts is: the feed has no
// field for it, and — unlike promotion, which last season's table can be made to
// yield — nothing in the data implies it either.
//
// The head-to-head file was the obvious candidate and does not work. It reaches
// back only to January 2020, so the number of recorded meetings measures how long
// both clubs have been in the division rather than how much the fixture matters:
// the Manchester derby has eleven meetings on record, fewer than the fourteen
// between Aston Villa and Brighton. Balance fares no better — Chelsea and
// Brighton have split their thirteen meetings exactly evenly, which makes them
// well matched, not enemies.
//
// So the data supplies the record and this file supplies the meaning. The split
// is deliberate: the numbers on screen stay derived, and the claims that cannot
// be derived are visible here where they can be checked.
//
// Sources: the Wikipedia articles on each derby named below (Manchester derby,
// Merseyside derby, North London derby, Tyne–Wear derby, M23 derby, West London
// derbies, Roses rivalry, Liverpool F.C.–Manchester United F.C. rivalry).
//
// Maintenance: rivalries between clubs in different divisions disappear from the
// list on their own — a pairing is only shown when both clubs are in the league —
// so promotion and relegation need no edit here. New pairings do.

/** Why the fixture is what it is. Ordered by how directly it can be explained. */
export type RivalryKind = "sameCity" | "regional" | "historic";

export const RIVALRY_KIND_LABELS: Record<RivalryKind, string> = {
  sameCity: "同じ街",
  regional: "同じ地方",
  historic: "歴史",
};

export interface Rivalry {
  teamIds: [number, number];
  /** The name the fixture is known by, or null where it has no agreed name. */
  name: string | null;
  kind: RivalryKind;
  /** One or two sentences. Why a reader who knows neither club should care. */
  why: string;
  /**
   * 3 = the fixture a supporter marks on the calendar before any other.
   * 2 = a real rivalry, not the biggest either club has.
   * 1 = a meeting with history, short of a rivalry.
   *
   * Used to order the list on a club page and to weight the homepage picks.
   * Deliberately coarse: a finer scale would imply a precision that a
   * hand-written judgement does not have.
   */
  intensity: 1 | 2 | 3;
}

export const RIVALRIES: Rivalry[] = [
  {
    teamIds: [65, 66],
    name: "マンチェスター・ダービー",
    kind: "sameCity",
    why: "同じ市内に本拠を置く2クラブ。長くユナイテッドの街だったが、2008年にシティが資金を得てから力関係が入れ替わった。家族の中で応援先が割れることも珍しくない。",
    intensity: 3,
  },
  {
    teamIds: [62, 64],
    name: "マージーサイド・ダービー",
    kind: "sameCity",
    why: "本拠地が公園を挟んで1km足らずしか離れていない。イングランド1部で最も多く行われてきた対戦で、退場者の多さから「フレンドリー・ダービー」という古い呼び名は実態に合わなくなっている。",
    intensity: 3,
  },
  {
    teamIds: [57, 73],
    name: "ノースロンドン・ダービー",
    kind: "sameCity",
    why: "ロンドン北部の隣接する2クラブ。1913年にアーセナルが南から移転してきたこと、そして1919年に1部の枠を巡ってトッテナムを押しのけたことが、100年以上経った今も遺恨として語られる。",
    intensity: 3,
  },
  {
    teamIds: [67, 71],
    name: "タイン・ウェア・ダービー",
    kind: "regional",
    why: "イングランド北東部、タイン川とウェア川に分かれた2都市。17km ほどしか離れておらず、この地域には他に1部のクラブがない。両者が同じディヴィジョンにいる年自体が久しぶり。",
    intensity: 3,
  },
  {
    teamIds: [354, 397],
    name: "M23ダービー",
    kind: "regional",
    why: "ロンドン南部と海沿いのブライトンを結ぶ高速道路の名前がついた対戦。距離は70km以上あり地理的には遠いが、1970年代の昇格争いで繰り返し当たったことから始まり、今もイングランドで最も激しい対戦のひとつに数えられる。",
    intensity: 3,
  },
  {
    teamIds: [64, 66],
    name: null,
    kind: "historic",
    why: "イングランドで最も多くリーグ優勝を重ねてきた2クラブ。産業革命期に運河と鉄道で競い合った2都市の対立がそのまま持ち込まれている。街は違うが、多くの人がイングランド最大の一戦に挙げる。",
    intensity: 3,
  },
  {
    teamIds: [341, 66],
    name: "ローズ・ダービー",
    kind: "regional",
    why: "ヨークシャーとランカシャーという、15世紀の薔薇戦争で争った2つの地方の代理戦争。リーズが長く2部以下にいたため対戦自体が途切れていた期間が長い。",
    intensity: 3,
  },
  {
    teamIds: [61, 63],
    name: "ウェストロンドン・ダービー",
    kind: "sameCity",
    why: "テムズ川沿いに3kmほどしか離れていない2クラブ。フラムのほうが古いが、成績でも規模でもチェルシーが大きく上回る期間が長く続いている。",
    intensity: 2,
  },
  {
    teamIds: [63, 402],
    name: "ウェストロンドン・ダービー",
    kind: "sameCity",
    why: "ロンドン西部の隣接するクラブ同士。ブレントフォードが2021年に74年ぶりの1部復帰を果たすまで、この対戦は下部リーグのものだった。",
    intensity: 2,
  },
  {
    teamIds: [61, 402],
    name: "ウェストロンドン・ダービー",
    kind: "sameCity",
    why: "ロンドン西部という点では同じ括りだが、両者が1部で顔を合わせるようになったのは2021年から。歴史の厚みは他のウェストロンドン勢との対戦に譲る。",
    intensity: 1,
  },
  {
    teamIds: [57, 61],
    name: null,
    kind: "historic",
    why: "同じロンドンの2クラブ。2000年代半ばに優勝を争って以来、上位での対戦が定着した。地理よりも「どちらがロンドン最大か」という争い。",
    intensity: 2,
  },
  {
    teamIds: [61, 73],
    name: null,
    kind: "historic",
    why: "ロンドンのクラブ同士。2015年に優勝争いの最中で行われた乱闘寸前の一戦が、この対戦の温度を決定づけた。",
    intensity: 2,
  },
  {
    teamIds: [57, 66],
    name: null,
    kind: "historic",
    why: "1990年代後半から2000年代前半にかけて、この2クラブだけで優勝を分け合った時期がある。当時の激しさを知る世代にとっては特別な一戦。",
    intensity: 2,
  },
  {
    teamIds: [64, 65],
    name: null,
    kind: "historic",
    why: "2018年から2022年にかけて、優勝がこの2クラブのどちらかに限られた時期があり、勝点1差で決着した年もある。街は違うが、直近で最も高い位置での争い。",
    intensity: 2,
  },
  {
    teamIds: [322, 341],
    name: null,
    kind: "regional",
    why: "同じヨークシャーの2クラブ。ただし近年の対戦はすべて2部でのもので、プレミアリーグで顔を合わせるのは久しぶりになる。",
    intensity: 1,
  },
];

/**
 * A club whose real rival is not in this division.
 *
 * Five of the twenty have no rivalry above, and leaving their page blank would
 * read as missing data. It is not: for a reader working out who is who, "the
 * club they actually care about beating is in the division below" is a fact
 * about them worth as much as a fixture.
 */
export interface AbsentRival {
  teamId: number;
  /** The rival, named in Japanese — it is not in this league, so no id exists. */
  rivalName: string;
  name: string | null;
  why: string;
}

export const ABSENT_RIVALS: AbsentRival[] = [
  {
    teamId: 349,
    rivalName: "ノリッジ・シティ",
    name: "イースト・アングリアン・ダービー",
    why: "イングランド東部の2クラブで、間に他の1部クラブがない。ノリッジは今季2部にいるため、この対戦は今季は行われない。",
  },
  {
    teamId: 1044,
    rivalName: "サウサンプトン",
    name: "サウスコースト・ダービー",
    why: "イングランド南岸で50kmほどしか離れていない2クラブ。サウサンプトンは今季2部にいる。",
  },
  {
    teamId: 351,
    rivalName: "ダービー・カウンティ",
    name: "イーストミッドランズ・ダービー",
    why: "同じ監督が両クラブを率いて優勝させた歴史を持つ、ミッドランズの因縁。ダービーは今季2部にいる。",
  },
  {
    teamId: 58,
    rivalName: "バーミンガム・シティ",
    name: "セカンド・シティ・ダービー",
    why: "同じバーミンガム市内の2クラブ。バーミンガム・シティは今季2部にいるため、市内対決は行われない。",
  },
  {
    teamId: 1076,
    rivalName: "レスター・シティ",
    name: null,
    why: "ミッドランズの近隣クラブ同士で、2部時代に繰り返し対戦してきた。レスターは今季2部にいる。",
  },
];

function key(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join("-");
}

const BY_PAIR = new Map(RIVALRIES.map((r) => [key(r.teamIds[0], r.teamIds[1]), r]));

/** The rivalry between two clubs, if this fixture is one. */
export function getRivalry(teamAId: number, teamBId: number): Rivalry | undefined {
  return BY_PAIR.get(key(teamAId, teamBId));
}

/** Every rivalry a club has in this division, fiercest first. */
export function getRivalriesFor(teamId: number): Rivalry[] {
  return RIVALRIES.filter((r) => r.teamIds.includes(teamId)).sort(
    (a, b) => b.intensity - a.intensity
  );
}

/** The rival a club has who is not in this division, if any. */
export function getAbsentRival(teamId: number): AbsentRival | undefined {
  return ABSENT_RIVALS.find((r) => r.teamId === teamId);
}

export const RIVALRY_SOURCES = [
  {
    label: "Manchester derby",
    url: "https://en.wikipedia.org/wiki/Manchester_derby",
  },
  {
    label: "Merseyside derby",
    url: "https://en.wikipedia.org/wiki/Merseyside_derby",
  },
  {
    label: "North London derby",
    url: "https://en.wikipedia.org/wiki/North_London_derby",
  },
  {
    label: "Tyne–Wear derby",
    url: "https://en.wikipedia.org/wiki/Tyne%E2%80%93Wear_derby",
  },
  { label: "M23 derby", url: "https://en.wikipedia.org/wiki/M23_derby" },
  {
    label: "Roses rivalry (football)",
    url: "https://en.wikipedia.org/wiki/Roses_rivalry_(football)",
  },
] as const;
