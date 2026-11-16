// Save Point Games - front-end
// Consome a API Flask e atualiza a tela sem recarregar a página.

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
// Se o servidor Flask estiver rodando, usa a API de verdade.
// Se não (ex.: GitHub Pages), usa a API simulada do offline.js.
let modoDemo = null;
async function detectarModo() {
  if (modoDemo !== null) return modoDemo;
  try {
    const r = await fetch("/api/plataformas");
    modoDemo = !(r.ok && (r.headers.get("content-type") || "").includes("json"));
  } catch (e) {
    modoDemo = true;
  }
  return modoDemo;
}

const api = {
  async get(url) {
    if (await detectarModo()) return Offline.rota("GET", url);
    const r = await fetch(url);
    return r.json();
  },
  async enviar(url, metodo, dados) {
    if (await detectarModo()) return Offline.rota(metodo, url, dados);
    const r = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: dados ? JSON.stringify(dados) : undefined,
    });
    if (!r.ok) {
      const erro = await r.json().catch(() => ({}));
      throw new Error(erro.erro || "Erro na requisição");
    }
    return r.status === 204 ? null : r.json();
  },
};

const $ = (sel) => document.querySelector(sel);
const real = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (iso) => (iso ? iso.split("-").reverse().join("/") : "-");
const escapar = (t) => String(t ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function avisar(msg, erro = false) {
  const el = $("#aviso");
  el.textContent = msg;
  el.className = "aviso visivel" + (erro ? " erro" : "");
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => (el.className = "aviso"), 3200);
}

// Capas: cada jogo usa a ilustração img/capas/<nome-do-jogo>.svg.
// Se o arquivo não existir (ex.: jogo recém-cadastrado), aparece um degradê.
const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PALETAS = [
  ["#ff3d7f", "#ff9a3d"], ["#1e3c72", "#2a9d8f"], ["#8e2de2", "#4a00e0"],
  ["#c0392b", "#2c1810"], ["#11998e", "#38ef7d"], ["#f7971e", "#7a2e0e"],
  ["#232526", "#5f6b7a"], ["#e52d27", "#5c0a0a"], ["#4568dc", "#b06ab3"],
  ["#0f2027", "#2c5364"],
];
function capa(jogo) {
  const [a, b] = PALETAS[jogo.id % PALETAS.length];
  return `background-image: url(img/capas/${slug(jogo.titulo)}.svg), linear-gradient(150deg, ${a}, ${b});`;
}
const classif = (j) =>
  `<span class="classif c${j.classificacao}" title="Classificação indicativa">${j.classificacao === 0 ? "L" : j.classificacao}</span>`;

// ---------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------
let jogosLoja = [];
let filtroPlataforma = "";
let carrinho = [];   // [{ jogo, quantidade }]

// ---------------------------------------------------------------------
// Navegação
// ---------------------------------------------------------------------
document.querySelectorAll("[data-modo]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    const modo = b.dataset.modo;
    document.querySelectorAll(".modo").forEach((m) => m.classList.toggle("ativo", m.dataset.modo === modo));
    document.querySelectorAll(".area").forEach((a) => a.classList.toggle("ativa", a.id === modo));
    if (modo === "loja") carregarVitrine();
    else carregarAba(document.querySelector(".aba.ativa").dataset.aba);
  }));

document.querySelectorAll(".aba").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".aba, .secao").forEach((el) => el.classList.remove("ativa"));
    b.classList.add("ativa");
    $("#" + b.dataset.aba).classList.add("ativa");
    carregarAba(b.dataset.aba);
  }));

// ---------------------------------------------------------------------
// Loja
// ---------------------------------------------------------------------
async function iniciarLoja() {
  const [plats, cats] = await Promise.all([api.get("/api/plataformas"), api.get("/api/categorias")]);

  const chips = $("#chips-plataforma");
  chips.innerHTML = `<button class="chip ativo" data-id="">Todas</button>` +
    plats.map((p) => `<button class="chip" data-id="${p.id}">${escapar(p.nome)}</button>`).join("");
  chips.addEventListener("click", (e) => {
    if (!e.target.classList.contains("chip")) return;
    chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("ativo"));
    e.target.classList.add("ativo");
    filtroPlataforma = e.target.dataset.id;
    carregarVitrine();
  });

  $("#filtro-categoria").innerHTML += cats.map((c) => `<option value="${c.id}">${escapar(c.nome)}</option>`).join("");
  $("#filtro-categoria").addEventListener("change", carregarVitrine);
  let espera;
  $("#filtro-busca").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(carregarVitrine, 250); });

  // listas usadas no formulário de jogos (admin)
  $("#sel-categoria").innerHTML = cats.map((c) => `<option value="${c.id}">${escapar(c.nome)}</option>`).join("");
  $("#check-plataformas").innerHTML = plats.map((p) =>
    `<label><input type="checkbox" name="plataformas" value="${p.id}"> ${escapar(p.nome)}</label>`).join("");
  const devs = await api.get("/api/desenvolvedoras");
  $("#sel-dev").innerHTML = devs.map((d) => `<option value="${d.id}">${escapar(d.nome)}</option>`).join("");

  await carregarDestaque();
  await carregarVitrine();
}

async function carregarDestaque() {
  const todos = await api.get("/api/jogos");
  // destaque: o próximo lançamento em pré-venda; se não houver, o maior desconto
  const pre = todos.filter((j) => j.pre_venda).sort((a, b) => a.data_lancamento.localeCompare(b.data_lancamento));
  const j = pre[0] || [...todos].sort((a, b) => b.desconto - a.desconto)[0];
  if (!j) return;
  const dias = Math.ceil((new Date(j.data_lancamento + "T00:00:00") - new Date()) / 86400000);
  const etiqueta = j.pre_venda
    ? `PRÉ-VENDA · LANÇA ${dias <= 1 ? "AMANHÃ" : `EM ${dias} DIAS`} (${data(j.data_lancamento)})`
    : `OFERTA · -${j.desconto}%`;
  $("#destaque").style.backgroundImage =
    `linear-gradient(90deg, rgba(10,8,20,.88) 0%, rgba(10,8,20,.55) 50%, rgba(10,8,20,.1) 100%), url(img/capas/${slug(j.titulo)}.svg)`;
  $("#destaque").innerHTML = `
    <span class="etiqueta">${etiqueta}</span>
    <h1>${escapar(j.titulo)}</h1>
    <p>${escapar(j.descricao)}</p>
    <div class="acoes-destaque">
      <span class="preco-destaque">${real(j.preco_final)}</span>
      <button data-add="${j.id}" ${j.disponivel ? "" : "disabled"}>
        ${j.pre_venda ? "Reservar agora" : "Adicionar ao carrinho"}</button>
    </div>`;
  jogosLoja = todos;   // garante que o botão do destaque encontre o jogo
}

async function carregarVitrine() {
  const params = new URLSearchParams();
  if (filtroPlataforma) params.set("plataforma", filtroPlataforma);
  if ($("#filtro-categoria").value) params.set("categoria", $("#filtro-categoria").value);
  if ($("#filtro-busca").value.trim()) params.set("busca", $("#filtro-busca").value.trim());

  const lista = await api.get("/api/jogos?" + params);
  // mantém na memória todos os jogos já vistos (para o carrinho)
  lista.forEach((j) => { const i = jogosLoja.findIndex((x) => x.id === j.id); i >= 0 ? (jogosLoja[i] = j) : jogosLoja.push(j); });

  $("#contagem").textContent = `${lista.length} ${lista.length === 1 ? "jogo encontrado" : "jogos encontrados"}`;
  $("#vitrine").innerHTML = lista.length ? lista.map(cardJogo).join("")
    : `<p class="vazio">Nenhum jogo encontrado com esses filtros.</p>`;
}

function cardJogo(j) {
  const selos = [
    j.pre_venda ? `<span class="selo pre">PRÉ-VENDA</span>` : "",
    j.desconto ? `<span class="selo desc">-${j.desconto}%</span>` : "",
    !j.disponivel ? `<span class="selo">ESGOTADO</span>` : "",
  ].join("");
  return `
    <article class="jogo">
      <div class="capa" style="${capa(j)}">
        <div class="selos">${selos}${classif(j)}</div>
        <h3>${escapar(j.titulo)}</h3>
        <span class="dev">${escapar(j.desenvolvedora)} · ${escapar(j.categoria)}</span>
      </div>
      <div class="info">
        <span class="plats">${escapar(j.plataformas.join(" · "))}</span>
        <div class="preco-linha">
          ${j.desconto ? `<s>${real(j.preco)}</s>` : ""}
          <strong>${real(j.preco_final)}</strong>
        </div>
        <button class="btn-add" data-add="${j.id}" ${j.disponivel ? "" : "disabled"}>
          ${!j.disponivel ? "Esgotado" : j.pre_venda ? "Reservar" : "Adicionar ao carrinho"}</button>
      </div>
    </article>`;
}

document.addEventListener("click", (e) => {
  const id = e.target.dataset?.add;
  if (!id) return;
  const jogo = jogosLoja.find((j) => j.id === Number(id));
  const item = carrinho.find((i) => i.jogo.id === jogo.id);
  if (item) {
    if (item.quantidade >= jogo.estoque) return avisar(`Só temos ${jogo.estoque} unidades de ${jogo.titulo}.`, true);
    item.quantidade++;
  } else {
    carrinho.push({ jogo, quantidade: 1 });
  }
  atualizarCarrinho();
  avisar(`${jogo.titulo} foi para o carrinho.`);
});

// ---------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------
function abrirCarrinho(abrir) {
  $("#carrinho").classList.toggle("aberto", abrir);
  $("#fundo").classList.toggle("visivel", abrir);
  if (abrir) carregarClientesCarrinho();
}
$("#abrir-carrinho").addEventListener("click", () => abrirCarrinho(true));
$("#fechar-carrinho").addEventListener("click", () => abrirCarrinho(false));
$("#fundo").addEventListener("click", () => abrirCarrinho(false));

async function carregarClientesCarrinho() {
  const lista = await api.get("/api/clientes");
  const atual = $("#sel-cliente").value;
  $("#sel-cliente").innerHTML = `<option value="">Selecione o cliente</option>` +
    lista.map((c) => `<option value="${c.id}">${escapar(c.nome)} (${c.idade} anos)</option>`).join("");
  $("#sel-cliente").value = atual;
}

function atualizarCarrinho() {
  $("#qtd-carrinho").textContent = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const total = carrinho.reduce((s, i) => s + i.jogo.preco_final * i.quantidade, 0);
  $("#total-carrinho").textContent = real(total);
  $("#finalizar").disabled = carrinho.length === 0;
  $("#itens-carrinho").innerHTML = carrinho.length
    ? carrinho.map((i, n) => `
      <div class="item">
        <div class="mini-capa" style="${capa(i.jogo)}"></div>
        <div>
          <h4>${escapar(i.jogo.titulo)}</h4>
          <small>${real(i.jogo.preco_final)} cada</small>
          <div class="qtd">
            <button data-qtd="-1" data-n="${n}" aria-label="Menos">−</button>
            <span>${i.quantidade}</span>
            <button data-qtd="1" data-n="${n}" aria-label="Mais">+</button>
          </div>
        </div>
        <span class="subtotal">${real(i.jogo.preco_final * i.quantidade)}</span>
      </div>`).join("")
    : `<p class="vazio">Seu carrinho está vazio.</p>`;
}

$("#itens-carrinho").addEventListener("click", (e) => {
  const passo = Number(e.target.dataset.qtd);
  if (!passo) return;
  const item = carrinho[e.target.dataset.n];
  item.quantidade += passo;
  if (item.quantidade > item.jogo.estoque) {
    item.quantidade = item.jogo.estoque;
    avisar(`Só temos ${item.jogo.estoque} unidades.`, true);
  }
  if (item.quantidade <= 0) carrinho.splice(e.target.dataset.n, 1);
  atualizarCarrinho();
});

$("#finalizar").addEventListener("click", async () => {
  const cliente_id = $("#sel-cliente").value;
  if (!cliente_id) return avisar("Escolha o cliente antes de finalizar.", true);
  try {
    const r = await api.enviar("/api/pedidos", "POST", {
      cliente_id,
      itens: carrinho.map((i) => ({ jogo_id: i.jogo.id, quantidade: i.quantidade })),
    });
    carrinho = [];
    atualizarCarrinho();
    abrirCarrinho(false);
    avisar(`Pedido #${r.id} criado! Total: ${real(r.total)}`);
    carregarDestaque();
    carregarVitrine();
  } catch (err) {
    avisar(err.message, true);
  }
});

// ---------------------------------------------------------------------
// Administração
// ---------------------------------------------------------------------
function carregarAba(aba) {
  return { painel: carregarPainel, jogos: carregarJogosAdmin,
           clientes: carregarClientes, pedidos: carregarPedidos }[aba]();
}

async function carregarPainel() {
  const r = await api.get("/api/resumo");
  $("#cards-resumo").innerHTML = [
    [real(r.faturamento), "Faturamento"],
    [r.pedidos, "Pedidos ativos"],
    [r.jogos, "Jogos no catálogo"],
    [r.clientes, "Clientes"],
    [r.sem_estoque, "Jogos esgotados"],
  ].map(([v, t]) => `<div class="card"><strong>${v}</strong><span>${t}</span></div>`).join("");

  const max = Math.max(1, ...r.mais_vendidos.map((m) => m.unidades));
  $("#mais-vendidos").innerHTML = r.mais_vendidos.length
    ? r.mais_vendidos.map((m) => `
      <div class="rank">
        <div>${escapar(m.titulo)}<div class="barra"><i style="width:${(m.unidades / max) * 100}%"></i></div></div>
        <b>${m.unidades} un.</b>
      </div>`).join("")
    : `<p class="vazio">Nenhuma venda ainda.</p>`;
}

async function carregarJogosAdmin() {
  const lista = await api.get("/api/jogos");
  $("#tabela-jogos").innerHTML = lista.map((j) => `
    <tr data-id="${j.id}">
      <td><strong>${escapar(j.titulo)}</strong><small>${escapar(j.desenvolvedora)} · ${data(j.data_lancamento)}${j.pre_venda ? " · pré-venda" : ""}</small></td>
      <td>${classif(j)}</td>
      <td><input type="number" step="0.01" min="0" value="${j.preco}" data-campo="preco"></td>
      <td><input type="number" min="0" max="90" value="${j.desconto}" data-campo="desconto"></td>
      <td><input type="number" min="0" value="${j.estoque}" data-campo="estoque"></td>
      <td><button class="btn-mini" data-salvar>Salvar</button>
          <button class="btn-mini perigo" data-remover-jogo>Remover</button></td>
    </tr>`).join("");
}

$("#tabela-jogos").addEventListener("click", async (e) => {
  const linha = e.target.closest("tr");
  if (!linha) return;
  const id = linha.dataset.id;
  try {
    if (e.target.hasAttribute("data-salvar")) {
      const valor = (c) => linha.querySelector(`[data-campo="${c}"]`).value;
      await api.enviar(`/api/jogos/${id}`, "PUT",
        { preco: valor("preco"), desconto: valor("desconto"), estoque: valor("estoque") });
      avisar("Jogo atualizado.");
    } else if (e.target.hasAttribute("data-remover-jogo")) {
      if (!confirm("Remover este jogo do catálogo?")) return;
      await api.enviar(`/api/jogos/${id}`, "DELETE");
      avisar("Jogo removido.");
    } else return;
    carregarJogosAdmin();
  } catch (err) { avisar(err.message, true); }
});

$("#form-jogo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const dados = Object.fromEntries(fd);
  dados.plataformas = fd.getAll("plataformas");
  try {
    await api.enviar("/api/jogos", "POST", dados);
    e.target.reset();
    avisar("Jogo cadastrado.");
    carregarJogosAdmin();
  } catch (err) { avisar(err.message, true); }
});

async function carregarClientes() {
  const lista = await api.get("/api/clientes");
  $("#tabela-clientes").innerHTML = lista.map((c) => `
    <tr>
      <td>${escapar(c.nome)}</td><td>${escapar(c.email)}</td><td>${escapar(c.documento)}</td>
      <td>${c.idade}</td><td>${c.pedidos}</td>
      <td><button class="btn-mini perigo" data-remover-cliente="${c.id}">Remover</button></td>
    </tr>`).join("");
}

$("#tabela-clientes").addEventListener("click", async (e) => {
  const id = e.target.dataset.removerCliente;
  if (!id || !confirm("Remover este cliente?")) return;
  try {
    await api.enviar(`/api/clientes/${id}`, "DELETE");
    avisar("Cliente removido.");
    carregarClientes();
  } catch (err) { avisar(err.message, true); }
});

$("#form-cliente").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api.enviar("/api/clientes", "POST", Object.fromEntries(new FormData(e.target)));
    e.target.reset();
    avisar("Cliente cadastrado.");
    carregarClientes();
  } catch (err) { avisar(err.message, true); }
});

async function carregarPedidos() {
  const lista = await api.get("/api/pedidos");
  const opcoes = ["Pendente", "Pago", "Enviado", "Cancelado"];
  $("#tabela-pedidos").innerHTML = lista.map((p) => `
    <tr>
      <td>#${p.id}</td><td>${data(p.data_pedido)}</td><td>${escapar(p.cliente)}</td>
      <td>${p.itens.map((i) => `${i.quantidade}× ${escapar(i.titulo)}`).join("<br>")}</td>
      <td>${real(p.total)}</td>
      <td><select class="status ${p.status}" data-pedido="${p.id}" ${p.status === "Cancelado" ? "disabled" : ""}>
        ${opcoes.map((o) => `<option ${o === p.status ? "selected" : ""}>${o}</option>`).join("")}
      </select></td>
    </tr>`).join("");
}

$("#tabela-pedidos").addEventListener("change", async (e) => {
  const id = e.target.dataset.pedido;
  if (!id) return;
  if (e.target.value === "Cancelado" && !confirm("Cancelar o pedido? Os jogos voltam para o estoque.")) {
    return carregarPedidos();
  }
  try {
    await api.enviar(`/api/pedidos/${id}/status`, "PATCH", { status: e.target.value });
    avisar("Status atualizado.");
  } catch (err) { avisar(err.message, true); }
  carregarPedidos();
});

// ---------------------------------------------------------------------
async function iniciar() {
  if (await detectarModo()) {
    $("#aviso-demo").hidden = false;
    $("#restaurar-demo").addEventListener("click", () => {
      if (!confirm("Apagar as alterações feitas e voltar aos dados iniciais?")) return;
      Offline.restaurar();
      location.reload();
    });
  }
  iniciarLoja();
  atualizarCarrinho();
}
iniciar();
