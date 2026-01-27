"""
REPOSITORY: Camada de acesso a dados
Isola o banco de dados do resto da aplicação
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from models.produto import Produto
from schemas.produto import ProdutoCreate, ProdutoUpdate

class ProdutoRepository:
    """
    Classe que gerencia operações de banco para Produto
    Cada método ≈ 1 operação SQL
    """
    
    def __init__(self, db: Session):
        """Recebe sessão do banco (Injeção de Dependência)"""
        self.db = db
    
    # CREATE
    def criar(self, produto: ProdutoCreate) -> Produto:
        """
        Insere novo produto no banco
        SQL: INSERT INTO produto (...) VALUES (...)
        """
        try:
            # Converter schema para model
            db_produto = Produto(
                nome=produto.nome,
                preco_venda=produto.preco_venda,
                qtd_estoque=produto.qtd_estoque
            )
            
            # Adicionar à sessão
            self.db.add(db_produto)
            
            # Executar INSERT
            self.db.commit()
            
            # Atualizar objeto com ID gerado
            self.db.refresh(db_produto)
            
            return db_produto
            
        except SQLAlchemyError as e:
            # Em caso de erro, desfazer alterações
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao criar produto: {str(e)}"
            )
    
    # READ - por ID
    def buscar_por_id(self, produto_id: int) -> Optional[Produto]:
        """
        Busca produto pelo ID
        SQL: SELECT * FROM produto WHERE id = ? LIMIT 1
        """
        produto = self.db.query(Produto)\
                       .filter(Produto.id == produto_id)\
                       .first()  # LIMIT 1
        
        if not produto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto com ID {produto_id} não encontrado"
            )
        
        return produto
    
    # READ - todos (com paginação)
    def listar_todos(self, skip: int = 0, limit: int = 100) -> List[Produto]:
        """
        Lista todos os produtos
        SQL: SELECT * FROM produto LIMIT ? OFFSET ?
        """
        return self.db.query(Produto)\
                     .order_by(Produto.id)\
                     .offset(skip)\
                     .limit(limit)\
                     .all()
    
    # UPDATE
    def atualizar(self, produto_id: int, produto_update: ProdutoUpdate) -> Produto:
        """
        Atualiza produto existente
        SQL: UPDATE produto SET ... WHERE id = ?
        """
        try:
            # Buscar produto existente
            db_produto = self.buscar_por_id(produto_id)
            
            # Converter dados de atualização para dicionário
            # exclude_unset=True: ignora campos não fornecidos
            update_data = produto_update.model_dump(exclude_unset=True)
            
            # Atualizar cada campo fornecido
            for campo, valor in update_data.items():
                setattr(db_produto, campo, valor)
            
            # Executar UPDATE
            self.db.commit()
            self.db.refresh(db_produto)
            
            return db_produto
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao atualizar produto: {str(e)}"
            )
    
    # DELETE
    def deletar(self, produto_id: int) -> bool:
        """
        Remove produto do banco
        SQL: DELETE FROM produto WHERE id = ?
        """
        try:
            db_produto = self.buscar_por_id(produto_id)
            self.db.delete(db_produto)
            self.db.commit()
            return True
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao deletar produto: {str(e)}"
            )
    
    # Busca por nome (parcial)
    def buscar_por_nome(self, nome: str) -> List[Produto]:
        """
        Busca produtos com nome parecido
        SQL: SELECT * FROM produto WHERE nome ILIKE '%?%'
        """
        return self.db.query(Produto)\
                     .filter(Produto.nome.ilike(f"%{nome}%"))\
                     .all()