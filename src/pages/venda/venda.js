document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    const { database } = require('../../firebaseConfig');
    const { get, ref } = require('firebase/database');

    const cartCoupons = document.querySelector('.cart-coupons');

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
                                <td>
                                    <input type="number" class="product-weight" min="0.1" step="0.1" placeholder="Peso (kg)" />
                                    <button class="add-to-cart-btn" data-id="${id}" data-codigo="${produto.codigo}" data-nome="${produto.nome}" data-preco="${produto.precoVenda}">
                                        Adicionar ao Carrinho
                                    </button>
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
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const produtoId = button.dataset.id;
            const codigo = button.dataset.codigo;
            const nome = button.dataset.nome;
            const preco = parseFloat(button.dataset.preco);

            // Captura o peso especificado
            const pesoInput = button.parentElement.querySelector('.product-weight');
            const peso = parseFloat(pesoInput.value);

            if (isNaN(peso) || peso <= 0) {
                alert('Por favor, insira um peso válido antes de adicionar ao carrinho.');
                return;
            }

            // Adiciona o produto como um cupom
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

            // Rolagem automática para o final
            cartCoupons.scrollTop = cartCoupons.scrollHeight;

            // Adiciona evento para remover o cupom
            cupom.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                cartCoupons.removeChild(cupom);
            });
        }
    }

    // Evento de input para pesquisa
    document.getElementById('search-input').addEventListener('input', pesquisarProdutos);

    // Evento para adicionar ao carrinho
    document.addEventListener('click', adicionarAoCarrinho);
});
