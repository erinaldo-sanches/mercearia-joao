/**
 * Formata uma data para exibição amigável
 * @param {string|Date} dataString - Data no formato ISO ou objeto Date
 * @param {boolean} incluirHora - Se deve incluir a hora
 * @returns {string} Data formatada
 */
function formatarData(dataString, incluirHora = false) {
    if (!dataString) return '';
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return '';
        
        const opcoes = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        if (incluirHora) {
            opcoes.hour = '2-digit';
            opcoes.minute = '2-digit';
        }
        
        return data.toLocaleDateString('pt-BR', opcoes);
    } catch (erro) {
        console.warn('Erro ao formatar data:', dataString, erro);
        return String(dataString).substring(0, 10);
    }
}

/**
 * Formata um número como moeda brasileira
 * @param {number|string} valor - Valor a formatar
 * @returns {string} Valor formatado
 */
function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return 'R$ 0,00';
    }
    
    const numero = typeof valor === 'string' ? 
        parseFloat(valor.replace(',', '.')) : 
        Number(valor);
    
    if (isNaN(numero) || !isFinite(numero)) {
        return 'R$ 0,00';
    }
    
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Trunca um texto se for muito longo
 * @param {string} texto - Texto a ser truncado
 * @param {number} limite - Número máximo de caracteres
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, limite = 50) {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    
    return texto.substring(0, limite) + '...';
}

/**
 * Verifica se a API está online
 * @returns {Promise<boolean>} True se conectado
 */
async function verificarAPI() {
    try {
        await axios.get(`${API_BASE_URL || 'http://localhost:8000'}/health`, {
            timeout: 5000
        });
        return true;
    } catch (erro) {
        console.error('API offline:', erro.message);
        return false;
    }
}

/**
 * Atualiza o status da API na interface
 * @param {HTMLElement} elemento - Elemento para mostrar o status
 */
async function atualizarStatusAPI(elemento) {
    if (!elemento) return;
    
    const conectado = await verificarAPI();
    
    if (conectado) {
        elemento.innerHTML = `
            <span class="status-online">
                <i class="fas fa-circle"></i> API Online
            </span>
        `;
        elemento.className = elemento.className.replace('status-offline', 'status-online');
    } else {
        elemento.innerHTML = `
            <span class="status-offline">
                <i class="fas fa-circle"></i> API Offline
            </span>
        `;
        elemento.className = elemento.className.replace('status-online', 'status-offline');
    }
}

/**
 * Cria um elemento de loading
 * @param {string} mensagem - Mensagem do loading
 * @returns {string} HTML do loading
 */
function criarLoading(mensagem = 'Carregando...') {
    return `
        <div class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
            <span>${mensagem}</span>
        </div>
    `;
}

/**
 * Cria uma mensagem de erro
 * @param {string} mensagem - Mensagem de erro
 * @returns {string} HTML do erro
 */
function criarMensagemErro(mensagem) {
    return `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <span>${mensagem}</span>
        </div>
    `;
}

/**
 * Cria uma mensagem de vazio
 * @param {string} mensagem - Mensagem
 * @param {string} icone - Ícone FontAwesome
 * @returns {string} HTML da mensagem
 */
function criarMensagemVazio(mensagem = 'Nenhum dado encontrado', icone = 'fas fa-inbox') {
    return `
        <div class="empty-message">
            <i class="${icone}"></i>
            <span>${mensagem}</span>
        </div>
    `;
}

/**
 * Verifica se um elemento está visível na viewport
 * @param {HTMLElement} elemento - Elemento a verificar
 * @returns {boolean} True se visível
 */
function estaVisivel(elemento) {
    if (!elemento) return false;
    
    const rect = elemento.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Debounce - Atrasa a execução de uma função
 * @param {Function} func - Função a executar
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exporta para escopo global
window.formatarData = formatarData;
window.formatarMoeda = formatarMoeda;
window.truncarTexto = truncarTexto;
window.verificarAPI = verificarAPI;
window.atualizarStatusAPI = atualizarStatusAPI;
window.criarLoading = criarLoading;
window.criarMensagemErro = criarMensagemErro;
window.criarMensagemVazio = criarMensagemVazio;
window.estaVisivel = estaVisivel;
window.debounce = debounce;

console.log('UTILS.JS carregado');