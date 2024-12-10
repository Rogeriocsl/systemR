const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { get, ref, push, update, remove } = require('firebase/database');
const IMask = require('imask').default;

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
                            <td>${produto.codigo}</td>
                            <td>${produto.nome}</td>
                            <td>${produto.descricao}</td>
                            <td>${produto.precoCompra}</td>
                            <td>${produto.precoVenda}</td>
                            <td>${produto.peso} kg</td>
                            <td>
                                <button class="edit-btn">
                                    <i class="fas fa-edit edit-btn"></i>
                                </button>
                                <button class="delete-btn">
                                    <i class="fas fa-trash-alt delete-btn"></i>
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
        const rows = document.querySelectorAll('.product-item'); // Seleciona todas as linhas da tabela
    
        rows.forEach((row) => {
            let found = false; // Variável para determinar se algum campo da linha corresponde à pesquisa
    
            // Percorre todas as células da linha e verifica se alguma contém o valor da pesquisa
            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
                if (cell.textContent.toLowerCase().includes(searchValue)) {
                    found = true; // Se encontrar algum valor correspondente, marca como encontrado
                }
            });
    
            // Exibe ou esconde a linha com base na pesquisa
            if (found) {
                row.style.display = ''; // Exibe a linha
            } else {
                row.style.display = 'none'; // Esconde a linha
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



    // Inicialize as máscaras fora do evento de clique, para garantir que não sejam recriadas toda vez
    const priceBuyInput = document.getElementById('purchase-price');
    const priceSellInput = document.getElementById('sale-price');
    const pesoInput = document.getElementById('weight');

    // Máscara para os preços e peso
    const priceBuyMask = IMask(priceBuyInput, {
        mask: 'R$ num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                radix: ',',
                scale: 2,
                min: 0,
                padFractionalZeros: true,
            },
        },
    });

    const priceSellMask = IMask(priceSellInput, {
        mask: 'R$ num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                radix: ',',
                scale: 2,
                min: 0,
                padFractionalZeros: true,
            },
        },
    });

    const pesoMask = IMask(pesoInput, {
        mask: Number,
        thousandsSeparator: '',
        radix: '.',
        scale: 3,
        max: 9999.99,
        padFractionalZeros: true,
    });




    // Evento para abrir o modal ao clicar no ícone de editar
    document.addEventListener('click', (event) => {

        // Verifica se o clique foi no botão de editar, e não no ícone
        if (event.target.classList.contains('edit-btn') || event.target.closest('.edit-btn')) {
            const row = event.target.closest('tr');
            const productId = row.dataset.productId;
            const productCod = row.cells[0].innerText;
            const productName = row.cells[1].innerText;
            const productDescription = row.cells[2].innerText;
            const purchasePrice = row.cells[3].innerText;
            const salePrice = row.cells[4].innerText;
            const weight = row.cells[5].innerText;

            // Preenche os campos do formulário com os dados do produto
            document.getElementById('product-cod').value = productCod;
            document.getElementById('product-name').value = productName;
            document.getElementById('product-description').value = productDescription;
            document.getElementById('purchase-price').value = purchasePrice;
            document.getElementById('sale-price').value = salePrice;
            document.getElementById('weight').value = weight;

            // Re-aplica as máscaras para os campos preenchidos
            priceBuyMask.updateValue();
            priceSellMask.updateValue();
            pesoMask.updateValue();

            // Exibe o modal
            editModal.style.display = 'flex';

            // Salva o ID do produto no formulário
            editForm.dataset.productId = productId;
        }
    });



    // Fechar o modal
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Enviar o formulário de edição
    editForm.addEventListener('submit', function (event) {
        event.preventDefault();


        const updatedProduct = {
            codigo: document.getElementById('product-cod').value,
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
                    showFeedback("Produto atualizado.", 'success');
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
        updatedRow.cells[0].innerText = updatedProduct.codigo;
        updatedRow.cells[1].innerText = updatedProduct.nome;
        updatedRow.cells[2].innerText = updatedProduct.descricao;
        updatedRow.cells[3].innerText = updatedProduct.precoCompra;
        updatedRow.cells[4].innerText = updatedProduct.precoVenda;
        updatedRow.cells[5].innerText = updatedProduct.peso;
    });



    // Excluir produto
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const row = event.target.closest('tr');
            const productId = row.dataset.productId;
            const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

            // Exibir o modal de confirmação
            deleteConfirmationModal.style.display = 'flex';

            // Confirmar a exclusão do produto
            confirmDeleteBtn.onclick = function () {
                const productRef = ref(database, 'produtos/' + productId);

                // Deletar produto do Firebase
                remove(productRef).then(() => {
                    row.remove();
                    showFeedback('Produto excluído com sucesso.', 'success');
                    deleteConfirmationModal.style.display = 'none'; // Fechar o modal após exclusão
                }).catch((error) => {
                    console.error('Erro ao excluir produto:', error);
                    showFeedback('Erro ao excluir produto. Tente novamente.', 'error');
                    deleteConfirmationModal.style.display = 'none'; // Fechar o modal após erro
                });
            };

            // Cancelar a exclusão
            cancelDeleteBtn.onclick = function () {
                showFeedback('Exclusão do produto cancelada.', 'warning');
                deleteConfirmationModal.style.display = 'none'; // Fechar o modal se o usuário cancelar
            };
        }
    });

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



});
