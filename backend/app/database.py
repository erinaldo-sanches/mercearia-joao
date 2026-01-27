"""
CONFIGURAÇÃO DO BANCO DE DADOS
SQLAlchemy 2.0 - declarative_base mudou de lugar!
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker  # ← MUDANÇA AQUI!
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env
load_dotenv()

# URL do banco (do .env)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL não configurada no arquivo .env")

# Configurar conexão com banco
engine = create_engine(
    DATABASE_URL,
    echo=True,           # DEBUG: mostra SQL no terminal
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_recycle=3600    # Recicla conexões a cada hora
)

# Fábrica de sessões
SessionLocal = sessionmaker(
    autocommit=False,    # Não commita automaticamente
    autoflush=False,     # Não flush automaticamente
    bind=engine
)

# Base para todos os models
# ⚠️ IMPORTANTE: Agora vem de sqlalchemy.orm (não mais de ext.declarative)
Base = declarative_base()

def get_db():
    """
    DEPENDÊNCIA: Fornece sessão para cada requisição
    
    FastAPI chama automaticamente para endpoints que precisam de db
    Garante que sessão é fechada após uso
    """
    db = SessionLocal()
    try:
        yield db  # Entrega sessão
    finally:
        db.close()  # Fecha após uso