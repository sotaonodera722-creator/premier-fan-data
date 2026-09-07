// Japanese names for the nationalities that appear in players.json.
//
// The feed spells some countries more than one way — "Ivory Coast" and
// "Cote d'Ivoire", "Congo DR" and "DR Congo", "USA" and "United States" — which
// splits those squads across two entries anywhere nationality is listed or
// counted. Mapping every spelling onto one Japanese name collapses them, so the
// duplicates disappear as a side effect of translating.

const NATIONALITIES_JA: Record<string, string> = {
  England: "イングランド",
  Scotland: "スコットランド",
  Wales: "ウェールズ",
  "Northern Ireland": "北アイルランド",
  Ireland: "アイルランド",
  France: "フランス",
  Netherlands: "オランダ",
  Brazil: "ブラジル",
  Spain: "スペイン",
  Germany: "ドイツ",
  Argentina: "アルゼンチン",
  Belgium: "ベルギー",
  Italy: "イタリア",
  Sweden: "スウェーデン",
  Portugal: "ポルトガル",
  Japan: "日本",
  Nigeria: "ナイジェリア",
  Norway: "ノルウェー",
  Senegal: "セネガル",
  Denmark: "デンマーク",
  Switzerland: "スイス",
  Ecuador: "エクアドル",
  Greece: "ギリシャ",
  Austria: "オーストリア",
  Ghana: "ガーナ",
  Morocco: "モロッコ",
  Serbia: "セルビア",
  Ukraine: "ウクライナ",
  Canada: "カナダ",
  "Czech Republic": "チェコ",
  Uruguay: "ウルグアイ",
  Hungary: "ハンガリー",
  Algeria: "アルジェリア",
  Croatia: "クロアチア",
  Paraguay: "パラグアイ",
  Mali: "マリ",
  Jamaica: "ジャマイカ",
  Cameroon: "カメルーン",
  Slovenia: "スロベニア",
  Turkey: "トルコ",
  Chile: "チリ",
  Colombia: "コロンビア",
  Poland: "ポーランド",
  Luxembourg: "ルクセンブルク",
  "Guinea-Bissau": "ギニアビサウ",
  Georgia: "ジョージア",
  Uzbekistan: "ウズベキスタン",
  Mozambique: "モザンビーク",
  Haiti: "ハイチ",
  Slovakia: "スロバキア",
  Egypt: "エジプト",
  Australia: "オーストラリア",
  "Bosnia-Herzegovina": "ボスニア・ヘルツェゴビナ",
  Bulgaria: "ブルガリア",
  Albania: "アルバニア",
  "New Zealand": "ニュージーランド",
  Israel: "イスラエル",
  Gambia: "ガンビア",
  Iceland: "アイスランド",
  "South Korea": "韓国",
  "Burkina Faso": "ブルキナファソ",
  Guinea: "ギニア",

  // Spellings the feed uses interchangeably — mapped onto one Japanese name each.
  "Ivory Coast": "コートジボワール",
  "Cote d'Ivoire": "コートジボワール",
  "Congo DR": "コンゴ民主共和国",
  "DR Congo": "コンゴ民主共和国",
  USA: "アメリカ",
  "United States": "アメリカ",
};

// Falls back to the original string so a nationality the feed adds later shows
// up in Latin script rather than vanishing from a profile.
export function getNationalityJa(nationality: string): string {
  return NATIONALITIES_JA[nationality] ?? nationality;
}
