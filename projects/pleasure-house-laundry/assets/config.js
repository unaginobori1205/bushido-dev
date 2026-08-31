/* =========================================================
   プレジャーハウス コインランドリー集客システム 共通設定
   ---------------------------------------------------------
   ■ API_URL
     Google Apps Script のウェブアプリ URL（.../exec）を貼り付けます。
     空のままでも動作します（ブラウザのローカル保存＝デモモード）。
   ■ ADMIN_TOKEN
     管理画面から GAS を呼ぶときの合言葉。gas/Code.gs の TOKEN と揃える。
   ■ FORM_BASE_URL
     ポスターの QR コードが指す診断ページの URL（公開後のURLに置き換え）。
   ========================================================= */
window.PH_CONFIG = {
  API_URL: "",
  ADMIN_TOKEN: "pleasure-house-2026",
  FORM_BASE_URL: location.origin + location.pathname.replace(/[^/]*$/, "") + "index.html",
  COMPANY: {
    name: "株式会社プレジャーハウス",
    tel: "052-228-6565",
    address: "愛知県名古屋市中区錦3-23-18 ニューサカエビル6階",
    works: "約7,000件",
    review: "4.8"
  },
  /* 掲示先のコインランドリー店舗マスタ（自由に追加してください） */
  STORES: [
    { code: "sakae",    name: "コインランドリー栄店" },
    { code: "chikusa",  name: "コインランドリー千種店" },
    { code: "nakagawa", name: "コインランドリー中川店" },
    { code: "kasugai",  name: "コインランドリー春日井店" },
    { code: "toyota",   name: "コインランドリー豊田店" }
  ],
  STATUSES: ["新規", "連絡済", "アポ設定", "訪問/点検済", "提案中", "成約", "見送り"]
};

/* ---- 共通ユーティリティ ---- */
window.PH = {
  cfg: window.PH_CONFIG,
  isDemo() { return !window.PH_CONFIG.API_URL; },
  storeName(code) {
    const s = window.PH_CONFIG.STORES.find(v => v.code === code);
    return s ? s.name : (code || "不明");
  },
  /* GAS へ送信（プリフライトを避けるため text/plain で POST） */
  async post(payload) {
    if (this.isDemo()) return this.localSave(payload);
    const res = await fetch(window.PH_CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async get(params) {
    if (this.isDemo()) return this.localList(params);
    const q = new URLSearchParams(params).toString();
    const res = await fetch(window.PH_CONFIG.API_URL + "?" + q);
    return res.json();
  },
  /* ---- デモモード（localStorage）---- */
  LS_KEY: "ph_leads",
  localAll() {
    try { return JSON.parse(localStorage.getItem(this.LS_KEY) || "[]"); }
    catch (e) { return []; }
  },
  localSave(payload) {
    if (payload.action === "update") {
      const rows = this.localAll();
      const row = rows.find(r => r.id === payload.id);
      if (row) { Object.assign(row, payload.patch); row.updatedAt = new Date().toISOString(); }
      localStorage.setItem(this.LS_KEY, JSON.stringify(rows));
      return { ok: true, demo: true };
    }
    const rows = this.localAll();
    const row = Object.assign({
      id: "L" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,5).toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "新規",
      memo: ""
    }, payload.data);
    rows.unshift(row);
    localStorage.setItem(this.LS_KEY, JSON.stringify(rows));
    return { ok: true, id: row.id, demo: true };
  },
  localList() { return { ok: true, demo: true, rows: this.localAll() }; }
};
