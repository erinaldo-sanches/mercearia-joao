-- Tabela produto
CREATE TABLE IF NOT EXISTS produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) NOT NULL CHECK (preco > 0),
    qtd_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_estoque >= 0),
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Garante que não teremos nomes duplicados para produtos ativos
    CONSTRAINT produto_nome_unico UNIQUE (nome)
);

-- Comentários para documentação
COMMENT ON TABLE produto IS 'Tabela que armazena os produtos da mercearia';
COMMENT ON COLUMN produto.preco IS 'Preço de venda do produto (maior que zero)';
COMMENT ON COLUMN produto.qtd_estoque IS 'Quantidade disponível para venda (não negativa)';

-- Índice para otimizar buscas por nome
CREATE INDEX IF NOT EXISTS idx_produto_nome ON produto(nome);
CREATE INDEX IF NOT EXISTS idx_produto_ativo ON produto(ativo);