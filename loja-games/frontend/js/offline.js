// =====================================================================
// MODO DEMONSTRAÇÃO (GitHub Pages)
// O GitHub Pages não roda Python, então aqui a API é simulada no próprio
// navegador, com as mesmas regras do back-end Flask. Os dados ficam salvos
// no localStorage de quem está visitando o site.
// =====================================================================
const Offline = (() => {
  const CHAVE = "savepoint-demo-v1";

  const SEED = {
    categorias: [
      { id: 1, nome: "Ação" }, { id: 2, nome: "Aventura" }, { id: 3, nome: "Esporte" },
      { id: 4, nome: "Corrida" }, { id: 5, nome: "Sandbox" }, { id: 6, nome: "Plataforma" },
    ],
    desenvolvedoras: [
      { id: 1, nome: "Rockstar Games", pais: "Estados Unidos" },
      { id: 2, nome: "Naughty Dog", pais: "Estados Unidos" },
      { id: 3, nome: "EA Sports", pais: "Canadá" },
      { id: 4, nome: "Nintendo", pais: "Japão" },
      { id: 5, nome: "Mojang Studios", pais: "Suécia" },
      { id: 6, nome: "Team Cherry", pais: "Austrália" },
    ],
    plataformas: [
      { id: 1, nome: "PC" }, { id: 2, nome: "PlayStation 5" }, { id: 3, nome: "PlayStation 4" },
      { id: 4, nome: "Xbox Series X|S" }, { id: 5, nome: "Nintendo Switch" }, { id: 6, nome: "Nintendo Switch 2" },
    ],
    jogos: [
      { id: 1, titulo: "Grand Theft Auto VI", descricao: "Mundo aberto no estado de Leonida, com a dupla Lucia e Jason. Pré-venda com entrega no lançamento.", preco: 399.9, desconto: 0, data_lancamento: "2026-11-19", classificacao: 18, estoque: 50, categoria_id: 1, desenvolvedora_id: 1, plataformas: [2, 4] },
      { id: 2, titulo: "Grand Theft Auto V", descricao: "Los Santos e as histórias de Michael, Franklin e Trevor, com acesso ao GTA Online.", preco: 99.9, desconto: 50, data_lancamento: "2013-09-17", classificacao: 18, estoque: 35, categoria_id: 1, desenvolvedora_id: 1, plataformas: [1, 2, 3, 4] },
      { id: 3, titulo: "Red Dead Redemption 2", descricao: "Arthur Morgan e a gangue Van der Linde no fim da era do Velho Oeste.", preco: 149.9, desconto: 40, data_lancamento: "2018-10-26", classificacao: 18, estoque: 20, categoria_id: 2, desenvolvedora_id: 1, plataformas: [1, 3] },
      { id: 4, titulo: "Red Dead Redemption", descricao: "A jornada de John Marston pela fronteira americana em 1911.", preco: 199.9, desconto: 0, data_lancamento: "2010-05-18", classificacao: 18, estoque: 12, categoria_id: 2, desenvolvedora_id: 1, plataformas: [1, 3, 5] },
      { id: 5, titulo: "Max Payne 3", descricao: "Tiroteios em câmera lenta pelas ruas de São Paulo.", preco: 59.9, desconto: 30, data_lancamento: "2012-05-15", classificacao: 18, estoque: 8, categoria_id: 1, desenvolvedora_id: 1, plataformas: [1] },
      { id: 6, titulo: "The Last of Us Part I", descricao: "Joel e Ellie atravessam um Estados Unidos devastado por uma pandemia.", preco: 249.9, desconto: 20, data_lancamento: "2022-09-02", classificacao: 18, estoque: 15, categoria_id: 2, desenvolvedora_id: 2, plataformas: [1, 2] },
      { id: 7, titulo: "EA Sports FC 26", descricao: "Futebol com clubes, seleções e o modo Ultimate Team.", preco: 299.9, desconto: 0, data_lancamento: "2025-09-26", classificacao: 0, estoque: 40, categoria_id: 3, desenvolvedora_id: 3, plataformas: [1, 2, 4, 5] },
      { id: 8, titulo: "Mario Kart World", descricao: "Corridas em um mundo aberto conectado, com até 24 pilotos.", preco: 449.9, desconto: 0, data_lancamento: "2025-06-05", classificacao: 0, estoque: 0, categoria_id: 4, desenvolvedora_id: 4, plataformas: [6] },
      { id: 9, titulo: "Minecraft", descricao: "Construa, explore e sobreviva em mundos feitos de blocos.", preco: 119.9, desconto: 0, data_lancamento: "2011-11-18", classificacao: 10, estoque: 60, categoria_id: 5, desenvolvedora_id: 5, plataformas: [1, 2, 4, 5] },
      { id: 10, titulo: "Hollow Knight: Silksong", descricao: "Hornet explora o reino de Pharloum em um metroidvania desafiador.", preco: 59.9, desconto: 0, data_lancamento: "2025-09-04", classificacao: 10, estoque: 25, categoria_id: 6, desenvolvedora_id: 6, plataformas: [1, 2, 4, 5, 6] },
    ],
    clientes: [
      { id: 1, nome: "Ana Beatriz Costa", email: "ana.costa@email.com", cpf: "12345678901", data_nascimento: "1998-04-12" },
      { id: 2, nome: "Rafael Moreira", email: "rafa.moreira@email.com", cpf: "23456789012", data_nascimento: "2001-11-30" },
      { id: 3, nome: "Juliana Prado", email: "ju.prado@email.com", cpf: "34567890123", data_nascimento: "1995-07-08" },
      { id: 4, nome: "Enzo Ribeiro", email: "enzo.ribeiro@email.com", cpf: "45678901234", data_nascimento: "2013-02-21" },
    ],
    pedidos: [
      { id: 1, data_pedido: "2026-11-02", status: "Enviado", total: 139.89, cliente_id: 1,
        itens: [{ jogo_id: 2, quantidade: 1, preco_unitario: 49.95 }, { jogo_id: 3, quantidade: 1, preco_unitario: 89.94 }] },
      { id: 2, data_pedido: "2026-11-10", status: "Pago", total: 699.8, cliente_id: 2,
        itens: [{ jogo_id: 1, quantidade: 1, preco_unitario: 399.9 }, { jogo_id: 7, quantidade: 1, preco_unitario: 299.9 }] },
      { id: 3, data_pedido: "2026-11-14", status: "Pendente", total: 119.9, cliente_id: 4,
        itens: [{ jogo_id: 9, quantidade: 1, preco_unitario: 119.9 }] },
    ],
  };

  // ---------- armazenamento ----------
  let memoria = null;
  const copia = (o) => JSON.parse(JSON.stringify(o));
  function carregar() {
    if (memoria) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { memoria = null; }
    if (!memoria) memoria = copia(SEED);
    return memoria;
  }
  function salvar(db) {
    memoria = db;
    try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) { /* segue só em memória */ }
  }
  function restaurar() {
    try { localStorage.removeItem(CHAVE); } catch (e) { /* ignora */ }
    memoria = null;
  }

  // ---------- utilidades ----------
  class Erro extends Error {}
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const r2 = (v) => Math.round(v * 100) / 100;
  const proximoId = (lista) => lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  function idade(nasc) {
    const [a, m, d] = nasc.split("-").map(Number);
    const h = new Date();
    let anos = h.getFullYear() - a;
    if (h.getMonth() + 1 < m || (h.getMonth() + 1 === m && h.getDate() < d)) anos--;
    return anos;
  }
  const precoFinal = (j) => r2(j.preco * (100 - j.desconto) / 100);

  function jogoDict(db, j) {
    return {
      ...j,
      preco_final: precoFinal(j),
      classificacao_texto: j.classificacao === 0 ? "Livre" : `${j.classificacao}+`,
      disponivel: j.estoque > 0,
      pre_venda: j.data_lancamento > hojeISO(),
      categoria: db.categorias.find((c) => c.id === j.categoria_id)?.nome,
      desenvolvedora: db.desenvolvedoras.find((d) => d.id === j.desenvolvedora_id)?.nome,
      plataformas: db.plataformas.filter((p) => j.plataformas.includes(p.id)).map((p) => p.nome),
    };
  }
  function clienteDict(db, c) {
    return {
      ...c, idade: idade(c.data_nascimento),
      documento: `CPF ${c.cpf.slice(0, 3)}.***.***-${c.cpf.slice(-2)}`,
      pedidos: db.pedidos.filter((p) => p.cliente_id === c.id).length,
    };
  }

  // ---------- rotas ----------
  function rota(metodo, url, corpo) {
    const u = new URL(url, location.href);
    const partes = u.pathname.split("/api/")[1].split("/");
    const [recurso, idTxt, acao] = partes;
    const id = Number(idTxt);
    const db = carregar();

    if (recurso === "categorias") return copia(db.categorias);
    if (recurso === "plataformas") return copia(db.plataformas);
    if (recurso === "desenvolvedoras") return copia(db.desenvolvedoras);

    if (recurso === "jogos") {
      if (metodo === "GET") {
        const cat = Number(u.searchParams.get("categoria"));
        const plat = Number(u.searchParams.get("plataforma"));
        const busca = (u.searchParams.get("busca") || "").toLowerCase();
        return db.jogos
          .filter((j) => !cat || j.categoria_id === cat)
          .filter((j) => !plat || j.plataformas.includes(plat))
          .map((j) => jogoDict(db, j))
          .filter((j) => !busca || j.titulo.toLowerCase().includes(busca) || j.desenvolvedora.toLowerCase().includes(busca))
          .sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento));
      }
      if (metodo === "POST") {
        const titulo = (corpo.titulo || "").trim();
        if (!titulo) throw new Erro("O título é obrigatório.");
        if (db.jogos.some((j) => j.titulo.toLowerCase() === titulo.toLowerCase())) throw new Erro("Já existe um cadastro com esse titulo.");
        const preco = Number(corpo.preco), desconto = Number(corpo.desconto || 0), estoque = Number(corpo.estoque || 0);
        if (!(preco >= 0)) throw new Erro("O preço não pode ser negativo.");
        if (desconto < 0 || desconto > 90) throw new Erro("O desconto deve ficar entre 0% e 90%.");
        if (estoque < 0) throw new Erro("O estoque não pode ser negativo.");
        if (!corpo.data_lancamento) throw new Erro("Informe a data de lançamento.");
        const plats = (corpo.plataformas || []).map(Number);
        if (!plats.length) throw new Erro("Escolha pelo menos uma plataforma.");
        const j = { id: proximoId(db.jogos), titulo, descricao: corpo.descricao || "", preco: r2(preco), desconto,
          data_lancamento: corpo.data_lancamento, classificacao: Number(corpo.classificacao), estoque,
          categoria_id: Number(corpo.categoria_id), desenvolvedora_id: Number(corpo.desenvolvedora_id), plataformas: plats };
        db.jogos.push(j); salvar(db);
        return jogoDict(db, j);
      }
      const j = db.jogos.find((x) => x.id === id);
      if (!j) throw new Erro("Jogo não encontrado.");
      if (metodo === "PUT") {
        const preco = Number(corpo.preco), desconto = Number(corpo.desconto), estoque = Number(corpo.estoque);
        if (!(preco >= 0)) throw new Erro("O preço não pode ser negativo.");
        if (desconto < 0 || desconto > 90) throw new Erro("O desconto deve ficar entre 0% e 90%.");
        if (estoque < 0) throw new Erro("O estoque não pode ser negativo.");
        Object.assign(j, { preco: r2(preco), desconto, estoque }); salvar(db);
        return jogoDict(db, j);
      }
      if (metodo === "DELETE") {
        if (db.pedidos.some((p) => p.itens.some((i) => i.jogo_id === id))) {
          throw new Erro("Esse registro está ligado a outros e não pode ser removido.");
        }
        db.jogos = db.jogos.filter((x) => x.id !== id); salvar(db);
        return null;
      }
    }

    if (recurso === "clientes") {
      if (metodo === "GET") return db.clientes.map((c) => clienteDict(db, c)).sort((a, b) => a.nome.localeCompare(b.nome));
      if (metodo === "POST") {
        const nome = (corpo.nome || "").trim();
        const email = (corpo.email || "").trim().toLowerCase();
        const cpf = String(corpo.cpf || "").replace(/\D/g, "");
        if (nome.length < 3) throw new Erro("O nome deve ter pelo menos 3 caracteres.");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Erro("E-mail inválido.");
        if (cpf.length !== 11) throw new Erro("O CPF deve ter 11 dígitos.");
        if (!corpo.data_nascimento || corpo.data_nascimento > hojeISO()) throw new Erro("Data de nascimento inválida.");
        if (db.clientes.some((c) => c.email === email)) throw new Erro("Já existe um cadastro com esse email.");
        if (db.clientes.some((c) => c.cpf === cpf)) throw new Erro("Já existe um cadastro com esse cpf.");
        const c = { id: proximoId(db.clientes), nome, email, cpf, data_nascimento: corpo.data_nascimento };
        db.clientes.push(c); salvar(db);
        return clienteDict(db, c);
      }
      if (metodo === "DELETE") {
        if (db.pedidos.some((p) => p.cliente_id === id)) throw new Erro("Esse registro está ligado a outros e não pode ser removido.");
        db.clientes = db.clientes.filter((c) => c.id !== id); salvar(db);
        return null;
      }
    }

    if (recurso === "pedidos") {
      if (metodo === "GET") {
        return db.pedidos
          .map((p) => ({
            ...p, cliente: db.clientes.find((c) => c.id === p.cliente_id)?.nome,
            itens: p.itens.map((i) => ({ ...i, titulo: db.jogos.find((j) => j.id === i.jogo_id)?.titulo })),
          }))
          .sort((a, b) => b.data_pedido.localeCompare(a.data_pedido) || b.id - a.id);
      }
      if (metodo === "POST" && !idTxt) {
        const itens = corpo.itens || [];
        if (!itens.length) throw new Erro("O carrinho está vazio.");
        const cliente = db.clientes.find((c) => c.id === Number(corpo.cliente_id));
        if (!cliente) throw new Erro("Cliente não encontrado.");
        // trabalha numa cópia: se algo falhar, nada é gravado (igual à transação do banco)
        const tmp = copia(db);
        const pedido = { id: proximoId(tmp.pedidos), data_pedido: hojeISO(), status: "Pendente", total: 0, cliente_id: cliente.id, itens: [] };
        for (const it of itens) {
          const jogo = tmp.jogos.find((j) => j.id === Number(it.jogo_id));
          const qtd = Number(it.quantidade);
          if (!jogo) throw new Erro("Jogo não encontrado.");
          if (qtd <= 0) throw new Erro("A quantidade deve ser maior que zero.");
          const anos = idade(cliente.data_nascimento);
          if (anos < jogo.classificacao) {
            throw new Erro(`${cliente.nome} tem ${anos} anos e não pode comprar ${jogo.titulo} (classificação ${jogo.classificacao}+).`);
          }
          if (pedido.itens.some((i) => i.jogo_id === jogo.id)) throw new Erro(`${jogo.titulo} já está no pedido.`);
          if (jogo.estoque < qtd) throw new Erro(`Estoque insuficiente de ${jogo.titulo} (restam ${jogo.estoque}).`);
          jogo.estoque -= qtd;
          pedido.itens.push({ jogo_id: jogo.id, quantidade: qtd, preco_unitario: precoFinal(jogo) });
        }
        pedido.total = r2(pedido.itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0));
        tmp.pedidos.push(pedido);
        salvar(tmp);
        return { id: pedido.id, total: pedido.total, status: pedido.status };
      }
      if (metodo === "PATCH" && acao === "status") {
        const p = db.pedidos.find((x) => x.id === id);
        if (!p) throw new Erro("Pedido não encontrado.");
        if (!["Pendente", "Pago", "Enviado", "Cancelado"].includes(corpo.status)) throw new Erro("Status inválido.");
        if (p.status === "Cancelado") throw new Erro("Um pedido cancelado não pode mudar de status.");
        p.status = corpo.status;
        if (p.status === "Cancelado") {
          p.itens.forEach((i) => { const j = db.jogos.find((x) => x.id === i.jogo_id); if (j) j.estoque += i.quantidade; });
        }
        salvar(db);
        return { id, status: p.status };
      }
    }

    if (recurso === "resumo") {
      const ativos = db.pedidos.filter((p) => p.status !== "Cancelado");
      const vendas = {};
      ativos.forEach((p) => p.itens.forEach((i) => {
        vendas[i.jogo_id] ??= { unidades: 0, faturamento: 0 };
        vendas[i.jogo_id].unidades += i.quantidade;
        vendas[i.jogo_id].faturamento += i.quantidade * i.preco_unitario;
      }));
      return {
        jogos: db.jogos.length,
        clientes: db.clientes.length,
        pedidos: ativos.length,
        faturamento: r2(ativos.reduce((s, p) => s + p.total, 0)),
        sem_estoque: db.jogos.filter((j) => j.estoque === 0).length,
        mais_vendidos: Object.entries(vendas)
          .map(([jid, v]) => ({ titulo: db.jogos.find((j) => j.id === Number(jid))?.titulo || "(removido)", unidades: v.unidades, faturamento: r2(v.faturamento) }))
          .sort((a, b) => b.unidades - a.unidades || b.faturamento - a.faturamento)
          .slice(0, 5),
      };
    }

    throw new Erro("Rota não encontrada.");
  }

  return { rota, restaurar, Erro };
})();
