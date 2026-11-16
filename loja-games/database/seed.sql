-- Dados de exemplo da Save Point Games
-- Jogos reais; preços, estoques e clientes são fictícios.

INSERT INTO categoria (nome) VALUES
    ('Ação'), ('Aventura'), ('Esporte'), ('Corrida'), ('Sandbox'), ('Plataforma');

INSERT INTO desenvolvedora (nome, pais) VALUES
    ('Rockstar Games',  'Estados Unidos'),   -- 1
    ('Naughty Dog',     'Estados Unidos'),   -- 2
    ('EA Sports',       'Canadá'),           -- 3
    ('Nintendo',        'Japão'),            -- 4
    ('Mojang Studios',  'Suécia'),           -- 5
    ('Team Cherry',     'Austrália');        -- 6

INSERT INTO plataforma (nome) VALUES
    ('PC'),                 -- 1
    ('PlayStation 5'),      -- 2
    ('PlayStation 4'),      -- 3
    ('Xbox Series X|S'),    -- 4
    ('Nintendo Switch'),    -- 5
    ('Nintendo Switch 2');  -- 6

INSERT INTO jogo (titulo, descricao, preco, desconto, data_lancamento, classificacao, estoque, categoria_id, desenvolvedora_id) VALUES
    ('Grand Theft Auto VI',
     'Mundo aberto no estado de Leonida, com a dupla Lucia e Jason. Pré-venda com entrega no lançamento.',
     399.90, 0, '2026-11-19', 18, 50, 1, 1),
    ('Grand Theft Auto V',
     'Los Santos e as histórias de Michael, Franklin e Trevor, com acesso ao GTA Online.',
     99.90, 50, '2013-09-17', 18, 35, 1, 1),
    ('Red Dead Redemption 2',
     'Arthur Morgan e a gangue Van der Linde no fim da era do Velho Oeste.',
     149.90, 40, '2018-10-26', 18, 20, 2, 1),
    ('Red Dead Redemption',
     'A jornada de John Marston pela fronteira americana em 1911.',
     199.90, 0, '2010-05-18', 18, 12, 2, 1),
    ('Max Payne 3',
     'Tiroteios em câmera lenta pelas ruas de São Paulo.',
     59.90, 30, '2012-05-15', 18, 8, 1, 1),
    ('The Last of Us Part I',
     'Joel e Ellie atravessam um Estados Unidos devastado por uma pandemia.',
     249.90, 20, '2022-09-02', 18, 15, 2, 2),
    ('EA Sports FC 26',
     'Futebol com clubes, seleções e o modo Ultimate Team.',
     299.90, 0, '2025-09-26', 0, 40, 3, 3),
    ('Mario Kart World',
     'Corridas em um mundo aberto conectado, com até 24 pilotos.',
     449.90, 0, '2025-06-05', 0, 0, 4, 4),
    ('Minecraft',
     'Construa, explore e sobreviva em mundos feitos de blocos.',
     119.90, 0, '2011-11-18', 10, 60, 5, 5),
    ('Hollow Knight: Silksong',
     'Hornet explora o reino de Pharloum em um metroidvania desafiador.',
     59.90, 0, '2025-09-04', 10, 25, 6, 6);

INSERT INTO jogo_plataforma (jogo_id, plataforma_id) VALUES
    (1, 2), (1, 4),                         -- GTA VI
    (2, 1), (2, 2), (2, 3), (2, 4),         -- GTA V
    (3, 1), (3, 3),                         -- RDR2
    (4, 1), (4, 3), (4, 5),                 -- RDR
    (5, 1),                                 -- Max Payne 3
    (6, 1), (6, 2),                         -- TLOU
    (7, 1), (7, 2), (7, 4), (7, 5),         -- FC 26
    (8, 6),                                 -- Mario Kart World
    (9, 1), (9, 2), (9, 4), (9, 5),         -- Minecraft
    (10, 1), (10, 2), (10, 4), (10, 5), (10, 6);  -- Silksong

INSERT INTO cliente (nome, email, cpf, data_nascimento) VALUES
    ('Ana Beatriz Costa',  'ana.costa@email.com',     '12345678901', '1998-04-12'),
    ('Rafael Moreira',     'rafa.moreira@email.com',  '23456789012', '2001-11-30'),
    ('Juliana Prado',      'ju.prado@email.com',      '34567890123', '1995-07-08'),
    ('Enzo Ribeiro',       'enzo.ribeiro@email.com',  '45678901234', '2013-02-21');

INSERT INTO pedido (data_pedido, status, total, cliente_id) VALUES
    ('2026-11-02', 'Enviado', 139.89, 1),
    ('2026-11-10', 'Pago',    699.80, 2),
    ('2026-11-14', 'Pendente', 119.90, 4);

INSERT INTO item_pedido (quantidade, preco_unitario, pedido_id, jogo_id) VALUES
    (1, 49.95, 1, 2),
    (1, 89.94, 1, 3),
    (1, 399.90, 2, 1),
    (1, 299.90, 2, 7),
    (1, 119.90, 3, 9);
