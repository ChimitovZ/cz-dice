# Деплой

- Для выкладки `cz-dice` используй навык [ruvds-vps](C:/Users/Himeko/.agents/skills/ruvds-vps/SKILL.md). Хост, SSH-ключ и ограничения бери из файлов `host.md` и `layout.md` навыка.
- Загружай исходники из коммита в `/opt/dice`. На сервере выполни `npm ci --no-audit --no-fund` и `npm run build`, затем скопируй содержимое `dist/` в `/var/www/dice/`.
- После выкладки проверь страницу и файлы сборки по адресу [chimitovz.ru/dice](https://chimitovz.ru/dice/).
