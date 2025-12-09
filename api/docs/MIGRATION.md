PostgreSQL migration

Steps to migrate existing SQLite data to Postgres:

1. Start Postgres locally (docker-compose.dev.yml will spin it up as postgres-dev):
   - yarn docker:dev
2. Set environment variables:
   - DATABASE_URL=postgresql://trading:trading@localhost:5433/tradingbot
   - SQLITE_DB_PATH=api/db/trading_bot.db
3. Initialize schema in Postgres:
   - yarn db:init
4. Run migration script:
   - yarn db:migrate
5. Update your environment to use DATABASE_URL for all services.
