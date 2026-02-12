const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

let currentX = 0; 
let currentY = 0; 
let isDragging = false;
let startX, startY;
let scale = 1; 
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 145;

// Ваш масив вузлів (переконайтеся, що об'єкти cost мають iron, fuel, coins)
window.treeNodes = [
    { 
        id: 'hull_start', name: 'Герметизація', tier: 'I', desc: 'Покращена ізоляція відсіку для захисту вантажу.', 
        x: 1000, y: 1000, req: null, owned: true, img: 'images/Korpus.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'hull_mk2', name: 'Композитний Корпус', tier: 'II', desc: 'Полегшений сплав для обладнання.', 
        x: 1250, y: 1000, req: 'hull_start', owned: false, img: 'images/Korpus.png',
        cost: { iron: 700, fuel: 300, coins: 550 }
    },
    { 
        id: 'solar_upg', name: 'Фотоелементи MK-2', tier: 'III', desc: 'Покращення збору енергії на 50%.', 
        x: 1500, y: 850, req: 'hull_mk2', owned: false, img: 'images/Bataries.png',
        cost: { iron: 400, fuel: 200, coins: 600 }
    },
    { 
        id: 'solar_max', name: 'Квантові Панелі', tier: 'IV', desc: 'Найкраща система поглинання світла.', 
        x: 1750, y: 850, req: 'solar_upg', owned: false, img: 'images/Bataries.png',
        cost: { iron: 200, fuel: 500, coins: 800 }
    },
    { 
        id: 'aux_bay', name: 'Допоміжні Відсіки', tier: 'III', desc: 'Розширення простору для обладнання.', 
        x: 1500, y: 1150, req: 'hull_mk2', owned: false, img: 'images/Korpus.png',
        cost: { iron: 600, fuel: 200, coins: 500 }
    },
    { 
        id: 'combat_bay', name: 'Бойовий Модуль', tier: 'IV', desc: 'Броньований відсік з системою наведення.', 
        x: 1750, y: 1150, req: 'aux_bay', owned: false, img: 'images/Korpus.png',
        cost: { iron: 800, fuel: 300, coins: 750 }
    },
    { 
        id: 'cannons', name: 'Плазмові Гармати', tier: 'V', desc: 'Важке озброєння для знищення ворогів.', 
        x: 2000, y: 1150, req: 'combat_bay', owned: false, img: 'images/Blasters.png',
        cost: { iron: 500, fuel: 400, coins: 1000 }
    },
    { 
        id: 'eng_start', name: 'Форсаж', tier: 'I', desc: 'Базова оптимізація камери згоряння.', 
        x: 1000, y: 1500, req: null, owned: true, img: 'images/Turbina.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'eng_ultimate', name: 'Гіпер-Турбіна', tier: 'IV', desc: 'Найкраща турбіна.', 
        x: 1300, y: 1400, req: 'eng_start', owned: false, img: 'images/Turbina.png',
        cost: { iron: 350, fuel: 500, coins: 900 }
    },
    { 
        id: 'eng_side', name: 'Бокові Рушії', tier: 'II', desc: 'Покращення маневрових двигунів.', 
        x: 1300, y: 1600, req: 'eng_start', owned: false, img: 'images/Turbina.png',
        cost: { iron: 300, fuel: 250, coins: 400 }
    },
    { 
        id: 'nose_start', name: 'Титановий Конус', tier: 'I', desc: 'Посилений захист від тертя.', 
        x: 1000, y: 1850, req: null, owned: true, img: 'images/Nose.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'nose_adv', name: 'Аеро-Композит', tier: 'III', desc: 'Новий ніс з сенсорами.', 
        x: 1300, y: 1850, req: 'nose_start', owned: false, img: 'images/Nose.png',
        cost: { iron: 250, fuel: 200, coins: 550 }
    }
];

async function startApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('family_id');

    if (familyId) {
        try {
            const response = await fetch(`/api/inventory?family_id=${familyId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.modules) {
                    const ownedIds = data.modules.map(m => m.id);
                    window.treeNodes.forEach(node => {
                        if (ownedIds.includes(node.id)) node.owned = true;
                    });
                }
            }
        } catch (e) { console.error("Sync error:", e); }
    }
    init();
    setupNavigation(familyId);
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
        const check = node.owned ? '<span class="checkmark">✔</span>' : '';
        div.innerHTML = `
            <div class="node-img-box"><img src="${node.img}" class="node-icon"></div>
            <div class="node-tier">TIER ${node.tier}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-status">${check}</div>
        `;
        div.onclick = (e) => { e.stopPropagation(); highlightPath(node.id); openPanel(node); };
        canvas.appendChild(div);
        if (node.req) drawLine(node);
    });
    centerViewport();
}

function openPanel(node) {
    document.getElementById('node-name').innerText = node.name;
    document.getElementById('node-tier').innerText = `TIER ${node.tier}`;
    document.getElementById('node-desc').innerText = node.desc;
    document.getElementById('node-image').src = node.img || 'images/modules/placeholder.png';

    const costContainer = document.getElementById('node-cost');
    const actionBtn = document.querySelector('.action-btn');

    // === ЛОГІКА ВІДОБРАЖЕННЯ ЦІНИ ===
    if (node.owned) {
        costContainer.innerHTML = '<div class="cost-owned-msg" style="color: #2ecc71; font-weight: bold;">ВЖЕ ДОСЛІДЖЕНО</div>';
        actionBtn.textContent = 'В АНГАРІ';
        actionBtn.classList.add('disabled');
        actionBtn.onclick = null;
    } else {
        const c = node.cost || { iron: 0, fuel: 0, coins: 0 };
        // Отримуємо іконки залежно від планети (можна адаптувати)
        costContainer.innerHTML = `
            <div class="cost-cell">
                <span class="cost-icon">🧱</span>
                <span class="cost-value">${c.iron}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🧪</span>
                <span class="cost-value">${c.fuel}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🪙</span>
                <span class="cost-value">${c.coins}</span>
            </div>
        `;
        actionBtn.textContent = 'ДОСЛІДИТИ';
        actionBtn.classList.remove('disabled');
        actionBtn.onclick = () => investigateModule(node.id);
    }

    document.getElementById('info-panel').classList.add('active');
}

async function investigateModule(moduleId) {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('family_id');

    if (!familyId) return alert("Помилка: зайдіть через бот");

    try {
        const response = await fetch('/api/investigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ family_id: familyId, module_id: moduleId })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Технологію успішно досліджено!");
            location.reload();
        } else {
            alert("Помилка: " + (result.error || "Недостатньо ресурсів"));
        }
    } catch (e) { console.error(e); }
}

// Решта функцій (DRAG, ZOOM, Navigation) без змін
function setupNavigation(familyId) {
    const backBtn = document.querySelector('.back-btn'); 
    if (backBtn) {
        const path = window.location.pathname;
        let target = { url: 'index.html', text: 'MENU' };
        if (path.includes('tree_Moon')) target = { url: 'Moon.html', text: 'МІСЯЦЬ' };
        if (path.includes('tree_Mars')) target = { url: 'Mars.html', text: 'МАРС' };
        if (path.includes('tree_Jupiter')) target = { url: 'Jupiter.html', text: 'ЮПІТЕР' };
        backBtn.href = familyId ? `${target.url}?family_id=${familyId}` : target.url;
    }
}

function centerViewport() { currentX = (window.innerWidth / 2) - 1300; currentY = (window.innerHeight / 2) - 1500; updateCanvasPosition(); }
function updateCanvasPosition() { canvas.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`; }
function drawLine(node) {
    const parent = window.treeNodes.find(n => n.id === node.req);
    if (!parent) return;
    const line = document.createElement('div');
    line.className = 'line' + (node.owned ? ' highlight' : '');
    const startX = parent.x + NODE_WIDTH; const startY = parent.y + NODE_HEIGHT / 2;
    const endX = node.x; const endY = node.y + NODE_HEIGHT / 2;
    const dx = endX - startX, dy = endY - startY;
    line.style.width = Math.sqrt(dx * dx + dy * dy) + 'px';
    line.style.left = startX + 'px'; line.style.top = startY + 'px';
    line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    canvas.appendChild(line);
}
function highlightPath(id) {
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
    let curr = id;
    while (curr) {
        document.getElementById(curr)?.classList.add('highlight');
        const n = window.treeNodes.find(x => x.id === curr);
        curr = n ? n.req : null;
    }
}
function closePanel() { document.getElementById('info-panel').classList.remove('active'); }

viewport.addEventListener('mousedown', (e) => { if (e.target.closest('.node')) return; isDragging = true; startX = e.clientX - currentX; startY = e.clientY - currentY; });
window.addEventListener('mousemove', (e) => { if (!isDragging) return; currentX = e.clientX - startX; currentY = e.clientY - startY; updateCanvasPosition(); });
window.addEventListener('mouseup', () => isDragging = false);
viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = (e.deltaY < 0) ? 1.1 : 0.9;
    let nScale = scale * factor;
    if (nScale >= MIN_SCALE && nScale <= MAX_SCALE) {
        const xs = (e.clientX - currentX) / scale; const ys = (e.clientY - currentY) / scale;
        currentX -= xs * (nScale - scale); currentY -= ys * (nScale - scale);
        scale = nScale; updateCanvasPosition();
    }
}, { passive: false });

document.addEventListener('DOMContentLoaded', startApp);