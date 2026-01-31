// Configuração base da API
const API_BASE_URL = 'http://localhost:8000';
const API_TIMEOUT = 10000; // 10 segundos

// Configuração global do Axios
axios.defaults.timeout = API_TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Transforma dados do frontend para formato do backend
 * @param {Object} dadosFrontend - Dados no formato do frontend
 * @returns {Object} Dados no formato do backend
 */
function transformarParaBackend(dadosFrontend) {
    if (!dadosFrontend) return {};
    
    return {
        nome: dadosFrontend.nome || '',
        descricao: dadosFrontend.descricao || null,
        preco_venda: dadosFrontend.preco || dadosFrontend.preco_venda || 0,
        qtd_estoque: dadosFrontend.estoque || dadosFrontend.qtd_estoque || 0
    };
}

/**
 * Transforma dados do backend para formato do frontend
 * @param {Object} dadosBackend - Dados no formato do backend
 * @returns {Object} Dados no formato do frontend
 */
function transformarParaFrontend(dadosBackend) {
    if (!dadosBackend) return {};
    
    return {
        id: dadosBackend.id,
        nome: dadosBackend.nome || '',
        descricao: dadosBackend.descricao || '',
        preco: dadosBackend.preco_venda || 0,
        preco_venda: dadosBackend.preco_venda || 0, // Mantém ambos para compatibilidade
        estoque: dadosBackend.qtd_estoque || 0,
        qtd_estoque: dadosBackend.qtd_estoque || 0, // Mantém ambos para compatibilidade
        ativo: dadosBackend.ativo !== false,
        data_cadastro: dadosBackend.data_cadastro
    };
}

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param {number|string} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda
 */
function formatarPreco(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return 'R$ 0,00';
    }
    
    // Converte para número
    const numero = typeof valor === 'string' ? 
        parseFloat(valor.replace(',', '.')) : 
        Number(valor);
    
    // Verifica se é um número válido
    if (isNaN(numero) || !isFinite(numero)) {
        console.warn('Valor inválido para formatação:', valor);
        return 'R$ 0,00';
    }
    
    // Formata como moeda brasileira
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Determina a classe CSS baseada na quantidade em estoque
 * @param {number|string} quantidade - Quantidade em estoque
 * @returns {string} Classe CSS correspondente
 */
function getClasseEstoque(quantidade) {
    const qtd = typeof quantidade === 'string' ? 
        parseInt(quantidade, 10) : 
        Number(quantidade) || 0;
    
    if (qtd <= 10) return 'estoque-baixo';
    if (qtd <= 30) return 'estoque-medio';
    return 'estoque-bom';
}

/**
 * Formata a data para exibição amigável
 * @param {string|Date} dataString - Data no formato ISO ou objeto Date
 * @returns {string} Data formatada
 */
function formatarData(dataString) {
    if (!dataString) return '';
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return '';
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (erro) {
        console.warn('Erro ao formatar data:', dataString, erro);
        return String(dataString).substring(0, 16).replace('T', ' ');
    }
}

/**
 * Valida dados de produto antes de enviar para API
 * @param {Object} produto - Dados do produto
 * @returns {Object} Resultado da validação {valido: boolean, erros: string[]}
 */
function validarProduto(produto) {
    const erros = [];
    
    // Validação de nome
    if (!produto.nome || produto.nome.trim().length === 0) {
        erros.push('Nome do produto é obrigatório');
    } else if (produto.nome.length > 100) {
        erros.push('Nome deve ter no máximo 100 caracteres');
    }
    
    // Validação de preço
    const preco = produto.preco_venda || produto.preco || 0;
    if (preco <= 0) {
        erros.push('Preço deve ser maior que zero');
    }
    
    // Validação de casas decimais do preço
    if (preco.toString().includes('.')) {
        const partes = preco.toString().split('.');
        if (partes[1].length > 2) {
            erros.push('Preço deve ter no máximo 2 casas decimais');
        }
    }
    
    // Validação de estoque
    const estoque = produto.qtd_estoque || produto.estoque || 0;
    if (estoque < 0) {
        erros.push('Estoque não pode ser negativo');
    }
    
    return {
        valido: erros.length === 0,
        erros: erros
    };
}

/**
 * Exibe um alerta temporário na interface
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo do alerta (success, error, warning, info)
 * @param {number} tempo - Tempo em milissegundos para o alerta desaparecer (0 = permanente)
 * @returns {HTMLElement} Elemento do alerta criado
 */
function mostrarAlerta(mensagem, tipo = 'info', tempo = 4000) {
    // Tipos de alerta suportados
    const tipos = {
        success: { cor: '#2E933C', icone: 'check-circle', nome: 'Sucesso' },
        error: { cor: '#D64933', icone: 'exclamation-circle', nome: 'Erro' },
        warning: { cor: '#F0C808', icone: 'exclamation-triangle', nome: 'Aviso' },
        info: { cor: '#FF6B35', icone: 'info-circle', nome: 'Informação' }
    };
    
    const config = tipos[tipo] || tipos.info;
    
    // Cria elemento do alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease;
    `;
    
    alerta.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas fa-${config.icone}" style="color: ${config.cor}; font-size: 1.2rem; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: ${config.cor}; margin-bottom: 4px;">
                    ${config.nome}
                </div>
                <div style="color: #2D2D2D;">
                    ${mensagem}
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem;">
                &times;
            </button>
        </div>
    `;
    
    // Adiciona ao DOM
    document.body.appendChild(alerta);
    
    // Remove após o tempo especificado
    if (tempo > 0) {
        setTimeout(() => {
            if (alerta.parentElement) {
                alerta.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (alerta.parentElement) {
                        alerta.remove();
                    }
                }, 300);
            }
        }, tempo);
    }
    
    return alerta;
}

/**
 * Módulo de API para produtos
 */
const ProdutoAPI = {
    /**
     * Lista todos os produtos
     * @param {number} skip - Quantidade de registros a pular
     * @param {number} limit - Quantidade máxima de registros
     * @returns {Promise} Promise com a resposta da API
     */
    listar: async (skip = 0, limit = 100) => {
        try {
            const resposta = await axios.get(`${API_BASE_URL}/produtos`, {
                params: { skip, limit }
            });
            
            // Transforma dados do backend para frontend
            if (resposta.data && Array.isArray(resposta.data)) {
                resposta.data = resposta.data.map(transformarParaFrontend);
            }
            
            return resposta;
        } catch (erro) {
            console.error('Erro ao listar produtos:', erro);
            throw erro;
        }
    },
    
    /**
     * Cria um novo produto
     * @param {Object} produto - Dados do produto
     * @returns {Promise} Promise com a resposta da API
     */
    criar: async (produto) => {
        try {
            // Valida dados antes de enviar
            const validacao = validarProduto(produto);
            if (!validacao.valido) {
                throw {
                    response: {
                        status: 400,
                        data: { detail: validacao.erros.join(', ') }
                    }
                };
            }
            
            // Transforma dados para formato do backend
            const dadosBackend = transformarParaBackend(produto);
            
            const resposta = await axios.post(`${API_BASE_URL}/produtos`, dadosBackend);
            
            // Transforma resposta para frontend
            if (resposta.data) {
                resposta.data = transformarParaFrontend(resposta.data);
            }
            
            return resposta;
        } catch (erro) {
            console.error('Erro ao criar produto:', erro);
            throw erro;
        }
    },
    
    /**
     * Busca produto por ID
     * @param {number} id - ID do produto
     * @returns {Promise} Promise com a resposta da API
     */
    buscarPorId: async (id) => {
        try {
            if (!id || isNaN(Number(id))) {
                throw {
                    response: {
                        status: 400,
                        data: { detail: 'ID do produto inválido' }
                    }
                };
            }
            
            const resposta = await axios.get(`${API_BASE_URL}/produtos/${id}`);
            
            // Transforma resposta para frontend
            if (resposta.data) {
                resposta.data = transformarParaFrontend(resposta.data);
            }
            
            return resposta;
        } catch (erro) {
            console.error(`Erro ao buscar produto ID ${id}:`, erro);
            throw erro;
        }
    },
    
    /**
     * Atualiza um produto existente
     * @param {number} id - ID do produto
     * @param {Object} produto - Dados atualizados do produto
     * @returns {Promise} Promise com a resposta da API
     */
    atualizar: async (id, produto) => {
        try {
            if (!id || isNaN(Number(id))) {
                throw {
                    response: {
                        status: 400,
                        data: { detail: 'ID do produto inválido' }
                    }
                };
            }
            
            // Valida dados antes de enviar
            const validacao = validarProduto(produto);
            if (!validacao.valido) {
                throw {
                    response: {
                        status: 400,
                        data: { detail: validacao.erros.join(', ') }
                    }
                };
            }
            
            // Transforma dados para formato do backend
            const dadosBackend = transformarParaBackend(produto);
            
            const resposta = await axios.put(`${API_BASE_URL}/produtos/${id}`, dadosBackend);
            
            // Transforma resposta para frontend
            if (resposta.data) {
                resposta.data = transformarParaFrontend(resposta.data);
            }
            
            return resposta;
        } catch (erro) {
            console.error(`Erro ao atualizar produto ID ${id}:`, erro);
            throw erro;
        }
    },
    
    /**
     * Exclui um produto
     * @param {number} id - ID do produto
     * @returns {Promise} Promise com a resposta da API
     */
    excluir: async (id) => {
        try {
            if (!id || isNaN(Number(id))) {
                throw {
                    response: {
                        status: 400,
                        data: { detail: 'ID do produto inválido' }
                    }
                };
            }
            
            const resposta = await axios.delete(`${API_BASE_URL}/produtos/${id}`);
            return resposta;
        } catch (erro) {
            console.error(`Erro ao excluir produto ID ${id}:`, erro);
            throw erro;
        }
    },
    
    /**
     * Busca produtos por nome (busca parcial)
     * @param {string} nome - Termo de busca
     * @returns {Promise} Promise com a resposta da API
     */
    buscarPorNome: async (nome) => {
        try {
            if (!nome || nome.trim().length === 0) {
                return { data: [] };
            }
            
            const resposta = await axios.get(`${API_BASE_URL}/produtos/buscar/${encodeURIComponent(nome)}`);
            
            // Transforma dados do backend para frontend
            if (resposta.data && Array.isArray(resposta.data)) {
                resposta.data = resposta.data.map(transformarParaFrontend);
            }
            
            return resposta;
        } catch (erro) {
            console.error(`Erro ao buscar produtos por nome "${nome}":`, erro);
            throw erro;
        }
    },
    
    /**
     * Verifica status da API
     * @returns {Promise} Promise com a resposta da API
     */
    health: async () => {
        try {
            const resposta = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 5000 // Timeout mais curto para health check
            });
            return resposta;
        } catch (erro) {
            console.error('Erro no health check:', erro);
            throw erro;
        }
    },
    
    /**
     * Testa a conexão com a API
     * @returns {Promise<boolean>} True se conectado, False se não
     */
    testarConexao: async () => {
        try {
            await axios.get(`${API_BASE_URL}/`, { timeout: 5000 });
            return true;
        } catch (erro) {
            console.error('Falha na conexão com a API:', erro.message);
            return false;
        }
    }
};

// Adiciona animação CSS para os alertas (se não existir)
if (!document.querySelector('#alert-animations')) {
    const style = document.createElement('style');
    style.id = 'alert-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .alert-success {
            background-color: rgba(46, 147, 60, 0.1) !important;
            border-left: 5px solid #2E933C !important;
            color: #2E933C !important;
        }
        
        .alert-error {
            background-color: rgba(214, 73, 51, 0.1) !important;
            border-left: 5px solid #D64933 !important;
            color: #D64933 !important;
        }
        
        .alert-warning {
            background-color: rgba(240, 200, 8, 0.1) !important;
            border-left: 5px solid #F0C808 !important;
            color: #B38F00 !important;
        }
        
        .alert-info {
            background-color: rgba(255, 107, 53, 0.1) !important;
            border-left: 5px solid #FF6B35 !important;
            color: #FF6B35 !important;
        }
    `;
    document.head.appendChild(style);
}

// Exporta funções e objetos para o escopo global
window.ProdutoAPI = ProdutoAPI;
window.formatarPreco = formatarPreco;
window.getClasseEstoque = getClasseEstoque;
window.mostrarAlerta = mostrarAlerta;
window.formatarData = formatarData;
window.validarProduto = validarProduto;
window.API_BASE_URL = API_BASE_URL;
window.transformarParaBackend = transformarParaBackend;
window.transformarParaFrontend = transformarParaFrontend;

// Mensagem de inicialização
console.log('✅ API.JS carregado com sucesso!');
console.log(`🔗 URL da API: ${API_BASE_URL}`);
console.log(`🕐 Timeout: ${API_TIMEOUT}ms`);

// Teste automático da conexão (apenas em desenvolvimento)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(async () => {
        try {
            const conectado = await ProdutoAPI.testarConexao();
            if (conectado) {
                console.log('🌐 Conexão com API estabelecida');
            } else {
                console.warn('⚠️  API não responde - Verifique se o servidor FastAPI está rodando');
            }
        } catch (erro) {
            console.warn('⚠️  Não foi possível testar a conexão com a API');
        }
    }, 1000);
}