const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref } = require('firebase/database');
const { parse } = require('date-fns');
const applyFiltersButton = document.getElementById('apply-filters');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

let vendasCache = []; // Armazena todas as vendas carregadas

document.getElementById('menu-back').addEventListener('click', () => {
    ipcRenderer.send('menu-principal');
});

document.addEventListener('DOMContentLoaded', () => {
    const listaVendas = document.querySelector('.sales-list');
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.textContent = 'Carregando...';

    let vendasCache = []; // Cache para armazenar vendas

    // Função para carregar as vendas com ou sem filtros
    async function carregarVendas() {
        listaVendas.innerHTML = ''; // Limpa a lista
        listaVendas.appendChild(loader); // Exibe o indicador de carregamento

        try {
            const vendasRef = ref(database, 'vendas');
            const snapshot = await get(vendasRef);

            if (snapshot.exists()) {
                vendasCache = snapshot.val(); // Armazena no cache
                console.log('Vendas carregadas:', vendasCache); // Verifique os dados carregados
                listaVendas.innerHTML = ''; // Limpa novamente após carregamento

                Object.keys(vendasCache).forEach((id) => {
                    const venda = vendasCache[id];
                    const dataVenda = new Date(venda.dataHora);

                    if (isNaN(dataVenda.getTime())) {
                        console.error('Data inválida para venda ID:', id);
                    } else {
                        const formattedDate = dataVenda.toLocaleString('pt-BR', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric'
                        });

                        const totalVenda = venda.produtos.reduce((total, produto) => total + produto.preco * produto.quantidade, 0);

                        const itemVenda = document.createElement('tr');
                        itemVenda.classList.add('sale-item');
                        itemVenda.dataset.saleId = id;

                        itemVenda.innerHTML = `
                            <td>${formattedDate}</td>
                            <td>R$ ${totalVenda.toFixed(2)}</td>
                            <td>
                                <button class="toggle-details">
                                    <i class="fa fa-eye"></i> Visualizar Detalhes
                                </button>
                            </td>
                        `;

                        listaVendas.appendChild(itemVenda);
                    }
                });
            } else {
                listaVendas.innerHTML = '<tr><td colspan="3">Não há vendas registradas.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar as vendas:', error);
            showFeedback('Erro ao carregar as vendas. Verifique sua conexão.', 'error');
        } finally {
            loader.remove(); // Remove o indicador de carregamento
        }
    }


    // Aplica os filtros de data
    document.getElementById('apply-filters').addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        carregarVendas(startDate, endDate); // Carregar vendas com filtros aplicados
    });

    // Exibe feedback
    function showFeedback(message, type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', type);
        feedbackElement.textContent = message;
        document.body.appendChild(feedbackElement);

        setTimeout(() => feedbackElement.remove(), 3000); // Remove após 3 segundos
    }

    // Função para abrir o modal de detalhes
    function abrirModalDetalhes(venda) {
        const modal = document.getElementById('sale-details-modal');
        const modalContent = document.getElementById('sale-details-content');
    
        const detalhesHtml = `
            <table class="modal-table">
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
                            <td>${produto.quantidade} KG</td>
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
    
        modalContent.innerHTML = detalhesHtml;
        modal.style.display = 'block';
    }
    

    function fecharModal() {
        const modal = document.getElementById('sale-details-modal');
        modal.style.display = 'none';
    }

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('toggle-details')) {
            const saleRow = event.target.closest('tr');
            const saleId = saleRow.dataset.saleId;

            console.log('Sale ID:', saleId); // Verifique o ID da venda
            console.log('Vendas Cache:', vendasCache); // Verifique o cache de vendas

            const venda = vendasCache[saleId]; // Recupera do cache

            if (venda) {
                abrirModalDetalhes(venda); // Abre o modal com os detalhes
            } else {
                console.error('Venda não encontrada ou não carregada.');
                showFeedback('Erro ao carregar os detalhes da venda.', 'error');
            }
        }
    });




    document.querySelector('.close-button').addEventListener('click', fecharModal);

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('sale-details-modal');
        if (event.target === modal) fecharModal();
    });

    // Carregar as vendas ao iniciar
    carregarVendas();
});


