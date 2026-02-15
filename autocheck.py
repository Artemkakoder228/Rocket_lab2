import asyncio
import random
from database import Database
from aiogram import Bot

# Ланцюжок планет
PLANET_NEXT = {"Earth": "Moon", "Moon": "Mars", "Mars": "Jupiter", "Jupiter": "Earth"}
db = Database('space.db')

async def start_autocheck(bot: Bot):
    print("✅ Autocheck: Запущено фоновий процес...")
    while True:
        try:
            # Для тесту часта перевірка (кожні 5 сек)
            await check_upg(bot)
            await check_mis(bot)
            # await check_base_events(bot) # Поки вимкнемо події, щоб не заважали
        except Exception as e:
            print(f"❌ CRITICAL ERROR in Autocheck: {e}")
        
        await asyncio.sleep(5) 


async def notify(bot: Bot, fid, txt):
    # Отримуємо ID користувачів
    users = db.get_family_user_ids(fid)
    print(f"📢 Спроба сповіщення сім'ї ID={fid}. Знайдено користувачів: {users}")
    
    if not users:
        print(f"⚠️ Увага: У сім'ї {fid} немає користувачів для сповіщення!")
        return

    for uid in users:
        try:
            await bot.send_message(uid, txt, parse_mode="Markdown")
            print(f"✅ Повідомлення надіслано користувачу {uid}")
        except Exception as e:
            print(f"❌ Не вдалося надіслати повідомлення {uid}. Причина: {e}")


async def check_upg(bot):
    # Отримуємо список сімей, де таймер вийшов
    upgrades = db.get_expired_upgrades()
    
    if upgrades:
        print(f"Found expired upgrades: {upgrades}") # Покаже, чи знаходить база записи

    for row in upgrades:
        fid = row[0]
        print(f"🔧 Завершуємо покращення для сім'ї {fid}...")
        
        # 1. Завершуємо в БД
        db.finish_upgrade(fid)
        
        # 2. Надсилаємо сповіщення
        await notify(bot, fid, "🏭 **БУДІВНИЦТВО ЗАВЕРШЕНО!**\nШахту успішно модернізовано.")


async def check_mis(bot):
    missions = db.get_expired_missions()
    for row in missions:
        fid, mid, lid, planet = row
        db.clear_mission_timer(fid)
        
        m_data = db.get_mission_by_id(mid)
        # Припустимо, req_stat_type це індекс 12, а req_stat_value індекс 13 (перевірте порядок у DB)
        req_type = m_data[12]
        req_val = m_data[13]
        reward = m_data[4]

        ship_stats = db.get_ship_total_stats(fid)
        current_val = ship_stats.get(req_type, 0)
        
        diff = req_val - current_val
        success = True
        
        if diff > 0:
            # Логіка ризику: якщо не вистачає статів
            fail_chance = 0
            if diff <= 50: fail_chance = 20
            elif diff <= 100: fail_chance = 50
            else: fail_chance = 90 # Провал, якщо різниця > 100

            if random.randint(1, 100) <= fail_chance:
                success = False

        if success:
            db.update_balance(fid, reward)
            msg = f"✅ **МІСІЯ УСПІШНА!**\n💰 Нагорода: {reward} монет."
            # ... логіка відкриття планет
        else:
            msg = f"💥 **КАТАСТРОФА!**\nКорабель не витримав навантаження ({req_type}: {current_val}/{req_val}). Місію провалено."
        
        await notify(bot, fid, msg)