"""
SCHEMA: Validação e formatação de dados
Define o CONTRATO de entrada/saída da API
"""

from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional

class ProdutoBase(BaseModel):
    """
    Schema base com validações comuns
    Herda de BaseModel (Pydantic)
    """
    
    nome: str = Field(
        ...,  # Campo obrigatório
        min_length=1,
        max_length=100,
        description="Nome do produto (1-100 caracteres)",
        examples=["Arroz 5kg", "Feijão Carioca 1kg"]
    )
    
    preco_venda: Decimal = Field(
        ...,
        gt=0,  # greater than 0
        description="Preço de venda > 0",
        examples=[22.90, 8.50]
    )
    
    qtd_estoque: int = Field(
        ...,
        ge=0,  # greater or equal 0
        description="Quantidade em estoque ≥ 0",
        examples=[50, 30, 0]
    )
    
    # VALIDADOR: Verifica se nome não é vazio
    @field_validator('nome')
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        """Remove espaços extras e verifica se não está vazio"""
        if not valor or not valor.strip():
            raise ValueError("Nome do produto não pode ser vazio")
        return valor.strip()
    
    # VALIDADOR: Verifica casas decimais do preço
    @field_validator('preco_venda')
    @classmethod
    def validar_preco(cls, valor: Decimal) -> Decimal:
        """Garante que preço tem no máximo 2 casas decimais"""
        # Converte para string e conta casas decimais
        partes = str(valor).split('.')
        if len(partes) > 1 and len(partes[1]) > 2:
            raise ValueError("Preço deve ter no máximo 2 casas decimais")
        return valor

class ProdutoCreate(ProdutoBase):
    """
    Schema para CRIAÇÃO (POST /produtos)
    Herda todas as validações de ProdutoBase
    """
    pass  # Por enquanto é idêntico ao base

class ProdutoUpdate(BaseModel):
    """
    Schema para ATUALIZAÇÃO (PUT /produtos/{id})
    Todos os campos são OPCIONAIS (Optional)
    Atualização PARCIAL: só altera campos fornecidos
    """
    nome: Optional[str] = Field(
        None,  # Opcional
        min_length=1,
        max_length=100
    )
    preco_venda: Optional[Decimal] = Field(None, gt=0)
    qtd_estoque: Optional[int] = Field(None, ge=0)

class ProdutoResponse(ProdutoBase):
    """
    Schema para RESPOSTA da API
    Inclui campos gerados pelo sistema
    """
    id: int  # Gerado pelo banco
    data_cadastro: datetime  # Gerado pelo banco
    
    class Config:
        """Configurações do Pydantic"""
        from_attributes = True  # Permite criar de objetos SQLAlchemy
        
        # Como serializar tipos especiais para JSON
        json_encoders = {
            Decimal: str,  # Decimal → String
            datetime: lambda v: v.isoformat()  # Data formato ISO
        }