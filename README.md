# Intelligent Restaurant Management System (IRMS)

Service-based architecture with 4 Java Spring Boot services, 2 React frontends, and a single PostgreSQL instance with schema-level isolation.

## Prerequisites
- Docker Desktop (with Docker Compose v2)
- Java 17+ (for local development only)
- Node 18+ (for local frontend development only)

## Run the full stack

```bash
docker-compose up --build
```

| Service        | URL                        |
|----------------|----------------------------|
| Auth Service   | http://localhost:8081      |
| Menu Service   | http://localhost:8082      |
| Order Service  | http://localhost:8083      |
| Billing Service| http://localhost:8084      |
| PostgreSQL     | localhost:5432 / db: irms  |

Default admin credentials (seeded on first start):
- Username: `admin`
- Password: `admin123`

## Project structure

```
irms/
├── docker-compose.yml
├── infrastructure/
│   └── init-db.sql          # Creates schemas + DB users (runs once)
├── backend/
│   ├── auth-service/        # JWT auth, user management  (port 8081)
│   ├── menu-service/        # Menu & category CRUD       (port 8082)
│   ├── order-service/       # Orders, sessions, WebSocket(port 8083)
│   └── billing-service/     # Bills, payments            (port 8084)
└── frontend/
    ├── staff-app/           # Waiter / Chef / Manager SPA (port 3000)
    └── customer-app/        # Tablet view for customers   (port 3001)
```

## Run a single backend service locally

```bash
cd backend/auth-service
mvn spring-boot:run
```

Make sure PostgreSQL is running (via `docker-compose up postgres`).
