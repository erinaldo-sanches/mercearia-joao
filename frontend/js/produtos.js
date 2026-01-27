/**
 * produtos.js - Lógica da página de produtos
 * Usa Classes ES6 para organização
 */

class ProdutosApp {
    constructor() {
        this.API_URL = 'http://localhost:8000/produtos';
        this.produtos = [];
        this.elementos = {};
        
        this.inicializar();
    }
    
    inicializar() {
        this.cacheElementos();
        this.configurarEventos();
        this.carregarProdutos();
    }
    
    cacheElementos() {
        // Formulário
        this.elementos.formProduto = document.getElementById('form-produto');
        this.elementos.nome = document.getElementById('nome');
        this.elementos.preco = document.getElementById('preco');
        this.elementos.estoque = document.getElementById('estoque');
        this.elementos.btnLimpar = document.getElementById('btn-limpar');
        
        // Lista
        this.elementos.btnCarregar = document.getElementById('btn-carregar');
        this.elementos.loadingState = document.getElementById('loading-state');
        this.elementos.emptyState = document.getElementById('empty-state');
        this.elementos.tableContainer = document.getElementById('products-table-container');
        this.elementos.tableBody = document.getElementById('products-table-body');
        this.elementos.totalCount = document.getElementById('total-count');
        
        // Modal
        this.elementos.modal = document.getElementById('modal-editar');
        this.elementos.formEditar = document.getElementById('form-editar');
        this.elementos.editId = document.getElementById('edit-id');
        this.elementos.editNome = document.getElementById('edit-nome');
        this.elementos.editPreco = document.getElementById('edit-preco');
        this.elementos.editEstoque = document.getElementById('edit-estoque');
        this.elementos.btnCancelar = document.getElementById('btn-cancelar');
        this.elementos.modalClose = document.querySelector('.modal-close');
    }
    
    configurarEventos() {
        // Formulário principal
        this.elementos.formProduto.addEventListener('submit', (e) => this.salvarProduto(e));
        this.elementos.btnLimpar.addEventListener('click', () => this.limparFormulario());
        this.elementos.btnCarregar.addEventListener('click', () => this.carregarProdutos());
        
        // Modal
        this.elementos.formEditar.addEventListener('submit', (e) => this.salvarEdicao(e));
        this.elementos.btnCancelar.addEventListener('click', () => this.fecharModal());
        this.elementos.modalClose.addEventListener('click', () => this.fecharModal());
        
        // Fechar modal ao clicar fora
        this.elementos.modal.addEventListener('click', (e) => {
            if (e.target === this.elementos.modal) this.fecharModal();
        });
    }
    
    // ========== CRUD ==========
    
    async carregarProdutos() {
        this.mostrarLoading(true);
        
        try {
            const response = await axios.get(this.API_URL);
            this.produtos = response.data;
            
            if (this.produtos.length > 0) {
                this.renderizarTabela();
                this.elementos.emptyState.style.display = 'none';
                this.elementos.tableContainer.style.display = 'block';
            } else {
                this.elementos.emptyState.style.display = 'block';
                this.elementos.tableContainer.style.display = 'none';
            }
            
            this.elementos.totalCount.textContent = this.produtos.length;
            
        } catch (error) {
            this.mostrarErro('Erro ao carregar produtos. Verifique o backend.');
            console.error('Erro:', error);
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    async salvarProduto(event) {
        event.preventDefault();
        
        const produto = {
            nome: this.elementos.nome.value.trim(),
            preco_venda: parseFloat(this.elementos.preco.value),
            qtd_estoque: parseInt(this.elementos.estoque.value)
        };
        
        try {
            await axios.post(this.API_URL, produto);
            this.mostrarSucesso('Produto cadastrado com sucesso!');
            this.limparFormulario();
            await this.carregarProdutos();
        } catch (error) {
            this.tratarErroAPI(error, 'criar produto');
        }
    }
    
    async editarProduto(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;
        
        this.elementos.editId.value = produto.id;
        this.elementos.editNome.value = produto.nome;
        this.elementos.editPreco.value = produto.preco_venda;
        this.elementos.editEstoque.value = produto.qtd_estoque;
        
        this.abrirModal();
    }
    
    async salvarEdicao(event) {
        event.preventDefault();
        
        const id = this.elementos.editId.value;
        const produto = {
            nome: this.elementos.editNome.value.trim(),
            preco_venda: parseFloat(this.elementos.editPreco.value),
            qtd_estoque: parseInt(this.elementos.editEstoque.value)
        };
        
        try {
            await axios.put(`${this.API_URL}/${id}`, produto);
            this.mostrarSucesso('Produto atualizado!');
            this.fecharModal();
            await this.carregarProdutos();
        } catch (error) {
            this.tratarErroAPI(error, 'atualizar produto');
        }
    }
    
    async excluirProduto(id, nome) {
        if (!confirm(`Excluir produto "${nome}"?`)) return;
        
        try {
            await axios.delete(`${this.API_URL}/${id}`);
            this.mostrarSucesso('Produto excluído!');
            await this.carregarProdutos();
        } catch (error) {
            this.tratarErroAPI(error, 'excluir produto');
        }
    }
    
    // ========== RENDERIZAÇÃO ==========
    
    renderizarTabela() {
        let html = '';
        
        this.produtos.forEach(produto => {
            html += `
                <tr>
                    <td>${produto.id}</td>
                    <td>${produto.nome}</td>
                    <td>R$ ${parseFloat(produto.preco_venda).toFixed(2)}</td>
                    <td>${produto.qtd_estoque}</td>
                    <td class="actions-cell">
                        <button class="btn btn-primary btn-sm" 
                                onclick="app.editarProduto(${produto.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm"
                                onclick="app.excluirProduto(${produto.id}, '${produto.nome}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        this.elementos.tableBody.innerHTML = html;
    }
    
    // ========== MODAL ==========
    
    abrirModal() {
        this.elementos.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    fecharModal() {
        this.elementos.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.elementos.formEditar.reset();
    }
    
    // ========== UTILITÁRIOS ==========
    
    mostrarLoading(mostrar) {
        this.elementos.loadingState.style.display = mostrar ? 'flex' : 'none';
    }
    
    mostrarSucesso(mensagem) {
        alert('✅ ' + mensagem);
    }
    
    mostrarErro(mensagem) {
        alert('❌ ' + mensagem);
    }
    
    tratarErroAPI(error, operacao) {
        let mensagem = `Erro ao ${operacao}`;
        
        if (error.response?.data?.detail) {
            mensagem = error.response.data.detail;
        } else if (error.request) {
            mensagem = 'Servidor não respondeu. Backend rodando?';
        }
        
        this.mostrarErro(mensagem);
    }
    
    limparFormulario() {
        this.elementos.formProduto.reset();
    }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProdutosApp();
    window.app = app; // Expor para onclick
});