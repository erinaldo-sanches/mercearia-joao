"""
ROUTER: Define os endpoints da API
A "porta de entrada" do backend
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from repositories.produto_repository import ProdutoRepository
from services.produto_service import ProdutoService
from schemas.produto import ProdutoCreate, ProdutoUpdate, ProdutoResponse

# Cria router com configurações
router = APIRouter(
    prefix="/produtos",       # Todas rotas começam com /produtos
    tags=["produtos"],        # Agrupa no Swagger
    responses={               # Respostas padrão
        404: {"description": "Não encontrado"},
        500: {"description": "Erro interno"}
    }
)

# DEPENDÊNCIAS (Injeção automática pelo FastAPI)
def get_produto_repository(db: Session = Depends(get_db)):
    """Fornece Repository com sessão do banco"""
    return ProdutoRepository(db)

def get_produto_service(
    produto_repo: ProdutoRepository = Depends(get_produto_repository)
):
    """Fornece Service com Repository"""
    return ProdutoService(produto_repo)


# ========== ENDPOINTS ==========

@router.post(
    "/",
    response_model=ProdutoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo produto",
    description="""
    Cadastra um novo produto no sistema.
    
    **Validações:**
    - Nome: 1-100 caracteres, não vazio
    - Preço: > 0, máximo 2 casas decimais  
    - Estoque: ≥ 0 (inteiro não negativo)
    """,
    responses={
        201: {"description": "Produto criado"},
        400: {"description": "Dados inválidos"},
        422: {"description": "Erro de validação"},
        500: {"description": "Erro interno"}
    }
)
def criar_produto(
    produto: ProdutoCreate,
    produto_service: ProdutoService = Depends(get_produto_service)
):
    """
    POST /produtos
    Cria um novo produto
    """
    try:
        return produto_service.criar_produto(produto)
    except HTTPException:
        raise  # Re-lança exceções HTTP
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[ProdutoResponse],
    summary="Listar produtos",
    description="Retorna lista paginada de produtos",
    responses={
        200: {"description": "Lista de produtos"}
    }
)
def listar_produtos(
    skip: int = 0,     # ?skip=0 (padrão)
    limit: int = 100,  # ?limit=100 (padrão)
    produto_service: ProdutoService = Depends(get_produto_service)
):
    """
    GET /produtos
    Lista todos os produtos
    """
    try:
        # Limita máximo de resultados
        if limit > 1000:
            limit = 1000
            
        return produto_service.listar_produtos(skip, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.get(
    "/{produto_id}",
    response_model=ProdutoResponse,
    summary="Buscar produto por ID",
    description="Retorna os detalhes de um produto específico",
    responses={
        200: {"description": "Produto encontrado"},
        404: {"description": "Produto não encontrado"}
    }
)
def obter_produto(
    produto_id: int,
    produto_service: ProdutoService = Depends(get_produto_service)
):
    """
    GET /produtos/{id}
    Busca produto por ID
    """
    try:
        return produto_service.obter_produto(produto_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.put(
    "/{produto_id}",
    response_model=ProdutoResponse,
    summary="Atualizar produto",
    description="Atualiza os dados de um produto existente",
    responses={
        200: {"description": "Produto atualizado"},
        404: {"description": "Produto não encontrado"}
    }
)
def atualizar_produto(
    produto_id: int,
    produto_update: ProdutoUpdate,
    produto_service: ProdutoService = Depends(get_produto_service)
):
    """
    PUT /produtos/{id}
    Atualiza produto (atualização parcial)
    """
    try:
        return produto_service.atualizar_produto(produto_id, produto_update)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.delete(
    "/{produto_id}",
    status_code=status.HTTP_200_OK,
    summary="Deletar produto",
    description="Remove um produto do sistema",
    responses={
        200: {"description": "Produto deletado"},
        404: {"description": "Produto não encontrado"}
    }
)
def deletar_produto(
    produto_id: int,
    produto_service: ProdutoService = Depends(get_produto_service)
):
    """
    DELETE /produtos/{id}
    Remove produto
    """
    try:
        return produto_service.deletar_produto(produto_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.get(
    "/buscar/{nome}",
    response_model=List[ProdutoResponse],
    summary="Buscar produtos por nome",
    description="Busca produtos cujo nome contenha o termo",
    responses={
        200: {"description": "Resultados da busca"}
    }
)
def buscar_produtos_por_nome(
    nome: str,
    produto_repo: ProdutoRepository = Depends(get_produto_repository)
):
    """
    GET /produtos/buscar/{nome}
    Busca parcial por nome
    """
    try:
        produtos = produto_repo.buscar_por_nome(nome)
        return [ProdutoResponse.model_validate(p) for p in produtos]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )