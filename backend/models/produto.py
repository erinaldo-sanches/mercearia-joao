"""
MODEL: Representa a tabela 'produto' no banco de dados
Conecta Python (objetos) ↔ PostgreSQL (tabelas)
"""

from sqlalchemy import Column, Integer, String, DECIMAL, DateTime
from sqlalchemy.sql import func
from app.database import Base  # Base do SQLAlchemy

class Produto(Base):
    """
    Classe Produto = Tabela produto no banco
    Herda de Base (do SQLAlchemy)
    """
    
    # Nome exato da tabela no banco
    __tablename__ = "produto"
    
    # COLUNAS (cada atributo = coluna no banco)
    
    # ID - Chave primária, auto-incremento
    id = Column(Integer, 
                primary_key=True,      # Chave primária
                index=True)            # Índice para buscas rápidas
    
    # Nome do produto
    nome = Column(String(100),         # VARCHAR(100)
                  nullable=False,      # NOT NULL
                  index=True)          # Índice para busca por nome
    
    # Preço de venda - DECIMAL para valores monetários
    preco_venda = Column(DECIMAL(10, 2),  # 10 dígitos, 2 casas decimais
                         nullable=False)
    
    # Quantidade em estoque
    qtd_estoque = Column(Integer,
                         nullable=False,
                         default=0)     # Valor padrão se não informado
    
    # Data de cadastro automática
    data_cadastro = Column(DateTime(timezone=True),  # Com fuso horário
                           server_default=func.now()) # Data atual do servidor
    
    def __repr__(self):
        """Representação para debugging"""
        return f"<Produto(id={self.id}, nome='{self.nome}')>"