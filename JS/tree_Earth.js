const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const urlParams = new URLSearchParams(window.location.search);
window.userFamilyId = urlParams.get('family_id');

// Змінні для позиції
let currentX = 0; 
let currentY = 0; 
let isDragging = false;
let startX, startY;
let scale = 1;              // Поточний масштаб
const MIN_SCALE = 0.3;      // Мінімальне зменшення
const MAX_SCALE = 3.0;      // Максимальне збільшення
const ZOOM_SPEED = 0.001;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 145;

// Змінна для збереження вибраного модуля (щоб знати, що купувати)
let selectedNode = null;

// --- 1. ОНОВЛЕНІ ДАНІ (Додано rocketKey та level) ---
// rocketKey має співпадати з ключами в index.html (nose, body, engine, fins)
window.treeNodes = [
    // --- КАТЕГОРІЯ 1: НІС (NOSE) ---
    {
        id: 'gu1',
        name: 'Конус-верхівка',
        tier: 'I',
        desc: 'Аеродинамічний обтікач для зниження опору повітря під час зльоту.',
        x: 1000, y: 1000,
        req: null, owned: true, img: 'images/Nose.png',
        rocketKey: 'nose', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 } // Вже куплено
    },
    {
        id: 'gu2',
        name: 'Сенсорний шпиль',
        tier: 'II',
        desc: 'Модернізована верхівка з датчиками атмосфери та телеметрією.',
        x: 1400, y: 1000,
        req: 'gu1', owned: false, img: 'images/Nose.png',
        rocketKey: 'nose', level: 2,
        cost: { iron: 500, fuel: 100, coins: 250 } // Коштує ресурсів
    },

    // --- КАТЕГОРІЯ 2: КОРПУС (BODY) ---
    {
        id: 'nc1',
        name: 'Корпус',
        tier: 'I',
        desc: 'Стандартна алюмінієва оболонка для паливних баків.',
        x: 1000, y: 1250,
        req: null, owned: true, img: 'images/Korpus.png',
        rocketKey: 'body', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'h1',
        name: 'Сталевий Корпус',
        tier: 'II',
        desc: 'Базова основа ракети. Витримує більші навантаження.',
        x: 1400, y: 1250,
        req: 'nc1', owned: false, img: 'images/Korpus.png',
        rocketKey: 'body', level: 2,
        cost: { iron: 800, fuel: 50, coins: 400 } // Корпус вимагає багато заліза
    },

    // --- КАТЕГОРІЯ 3: ДВИГУН (ENGINE) ---
    {
        id: 'e1',
        name: 'Турбіна',
        tier: 'I',
        desc: 'Базовий насос для подачі паливної суміші в камеру згоряння.',
        x: 1000, y: 1500,
        req: null, owned: true, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'e2',
        name: 'Турбо-нагнітач',
        tier: 'II',
        desc: 'Подвійна система нагнітання для максимальної тяги двигуна.',
        x: 1400, y: 1500,
        req: 'e1', owned: false, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 2,
        cost: { iron: 400, fuel: 300, coins: 600 } // Двигун дорогий у грошах і паливі
    },

    // --- КАТЕГОРІЯ 4: КРИЛА (FINS) ---
    {
        id: 'a1',
        name: 'Надкрилки',
        tier: 'I',
        desc: 'Пасивні стабілізатори для стійкості ракети в польоті.',
        x: 1000, y: 1750,
        req: null, owned: true, img: 'images/Stabilizator.png',
        rocketKey: 'fins', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'a2',
        name: 'Активні закрилки',
        tier: 'II',
        desc: 'Рухомі елементи крил для точного маневрування при посадці.',
        x: 1400, y: 1750,
        req: 'a1', owned: false, img: 'images/Stabilizator.png',
        rocketKey: 'fins', level: 2,
        cost: { iron: 300, fuel: 150, coins: 350 }
    }
];

// --- DRAG LOGIC (Без змін) ---
viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node')) return;
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    viewport.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateCanvasPosition();
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
});

function updateCanvasPosition() {
    // 1. Параметри вашого полотна (з CSS .tree-canvas width/height)
    const CANVAS_SIZE = 3000; 
    
    // 2. Розміри вікна користувача
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 3. Розрахунок меж (Borders)
    // Дозволяємо "заїжджати" за край, але не далі ніж на 500px або пів екрана
    // min_x: це коли ми тягнемо вліво (бачимо правий край карти)
    const minX = -CANVAS_SIZE * scale + (viewportWidth * 0.2); // Залишаємо 20% екрана збоку
    
    // max_x: це коли ми тягнемо вправо (бачимо лівий край карти)
    const maxX = viewportWidth * 0.8; // Залишаємо 20% екрана з іншого боку

    const minY = -CANVAS_SIZE * scale + (viewportHeight * 0.2);
    const maxY = viewportHeight * 0.8;

    // 4. Застосовуємо обмеження (Clamping)
    if (currentX < minX) currentX = minX;
    if (currentX > maxX) currentX = maxX;
    if (currentY < minY) currentY = minY;
    if (currentY > maxY) currentY = maxY;

    // 5. Застосовуємо трансформацію
    canvas.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

async function syncWithSave() {
    const res = await fetch(`/api/get_upgrades?family_id=${window.userFamilyId}`);
    const unlocked = await res.json();
    treeNodes.forEach(node => {
        if (unlocked.includes(node.id)) node.owned = true;
    });
}
// --- INIT ---
function init() {
    // Спочатку оновлюємо дані з пам'яті
    syncWithSave();

    // 1. Малюємо ноди
    treeNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node';
        if (node.owned) div.classList.add('owned');
        div.id = `node-${node.id}`;
        canvas.style.transformOrigin = '0 0';
        
        // Позиціонування
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';

        const checkmarkHTML = node.owned ? '<span class="checkmark">✔</span>' : '';
        const imageSrc = node.img ? node.img : 'images/placeholder_icon.png';

        div.innerHTML = `
            <div class="node-img-box">
                <img src="${imageSrc}" class="node-icon" onerror="this.style.opacity=0">
            </div>
            <div class="node-tier">TIER ${node.tier}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-status">${checkmarkHTML}</div>
        `;
        
        div.onclick = (e) => {
            e.stopPropagation();
            highlightPath(node.id);
            openPanel(node);
        };
        canvas.appendChild(div);

        if (node.req) drawLine(node);
    });

    // 2. Центруємо екран
    centerViewport();

    // 3. --- НОВЕ: Додаємо слухач на кнопку в панелі ---
    const researchBtn = document.querySelector('.action-btn');
    if(researchBtn) {
        researchBtn.addEventListener('click', buyUpgrade);
    }
}

// --- ЛОГІКА ПОКУПКИ (НОВЕ) ---
async function buyUpgrade() {
    if (!selectedNode || selectedNode.owned) return;

    const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            family_id: window.userFamilyId,
            module_id: selectedNode.id,
            cost: selectedNode.cost,
            req: selectedNode.req
        })
    });
    
    const result = await res.json();
    if (result.success) {
        selectedNode.owned = true;
        init(); // перемалювати дерево
        alert(result.message);
    } else {
        alert("Помилка: " + result.error);
    }
}


function centerViewport() {
    const treeCenterX = 1300; 
    const treeCenterY = 1500;
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    currentX = screenCenterX - treeCenterX;
    currentY = screenCenterY - treeCenterY;
    updateCanvasPosition();
}

function drawLine(node) {
    const parent = treeNodes.find(n => n.id === node.req);
    if (!parent) return;

    const line = document.createElement('div');
    line.className = 'line';
    line.id = `line-${node.id}`;

    // Перевіряємо, чи батько куплений, щоб підсвітити лінію (опціонально)
    if (parent.owned && node.owned) {
        // line.classList.add('active-line'); // Можна додати в CSS стиль для active-line
    }

    const startX = parent.x + NODE_WIDTH;
    const startY = parent.y + NODE_HEIGHT / 2;
    const endX = node.x;
    const endY = node.y + NODE_HEIGHT / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    line.style.width = dist + 'px';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;

    canvas.appendChild(line);
}

function highlightPath(nodeId) {
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
    let currentId = nodeId;
    while (currentId) {
        document.getElementById(`node-${currentId}`)?.classList.add('highlight');
        document.getElementById(`line-${currentId}`)?.classList.add('highlight');
        const node = treeNodes.find(n => n.id === currentId);
        currentId = node ? node.req : null;
    }
}

function openPanel(node) {
    selectedNode = node; 

    // Заповнення текстами
    document.getElementById('node-name').innerText = node.name;
    document.getElementById('node-tier').innerText = `TIER ${node.tier}`;
    document.getElementById('node-desc').innerText = node.desc;
    
    const img = document.getElementById('node-image');
    img.src = node.img || 'images/modules/placeholder.png';

    // === ЛОГІКА ВІДОБРАЖЕННЯ ЦІНИ ===
    const costContainer = document.getElementById('node-cost');
    
    if (node.owned) {
        // Якщо куплено - пишемо "ВЖЕ ВСТАНОВЛЕНО" або просто ховаємо
        costContainer.innerHTML = '<div class="cost-owned-msg">ВЖЕ ВСТАНОВЛЕНО</div>';
        costContainer.classList.add('visible');
    } else {
        // Якщо не куплено - малюємо HTML з іконками та цінами
        // Перевіряємо, чи є об'єкт cost (для безпеки)
        const c = node.cost || { iron: 0, fuel: 0, coins: 0 };
        
        costContainer.innerHTML = `
            <div class="cost-cell">
                <span class="cost-icon">🔩</span>
                <span class="cost-value val-iron">${c.iron}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">💠</span>
                <span class="cost-value val-fuel">${c.fuel}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🪙</span>
                <span class="cost-value val-coin">${c.coins}</span>
            </div>
        `;
        costContainer.classList.add('visible');
    }

    // === КНОПКА ===
    const btn = document.querySelector('.action-btn');

    if (node.owned) {
        btn.textContent = 'В АНГАРІ';
        btn.classList.add('disabled');
        btn.disabled = true;
    } else {
        let parent = treeNodes.find(n => n.id === node.req);
        if (parent && !parent.owned) {
            btn.textContent = 'НЕМАЄ ДОСТУПУ';
            btn.classList.add('disabled');
            btn.disabled = true;
        } else {
            btn.textContent = 'ДОСЛІДИТИ';
            btn.classList.remove('disabled');
            btn.disabled = false;
        }
    }

    document.getElementById('info-panel').classList.add('active');
}

function closePanel() {
    document.getElementById('info-panel').classList.remove('active');
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
    selectedNode = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('dynamic-back-btn');
    const path = window.location.pathname; // Отримуємо поточну адресу
    
    // Об'єкт конфігурації: "де ми є" -> "куди йти"
    const routes = {
        'tree_Earth.html': { url: 'index.html', text: 'ГОЛОВНА' },
        'tree_Moon.html':  { url: 'Moon.html',  text: 'МІСЯЦЬ' },
        'tree_Mars.html':  { url: 'Mars.html',  text: 'МАРС' },
        'tree_Jupiter.html': { url: 'Jupiter.html', text: 'ЮПІТЕР' }
    };

    // Перевіряємо, який файл зараз відкрито
    for (const [key, route] of Object.entries(routes)) {
        if (path.includes(key)) {
            backBtn.href = route.url;
            backBtn.innerHTML = `<span class="arrow">‹</span> ${route.text}`;
            break; 
        }
    }
    
    // Якщо сторінка не знайдена в списку, ведемо на index.html за замовчуванням
    if (backBtn.getAttribute('href') === '#') {
        backBtn.href = 'index.html';
        backBtn.innerHTML = `<span class="arrow">‹</span> MENU`;
    }
});

// --- ЛОГІКА ЗУМУ КОЛЕСОМ ---
viewport.addEventListener('wheel', (e) => {
    e.preventDefault(); // Забороняємо прокрутку сторінки браузером

    const xs = (e.clientX - currentX) / scale;
    const ys = (e.clientY - currentY) / scale;

    const delta = -e.deltaY;
    
    // Обмежуємо швидкість зміни, щоб було плавно
    const factor = (delta > 0) ? 1.1 : 0.9;
    
    let newScale = scale * factor;

    // Обмеження мінімуму і максимуму
    if (newScale < MIN_SCALE) newScale = MIN_SCALE;
    if (newScale > MAX_SCALE) newScale = MAX_SCALE;

    // Математика, щоб зум був у точку курсора (cursor-centered zoom)
    currentX -= xs * (newScale - scale);
    currentY -= ys * (newScale - scale);
    scale = newScale;

    updateCanvasPosition();
}, { passive: false });

window.onload = init;