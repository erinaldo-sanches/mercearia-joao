-- Script: 00_script_full_deploy.sql
CREATE TABLE produto (
    id SERIAL PRIMARY KEY,                    -- Chave primária auto-incremento
    nome VARCHAR(100) NOT NULL,               -- Nome do produto
    preco_venda DECIMAL(10,2) NOT NULL        -- Preço com 2 casas decimais
        CHECK (preco_venda > 0),              -- Validação: preço > 0
    qtd_estoque INTEGER NOT NULL DEFAULT 0    -- Estoque inicial 0
        CHECK (qtd_estoque >= 0),             -- Validação: estoque não negativo
    data_cadastro TIMESTAMP                   -- Data automática
        DEFAULT CURRENT_TIMESTAMP
);