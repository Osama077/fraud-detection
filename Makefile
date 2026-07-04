.PHONY: up down build logs shell-backend train seed test migrate clean

up:
	docker compose up --build -d
	@echo "\n✓  Frontend  → http://localhost:3000"
	@echo "✓  API Docs  → http://localhost:8000/docs"
	@echo "✓  Proxy     → http://localhost\n"

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f --tail=100

logs-backend:
	docker compose logs -f backend celery_worker

shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh

shell-db:
	docker compose exec postgres psql -U fraud_user -d fraud_db

train:
	docker compose exec backend python -m app.ml.pipeline.train

seed:
	docker compose exec backend python -m scripts.seed

migrate:
	docker compose exec backend alembic upgrade head

migrate-new:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

test:
	docker compose exec backend pytest -v --tb=short

test-cov:
	docker compose exec backend pytest --cov=app --cov-report=term-missing

lint-types:
	docker compose exec frontend npx tsc --noEmit

restart-backend:
	docker compose restart backend celery_worker

clean:
	docker compose down -v --remove-orphans
