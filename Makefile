.PHONY: install dev migrate lint

install:
	cd server && npm install
	cd client && npm install
	cd server/rag/service && pip install -r requirements.txt

dev:
	cd server && npm run dev &
	cd client && npm run dev &
	cd server/rag/service && uvicorn main:app --reload --port 8001

migrate:
	cd server && npm run db:migrate

lint:
	cd server && npx eslint src/ --ext .ts
	cd client && npx eslint app/ components/ --ext .ts,.tsx
