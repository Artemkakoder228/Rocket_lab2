const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

// Змінні для позиції
let currentX = 0; 
let currentY = 0; 
let isDragging = false;
let startX, startY;
let scale = 1; 
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 145;

// Масив вузлів (owned буде оновлено з БД)
window.treeNodes = [
    { 
        id: 'root1', name: 'Сталевий Корпус', tier: 'I', desc: 'Базова основа ракети.', 
        x: 1000, y: 1100, req: null, owned: false, img: 'images/Korpus.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'branch1_up1', name: 'Вантажний Відсік', tier: 'II', desc: 'Додатковий модуль.', 
        x: 1300, y: 1000, req: 'root1', owned: false, img: 'images/Korpus.png',
        cost: { iron: 400, fuel: 200, coins: 350 }
    },
    { 
        id: 'branch1_up2', name: 'Сонячні Панелі', tier: 'III', desc: 'Генерація енергії.', 
        x: 1600, y: 1000, req: 'branch1_up1', owned: false, img: 'images/Bataries.png',
        cost: { iron: 300, fuel: 100, coins: 450 }
    },
    { 
        id: 'branch1_down1', name: 'Аеро-надкрилки', tier: 'II', desc: 'Стабілізація польоту.', 
        x: 1300, y: 1200, req: 'root1', owned: false, img: 'images/Stabilizator.png',
        cost: { iron: 250, fuel: 150, coins: 300 }
    },
    { 
        id: 'root2', name: 'Турбо-нагнітач', tier: 'I', desc: 'Подвійна система нагнітання.', 
        x: 1000, y: 1550, req: null, owned: false, img: 'images/Turbina.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'branch2_up', name: 'Турбо-Форсаж', tier: 'II', desc: 'Покращена турбіна.', 
        x: 1300, y: 1450, req: 'root2', owned: false, img: 'images/Turbina.png',
        cost: { iron: 500, fuel: 400, coins: 600 }
    },
    { 
        id: 'branch2_down', name: 'Бокові Рушії', tier: 'II', desc: 'Маневрені турбіни.', 
        x: 1300, y: 1650, req: 'root2', owned: false, img: 'images/Turbina.png',
        cost: { iron: 350, fuel: 250, coins: 400 }
    },
    { 
        id: 'root3', name: 'Сенсорний шпиль', tier: 'I', desc: 'Модернізована верхівка.', 
        x: 1000, y: 1900, req: null, owned: false, img: 'images/Nose.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'branch3', name: 'Керамічний Щит', tier: 'II', desc: 'Покращена верхівка.', 
        x: 1300, y: 1900, req: 'root3', owned: false, img: 'images/Nose.png',
        cost: { iron: 300, fuel: 100, coins: 380 }
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
        } catch (e) { console.error("Помилка завантаження інвентарю:", e); }
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

    // Оновлення кнопок планет
    document.querySelectorAll('.planet-btn').forEach(btn => {
        const currentHref = btn.getAttribute('href').split('?')[0];
        if (familyId) btn.href = `${currentHref}?family_id=${familyId}`;
    });
}

function init() {
    canvas.innerHTML = '';
    canvas.style.transformOrigin = '0 0';

    window.treeNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node' + (node.owned ? ' owned researched' : '');
        div.id = node.id; // ID модуля
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';

        const checkmark = node.owned ? '<span class="checkmark">✔</span>' : '';
        div.innerHTML = `
            <div class="node-img-box"><img src="${node.img}" class="node-icon"></div>
            <div class="node-tier">TIER ${node.tier}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-status">${checkmark}</div>
        `;
        
        div.onclick = (e) => {
            e.stopPropagation();
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

        const result = await response.json();

        if (response.ok) {
            alert("Модуль успішно досліджено!");
            location.reload(); 
        } else {
            alert("Помилка: " + result.error);
        }
    } catch (error) { console.error("Помилка запиту:", error); }
}

function openPanel(node) {
    document.getElementById('node-name').innerText = node.name;
    document.getElementById('node-tier').innerText = `TIER ${node.tier}`;
    document.getElementById('node-desc').innerText = node.desc;
    document.getElementById('node-image').src = node.img;

    const costContainer = document.getElementById('node-cost');
    const btn = document.querySelector('.action-btn');

    // Назначаємо подію на кнопку
    btn.onclick = () => investigateModule(node.id);

    if (node.owned) {
        costContainer.innerHTML = '<div class="cost-owned-msg">ВЖЕ ВСТАНОВЛЕНО</div>';
        btn.textContent = 'В АНГАРІ';
        btn.classList.add('disabled');
        btn.disabled = true;
    } else {
        const c = node.cost;
        // Для Місяця іконки ресурсів інші (🌑 Реголіт, ⚛️ Гелій-3)
        costContainer.innerHTML = `
            <div class="cost-cell"><span>🌑</span><span class="cost-value">${c.iron}</span></div>
            <div class="cost-cell"><span>⚛️</span><span class="cost-value">${c.fuel}</span></div>
            <div class="cost-cell"><span>🪙</span><span class="cost-value">${c.coins}</span></div>
        `;
        btn.textContent = 'ДОСЛІДИТИ';
        btn.classList.remove('disabled');
        btn.disabled = false;
    }
    document.getElementById('info-panel').classList.add('active');
}

// --- DRAG / ZOOM / CENTER (без змін) ---
function centerViewport() {
    currentX = (window.innerWidth / 2) - 1300;
    currentY = (window.innerHeight / 2) - 1500;
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
    const dist = Math.sqrt(dx * dx + dy * dy);
    line.style.width = dist + 'px';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    canvas.appendChild(line);
}

viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node')) return;
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
});
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
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
}

document.addEventListener('DOMContentLoaded', startApp);