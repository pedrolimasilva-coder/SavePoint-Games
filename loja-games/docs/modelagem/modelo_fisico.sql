-- =====================================================================
-- MODELO FÍSICO
-- Save Point Games - Loja de Jogos
-- SGBD: SQLite
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela: categoria
-- Gênero do jogo (Ação, Aventura, Esporte...)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria (
    id    INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome  VARCHAR(40)  NOT NULL,
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);

-- ---------------------------------------------------------------------
-- Tabela: desenvolvedora
-- Estúdio que desenvolveu o jogo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS desenvolvedora (
    id    INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome  VARCHAR(60)  NOT NULL,
    pais  VARCHAR(40)  NOT NULL,
    CONSTRAINT uq_desenvolvedora_nome UNIQUE (nome)
);

-- ---------------------------------------------------------------------
-- Tabela: plataforma
-- Console ou PC em que o jogo roda
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plataforma (
    id    INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome  VARCHAR(30)  NOT NULL,
    CONSTRAINT uq_plataforma_nome UNIQUE (nome)
);

-- ---------------------------------------------------------------------
-- Tabela: jogo
-- Produto vendido pela loja
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jogo (
    id                 INTEGER        PRIMARY KEY AUTOINCREMENT,
    titulo             VARCHAR(100)   NOT NULL,
    descricao          VARCHAR(500),
    preco              DECIMAL(10,2)  NOT NULL,
    desconto           INTEGER        NOT NULL DEFAULT 0,
    data_lancamento    DATE           NOT NULL,
    classificacao      INTEGER        NOT NULL,
    estoque            INTEGER        NOT NULL DEFAULT 0,
    categoria_id       INTEGER        NOT NULL,
    desenvolvedora_id  INTEGER        NOT NULL,
    CONSTRAINT uq_jogo_titulo UNIQUE (titulo),
    CONSTRAINT ck_jogo_preco CHECK (preco >= 0),
    CONSTRAINT ck_jogo_desconto CHECK (desconto BETWEEN 0 AND 90),
    CONSTRAINT ck_jogo_classificacao CHECK (classificacao IN (0, 10, 12, 14, 16, 18)),
    CONSTRAINT ck_jogo_estoque CHECK (estoque >= 0),
    CONSTRAINT fk_jogo_categoria FOREIGN KEY (categoria_id)
        REFERENCES categoria (id) ON DELETE RESTRICT,
    CONSTRAINT fk_jogo_desenvolvedora FOREIGN KEY (desenvolvedora_id)
        REFERENCES desenvolvedora (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Tabela associativa: jogo_plataforma  (N:N entre jogo e plataforma)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jogo_plataforma (
    jogo_id        INTEGER  NOT NULL,
    plataforma_id  INTEGER  NOT NULL,
    CONSTRAINT pk_jogo_plataforma PRIMARY KEY (jogo_id, plataforma_id),
    CONSTRAINT fk_jp_jogo FOREIGN KEY (jogo_id)
        REFERENCES jogo (id) ON DELETE CASCADE,
    CONSTRAINT fk_jp_plataforma FOREIGN KEY (plataforma_id)
        REFERENCES plataforma (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Tabela: cliente
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cliente (
    id               INTEGER       PRIMARY KEY AUTOINCREMENT,
    nome             VARCHAR(100)  NOT NULL,
    email            VARCHAR(100)  NOT NULL,
    cpf              CHAR(11)      NOT NULL,
    data_nascimento  DATE          NOT NULL,
    CONSTRAINT uq_cliente_email UNIQUE (email),
    CONSTRAINT uq_cliente_cpf UNIQUE (cpf),
    CONSTRAINT ck_cliente_cpf CHECK (length(cpf) = 11)
);

-- ---------------------------------------------------------------------
-- Tabela: pedido
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
    id           INTEGER        PRIMARY KEY AUTOINCREMENT,
    data_pedido  DATE           NOT NULL,
    status       VARCHAR(10)    NOT NULL DEFAULT 'Pendente',
    total        DECIMAL(10,2)  NOT NULL DEFAULT 0,
    cliente_id   INTEGER        NOT NULL,
    CONSTRAINT ck_pedido_status CHECK (status IN ('Pendente', 'Pago', 'Enviado', 'Cancelado')),
    CONSTRAINT ck_pedido_total CHECK (total >= 0),
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)
        REFERENCES cliente (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Tabela associativa: item_pedido  (N:N entre pedido e jogo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_pedido (
    id              INTEGER        PRIMARY KEY AUTOINCREMENT,
    quantidade      INTEGER        NOT NULL,
    preco_unitario  DECIMAL(10,2)  NOT NULL,
    pedido_id       INTEGER        NOT NULL,
    jogo_id         INTEGER        NOT NULL,
    CONSTRAINT uq_item_pedido_jogo UNIQUE (pedido_id, jogo_id),
    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_item_preco CHECK (preco_unitario >= 0),
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_jogo FOREIGN KEY (jogo_id)
        REFERENCES jogo (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Visão: jogos mais vendidos (ignora pedidos cancelados)
-- ---------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS vw_mais_vendidos AS
SELECT j.id,
       j.titulo,
       COALESCE(SUM(CASE WHEN p.status <> 'Cancelado'
                         THEN i.quantidade END), 0)                    AS unidades,
       COALESCE(SUM(CASE WHEN p.status <> 'Cancelado'
                         THEN i.quantidade * i.preco_unitario END), 0) AS faturamento
FROM jogo j
LEFT JOIN item_pedido i ON i.jogo_id = j.id
LEFT JOIN pedido p      ON p.id = i.pedido_id
GROUP BY j.id, j.titulo;
