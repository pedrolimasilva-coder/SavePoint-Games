"""Modelos do domínio da loja (Programação Orientada a Objetos)."""
import re
from abc import ABC, abstractmethod
from datetime import date


def _data(valor):
    return valor if isinstance(valor, date) else date.fromisoformat(str(valor))


class RegraNegocioError(ValueError):
    """Erro lançado quando uma regra da loja é violada."""


# =====================================================================
# Pessoas
# =====================================================================
class Pessoa(ABC):
    """Classe abstrata base para qualquer pessoa do sistema."""

    def __init__(self, nome, id=None):
        self.id = id
        self.nome = nome

    @property
    def nome(self):
        return self._nome

    @nome.setter
    def nome(self, valor):
        if not valor or len(str(valor).strip()) < 3:
            raise RegraNegocioError("O nome deve ter pelo menos 3 caracteres.")
        self._nome = str(valor).strip()

    @abstractmethod
    def documento(self):
        """Cada tipo de pessoa é identificado por um documento diferente."""

    def __str__(self):
        return f"{self.nome} ({self.documento()})"


class Cliente(Pessoa):
    def __init__(self, nome, email, cpf, data_nascimento, id=None):
        super().__init__(nome, id)
        self.email = email
        self.cpf = cpf
        self.data_nascimento = _data(data_nascimento)
        if self.data_nascimento > date.today():
            raise RegraNegocioError("Data de nascimento inválida.")

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, valor):
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", str(valor or "")):
            raise RegraNegocioError("E-mail inválido.")
        self._email = valor.strip().lower()

    @property
    def cpf(self):
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        numeros = re.sub(r"\D", "", str(valor or ""))
        if len(numeros) != 11:
            raise RegraNegocioError("O CPF deve ter 11 dígitos.")
        self._cpf = numeros

    def documento(self):
        return f"CPF {self._cpf[:3]}.***.***-{self._cpf[-2:]}"

    def idade(self, hoje=None):
        hoje = hoje or date.today()
        anos = hoje.year - self.data_nascimento.year
        if (hoje.month, hoje.day) < (self.data_nascimento.month, self.data_nascimento.day):
            anos -= 1
        return anos

    def pode_comprar(self, jogo):
        """Respeita a classificação indicativa do jogo."""
        return self.idade() >= jogo.classificacao

    def to_dict(self):
        return {"id": self.id, "nome": self.nome, "email": self.email, "cpf": self.cpf,
                "data_nascimento": self.data_nascimento.isoformat(),
                "idade": self.idade(), "documento": self.documento()}


# =====================================================================
# Produtos
# =====================================================================
class Produto(ABC):
    """Classe abstrata para qualquer coisa que a loja vende."""

    def __init__(self, titulo, preco, desconto=0, id=None):
        self.id = id
        self.titulo = titulo
        self.preco = preco
        self.desconto = desconto

    @property
    def titulo(self):
        return self._titulo

    @titulo.setter
    def titulo(self, valor):
        if not valor or not str(valor).strip():
            raise RegraNegocioError("O título é obrigatório.")
        self._titulo = str(valor).strip()

    @property
    def preco(self):
        return self._preco

    @preco.setter
    def preco(self, valor):
        valor = round(float(valor), 2)
        if valor < 0:
            raise RegraNegocioError("O preço não pode ser negativo.")
        self._preco = valor

    @property
    def desconto(self):
        return self._desconto

    @desconto.setter
    def desconto(self, valor):
        valor = int(valor or 0)
        if not 0 <= valor <= 90:
            raise RegraNegocioError("O desconto deve ficar entre 0% e 90%.")
        self._desconto = valor

    def preco_final(self):
        return round(self.preco * (100 - self.desconto) / 100, 2)

    @abstractmethod
    def disponivel(self, quantidade=1):
        """Cada produto decide se pode ser vendido."""


class Jogo(Produto):
    CLASSIFICACOES = (0, 10, 12, 14, 16, 18)

    def __init__(self, titulo, preco, data_lancamento, classificacao, estoque,
                 categoria_id, desenvolvedora_id, desconto=0, descricao="",
                 plataformas=None, id=None):
        super().__init__(titulo, preco, desconto, id)
        self.data_lancamento = _data(data_lancamento)
        self.classificacao = int(classificacao)
        if self.classificacao not in self.CLASSIFICACOES:
            raise RegraNegocioError("Classificação indicativa inválida.")
        self.estoque = int(estoque)
        if self.estoque < 0:
            raise RegraNegocioError("O estoque não pode ser negativo.")
        self.categoria_id = categoria_id
        self.desenvolvedora_id = desenvolvedora_id
        self.descricao = descricao or ""
        self.plataformas = plataformas or []

    def em_pre_venda(self, hoje=None):
        return self.data_lancamento > (hoje or date.today())

    def disponivel(self, quantidade=1):
        return self.estoque >= quantidade

    def baixar_estoque(self, quantidade):
        if not self.disponivel(quantidade):
            raise RegraNegocioError(
                f"Estoque insuficiente de {self.titulo} (restam {self.estoque}).")
        self.estoque -= quantidade

    def repor_estoque(self, quantidade):
        self.estoque += quantidade

    def classificacao_texto(self):
        return "Livre" if self.classificacao == 0 else f"{self.classificacao}+"

    def to_dict(self):
        return {
            "id": self.id, "titulo": self.titulo, "descricao": self.descricao,
            "preco": self.preco, "desconto": self.desconto,
            "preco_final": self.preco_final(),
            "data_lancamento": self.data_lancamento.isoformat(),
            "classificacao": self.classificacao,
            "classificacao_texto": self.classificacao_texto(),
            "estoque": self.estoque, "disponivel": self.disponivel(),
            "pre_venda": self.em_pre_venda(),
            "categoria_id": self.categoria_id,
            "desenvolvedora_id": self.desenvolvedora_id,
            "plataformas": self.plataformas,
        }


# =====================================================================
# Pedidos
# =====================================================================
class ItemPedido:
    def __init__(self, jogo, quantidade, preco_unitario=None, id=None):
        self.id = id
        self.jogo = jogo
        self.quantidade = int(quantidade)
        if self.quantidade <= 0:
            raise RegraNegocioError("A quantidade deve ser maior que zero.")
        # guarda o preço do momento da compra (o preço do jogo pode mudar depois)
        self.preco_unitario = preco_unitario if preco_unitario is not None else jogo.preco_final()

    def subtotal(self):
        return round(self.preco_unitario * self.quantidade, 2)


class Pedido:
    STATUS = ("Pendente", "Pago", "Enviado", "Cancelado")

    def __init__(self, cliente, data_pedido=None, status="Pendente", id=None):
        self.id = id
        self.cliente = cliente
        self.data_pedido = _data(data_pedido or date.today())
        self.status = status
        self.itens = []

    def adicionar_item(self, jogo, quantidade):
        """Composição: o pedido monta e valida os próprios itens."""
        if not self.cliente.pode_comprar(jogo):
            raise RegraNegocioError(
                f"{self.cliente.nome} tem {self.cliente.idade()} anos e não pode comprar "
                f"{jogo.titulo} (classificação {jogo.classificacao_texto()}).")
        if any(i.jogo.id == jogo.id for i in self.itens):
            raise RegraNegocioError(f"{jogo.titulo} já está no pedido.")
        jogo.baixar_estoque(quantidade)
        self.itens.append(ItemPedido(jogo, quantidade))

    def total(self):
        return round(sum(i.subtotal() for i in self.itens), 2)

    def alterar_status(self, novo):
        if novo not in self.STATUS:
            raise RegraNegocioError("Status inválido.")
        if self.status == "Cancelado":
            raise RegraNegocioError("Um pedido cancelado não pode mudar de status.")
        self.status = novo
