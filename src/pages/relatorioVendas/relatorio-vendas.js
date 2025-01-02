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

    async function carregarVendas() {
        listaVendas.innerHTML = ''; // Limpa a lista
        listaVendas.appendChild(loader); // Exibe o indicador de carregamento

        try {
            const vendasRef = ref(database, 'vendas');
            const snapshot = await get(vendasRef);

            if (snapshot.exists()) {
                vendasCache = snapshot.val(); // Armazena no cache
                listaVendas.innerHTML = ''; // Limpa novamente após carregamento

                Object.keys(vendasCache).forEach((id) => {
                    const venda = vendasCache[id];
                    const dataVenda = new Date(venda.dataHora);
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
            const venda = vendasCache[saleId]; // Recupera do cache
            abrirModalDetalhes(venda);
        }
    });

    document.querySelector('.close-button').addEventListener('click', fecharModal);

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('sale-details-modal');
        if (event.target === modal) fecharModal();
    });

    carregarVendas(); // Carrega vendas ao iniciar
});

