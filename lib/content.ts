/**
 * Central bilingual content dictionary for the BUSHIDO AI marketing site.
 *
 * English is the source of truth (native-quality, investor-grade copy).
 * Japanese mirrors the key sections per the brand brief. Every consumer of
 * this file reads `content[lang]`, so adding/adjusting copy never touches the
 * components.
 *
 * TODO(content): When the deck copy is finalised, sync any wording changes here.
 */

export type Lang = "en" | "ja";

export const LANGS: Lang[] = ["en", "ja"];

export interface Cta {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
  note?: string;
}

export interface Step {
  index: string;
  title: string;
  body: string;
}

export interface ExperienceCard {
  /** Stable key, also used to resolve the placeholder image slot. */
  key: string;
  name: string;
  line: string;
  region: string;
  languages: string;
  master: string;
}

export interface Pillar {
  title: string;
  body: string;
}

export interface AudienceBlock {
  title: string;
  value: string;
  cta: string;
  /** Optional image slot key — renders a photo header on that card. */
  slot?: string;
}

export interface TimelineItem {
  date: string;
  title: string;
  body: string;
}

export interface AiAgent {
  /** Stable key, also used to pick the agent's icon. */
  key: string;
  name: string;
  role: string;
  /** Short tagline shown on the card before it is expanded. */
  summary: string;
  /** The concrete tasks this AI "staff member" handles. */
  tasks: string[];
}

export interface SiteContent {
  nav: {
    links: { label: string; href: string }[];
    cta: string;
    langLabel: string;
  };
  hero: {
    eyebrow: string;
    h1: string;
    sub: string;
    ctas: { primary: Cta; secondary: Cta; tertiary: Cta };
    trust: string;
    imageCaption: string;
  };
  socialProof: {
    label: string;
    partners: { name: string; tag?: string }[];
  };
  problem: {
    eyebrow: string;
    h2: string;
    body: string;
    stats: Stat[];
    source: string;
  };
  how: {
    eyebrow: string;
    h2: string;
    tagline: string;
    steps: Step[];
  };
  aiTeam: {
    eyebrow: string;
    h2: string;
    intro: string;
    hint: string;
    tasksLabel: string;
    agents: AiAgent[];
  };
  experiences: {
    eyebrow: string;
    h2: string;
    intro: string;
    verified: string;
    cards: ExperienceCard[];
    regionLabel: string;
    langLabel: string;
  };
  why: {
    eyebrow: string;
    h2: string;
    intro: string;
    pillars: Pillar[];
  };
  forWhom: {
    eyebrow: string;
    h2: string;
    blocks: AudienceBlock[];
  };
  traction: {
    eyebrow: string;
    h2: string;
    intro: string;
    items: TimelineItem[];
  };
  vision: {
    eyebrow: string;
    h2: string;
    statement: string;
    founderName: string;
    founderRole: string;
    founderStory: string[];
    photoCaption: string;
  };
  planner: {
    eyebrow: string;
    h2: string;
    sub: string;
    fields: {
      interests: string;
      interestsOptions: string[];
      dates: string;
      party: string;
      partyOptions: string[];
      email: string;
      emailPlaceholder: string;
      audience: string;
      audienceOptions: string[];
    };
    submit: string;
    submitting: string;
    success: {
      title: string;
      body: string;
    };
    error: string;
    privacy: string;
  };
  footer: {
    legal: string;
    location: string;
    singapore: string;
    email: string;
    rights: string;
    nav: string;
    social: string;
  };
}

const en: SiteContent = {
  nav: {
    links: [
      { label: "Problem", href: "#problem" },
      { label: "How it works", href: "#how" },
      { label: "AI Team", href: "#ai-team" },
      { label: "Experiences", href: "#experiences" },
      { label: "Why BUSHIDO", href: "#why" },
      { label: "Traction", href: "#traction" },
      { label: "Founder", href: "#vision" },
    ],
    cta: "Plan my journey",
    langLabel: "日本語",
  },
  hero: {
    eyebrow: "AI Cultural Intelligence Platform",
    h1: "The Cultural Intelligence Platform for Authentic Japan",
    sub: "BUSHIDO AI uses AI and a verified network of local masters to match global travelers, schools, and premium clients with authentic Japanese cultural experiences — orchestrating masters, interpreters, travel, and itinerary into one trusted layer.",
    ctas: {
      primary: { label: "Plan my journey with AI", href: "#planner" },
      secondary: { label: "Partner with us", href: "#for-whom" },
      tertiary: { label: "For investors", href: "#traction" },
    },
    trust: "Powered by AI · Verified local masters · From Nagoya to all of Japan",
    imageCaption: "Kyudo — the way of the bow",
  },
  socialProof: {
    label: "Network & affiliations",
    partners: [
      { name: "Nagoya Inbound Summit" },
      { name: "Nihon Ryoko", tag: "In discussion" },
      { name: "Premium Hotels" },
      { name: "Local Government" },
      { name: "Media Partners" },
    ],
  },
  problem: {
    eyebrow: "The problem",
    h2: "Authentic Japan is locked away.",
    body: "Japan welcomed a record 42.7M visitors in 2025, yet most only see the surface. Kyudo, tea ceremony, calligraphy, Zen, and the wisdom of local masters stay fragmented and locked behind language, payment, and trust barriers.",
    stats: [
      { value: "42.7M", label: "Visitors", note: "2025" },
      { value: "¥9.5T", label: "Visitor spending", note: "2025" },
      { value: "60M / ¥15T", label: "Government target", note: "by 2030" },
    ],
    source: "Source: JNTO / Japan Tourism Agency",
  },
  how: {
    eyebrow: "How it works",
    h2: "One intent in. A trusted journey out.",
    tagline: "Not a tour agency. A cultural experience OS.",
    steps: [
      {
        index: "01",
        title: "Tell us your intent",
        body: "Share your purpose, interest, budget, location, language, and learning goal. The richer the intent, the deeper the match.",
      },
      {
        index: "02",
        title: "AI designs your journey",
        body: "Our engine matches verified masters with the right interpreter, transport, and itinerary — assembled into a single coherent plan.",
      },
      {
        index: "03",
        title: "Experience trusted, authentic Japan",
        body: "Quality-assured and orchestrated end-to-end, so you step straight into the real thing — nothing lost in translation.",
      },
    ],
  },
  aiTeam: {
    eyebrow: "Our AI team",
    h2: "Meet the AI staff behind every journey.",
    intro: "BUSHIDO AI runs on a team of specialised AI agents. Each one owns a part of the journey — working alongside our human trust network. Select a member to see what they handle.",
    hint: "Click a member to see their responsibilities",
    tasksLabel: "Responsibilities",
    agents: [
      {
        key: "designer",
        name: "AI Journey Designer",
        role: "Itinerary architect",
        summary: "Turns your intent into a coherent, day-by-day journey.",
        tasks: [
          "Interprets your purpose, interests, budget, and learning goals",
          "Builds an optimally paced day-by-day itinerary",
          "Balances depth, travel time, and rest",
          "Adapts the plan instantly as your preferences change",
        ],
      },
      {
        key: "matcher",
        name: "AI Master Matcher",
        role: "Talent & trust matching",
        summary: "Pairs you with the right verified master.",
        tasks: [
          "Scores master fit by craft, region, level, and language",
          "Checks real-time availability and capacity",
          "Confirms each master's verified status in the network",
          "Proposes alternatives that protect authenticity",
        ],
      },
      {
        key: "bridge",
        name: "AI Culture & Interpreter Bridge",
        role: "Language & cultural mediation",
        summary: "Makes sure nothing is lost in translation.",
        tasks: [
          "Assigns the right interpreter for the experience",
          "Prepares cultural-context briefings for both sides",
          "Provides real-time translation support on the day",
          "Explains etiquette so guests feel confident, not lost",
        ],
      },
      {
        key: "logistics",
        name: "AI Logistics Orchestrator",
        role: "Transport & scheduling",
        summary: "Keeps every moving part in sync.",
        tasks: [
          "Coordinates transport between venues and masters",
          "Sequences reservations, timing, and buffers",
          "Handles changes and last-minute contingencies",
          "Optimises routes across Nagoya and beyond",
        ],
      },
      {
        key: "guardian",
        name: "AI Trust & Quality Guardian",
        role: "Quality assurance",
        summary: "Protects authenticity and safety end-to-end.",
        tasks: [
          "Verifies partners and monitors quality feedback",
          "Flags risks before they reach the guest",
          "Maintains standards across every experience",
          "Closes the loop with post-experience review",
        ],
      },
      {
        key: "concierge",
        name: "AI Concierge",
        role: "24/7 guest support",
        summary: "Always on, in your language.",
        tasks: [
          "Answers questions any time, before and during the trip",
          "Handles itinerary changes and special requests",
          "Provides multilingual, always-on support",
          "Escalates to a human partner the moment it matters",
        ],
      },
    ],
  },
  experiences: {
    eyebrow: "The inventory",
    h2: "Depth our AI can assemble.",
    intro: "These aren't products in a checkout. They are the verified, quality-assured experiences our platform composes into a single journey.",
    verified: "Verified Master",
    regionLabel: "Region",
    langLabel: "Languages",
    cards: [
      {
        key: "kyudo",
        name: "Kyudo",
        line: "The way of the bow — discipline, breath, and stillness.",
        region: "Nagoya / Aichi",
        languages: "EN · JP",
        master: "Verified Master",
      },
      {
        key: "tea",
        name: "Tea Ceremony",
        line: "Chado — hospitality refined into a single bowl of tea.",
        region: "Kyoto / Aichi",
        languages: "EN · JP",
        master: "Verified Master",
      },
      {
        key: "calligraphy",
        name: "Calligraphy",
        line: "Shodo — the brush as a record of a single breath.",
        region: "Nagoya / Aichi",
        languages: "EN · JP",
        master: "Verified Master",
      },
      {
        key: "zen",
        name: "Zen",
        line: "Zazen and the architecture of a quiet mind.",
        region: "Multiple",
        languages: "EN · JP",
        master: "Verified Master",
      },
      {
        key: "shrine",
        name: "Shrine Culture",
        line: "Shinto rites, ritual, and the living sacred landscape.",
        region: "Multiple",
        languages: "EN · JP",
        master: "Verified Master",
      },
    ],
  },
  why: {
    eyebrow: "Our moat",
    h2: "Why BUSHIDO AI wins.",
    intro: "A generic OTA or a pure-AI app can copy a booking flow. They cannot copy a founder who is an insider, or a trust network built one relationship at a time.",
    pillars: [
      {
        title: "Authentic insider",
        body: "Our founder is a lifelong kyudo practitioner and calligrapher. We speak the language of the masters — culturally, not just literally.",
      },
      {
        title: "Verified trust network",
        body: "Built relationship-by-relationship through JC, BNI, and the Nagoya Inbound Summit. Every master is vouched for, not scraped.",
      },
      {
        title: "AI + human trust",
        body: "AI scales the matching and orchestration; human trust guarantees authenticity. The combination is a moat neither a generic OTA nor a pure-AI tool can reproduce.",
      },
    ],
  },
  forWhom: {
    eyebrow: "For whom",
    h2: "Built for those who want the real Japan.",
    blocks: [
      {
        title: "Travelers & VIP",
        value: "A personalised, deeply authentic journey — orchestrated end-to-end, with interpreters and logistics handled.",
        cta: "Plan my journey",
      },
      {
        title: "Schools",
        value: "Immersive cultural & educational programs that bring Japan's living traditions into the curriculum.",
        cta: "Design a program",
      },
      {
        title: "Corporates",
        value: "Bushido and culture-based leadership training — discipline, focus, and presence, taught by real masters.",
        cta: "Explore training",
        slot: "samurai",
      },
      {
        title: "Masters & Regional Partners",
        value: "Reach the world without losing authenticity. We handle language, payment, and trust so you can focus on your craft.",
        cta: "Join the network",
      },
    ],
  },
  traction: {
    eyebrow: "Traction",
    h2: "Momentum on the ground.",
    intro: "Real experiences delivered, real partners in motion — not slideware.",
    items: [
      {
        date: "Apr 2026",
        title: "Nagoya Inbound Summit",
        body: "Founded and held the inaugural summit — convening masters, hotels, government, and inbound operators.",
      },
      {
        date: "Live",
        title: "Experiences delivered",
        body: "Kyudo, tea ceremony, and calligraphy experiences already delivered to international guests.",
      },
      {
        date: "In discussion",
        title: "Nihon Ryoko",
        body: "Active business talks with a major Japanese travel company on distribution.",
      },
      {
        date: "Ongoing",
        title: "Hotel, government & agency relationships",
        body: "Building the trust network across premium hotels, local government, and travel agencies.",
      },
    ],
  },
  vision: {
    eyebrow: "Vision & founder",
    h2: "Delivering the spirit of Japan to the world.",
    statement:
      "We're building the infrastructure that delivers the spirit of Japanese culture to the world.",
    founderName: "Kensuke Ueoka",
    founderRole: "Founder & CEO · Kyudo practitioner & calligrapher",
    founderStory: [
      "Kensuke Ueoka has practiced kyudo — the way of the bow — and calligraphy since childhood. Japanese culture is not a product to him; it is a lived discipline.",
      "He founded the Nagoya Inbound Summit to connect masters, hosts, and the world. BUSHIDO AI is the natural next step: turning a lifetime inside the culture into infrastructure that carries its spirit beyond Japan's borders.",
    ],
    photoCaption: "Kensuke Ueoka, Founder & CEO",
  },
  planner: {
    eyebrow: "AI Journey Planner",
    h2: "Get your AI-personalised Japan itinerary.",
    sub: "Tell us a little about your intent. Join the beta and we'll craft a journey matched to verified masters.",
    fields: {
      interests: "What draws you to Japan?",
      interestsOptions: [
        "Kyudo",
        "Tea Ceremony",
        "Calligraphy",
        "Zen",
        "Shrine Culture",
      ],
      dates: "When are you thinking of traveling?",
      party: "Party size",
      partyOptions: ["Just me", "2 people", "3–5 people", "6+ / group"],
      email: "Email",
      emailPlaceholder: "you@example.com",
      audience: "I am a…",
      audienceOptions: [
        "Traveler / VIP",
        "School",
        "Corporate",
        "Master / Partner",
        "Investor / Press",
      ],
    },
    submit: "Get my AI-personalized Japan itinerary — join the beta",
    submitting: "Sending…",
    success: {
      title: "You're on the list.",
      body: "Thank you. We've received your intent and will reach out as we open the beta. Watch your inbox.",
    },
    error: "Something went wrong. Please try again, or email ken.pp.1205@gmail.com.",
    privacy:
      "We use your details only to design your journey and contact you about the beta. No spam.",
  },
  footer: {
    legal: "BUSHIDO LLC (合同会社BUSHIDO)",
    location: "Nagoya, Japan",
    singapore: "Singapore entity (planned)",
    email: "ken.pp.1205@gmail.com",
    rights: "All rights reserved.",
    nav: "Navigate",
    social: "Connect",
  },
};

const ja: SiteContent = {
  nav: {
    links: [
      { label: "課題", href: "#problem" },
      { label: "仕組み", href: "#how" },
      { label: "AIチーム", href: "#ai-team" },
      { label: "体験", href: "#experiences" },
      { label: "強み", href: "#why" },
      { label: "実績", href: "#traction" },
      { label: "創業者", href: "#vision" },
    ],
    cta: "旅を計画する",
    langLabel: "EN",
  },
  hero: {
    eyebrow: "AI文化体験インテリジェンス・プラットフォーム",
    h1: "本物の日本を、AIで。— 文化体験インテリジェンス・プラットフォーム",
    sub: "BUSHIDO AIは、AIと“検証済みの達人ネットワーク”で、海外旅行者・教育機関・VIPを本物の日本文化体験につなぎ、達人・通訳・移動・行程を一つの信頼レイヤーに統合します。",
    ctas: {
      primary: { label: "AIで旅を計画する", href: "#planner" },
      secondary: { label: "パートナーになる", href: "#for-whom" },
      tertiary: { label: "投資家の方へ", href: "#traction" },
    },
    trust: "AIによる設計 ・ 検証済みの達人 ・ 名古屋から日本全国へ",
    imageCaption: "弓道 — 弓の道",
  },
  socialProof: {
    label: "ネットワークと提携",
    partners: [
      { name: "名古屋インバウンドサミット" },
      { name: "日本旅行", tag: "協議中" },
      { name: "プレミアムホテル" },
      { name: "自治体" },
      { name: "メディアパートナー" },
    ],
  },
  problem: {
    eyebrow: "課題",
    h2: "本物の日本は、閉ざされている。",
    body: "2025年、日本は過去最高の4,270万人の訪日客を迎えました。しかし多くの人は表面しか見ていません。弓道、茶道、書道、禅、そして地域の達人の知恵は、言語・決済・信頼の壁の向こうに分断されたまま閉ざされています。",
    stats: [
      { value: "4,270万人", label: "訪日客", note: "2025年" },
      { value: "9.5兆円", label: "消費額", note: "2025年" },
      { value: "6,000万人 / 15兆円", label: "政府目標", note: "2030年" },
    ],
    source: "出典:JNTO / 観光庁",
  },
  how: {
    eyebrow: "仕組み",
    h2: "意図を一つ。信頼できる旅が一つ。",
    tagline: "観光会社ではない。文化体験のOSだ。",
    steps: [
      {
        index: "01",
        title: "あなたの意図を伝える",
        body: "目的・興味・予算・場所・言語・学びの目標を共有してください。意図が豊かなほど、マッチングは深くなります。",
      },
      {
        index: "02",
        title: "AIが旅を設計する",
        body: "検証済みの達人を、最適な通訳・移動・行程と組み合わせ、一つの一貫した旅へと統合します。",
      },
      {
        index: "03",
        title: "信頼できる本物の日本を体験する",
        body: "品質を保証し、端から端までオーケストレーション。翻訳で失われるものなく、本物へ直接踏み込めます。",
      },
    ],
  },
  aiTeam: {
    eyebrow: "私たちのAIチーム",
    h2: "すべての旅を支えるAI社員たち。",
    intro: "BUSHIDO AIは、専門特化したAIエージェントのチームで動いています。それぞれが旅の一部を担当し、人の信頼ネットワークと協働します。メンバーを選ぶと、担当業務が表示されます。",
    hint: "メンバーをクリックすると担当業務が表示されます",
    tasksLabel: "担当業務",
    agents: [
      {
        key: "designer",
        name: "AIジャーニーデザイナー",
        role: "行程の設計者",
        summary: "あなたの意図を、一貫した日程の旅へと変換します。",
        tasks: [
          "目的・興味・予算・学びの目標を読み解く",
          "最適なペースの日程を一日単位で設計",
          "深さ・移動時間・休息のバランスを調整",
          "ご希望の変化に応じて即座にプランを再構成",
        ],
      },
      {
        key: "matcher",
        name: "AIマスターマッチング",
        role: "人材と信頼のマッチング",
        summary: "最適な検証済みの達人とつなぎます。",
        tasks: [
          "技・地域・レベル・言語で達人の適合度を採点",
          "リアルタイムの空き状況・受入可否を確認",
          "ネットワーク内の検証済みステータスを確認",
          "本物らしさを守る代替案を提案",
        ],
      },
      {
        key: "bridge",
        name: "AI文化・通訳ブリッジ",
        role: "言語と文化の橋渡し",
        summary: "翻訳で何も失われないようにします。",
        tasks: [
          "体験に最適な通訳をアサイン",
          "双方への文化的背景ブリーフィングを準備",
          "当日のリアルタイム通訳をサポート",
          "作法を解説し、ゲストが迷わず安心できるように",
        ],
      },
      {
        key: "logistics",
        name: "AIロジスティクス",
        role: "移動とスケジューリング",
        summary: "すべての可動部を同期させます。",
        tasks: [
          "会場と達人の間の移動を調整",
          "予約・時間・余裕の順序立て",
          "変更や直前の不測事態に対応",
          "名古屋および全国の動線を最適化",
        ],
      },
      {
        key: "guardian",
        name: "AI品質・信頼ガーディアン",
        role: "品質保証",
        summary: "本物らしさと安全を端から端まで守ります。",
        tasks: [
          "パートナーを検証し、品質フィードバックを監視",
          "ゲストに届く前にリスクを検知",
          "すべての体験で基準を維持",
          "体験後レビューでループを完結",
        ],
      },
      {
        key: "concierge",
        name: "AIコンシェルジュ",
        role: "24時間ゲストサポート",
        summary: "いつでも、あなたの言語で。",
        tasks: [
          "旅行前・旅行中いつでも質問に回答",
          "行程変更や特別なご要望に対応",
          "多言語・常時対応のサポート",
          "重要な場面では即座に人のパートナーへ引き継ぎ",
        ],
      },
    ],
  },
  experiences: {
    eyebrow: "インベントリ",
    h2: "AIが組み上げる深さ。",
    intro: "これらは決済画面の商品ではありません。プラットフォームが一つの旅へと構成する、検証済み・品質保証された体験です。",
    verified: "検証済みの達人",
    regionLabel: "地域",
    langLabel: "対応言語",
    cards: [
      {
        key: "kyudo",
        name: "弓道",
        line: "弓の道 — 規律、呼吸、そして静寂。",
        region: "名古屋 / 愛知",
        languages: "英 ・ 日",
        master: "検証済みの達人",
      },
      {
        key: "tea",
        name: "茶道",
        line: "一碗の茶に磨き上げられたもてなし。",
        region: "京都 / 愛知",
        languages: "英 ・ 日",
        master: "検証済みの達人",
      },
      {
        key: "calligraphy",
        name: "書道",
        line: "筆は、一息の記録である。",
        region: "名古屋 / 愛知",
        languages: "英 ・ 日",
        master: "検証済みの達人",
      },
      {
        key: "zen",
        name: "禅",
        line: "坐禅と、静かな心の構築。",
        region: "各地",
        languages: "英 ・ 日",
        master: "検証済みの達人",
      },
      {
        key: "shrine",
        name: "神社文化",
        line: "神道の儀礼と、生きた聖なる風景。",
        region: "各地",
        languages: "英 ・ 日",
        master: "検証済みの達人",
      },
    ],
  },
  why: {
    eyebrow: "私たちの堀",
    h2: "なぜBUSHIDO AIなのか。",
    intro: "一般的なOTAや純粋なAIアプリは予約フローを真似できます。しかし、文化の内側にいる創業者や、一つひとつ築いた信頼ネットワークは真似できません。",
    pillars: [
      {
        title: "本物のインサイダー",
        body: "創業者は生涯にわたる弓道家であり書家です。私たちは達人の言語を、文字どおりではなく文化として理解しています。",
      },
      {
        title: "検証済みの信頼ネットワーク",
        body: "JC、BNI、名古屋インバウンドサミットを通じ、関係を一つずつ築いてきました。すべての達人は保証された存在です。",
      },
      {
        title: "AI × 人の信頼",
        body: "AIがマッチングと統合をスケールし、人の信頼が本物であることを保証する。この組み合わせは、OTAにも純AIにも再現できない堀です。",
      },
    ],
  },
  forWhom: {
    eyebrow: "対象",
    h2: "本物の日本を求める人のために。",
    blocks: [
      {
        title: "旅行者 ・ VIP",
        value: "通訳と手配まで含め、端から端までオーケストレーションされた、深く本物の旅を。",
        cta: "旅を計画する",
      },
      {
        title: "教育機関",
        value: "日本の生きた伝統をカリキュラムに取り込む、没入型の文化・教育プログラム。",
        cta: "プログラムを設計",
      },
      {
        title: "企業",
        value: "武士道と文化に基づくリーダーシップ研修 — 規律、集中、所作を本物の達人が伝えます。",
        cta: "研修を見る",
        slot: "samurai",
      },
      {
        title: "達人 ・ 地域パートナー",
        value: "本物を失わず世界へ。言語・決済・信頼を私たちが担い、あなたは技に集中できます。",
        cta: "ネットワークに参加",
      },
    ],
  },
  traction: {
    eyebrow: "実績",
    h2: "現場で生まれている勢い。",
    intro: "提供済みの本物の体験、動いている本物のパートナー。スライドだけではありません。",
    items: [
      {
        date: "2026年4月",
        title: "名古屋インバウンドサミット",
        body: "第1回サミットを創設・開催。達人、ホテル、自治体、インバウンド事業者を結集しました。",
      },
      {
        date: "実施中",
        title: "提供済みの体験",
        body: "弓道、茶道、書道の体験を、すでに海外ゲストへ提供しています。",
      },
      {
        date: "協議中",
        title: "日本旅行",
        body: "大手旅行会社との流通に関する商談が進行中です。",
      },
      {
        date: "継続中",
        title: "ホテル・自治体・旅行会社との関係",
        body: "プレミアムホテル、自治体、旅行会社にわたる信頼ネットワークを構築中です。",
      },
    ],
  },
  vision: {
    eyebrow: "ビジョンと創業者",
    h2: "日本の精神を、世界へ。",
    statement: "日本の精神文化を世界に届けるインフラをつくる。",
    founderName: "上岡 賢介",
    founderRole: "創業者 兼 CEO ・ 弓道家 ・ 書家",
    founderStory: [
      "上岡賢介は、幼少期から弓道 — 弓の道 — と書道を実践してきました。彼にとって日本文化は商品ではなく、生きた規律です。",
      "彼は達人とホストと世界を結ぶため、名古屋インバウンドサミットを創設しました。BUSHIDO AIはその自然な次の一歩 — 文化の内側で過ごした生涯を、その精神を国境の外へ運ぶインフラへと変えるものです。",
    ],
    photoCaption: "上岡 賢介 — 創業者 兼 CEO",
  },
  planner: {
    eyebrow: "AIジャーニープランナー",
    h2: "AIがパーソナライズする、あなたの日本の旅程を。",
    sub: "あなたの意図を少し教えてください。ベータに参加すると、検証済みの達人とマッチした旅を設計します。",
    fields: {
      interests: "何に惹かれていますか?",
      interestsOptions: ["弓道", "茶道", "書道", "禅", "神社文化"],
      dates: "いつ頃の旅をお考えですか?",
      party: "人数",
      partyOptions: ["1人", "2人", "3〜5人", "6人以上 / 団体"],
      email: "メールアドレス",
      emailPlaceholder: "you@example.com",
      audience: "あなたは…",
      audienceOptions: [
        "旅行者 / VIP",
        "教育機関",
        "企業",
        "達人 / パートナー",
        "投資家 / メディア",
      ],
    },
    submit: "AIパーソナライズ旅程を受け取る — ベータに参加",
    submitting: "送信中…",
    success: {
      title: "ご登録ありがとうございます。",
      body: "ご意図を受け取りました。ベータ公開の際にご連絡します。受信箱をご確認ください。",
    },
    error: "問題が発生しました。もう一度お試しいただくか、ken.pp.1205@gmail.com までご連絡ください。",
    privacy: "いただいた情報は旅の設計とベータのご連絡のみに使用します。スパムは送りません。",
  },
  footer: {
    legal: "合同会社BUSHIDO（BUSHIDO LLC）",
    location: "愛知県名古屋市",
    singapore: "シンガポール法人（予定）",
    email: "ken.pp.1205@gmail.com",
    rights: "All rights reserved.",
    nav: "ナビゲーション",
    social: "つながる",
  },
};

export const content: Record<Lang, SiteContent> = { en, ja };
