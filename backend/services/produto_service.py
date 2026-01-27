"""
SERVICE: Camada de regras de negócio
Onde a "inteligência" do sistema fica
"""

from typing import List
from decimal import Decimal

from repositories.produto_repository import ProdutoRepository
from schemas.produto import ProdutoCreate, ProdutoUpdate, ProdutoResponse

class ProdutoService:
    """
    Coordena repositories e aplica regras de negócio
    """
    
    def __init__(self, produto_repo: ProdutoRepository):
        """Injeção de dependência do Repository"""
        self.produto_repo = produto_repo
    
    def criar_produto(self, produto_data: ProdutoCreate) -> ProdutoResponse:
        """
        Cria produto com validações adicionais
        Ponto central para adicionar regras de negócio
        """
        # EXEMPLO de regra de negócio (comentada):
        # Verificar se produto com mesmo nome já existe
        # produtos_similares = self.produto_repo.buscar_por_nome(produto_data.nome)
        # if produtos_similares:
        #     raise HTTPException(400, "Produto com nome similar já existe")
        
        # Outra regra: Preço mínimo
        # if produto_data.preco_venda < Decimal('0.50'):
        #     raise HTTPException(400, "Preço muito baixo")
        
        # Chama repository para persistir
        produto = self.produto_repo.criar(produto_data)
        
        # Converte model para schema de resposta
        return ProdutoResponse.model_validate(produto)
    
    def listar_produtos(self, skip: int = 0, limit: int = 100) -> List[ProdutoResponse]:
        """Lista todos os produtos"""
        produtos = self.produto_repo.listar_todos(skip, limit)
        return [ProdutoResponse.model_validate(p) for p in produtos]
    
    def obter_produto(self, produto_id: int) -> ProdutoResponse:
        """Busca produto por ID"""
        produto = self.produto_repo.buscar_por_id(produto_id)
        return ProdutoResponse.model_validate(produto)
    
    def atualizar_produto(self, produto_id: int, produto_data: ProdutoUpdate) -> ProdutoResponse:
        """Atualiza produto existente"""
        produto = self.produto_repo.atualizar(produto_id, produto_data)
        return ProdutoResponse.model_validate(produto)
    
    def deletar_produto(self, produto_id: int) -> dict:
        """Remove produto"""
        success = self.produto_repo.deletar(produto_id)
        return {
            "message": "Produto deletado com sucesso",
            "id": produto_id,
            "success": success
        }