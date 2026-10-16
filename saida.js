const supabaseUrl = "https://vxrmaqdezjfizlbjmpuj.supabase.co";
const supabaseKey = "sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


const produtoSelect = document.getElementById("produto");
const quantidadeSaida = document.getElementById("quantidade_saida");
const formSaida = document.getElementById("form_saida");
const listaSaidas = document.getElementById("lista_saidas");

// Carregar os produtos no select
async function carregarProdutosSaida() {
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

// Carregar o histórico de saídas
async function carregarSaidas() {
  listaSaidas.replaceChildren();

  const { data, error } = await supabaseClient
    .from("saidas")
    .select("id, quantidade, data_saida, produtos(nome)")
    .order("data_saida", { ascending: false });

  if (error) {
    console.error("Erro ao carregar saídas:", error);
    listaSaidas.innerHTML =
      '<tr><td colspan="3">Erro ao carregar histórico.</td></tr>';
    return;
  }

  if (data.length === 0) {
    listaSaidas.innerHTML =
      '<tr><td colspan="3">Nenhuma saída registrada.</td></tr>';
    return;
  }

  data.forEach(function (saida) {
    const linha = document.createElement("tr");

    const colunaProduto = document.createElement("td");
    colunaProduto.textContent = saida.produtos.nome;

    const colunaQuantidade = document.createElement("td");
    colunaQuantidade.textContent = saida.quantidade;

    const colunaData = document.createElement("td");
    colunaData.textContent = new Date(
      saida.data_saida
    ).toLocaleString("pt-BR");

    linha.append(colunaProduto, colunaQuantidade, colunaData);
    listaSaidas.appendChild(linha);
  });
}

// Registrar uma saída
formSaida.addEventListener("submit", async function (event) {
  event.preventDefault();

  const idProduto = produtoSelect.value;
  const quantidade = Number(quantidadeSaida.value);

  if (!idProduto) {
    alert("Selecione um produto.");
    return;
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    alert("Digite uma quantidade inteira maior que zero.");
    return;
  }

  const { error } = await supabaseClient.rpc("registrar_saida", {
    p_produto_id: Number(idProduto),
    p_quantidade: quantidade
  });

  if (error) {
    console.error("Erro ao registrar saída:", error);
    alert("Não foi possível registrar a saída: " + error.message);
    return;
  }

  alert("Saída registrada com sucesso!");

  formSaida.reset();

  await carregarSaidas();
});

// Inicializar a página
carregarProdutosSaida();
carregarSaidas();
