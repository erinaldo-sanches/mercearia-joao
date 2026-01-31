"""
APLICAÇÃO FASTAPI PRINCIPAL
Ponto de entrada do backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.database import engine, Base
from routers import produtos

# Carrega variáveis de ambiente
load_dotenv()

# Cria tabelas no banco (se não existirem)
Base.metadata.create_all(bind=engine)
print("Tabelas criadas/verificadas")

# Configura aplicação FastAPI
app = FastAPI(
    title="API - Mercearia do João",
    description="Sistema de gestão para pequenos comércios",
    version="1.0.0",
    docs_url="/docs",      # Swagger UI em /docs
    redoc_url="/redoc",    # Documentação alternativa
    openapi_url="/openapi.json"
)

# Configura CORS (permite frontend acessar API)
origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not any(origins):
    origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Origins permitidas
    allow_credentials=True,     # Permite cookies
    allow_methods=["*"],        # Todos métodos HTTP
    allow_headers=["*"],        # Todos cabeçalhos
)

# Registra rotas
app.include_router(produtos.router)
# Futuro: app.include_router(clientes.router)
# Futuro: app.include_router(vendas.router)

# Endpoints básicos
@app.get("/")
def root():
    """Endpoint raiz - verificação simples"""
    return {
        "message": "Bem-vindo à API da Mercearia do João!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health")
def health_check():
    """Health check para monitoramento"""
    return {"status": "healthy", "service": "mercearia-api"}