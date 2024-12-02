const { ipcRenderer } = require('electron');
const { database } = require('../../firebaseConfig');
const { ref, push } = require('firebase/database');

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
    
        // Referência para o nó 'produtos'
        const produtosRef = ref(database, 'produtos');
    
        // Enviar os dados ao Firebase
        push(produtosRef, productData)
            .then(() => {
                alert('Produto cadastrado com sucesso!');
                document.getElementById('product-form').reset();
                document.getElementById('modal-cadastro-produtos').style.display = 'none';
            })
            .catch((error) => {
                console.error('Erro ao salvar produto:', error);
                alert('Erro ao cadastrar o produto.');
            });
    });
    
});
