const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref } = require('firebase/database');
const { parse, format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const applyFiltersButton = document.getElementById('apply-filters');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

let comprasCache = []; // Armazena todas as compras carregadas

document.getElementById('menu-back').addEventListener('click', () => {
    ipcRenderer.send('menu-principal');
});

document.addEventListener('DOMContentLoaded', () => {
    const listaCompras = document.querySelector('.purchases-list');
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.textContent = 'Carregando...';

    async function carregarCompras(startDate, endDate) {
        listaCompras.innerHTML = ''; // Limpa a lista
        listaCompras.appendChild(loader); // Exibe o indicador de carregamento

        try {
            const comprasRef = ref(database, 'compras');
            const snapshot = await get(comprasRef);

            if (snapshot.exists()) {
                comprasCache = snapshot.val(); // Armazena no cache
                listaCompras.innerHTML = ''; // Limpa novamente após carregamento

                Object.keys(comprasCache).forEach((id) => {
                    const compra = comprasCache[id];

                    // Converte a data de 'dd/MM/yyyy, HH:mm:ss' para o formato ISO
                    const dataHora = compra.dataHora;
                    const [dia, mes, ano, hora, minuto, segundo] = dataHora.split(/[\s,/:]+/);  // Quebra a string em partes
                    const formattedDataHora = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;

                    // Converte para Date
                    const dataCompra = parse(formattedDataHora, 'yyyy-MM-dd\'T\'HH:mm:ss', new Date());

                    if (isNaN(dataCompra.getTime())) {
                        console.error('Data inválida para compra ID:', id);
                        return; // Pula esta iteração se a data for inválida
                    }

                    const formattedDate = format(dataCompra, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

                    const totalCompra = compra.produtos.reduce((total, item) => total + item.preco * item.quantidade, 0);
                    console.log("total Compra",totalCompra)
                    const itemCompra = document.createElement('tr');
                    itemCompra.classList.add('purchase-item');
                    itemCompra.dataset.purchaseId = id;

                    itemCompra.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>R$ ${totalCompra.toFixed(2)}</td>
                        <td>
                            <button class="toggle-details">
                                <i class="fa fa-eye"></i> Visualizar Detalhes
                            </button>
                        </td>
                    `;

                    listaCompras.appendChild(itemCompra);
                });
            } else {
                listaCompras.innerHTML = '<tr><td colspan="3">Não há compras registradas.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar as compras:', error);
            showFeedback('Erro ao carregar as compras. Verifique sua conexão.', 'error');
        } finally {
            loader.remove(); // Remove o indicador de carregamento
        }
    }

    document.getElementById('apply-filters').addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        carregarCompras(startDate, endDate); // Carregar compras com filtros aplicados
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
    // Função para abrir o modal de detalhes
    function abrirModalDetalhes(compra) {
        const modal = document.getElementById('purchase-details-modal');
        const modalContent = document.getElementById('purchase-details-content');

        // Verifica se a chave 'produtos' existe e é um array
        if (!compra || !Array.isArray(compra.produtos)) {
            console.error('A compra não possui produtos válidos.');
            showFeedback('Erro ao carregar os detalhes da compra. Produtos não encontrados.', 'error');
            return;
        }

        // Gera o HTML dos detalhes da compra
        const detalhesHtml = `
                                <table class="buy-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Preço Unitário</th>
                                    <th>Quantidade</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${compra.produtos.map(item => `
                                    <tr>
                                        <td>${item.nome}</td>
                                        <td>R$ ${item.preco.toFixed(2)}</td>
                                        <td>${item.quantidade}</td>
                                        <td>R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="text-align: right; font-weight: bold;">Total Geral:</td>
                                    <td style="font-weight: bold;">R$ ${compra.produtos.reduce((total, item) => total + (item.preco * item.quantidade), 0).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

    `;

        modalContent.innerHTML = detalhesHtml;
        modal.style.display = 'block';
    }


    function fecharModal() {
        const modal = document.getElementById('purchase-details-modal');
        modal.style.display = 'none';
    }

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('toggle-details')) {
            const purchaseRow = event.target.closest('tr');
            const purchaseId = purchaseRow.dataset.purchaseId;

            const compra = comprasCache[purchaseId]; // Recupera do cache

            if (compra) {
                abrirModalDetalhes(compra); // Abre o modal com os detalhes
            } else {
                console.error('Compra não encontrada ou não carregada.');
                showFeedback('Erro ao carregar os detalhes da compra.', 'error');
            }
        }
    });

    document.querySelector('.close-button').addEventListener('click', fecharModal);

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('purchase-details-modal');
        if (event.target === modal) fecharModal();
    });

    // Carregar as compras ao iniciar
    carregarCompras();
});
