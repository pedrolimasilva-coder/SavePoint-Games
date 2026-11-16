"""API Flask da Save Point Games."""
import os
import sqlite3

from flask import Flask, jsonify, request, send_from_directory

from database import Database
from models import Cliente, Jogo, RegraNegocioError
from repositories import (CatalogoRepository, ClienteRepository, JogoRepository,
                          PedidoRepository, ResumoRepository)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

db = Database()
db.inicializar()

catalogo = CatalogoRepository(db)
jogos = JogoRepository(db)
clientes = ClienteRepository(db)
pedidos = PedidoRepository(db, jogos, clientes)
resumo = ResumoRepository(db)


# ---------- Tratamento de erros ----------
@app.errorhandler(RegraNegocioError)
@app.errorhandler(ValueError)
def erro_regra(e):
    return jsonify({"erro": str(e)}), 400


@app.errorhandler(sqlite3.IntegrityError)
def erro_integridade(e):
    msg = str(e)
    if "UNIQUE" in msg:
        campo = msg.split(".")[-1]
        return jsonify({"erro": f"Já existe um cadastro com esse {campo}."}), 400
    if "FOREIGN KEY" in msg:
        return jsonify({"erro": "Esse registro está ligado a outros e não pode ser removido."}), 400
    return jsonify({"erro": "Dado inválido: " + msg}), 400


@app.errorhandler(KeyError)
def erro_campo(e):
    return jsonify({"erro": f"Campo obrigatório ausente: {e.args[0]}"}), 400


# ---------- Front-end ----------
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


# ---------- Catálogo de apoio ----------
@app.get("/api/categorias")
def listar_categorias():
    return jsonify(catalogo.categorias())


@app.get("/api/plataformas")
def listar_plataformas():
    return jsonify(catalogo.plataformas())


@app.get("/api/desenvolvedoras")
def listar_desenvolvedoras():
    return jsonify(catalogo.desenvolvedoras())


# ---------- Jogos ----------
@app.get("/api/jogos")
def listar_jogos():
    return jsonify(jogos.listar(request.args.get("categoria"),
                                request.args.get("plataforma"),
                                request.args.get("busca")))


@app.post("/api/jogos")
def criar_jogo():
    d = request.get_json()
    j = Jogo(d["titulo"], d["preco"], d["data_lancamento"], d["classificacao"],
             d.get("estoque") or 0, d["categoria_id"], d["desenvolvedora_id"],
             d.get("desconto") or 0, d.get("descricao", ""))
    jogos.salvar(j, d.get("plataformas", []))
    return jsonify(j.to_dict()), 201


@app.put("/api/jogos/<int:id>")
def atualizar_jogo(id):
    d = request.get_json()
    return jsonify(jogos.atualizar_preco_estoque(id, d["preco"], d["desconto"],
                                                 d["estoque"]).to_dict())


@app.delete("/api/jogos/<int:id>")
def remover_jogo(id):
    jogos.remover(id)
    return "", 204


# ---------- Clientes ----------
@app.get("/api/clientes")
def listar_clientes():
    return jsonify(clientes.listar())


@app.post("/api/clientes")
def criar_cliente():
    d = request.get_json()
    c = Cliente(d["nome"], d["email"], d["cpf"], d["data_nascimento"])
    return jsonify(clientes.salvar(c).to_dict()), 201


@app.delete("/api/clientes/<int:id>")
def remover_cliente(id):
    clientes.remover(id)
    return "", 204


# ---------- Pedidos ----------
@app.get("/api/pedidos")
def listar_pedidos():
    return jsonify(pedidos.listar())


@app.post("/api/pedidos")
def criar_pedido():
    d = request.get_json()
    return jsonify(pedidos.criar(d["cliente_id"], d["itens"])), 201


@app.patch("/api/pedidos/<int:id>/status")
def alterar_status_pedido(id):
    return jsonify(pedidos.alterar_status(id, request.get_json()["status"]))


# ---------- Painel ----------
@app.get("/api/resumo")
def ver_resumo():
    return jsonify(resumo.resumo())


if __name__ == "__main__":
    app.run(debug=True)
