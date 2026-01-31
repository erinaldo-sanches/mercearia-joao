/**
 * INDEX.JS - Lógica da página principal (Dashboard)
 */

class Dashboard {
    constructor() {
        this.produtosRecentes = [];
        this.estatisticas = {
            totalProdutos: 0,
            totalClientes: 0,
            vendasHoje: 0,
            estoqueBaixo: 0
        };
        
        this.inicializar();
    }
    
    async inicializar() {
        console.log('📊 Inicializando dashboard...');
        
        // Cache de elementos
        this.cacheElementos();
        
        // Verifica conexão com API
        await this.atualizarStatusConexao();
        
        // Carrega dados
        await this.carregarDados();
        
        // Configura atualização periódica
        this.configurarAtualizacaoPeriodica();
        
        console.log('✅ Dashboard inicializado');
    }
    
    cacheElementos() {
        this.elementos = {
            // Cards do dashboard
            totalProdutos: document.getElementById('total-produtos'),
            totalClientes: document.getElementById('total-clientes'),
            vendasHoje: document.getElementById('vendas-hoje'),
            estoqueBaixo: document.getElementById('estoque-baixo'),
            
            // Tabela de produtos recentes
            tabelaProdutos: document.getElementById('tabela-produtos-recentes'),
            tabelaBody: document.querySelector('#tabela-produtos-recentes tbody'),
            loadingRow: document.getElementById('loading-row'),
            
            // Status da API
            apiStatus: document.getElementById('api-status')
        };
    }
    
    async atualizarStatusConexao() {
        if (!this.elementos.apiStatus) return;
        
        try {
            await ProdutoAPI.health();
            this.elementos.apiStatus.innerHTML = `
                <span class="status-online">
                    <i class="fas fa-circle"></i> API Online
                </span>
            `;
            this.elementos.apiStatus.className = 'status-online';
        } catch (erro) {
            this.elementos.apiStatus.innerHTML = `
                <span class="status-offline">
                    <i class="fas fa-circle"></i> API Offline
                </span>
            `;
            this.elementos.apiStatus.className = 'status-offline';
        }
    }
    
    async carregarDados() {
        try {
            // Carrega estatísticas
            await this.carregarEstatisticas();
            
            // Carrega produtos recentes
            await this.carregarProdutosRecentes();
            
        } catch (erro) {
            console.error('Erro ao carregar dados do dashboard:', erro);
            this.mostrarErro('Erro ao carregar dados do dashboard');
        }
    }
    
    async carregarEstatisticas() {
        try {
            // Carrega produtos para calcular estatísticas
            const resposta = await ProdutoAPI.listar(0, 1000);
            const produtos = resposta.data || [];
            
            // Calcula estatísticas
            this.estatisticas.totalProdutos = produtos.length;
            this.estatisticas.estoqueBaixo = produtos.filter(p => 
                (p.qtd_estoque || 0) <= 10
            ).length;
            
            // Atualiza interface
            this.atualizarEstatisticasUI();
            
        } catch (erro) {
            console.error('Erro ao carregar estatísticas:', erro);
            // Mantém valores padrão (0)
        }
    }
    
    atualizarEstatisticasUI() {
        if (this.elementos.totalProdutos) {
            this.elementos.totalProdutos.textContent = this.estatisticas.totalProdutos;
        }
        
        if (this.elementos.estoqueBaixo) {
            this.elementos.estoqueBaixo.textContent = this.estatisticas.estoqueBaixo;
        }
        
        // Nota: Clientes e vendas hoje precisariam de endpoints específicos
        // Por enquanto, mantemos os valores padrão (0)
        if (this.elementos.totalClientes) {
            this.elementos.totalClientes.textContent = this.estatisticas.totalClientes;
        }
        
        if (this.elementos.vendasHoje) {
            this.elementos.vendasHoje.textContent = this.estatisticas.vendasHoje;
        }
    }
    
    async carregarProdutosRecentes() {
        try {
            // Mostra loading
            if (this.elementos.loadingRow) {
                this.elementos.loadingRow.innerHTML = `
                    <td colspan="6" class="text-center">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i> Carregando produtos recentes...
                        </div>
                    </td>
                `;
            }
            
            // Carrega produtos (ordenados por data de cadastro)
            const resposta = await ProdutoAPI.listar(0, 10);
            this.produtosRecentes = resposta.data || [];
            
            // Atualiza tabela
            this.atualizarTabelaProdutos();
            
        } catch (erro) {
            console.error('Erro ao carregar produtos recentes:', erro);
            
            if (this.elementos.loadingRow) {
                this.elementos.loadingRow.innerHTML = `
                    <td colspan="6" class="text-center">
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            Erro ao carregar produtos
                        </div>
                    </td>
                `;
            }
        }
    }
    
    atualizarTabelaProdutos() {
        if (!this.elementos.tabelaBody) return;
        
        // Remove linha de loading
        if (this.elementos.loadingRow) {
            this.elementos.loadingRow.remove();
        }
        
        // Limpa tabela
        this.elementos.tabelaBody.innerHTML = '';
        
        if (this.produtosRecentes.length === 0) {
            // Mostra mensagem de vazio
            this.elementos.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-message">
                            <i class="fas fa-inbox"></i>
                            Nenhum produto cadastrado
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Adiciona produtos à tabela
        this.produtosRecentes.forEach(produto => {
            const preco = produto.preco_venda || produto.preco || 0;
            const estoque = produto.qtd_estoque || produto.estoque || 0;
            const classeEstoque = getClasseEstoque(estoque);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${produto.id}</td>
                <td>
                    <strong>${truncarTexto(produto.nome, 30)}</strong>
                    ${produto.descricao ? `<br><small class="text-muted">${truncarTexto(produto.descricao, 40)}</small>` : ''}
                </td>
                <td><strong>${formatarPreco(preco)}</strong></td>
                <td class="${classeEstoque}">
                    <span class="badge-estoque ${classeEstoque}">
                        ${estoque} unidades
                    </span>
                </td>
                <td>${formatarData(produto.data_cadastro)}</td>
                <td>
                    <div class="acoes-rapidas">
                        <a href="telas/produtos.html?editar=${produto.id}" 
                           class="btn-acao" 
                           title="Editar">
                            <i class="fas fa-edit"></i>
                        </a>
                        <a href="telas/vendas.html?produto=${produto.id}" 
                           class="btn-acao btn-venda" 
                           title="Vender">
                            <i class="fas fa-cash-register"></i>
                        </a>
                    </div>
                </td>
            `;
            
            this.elementos.tabelaBody.appendChild(row);
        });
    }
    
    mostrarErro(mensagem) {
        // Pode implementar um sistema de notificações mais sofisticado
        console.error('Erro no dashboard:', mensagem);
        
        // Mostra alerta temporário
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta(mensagem, 'error', 5000);
        }
    }
    
    configurarAtualizacaoPeriodica() {
        // Atualiza status da API a cada 30 segundos
        setInterval(() => {
            this.atualizarStatusConexao();
        }, 30000);
        
        // Atualiza estatísticas a cada 60 segundos
        setInterval(() => {
            this.carregarEstatisticas();
        }, 60000);
    }
    
    // Métodos para futuras expansões
    async carregarClientes() {
        // Implementar quando tiver endpoint de clientes
        this.estatisticas.totalClientes = 0;
    }
    
    async carregarVendasHoje() {
        // Implementar quando tiver endpoint de vendas
        this.estatisticas.vendasHoje = 0;
    }
}

// Inicialização quando o DOM estiver pronto
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Inicializando página principal...');
    
    // Verifica dependências
    if (typeof ProdutoAPI === 'undefined') {
        console.error('❌ ProdutoAPI não carregada!');
        alert('Erro: API não carregada. Verifique se api.js está carregado.');
        return;
    }
    
    // Inicializa dashboard
    dashboard = new Dashboard();
    window.dashboard = dashboard;
    
    // Adiciona estilos dinâmicos se necessário
    adicionarEstilosDashboard();
    
    console.log('🚀 Dashboard pronto!');
});

/**
 * Adiciona estilos específicos para o dashboard
 */
function adicionarEstilosDashboard() {
    if (document.querySelector('#dashboard-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'dashboard-styles';
    styles.textContent = `
        /* Status da API */
        .status-online {
            color: #2E933C;
            font-weight: 600;
        }
        
        .status-online i {
            color: #2E933C;
        }
        
        .status-offline {
            color: #D64933;
            font-weight: 600;
        }
        
        .status-offline i {
            color: #D64933;
        }
        
        /* Cards do dashboard */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border-top: 4px solid;
            position: relative;
            transition: transform 0.3s ease;
        }
        
        .dashboard-card:hover {
            transform: translateY(-5px);
        }
        
        .card-primary {
            border-top-color: var(--cor-primaria);
        }
        
        .card-warning {
            border-top-color: var(--cor-aviso);
        }
        
        .card-success {
            border-top-color: var(--cor-sucesso);
        }
        
        .card-danger {
            border-top-color: var(--cor-perigo);
        }
        
        .card-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            color: #666;
        }
        
        .card-content h3 {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 10px;
        }
        
        .card-value {
            font-size: 2rem;
            font-weight: 700;
            margin: 5px 0;
        }
        
        .card-link {
            display: inline-block;
            margin-top: 15px;
            color: var(--cor-primaria);
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .card-link:hover {
            text-decoration: underline;
        }
        
        /* Ações rápidas */
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .action-btn {
            background: white;
            border: 2px solid var(--cor-borda);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            text-decoration: none;
            color: var(--cor-texto);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .action-btn:hover {
            border-color: var(--cor-primaria);
            background: rgba(255, 107, 53, 0.05);
            transform: translateY(-2px);
        }
        
        .action-btn i {
            font-size: 2rem;
            color: var(--cor-primaria);
        }
        
        .action-btn span {
            font-weight: 600;
            font-size: 1rem;
        }
        
        /* Seções */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--cor-borda);
        }
        
        .view-all {
            color: var(--cor-primaria);
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .view-all:hover {
            text-decoration: underline;
        }
        
        /* Tabela */
        .table-container {
            overflow-x: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th {
            background: var(--cor-fundo);
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: var(--cor-texto);
            border-bottom: 2px solid var(--cor-primaria);
        }
        
        .data-table td {
            padding: 15px;
            border-bottom: 1px solid var(--cor-borda);
        }
        
        .data-table tr:hover {
            background: rgba(255, 107, 53, 0.03);
        }
        
        .badge-estoque {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .badge-estoque.estoque-baixo {
            background: rgba(214, 73, 51, 0.1);
            color: var(--cor-perigo);
        }
        
        .badge-estoque.estoque-medio {
            background: rgba(240, 200, 8, 0.1);
            color: #B38F00;
        }
        
        .badge-estoque.estoque-bom {
            background: rgba(46, 147, 60, 0.1);
            color: var(--cor-sucesso);
        }
        
        .acoes-rapidas {
            display: flex;
            gap: 8px;
        }
        
        .btn-acao {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--cor-fundo);
            color: var(--cor-texto);
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .btn-acao:hover {
            background: var(--cor-primaria);
            color: white;
            transform: scale(1.1);
        }
        
        .btn-venda {
            background: rgba(46, 147, 60, 0.1);
            color: var(--cor-sucesso);
        }
        
        .btn-venda:hover {
            background: var(--cor-sucesso);
            color: white;
        }
        
        /* Mensagens */
        .loading-spinner, .error-message, .empty-message {
            padding: 40px;
            text-align: center;
            color: #666;
        }
        
        .loading-spinner i {
            margin-right: 10px;
            color: var(--cor-primaria);
        }
        
        .error-message i {
            margin-right: 10px;
            color: var(--cor-perigo);
        }
        
        .empty-message i {
            font-size: 3rem;
            margin-bottom: 15px;
            color: #999;
            display: block;
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .actions-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .data-table th, .data-table td {
                padding: 10px 8px;
                font-size: 0.9rem;
            }
        }
        
        @media (max-width: 480px) {
            .actions-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-card {
                padding: 20px;
            }
            
            .card-value {
                font-size: 1.8rem;
            }
        }
    `;
    
    document.head.appendChild(styles);
}