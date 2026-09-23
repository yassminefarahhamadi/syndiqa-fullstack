# CLOUD4SAYA — convenience targets (Linux / macOS)
# Windows users: use the npm scripts (npm run dev) or docker compose.

.PHONY: install dev backend frontend build test docker-up docker-down clean

install:
	npm install
	cd frontend && npm install

dev:
	npx concurrently -k -n BACKEND,FRONTEND -c blue,green \
		"cd backend && ./mvnw spring-boot:run" \
		"cd frontend && npm start"

backend:
	cd backend && ./mvnw spring-boot:run

frontend:
	cd frontend && npm start

build:
	cd backend && ./mvnw -B clean package -DskipTests
	cd frontend && npm run build

test:
	cd backend && ./mvnw -B test
	cd frontend && npm test

docker-up:
	docker compose up --build

docker-down:
	docker compose down

clean:
	cd backend && ./mvnw -B clean
	rm -rf frontend/dist frontend/.angular
