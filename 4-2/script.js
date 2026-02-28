(() => {
    const isMobile = () => window.innerWidth <= 768;

const hamburger = document.querySelector('.hamburger');
const globalNav = document.getElementById('global-nav');
const cleanMobileNav = () => {
    if (!isMobile()) {
        globalNav?.classList.remove('is-open');
        hamburger?.setAttribute('aria-expanded' , 'false');
    }
};
if (hamburger && globalNav) {
    hamburger .addEventListener('click' , () => {
        if(!isMobile()) return;
        const willOpen = !globalNav.classList.contains('is-open');
        globalNav.classList.toggle('is-open' , willOpen);
        hamburger.setAttribute('aria-expanded' , String(willOpen));
    });
    window.addEventListener('resize' , cleanMobileNav);
    window.addEventListener('orientationchange' , cleanMobileNav);
}


const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;
    question.setAttribute('role' , 'button');
    question.setAttribute('tabindex' , '0');
    question.addEventListener('click' , () => {
        item.classList.toggle('open');
    });
    question.addEventListener('keydown' , (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.classList.toggle('open');
        }
    });
});


const openModalBtn = document.getElementById('open-modal');
const demoModal = document.getElementById('demo-modal');

const createModal = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal';
    wrapper.setAttribute('role' , 'dialog');
    wrapper.setAttribute('aria-modal' , 'true');
    wrapper.setAttribute('aria-hidden' , 'false');
    wrapper.innerHTML = `
    <div class="modal-overlay" data-close="true"></div>
    <div class="modal-dialog" role="document">
      <button class="modal-close" type="button" aria-label="閉じる" data-close="true">×</button>
      <h3 class="modal-title">モーダルの見出し</h3>
      <div class="modal-content">
        <p>ここにモーダルの本文が入ります。背景スクロールは禁止されています。</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-close="true">OK</button>
        <button class="btn btn-outline" type="button" data-close="true">閉じる</button>
      </div>
    </div>`;
    return wrapper;
};

const openModal = () => {
    const modal = demoModal || createModal();
    if (!demoModal && !modal.isConnected) document.body.appendChild(modal);
    if (modal.classList.contains('is-open')) return;

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden' , 'true');
        openModalBtn?.setAttribute('aria-expanded' , 'false');
        document.body.classList.remove('modal-open');
        modal.removeEventListener('click' , onClick);
        document.removeEventListener('keydown' , onKey);
        if (!demoModal) modal.remove();
    }

    function onKey(e) {
        if (e.key === 'Escape') closeModal();
    }

    function onClick(e) {
        const closeBtn = e.target instanceof Element ? e.target.closest('[data-close="true"]') : null;
        if (closeBtn) closeModal();
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden' , 'false');
    openModalBtn?.setAttribute('aria-expanded' , 'true');
    document.body.classList.add('modal-open');
    modal.addEventListener('click' , onClick);
    document.addEventListener('keydown' , onKey);
};

if (openModalBtn) {
    openModalBtn.addEventListener('click' , openModal);
}


const tabs = document.getElementById('demo-tabs');
if (tabs) {
    const tabButtons = tabs.querySelectorAll('.tab-btn');
    const panels = tabs.querySelectorAll('.tab-panel');
    const activate = (id) => {
        tabButtons.forEach((btn) => {
            const isActive = btn.getAttribute('data-tab') === id;
            btn.classList.toggle('is-active' , isActive);
            btn.setAttribute('aria-selected' , String(isActive));
        });
        panels.forEach((panel) => {
            panel.classList.toggle('is-active' , panel.id === id);
        });
    };
    tabButtons.forEach((btn) => {
        btn.addEventListener('click' , () => {
            const id = btn.getAttribute('data-tab');
            if (id) activate(id);
        });
    });
}


const logosViewport = document.querySelector('.logos-viewport');
const logosRail = document.querySelector('.logos-rail');
if (logosViewport && logosRail) {
    logosRail.innerHTML += logosRail.innerHTML;

    let lastTime;
    let halfWidth = logosRail.scrollWidth / 2;
    const speedPxPerSec = 40; 

    const recalc = () => {
        halfWidth = logosRail.scrollWidth / 2;
        logosViewport.scrollLeft = logosViewport.scrollLeft % halfWidth;
    };
    window.addEventListener('resize' , recalc);

    const step = (time) => {
        if (lastTime == null) lastTime = time;
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        logosViewport.scrollLeft += speedPxPerSec * delta;
        if (logosViewport.scrollLeft >= halfWidth) {
            logosViewport.scrollLeft -= halfWidth;
        }
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
})();
