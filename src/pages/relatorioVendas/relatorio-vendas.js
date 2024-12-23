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

    // Função para carregar as vendas do Firebase
    function carregarVendas() {
        const vendasRef = ref(database, 'vendas');

        get(vendasRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    vendasCache = Object.values(snapshot.val()); // Armazena as vendas no cache
                    renderSales(vendasCache); // Renderiza as vendas
                } else {
                    renderNoSalesMessage();
                }
            })
            .catch((error) => {
                console.error('Erro ao carregar as vendas:', error);
                showFeedback('Erro ao carregar as vendas. Tente novamente.', 'error');
            });
    }

    // Função para exibir uma mensagem quando não houver vendas
    function renderNoSalesMessage() {
        const listaVendas = document.querySelector('.sales-list');
        listaVendas.innerHTML = '<tr><td colspan="4">Não há vendas registradas.</td></tr>';
    }

    // Função para renderizar as vendas
    function renderSales(vendas) {
        const listaVendas = document.querySelector('.sales-list');
        listaVendas.innerHTML = ''; // Limpar a lista antes de adicionar as vendas

        if (vendas.length === 0) {
            renderNoSalesMessage();
            return;
        }

        vendas.forEach((venda) => {
            const dataVenda = parse(venda.dataHora, "dd/MM/yyyy, HH:mm:ss", new Date());
            const formattedDate = dataVenda.toLocaleString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });

            let totalVenda = 0;
            venda.produtos.forEach((produto) => {
                totalVenda += produto.preco * produto.quantidade;
            });

            const primeiroProduto = venda.produtos[0];

            const itemVenda = document.createElement('tr');
            itemVenda.classList.add('sale-item');
            itemVenda.dataset.saleId = venda.id;

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

            const detalhesVenda = document.createElement('tr');
            detalhesVenda.classList.add('sale-details');
            detalhesVenda.dataset.saleId = venda.id;
            detalhesVenda.style.display = 'none';

            detalhesVenda.innerHTML = `
                <td colspan="4">
                    <div class="product-details">
                        ${venda.produtos.map((produto) => `
                            <div class="product-info">
                                <strong>${produto.nome}</strong>
                                <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
                                <p>Quantidade: ${produto.quantidade}</p>
                                <p>Total: R$ ${(produto.preco * produto.quantidade).toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                </td>
            `;

            listaVendas.appendChild(itemVenda);
            listaVendas.appendChild(detalhesVenda);
        });
    }

    // Função para filtrar vendas por período
    function filterSalesByPeriod() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (isNaN(startDate) || isNaN(endDate)) {
            showFeedback('Por favor, insira datas válidas para o filtro.', 'error');
            return;
        }

        const filteredSales = vendasCache.filter((venda) => {
            const dataVenda = parse(venda.dataHora, "dd/MM/yyyy, HH:mm:ss", new Date());
            return dataVenda >= startDate && dataVenda <= endDate;
        });

        renderSales(filteredSales);
    }

    // Listener do botão de aplicar filtros
    applyFiltersButton.addEventListener('click', filterSalesByPeriod);

    // Carregar as vendas ao carregar a página
    carregarVendas();

    // Função para alternar a exibição dos detalhes
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('toggle-details')) {
            const saleRow = event.target.closest('tr');
            const saleId = saleRow.dataset.saleId;

            const detalhesRow = document.querySelector(`.sale-details[data-sale-id="${saleId}"]`);

            if (detalhesRow.style.display === 'none') {
                detalhesRow.style.display = '';
                event.target.textContent = 'Ocultar Detalhes';
            } else {
                detalhesRow.style.display = 'none';
                event.target.textContent = 'Mostrar Detalhes';
            }
        }
    });
});
