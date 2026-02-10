import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import BotCommand
from config import BOT_TOKEN
from handlers import navigation, start, family, mission, shop, mining, admin, games, pvp, bonus, webapp
import autocheck
import threading
from server import run_flask

logging.basicConfig(level=logging.INFO)

async def main():

    threading.Thread(target=run_flask, daemon=True).start()

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    # Підключення роутерів
    dp.include_router(start.router)
    dp.include_router(family.router)
    dp.include_router(mission.router)
    dp.include_router(shop.router)
    dp.include_router(mining.router)
    dp.include_router(admin.router)
    dp.include_router(games.router)
    dp.include_router(pvp.router)
    dp.include_router(bonus.router)
    dp.include_router(webapp.router)
    dp.include_router(navigation.router)

    # Меню команд
    commands = [
        BotCommand(command="start", description="🖥 Головний термінал"),
        BotCommand(command="help", description="📘 Інструкція пілота"),
    ]
    await bot.set_my_commands(commands)

    # Запуск фонового процесу (перевірка таймерів)
    asyncio.create_task(autocheck.start_autocheck(bot))

    print("✅ SYSTEM ONLINE: Rocket Lab Bot is running...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 SYSTEM SHUTDOWN")