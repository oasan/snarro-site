# Сайт Snarro

Статическая страница: `index.html` и картинки в `assets/`. Сборки нет, подходит любой хостинг.

## Скриншоты

Скриншоты окон сняты с настоящего приложения:

1. `tools/fixtures/*.html` — демо-экраны. Рендер в PNG @2x через Chrome:
   `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1040,600 --screenshot=$PWD/tools/fixtures/orders.png file://$PWD/tools/fixtures/orders.html` (для `account.html` — 820,520).
2. `tools/demo-shots.patch` — временный DEBUG-хук для приложения. Применить в `app_src/macos` (`git apply`), выполнить `xcodegen generate` и собрать, затем запустить
   `SNARRO_DEMO_DIR=<путь к site_src/tools> .../Snarro.app/Contents/MacOS/Snarro`.
   Приложение откроет редактор и настройки с демо-аннотациями, снимет окна в `tools/shots/` и закроется. Настройки пользователя не трогает. После съёмки откатить патч.
3. Обрезка и WebP — Python + Pillow (поля вокруг окна: 72 px по бокам, 48 сверху, 120 снизу).

## Проверка

`node tools/preview.mjs <папка> 1440x900 light 0 '#tools'` — скриншоты страницы в нужных местах прокрутки через Chrome DevTools, плюс проверка горизонтальной прокрутки.
