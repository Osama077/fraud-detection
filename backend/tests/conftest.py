import pytest
import asyncio
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.db.session import Base, get_db
from app.api.deps import get_redis
from app.core.config import settings

TEST_DB_URL = "postgresql+asyncpg://fraud_user:fraud_pass@localhost:5432/fraud_db_test"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    async with TestSession() as session:
        yield session
        await session.rollback()


@pytest.fixture
def mock_redis():
    """Return a mock Redis client to avoid needing a live Redis server."""
    redis_mock = AsyncMock()
    redis_mock.ping.return_value = True
    redis_mock.get.return_value = None
    redis_mock.setex.return_value = True
    redis_mock.delete.return_value = True
    redis_mock.exists.return_value = False
    return redis_mock


@pytest.fixture
async def client(db_session: AsyncSession, mock_redis):
    async def override_get_db():
        yield db_session

    async def override_get_redis():
        yield mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Register + login, return auth headers."""
    await client.post("/api/v1/auth/register", json={
        "email": "test@test.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "role": "analyst",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@test.com",
        "password": "TestPass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
