# SyndiQA — Backend

Spring Boot 3.4.3 · Java 17 · Spring Security + JWT · Spring Data MongoDB · Maven.

See the [root README](../README.md) for full setup. Quick reference below.

## Run

```bash
# needs a MongoDB on localhost:27017 (default "local" profile)
./mvnw spring-boot:run          # Windows: mvnw spring-boot:run
```

API on `http://localhost:8089`. Uploaded files are served from `/uploads/**`.

## Profiles

| Profile | Database | Activate with |
|---|---|---|
| `local` *(default)* | `mongodb://localhost:27017/cloud4saya_db` | — |
| `dev` | MongoDB Atlas | `SPRING_PROFILES_ACTIVE=dev` + `MONGODB_URI` |
| `prod` | MongoDB Atlas | `SPRING_PROFILES_ACTIVE=prod` + env vars |

`dev` and `prod` pull in the `atlas` profile group, which enables the relaxed-TLS
Mongo client in `config/MongoConfig.java`.

## Layout

```
src/main/java/tn/esprit/pidev/
├── config/        # CORS, Mongo, cache, async, web-mvc, monitoring aspect
├── controllers/   # REST controllers, grouped by domain
├── dto/           # request/response models
├── entities/      # @Document models
├── enums/
├── events/        # application events
├── exception/     # global handlers
├── repositories/  # Spring Data Mongo repositories
├── security/      # JWT filter, RBAC guards, org-isolation interceptor
└── services/      # business logic (incl. optional AI integrations)
```

## Configuration

All sensitive values are read from environment variables — see `.env.example`
at the repo root. Nothing secret is committed.

## Tests

```bash
./mvnw test
```
