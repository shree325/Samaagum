# Samaagum Full-Stack Monorepo

This repository is structured as a full-stack project, containing both the backend layered monolith server and the frontend client workspace.

---

## 🏗️ Repository Structure

```
samaagum/
├── server/                    # Backend layered monolith
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts    # Shared PostgreSQL connection pool
│   │   ├── db/                # PostgreSQL SQL schemas & migrations (intern task)
│   │   ├── repositories/      # Database query repository classes (intern task)
│   │   ├── services/          # Business logic services (intern task)
│   │   ├── controllers/       # HTTP/Express route controllers (intern task)
│   │   └── index.ts           # Server entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md              # Detailed Server setup guide
│
└── client/                    # Frontend client application workspace
    └── README.md
```

---

## 🚀 Getting Started

- For setting up the **Database**, **Environment Variables**, and running the **Backend Server**, please check:
  👉 **[Server Getting Started Guide](./server/README.md)**

- For the **Frontend Client**, please check:
  👉 **[Client README](./client/README.md)**
