const supabaseUrl = 'https://vxrmaqdezjfizlbjmpuj.supabase.co';
const supabaseKey = 'sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC';

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

const produtoSelect = document.getElementById("produto");

async function carregarProdutosSaida() {

const { data, error } = await supabaseClient
        .from('produtos')
        .select('*');

        data.forEach(function(produto) {
        const opcao = document.createElement("option");

        opcao.value = produto.id;
        opcao.textContent = produto.nome;

        produtoSelect.appendChild(opcao);
});

}

carregarProdutosSaida();

produtoSelect.addEventListener("change", function() {

    console.log(produtoSelect.value);

});

const quantidadeSaida = document.getElementById("quantidade_saida");

quantidadeSaida.addEventListener("input", function() {

    console.log("Quantidade:", quantidadeSaida.value);

});


const formSaida = document.getElementById("form_saida");

formSaida.addEventListener("submit", async function(event) {
    event.preventDefault();

    const idProduto = produtoSelect.value;
    const quantidade = Number(quantidadeSaida.value);

    // 1. Validar a quantidade
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        alert("Digite uma quantidade inteira maior que zero.");
        return;
    }

    // 2. Buscar a quantidade atual do produto
    const { data, error } = await supabaseClient
        .from("produtos")
        .select("quantidade")
        .eq("id", idProduto)
        .single();

    if (error) {
        console.error("Erro ao buscar produto:", error);
        alert("Não foi possível consultar o produto.");
        return;
    }

    // 3. Calcular a nova quantidade
    const novaQuantidade = Number(data.quantidade) - quantidade;

    // 4. Atualizar o produto no Supabase
    const { error: erroAtualizacao } = await supabaseClient
        .from("produtos")
        .update({ quantidade: novaQuantidade })
        .eq("id", idProduto);

    if (erroAtualizacao) {
        console.error("Erro ao atualizar estoque:", erroAtualizacao);
        alert("Não foi possível registrar a saida.");
        return;
    }

    // 5. Informar que deu certo
    alert("Saida registrada com sucesso!");

    formEntrada.reset();
});
