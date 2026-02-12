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

// Масив вузлів (owned буде оновлено з БД)
window.treeNodes = [
    // === ГРУПА 1: КОРПУС ТА МОДУЛІ ===
    { 
        id: 'hull_start', name: 'Герметизація', tier: 'I', desc: 'Покращена ізоляція відсіку для захисту вантажу.', 
        x: 1000, y: 1000, req: null, owned: false, img: 'images/Korpus.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'hull_mk2', name: 'Композитний Корпус', tier: 'II', desc: 'Полегшений сплав, що дозволяє нести більше обладнання.', 
        x: 1250, y: 1000, req: 'hull_start', owned: false, img: 'images/Korpus.png',
        cost: { iron: 700, fuel: 300, coins: 550 }
    },
    { 
        id: 'solar_upg', name: 'Фотоелементи MK-2', tier: 'III', desc: 'Покращення ефективності збору енергії на 50%.', 
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

    // === ГРУПА 2: ДВИГУНИ ===
    { 
        id: 'eng_start', name: 'Форсаж', tier: 'I', desc: 'Базова оптимізація камери згоряння.', 
        x: 1000, y: 1500, req: null, owned: false, img: 'images/Turbina.png',
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

    // === ГРУПА 3: НІС ===
    { 
        id: 'nose_start', name: 'Титановий Конус', tier: 'I', desc: 'Посилений захист від тертя.', 
        x: 1000, y: 1850, req: null, owned: false, img: 'images/Nose.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'nose_adv', name: 'Аеро-Композит', tier: 'III', desc: 'Новий ніс з сенсорами дальньої дії.', 
        x: 1300, y: 1850, req: 'nose_start', owned: false, img: 'images/Nose.png',
        cost: { iron: 250, fuel: 200, coins: 550 }
    }
];

// --- СИНХРОНІЗАЦІЯ ТА ІНІЦІАЛІЗАЦІЯ ---
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

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Сервер повернув помилку 500. Перевірте CATALOG!");
        }

        const result = await response.json();
        if (response.ok) {
            alert("Технологію успішно досліджено!");
            location.reload(); 
        } else {
            alert("Помилка: " + (result.error || "Недостатньо ресурсів"));
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Критична помилка сервера. Перевірте Logs.");
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
            <div class="cost-cell"><span>☁️</span><span class="cost-value">${c.iron}</span></div>
            <div class="cost-cell"><span>🎈</span><span class="cost-value">${c.fuel}</span></div>
            <div class="cost-cell"><span>🪙</span><span class="cost-value">${c.coins}</span></div>
        `;
        btn.textContent = 'ДОСЛІДИТИ';
        btn.classList.remove('disabled');
        btn.disabled = false;
    }
    document.getElementById('info-panel').classList.add('active');
}

// --- СТАНДАРТНІ ФУНКЦІЇ (DRAG, ZOOM, LINES) ---
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
    line.style.width = Math.sqrt(dx * dx + dy * dy) + 'px';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
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

viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node')) return;
    isDragging = true;
    startX = e.clientX - currentX; startY = e.clientY - currentY;
    viewport.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX; currentY = e.clientY - startY;
    updateCanvasPosition();
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
});

viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = (e.deltaY < 0) ? 1.1 : 0.9;
    let nScale = scale * factor;
    if (nScale >= MIN_SCALE && nScale <= MAX_SCALE) {
        const xs = (e.clientX - currentX) / scale;
        const ys = (e.clientY - currentY) / scale;
        currentX -= xs * (nScale - scale);
        currentY -= ys * (nScale - scale);
        scale = nScale;
        updateCanvasPosition();
    }
}, { passive: false });

function closePanel() {
    document.getElementById('info-panel').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', startApp);