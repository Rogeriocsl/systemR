document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    const { database } = require('../../firebaseConfig');
    const { get, ref, push, update } = require('firebase/database');  // Incluindo update para atualizar as quantidades

    const cartCoupons = document.querySelector('.cart-coupons');
    let totalCarrinho = 0; // Variável para armazenar o total do carrinho
    let produtosNoCarrinho = {}; // Armazenar os produtos no carrinho com o peso total

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
                                        <button class="add-to-cart-btn" data-id="${id}" data-codigo="${produto.codigo}" data-nome="${produto.nome}" data-preco="${produto.precoVenda}" data-quantidade="${produto.quantidade}" data-peso="${produto.peso}">
                                            <i class="fa fa-cart-plus"></i>
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
            const pesoMaximo = parseFloat(button.dataset.peso); // Adiciona o peso máximo

            // Captura o peso especificado
            const pesoInput = button.closest('.input-button-wrapper').querySelector('.product-weight');
            const peso = parseFloat(pesoInput.value);

            // Valida o peso
            if (isNaN(peso) || peso <= 0) {
                alert('Por favor, insira um peso válido.');
                return;
            }

            // Verifica se o produto já está no carrinho e quanto foi adicionado
            const pesoAtualNoCarrinho = produtosNoCarrinho[produtoId] || 0;
            const pesoTotal = pesoAtualNoCarrinho + peso;

            // Verifica se a quantidade/peso total não ultrapassa o disponível
            if (pesoTotal > pesoMaximo) {
                Swal.fire({
                    icon: 'warning',
                    title: '🚨 Limite de Quantidade Atingido 🚨',
                    html: `O limite de peso disponível para este produto é de <strong>${pesoMaximo} kg</strong>.`,
                    confirmButtonText: 'Ok, entendi',
                    confirmButtonColor: '#3085d6',
                    background: '#f9f9f9',
                    iconColor: '#f1c40f',
                });
                return;
            }

            // Se o produto já estiver no carrinho, apenas atualiza a quantidade de peso
            if (produtosNoCarrinho[produtoId]) {
                produtosNoCarrinho[produtoId] += peso;
                // Atualiza o preço no carrinho
                const cupomExistente = cartCoupons.querySelector(`[data-id="${produtoId}"]`);
                const pesoAtualizado = produtosNoCarrinho[produtoId];
                cupomExistente.querySelector('.coupon-weight').textContent = `Peso: ${pesoAtualizado.toFixed(2)} kg`;
                cupomExistente.querySelector('.coupon-price').textContent = `Preço Total: R$ ${(pesoAtualizado * preco).toFixed(2)}`;
            } else {
                // Se não, cria um novo cupom para o produto
                produtosNoCarrinho[produtoId] = peso;

                const cupom = document.createElement('div');
                cupom.classList.add('coupon');
                cupom.setAttribute('data-id', produtoId);
                cupom.innerHTML = `
                    <div class="coupon-header">
                        <span><strong>Código:</strong> ${codigo}</span>
                        <span><strong>Nome:</strong> ${nome}</span>
                    </div>
                    <div class="coupon-details">
                        <span class="coupon-weight"><strong>Peso:</strong> ${peso.toFixed(2)} kg</span>
                        <span class="coupon-price"><strong>Preço Total:</strong> R$ ${(peso * preco).toFixed(2)}</span>
                    </div>
                    <button class="remove-from-cart-btn">Remover</button>
                `;
                cartCoupons.appendChild(cupom);

                // Atualiza o total do carrinho
                totalCarrinho += (peso * preco);
                atualizarTotalCarrinho();

                // Rolagem automática para o final
                cartCoupons.scrollTop = cartCoupons.scrollHeight;
            }

            // Adiciona evento para remover o cupom
            cupom.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                cartCoupons.removeChild(cupom);
                totalCarrinho -= (peso * preco);
                produtosNoCarrinho[produtoId] -= peso;
                if (produtosNoCarrinho[produtoId] <= 0) {
                    delete produtosNoCarrinho[produtoId];
                }
                atualizarTotalCarrinho();
            });
        }
    }

    // Função para atualizar o total do carrinho
    function atualizarTotalCarrinho() {
        const totalElement = document.querySelector('.totals-section span:nth-child(2)');
        totalElement.textContent = `Total: R$ ${totalCarrinho.toFixed(2)}`;
    }

    function finalizarVenda() {
        if (Object.keys(produtosNoCarrinho).length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrinho Vazio',
                text: 'Adicione produtos ao carrinho antes de finalizar a venda.',
            });
            return;
        }

        Swal.fire({
            title: 'Confirmar Venda',
            text: `Total: R$ ${totalCarrinho.toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                // Salvar venda no Firebase
                const vendasRef = ref(database, 'vendas');
                const dataHora = new Date().toLocaleString('pt-BR'); // Formato de data e hora pt-BR
                const vendaDetalhes = Object.keys(produtosNoCarrinho).map((produtoId) => {
                    const produto = produtosNoCarrinho[produtoId];
                    const produtoInfo = cartCoupons.querySelector(`[data-id="${produtoId}"]`);
                    const nomeProduto = produtoInfo.querySelector('.coupon-header').children[1].textContent.split(':')[1].trim(); // Nome do produto
                    const quantidadeProduto = produto; // A quantidade no carrinho é o peso (em kg)

                    return {
                        produtoId,
                        nome: nomeProduto,
                        quantidade: quantidadeProduto,
                    };
                });

                const novaVenda = {
                    dataHora,
                    produtos: vendaDetalhes,
                    total: totalCarrinho,
                };

                push(vendasRef, novaVenda).then(() => {
                    // Atualizar o peso dos produtos no Firebase
                    Object.keys(produtosNoCarrinho).forEach((produtoId) => {
                        const produtoRef = ref(database, `produtos/${produtoId}`);
                        get(produtoRef)
                            .then((snapshot) => {
                                if (snapshot.exists()) {
                                    const produto = snapshot.val();
                                    const pesoAtual = parseFloat(produto.peso); // Converte o peso atual para número
                                    const pesoNoCarrinho = produtosNoCarrinho[produtoId]; // Peso comprado

                                    if (isNaN(pesoAtual) || pesoAtual < pesoNoCarrinho) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Erro de Estoque',
                                            text: `O produto ${produto.nome} não possui peso suficiente em estoque.`,
                                        });
                                        return;
                                    }

                                    const novoPeso = pesoAtual - pesoNoCarrinho;

                                    update(produtoRef, { peso: novoPeso.toFixed(3) }) // Atualiza o peso no Firebase
                                        .then(() => {
                                            console.log(`Peso atualizado para o produto ${produto.nome}: ${novoPeso} kg`);
                                        })
                                        .catch((error) => {
                                            console.error('Erro ao atualizar o peso do produto:', error);
                                        });
                                }
                            })
                            .catch((error) => {
                                console.error('Erro ao buscar o produto no Firebase:', error);
                            });
                    });

                    Swal.fire({
                        icon: 'success',
                        title: 'Venda Finalizada',
                        text: 'A venda foi concluída com sucesso!',
                    });

                    // Limpar carrinho
                    cartCoupons.innerHTML = '';
                    produtosNoCarrinho = {};
                    totalCarrinho = 0;
                    atualizarTotalCarrinho();
                }).catch((error) => {
                    console.error('Erro ao salvar a venda:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: 'Ocorreu um erro ao finalizar a venda. Tente novamente mais tarde.',
                    });
                });
            }
        });
    }



    // Evento de input para pesquisa
    document.getElementById('search-input').addEventListener('input', pesquisarProdutos);

    // Evento para adicionar ao carrinho
    document.addEventListener('click', adicionarAoCarrinho);

    // Evento para finalizar a venda
    document.getElementById('finalizar-venda').addEventListener('click', finalizarVenda); // Botão para finalizar a venda
});
