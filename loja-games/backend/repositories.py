"""Repositórios: fazem a ponte entre os objetos (POO) e o banco (SQL)."""
from models import Cliente, Jogo, Pedido, RegraNegocioError


class Repositorio:
    """Classe base: guarda a referência ao banco e remove por id."""
    tabela = None

    def __init__(self, db):
        self.db = db

    def remover(self, id):
        with self.db.conexao() as conn:
            conn.execute(f"DELETE FROM {self.tabela} WHERE id = ?", (id,))


# ---------------------------------------------------------------------
class CatalogoRepository(Repositorio):
    """Tabelas de apoio: categorias, desenvolvedoras e plataformas."""

    def _todos(self, sql):
        with self.db.conexao() as conn:
            return [dict(r) for r in conn.execute(sql).fetchall()]

    def categorias(self):
        return self._todos("SELECT * FROM categoria ORDER BY nome")

    def desenvolvedoras(self):
        return self._todos("SELECT * FROM desenvolvedora ORDER BY nome")

    def plataformas(self):
        return self._todos("SELECT * FROM plataforma ORDER BY id")


# ---------------------------------------------------------------------
class JogoRepository(Repositorio):
    tabela = "jogo"

    SQL_BASE = """
        SELECT j.*, c.nome AS categoria, d.nome AS desenvolvedora,
               GROUP_CONCAT(p.nome, ', ') AS plataformas
        FROM jogo j
        JOIN categoria c       ON c.id = j.categoria_id
        JOIN desenvolvedora d  ON d.id = j.desenvolvedora_id
        LEFT JOIN jogo_plataforma jp ON jp.jogo_id = j.id
        LEFT JOIN plataforma p       ON p.id = jp.plataforma_id
    """

    def _para_objeto(self, r):
        plats = r["plataformas"].split(", ") if r["plataformas"] else []
        return Jogo(r["titulo"], r["preco"], r["data_lancamento"], r["classificacao"],
                    r["estoque"], r["categoria_id"], r["desenvolvedora_id"],
                    r["desconto"], r["descricao"], plats, r["id"])

    def _para_dict(self, r):
        dados = self._para_objeto(r).to_dict()
        dados["categoria"] = r["categoria"]
        dados["desenvolvedora"] = r["desenvolvedora"]
        return dados

    def listar(self, categoria_id=None, plataforma_id=None, busca=None):
        filtros, params = [], []
        if categoria_id:
            filtros.append("j.categoria_id = ?")
            params.append(categoria_id)
        if plataforma_id:
            filtros.append("j.id IN (SELECT jogo_id FROM jogo_plataforma WHERE plataforma_id = ?)")
            params.append(plataforma_id)
        if busca:
            filtros.append("(j.titulo LIKE ? OR d.nome LIKE ?)")
            params += [f"%{busca}%", f"%{busca}%"]
        where = ("WHERE " + " AND ".join(filtros)) if filtros else ""
        sql = f"{self.SQL_BASE} {where} GROUP BY j.id ORDER BY j.data_lancamento DESC"
        with self.db.conexao() as conn:
            return [self._para_dict(r) for r in conn.execute(sql, params).fetchall()]

    def buscar(self, id, conn=None):
        sql = f"{self.SQL_BASE} WHERE j.id = ? GROUP BY j.id"
        if conn:
            r = conn.execute(sql, (id,)).fetchone()
        else:
            with self.db.conexao() as c:
                r = c.execute(sql, (id,)).fetchone()
        return self._para_objeto(r) if r else None

    def salvar(self, j: Jogo, plataforma_ids):
        if not plataforma_ids:
            raise RegraNegocioError("Escolha pelo menos uma plataforma.")
        with self.db.conexao() as conn:
            cur = conn.execute("""
                INSERT INTO jogo (titulo, descricao, preco, desconto, data_lancamento,
                                  classificacao, estoque, categoria_id, desenvolvedora_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (j.titulo, j.descricao, j.preco, j.desconto, j.data_lancamento.isoformat(),
                 j.classificacao, j.estoque, j.categoria_id, j.desenvolvedora_id))
            j.id = cur.lastrowid
            conn.executemany("INSERT INTO jogo_plataforma (jogo_id, plataforma_id) VALUES (?, ?)",
                             [(j.id, int(p)) for p in plataforma_ids])
        return j

    def atualizar_preco_estoque(self, id, preco, desconto, estoque):
        j = self.buscar(id)
        if not j:
            raise RegraNegocioError("Jogo não encontrado.")
        j.preco, j.desconto = preco, desconto
        j.estoque = int(estoque)
        if j.estoque < 0:
            raise RegraNegocioError("O estoque não pode ser negativo.")
        with self.db.conexao() as conn:
            conn.execute("UPDATE jogo SET preco=?, desconto=?, estoque=? WHERE id=?",
                         (j.preco, j.desconto, j.estoque, id))
        return j


# ---------------------------------------------------------------------
class ClienteRepository(Repositorio):
    tabela = "cliente"

    def _para_objeto(self, r):
        return Cliente(r["nome"], r["email"], r["cpf"], r["data_nascimento"], r["id"])

    def listar(self):
        with self.db.conexao() as conn:
            rows = conn.execute("""
                SELECT c.*, COUNT(p.id) AS pedidos
                FROM cliente c LEFT JOIN pedido p ON p.cliente_id = c.id
                GROUP BY c.id ORDER BY c.nome""").fetchall()
        lista = []
        for r in rows:
            dados = self._para_objeto(r).to_dict()
            dados["pedidos"] = r["pedidos"]
            lista.append(dados)
        return lista

    def buscar(self, id, conn=None):
        sql = "SELECT * FROM cliente WHERE id = ?"
        if conn:
            r = conn.execute(sql, (id,)).fetchone()
        else:
            with self.db.conexao() as c:
                r = c.execute(sql, (id,)).fetchone()
        return self._para_objeto(r) if r else None

    def salvar(self, c: Cliente):
        with self.db.conexao() as conn:
            cur = conn.execute("""INSERT INTO cliente (nome, email, cpf, data_nascimento)
                                  VALUES (?, ?, ?, ?)""",
                               (c.nome, c.email, c.cpf, c.data_nascimento.isoformat()))
            c.id = cur.lastrowid
        return c


# ---------------------------------------------------------------------
class PedidoRepository(Repositorio):
    tabela = "pedido"

    def __init__(self, db, jogos: JogoRepository, clientes: ClienteRepository):
        super().__init__(db)
        self.jogos = jogos
        self.clientes = clientes

    def listar(self):
        with self.db.conexao() as conn:
            pedidos = [dict(r) for r in conn.execute("""
                SELECT p.*, c.nome AS cliente FROM pedido p
                JOIN cliente c ON c.id = p.cliente_id
                ORDER BY p.data_pedido DESC, p.id DESC""").fetchall()]
            for p in pedidos:
                p["itens"] = [dict(r) for r in conn.execute("""
                    SELECT i.quantidade, i.preco_unitario, j.titulo
                    FROM item_pedido i JOIN jogo j ON j.id = i.jogo_id
                    WHERE i.pedido_id = ?""", (p["id"],)).fetchall()]
        return pedidos

    def criar(self, cliente_id, itens):
        """Cria o pedido inteiro numa única transação: ou grava tudo, ou nada."""
        if not itens:
            raise RegraNegocioError("O carrinho está vazio.")
        with self.db.conexao() as conn:
            cliente = self.clientes.buscar(cliente_id, conn)
            if not cliente:
                raise RegraNegocioError("Cliente não encontrado.")
            pedido = Pedido(cliente)
            for item in itens:
                jogo = self.jogos.buscar(int(item["jogo_id"]), conn)
                if not jogo:
                    raise RegraNegocioError("Jogo não encontrado.")
                pedido.adicionar_item(jogo, int(item["quantidade"]))

            cur = conn.execute("""INSERT INTO pedido (data_pedido, status, total, cliente_id)
                                  VALUES (?, ?, ?, ?)""",
                               (pedido.data_pedido.isoformat(), pedido.status,
                                pedido.total(), cliente.id))
            pedido.id = cur.lastrowid
            for i in pedido.itens:
                conn.execute("""INSERT INTO item_pedido
                                (quantidade, preco_unitario, pedido_id, jogo_id)
                                VALUES (?, ?, ?, ?)""",
                             (i.quantidade, i.preco_unitario, pedido.id, i.jogo.id))
                conn.execute("UPDATE jogo SET estoque = ? WHERE id = ?",
                             (i.jogo.estoque, i.jogo.id))
        return {"id": pedido.id, "total": pedido.total(), "status": pedido.status}

    def alterar_status(self, id, novo):
        with self.db.conexao() as conn:
            r = conn.execute("SELECT * FROM pedido WHERE id = ?", (id,)).fetchone()
            if not r:
                raise RegraNegocioError("Pedido não encontrado.")
            pedido = Pedido(self.clientes.buscar(r["cliente_id"], conn),
                            r["data_pedido"], r["status"], r["id"])
            pedido.alterar_status(novo)
            conn.execute("UPDATE pedido SET status = ? WHERE id = ?", (novo, id))
            if novo == "Cancelado":   # devolve os jogos ao estoque
                conn.execute("""UPDATE jogo SET estoque = estoque + (
                                    SELECT quantidade FROM item_pedido
                                    WHERE pedido_id = ? AND jogo_id = jogo.id)
                                WHERE id IN (SELECT jogo_id FROM item_pedido WHERE pedido_id = ?)""",
                             (id, id))
        return {"id": id, "status": novo}


# ---------------------------------------------------------------------
class ResumoRepository(Repositorio):
    def resumo(self):
        with self.db.conexao() as conn:
            def um(sql):
                return conn.execute(sql).fetchone()[0]
            return {
                "jogos": um("SELECT COUNT(*) FROM jogo"),
                "clientes": um("SELECT COUNT(*) FROM cliente"),
                "pedidos": um("SELECT COUNT(*) FROM pedido WHERE status <> 'Cancelado'"),
                "faturamento": round(um("""SELECT COALESCE(SUM(total), 0) FROM pedido
                                           WHERE status <> 'Cancelado'"""), 2),
                "sem_estoque": um("SELECT COUNT(*) FROM jogo WHERE estoque = 0"),
                "mais_vendidos": [dict(r) for r in conn.execute("""
                    SELECT titulo, unidades, faturamento FROM vw_mais_vendidos
                    WHERE unidades > 0 ORDER BY unidades DESC, faturamento DESC
                    LIMIT 5""").fetchall()],
            }
