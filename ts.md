# Техническое Задание: Backend Онлайн-Магазина

> **Стек:** Node.js · Express · TypeScript (strict) · Prisma ORM · PostgreSQL · JWT · WebSockets (ws/socket.io)
> **Уровень:** Учебный / Pet-project (масштаб: бутиковый магазин типа Puma/ECCO)

***

## 1. Обзор проекта

Разработать RESTful API для онлайн-магазина одежды
- корзину и оформление заказов;
- аутентификацию и авторизацию (JWT);
- уведомления в реальном времени через WebSocket;
- административный раздел.

***

## 2. Технологический стек

| Слой | Технология |
|------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express 5 |
| Язык | TypeScript 5 (strict mode) |
| ORM | Prisma 5 |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT (access + refresh tokens) |
| Реальное время | Socket.IO или ws |
| Валидация | Zod |
| Пароли | bcrypt |
| Тестирование | Vitest + Supertest |
| Документация | OpenAPI 3.1 (Swagger UI) |
| Переменные окружения | dotenv + zod-env |

***

## 3. Структура проекта

```
shop-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── env.ts              # zod-валидация env
│   │   └── prisma.ts           # singleton клиент
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schemas.ts  # Zod schemas
│   │   ├── users/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── reviews/
│   │   └── admin/
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── websocket/
│   │   ├── ws.server.ts
│   │   └── events.ts
│   ├── types/
│   │   └── express.d.ts        # расширение Request
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── paginate.ts
│   └── app.ts
├── openapi/
│   └── openapi.yaml
├── .env.example
├── tsconfig.json
└── package.json
```

***

## 4. Модели данных (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
  REFUNDED
}

// ─── MODELS ──────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  firstName    String
  lastName     String
  role         Role     @default(CUSTOMER)
  isVerified   Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens RefreshToken[]
  cart          CartItem[]
  orders        Order[]
  reviews       Review[]
  addresses     Address[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  parentId    String?
  parent      Category?  @relation("SubCategories", fields: [parentId], references: [id])
  children    Category[] @relation("SubCategories")
  products    Product[]
  createdAt   DateTime   @default(now())
}

model Product {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String
  price       Decimal        @db.Decimal(10, 2)
  comparePrice Decimal?      @db.Decimal(10, 2)
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  isPublished Boolean        @default(false)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  variants    ProductVariant[]
  images      ProductImage[]
  cartItems   CartItem[]
  orderItems  OrderItem[]
  reviews     Review[]
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  size      String   // "XS", "S", "M", "L", "XL", "42", "43" и т.д.
  color     String
  sku       String   @unique
  stock     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cartItems  CartItem[]
  orderItems OrderItem[]
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  position  Int      @default(0)
}

model CartItem {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product        @relation(fields: [productId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([userId, variantId])
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName   String
  line1      String
  line2      String?
  city       String
  postalCode String
  country    String
  isDefault  Boolean @default(false)
  orders     Order[]
}

model Order {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  addressId     String
  address       Address       @relation(fields: [addressId], references: [id])
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(UNPAID)
  totalAmount   Decimal       @db.Decimal(10, 2)
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items OrderItem[]
}

model OrderItem {
  id        String         @id @default(cuid())
  orderId   String
  order     Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product        @relation(fields: [productId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  unitPrice Decimal        @db.Decimal(10, 2)
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  rating    Int      // 1-5
  body      String?
  isApproved Boolean @default(false)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}
```

***

## 5. Аутентификация (JWT — Access + Refresh Token)

### Схема

```
Client                          Server
  │                               │
  │──── POST /auth/register ──────▶│  создать User, вернуть tokens
  │◀─── { accessToken, refreshToken } ──│
  │                               │
  │──── POST /auth/login ─────────▶│  проверить пароль, вернуть tokens
  │◀─── { accessToken, refreshToken } ──│
  │                               │
  │  [accessToken истекает 15m]   │
  │──── POST /auth/refresh ───────▶│  проверить refreshToken в БД
  │◀─── { accessToken } ──────────│
  │                               │
  │──── POST /auth/logout ────────▶│  удалить refreshToken из БД
  │◀─── 204 No Content ───────────│
```

### Конфигурация токенов

| Параметр | Access Token | Refresh Token |
|----------|-------------|---------------|
| Алгоритм | HS256 | HS256 |
| Время жизни | 15 минут | 30 дней |
| Хранение | Memory / Authorization header | HttpOnly cookie или тело ответа |
| Хранение в БД | Нет | Да (таблица `RefreshToken`) |
| Payload | `{ sub, email, role }` | `{ sub }` |

### Реализация (заготовки)

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

export const signRefreshToken = (sub: string): string =>
  jwt.sign({ sub }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): { sub: string } =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
```

```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = payload; // расширить Express.Request через express.d.ts
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

export const requireRole = (role: 'ADMIN') =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
```

***

## 6. WebSocket — Уведомления в реальном времени

WebSocket используется для отправки клиенту уведомлений об изменении статуса заказа без polling'а.

### Сценарии использования

| Событие | Инициатор | Получатель |
|---------|-----------|-----------|
| Заказ подтверждён | Система / Admin | Клиент |
| Заказ отправлен | Admin | Клиент |
| Заказ доставлен | Admin | Клиент |
| Низкий остаток товара | Система | Admin |

### Реализация (Socket.IO)

```typescript
// src/websocket/ws.server.ts
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

export let io: SocketServer;

export const initWebSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Аутентификация WebSocket через JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication error'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.sub as string;
    // Каждый пользователь в своей комнате по userId
    socket.join(`user:${userId}`);
    console.log(`WS connected: ${userId}`);

    socket.on('disconnect', () => {
      console.log(`WS disconnected: ${userId}`);
    });
  });
};

// Вызов из любого сервиса:
// io.to(`user:${userId}`).emit('order:status_changed', { orderId, status });
```

```typescript
// src/websocket/events.ts

export const WsEvents = {
  ORDER_STATUS_CHANGED: 'order:status_changed',
  LOW_STOCK_ALERT: 'inventory:low_stock',
} as const;

export interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
  updatedAt: string;
}

export interface LowStockAlertPayload {
  productId: string;
  variantId: string;
  sku: string;
  stock: number;
}
```

***

## 7. API Endpoints

### Auth

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Вход |
| POST | `/api/auth/refresh` | — | Обновление access token |
| POST | `/api/auth/logout` | ✓ | Выход, удаление refresh token |
| GET  | `/api/auth/me` | ✓ | Текущий пользователь |

### Products & Categories

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| GET | `/api/categories` | — | Список категорий |
| GET | `/api/products` | — | Каталог с фильтрами (`?category=&minPrice=&maxPrice=&size=&color=&page=&limit=`) |
| GET | `/api/products/:slug` | — | Карточка товара |
| POST | `/api/products` | Admin | Создать товар |
| PATCH | `/api/products/:id` | Admin | Обновить товар |
| DELETE | `/api/products/:id` | Admin | Удалить товар |

### Cart

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| GET | `/api/cart` | ✓ | Получить корзину |
| POST | `/api/cart/items` | ✓ | Добавить в корзину |
| PATCH | `/api/cart/items/:variantId` | ✓ | Изменить количество |
| DELETE | `/api/cart/items/:variantId` | ✓ | Удалить из корзины |
| DELETE | `/api/cart` | ✓ | Очистить корзину |

### Orders

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| POST | `/api/orders` | ✓ | Создать заказ из корзины |
| GET | `/api/orders` | ✓ | История заказов пользователя |
| GET | `/api/orders/:id` | ✓ | Детали заказа |
| PATCH | `/api/orders/:id/status` | Admin | Изменить статус (→ WS событие) |

### Reviews

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| GET | `/api/products/:id/reviews` | — | Отзывы к товару |
| POST | `/api/products/:id/reviews` | ✓ | Оставить отзыв |
| PATCH | `/api/reviews/:id/approve` | Admin | Одобрить отзыв |
| DELETE | `/api/reviews/:id` | Admin | Удалить отзыв |

### Admin

| Метод | URL | Auth | Описание |
|-------|-----|------|---------|
| GET | `/api/admin/orders` | Admin | Все заказы с фильтрами |
| GET | `/api/admin/users` | Admin | Список пользователей |
| GET | `/api/admin/stats` | Admin | Сводная статистика |

***

## 8. Коды ответов и формат ошибок

```typescript
// Успешный ответ
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 148 }  // для списков
}

// Ошибка
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

| HTTP Code | Когда использовать |
|-----------|-------------------|
| 200 | GET успех |
| 201 | POST создание |
| 204 | Удаление / Logout |
| 400 | Ошибка валидации |
| 401 | Не аутентифицирован |
| 403 | Нет прав |
| 404 | Ресурс не найден |
| 409 | Конфликт (email уже занят) |
| 500 | Внутренняя ошибка сервера |

***

## 9. Переменные окружения

```env
# .env.example

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shop_db

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Bcrypt
BCRYPT_ROUNDS=12
```

***

## 10. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src", "prisma"],
  "exclude": ["node_modules", "dist"]
}
```

***

## 11. package.json (scripts)

```json
{
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts"
  }
}
```

***

## 12. Порядок реализации (рекомендуемый)

1. **Настройка проекта** — tsconfig, eslint, prettier, .env, Prisma init
2. **Prisma schema + миграция** — создать все модели, запустить `prisma migrate dev`
3. **Auth модуль** — register, login, refresh, logout, middleware
4. **Products + Categories** — CRUD с пагинацией и фильтрацией
5. **Cart** — добавление / изменение / удаление
6. **Orders** — создание заказа из корзины (транзакция Prisma), проверка стоков
7. **WebSocket** — подключение, аутентификация, эмит события при смене статуса заказа
8. **Reviews** — создание, модерация
9. **Admin routes** — статистика, управление заказами
10. **Swagger / OpenAPI** — документирование всех эндпоинтов
11. **Тесты** — интеграционные тесты ключевых маршрутов

***

## 13. Важные замечания

- **Транзакции при создании заказа:** использовать `prisma.$transaction([...])` для атомарного списания стоков и создания `Order` + `OrderItem`.
- **Строгая типизация:** все тела запросов и ответов проходят через Zod-схемы; никаких `any`.
- **Пагинация:** реализовать через `cursor` или `offset`; вынести в `utils/paginate.ts`.
- **Хранение изображений:** на уровне MVP — просто URL (можно хранить на Cloudinary/S3); загрузка файлов выходит за рамки данного ТЗ.
- **Платёжная система:** интеграция (Stripe/PayU) — за рамками, поле `paymentStatus` оставить для будущей реализации.