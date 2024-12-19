const IMask = require('imask').default;
const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { ref, push } = require('firebase/database');

// Função para exibir feedback
function showFeedback(message, type) {
    const feedbackElement = document.getElementById('feedback');
    feedbackElement.style.display = 'block';
    feedbackElement.textContent = message;

    // Limpa as classes anteriores
    feedbackElement.classList.remove('success', 'warning', 'error');

    // Adiciona a classe apropriada com base no tipo
    if (type === 'success') {
        feedbackElement.classList.add('success');
    } else if (type === 'warning') {
        feedbackElement.classList.add('warning');
    } else if (type === 'error') {
        feedbackElement.classList.add('error');
    }

    // Remove a mensagem após 2 segundos
    setTimeout(() => {
        feedbackElement.style.display = 'none';
    }, 2000);
}

// Para navegar para o estoque de produtos
document.getElementById('estoqueProdutosButton').addEventListener('click', () => {
    ipcRenderer.send('estoque-produtos');
});

document.getElementById('vendaProdutosButton').addEventListener('click', () => {
    ipcRenderer.send('venda-produtos');
});

document.getElementById('compraProdutosButton').addEventListener('click', () => {
    ipcRenderer.send('compra-produtos');
});

// Função para mostrar o loading no botão
function toggleButtonLoading(button, isLoading) {
    const spinner = button.querySelector('.spinner');
    if (isLoading) {
        button.setAttribute('disabled', 'true'); // Desativa o botão
        spinner.style.display = 'inline-block';  // Mostra o spinner
    } else {
        button.removeAttribute('disabled');  // Habilita o botão novamente
        spinner.style.display = 'none'; // Esconde o spinner
    }
}

// FIREBASE
document.addEventListener('DOMContentLoaded', () => {
    // Máscara para o preço de compra
    const priceBuyInput = document.getElementById('product-price-buy');
    const priceBuyMask = IMask(priceBuyInput, {
        mask: 'R$ num',  // Formato de moeda brasileira
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

    // Máscara para o preço de venda
    const priceSellInput = document.getElementById('product-price-sell');
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

    // Máscara para o peso (numérica com 2 casas decimais)
    const pesoInput = document.getElementById('product-peso');
    const pesoMask = IMask(pesoInput, {
        mask: Number,
        thousandsSeparator: '',
        radix: '.',
        scale: 3,
        max: 9999.99,
        padFractionalZeros: true,
    });

    // Função para abrir o modal
    document.getElementById('menu-cadastro-produtos').addEventListener('click', () => {
        const modal = document.getElementById('modal-cadastro-produtos');
        modal.style.display = 'flex';
    });

    // Função para fechar o modal
    document.getElementById('close-btn').addEventListener('click', () => {
        const modal = document.getElementById('modal-cadastro-produtos');
        modal.style.display = 'none';
    });

    // Salva os dados no Firebase ao enviar o formulário
    document.getElementById('product-form').addEventListener('submit', (event) => {
        event.preventDefault();

        // Obtém os valores do formulário com a máscara
        const productData = {
            codigo: document.getElementById('product-cod').value,
            nome: document.getElementById('product-name').value,
            descricao: document.getElementById('product-description').value,
            precoCompra: priceBuyMask.unmaskedValue, // Utiliza unmaskedValue para obter valor sem formatação
            precoVenda: priceSellMask.unmaskedValue, // Utiliza unmaskedValue para obter valor sem formatação
            peso: pesoMask.unmaskedValue,            // Utiliza unmaskedValue para obter valor sem formatação
        };

        console.log('Dados capturados:', productData); // Verificar se os dados estão corretos

        // Verifica se todos os campos estão preenchidos
        if (!productData.nome || !productData.precoCompra || !productData.precoVenda || !productData.peso) {
            showFeedback('Por favor, preencha todos os campos.', 'warning');
            return;
        }

        // Obtém o botão de "Cadastrar Produto"
        const submitButton = document.querySelector('button[type="submit"]');

        // Mostra o spinner no botão de submit
        toggleButtonLoading(submitButton, true);

        // Referência para o nó 'produtos'
        const produtosRef = ref(database, 'produtos');

        // Enviar os dados ao Firebase
        push(produtosRef, productData)
            .then(() => {
                // Esconde o spinner no botão
                toggleButtonLoading(submitButton, false);

                showFeedback('Produto cadastrado com sucesso!', 'success');
                document.getElementById('product-form').reset(); // Limpa o formulário
            })
            .catch((error) => {
                // Esconde o spinner no botão
                toggleButtonLoading(submitButton, false);

                console.error('Erro ao salvar produto:', error);
                showFeedback('Erro ao cadastrar o produto. Tente novamente.', 'error');
            });
    });
});
