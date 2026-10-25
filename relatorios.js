// Relatórios do Controle de Estoque
// Mantém a mesma conexão Supabase usada no restante do projeto.
const supabaseUrl = 'https://vxrmaqdezjfizlbjmpuj.supabase.co';
const supabaseKey = 'sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const el = (id) => document.getElementById(id);

let produtosCarregados = [];
let movimentosCarregados = [];

function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function encontrarCampo(obj, nomes) {
    for (const nome of nomes) {
        if (obj && obj[nome] !== undefined && obj[nome] !== null) {
            return obj[nome];
        }
    }
    return null;
}

function dataFormatada(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return String(valor);
    return data.toLocaleString('pt-BR');
}

function mostrarMensagem(texto, erro = false) {
    const mensagem = el('mensagem');
    mensagem.textContent = texto;
    mensagem.classList.toggle('erro', erro);
}

function produtoEstaBaixo(produto) {
    return Number(produto.quantidade || 0) <= Number(produto.quantidade_minima || 0);
}

async function carregarProdutosRelatorio() {
    const { data, error } = await supabaseClient
        .from('produtos')
        .select('id, nome, quantidade, quantidade_minima, preco, fornecedor')
        .order('id', { ascending: true });

    if (error) throw error;

    produtosCarregados = data || [];
    renderizarResumo();
    renderizarProdutos();
    renderizarEstoqueBaixo();
}

function renderizarResumo() {
    const totalProdutos = produtosCarregados.length;
    const totalUnidades = produtosCarregados.reduce((soma, p) => soma + Number(p.quantidade || 0), 0);
    const totalBaixo = produtosCarregados.filter(produtoEstaBaixo).length;
    const valorEstoque = produtosCarregados.reduce(
        (soma, p) => soma + Number(p.quantidade || 0) * Number(p.preco || 0),
        0
    );

    el('total-produtos').textContent = totalProdutos;
    el('total-unidades').textContent = totalUnidades.toLocaleString('pt-BR');
    el('total-baixo').textContent = totalBaixo;
    el('valor-estoque').textContent = moeda(valorEstoque);
}

function renderizarProdutos() {
    const tbody = el('tabela-produtos');
    const pesquisa = el('pesquisa-relatorio').value.trim().toLocaleLowerCase('pt-BR');

    const filtrados = produtosCarregados.filter((p) =>
        String(p.nome || '').toLocaleLowerCase('pt-BR').includes(pesquisa) ||
        String(p.fornecedor || '').toLocaleLowerCase('pt-BR').includes(pesquisa)
    );

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td class="vazio" colspan="7">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = filtrados.map((p) => {
        const qtd = Number(p.quantidade || 0);
        const minimo = Number(p.quantidade_minima || 0);
        const baixo = produtoEstaBaixo(p);
        return `
            <tr>
                <td>${escaparHTML(p.nome)}</td>
                <td>${qtd}</td>
                <td>${minimo}</td>
                <td>${moeda(p.preco)}</td>
                <td>${moeda(qtd * Number(p.preco || 0))}</td>
                <td>${escaparHTML(p.fornecedor || '—')}</td>
                <td><span class="status ${baixo ? 'baixo' : 'ok'}">${baixo ? 'Estoque baixo' : 'Normal'}</span></td>
            </tr>`;
    }).join('');
}

function renderizarEstoqueBaixo() {
    const tbody = el('tabela-baixo');
    const baixos = produtosCarregados.filter(produtoEstaBaixo);

    if (baixos.length === 0) {
        tbody.innerHTML = '<tr><td class="vazio" colspan="4">Nenhum produto está na quantidade mínima ou abaixo dela.</td></tr>';
        return;
    }

    tbody.innerHTML = baixos.map((p) => `
        <tr>
            <td>${escaparHTML(p.nome)}</td>
            <td><span class="status baixo">${Number(p.quantidade || 0)}</span></td>
            <td>${Number(p.quantidade_minima || 0)}</td>
            <td>${escaparHTML(p.fornecedor || '—')}</td>
        </tr>`).join('');
}

async function carregarTabelaMovimentos(nomeTabela, tipo, mapaProdutos) {
    const { data, error } = await supabaseClient
        .from(nomeTabela)
        .select('*');

    if (error) throw new Error(`${nomeTabela}: ${error.message}`);

    return (data || []).map((item) => {
        const idProduto = encontrarCampo(item, [
            'produto_id', 'id_produto', 'produto', 'idProduto', 'produtoId'
        ]);

        const produtoRelacionado = (idProduto !== null)
            ? mapaProdutos.get(String(idProduto))
            : null;

        const nomeDireto = encontrarCampo(item, [
            'nome_produto', 'produto_nome', 'nome', 'produto'
        ]);

        const quantidade = encontrarCampo(item, [
            'quantidade', 'quantidade_entrada', 'quantidade_saida', 'qtd'
        ]);

        const dataMovimento = encontrarCampo(item, [
            'created_at', 'data', 'data_movimento', 'data_entrada',
            'data_saida', 'createdAt', 'registrado_em'
        ]);

        const observacao = encontrarCampo(item, [
            'observacao', 'observacoes', 'descricao', 'motivo'
        ]);

        let nomeProduto = produtoRelacionado?.nome;
        if (!nomeProduto && typeof nomeDireto === 'string') nomeProduto = nomeDireto;
        if (!nomeProduto && idProduto !== null) nomeProduto = `Produto ID ${idProduto}`;

        return {
            tipo,
            produto: nomeProduto || 'Produto não identificado',
            quantidade: quantidade ?? '—',
            data: dataMovimento,
            observacao: observacao || '—'
        };
    });
}

async function carregarMovimentacoes() {
    const tbody = el('tabela-movimentos');
    const aviso = el('aviso-movimentos');
    const mapaProdutos = new Map(produtosCarregados.map((p) => [String(p.id), p]));
    const avisos = [];

    movimentosCarregados = [];

    for (const [tabela, tipo] of [['entradas', 'entrada'], ['saidas', 'saida']]) {
        try {
            const movimentos = await carregarTabelaMovimentos(tabela, tipo, mapaProdutos);
            movimentosCarregados.push(...movimentos);
        } catch (erro) {
            console.warn(`Não foi possível consultar a tabela ${tabela}:`, erro.message);
            avisos.push(`Não foi possível carregar ${tabela}: ${erro.message}`);
        }
    }

    movimentosCarregados.sort((a, b) => {
        const dataA = a.data ? new Date(a.data).getTime() : 0;
        const dataB = b.data ? new Date(b.data).getTime() : 0;
        return dataB - dataA;
    });

    renderizarMovimentos();
    aviso.textContent = avisos.length
        ? `${avisos.join(' | ')}. Confira o nome da tabela, as colunas e as permissões SELECT no Supabase.`
        : 'Exibindo o histórico salvo nas tabelas entradas e saidas.';
}

function renderizarMovimentos() {
    const tbody = el('tabela-movimentos');
    const filtro = el('filtro-movimento').value;
    const lista = movimentosCarregados.filter((m) => filtro === 'todas' || m.tipo === filtro);

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td class="vazio" colspan="5">Nenhuma movimentação encontrada para este filtro.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map((m) => `
        <tr>
            <td><span class="status ${m.tipo === 'entrada' ? 'ok' : 'baixo'}">${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
            <td>${escaparHTML(m.produto)}</td>
            <td>${escaparHTML(m.quantidade)}</td>
            <td>${escaparHTML(dataFormatada(m.data))}</td>
            <td>${escaparHTML(m.observacao)}</td>
        </tr>`).join('');
}

async function carregarRelatorios() {
    mostrarMensagem('Atualizando relatórios...');
    el('btn-atualizar').disabled = true;

    try {
        await carregarProdutosRelatorio();
        await carregarMovimentacoes();
        mostrarMensagem('Relatórios atualizados com sucesso.');
    } catch (erro) {
        console.error('Erro ao carregar relatórios:', erro);
        mostrarMensagem(`Não foi possível carregar os produtos: ${erro.message}`, true);
        el('tabela-produtos').innerHTML = '<tr><td class="vazio" colspan="7">Erro ao carregar os produtos. Confira a conexão e as permissões no Supabase.</td></tr>';
    } finally {
        el('btn-atualizar').disabled = false;
    }
}

el('pesquisa-relatorio').addEventListener('input', renderizarProdutos);
el('filtro-movimento').addEventListener('change', renderizarMovimentos);
el('btn-atualizar').addEventListener('click', carregarRelatorios);

carregarRelatorios();
