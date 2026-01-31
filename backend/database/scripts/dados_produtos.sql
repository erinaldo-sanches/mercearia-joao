-- Inserir produtos de exemplo para desenvolvimento
INSERT INTO produto (nome, descricao, preco, qtd_estoque) VALUES
('Arroz Tipo 1 5kg', 'Arroz branco de boa qualidade', 22.90, 50),
('Feijão Carioca 1kg', 'Feijão comum para o dia a dia', 8.50, 30),
('Açúcar Cristal 1kg', 'Açúcar refinado', 4.99, 20),
('Café em Pó 500g', 'Café torrado e moído', 12.90, 15),
('Óleo de Soja 900ml', 'Óleo para fritura', 7.49, 25),
('Sal Refinado 1kg', 'Sal de cozinha', 3.29, 40),
('Macarrão Espaguete 500g', 'Massa para preparo', 5.90, 35),
('Farinha de Trigo 1kg', 'Farinha para bolos e pães', 5.49, 28),
('Leite UHT Integral 1L', 'Leite longa vida', 6.29, 60),
('Ovos Branco 30un', 'Ovos de galinha', 18.90, 24)
ON CONFLICT (nome) DO NOTHING;

-- Consulta para verificar inserção
SELECT 'Produtos inseridos: ' || COUNT(*) || ' registros' AS resultado FROM produto;