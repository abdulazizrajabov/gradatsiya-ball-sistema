Вся информация разбита на разделы:

1. **Общая концепция**  
2. **Структура базы данных (ER-модель)**  
3. **Описание основных таблиц**  
4. **Логика бэкенда и основные эндпоинты**  
5. **Дополнительные аспекты (офлайн, логи, версия приложения, мультиязычность)**  

---

# 1. Общая концепция

Система включает:
- **Мобильное приложение** (Android/iOS), где торговые агенты:
  - Добавляют новые аптеки, мед. учреждения (однако фото — только с камеры, без выбора из галереи).  
  - Вводят остатки препаратов (stock logs).  
  - Отмечают визиты к врачам.  
  - Работают офлайн при отсутствии сети (данные сохраняются локально и отправляются при появлении интернета).

- **Веб-админ-панель**, где разные администраторы (супер-админ, админ, региональные) управляют данными:
  - **Подтверждают** (или отклоняют) новые аптеки, мед. учреждения.  
  - **Управляют** пользователями (агентами и другими админами), привязанными к регионам/районам.  
  - Просматривают системные логи (журнал событий).  
  - Настраивают базовые параметры в таблице `constants`.  
  - Имеют доступ к справочнику препаратов, врачей и т.д.  

**Роли**:
- **Супер-админ**: видит все регионы, управляет всем функционалом, может создавать других админов.  
- **Админ**: скорее всего «общесистемный», но с меньшими правами, чем супер-админ.  
- **Региональный админ**: привязан к одному или нескольким районам (districts). Видит объекты (аптеки, учреждения, агентов) только по этим районам.

**Примечание**: Агенты (role = `agent`) тоже хранятся в таблице `users`, просто с особым значением поля `role`.

---

# 2. Структура базы данных (ER-модель, кратко)

Ниже — примерная схема (упрощённый ER-скелет).  
Названия полей и типов даны как ориентир; вы можете скорректировать под конкретную СУБД и требования.

```
            ┌───────────────────┐
            │   regions         │
            │ ─────────────     │
            │ id (PK)           │
            │ name              │
            └───────────────────┘
                     1
                     │
                     │
                     *  
            ┌───────────────────┐
            │   districts       │
            │ ─────────────     │
            │ id (PK)           │
            │ region_id (FK)    │
            │ name              │
            └───────────────────┘
                    *  
                    │  
                    │ m..n (через связку)
┌───────────────────┐        
│   users           │        
│ ─────────────     │        
│ id (PK)           │        
│ phone             │        
│ password          │        
│ role              │ (super_admin|admin|regional|agent)        
│ name              │ (ФИО или короткое имя)        
└───────────────────┘        
                    ┌──────────────────────────────┐
                    │   users_districts (link)     │
                    │ ───────────────────────────   │
                    │ user_id (FK -> users)        │
                    │ district_id (FK -> districts)│
                    └──────────────────────────────┘

┌─────────────────────────┐
│ pharmacies              │
│ ─────────────────────    │
│ id (PK)                 │
│ name                    │
│ inn                     │
│ district_id (FK)        │
│ lat, lng                │
│ photo_url               │ (путь к загруженному фото)
│ status                  │ (0=на рассмотрении,1=подтверждена...)
│ created_by (FK->users)  │
│ created_at              │
└─────────────────────────┘

┌─────────────────────────┐
│ med_institutions        │
│ ─────────────────────    │
│ id (PK)                 │
│ name                    │
│ district_id (FK)        │
│ lat, lng                │
│ status                  │
│ created_by (FK->users)  │
│ created_at              │
└─────────────────────────┘

┌─────────────────────────────────────────┐
│ doctors                                │
│ ────────────────────────────────────    │
│ id (PK)                               │
│ med_institution_id (FK)              │
│ fio                                   │
│ place_of_work (2ое место работы?)     │
│ position                              │ (должность)
│ specialization                        │
│ phone                                 │
└─────────────────────────────────────────┘

┌─────────────────────────┐
│ drugs                   │
│ ─────────────────────    │
│ id (PK)                 │
│ name                    │
│ ...                     │ (дозировка, форма и т.д. при необходимости)
└─────────────────────────┘

┌────────────────────────────────────────────────┐
│ stock_logs (шапка)                            │
│ ───────────────────────────────────────────     │
│ id (PK)                                       │
│ pharmacy_id (FK->pharmacies)                  │
│ user_id (FK->users)                           │ (агент)
│ created_at                                    │
│ lat_submitted, lng_submitted (факт гео точки) │
└────────────────────────────────────────────────┘
      1
      │
      │
      *
┌────────────────────────────────────────────────┐
│ stock_log_details                              │
│ ───────────────────────────────────────────     │
│ id (PK)                                       │
│ stock_log_id (FK->stock_logs)                 │
│ drug_id (FK->drugs)                           │
│ quantity (int)                                │
└────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ visits                                 │
│ ───────────────────────────────────     │
│ id (PK)                                │
│ doctor_id (FK->doctors)               │
│ user_id (FK->users)                   │ (агент)
│ created_at                            │
└─────────────────────────────────────────┘

┌─────────────────────────┐
│ logs (системный журнал) │
│ ─────────────────────    │
│ id (PK)                 │
│ user_id (FK->users)     │ (кто совершил)
│ entity                  │ ('pharmacy','med_institution','user' и т.д.)
│ entity_id               │ 
│ action                  │ ('create','update','delete','approve','login' etc.)
│ created_at              │
└─────────────────────────┘

┌────────────────────────────────────┐
│ constants                         │
│ ───────────────────────────────    │
│ id (PK)                           │
│ key (varchar)                     │ (например, 'android_app_version')
│ value (text)                      │ (например, '2.0.1')
│ comment (опц.)                    │ (описание параметра)
└────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ translates                            │
│ ───────────────────────────────────     │
│ id (PK)                                │
│ lang (enum: 'ru','uz')                │
│ key (varchar)                         │ (например, 'APP_TITLE')
│ value (text)                          │ (перевод)
└─────────────────────────────────────────┘
```

**Примечания по таблицам**:

1. **users_districts**: связывающая таблица (многие ко многим), так как **один пользователь** (особенно региональный админ) может быть привязан к нескольким районам.  
2. **pharmacies** / **med_institutions** имеют поле `status`, отражающее подтверждение от администратора (0 — «на рассмотрении», 1 — «подтверждена»).  
3. **stock_logs** / **stock_log_details**: чтобы учитывать набор препаратов (с количеством) за один ввод.  
4. **visits**: одна запись — один визит к конкретному врачу.  
5. **logs**: общий журнал, куда пишем самые важные действия (создание, подтверждение и т.д.).  
6. **constants**: таблица для хранения ключ-значение. Сюда можно записать версию приложения, лимиты, и другие конфигурационные параметры.  
7. **translates**: для мультиязычности (русский/узбекский). Содержит пары (key, value) для каждой локали.

---

# 3. Описание основных таблиц

Ниже — детальнее о ключевых таблицах (минимальный набор полей).

### 3.1. Таблица `users`
- **id** (PK)  
- **phone** (уникальный)  
- **password** (хранить хэш)  
- **role** (enum: `super_admin|admin|regional|agent`)  
- **name** (ФИО или краткое имя)  
- **created_at**, **updated_at** (Timestamp)

### 3.2. Таблица `districts`
- **id** (PK)  
- **region_id** (FK -> `regions.id`)  
- **name** (Название района)  

### 3.3. Таблица `users_districts` (связка)
- **user_id** (FK -> `users.id`)  
- **district_id** (FK -> `districts.id`)  
*(PK может быть составным по этим двум полям.)*

### 3.4. Таблица `pharmacies`
- **id** (PK)  
- **name**  
- **inn**  
- **district_id** (FK -> `districts.id`)  
- **lat**, **lng** (координаты)  
- **photo_url** (строка: путь к файлу)  
- **status** (int: 0 — ожидает подтверждения, 1 — подтверждено)  
- **created_by** (FK -> `users.id`)  
- **created_at** (Timestamp)

### 3.5. Таблица `med_institutions`
- **id** (PK)  
- **name**  
- **district_id** (FK -> `districts.id`)  
- **lat**, **lng**  
- **status** (0 / 1)  
- **created_by**, **created_at**

### 3.6. Таблица `doctors`
- **id** (PK)  
- **med_institution_id** (FK -> `med_institutions.id`)  
- **fio**  
- **place_of_work** (2-е место работы)  
- **position** (должность)  
- **specialization**  
- **phone**  

### 3.7. Таблица `drugs`
(Справочник препаратов)
- **id** (PK)  
- **name**  
- **additional fields** (форма, дозировка и т.д. на ваше усмотрение)

### 3.8. Таблица `stock_logs` (шапка остатков)
- **id** (PK)  
- **pharmacy_id** (FK -> `pharmacies.id`)  
- **user_id** (FK -> `users.id`) (агент, кто вносил)  
- **lat_submitted**, **lng_submitted** (фактическая точка отправки)  
- **created_at** (Timestamp)

### 3.9. Таблица `stock_log_details` (строки остатков)
- **id** (PK)  
- **stock_log_id** (FK -> `stock_logs.id`)  
- **drug_id** (FK -> `drugs.id`)  
- **quantity** (int)  

### 3.10. Таблица `visits`
- **id** (PK)  
- **doctor_id** (FK -> `doctors.id`)  
- **user_id** (FK -> `users.id`) (агент)  
- **created_at** (Timestamp)

### 3.11. Таблица `logs` (журнал событий)
- **id** (PK)  
- **user_id** (FK -> `users.id`) (кто произвёл действие)  
- **entity** (varchar) (например, 'pharmacy','user','doctor','login' и т.д.)  
- **entity_id** (может быть NULL, если действие общего характера, например, логин)  
- **action** (varchar) (например, 'create','update','delete','approve','reject')  
- **created_at** (Timestamp)

### 3.12. Таблица `constants`
- **id** (PK)  
- **key** (varchar)  
- **value** (text)  
- **comment** (опционально)  

*(Сюда записываем, к примеру, android_app_version, ios_app_version, force_update, а также лимиты и проч.)*

### 3.13. Таблица `translates`
- **id** (PK)  
- **lang** (enum: 'ru','uz')  
- **key** (varchar)  
- **value** (text)

---

# 4. Логика бэкенда и основные эндпоинты

Ниже — список **базовых API-методов**, которые понадобятся для мобильного приложения и админ-панели. Формат: `METHOD /endpoint`.

## 4.1. Аутентификация

1. `POST /auth/login`  
   - Вход по номеру телефона и паролю/коду. Возвращает токен (JWT, например).  
2. `POST /auth/logout`  
   - Инвалидирует текущий токен (опционально).

*(Процесс SMS-кода можно встроить по аналогии, если нужно.)*

## 4.2. Управление пользователями

1. `GET /users`  
   - Список пользователей с фильтрацией по роли, региону/району. Доступно только админам.  
2. `POST /users`  
   - Создание пользователя (указать роль, телефон, пароль, районы). Доступно админам.  
3. `GET /users/{id}`  
   - Просмотр конкретного пользователя.  
4. `PUT /users/{id}`  
   - Редактирование пользователя (сменить район, роль, имя...).  
5. `DELETE /users/{id}`  
   - Удаление (или деактивация).

Также может потребоваться эндпоинт:
- `POST /users/{id}/districts` (или `PUT`) — привязать к дополнительным районам.

## 4.3. Справочник районов/регионов

1. `GET /regions`  
   - Список регионов.  
2. `GET /regions/{id}/districts`  
   - Список районов внутри региона.  
3. `GET /districts`  
   - Можно вернуть все районы (либо отдельно с фильтром region_id).  

*(Создание/редактирование регионов, районов — либо статично, либо тоже через админ-панель.)*

## 4.4. Аптеки

1. `GET /pharmacies`  
   - Список аптек (с учётом района/региональных прав).  
   - Параметры фильтра: `district_id`, `status`.  
2. `POST /pharmacies`  
   - Добавление новой аптеки (данные + фото).  
   - Сохранение фото на сервере, запись `photo_url`.  
   - `status` = 0 (на рассмотрении).  
3. `GET /pharmacies/{id}`  
   - Детали аптеки.  
4. `PUT /pharmacies/{id}`  
   - Редактирование аптеки (только для админов).  
5. `PATCH /pharmacies/{id}/approve`  
   - Подтверждение аптеки (статус = 1).  
6. `DELETE /pharmacies/{id}`  
   - Удаление (по требованию, возможно мягкое удаление).

## 4.5. Мед. учреждения + Врачи

Аналогичные эндпоинты:
- `GET /med_institutions` (список)  
- `POST /med_institutions` (создать, статус=0)  
- `PATCH /med_institutions/{id}/approve` (подтвердить)  
- `GET /doctors` (список по учреждению)  
- `POST /doctors` (добавить доктора)  
- … и т.д.

Врачи не требуют подтверждения (по уточнению) или могут тоже иметь поле «status».

## 4.6. Препараты (drugs)

- `GET /drugs` (список)  
- `POST /drugs` (создать) — только админ.  
- `PUT /drugs/{id}` (редактирование)  
- `DELETE /drugs/{id}` (удаление)

## 4.7. Остатки (Stock logs)

1. `POST /stock_logs`  
   - Создание одной записи «шапки» + массива «строк» (details).  
   - Проверить геолокацию (на стороне бэкенда) — вычислить расстояние до аптеки, если > 50 м, вернуть ошибку.  
   - Сохранить `lat_submitted`, `lng_submitted`.  
2. `GET /stock_logs`  
   - Список логов (фильтр по user_id, pharmacy_id, дате и т.д.).  
3. `GET /stock_logs/{id}`  
   - Детали (включая `stock_log_details`).

## 4.8. Визиты (visits)

1. `POST /visits`  
   - Создание записи (user_id, doctor_id).  
2. `GET /visits`  
   - Список визитов (фильтр по user_id, doctor_id, дате).  
3. `GET /visits/{id}`  
   - Подробности.

## 4.9. Логи (journal events)

1. `GET /logs`  
   - Список логов с фильтром по `entity`, `action`, `user_id`, дате.  
2. `GET /logs/{id}`  
   - Детали по конкретному логу (при необходимости).

*(Запись в `logs` происходит автоматически при важных действиях, например, CREATE/UPDATE/APPROVE.)*

## 4.10. Константы (constants)

- `GET /constants` — получить список всех ключей/значений (для админ-панели).  
- `PUT /constants/{id}` — изменить значение (например, обновить версию приложения).  
- Мобильное приложение может дергать `GET /constants` (или специально `GET /constants/{key}`), чтобы узнать актуальную версию.

## 4.11. Переводы (translates)

- `GET /translates?lang=ru` (вернёт все пары key-value для нужного языка).  
- `POST /translates` / `PUT /translates/{id}` — добавлять/править переводы.  
- Используется для многоязычности в мобильном клиенте или веб-интерфейсе.

---

# 5. Дополнительные аспекты

## 5.1. Офлайн-режим

- **Механизм**:  
  - На мобильном клиенте (внутренняя БД, например SQLite) сохраняется ввод (новые аптеки, stock_logs, visits) при отсутствии сети.  
  - При появлении сети клиент вызывает нужные эндпоинты (`POST /pharmacies`, `POST /stock_logs`, `POST /visits`) и отправляет данные.  
- **На бэкенде**:  
  - Приходит обычный `POST`, разницы нет. Только надо не ломаться, если созданная запись содержит старые timestamp.  
  - Конфликтов версий не обрабатываем, по ТЗ не требуется.

## 5.2. Журнал событий (logs)

- При любом важном действии (создание аптеки, подтверждение, вход в систему) делаем запись в `logs`.  
- В админ-панели есть страница «Журнал событий», где по фильтру видны нужные записи.

## 5.3. Версия приложения

- В `constants` можно хранить, например, записи:  
  - (`android_app_version`, `2.0.0`), (`ios_app_version`, `2.0.0`), (`force_update`, `true/false`).  
- При запуске мобильное приложение проверяет через API текущее значение. Если версия ниже, чем `android_app_version`, предлагает обновиться.

## 5.4. Мультиязычность (русский/узбекский)

- В таблице `translates` лежат все текстовые константы. Ключ: `'APP_TITLE'`, lang: `'ru'`, value: `'Название приложения'`.  
- Мобильный клиент может подгружать эти переводы при старте.  
- Аналогично и веб-админка.
