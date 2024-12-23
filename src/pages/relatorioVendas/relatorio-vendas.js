const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref } = require('firebase/database');

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
                    const vendas = snapshot.val();
                    const listaVendas = document.querySelector('.sales-list');
                    listaVendas.innerHTML = '';  // Limpar a lista antes de adicionar as vendas
                    
                    // Loop pelas vendas para exibir a data e o primeiro produto
                    Object.keys(vendas).forEach((id) => {
                        const venda = vendas[id];
                        const dataVenda = new Date(venda.dataHora);
                        const formattedDate = dataVenda.toLocaleString('pt-BR', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
                        });

                        // Calcular o total da venda
                        let totalVenda = 0;
                        venda.produtos.forEach((produto) => {
                            totalVenda += produto.preco * produto.quantidade;
                        });

                        // Pega apenas o primeiro produto
                        const primeiroProduto = venda.produtos[0];

                        // Cria uma linha para a venda (exibindo apenas o primeiro produto)
                        const itemVenda = document.createElement('tr');
                        itemVenda.classList.add('sale-item');
                        itemVenda.dataset.saleId = id;

                        // Adiciona a data da venda e o primeiro produto
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

                        // Cria um elemento para os detalhes da venda
                        const detalhesVenda = document.createElement('tr');
                        detalhesVenda.classList.add('sale-details');
                        detalhesVenda.dataset.saleId = id;
                        detalhesVenda.style.display = 'none'; // Inicia oculto

                        // Adiciona os detalhes dos produtos
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

                        // Adiciona a linha de detalhes logo abaixo da linha principal
                        listaVendas.appendChild(itemVenda);
                        listaVendas.appendChild(detalhesVenda);
                    });
                } else {
                    // Caso não haja vendas
                    const listaVendas = document.querySelector('.sales-list');
                    listaVendas.innerHTML = '<tr><td colspan="4">Não há vendas registradas.</td></tr>';
                }
            })
            .catch((error) => {
                console.error('Erro ao carregar as vendas:', error);
                showFeedback('Erro ao carregar as vendas. Tente novamente.', 'error');
            });
    }

    // Função de feedback
    function showFeedback(message, type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', type);
        feedbackElement.textContent = message;
        document.body.appendChild(feedbackElement);

        // Exibir o feedback
        feedbackElement.style.display = 'block';

        // Ocultar o feedback após 3 segundos
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }

    // Carregar as vendas ao carregar a página
    carregarVendas();

    // Função para alternar a exibição dos detalhes
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('toggle-details')) {
            const saleRow = event.target.closest('tr');
            const saleId = saleRow.dataset.saleId;

            const detalhesRow = document.querySelector(`.sale-details[data-sale-id="${saleId}"]`);

            // Alterna a visibilidade dos detalhes da venda
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
