# MenClub Main App — approved V2 clickable prototype

Date: 2026-08-01
Status: assembled from the screen directions approved in the working session.

## Included screens

1. Главная
2. Лёва ИИ
3. Мероприятия
4. Путь with lessons integrated
5. Виджеты
6. Профиль
   - Мой кабинет
   - Публичный профиль

## Interaction coverage

- six-tab navigation;
- highlighted Lyova control;
- home deep links;
- Lyova quick actions and mock chat input;
- event filters, cards, registration and cancellation states;
- spheres, lessons and progress actions inside Path;
- widget edit mode, size/order/visibility actions and widget gallery entry;
- profile mode switching and version switch entry;
- modal sheets and feedback toasts.

## Safety boundary

- prototype only;
- production `index.html` unchanged;
- no Firebase or Telegram SDK;
- no Firestore reads or writes;
- no localStorage;
- V1 stable remains active by default through `versions/active.json`;
- no GitHub Actions.

## Validation

- extracted JavaScript passed `node --check` locally before publication.
