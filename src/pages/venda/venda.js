document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    const { database } = require('../../firebaseConfig');
    const { get, ref } = require('firebase/database');

    const cartCoupons = document.querySelector('.cart-coupons');
    let totalCarrinho = 0; // Variável para armazenar o total do carrinho

    document.getElementById('menu-back').addEventListener('click', () => {
        ipcRenderer.send('menu-principal');
    });

    // Função para pesquisar produtos no Firebase
    function pesquisarProdutos() {
        const searchValue = document.getElementById('search-input').value.toLowerCase();
        const produtosRef = ref(database, 'produtos');

        get(produtosRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const produtos = snapshot.val();
                    const listaProdutos = document.querySelector('.product-list tbody');
                    listaProdutos.innerHTML = ''; // Limpa os resultados anteriores

                    let encontrou = false;

                    Object.keys(produtos).forEach((id) => {
                        const produto = produtos[id];
                        const codigo = produto.codigo.toLowerCase();
                        const nome = produto.nome.toLowerCase();

                        if (codigo === searchValue || nome === searchValue) {
                            encontrou = true;

                            // Cria a linha do produto encontrado
                            const itemProduto = document.createElement('tr');
                            itemProduto.innerHTML = `
                                <td>${produto.codigo}</td>
                                <td>${produto.nome}</td>
                                <td>${produto.descricao}</td>
                                <td>R$ ${produto.precoVenda}</td>
                                <td>${produto.peso} kg</td>
                                <td class="action-cell">
                                    <div class="input-button-wrapper">
                                        <input type="number" class="product-weight" placeholder="KG" min="0" max="${produto.quantidade}" />
                                        <button class="add-to-cart-btn" data-id="${id}" data-codigo="${produto.codigo}" data-nome="${produto.nome}" data-preco="${produto.precoVenda}" data-quantidade="${produto.quantidade}">
                                            <i class="fa fa-shopping-cart"></i><i class="fa fa-plus"></i>
                                        </button>
                                    </div>
                                </td>
                            `;
                            listaProdutos.appendChild(itemProduto);
                        }
                    });

                    if (!encontrou) {
                        listaProdutos.innerHTML = '<tr><td colspan="6">Produto não encontrado.</td></tr>';
                    }
                } else {
                    console.error('Não há produtos cadastrados no Firebase.');
                }
            })
            .catch((error) => {
                console.error('Erro ao buscar produtos no Firebase:', error);
            });
    }

    // Função para adicionar ao carrinho
    function adicionarAoCarrinho(event) {
        const button = event.target.closest('.add-to-cart-btn');
        if (button) {
            const produtoId = button.dataset.id;
            const codigo = button.dataset.codigo;
            const nome = button.dataset.nome;
            const preco = parseFloat(button.dataset.preco);
            const quantidadeDisponivel = parseInt(button.dataset.quantidade);

            // Captura o peso especificado
            const pesoInput = button.closest('.input-button-wrapper').querySelector('.product-weight');
            const peso = parseFloat(pesoInput.value);

            // Valida o peso
            if (isNaN(peso) || peso <= 0) {
                alert('Por favor, insira um peso válido.');
                return;
            }

            // Verifica se a quantidade é maior que a disponível
            if (peso > quantidadeDisponivel) {
                alert(`A quantidade disponível é de ${quantidadeDisponivel} kg.`);
                return;
            }

            // Adiciona o produto ao carrinho
            const cupom = document.createElement('div');
            cupom.classList.add('coupon');
            cupom.innerHTML = `
                <div class="coupon-header">
                    <span><strong>Código:</strong> ${codigo}</span>
                    <span><strong>Nome:</strong> ${nome}</span>
                </div>
                <div class="coupon-details">
                    <span><strong>Peso:</strong> ${peso.toFixed(2)} kg</span>
                    <span><strong>Preço Total:</strong> R$ ${(peso * preco).toFixed(2)}</span>
                </div>
                <button class="remove-from-cart-btn">Remover</button>
            `;
            cartCoupons.appendChild(cupom);

            // Atualiza o total do carrinho
            totalCarrinho += (peso * preco);
            atualizarTotalCarrinho();

            // Rolagem automática para o final
            cartCoupons.scrollTop = cartCoupons.scrollHeight;

            // Adiciona evento para remover o cupom
            cupom.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                cartCoupons.removeChild(cupom);
                totalCarrinho -= (peso * preco);
                atualizarTotalCarrinho();
            });
        }
    }

    // Função para atualizar o total do carrinho
    function atualizarTotalCarrinho() {
        const totalElement = document.querySelector('.totals-section span:nth-child(2)');
        totalElement.textContent = `Total: R$ ${totalCarrinho.toFixed(2)}`;
    }

    // Evento de input para pesquisa
    document.getElementById('search-input').addEventListener('input', pesquisarProdutos);

    // Evento para adicionar ao carrinho
    document.addEventListener('click', adicionarAoCarrinho);
});
