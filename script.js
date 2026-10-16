const supabaseUrl = "https://vxrmaqdezjfizlbjmpuj.supabase.co";
const supabaseKey = "sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const form_produto = document.getElementById("form_produto");
if (form_produto) {
  form_produto.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const quantidade = document.getElementById("quantidade").value;
    const qnt_minima = document.getElementById("qnt_minima").value;
    const preco = document.getElementById("preco").value;
    const fornecedor = document.getElementById("fornecedor").value;

    const { data, error } = await supabaseClient.from("produtos").insert([
      {
        nome: nome,
        quantidade: quantidade,
        quantidade_minima: qnt_minima,
        preco: preco,
        fornecedor: fornecedor,
      },
    ]);

    if (error) {
      console.error("Erro ao Cadastrar:", error);
    } else {
      console.log("Produto Cadastrado com Sucesso!", data);
      window.location.href = "dashboard.html";
    }
  });
}

const lista_produtos = document.getElementById("lista_produtos");

const pesquisa_produto = document.getElementById("pesquisa_produto");

if (pesquisa_produto) {
  pesquisa_produto.addEventListener("input", function () {
    carregarProdutos();
  });
}

async function carregarProdutos() {
  if (!lista_produtos) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("id", { ascending: true });

  let produtos = data;

  if (pesquisa_produto) {
    const textoPesquisa = pesquisa_produto.value.toLowerCase();

    produtos = produtos.filter(function (produto) {
      return produto.nome.toLowerCase().includes(textoPesquisa);
    });
  }

  console.log("PRODUTOS RECEBIDOS:", data);
  console.log("ERRO:", error);

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return;
  }

  lista_produtos.innerHTML = "";

  if (produtos.length === 0) {
    lista_produtos.innerHTML = `
        <tr>
            <td colspan="7">Nenhum produto encontrado.</td>
        </tr>
    `;
    return;
  }

  produtos.forEach(function (produto) {
    const linha = document.createElement("tr");

    const qtdAtual = Number(produto.quantidade);
    const qtdMinima = Number(produto.quantidade_minima);

    if (qtdAtual <= qtdMinima) {
      linha.classList.add("estoque-critico");
    }

    linha.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>
                <button class="btn-diminuir" onclick="diminuirQuantidade(${produto.id})">-</button>
                ${produto.quantidade}
                <button class="btn-aumentar" onclick="aumentarQuantidade(${produto.id})">+</button>   
            </td>
            <td>${produto.quantidade_minima}</td>
            <td>R$ ${produto.preco}</td>
            <td>${produto.fornecedor}</td>
            <td>
                <button class="btn-excluir" onclick="excluirProduto(${produto.id})">Excluir</button>
                <button class="btn-editar" onclick="editarProduto(${produto.id})">Editar</button>
            </td>
        `;

    lista_produtos.appendChild(linha);
  });
}

carregarProdutos();

async function excluirProduto(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este produto ?");

  if (!confirmar) {
    return;
  }

  const { error } = await supabaseClient.from("produtos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir produto", error);
    alert("Erro ao excluir produto.");
    return;
  }

  alert("Produto excluido com sucesso!");
  location.reload();
}

async function aumentarQuantidade(id) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("quantidade")
    .eq("id", id)
    .single();

  console.log("Produto:", data);
  console.log("Erro:", error);

  const novaQuantidade = data.quantidade + 1;

  console.log("Nova quantidade:", novaQuantidade);

  const { error: erroUpdate } = await supabaseClient
    .from("produtos")
    .update({ quantidade: novaQuantidade })
    .eq("id", id);

  console.log("Erro ao atualizar:", erroUpdate);

  carregarProdutos();
}

async function diminuirQuantidade(id) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("quantidade")
    .eq("id", id)
    .single();

  console.log("Produto:", data);
  console.log("Erro:", error);

  const novaQuantidade = data.quantidade - 1;

  console.log("Nova quantidade:", novaQuantidade);

  const { error: erroUpdate } = await supabaseClient
    .from("produtos")
    .update({ quantidade: novaQuantidade })
    .eq("id", id);

  console.log("Erro ao atualizar:", erroUpdate);

  carregarProdutos();
}

let produtoEmEdicao = null;
async function editarProduto(id) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .eq("id", id);

  if (error) {
    console.log("ERRO AO BUSCAR PRODUTO:", error);
    return;
  }

  const produto = data[0];
  produtoEmEdicao = id;

  console.log("Nome:", produto.nome);
  console.log("Quantidade:", produto.quantidade);
  console.log("Quantidade mínima:", produto.quantidade_minima);
  console.log("Preço:", produto.preco);
  console.log("Fornecedor:", produto.fornecedor);

  console.log("nome:", document.getElementById("editar_nome"));
  console.log("quantidade:", document.getElementById("editar_quantidade"));
  console.log(
    "quantidade mínima:",
    document.getElementById("editar_quantidade_minima"),
  );
  console.log("preço:", document.getElementById("editar_preco"));
  console.log("fornecedor:", document.getElementById("editar_fornecedor"));

  document.getElementById("editar_nome").value = produto.nome;
  document.getElementById("editar_quantidade").value = produto.quantidade;
  document.getElementById("editar_quantidade_minima").value =
    produto.quantidade_minima;
  document.getElementById("editar_preco").value = produto.preco;
  document.getElementById("editar_fornecedor").value = produto.fornecedor;

  document.getElementById("form_edicao").style.display = "block";
}

document
  .getElementById("btn_cancelar_edicao")
  .addEventListener("click", function () {
    document.getElementById("form_edicao").style.display = "none";
  });

document
  .getElementById("btn_salvar_edicao")
  .addEventListener("click", async function () {
    const nome = document.getElementById("editar_nome").value;
    const quantidade = document.getElementById("editar_quantidade").value;
    const quantidadeMinima = document.getElementById(
      "editar_quantidade_minima",
    ).value;
    const preco = document.getElementById("editar_preco").value;
    const fornecedor = document.getElementById("editar_fornecedor").value;

    const { data, error } = await supabaseClient
      .from("produtos")
      .update({
        nome: nome,
        quantidade: quantidade,
        quantidade_minima: quantidadeMinima,
        preco: preco,
        fornecedor: fornecedor,
      })
      .eq("id", produtoEmEdicao);

    if (error) {
      alert("Erro ao atualizar produto!");
      return;
    }

    document.getElementById("form_edicao").style.display = "none";

    await carregarProdutos();
  });
