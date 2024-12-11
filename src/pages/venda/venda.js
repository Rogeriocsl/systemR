const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref } = require('firebase/database');


document.getElementById('menu-back').addEventListener('click', () => {
    console.log('Botão "Voltar" clicado'); // Log para depurar
    ipcRenderer.send('menu-principal');
});


document.addEventListener('DOMContentLoaded', () => {
    // Função para pesquisar produtos no Firebase
    function pesquisarProdutos() {
        const searchValue = document.getElementById('search-input').value.toLowerCase(); // Captura o texto digitado
        const produtosRef = ref(database, 'produtos'); // Referência ao nó no Firebase

        get(produtosRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const produtos = snapshot.val();
                    const listaProdutos = document.querySelector('.product-list tbody');
                    listaProdutos.innerHTML = ''; // Limpa os resultados anteriores

                    let encontrou = false;

                    // Filtra o produto com base no texto de pesquisa
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
    
            // Valida se o peso foi inserido corretamente
            if (isNaN(peso) || peso <= 0) {
                alert('Por favor, insira um peso válido antes de adicionar ao carrinho.');
                return;
            }
    
            const carrinho = document.querySelector('.cart-coupons');
    
            // Verifica se o produto já está no carrinho
            let itemExistente = carrinho.querySelector(`.coupon[data-id="${produtoId}"]`);
            if (itemExistente) {
                // Incrementa o peso e atualiza o preço total
                const pesoElement = itemExistente.querySelector('.coupon-weight');
                const precoElement = itemExistente.querySelector('.coupon-total');
                let pesoAtual = parseFloat(pesoElement.textContent);
                pesoAtual += peso;
                pesoElement.textContent = pesoAtual.toFixed(2);
                precoElement.textContent = `R$ ${(pesoAtual * preco).toFixed(2)}`;
            } else {
                // Adiciona um novo item ao carrinho com estilo de cupom
                const cupom = document.createElement('div');
                cupom.classList.add('coupon');
                cupom.dataset.id = produtoId;
                cupom.innerHTML = `
                    <div class="coupon-header">
                        <span><strong>Código:</strong> ${codigo}</span>
                        <span><strong>Nome:</strong> ${nome}</span>
                    </div>
                    <div class="coupon-details">
                        <span><strong>Peso:</strong> <span class="coupon-weight">${peso.toFixed(2)}</span> kg</span>
                        <span><strong>Preço Total:</strong> <span class="coupon-total">R$ ${(peso * preco).toFixed(2)}</span></span>
                    </div>
                    <button class="remove-from-cart-btn">Remover</button>
                `;
                carrinho.appendChild(cupom);
            }
        }
    }
    


    function removerDoCarrinho(event) {
        if (event.target.classList.contains('remove-from-cart-btn')) {
            const row = event.target.closest('tr');
            row.remove();
        }
    }


    // Adiciona o evento de input ao campo de pesquisa
    document.getElementById('search-input').addEventListener('input', (event) => {
        console.log('Valor digitado:', event.target.value); // Log para verificar o valor digitado
        pesquisarProdutos(); // Chama a função de pesquisa
    });

    // Evento para adicionar ao carrinho
    document.addEventListener('click', adicionarAoCarrinho);

    // Evento para remover do carrinho
    document.addEventListener('click', removerDoCarrinho);
});
