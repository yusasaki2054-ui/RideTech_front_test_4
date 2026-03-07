// Async Mart - 非同期処理テスト用スクリプト（素のJS）
// 学習目的：fetch + async/await を用いた GET / POST、並列取得、タイムアウト、状態切替の実装

// ===== ユーティリティ（そのまま使用可） =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// ===== ここから実装対象 =====
// タイムアウト付き fetch（AbortController を使って中断可能にする）
async function fetchJSON(url, { timeoutMs = 5000 } = {}) {
  // TODO: 実装者が書く
  // 実装ポイント：
  //  1) AbortController を生成し、setTimeout で timeoutMs 後に abort()
  const controller = new AbortController();
  //  2) fetch(url, { signal }) を await で呼ぶ
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ${res.status}');
    return await res.json(); 
  }finally {
    clearTimeout(id);
  }
  //  3) HTTP ステータスを判定し、200系以外は throw new Error('HTTP ' + res.status)
  //  4) res.json() を返す
  //  5) finally でタイマーを必ず clear する
}

// モック POST エンドポイント（/api/contact）
// 今回のテストではサーバは用意しないため、特定URLはモック動作でOK
async function postJSON(url, payload, { timeoutMs = 5000 } = {}) {
  // TODO: 実装者が書く
  // 実装ポイント：
  //  1) url が '/api/contact' で終わる場合のみモック動作にする
  //     - 適当な遅延（例：await new Promise(r => setTimeout(r, 800))）
  //     - payload.email に 'fail' が含まれる場合は throw new Error('サーバエラー…')
  //     - それ以外は { ok: true, message: '送信を受け付けました。' } を返す
  if (url.endsWith('/api/contact')) {
    await new Promise((r) => setTimeout(r, 800));
    if (String(payload.email || '').includes('fail')) {
      throw new Error('サーバエラー：送信できませんでした。');
      }
      return { ok: true, message: '送信を受け付けました。'};
  }
    //  2) それ以外の URL は通常の fetch で POST し、ステータス判定・タイムアウト処理を行う
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('HTTP ${res.status}');
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}


// ===== 状態管理（そのまま使用） =====
const dom = {
  status: $('#status'),
  loading: $('#loading'),
  error: $('#error'),
  empty: $('#empty'),
  retry: $('#retry'),
  list: $('#list'),
  modalRoot: $('#modal-root'),
  form: $('#contact-form'),
  result: $('#contact-result'),
};

function setStatus(msg) {
  dom.status.textContent = msg ?? '';
}
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function startLoading() {
  hide(dom.error); hide(dom.empty);
  show(dom.loading); setStatus('読み込み中…');
  dom.list.innerHTML = '';
}
function stopLoading() { hide(dom.loading); setStatus(''); }

function showError(message = 'エラーが発生しました。') {
  stopLoading(); show(dom.error);
  $('.notice-text', dom.error).textContent = message;
}
function showEmpty() { stopLoading(); show(dom.empty); }

function renderList(items) {
  stopLoading();
  if (!items || items.length === 0) { showEmpty(); return; }
  dom.list.innerHTML = items.map(toCardHTML).join('');
  // 「詳細」ボタンにイベント付与
  $$('.js-detail', dom.list).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.dataset.id);
      const product = items.find(p => p.id === id);
      if (product) openDetail(product);
    });
  });
}

function toCardHTML(p) {
  const price = new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY' }).format(p.price);
  return `
<li class="card">
  <div class="card-media">
    <img src="${p.image}" alt="${p.name}" width="320" height="200" />
  </div>
  <div class="card-body">
    <h3 class="card-title">${p.name}</h3>
    <p class="card-meta">${p.category} ／ 評価：${p.rating}</p>
    <p class="card-meta">価格：${price}</p>
    <div class="card-actions">
      <button class="btn btn-outline js-detail" type="button" data-id="${p.id}">詳細</button>
    </div>
  </div>
</li>
`.trim();
}

// ===== 詳細モーダル =====
async function openDetail(product) {
  document.body.classList.add('is-modal-open');
  dom.modalRoot.innerHTML = modalSkeleton(product);

  try {
    // TODO: 実装者が書く
    // 実装ポイント：
    //  1) reviews.json の取得を Promise.all で並列実行（将来の拡張を見据えた書き方）
    //     例）const [reviews] = await Promise.all([ fetchJSON('./data/reviews.json') ]);
    //  2) product.id で reviews をフィルタリング
    //  3) $('.modal-body', dom.modalRoot).innerHTML = detailHTML(product, list) で描画
    const [reviews] = await Promise.all([fetchJSON('./data/reviews.json')]);
    const list = (reviews || []).filter((r) => r.productld === product.id);
    $('.modal-body', dom.modalRoot).innerHTML = detailHTML(product, list);
  } catch (e) {
    $('.modal-body', dom.modalRoot).innerHTML = `<p class="notice-text">詳細の取得に失敗しました。</p>`;
  }

  // 閉じる
  $('.modal-close', dom.modalRoot).addEventListener('click', closeModal);
  $('.modal-backdrop', dom.modalRoot).addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
  window.addEventListener('keydown', onEscClose);
}

function modalSkeleton(p) {
  return `
<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal">
    <div class="modal-header">
      <h3 id="modal-title" class="modal-title">${p.name}</h3>
      <button class="modal-close" aria-label="閉じる" type="button">×</button>
    </div>
    <div class="modal-body">
      <p>読み込み中…</p>
    </div>
  </div>
</div>`;
}

function detailHTML(p, reviews) {
  const price = new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY' }).format(p.price);
  const revHTML = reviews.length
    ? `<ul>${reviews.map(r => `<li>★${r.stars} ${escapeHTML(r.author)}：${escapeHTML(r.comment)}</li>`).join('')}</ul>`
    : `<p>レビューはまだありません。</p>`;

  return `
  <figure>
    <img src="${p.image}" alt="${p.name}" width="640" height="400" />
    <figcaption class="card-meta">${p.category} ／ 評価：${p.rating} ／ 価格：${price}</figcaption>
  </figure>
  <div>
    <h4>商品説明</h4>
    <p>${escapeHTML(p.description || '説明は準備中です。')}</p>
  </div>
  <div>
    <h4>レビュー</h4>
    ${revHTML}
  </div>
  `;
}

function closeModal() {
  document.body.classList.remove('is-modal-open');
  dom.modalRoot.innerHTML = '';
  window.removeEventListener('keydown', onEscClose);
}
function onEscClose(e) { if (e.key === 'Escape') closeModal(); }

function escapeHTML(str='') {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[s]);
}

// ===== お問い合わせ（POST） =====
function handleContact() {
  dom.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    show(dom.result);
    dom.result.textContent = '送信中…';
    const form = new FormData(dom.form);
    const payload = {
      name: form.get('name')?.toString().trim(),
      email: form.get('email')?.toString().trim(),
      message: form.get('message')?.toString().trim(),
    };

    try {
      // TODO: 実装者が書く
      // 実装ポイント：
      //  1) postJSON('/api/contact', payload) を await
      //  2) 成功メッセージを表示し、フォームを reset()
      //  3) 例外時はキャッチしてユーザーに分かる文言で表示
      const res = await postJSON('/api/contact', payload);
      dom.result.textContent = res?.message || '送信しました。';
      dom.form.reset();
    } catch (err) {
      dom.result.textContent = String(err?.message || '送信に失敗しました。');
    }
  });
}

// ===== 初期化 =====
async function init() {
  dom.retry.addEventListener('click', loadProducts);
  handleContact();
  await loadProducts();
}

async function loadProducts() {
  startLoading();
  try {
    // TODO: 実装者が書く
    // 実装ポイント：
    //  1) fetchJSON('./data/products.json') を await
    //  2) renderList(products) を呼ぶ
    const products = await fetchJSON('./data/products.json');
    renderList(products);
  } catch (e) {
    showError('データの取得に失敗しました（' + (e?.message || 'Unknown') + '）');
  }
}

document.addEventListener('DOMContentLoaded', init);
