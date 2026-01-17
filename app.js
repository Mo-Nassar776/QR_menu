
/**
 * Smart QR Menu - Ultra Premium JS Controller (V2 - Smart Core)
 * Motion Engine & Data Management
 */

const state = {
    restaurant: null,
    menu: null,
    activeCategory: null,
    cart: []
};

const dom = {
    loader: document.getElementById('boot-loader'),
    stage: document.getElementById('stage'),
    brandName: document.getElementById('brand-name'),
    brandSlogan: document.getElementById('brand-slogan'),
    trustRow: document.getElementById('trust-row'),
    catWrapper: document.getElementById('cat-wrapper'),
    menuHub: document.getElementById('menu-hub'),
    waLink: document.getElementById('wa-link'),
    brandFoot: document.getElementById('brand-foot'),
    year: document.getElementById('year'),
    parallaxImg: document.getElementById('parallax-img')
};

// --- Execution Start ---
async function boot() {
    try {
        const response = await fetch('/api/load');
        const data = await response.json();

        state.restaurant = data.restaurant;
        state.menu = data.menu;

        renderCore();
        attachInteractions();
        launchAnimations();
    } catch (err) {
        console.error("Boot failure:", err);
    }
}

// --- Dynamic Rendering ---
function renderCore(filterText = '') {
    const { name, slogan, trust, colors, contact } = state.restaurant;

    // Update Browser Title
    document.title = `${name} | ${slogan}`;

    // Theme injection (only on first boot)
    if (colors && !document.documentElement.style.getPropertyValue('--primary')) {
        document.documentElement.style.setProperty('--primary', colors.primary);
        document.documentElement.style.setProperty('--surface', colors.background);
    }

    dom.brandName.textContent = name;
    dom.brandSlogan.textContent = slogan;
    dom.brandFoot.textContent = name;
    dom.year.textContent = new Date().getFullYear();

    // Initial WhatsApp Link
    updateWhatsApp();

    // Trust Badges
    dom.trustRow.innerHTML = `
        <div class="brand-badge" style="background:rgba(255,255,255,0.05); border-color:var(--glass-border); color:#fff;">
            <i class="fa-solid fa-star" style="color:var(--primary)"></i> ${trust.googleRating}
        </div>
        <div class="brand-badge" style="background:rgba(16, 185, 129, 0.1); border-color:rgba(16, 185, 129, 0.2); color:#10b981;">
            <i class="fa-solid fa-shield-check"></i> Hygiene Verified
        </div>
    `;

    // Category Pills
    dom.catWrapper.innerHTML = state.menu.map((cat, idx) => `
        <button class="cat-pill ${idx === 0 ? 'active' : ''}" data-cat="${cat.id}" onclick="jumpTo('${cat.id}')">
            ${cat.name}
        </button>
    `).join('');

    // Menu Sections (with smart filtering)
    dom.menuHub.innerHTML = state.menu.map(cat => {
        const filteredItems = cat.items.filter(item =>
            item.name.toLowerCase().includes(filterText.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filteredItems.length === 0 && filterText) return '';

        return `
            <div class="menu-group" id="${cat.id}">
                <div class="section-head">
                    <h2>${cat.name}</h2>
                    <div class="section-line"></div>
                </div>
                <div class="items-stack">
                    ${filteredItems.map(item => `
                        <div class="item-card reveal-up" data-item="${item.id}">
                            <div class="card-img-container">
                                <img src="${item.image}" alt="${item.name}" loading="lazy">
                            </div>
                            <div class="card-info">
                                <div>
                                    <div class="card-tags" style="display:flex; gap:6px; margin-bottom:8px;">
                                        ${(item.tags || []).map(t => {
            const icons = { spicy: 'fa-pepper-hot', veggie: 'fa-leaf', popular: 'fa-fire' };
            return `<span class="tag-icon ${t}"><i class="fa-solid ${icons[t] || 'fa-tag'}"></i></span>`;
        }).join('')}
                                    </div>
                                    <h3 class="item-title">${item.name}</h3>
                                    <p class="item-desc">${item.description || ''}</p>
                                </div>
                                <div class="card-bottom">
                                    <div class="price-tag">${item.price} <small>${state.restaurant.currency}</small></div>
                                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${item.id}')">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// --- Interaction Logic ---
function attachInteractions() {
    // Parallax logic
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (dom.parallaxImg) {
            dom.parallaxImg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
        }
    });

    // Smart Search Logic
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCore(e.target.value);
            // Refresh ScrollTriggers after DOM mutation
            ScrollTrigger.refresh();
        });
    }

    // Active category monitoring
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                document.querySelectorAll('.cat-pill').forEach(pill => {
                    pill.classList.toggle('active', pill.dataset.cat === id);
                    if (pill.classList.contains('active')) {
                        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                });
            }
        });
    }, { threshold: 0.2, rootMargin: '-100px 0px 0px 0px' });

    document.querySelectorAll('.menu-group').forEach(group => observer.observe(group));
}

// --- Cart & Order Engine ---
window.addToCart = (itemId) => {
    const allItems = state.menu.flatMap(c => c.items);
    const item = allItems.find(i => i.id === itemId);

    if (item) {
        state.cart.push(item);
        updateWhatsApp();
        showFeedback(item.name);
    }
};

function updateWhatsApp() {
    const { contact, currency } = state.restaurant;
    const phone = contact.whatsapp.replace(/\D/g, '');

    if (state.cart.length === 0) {
        dom.waLink.href = `https://wa.me/${phone}?text=${encodeURIComponent('السلام عليكم، كنت أريد الاستفسار عن المنيو')}`;
        return;
    }

    let total = 0;
    let message = `السلام عليكم، أود طلب الأصناف التالية:\n\n`;
    const counts = {};
    const recommendations = new Set();
    const allItems = state.menu.flatMap(c => c.items);

    state.cart.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + 1;
        total += item.price;
        // Collect cross-sell suggestions
        if (item.suggestedWith) item.suggestedWith.forEach(id => {
            const suggested = allItems.find(i => i.id === id);
            if (suggested) recommendations.add(suggested.name);
        });
    });

    Object.entries(counts).forEach(([name, count]) => {
        message += `• ${name} (${count}x)\n`;
    });

    message += `\n💰 المجموع: ${total} ${currency}`;

    // SMART UPSELL IN MESSAGE
    if (recommendations.size > 0) {
        message += `\n\n💡 اقتراح: ربما تود تجربة (${Array.from(recommendations).join(', ')}) مع طلبك؟`;
    }

    message += `\n\nشكراً لكم!`;
    dom.waLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    dom.waLink.setAttribute('data-count', state.cart.length);
}

function showFeedback(name) {
    gsap.fromTo('.wa-btn', { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
    const toast = document.getElementById('toast-notify');
    if (toast) {
        toast.textContent = `تم إضافة ${name} لسلتك`;
        gsap.to(toast, { y: 0, opacity: 1, duration: 0.4, ease: "back.out" });
        setTimeout(() => gsap.to(toast, { y: 20, opacity: 0, duration: 0.4 }), 2000);
    }
}

// --- Motion Engine ---
function launchAnimations() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();
    tl.to(dom.loader, {
        opacity: 0, duration: 0.7, delay: 0.5, onComplete: () => {
            dom.loader.style.display = 'none';
            dom.stage.style.visibility = 'visible';
        }
    });

    tl.to(dom.stage, { opacity: 1, duration: 1 })
        .from('.hero-content', { y: 60, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.8")
        .from('.search-container', { y: 20, opacity: 0, duration: 0.8, ease: "back.out" }, "-=0.6")
        .from('.category-sticky', { y: -30, opacity: 0, duration: 0.8 }, "-=0.4")
        .to('.wa-btn', { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=0.2");

    gsap.utils.toArray('.item-card').forEach((card, i) => {
        gsap.to(card, {
            scrollTrigger: { trigger: card, start: "top 90%" },
            opacity: 1, y: 0, duration: 0.8, ease: "expo.out", delay: (i % 3) * 0.1
        });
    });
}

window.jumpTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
};

boot();
