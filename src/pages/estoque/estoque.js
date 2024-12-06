const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref, push, update, remove } = require('firebase/database');

// Exemplo de uso: Botão de voltar
document.getElementById('menu-back').addEventListener('click', () => {
    ipcRenderer.send('menu-principal');
});

document.addEventListener('DOMContentLoaded', () => {
    // Função para carregar os produtos do Firebase
    function carregarProdutos() {
        const produtosRef = ref(database, 'produtos');

        get(produtosRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const produtos = snapshot.val();
                    const listaProdutos = document.querySelector('.product-list');
                    listaProdutos.innerHTML = '';

                    Object.keys(produtos).forEach((id) => {
                        const produto = produtos[id];
                        const itemProduto = document.createElement('tr');
                        itemProduto.classList.add('product-item');
                        itemProduto.dataset.productId = id;
                        itemProduto.innerHTML = `
                            <td>${produto.nome}</td>
                            <td>${produto.descricao}</td>
                            <td>${produto.precoCompra}</td>
                            <td>${produto.precoVenda}</td>
                            <td>${produto.peso} kg</td>
                            <td>
                                <button class="edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-btn">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        `;
                        listaProdutos.appendChild(itemProduto);
                    });
                } else {
                    const listaProdutos = document.querySelector('.product-list');
                    listaProdutos.innerHTML = '<tr class="no-products"><td colspan="6">Não há produtos cadastrados.</td></tr>';
                }
            })
            .catch((error) => {
                console.error('Erro ao carregar produtos:', error);
                showFeedback('Erro ao carregar os produtos. Tente novamente.', 'error');
            });
    }

    // Função para filtrar produtos baseado na pesquisa
    function filtrarProdutos() {
        const searchValue = document.getElementById('search-input').value.toLowerCase();
        const rows = document.querySelectorAll('.product-item');

        rows.forEach((row) => {
            const nomeProduto = row.querySelector('td').textContent.toLowerCase();
            if (nomeProduto.includes(searchValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Adiciona o evento de input ao campo de pesquisa
    document.getElementById('search-input').addEventListener('input', filtrarProdutos);

    // Carregar produtos ao carregar a página
    carregarProdutos();

    // Modal de edição
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close-btn');
    const editForm = document.getElementById('edit-form');

    // Evento para abrir o modal ao clicar no ícone de editar
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-btn')) {
            const row = event.target.closest('tr');
            const productId = row.dataset.productId;
            const productName = row.cells[0].innerText;
            const productDescription = row.cells[1].innerText;
            const purchasePrice = row.cells[2].innerText;
            const salePrice = row.cells[3].innerText;
            const weight = row.cells[4].innerText;

            // Preencher os campos do formulário com os dados do produto
            document.getElementById('product-name').value = productName;
            document.getElementById('product-description').value = productDescription;
            document.getElementById('purchase-price').value = purchasePrice;
            document.getElementById('sale-price').value = salePrice;
            document.getElementById('weight').value = weight;

            // Mostrar o modal
            editModal.style.display = 'flex';

            // Salvar o id do produto para identificar qual produto foi alterado
            editForm.dataset.productId = productId; // Adicionando ID como atributo no form
        }
    });

    // Fechar o modal
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

// Enviar o formulário de edição
editForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const updatedProduct = {
        nome: document.getElementById('product-name').value,
        descricao: document.getElementById('product-description').value,
        precoCompra: document.getElementById('purchase-price').value,
        precoVenda: document.getElementById('sale-price').value,
        peso: document.getElementById('weight').value,
    };

    const productId = this.dataset.productId;

    // Função para salvar o histórico de alterações
    function salvarHistorico(productId, originalData, updatedData) {
        const historyRef = ref(database, 'product-history/' + productId); // Local de armazenamento do histórico

        // Verifique se o nó 'product-history' e o ID do produto estão corretos
        push(historyRef, {
            date: new Date().toISOString(),
            originalData: originalData,
            updatedData: updatedData,
        }).then(() => {
            console.log("Histórico salvo com sucesso.");
        }).catch((error) => {
            console.error("Erro ao salvar histórico:", error);
        });
    }

    // Salvar o histórico antes de atualizar
    const productRef = ref(database, 'produtos/' + productId);
    get(productRef).then((snapshot) => {
        const originalData = snapshot.val();
        if (originalData) {
            salvarHistorico(productId, originalData, updatedProduct); // Salvar histórico

            // Atualizar os dados do produto no Firebase
            update(productRef, updatedProduct).then(() => {
                showFeedback("Produto atualizado e histórico salvo.", 'success');
            }).catch((error) => {
                console.error("Erro ao atualizar produto:", error);
                showFeedback("Erro ao atualizar o produto. Tente novamente.", 'error');
            });
        } else {
            console.error("Produto não encontrado para o ID:", productId);
            showFeedback("Erro ao recuperar o produto. Tente novamente.", 'error');
        }
    });

    // Fechar o modal
    editModal.style.display = 'none';

    // Atualizar a tabela com os novos dados
    const updatedRow = document.querySelector(`[data-product-id="${productId}"]`);
    updatedRow.cells[0].innerText = updatedProduct.nome;
    updatedRow.cells[1].innerText = updatedProduct.descricao;
    updatedRow.cells[2].innerText = updatedProduct.precoCompra;
    updatedRow.cells[3].innerText = updatedProduct.precoVenda;
    updatedRow.cells[4].innerText = updatedProduct.peso;
});



    // Excluir produto
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const row = event.target.closest('tr');
            const productId = row.dataset.productId;

            // Deletar produto do Firebase
            const productRef = ref(database, 'produtos/' + productId);

            // Remover a linha da tabela após a exclusão do Firebase
            remove(productRef).then(() => {
                row.remove();
            }).catch((error) => {
                console.error('Erro ao excluir produto:', error);
                showFeedback('Erro ao excluir produto. Tente novamente.', 'error');
            });
        }
    });
});
