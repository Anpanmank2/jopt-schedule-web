/**
 * JOPT Official Rule の構造化テキストデータ。
 * /rules ページで JA/EN/KO の 3 言語表示に使用する。
 *
 * 原本: public/jopt-official-rule-2026.pdf (JA)
 * EN/KO は Claude による翻訳（参考訳。法的に正なのは JA 原本）。
 */

export type RuleLocale = "ja" | "en" | "ko";

export type Highlight = {
  /** 本文中で <strong> 化する語 (locale ごとに対応語を指定) */
  phrase: string;
};

export type RuleParagraph = {
  type: "paragraph";
  text: string;
  highlights?: Highlight[];
};

export type RuleCallout = {
  type: "callout";
  /** info: blue / warning: amber */
  tone: "info" | "warning";
  text: string;
};

export type RuleOrderedItem = {
  /** 抜き出した見出しフレーズ (bold で表示) */
  subject: string;
  /** 本文 */
  body: string;
  highlights?: Highlight[];
};

export type RuleOrderedList = {
  type: "ordered-list";
  items: RuleOrderedItem[];
};

export type RuleEmailLink = {
  type: "email-link";
  prefix: string;
  email: string;
  suffix: string;
};

export type RuleBlock =
  | RuleParagraph
  | RuleCallout
  | RuleOrderedList
  | RuleEmailLink;

export type RuleSectionIconKey =
  | "book"
  | "shield-alert"
  | "handshake"
  | "file-signature";

export type RuleSection = {
  /** anchor 用 id (3 言語共通) */
  id: string;
  /** 3 言語共通アイコン */
  iconKey: RuleSectionIconKey;
  /** 表示タイトル (locale 依存) */
  title: string;
  blocks: RuleBlock[];
};

const ja: RuleSection[] = [
  {
    id: "house-rule",
    iconKey: "book",
    title: "House Rule / ハウスルール",
    blocks: [
      {
        type: "paragraph",
        text: "本イベントでは TDA ルール 2024 に基づいてトーナメントを運用しますが、ハウスルール・TD の意思決定が最終的な判断となります。",
        highlights: [{ phrase: "TDA ルール 2024" }, { phrase: "TD の意思決定が最終的な判断" }],
      },
      {
        type: "paragraph",
        text: "ゲームに問題が生じたと思われるときは、次のゲームが始まるまでに申し出てください。",
      },
      {
        type: "paragraph",
        text: "基本ルールは JOPT Official Rule を採用します。",
        highlights: [{ phrase: "JOPT Official Rule" }],
      },
    ],
  },
  {
    id: "age",
    iconKey: "shield-alert",
    title: "年齢制限について",
    blocks: [
      {
        type: "callout",
        tone: "warning",
        text: "18 歳未満の方は本イベントの全トーナメントにご参加いただけません。",
      },
      {
        type: "paragraph",
        text: "本イベントでは、健全な運営と法令遵守の観点から、18 歳未満の方はすべてのトーナメントにご参加いただけません。",
      },
      {
        type: "paragraph",
        text: "また、18 歳未満の方の参加が発覚した場合には、その時点でエントリーを無効とします。",
        highlights: [{ phrase: "エントリーを無効" }],
      },
    ],
  },
  {
    id: "deal",
    iconKey: "handshake",
    title: "ディールについて",
    blocks: [
      {
        type: "callout",
        tone: "info",
        text: "ディールが可能なのは「FT かつプライズの獲得が確定している場合」のみです。サテライトは対象外です。",
      },
      {
        type: "paragraph",
        text: "サテライトを除く全てのトーナメントで ICM の計算に基づいたディールをすることができます。",
        highlights: [{ phrase: "サテライトを除く" }, { phrase: "ICM の計算" }],
      },
      {
        type: "paragraph",
        text: "ディールは FT かつプライズの獲得が確定している場合に可能で、プライズの一部及びトロフィーは優勝者が獲得することができます。",
        highlights: [{ phrase: "FT" }, { phrase: "プライズの獲得が確定" }, { phrase: "トロフィーは優勝者" }],
      },
      {
        type: "paragraph",
        text: "詳細はフロアまでお問い合わせください。",
      },
    ],
  },
  {
    id: "contract",
    iconKey: "file-signature",
    title: "選手契約について",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            subject: "選手契約のオファー",
            body: "上位入賞されたプレイヤーには、プライズとしてジャパンオープンポーカーツアー株式会社との選手契約（業務委託契約）をオファーします。この選手契約は、当社のプロモーションおよび健全な普及を目指すことを目的として、国内遠征費や海外トーナメントの参加費、渡航費などの経費を、委託料としてジャパンオープンポーカーツアー株式会社が負担するものです。この契約は任意となり、契約する際は、会場で当日中の契約のお手続きが必要です。詳しくは JOPT ウェブページ「プライズ（選手契約）について」をご覧ください。",
            highlights: [{ phrase: "選手契約（業務委託契約）" }, { phrase: "任意" }, { phrase: "当日中の契約のお手続きが必要" }],
          },
          {
            subject: "プライズ表記の通貨",
            body: "予め決められた為替レートで計算された米ドル額をプライズとして記載しています。",
            highlights: [{ phrase: "米ドル額" }],
          },
          {
            subject: "為替レート決定",
            body: "実施日 3 日前に発表する固定為替レートで再計算し、米ドル額を決定します。",
            highlights: [{ phrase: "実施日 3 日前" }, { phrase: "固定為替レート" }],
          },
          {
            subject: "譲渡・共有不可",
            body: "選手契約の譲渡・共有はできません。",
            highlights: [{ phrase: "譲渡・共有はできません" }],
          },
          {
            subject: "履行範囲",
            body: "選手契約は原則としてジャパンオープンポーカーツアー株式会社が指定する国内遠征費や海外トーナメントの参加費、渡航費などで履行いただけます。キャッシュゲームには使用できません。",
            highlights: [{ phrase: "キャッシュゲームには使用できません" }],
          },
          {
            subject: "当日中の手続き",
            body: "選手契約は、プライズカードに記載の手続きを当日中にお願いいたします。",
            highlights: [{ phrase: "当日中" }],
          },
          {
            subject: "不正発覚時の措置",
            body: "公正なトーナメント競技に影響がある不正等が発覚した場合、選手契約の取消、順位繰り上げを行う場合があります。",
            highlights: [{ phrase: "選手契約の取消" }, { phrase: "順位繰り上げ" }],
          },
          {
            subject: "身分証提示",
            body: "選手契約時に顔写真付き身分証のご提示をお願いします。",
            highlights: [{ phrase: "顔写真付き身分証" }],
          },
          {
            subject: "入賞者本人のみ",
            body: "選手契約の手続きは入賞者本人のみが可能です。",
            highlights: [{ phrase: "入賞者本人のみ" }],
          },
          {
            subject: "Team イベントの扱い",
            body: "全ての Team イベントでは、各メンバーがそれぞれ個人として選手契約の対象となります。",
            highlights: [{ phrase: "各メンバーがそれぞれ個人として" }],
          },
        ],
      },
      {
        type: "email-link",
        prefix: "その他不明点につきましては、ジャパンオープンポーカーツアー株式会社（",
        email: "customer@japanopenpoker.com",
        suffix: "）にお問い合わせをお願いいたします。",
      },
    ],
  },
];

const en: RuleSection[] = [
  {
    id: "house-rule",
    iconKey: "book",
    title: "House Rule",
    blocks: [
      {
        type: "paragraph",
        text: "This event is operated based on the TDA Rules 2024, but house rules and the Tournament Director's decisions take final precedence.",
        highlights: [{ phrase: "TDA Rules 2024" }, { phrase: "Tournament Director's decisions take final precedence" }],
      },
      {
        type: "paragraph",
        text: "If you believe an issue has occurred during a hand, please raise it before the next hand begins.",
      },
      {
        type: "paragraph",
        text: "The base ruleset is the JOPT Official Rule.",
        highlights: [{ phrase: "JOPT Official Rule" }],
      },
    ],
  },
  {
    id: "age",
    iconKey: "shield-alert",
    title: "Age Restriction",
    blocks: [
      {
        type: "callout",
        tone: "warning",
        text: "Players under 18 years of age may not participate in any tournament at this event.",
      },
      {
        type: "paragraph",
        text: "From the standpoint of sound operation and legal compliance, players under 18 years of age may not participate in any tournament at this event.",
      },
      {
        type: "paragraph",
        text: "If a player under 18 is found to be participating, their entry will be invalidated immediately at the time of discovery.",
        highlights: [{ phrase: "entry will be invalidated" }],
      },
    ],
  },
  {
    id: "deal",
    iconKey: "handshake",
    title: "Deal Making",
    blocks: [
      {
        type: "callout",
        tone: "info",
        text: 'Deals are allowed only when "the table has reached the Final Table AND prize money is locked." Satellites are excluded.',
      },
      {
        type: "paragraph",
        text: "ICM-based deals may be made in all tournaments except satellites.",
        highlights: [{ phrase: "except satellites" }, { phrase: "ICM-based deals" }],
      },
      {
        type: "paragraph",
        text: "A deal is permitted only when the Final Table has been reached AND prize money is guaranteed. A portion of the prize money and the trophy are awarded to the eventual winner.",
        highlights: [{ phrase: "Final Table" }, { phrase: "prize money is guaranteed" }, { phrase: "trophy are awarded to the eventual winner" }],
      },
      {
        type: "paragraph",
        text: "For details, please consult the floor staff.",
      },
    ],
  },
  {
    id: "contract",
    iconKey: "file-signature",
    title: "Player Contract",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            subject: "Contract Offer",
            body: "Top finishers will be offered a Player Contract (Service Agreement) with Japan Open Poker Tour Co., Ltd. as the prize. The purpose of this contract is to promote the company and foster healthy growth of the game; under the contract, the company covers expenses such as domestic travel costs, overseas tournament entry fees, and travel expenses as a service fee. The contract is optional. To enter into it, the procedure must be completed at the venue on the same day. For details, please refer to the \"Prize (Player Contract)\" page on the JOPT website.",
            highlights: [{ phrase: "Player Contract (Service Agreement)" }, { phrase: "optional" }, { phrase: "completed at the venue on the same day" }],
          },
          {
            subject: "Prize Currency",
            body: "Prize amounts are listed in U.S. dollars, calculated using a pre-determined exchange rate.",
            highlights: [{ phrase: "U.S. dollars" }],
          },
          {
            subject: "Exchange Rate Determination",
            body: "A fixed exchange rate, announced 3 days before the event, will be used to recalculate and determine the U.S. dollar amount.",
            highlights: [{ phrase: "3 days before the event" }, { phrase: "fixed exchange rate" }],
          },
          {
            subject: "No Transfer or Sharing",
            body: "Player Contracts may not be transferred or shared.",
            highlights: [{ phrase: "may not be transferred or shared" }],
          },
          {
            subject: "Scope of Use",
            body: "As a rule, the Player Contract may be used only for domestic travel costs, overseas tournament entry fees, travel expenses, and similar items as designated by Japan Open Poker Tour Co., Ltd. It cannot be used for cash games.",
            highlights: [{ phrase: "cannot be used for cash games" }],
          },
          {
            subject: "Same-Day Procedure",
            body: "The application procedure described on the prize card must be completed on the same day.",
            highlights: [{ phrase: "same day" }],
          },
          {
            subject: "Action on Misconduct",
            body: "If misconduct affecting fair tournament play is discovered, the Player Contract may be revoked and rankings may be re-ordered.",
            highlights: [{ phrase: "contract may be revoked" }, { phrase: "rankings may be re-ordered" }],
          },
          {
            subject: "ID Verification",
            body: "Photo identification will be required when signing the Player Contract.",
            highlights: [{ phrase: "Photo identification" }],
          },
          {
            subject: "Winner Only",
            body: "The Player Contract procedure may be completed only by the winning player in person.",
            highlights: [{ phrase: "the winning player in person" }],
          },
          {
            subject: "Team Events",
            body: "In all Team events, each member is treated as an individual subject to the Player Contract.",
            highlights: [{ phrase: "each member is treated as an individual" }],
          },
        ],
      },
      {
        type: "email-link",
        prefix: "For any other questions, please contact Japan Open Poker Tour Co., Ltd. at ",
        email: "customer@japanopenpoker.com",
        suffix: ".",
      },
    ],
  },
];

const ko: RuleSection[] = [
  {
    id: "house-rule",
    iconKey: "book",
    title: "House Rule / 하우스 룰",
    blocks: [
      {
        type: "paragraph",
        text: "본 이벤트는 TDA 룰 2024에 따라 토너먼트를 운영하지만, 하우스 룰 및 TD(토너먼트 디렉터)의 의사결정이 최종 판단이 됩니다.",
        highlights: [{ phrase: "TDA 룰 2024" }, { phrase: "TD(토너먼트 디렉터)의 의사결정이 최종 판단" }],
      },
      {
        type: "paragraph",
        text: "게임에 문제가 발생했다고 판단되는 경우, 다음 게임이 시작되기 전까지 신고해 주십시오.",
      },
      {
        type: "paragraph",
        text: "기본 룰은 JOPT Official Rule을 채택합니다.",
        highlights: [{ phrase: "JOPT Official Rule" }],
      },
    ],
  },
  {
    id: "age",
    iconKey: "shield-alert",
    title: "연령 제한",
    blocks: [
      {
        type: "callout",
        tone: "warning",
        text: "만 18세 미만은 본 이벤트의 모든 토너먼트에 참가할 수 없습니다.",
      },
      {
        type: "paragraph",
        text: "본 이벤트에서는 건전한 운영과 법령 준수의 관점에서, 만 18세 미만은 모든 토너먼트에 참가하실 수 없습니다.",
      },
      {
        type: "paragraph",
        text: "또한 만 18세 미만의 참가가 발견된 경우, 그 시점에서 엔트리를 무효 처리합니다.",
        highlights: [{ phrase: "엔트리를 무효 처리" }],
      },
    ],
  },
  {
    id: "deal",
    iconKey: "handshake",
    title: "딜에 대하여",
    blocks: [
      {
        type: "callout",
        tone: "info",
        text: "딜은 「파이널 테이블에 도달했고 프라이즈 획득이 확정된 경우」에만 가능합니다. 새틀라이트는 대상에서 제외됩니다.",
      },
      {
        type: "paragraph",
        text: "새틀라이트를 제외한 모든 토너먼트에서 ICM 계산에 기반한 딜이 가능합니다.",
        highlights: [{ phrase: "새틀라이트를 제외" }, { phrase: "ICM 계산" }],
      },
      {
        type: "paragraph",
        text: "딜은 파이널 테이블에 도달하고 프라이즈 획득이 확정된 경우에만 가능하며, 프라이즈의 일부 및 트로피는 우승자가 획득합니다.",
        highlights: [{ phrase: "파이널 테이블" }, { phrase: "프라이즈 획득이 확정" }, { phrase: "트로피는 우승자" }],
      },
      {
        type: "paragraph",
        text: "자세한 내용은 플로어 스태프에게 문의해 주십시오.",
      },
    ],
  },
  {
    id: "contract",
    iconKey: "file-signature",
    title: "선수 계약에 대하여",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            subject: "선수 계약 오퍼",
            body: "상위 입상자에게는 프라이즈로서 재팬 오픈 포커 투어 주식회사와의 선수 계약(업무 위탁 계약)을 오퍼합니다. 본 계약은 당사의 프로모션 및 건전한 보급을 목적으로, 국내 원정비, 해외 토너먼트 참가비, 도항비 등의 경비를 위탁료로서 재팬 오픈 포커 투어 주식회사가 부담하는 것입니다. 본 계약은 임의이며, 계약 시에는 행사장에서 당일 중에 계약 절차를 진행해 주셔야 합니다. 자세한 내용은 JOPT 웹페이지 「프라이즈(선수 계약)에 대하여」를 참조해 주십시오.",
            highlights: [{ phrase: "선수 계약(업무 위탁 계약)" }, { phrase: "임의" }, { phrase: "당일 중에 계약 절차" }],
          },
          {
            subject: "프라이즈 표기 통화",
            body: "사전에 결정된 환율로 계산한 미국 달러 금액을 프라이즈로 표기하고 있습니다.",
            highlights: [{ phrase: "미국 달러 금액" }],
          },
          {
            subject: "환율 결정",
            body: "실시일 3일 전에 발표하는 고정 환율로 재계산하여 미국 달러 금액을 결정합니다.",
            highlights: [{ phrase: "실시일 3일 전" }, { phrase: "고정 환율" }],
          },
          {
            subject: "양도 · 공유 불가",
            body: "선수 계약의 양도 및 공유는 불가합니다.",
            highlights: [{ phrase: "양도 및 공유는 불가" }],
          },
          {
            subject: "이행 범위",
            body: "선수 계약은 원칙적으로 재팬 오픈 포커 투어 주식회사가 지정하는 국내 원정비, 해외 토너먼트 참가비, 도항비 등으로 이행하실 수 있습니다. 캐시 게임에는 사용하실 수 없습니다.",
            highlights: [{ phrase: "캐시 게임에는 사용하실 수 없습니다" }],
          },
          {
            subject: "당일 중 수속",
            body: "선수 계약은 프라이즈 카드에 기재된 절차를 당일 중에 진행해 주십시오.",
            highlights: [{ phrase: "당일 중" }],
          },
          {
            subject: "부정 발각 시 조치",
            body: "공정한 토너먼트 경기에 영향을 미치는 부정 행위 등이 발각된 경우, 선수 계약의 취소 및 순위 조정이 이루어질 수 있습니다.",
            highlights: [{ phrase: "선수 계약의 취소" }, { phrase: "순위 조정" }],
          },
          {
            subject: "신분증 제시",
            body: "선수 계약 시 사진이 부착된 신분증을 제시해 주시기 바랍니다.",
            highlights: [{ phrase: "사진이 부착된 신분증" }],
          },
          {
            subject: "수상자 본인만",
            body: "선수 계약 절차는 수상자 본인만이 진행하실 수 있습니다.",
            highlights: [{ phrase: "수상자 본인만" }],
          },
          {
            subject: "팀 이벤트의 처리",
            body: "모든 Team 이벤트에서는 각 멤버가 각자 개인으로서 선수 계약의 대상이 됩니다.",
            highlights: [{ phrase: "각 멤버가 각자 개인으로서" }],
          },
        ],
      },
      {
        type: "email-link",
        prefix: "기타 불명확한 사항이 있으시면 재팬 오픈 포커 투어 주식회사（",
        email: "customer@japanopenpoker.com",
        suffix: "）로 문의 주시기 바랍니다.",
      },
    ],
  },
];

export const rulesContent: Record<RuleLocale, RuleSection[]> = {
  ja,
  en,
  ko,
};
