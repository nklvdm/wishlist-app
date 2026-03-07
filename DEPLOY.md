# 🚀 Деплой Wishlist на Railway — пошаговый план

## Шаг 1 — Подготовка локально (5 мин)

Открой терминал (Win+R → cmd или PowerShell) в папке проекта:

```bash
# Установи зависимости
npm install

# Скопируй файл с переменными
copy .env.example .env.local
```

Создай секрет для NextAuth. В PowerShell:
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Скопируй результат — это твой NEXTAUTH_SECRET.

---

## Шаг 2 — GitHub (3 мин)

1. Зайди на https://github.com и создай новый репозиторий (назови wishlist-app, Private)
2. Не добавляй README или .gitignore (они уже есть)
3. Выполни в терминале в папке проекта:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЮЗЕРНЕЙМ/wishlist-app.git
git push -u origin main
```

---

## Шаг 3 — Railway (10 мин)

1. Зайди на https://railway.app и зарегистрируйся через GitHub
2. Нажми **New Project → Deploy from GitHub repo**
3. Выбери wishlist-app
4. Railway начнёт деплой — подожди 1-2 минуты, он упадёт (нет БД и переменных)

### Добавь PostgreSQL:
5. В проекте нажми **+ New → Database → Add PostgreSQL**
6. Кликни на Postgres → вкладка **Connect** → скопируй **DATABASE_URL**

### Добавь переменные окружения:
7. Кликни на сервис wishlist-app → вкладка **Variables**
8. Добавь по одной:

| Переменная | Значение |
|-----------|---------|
| DATABASE_URL | (из шага 6) |
| NEXTAUTH_SECRET | (из шага 1) |
| NEXTAUTH_URL | https://ТВОЙ_ДОМЕН.railway.app |
| GOOGLE_CLIENT_ID | (из шага 4 ниже) |
| GOOGLE_CLIENT_SECRET | (из шага 4 ниже) |

---

## Шаг 4 — Google OAuth (10 мин)

1. Зайди на https://console.cloud.google.com
2. Создай новый проект (или используй существующий)
3. Слева: **APIs & Services → OAuth consent screen**
   - User Type: External → Create
   - App name: Wishlist, Support email: твой email → Save
4. Слева: **Credentials → Create Credentials → OAuth client ID**
   - Application type: Web application
   - Authorized redirect URIs: `https://ТВОЙ_ДОМЕН.railway.app/api/auth/callback/google`
   - Нажми Create
5. Скопируй Client ID и Client Secret → добавь в Railway Variables

---

## Шаг 5 — Финальный деплой

После добавления всех переменных Railway автоматически передеплоит.

Проверь в логах что появилось:
```
✓ Ready in Xs
```

Открой `https://ТВОЙ_ДОМЕН.railway.app` — готово! 🎉

---

## Если что-то пошло не так

**Ошибка "PrismaClientInitializationError"**
→ DATABASE_URL неправильный, проверь что скопировал полностью

**Google OAuth не работает**
→ Проверь что redirect URI точно совпадает с NEXTAUTH_URL

**Сайт не открывается**
→ Проверь вкладку Deployments в Railway — там будут логи ошибок

---

## Локальная разработка (опционально)

Если хочешь тестировать локально перед деплоем:

```bash
# Нужен локальный PostgreSQL или можно использовать Railway PostgreSQL
# Заполни .env.local с DATABASE_URL от Railway

npx prisma db push    # создаст таблицы
npm run dev           # запустит на http://localhost:3000
```
