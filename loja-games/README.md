# Save Point Games — Loja de Jogos

Projeto Integrado (DWS, POO e BD). Loja virtual de jogos com vitrine, filtros por plataforma e categoria, carrinho de compras e área administrativa (jogos, clientes, pedidos e painel de vendas).

O catálogo de exemplo tem jogos como **Grand Theft Auto VI** (em pré-venda até 19/11/2026), **GTA V**, **Red Dead Redemption 2**, **Red Dead Redemption**, **Max Payne 3**, **The Last of Us Part I**, **Minecraft** e outros. Preços, estoques e clientes são fictícios.

## Tecnologias

| Camada     | Tecnologia                          |
|------------|-------------------------------------|
| Banco      | SQLite (scripts em `database/`)     |
| Back-end   | Python 3, Flask, POO                |
| Front-end  | HTML, CSS e JavaScript (fetch API)  |

## Estrutura

```
loja-games/
├── backend/
│   ├── app.py            # Rotas da API (Flask)
│   ├── database.py       # Conexão e criação do banco
│   ├── models.py         # Classes do domínio (POO)
│   └── repositories.py   # Acesso a dados (SQL)
├── database/
│   ├── schema.sql        # Modelo físico: tabelas, chaves, restrições e view
│   └── seed.sql          # Dados de exemplo
├── docs/modelagem/       # Modelos conceitual, lógico e físico (AV1)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/script.js
└── requirements.txt
```

## Como executar

```bash
pip install -r requirements.txt
python backend/app.py
```

Acesse **http://127.0.0.1:5000**. O banco `database/loja.db` é criado automaticamente na primeira execução, já com os dados de exemplo. Para recomeçar do zero, apague esse arquivo.

## Regras de negócio

- **Classificação indicativa:** um cliente menor de idade não consegue comprar um jogo 18+ (a idade é calculada pela data de nascimento).
- **Estoque:** não dá para vender mais do que há em estoque; jogos com estoque zero aparecem como "Esgotado".
- **Pedido em transação:** se um item do carrinho falhar, nada do pedido é gravado.
- **Cancelamento:** cancelar um pedido devolve os jogos ao estoque; um pedido cancelado não muda mais de status.
- **Desconto e pré-venda:** o preço final aplica o desconto do jogo; jogos com lançamento futuro aparecem como pré-venda.
- **Preço histórico:** o item do pedido guarda o preço da hora da compra, mesmo que o preço do jogo mude depois.

## Conceitos de POO aplicados

- **Abstração:** `Pessoa` e `Produto` são classes abstratas (`ABC`), com os métodos abstratos `documento()` e `disponivel()`.
- **Herança:** `Cliente` herda de `Pessoa`; `Jogo` herda de `Produto`; os repositórios herdam de `Repositorio`.
- **Polimorfismo:** cada subclasse implementa `documento()` e `disponivel()` do seu jeito.
- **Encapsulamento:** nome, e-mail, CPF, preço e desconto são validados por `@property`/setter.
- **Composição:** `Pedido` é formado por objetos `ItemPedido`, criados e validados pelo método `adicionar_item()`.

## Banco de dados

- 8 tabelas: `categoria`, `desenvolvedora`, `plataforma`, `jogo`, `jogo_plataforma`, `cliente`, `pedido`, `item_pedido`
- Dois relacionamentos N:N resolvidos com tabelas associativas (`jogo_plataforma` e `item_pedido`)
- Chaves primárias simples e composta, chaves estrangeiras com `ON DELETE` (RESTRICT e CASCADE)
- Restrições `NOT NULL`, `UNIQUE`, `CHECK` e `DEFAULT`
- View `vw_mais_vendidos` com `JOIN`, `LEFT JOIN`, `CASE`, `SUM` e `GROUP BY`

## API

| Método | Rota                          | Descrição                                   |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/api/jogos`                  | Lista jogos (filtros `categoria`, `plataforma`, `busca`) |
| POST   | `/api/jogos`                  | Cadastra jogo                               |
| PUT    | `/api/jogos/<id>`             | Atualiza preço, desconto e estoque          |
| DELETE | `/api/jogos/<id>`             | Remove jogo                                 |
| GET    | `/api/categorias`, `/api/plataformas`, `/api/desenvolvedoras` | Tabelas de apoio |
| GET/POST | `/api/clientes`             | Lista / cadastra clientes                   |
| DELETE | `/api/clientes/<id>`          | Remove cliente (se não tiver pedidos)       |
| GET/POST | `/api/pedidos`              | Lista / cria pedido a partir do carrinho    |
| PATCH  | `/api/pedidos/<id>/status`    | Altera status (cancelar devolve o estoque)  |
| GET    | `/api/resumo`                 | Números do painel e mais vendidos           |

## Integrantes

- Nome — RA
- Nome — RA
