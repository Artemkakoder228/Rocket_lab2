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
    # Те саме для місій
    missions = db.get_expired_missions()
    if missions:
        print(f"Found expired missions: {missions}")

    for row in missions:
        fid, mid, lid, planet = row
        print(f"🚀 Завершуємо місію для сім'ї {fid}...")

        db.clear_mission_timer(fid)
        m = db.get_mission_by_id(mid)
        
        if not m:
            print(f"❌ Помилка: Місію ID {mid} не знайдено в БД!")
            continue
        else:
            # Успішна місія
            db.update_balance(fid, m[4])
            msg = f"✅ **МІСІЯ ЗАВЕРШЕНА!**\n💰 Прибуток: **{m[4]}**"

            # ЛОГІКА ВІДКРИТТЯ ПЛАНЕТ
            # m[6] - це is_boss_mission
            # m[5] - planet (звідки летіли)
            
            if m[6] and PLANET_NEXT.get(m[5]):
                next_p = PLANET_NEXT[m[5]]
                
                # Перевіряємо, чи вже відкрита ця планета
                unlocked = db.get_unlocked_planets(fid)
                
                if next_p not in unlocked:
                    # Розблоковуємо нову планету!
                    db.unlock_planet(fid, next_p)
                    
                    msg += (
                        f"\n\n🎉 **ВІДКРИТО НОВИЙ СЕКТОР!**\n"
                        f"Ви отримали координати планети **{next_p}**.\n"
                        f"Використовуйте меню '🚀 Навігація' для перельоту."
                    )
                else:
                    msg += "\n_(Цей маршрут вже розвідано)_"

            await notify(bot, fid, msg) # Визначаємо результат (успіх чи провал) - для тесту просто рандом