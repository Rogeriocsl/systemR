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

    // Remove a mensagem após 1.5 segundos
    setTimeout(() => {
        feedbackElement.style.display = 'none';
    }, 2000);
}

// Função para mostrar o loading no botão
function showButtonLoading(button) {
    button.setAttribute('disabled', 'true'); // Desativa o botão
    const spinner = button.querySelector('.spinner');
    spinner.style.display = 'inline-block'; // Mostra o spinner
}

// Função para esconder o loading no botão
function hideButtonLoading(button) {
    button.removeAttribute('disabled'); // Habilita o botão novamente
    const spinner = button.querySelector('.spinner');
    spinner.style.display = 'none'; // Esconde o spinner
}

// FIREBASE

document.addEventListener('DOMContentLoaded', () => {
    // Abre o modal
    document.getElementById('menu-cadastro-produtos').addEventListener('click', () => {
        const modal = document.getElementById('modal-cadastro-produtos');
        modal.style.display = 'flex';
    });

    // Fecha o modal
    document.getElementById('close-btn').addEventListener('click', () => {
        const modal = document.getElementById('modal-cadastro-produtos');
        modal.style.display = 'none';
    });

    // Fecha o modal ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal-cadastro-produtos');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Salva os dados no Firebase ao enviar o formulário
    document.getElementById('product-form').addEventListener('submit', (event) => {
        event.preventDefault();

        // Obtém os valores do formulário
        const productData = {
            codigo: document.getElementById('product-cod').value,
            nome: document.getElementById('product-name').value,
            descricao: document.getElementById('product-description').value,
            precoCompra: parseFloat(document.getElementById('product-price-buy').value) || 0,
            precoVenda: parseFloat(document.getElementById('product-price-sell').value) || 0,
            quantidade: parseInt(document.getElementById('product-quantity').value) || 0
        };

        console.log('Dados capturados:', productData); // Verificar se os dados estão corretos

        // Verifica se todos os campos estão preenchidos
        if (!productData.codigo || !productData.nome || !productData.descricao || !productData.precoCompra || !productData.precoVenda || !productData.quantidade) {
            showFeedback('Por favor, preencha todos os campos.', 'warning');
            return;
        }

        // Verificação simples de valores numéricos para os preços e quantidade
        if (isNaN(productData.precoCompra) || isNaN(productData.precoVenda) || isNaN(productData.quantidade)) {
            showFeedback('Os campos de preço e quantidade devem ser numéricos.', 'error');
            return;
        }

        // Obtém o botão de "Cadastrar Produto"
        const submitButton = document.querySelector('button[type="submit"]');

        // Mostra o spinner no botão de submit
        showButtonLoading(submitButton);

        // Referência para o nó 'produtos'
        const produtosRef = ref(database, 'produtos');

        // Desabilita o botão e exibe o spinner
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;

        // Enviar os dados ao Firebase
        push(produtosRef, productData)
            .then(() => {
                // Esconde o spinner no botão
                hideButtonLoading(submitButton);

                showFeedback('Produto cadastrado com sucesso!', 'success');
                document.getElementById('product-form').reset(); // Limpa o formulário
            })
            .catch((error) => {
                // Esconde o spinner no botão
                hideButtonLoading(submitButton);

                console.error('Erro ao salvar produto:', error);
                showFeedback('Erro ao cadastrar o produto. Tente novamente.', 'error');
            });
    });

});
