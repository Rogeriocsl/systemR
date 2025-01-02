const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref } = require('firebase/database');

document.getElementById('menu-back').addEventListener('click', () => {
    ipcRenderer.send('menu-principal');
});

document.addEventListener('DOMContentLoaded', () => {
    const listaVendas = document.querySelector('.sales-list');
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.textContent = 'Carregando...';

    // Função para carregar as vendas do Firebase
    async function carregarVendas() {
        listaVendas.innerHTML = ''; // Limpar a lista antes de adicionar as vendas
        listaVendas.appendChild(loader); // Exibe o indicador de carregamento

        try {
            const vendasRef = ref(database, 'vendas');
            const snapshot = await get(vendasRef);

            if (snapshot.exists()) {
                const vendas = snapshot.val();
                listaVendas.innerHTML = ''; // Limpar novamente após carregamento

                // Loop pelas vendas para exibir a data e o primeiro produto
                Object.keys(vendas).forEach((id) => {
                    const venda = vendas[id];
                    const dataVenda = new Date(venda.dataHora);
                    const formattedDate = dataVenda.toLocaleString('pt-BR', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    });

                    // Calcular o total da venda
                    const totalVenda = venda.produtos.reduce((total, produto) => total + produto.preco * produto.quantidade, 0);

                    // Pega apenas o primeiro produto
                    const primeiroProduto = venda.produtos[0];

                    // Cria uma linha para a venda
                    const itemVenda = document.createElement('tr');
                    itemVenda.classList.add('sale-item');
                    itemVenda.dataset.saleId = id;

                    itemVenda.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>
                            <strong>${primeiroProduto.nome}</strong>
                            <p>Preço: R$ ${primeiroProduto.preco.toFixed(2)}</p>
                            <p>Quantidade: ${primeiroProduto.quantidade}</p>
                            <p>Total: R$ ${(primeiroProduto.preco * primeiroProduto.quantidade).toFixed(2)}</p>
                        </td>
                        <td>R$ ${totalVenda.toFixed(2)}</td>
                        <td><button class="toggle-details">Mostrar Detalhes</button></td>
                    `;

                    // Cria os detalhes da venda
                    const detalhesVenda = document.createElement('tr');
                    detalhesVenda.classList.add('sale-details');
                    detalhesVenda.dataset.saleId = id;
                    detalhesVenda.style.display = 'none';

                    detalhesVenda.innerHTML = `
                        <td colspan="4">
                            <div class="product-details">
                                ${venda.produtos.map((produto) => `
                                    <div class="product-info">
                                        <hr />
                                        <strong>${produto.nome}</strong>
                                        <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
                                        <p>Quantidade: ${produto.quantidade}</p>
                                        <p>Total: R$ ${(produto.preco * produto.quantidade).toFixed(2)}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </td>
                    `;

                    // Adiciona os itens à lista
                    listaVendas.appendChild(itemVenda);
                    listaVendas.appendChild(detalhesVenda);
                });
            } else {
                listaVendas.innerHTML = '<tr><td colspan="4">Não há vendas registradas.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar as vendas:', error);
            showFeedback('Erro ao carregar as vendas. Verifique sua conexão ou tente novamente.', 'error');
        } finally {
            loader.remove(); // Remove o indicador de carregamento
        }
    }

    // Função de feedback
    function showFeedback(message, type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', type);
        feedbackElement.textContent = message;
        document.body.appendChild(feedbackElement);

        setTimeout(() => feedbackElement.remove(), 3000); // Remove após 3 segundos
    }

    function abrirModalDetalhes(venda) {
        const modal = document.getElementById('sale-details-modal');
        const modalContent = document.getElementById('sale-details-content');

        // Monta a tabela com os produtos da venda
        const detalhesHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Preço Unitário</th>
                        <th>Quantidade</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venda.produtos.map(produto => `
                        <tr>
                            <td>${produto.nome}</td>
                            <td>R$ ${produto.preco.toFixed(2)}</td>
                            <td>${produto.quantidade}</td>
                            <td>R$ ${(produto.preco * produto.quantidade).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold;">Total Geral:</td>
                        <td style="font-weight: bold;">R$ ${venda.produtos.reduce((total, produto) => total + (produto.preco * produto.quantidade), 0).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        // Insere o conteúdo no modal
        modalContent.innerHTML = detalhesHtml;

        // Exibe o modal
        modal.style.display = 'block';
    }



    function fecharModal() {
        const modal = document.getElementById('sale-details-modal');
        modal.style.display = 'none';
    }

    // Configura o evento de fechamento
    document.querySelector('.close-button').addEventListener('click', fecharModal);

    // Fecha o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('sale-details-modal');
        if (event.target === modal) {
            fecharModal();
        }
    });


    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('toggle-details')) {
            const saleRow = event.target.closest('tr');
            const saleId = saleRow.dataset.saleId;

            // Recupera os dados da venda
            const vendasRef = ref(database, `vendas/${saleId}`);
            get(vendasRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const venda = snapshot.val();
                    abrirModalDetalhes(venda); // Abre o modal com os detalhes
                } else {
                    console.error('Venda não encontrada.');
                }
            }).catch((error) => {
                console.error('Erro ao carregar os detalhes da venda:', error);
            });
        }
    });



    // Carregar as vendas ao carregar a página
    carregarVendas();
});
