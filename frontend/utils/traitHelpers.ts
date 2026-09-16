import { getChampion, getItemName } from './setMaster';

export interface ParsedTrait {
  name: string;
  count: number;
  minThreshold: number;
  nextThreshold: number;
  isActive: boolean;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeBg: string;
}

// 公式 Set 18 (TFTSet18 / DA_18_) 特性ごとの発動閾値マップ (1ユニット固有特性含む)
const TRAIT_THRESHOLDS: { [key: string]: number[] } = {
  // 1ユニット固有特性 (Origins / 固有シナジー)
  "フローラ・ファターリス": [1, 2],
  "バウンティーシーカー": [1],
  "アバター": [1],
  "エメラルドの神髄": [1],
  "ソーンメイデン": [1],
  "モノリス": [1],
  "原生林": [1],
  "同調": [1],
  "捕食者の頂点": [1],
  "翠の父": [1],
  "腐敗": [1],
  "エクリプス": [1],
  "ライバル": [1, 2],

  // 複数ユニット特性 (Origins & Classes)
  "エルダーウッド": [3, 5, 7, 9, 11],
  "スプライキン": [3, 5, 7],
  "ブロッサム": [3, 5, 7, 9, 11],
  "魔女": [3, 4, 5, 7],
  "インフェルノ": [2, 3, 5, 7],
  "ブラックソーン": [2, 4, 6],
  "ソーラー": [3],
  "フェイ": [2, 4],
  "プライマル": [2, 4],
  "リフトビースト": [3, 5, 7, 10],
  "ルナー": [2, 3, 4, 5],
  "アダプター": [2, 3, 4],
  "インヴォーカー": [2, 3, 4, 5],
  "エクセキューショナー": [2, 3, 4],
  "サモナー": [2, 3],
  "ジャガーノート": [2, 4, 6],
  "スペルウィーバー": [2, 4, 6],
  "ディフェンダー": [2, 4, 6],
  "ハンター": [2, 3, 4, 5],
  "ブローラー": [2, 4, 6],
  "ラピッドファイア": [2, 3, 4, 5],
  "ラヴィジャー": [2, 4, 6],
  "ヴァンガード": [2, 4, 6],
  "スレイヤー": [2, 4],

  // English Key Fallbacks
  "Flora Fatalis": [1, 2],
  "FloraFatalis": [1, 2],
  "Bounty Seeker": [1],
  "BountySeeker": [1],
  "Avatar": [1],
  "Emerald Essence": [1],
  "Thorn Maiden": [1],
  "Monolith": [1],
  "Old Growth": [1],
  "Synergy": [1],
  "Apex Predator": [1],
  "Father of the Green": [1],
  "Blight": [1],
  "Eclipse": [1],
  "Rival": [1, 2],
  "Riftbeast": [3, 5, 7, 10],
  "Elderwood": [3, 5, 7, 9, 11],
  "Spriteling": [3, 5, 7],
  "Blossom": [3, 5, 7, 9, 11],
  "Witch": [3, 4, 5, 7],
  "Inferno": [2, 3, 5, 7],
  "Blackthorn": [2, 4, 6],
  "Solar": [3],
  "Fae": [2, 4],
  "Primal": [2, 4],
  "Lunar": [2, 3, 4, 5]
};

const MAP_EMBLEM_TO_TRAIT: { [key: string]: string } = {
  "FloraFatalis": "フローラ・ファターリス",
  "FloraFatalisEmblem": "フローラ・ファターリス",
  "フローラ・ファターリス": "フローラ・ファターリス",
  "フローラファターリス": "フローラ・ファターリス",
  "Elderwood": "エルダーウッド",
  "Spriteling": "スプライキン",
  "Blossom": "ブロッサム",
  "Witch": "魔女",
  "Inferno": "インフェルノ",
  "Blackthorn": "ブラックソーン",
  "Adapter": "アダプター",
  "Solar": "ソーラー",
  "Fae": "フェイ",
  "FaeEmblem": "フェイ",
  "DA_18_EmblemFae": "フェイ",
  "TFT18_Item_FaeEmblem": "フェイ",
  "フェイ": "フェイ",
  "フェイの紋章": "フェイ",
  "Primal": "プライマル",
  "Lunar": "ルナー",
  "Hunter": "ハンター",
  "Defender": "ディフェンダー",
  "Vanguard": "ヴァンガード",
  "Juggernaut": "ジャガーノート",
  "Brawler": "ブローラー",
  "Spellweaver": "スペルウィーバー",
  "Invoker": "インヴォーカー",
  "Executioner": "エクセキューショナー",
  "Rapidfire": "ラピッドファイア",
  "Ravager": "ラヴィジャー",
  "Slayer": "スレイヤー",
  "Summoner": "サモナー"
};

export function parseTraitsSummary(traitsSummary?: string): ParsedTrait[] {
  if (!traitsSummary) return [];

  const rawParts = traitsSummary.split(',').map((s) => s.trim()).filter(Boolean);

  return rawParts.map((part) => {
    const match = part.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const count = parseInt(match[1], 10);
      const rawName = match[2];
      const name = MAP_EMBLEM_TO_TRAIT[rawName] || rawName;
      const thresholds = TRAIT_THRESHOLDS[name] || TRAIT_THRESHOLDS[rawName] || [2, 4];
      const minThreshold = thresholds[0];
      const nextThreshold = thresholds.find(t => t > count) || thresholds[thresholds.length - 1];

      let colorClass = 'text-sky-900 font-bold';
      let bgClass = 'bg-sky-100/90';
      let borderClass = 'border-sky-300';
      let badgeBg = 'bg-sky-500 text-white font-bold';

      if (count >= 5) {
        colorClass = 'text-amber-900 font-extrabold';
        bgClass = 'bg-amber-100';
        borderClass = 'border-amber-300 shadow-sm';
        badgeBg = 'bg-amber-500 text-white font-black';
      } else if (count >= 4) {
        colorClass = 'text-purple-900 font-bold';
        bgClass = 'bg-purple-100';
        borderClass = 'border-purple-300';
        badgeBg = 'bg-purple-600 text-white font-black';
      } else if (count >= minThreshold) {
        colorClass = 'text-sky-900 font-bold';
        bgClass = 'bg-sky-100/90';
        borderClass = 'border-sky-300';
        badgeBg = 'bg-sky-500 text-white font-bold';
      } else {
        colorClass = 'text-slate-600 font-medium';
        bgClass = 'bg-slate-100';
        borderClass = 'border-slate-200';
        badgeBg = 'bg-slate-200 text-slate-600 font-bold';
      }

      return {
        name,
        count,
        minThreshold,
        nextThreshold,
        isActive: count >= minThreshold,
        colorClass,
        bgClass,
        borderClass,
        badgeBg
      };
    }

    const rawName = part;
    const name = MAP_EMBLEM_TO_TRAIT[rawName] || rawName;
    const thresholds = TRAIT_THRESHOLDS[name] || [1];
    const minThreshold = thresholds[0];

    return {
      name,
      count: 1,
      minThreshold,
      nextThreshold: thresholds[thresholds.length - 1],
      isActive: true,
      colorClass: 'text-amber-900 font-bold',
      bgClass: 'bg-amber-100',
      borderClass: 'border-amber-300',
      badgeBg: 'bg-amber-500 text-white font-black',
    };
  });
}

export interface UnitDetailWithTraits {
  id: string;
  name?: string;
  cost?: number;
  icon?: string;
  role?: string;
  row?: number;
  col?: number;
  star?: number;
  traits?: string[];
  items?: any[];
}

export function calculateAllTeamTraits(unitsDetail?: UnitDetailWithTraits[], traitsSummary?: string) {
  const traitCounts: { [key: string]: number } = {};

  // ユニット一覧から全特性を集計
  if (unitsDetail && unitsDetail.length > 0) {
    unitsDetail.forEach((u) => {
      // チャンピオン固有特性の取得（u.traitsになければsetMasterより自動補充）
      const champMaster = getChampion(u.id || u.name);
      const uTraits = (u.traits && u.traits.length > 0) ? u.traits : (champMaster.traits || []);

      uTraits.forEach((t) => {
        if (t) {
          const mappedName = MAP_EMBLEM_TO_TRAIT[t] || t;
          traitCounts[mappedName] = (traitCounts[mappedName] || 0) + 1;
        }
      });

      // 装備アイテムの「紋章」による特性+1を加算
      (u.items || []).forEach((item) => {
        const itemObj = typeof item === 'object' ? item : { id: String(item), name: '' };
        const rawName = itemObj.name || getItemName(itemObj.id) || itemObj.id || '';
        if (rawName.includes('紋章') || rawName.toLowerCase().includes('emblem')) {
          const rawEmblemName = rawName
            .replace(/の紋章$/, '')
            .replace(/ 紋章$/, '')
            .replace(/ Emblem$/, '')
            .replace(/^DA_18_Emblem/, '')
            .replace(/^TFT18_Item_/, '')
            .replace(/Emblem$/, '')
            .trim();

          const mappedTrait = MAP_EMBLEM_TO_TRAIT[rawEmblemName] || MAP_EMBLEM_TO_TRAIT[rawName] || rawEmblemName;
          if (mappedTrait) {
            traitCounts[mappedTrait] = (traitCounts[mappedTrait] || 0) + 1;
          }
        }
      });
    });
  }

  // もし unitsDetail にデータがない、または集計結果が空の場合は traitsSummary より解析
  if (Object.keys(traitCounts).length === 0 && traitsSummary) {
    const parsed = parseTraitsSummary(traitsSummary);
    parsed.forEach((t) => {
      traitCounts[t.name] = t.count;
    });
  }

  const activeTraits: ParsedTrait[] = [];
  const inactiveTraits: ParsedTrait[] = [];

  Object.entries(traitCounts).forEach(([name, count]) => {
    const thresholds = TRAIT_THRESHOLDS[name] || [2, 4];
    const minThreshold = thresholds[0];
    const nextThreshold = thresholds.find(t => t > count) || thresholds[thresholds.length - 1];
    const isActive = count >= minThreshold;

    if (isActive) {
      let colorClass = 'text-sky-900 font-bold';
      let bgClass = 'bg-sky-100/90';
      let borderClass = 'border-sky-300';
      let badgeBg = 'bg-sky-500 text-white font-bold';

      if (count >= 5) {
        colorClass = 'text-amber-900 font-extrabold';
        bgClass = 'bg-amber-100';
        borderClass = 'border-amber-300 shadow-sm';
        badgeBg = 'bg-amber-500 text-white font-black';
      } else if (count >= 4) {
        colorClass = 'text-purple-900 font-bold';
        bgClass = 'bg-purple-100';
        borderClass = 'border-purple-300';
        badgeBg = 'bg-purple-600 text-white font-black';
      }

      activeTraits.push({
        name,
        count,
        minThreshold,
        nextThreshold,
        isActive: true,
        colorClass,
        bgClass,
        borderClass,
        badgeBg
      });
    } else {
      inactiveTraits.push({
        name,
        count,
        minThreshold,
        nextThreshold,
        isActive: false,
        colorClass: 'text-slate-500 font-medium',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
        badgeBg: 'bg-slate-200 text-slate-600 font-bold'
      });
    }
  });

  // アクティブを数が多い順、非アクティブも数が多い順にソート
  activeTraits.sort((a, b) => b.count - a.count);
  inactiveTraits.sort((a, b) => b.count - a.count);

  return { activeTraits, inactiveTraits, totalTraitsCount: activeTraits.length + inactiveTraits.length };
}
