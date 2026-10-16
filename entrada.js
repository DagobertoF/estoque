
const supabaseUrl = "https://vxrmaqdezjfizlbjmpuj.supabase.co";
const supabaseKey = "sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

const produtoSelect = document.getElementById("produto");
const quantidadeEntrada = document.getElementById("quantidade_entrada");
const formEntrada = document.getElementById("form_entrada");
const listaEntradas = document.getElementById("lista_entradas");

// Carregar produtos no select
async function carregarProdutosEntrada() {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("id, nome")
    .order("nome");

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    alert("Não foi possível carregar os produtos.");
    return;
  }

  produtoSelect.replaceChildren(
    new Option("Selecione um produto", "")
  );

  data.forEach(function (produto) {
    const opcao = new Option(produto.nome, produto.id);
    produtoSelect.appendChild(opcao);
  });
}

// Carregar histórico de entradas
async function carregarEntradas() {
  listaEntradas.replaceChildren();

  const { data, error } = await supabaseClient
    .from("entradas")
    .select("id, quantidade, data_entrada, produtos(nome)")
    .order("data_entrada", { ascending: false });

  if (error) {
    console.error("Erro ao carregar entradas:", error);
    listaEntradas.innerHTML =
      '<tr><td colspan="3">Erro ao carregar histórico.</td></tr>';
    return;
  }

  if (data.length === 0) {
    listaEntradas.innerHTML =
      '<tr><td colspan="3">Nenhuma entrada registrada.</td></tr>';
    return;
  }

  data.forEach(function (entrada) {
    const linha = document.createElement("tr");

    const colunaProduto = document.createElement("td");
    colunaProduto.textContent = entrada.produtos.nome;

    const colunaQuantidade = document.createElement("td");
    colunaQuantidade.textContent = entrada.quantidade;

    const colunaData = document.createElement("td");
    colunaData.textContent = new Date(
      entrada.data_entrada
    ).toLocaleString("pt-BR");

    linha.append(colunaProduto, colunaQuantidade, colunaData);
    listaEntradas.appendChild(linha);
  });
}

// Registrar entrada
formEntrada.addEventListener("submit", async function (event) {
  event.preventDefault();

  const idProduto = produtoSelect.value;
  const quantidade = Number(quantidadeEntrada.value);

  if (!idProduto) {
    alert("Selecione um produto.");
    return;
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    alert("Digite uma quantidade inteira maior que zero.");
    return;
  }

  const { error } = await supabaseClient.rpc("registrar_entrada", {
    p_produto_id: Number(idProduto),
    p_quantidade: quantidade
  });

  if (error) {
    console.error("Erro ao registrar entrada:", error);
    alert("Não foi possível registrar a entrada: " + error.message);
    return;
  }

  alert("Entrada registrada com sucesso!");

  formEntrada.reset();

  await carregarEntradas();
});

// Inicializar a página
carregarProdutosEntrada();
carregarEntradas();
