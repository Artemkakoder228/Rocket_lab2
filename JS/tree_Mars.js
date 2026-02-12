const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

// Змінні для позиції та масштабу
let currentX = 0; 
let currentY = 0; 
let isDragging = false;
let startX, startY;
let scale = 1; 
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 145;

// Масив вузлів (дані про володіння будуть оновлені з БД)
window.treeNodes = [
    // === ГРУПА 1: КОРПУС ТА ЕНЕРГІЯ ===
    { 
        id: 'g1_1', name: 'Вантажний Відсік', tier: 'I', 
        desc: 'Базовий модуль для перевезення корисного вантажу.', 
        x: 1000, y: 1000, req: null, owned: true, img: 'images/Korpus.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g1_2', name: 'Герметизація', tier: 'II', 
        desc: 'Покращена ізоляція відсіку для захисту вантажу.', 
        x: 1250, y: 1000, req: 'g1_1', owned: false, img: 'images/Korpus.png',
        cost: { iron: 600, fuel: 200, coins: 400 }
    },
    { 
        id: 'g1_up', name: 'Панель Оновлення', tier: 'III', 
        desc: 'Система розподілу енергії для нових модулів.', 
        x: 1500, y: 900, req: 'g1_2', owned: false, img: 'images/Korpus.png',
        cost: { iron: 500, fuel: 150, coins: 500 }
    },
    { 
        id: 'g1_down', name: 'Сонячні Панелі', tier: 'III', 
        desc: 'Розкладні фотоелементи для енергії.', 
        x: 1500, y: 1100, req: 'g1_2', owned: false, img: 'images/Bataries.png',
        cost: { iron: 400, fuel: 100, coins: 450 }
    },
    { 
        id: 'g1_end', name: 'Нові Панелі MK-II', tier: 'IV', 
        desc: 'Високоефективні панелі подвійної площі.', 
        x: 1750, y: 1100, req: 'g1_down', owned: false, img: 'images/Bataries.png',
        cost: { iron: 300, fuel: 200, coins: 600 }
    },

    // === ГРУПА 2: ДВИГУНИ ===
    { 
        id: 'g2_1', name: 'Турбо-Форсаж', tier: 'I', 
        desc: 'Система впорскування палива для різкого ривка.', 
        x: 1000, y: 1400, req: null, owned: true, img: 'images/Turbina.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g2_up', name: 'Покращений Форсаж', tier: 'II', 
        desc: 'Оптимізована камера згоряння.', 
        x: 1250, y: 1300, req: 'g2_1', owned: false, img: 'images/Turbina.png',
        cost: { iron: 550, fuel: 350, coins: 700 }
    },
    { 
        id: 'g2_down', name: 'Бокові Турбіни', tier: 'II', 
        desc: 'Додаткові маневрові двигуни.', 
        x: 1250, y: 1500, req: 'g2_1', owned: false, img: 'images/Turbina.png',
        cost: { iron: 400, fuel: 250, coins: 500 }
    },

    // === ГРУПА 3: ЗАХИСТ ТА ЗБРОЯ ===
    { 
        id: 'g3_a1', name: 'Керамічний Щит', tier: 'I', 
        desc: 'Термостійке покриття проти тертя.', 
        x: 1000, y: 1700, req: null, owned: true, img: 'images/Nose.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g3_a2', name: 'Нова Верхівка', tier: 'II', 
        desc: 'Посилений титановий конус.', 
        x: 1250, y: 1700, req: 'g3_a1', owned: false, img: 'images/Nose.png',
        cost: { iron: 350, fuel: 150, coins: 480 }
    },
    { 
        id: 'g3_b1', name: 'Бластер', tier: 'I', 
        desc: 'Лазер для знищення астероїдів.', 
        x: 1000, y: 1900, req: null, owned: true, img: 'images/Blasters.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g3_b2', name: 'Покращений Бластер', tier: 'II', 
        desc: 'Скорострільна плазмова гармата.', 
        x: 1250, y: 1900, req: 'g3_b1', owned: false, img: 'images/Blasters.png',
        cost: { iron: 450, fuel: 300, coins: 700 }
    }
];

// --- ЗАВАНТАЖЕННЯ ДАНИХ ТА ІНІЦІАЛІЗАЦІЯ ---
async function startApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('family_id');

    if (familyId) {
        try {
            const response = await fetch(`/api/inventory?family_id=${familyId}`);
            const data = await response.json();
            if (data.modules) {
                const ownedIds = data.modules.map(m => m.id);
                window.treeNodes.forEach(node => {
                    if (ownedIds.includes(node.id)) node.owned = true;
                });
            }
        } catch (e) { console.error("Sync error:", e); }
    }
    
    init(); // Малюємо дерево
    setupNavigation(familyId);
}

function setupNavigation(familyId) {
    const backBtn = document.querySelector('.back-btn'); 
    if (backBtn) {
        const path = window.location.pathname;
        let target = { url: 'index.html', text: 'MENU' };
        if (path.includes('tree_Moon')) target = { url: 'Moon.html', text: 'МІСЯЦЬ' };
        if (path.includes('tree_Mars')) target = { url: 'Mars.html', text: 'МАРС' };
        if (path.includes('tree_Jupiter')) target = { url: 'Jupiter.html', text: 'ЮПІТЕР' };

        backBtn.href = familyId ? `${target.url}?family_id=${familyId}` : target.url;
        backBtn.innerHTML = `<span class="arrow">‹</span> ${target.text}`;
    }

    document.querySelectorAll('.planet-btn').forEach(btn => {
        const baseHref = btn.getAttribute('href').split('?')[0];
        if (familyId) btn.href = `${baseHref}?family_id=${familyId}`;
    });
}

function init() {
    canvas.innerHTML = '';
    canvas.style.transformOrigin = '0 0';

    window.treeNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node' + (node.owned ? ' owned researched' : '');
        div.id = node.id;
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';

        const checkmark = node.owned ? '<span class="checkmark">✔</span>' : '';
        const imageSrc = node.img ? node.img : 'images/placeholder_icon.png';

        div.innerHTML = `
            <div class="node-img-box"><img src="${imageSrc}" class="node-icon"></div>
            <div class="node-tier">TIER ${node.tier}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-status">${checkmark}</div>
        `;
        
        div.onclick = (e) => {
            e.stopPropagation();
            highlightPath(node.id);
            openPanel(node);
        };
        canvas.appendChild(div);
        if (node.req) drawLine(node);
    });
    centerViewport();
}

// --- ЛОГІКА ДОСЛІДЖЕННЯ ---
async function investigateModule(moduleId) {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('family_id');

    if (!familyId) return alert("Помилка: ID сім'ї не знайдено!");

    try {
        const response = await fetch('/api/investigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ family_id: familyId, module_id: moduleId })
        });

        // Спершу перевіряємо чи відповідь це JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Сервер повернув помилку 500 або не JSON. Перевірте CATALOG!");
        }

        const result = await response.json();

        if (response.ok) {
            alert("Технологію успішно досліджено!");
            location.reload(); 
        } else {
            alert("Помилка: " + (result.error || "Невідома помилка"));
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Критична помилка сервера. Перевірте Logs в Render.");
    }
}

function openPanel(node) {
    document.getElementById('node-name').innerText = node.name;
    document.getElementById('node-tier').innerText = `TIER ${node.tier}`;
    document.getElementById('node-desc').innerText = node.desc;
    document.getElementById('node-image').src = node.img || 'images/modules/placeholder.png';

    const costContainer = document.getElementById('node-cost');
    const btn = document.querySelector('.action-btn');

    btn.onclick = () => investigateModule(node.id);

    if (node.owned) {
        costContainer.innerHTML = '<div class="cost-owned-msg">ВЖЕ ВСТАНОВЛЕНО</div>';
        btn.textContent = 'В АНГАРІ';
        btn.classList.add('disabled');
        btn.disabled = true;
    } else {
        const c = node.cost || { iron: 0, fuel: 0, coins: 0 };
        costContainer.innerHTML = `
            <div class="cost-cell"><span>🧱</span><span class="cost-value">${c.iron}</span></div>
            <div class="cost-cell"><span>🧪</span><span class="cost-value">${c.fuel}</span></div>
            <div class="cost-cell"><span>🪙</span><span class="cost-value">${c.coins}</span></div>
        `;
        btn.textContent = 'ДОСЛІДИТИ';
        btn.classList.remove('disabled');
        btn.disabled = false;
    }
    document.getElementById('info-panel').classList.add('active');
}

// --- СТАНДАРТНІ ФУНКЦІЇ (CENTER/DRAG/ZOOM/LINES) ---
function centerViewport() {
    currentX = (window.innerWidth / 2) - 1375;
    currentY = (window.innerHeight / 2) - 1450;
    updateCanvasPosition();
}

function updateCanvasPosition() {
    canvas.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

function drawLine(node) {
    const parent = window.treeNodes.find(n => n.id === node.req);
    if (!parent) return;
    const line = document.createElement('div');
    line.className = 'line' + (node.owned ? ' highlight' : '');
    const startX = parent.x + NODE_WIDTH;
    const startY = parent.y + NODE_HEIGHT / 2;
    const endX = node.x;
    const endY = node.y + NODE_HEIGHT / 2;
    const dx = endX - startX, dy = endY - startY;
    line.style.width = Math.sqrt(dx * dx + dy * dy) + 'px';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    canvas.appendChild(line);
}

function highlightPath(nodeId) {
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
    let curr = nodeId;
    while (curr) {
        document.getElementById(curr)?.classList.add('highlight');
        const n = window.treeNodes.find(x => x.id === curr);
        curr = n ? n.req : null;
    }
}

viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node')) return;
    isDragging = true;
    startX = e.clientX - currentX; startY = e.clientY - currentY;
});
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX; currentY = e.clientY - startY;
    updateCanvasPosition();
});
window.addEventListener('mouseup', () => isDragging = false);

viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = (e.deltaY < 0) ? 1.1 : 0.9;
    let newScale = scale * factor;
    if (newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
        const xs = (e.clientX - currentX) / scale;
        const ys = (e.clientY - currentY) / scale;
        currentX -= xs * (newScale - scale);
        currentY -= ys * (newScale - scale);
        scale = newScale;
        updateCanvasPosition();
    }
}, { passive: false });

function closePanel() {
    document.getElementById('info-panel').classList.remove('active');
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
}

document.addEventListener('DOMContentLoaded', startApp);