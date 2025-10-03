import asyncio
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from loguru import logger

from core.config import settings
from database.models import Base, create_tables

class DatabaseManager:
    """Database manager for handling connections and sessions"""
    
    def __init__(self):
        self.engine = None
        self.async_engine = None
        self.SessionLocal = None
        self.AsyncSessionLocal = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize database connections"""
        try:
            # Create synchronous engine
            self.engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=settings.DATABASE_ECHO
            )
            
            # Create asynchronous engine
            async_url = settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')
            self.async_engine = create_async_engine(
                async_url,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=settings.DATABASE_ECHO
            )
            
            # Set up connection event handlers
            @event.listens_for(self.engine, "connect", once=True)
            def set_sqlite_pragma(dbapi_connection, connection_record):
                """Set SQLite pragmas if using SQLite"""
                if 'sqlite' in settings.DATABASE_URL:
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA foreign_keys=ON")
                    cursor.close()

            @event.listens_for(self.engine, "connect")
            def set_postgresql_search_path(dbapi_connection, connection_record):
                """Set PostgreSQL search path"""
                if 'postgresql' in settings.DATABASE_URL:
                    with dbapi_connection.cursor() as cursor:
                        cursor.execute("SET search_path TO public")
            
            # Create session factories
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            self.AsyncSessionLocal = async_sessionmaker(
                self.async_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create tables
            await self._create_tables()
            
            # Test connection
            await self._test_connection()
            
            self._initialized = True
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def _create_tables(self):
        """Create database tables if they don't exist"""
        try:
            # Use synchronous engine for table creation
            create_tables(self.engine)
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise
    
    async def _test_connection(self):
        """Test database connection"""
        try:
            # Test synchronous connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            # Test asynchronous connection
            async with self.async_engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            
            logger.info("Database connection test successful")
            
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            raise
    
    def get_session(self) -> Session:
        """Get synchronous database session"""
        if not self._initialized:
            raise RuntimeError("Database not initialized")
        return self.SessionLocal()
    
    async def get_async_session(self) -> AsyncSession:
        """Get asynchronous database session"""
        if not self._initialized:
            raise RuntimeError("Database not initialized")
        return self.AsyncSessionLocal()
    
    @asynccontextmanager
    async def session_scope(self):
        """Provide a transactional scope around a series of operations"""
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    @asynccontextmanager
    async def async_session_scope(self):
        """Provide an async transactional scope around a series of operations"""
        async with self.AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
    
    async def close(self):
        """Close database connections"""
        try:
            if self.engine:
                self.engine.dispose()
            if self.async_engine:
                await self.async_engine.dispose()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

# Global database manager instance
db_manager = DatabaseManager()

# Dependency functions for FastAPI
def get_db() -> Session:
    """Dependency function to get database session"""
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db.close()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency function to get async database session"""
    async with db_manager.AsyncSessionLocal() as session:
        yield session

# Database initialization function
async def init_database():
    """Initialize database on startup"""
    await db_manager.initialize()

# Database cleanup function
async def close_database():
    """Close database connections on shutdown"""
    await db_manager.close()

# Database health check
async def check_database_health() -> dict:
    """Check database health status"""
    try:
        # Test synchronous connection
        with db_manager.engine.connect() as conn:
            result = conn.execute("SELECT 1 as health_check")
            sync_status = "healthy" if result.fetchone() else "unhealthy"
        
        # Test asynchronous connection
        async with db_manager.async_engine.begin() as conn:
            result = await conn.execute("SELECT 1 as health_check")
            async_status = "healthy" if await result.fetchone() else "unhealthy"
        
        return {
            "database": "healthy",
            "sync_connection": sync_status,
            "async_connection": async_status,
            "url": settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else "hidden"
        }
    
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "database": "unhealthy",
            "error": str(e)
        }

# Database utilities
class DatabaseUtils:
    """Utility functions for database operations"""
    
    @staticmethod
    async def execute_raw_query(query: str, params: dict = None):
        """Execute raw SQL query"""
        try:
            async with db_manager.async_session_scope() as session:
                result = await session.execute(query, params or {})
                return result.fetchall()
        except Exception as e:
            logger.error(f"Failed to execute raw query: {e}")
            raise
    
    @staticmethod
    async def get_table_info(table_name: str):
        """Get information about a specific table"""
        try:
            query = """
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = :table_name
            ORDER BY ordinal_position;
            """
            
            async with db_manager.async_session_scope() as session:
                result = await session.execute(query, {"table_name": table_name})
                return result.fetchall()
                
        except Exception as e:
            logger.error(f"Failed to get table info for {table_name}: {e}")
            raise
    
    @staticmethod
    async def get_database_stats():
        """Get database statistics"""
        try:
            stats_query = """
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_tuples,
                n_dead_tup as dead_tuples
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC;
            """
            
            async with db_manager.async_session_scope() as session:
                result = await session.execute(stats_query)
                return result.fetchall()
                
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return []
    
    @staticmethod
    async def cleanup_old_records(table_name: str, date_column: str, days_old: int = 30):
        """Clean up old records from a table"""
        try:
            # Validate table and column names to prevent SQL injection
            allowed_tables = {
                'network_events', 'threat_detections', 'audit_logs', 
                'pcap_files', 'ml_predictions', 'system_metrics'
            }
            allowed_columns = {
                'created_at', 'timestamp', 'detected_at', 'logged_at'
            }
            
            if table_name not in allowed_tables:
                raise ValueError(f"Invalid table name: {table_name}")
            if date_column not in allowed_columns:
                raise ValueError(f"Invalid date column: {date_column}")
            if not isinstance(days_old, int) or days_old < 1 or days_old > 365:
                raise ValueError(f"Invalid days_old value: {days_old}")
            
            # Use text() with bound parameters to prevent SQL injection
            from sqlalchemy import text
            cleanup_query = text(f"""
                DELETE FROM {table_name} 
                WHERE {date_column} < NOW() - INTERVAL :days_interval
            """)
            
            async with db_manager.async_session_scope() as session:
                result = await session.execute(cleanup_query, {"days_interval": f"{days_old} days"})
                deleted_count = result.rowcount
                logger.info(f"Cleaned up {deleted_count} old records from {table_name}")
                return deleted_count
                
        except Exception as e:
            logger.error(f"Failed to cleanup old records from {table_name}: {e}")
            raise
    
    @staticmethod
    async def backup_table(table_name: str, backup_path: str):
        """Create a backup of a specific table"""
        try:
            import subprocess
            import os
            
            # Extract database connection details
            db_url = settings.DATABASE_URL
            # This is a simplified backup - in production, use proper backup tools
            
            backup_command = [
                "pg_dump",
                "-t", table_name,
                "-f", backup_path,
                db_url
            ]
            
            result = subprocess.run(backup_command, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Table {table_name} backed up to {backup_path}")
                return True
            else:
                logger.error(f"Backup failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to backup table {table_name}: {e}")
            return False

# Connection event handlers will be set up during initialization

# Database migration utilities
class MigrationManager:
    """Handle database migrations"""
    
    @staticmethod
    async def create_migration_table():
        """Create migration tracking table"""
        try:
            create_table_query = """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            async with db_manager.async_session_scope() as session:
                await session.execute(create_table_query)
                logger.info("Migration table created/verified")
                
        except Exception as e:
            logger.error(f"Failed to create migration table: {e}")
            raise
    
    @staticmethod
    async def apply_migration(version: str, migration_sql: str):
        """Apply a database migration"""
        try:
            # Check if migration already applied
            check_query = "SELECT version FROM schema_migrations WHERE version = :version"
            
            async with db_manager.async_session_scope() as session:
                result = await session.execute(check_query, {"version": version})
                if result.fetchone():
                    logger.info(f"Migration {version} already applied")
                    return
                
                # Apply migration
                await session.execute(migration_sql)
                
                # Record migration
                record_query = "INSERT INTO schema_migrations (version) VALUES (:version)"
                await session.execute(record_query, {"version": version})
                
                logger.info(f"Migration {version} applied successfully")
                
        except Exception as e:
            logger.error(f"Failed to apply migration {version}: {e}")
            raise
    
    @staticmethod
    async def get_applied_migrations():
        """Get list of applied migrations"""
        try:
            query = "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at"
            
            async with db_manager.async_session_scope() as session:
                result = await session.execute(query)
                return result.fetchall()
                
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            return []

# Export commonly used items
__all__ = [
    'db_manager',
    'get_db',
    'get_async_db',
    'init_database',
    'close_database',
    'check_database_health',
    'DatabaseUtils',
    'MigrationManager'
]