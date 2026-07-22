# MockInterview Platform — Design Spec

**Date:** 2026-07-21
**Status:** Draft

## Purpose

Платформа для подготовки к техническим собеседованиям с поиском напарника, трекингом прогресса и Discord-интеграцией.

## Stack

- **Frontend:** Next.js (TypeScript, Tailwind), deploy on Vercel
- **Backend:** Phoenix (Elixir), REST API
- **DB:** PostgreSQL (Ecto)
- **Auth:** Discord OAuth
- **Integrations:** Discord Webhooks (уведомления)

## Data Model

### User
- `discord_id` — уникальный ID из Discord
- `username` — отображаемое имя
- `avatar` — URL аватара
- `role` — `interviewer | interviewee | both` (выбирается при первой регистрации)
- `rating` — средняя оценка от напарников
- `stats` — общая статистика (количество сессий, по ролям, по темам)

### Topic
- `name` — название
- `category` — `Algorithms | System Design | SQL | ...`
- `icon` — иконка
- `description` — описание

### Question
- `topic_id` — связь с темой
- `level` — `junior | middle | senior`
- `text` — текст вопроса
- `tags` — массив тегов
- `author_id` — кто добавил

### BoardEntry (доска объявлений)
- `author_id` — создатель
- `topic_id` — тема собеса
- `looking_for` — `interviewer | interviewee` (кого ищет)
- `time_slot` — предложенное время
- `description` — доп. информация
- `status` — `open | closed`

### Session
- `initiator_id` — кто инициировал
- `partner_id` — напарник
- `topic_id` — тема
- `scheduled_at` — запланированное время
- `status` — `pending | matched | in_progress | completed | cancelled`

### Feedback
- `reviewer_id` — кто оставил
- `session_id` — ссылка на сессию
- `rating` — 1–5
- `comment` — текстовый комментарий

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/discord` | Redirect to Discord OAuth |
| GET | `/auth/discord/callback` | OAuth callback |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users/:id` | Public profile |
| GET/POST | `/api/topics` | List / create topic |
| GET | `/api/topics/:id` | Topic details |
| DELETE | `/api/topics/:id` | Delete topic |
| GET | `/api/topics/:id/questions` | Questions by topic |
| POST | `/api/questions` | Create question |
| DELETE | `/api/questions/:id` | Delete question |
| GET/POST | `/api/board` | List / create board entry |
| POST | `/api/board/:id/apply` | Apply to entry |
| DELETE | `/api/board/:id` | Delete board entry |
| GET/POST | `/api/sessions` | List / create session |
| PATCH | `/api/sessions/:id/status` | Change session status |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/sessions/:id/feedback` | Leave feedback |
| GET | `/api/stats/me` | My stats |

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/callback` | OAuth callback handler |
| `/onboarding` | Role selection (first login) |
| `/dashboard` | Stats & recent sessions |
| `/topics` | Topics & questions browser |
| `/board` | Bulletin board (create / apply) |
| `/sessions` | My sessions with filters |
| `/sessions/:id` | Session details + feedback form |
| `/profile/:id` | Public user profile |
| `/admin` | Admin panel (CRUD questions) |

## Discord Integration

### OAuth
- Вход через Discord OAuth2
- Запрашиваемые scope: `identify`
- При первом входе — страница выбора роли

### Webhooks
- События для уведомлений в Discord-канал:
  - Новое объявление на доске
  - Кто-то откликнулся на объявление (мэтч)
  - Смена статуса сессии (in_progress → completed и т.д.)
  - Завершение собеса + ссылка на фидбек

## MVP Flow

1. User входит через Discord → выбирает роль (interviewer / interviewee / both)
2. Создаёт объявление на /board: тема, кого ищет, время, описание
3. Другой user откликается → статус меняется на matched → уведомление в Discord
4. Пара связывается в Discord (голос/видео — вне платформы)
5. Проводят собес
6. После собеса каждый заполняет фидбек на странице сессии
7. Статистика и рейтинг обновляются

## Future (post-MVP)

- Поиск напарника по алгоритму (match по уровню и слоту)
- Роли модераторов контента
- Система достижений
- Календарь и планировщик
- Другие категории собесов (HR, behavioral)
