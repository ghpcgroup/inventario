// Dados iniciais mockados
let inventario = [];

// Gráficos
let chartStatusObj = null;
let chartTipoObj = null;

function atualizarGraficos(dados) {
    const ctxStatus = document.getElementById('chartStatus');
    const ctxTipo = document.getElementById('chartTipo');

    if (!ctxStatus || !ctxTipo) return;

    // Contagem Status
    const countsStatus = { 'Em uso': 0, 'Estoque': 0, 'Manutenção': 0, 'Descarte': 0 };
    // Contagem Tipo
    const countsTipo = { 'Notebook': 0, 'Celular': 0, 'PC': 0, 'Monitor': 0, 'Impressora': 0, 'Ferramenta': 0, 'Outros': 0 };

    dados.forEach(item => {
        if (countsStatus[item.status] !== undefined) countsStatus[item.status]++;
        if (countsTipo[item.tipo] !== undefined) countsTipo[item.tipo]++;
        else countsTipo['Outros']++;
    });

    // Destroy existing charts to redraw
    if (chartStatusObj) chartStatusObj.destroy();
    if (chartTipoObj) chartTipoObj.destroy();

    chartStatusObj = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: Object.keys(countsStatus),
            datasets: [{
                data: Object.values(countsStatus),
                backgroundColor: ['#25d366', '#f39c12', '#e74c3c', '#7f8c8d']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    chartTipoObj = new Chart(ctxTipo, {
        type: 'doughnut',
        data: {
            labels: Object.keys(countsTipo),
            datasets: [{
                data: Object.values(countsTipo),
                backgroundColor: ['#0070B8', '#27ae60', '#8e44ad', '#3498db', '#e67e22', '#7f8c8d', '#f39c12']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// Controle de Acesso
let currentUserRole = null; // 'admin' ou 'user'

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verifica tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').checked = true;
    }

    // Ocultar modal config por padrão
    const modalConfig = document.getElementById('modalConfig');
    modalConfig.classList.remove('show');

    // Inicialmente não renderizamos a tabela até o login
});

// ---------------- LOGIN LOGIC ----------------
const formLogin = document.getElementById('formLogin');
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginError = document.getElementById('loginError');

formLogin.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === 'admin' && pass === 'admin') {
        efetuarLogin('admin');
    } else if (user === 'user' && pass === 'user') {
        efetuarLogin('user');
    } else {
        loginError.style.display = 'block';
    }
});

function efetuarLogin(role) {
    currentUserRole = role;
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    
    // Configurar a interface baseada na permissão
    if (role === 'user') {
        document.getElementById('btnNovoCadastro').style.display = 'none';
    } else {
        document.getElementById('btnNovoCadastro').style.display = 'flex';
    }

    // Limpar formulário de login
    formLogin.reset();
    loginError.style.display = 'none';

    renderizarTabela(inventario);
    atualizarGraficos(inventario);
}

// ---------------- THEME LOGIC ----------------
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
});

// Modal Configurações
const modalConfig = document.getElementById('modalConfig');
const closeConfig = document.getElementById('closeConfig');

// ---------------- EXPORT / PRINT LOGIC ----------------
document.getElementById('btnExportarPdf').addEventListener('click', () => {
    const dataAtual = new Date().toLocaleString('pt-BR');
    const printDateEl = document.getElementById('printDate');
    if (printDateEl) {
        printDateEl.textContent = `Gerado em: ${dataAtual}`;
    }
    window.print();
});

document.getElementById('btnConfig').addEventListener('click', (e) => {
    e.preventDefault();
    modalConfig.classList.add('show');
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
});

closeConfig.addEventListener('click', () => {
    modalConfig.classList.remove('show');
});

// ---------------- INVENTORY LOGIC ----------------

// Elementos do DOM
const tabelaInventario = document.getElementById('tabelaInventario');
const btnNovoCadastro = document.getElementById('btnNovoCadastro');
const modalCadastro = document.getElementById('modalCadastro');
const btnCancelar = document.getElementById('btnCancelar');
const closeBtn = document.querySelector('.close-modal');
const formCadastro = document.getElementById('formCadastro');
const filtroTipo = document.getElementById('filtroTipo');

// Elementos Mobile
const openSidebar = document.getElementById('openSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Função para verificar garantia
function verificarGarantia(dataAquisicao, mesesGarantia) {
    if (!dataAquisicao || !mesesGarantia) return 'normal';
    
    const aquisicao = new Date(dataAquisicao);
    const vencimento = new Date(aquisicao.setMonth(aquisicao.getMonth() + parseInt(mesesGarantia)));
    const hoje = new Date();
    
    const diffTime = vencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'danger'; // Venceu
    if (diffDays <= 30) return 'warning'; // Vence em 30 dias
    return 'success'; // Na garantia
}

// Função para formatar data
function formatarData(dataString) {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para renderizar a tabela
function renderizarTabela(dados) {
    tabelaInventario.innerHTML = '';
    
    atualizarCards();

    if (dados.length === 0) {
        tabelaInventario.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum equipamento encontrado.</td></tr>';
        return;
    }

    dados.forEach(item => {
        // Define a classe CSS do status
        let statusClass = '';
        switch(item.status) {
            case 'Em uso': statusClass = 'status-em-uso'; break;
            case 'Estoque': statusClass = 'status-estoque'; break;
            case 'Manutenção': statusClass = 'status-manutencao'; break;
            case 'Descarte': statusClass = 'status-descarte'; break;
        }

        const garantiaStatus = verificarGarantia(item.dataAquisicao, item.garantiaMeses);
        const tr = document.createElement('tr');
        
        if (garantiaStatus === 'danger') tr.classList.add('row-danger');
        else if (garantiaStatus === 'warning') tr.classList.add('row-warning');
        else if (garantiaStatus === 'success') tr.classList.add('row-success');

        tr.style.cursor = 'pointer';
        tr.onclick = function(e) {
            // Ignora o clique se for nos botões de ação
            if(e.target.closest('.action-btn')) return;
            toggleDetalhes(item.id);
        };

        let actionButtons = '';
        if (currentUserRole === 'admin') {
            actionButtons = `
                <button class="action-btn edit" title="Editar" onclick="editarEquipamento(${item.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" title="Excluir" onclick="excluirEquipamento(${item.id})"><i class="fa-solid fa-trash"></i></button>
            `;
        } else {
            actionButtons = `<span style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-lock"></i> Somente Leitura</span>`;
        }

        tr.innerHTML = `
            <td><strong>${item.patrimonio}</strong></td>
            <td>${item.tipo}</td>
            <td>${item.marcaModelo}</td>
            <td>${item.usuario !== '' ? item.usuario + ' / ' + item.setor : '-'}</td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            <td>${actionButtons}</td>
        `;
        tabelaInventario.appendChild(tr);

        // Linha de detalhes (expandível)
        const trDetalhes = document.createElement('tr');
        trDetalhes.id = `detalhes-${item.id}`;
        trDetalhes.className = 'detalhes-row';
        trDetalhes.style.display = 'none';
        
        // Monta HTML adicional (Garantia, QR Code, Observações)
        let hwHtml = '';
        if (item.processador || item.ram || item.armazenamento) {
            hwHtml = `
                <div class="detalhes-grid">
                    ${item.processador ? `<div class="detalhe-item"><span>Processador</span><div class="detalhe-valor">${item.processador}</div></div>` : ''}
                    ${item.ram ? `<div class="detalhe-item"><span>Memória RAM</span><div class="detalhe-valor">${item.ram}</div></div>` : ''}
                    ${item.armazenamento ? `<div class="detalhe-item"><span>Armazenamento</span><div class="detalhe-valor">${item.armazenamento}</div></div>` : ''}
                </div>
            `;
        }

        let garantiaText = '-';
        if (item.dataAquisicao && item.garantiaMeses) {
            const aq = new Date(item.dataAquisicao);
            const venc = new Date(aq.setMonth(aq.getMonth() + parseInt(item.garantiaMeses)));
            garantiaText = `${item.garantiaMeses} meses (Vence em: ${venc.toLocaleDateString('pt-BR')})`;
        }

        trDetalhes.innerHTML = `
            <td colspan="6" style="padding: 0; border: none;">
                <div class="detalhes-container">
                    <div style="flex: 2;">
                        ${hwHtml}
                        <div class="detalhes-grid" style="margin-top: 15px;">
                            <div class="detalhe-item"><span>Data Aquisição</span><div class="detalhe-valor">${formatarData(item.dataAquisicao)}</div></div>
                            <div class="detalhe-item"><span>Garantia</span><div class="detalhe-valor" style="color: ${garantiaStatus === 'danger' ? '#e74c3c' : (garantiaStatus === 'warning' ? '#f39c12' : (garantiaStatus === 'success' ? '#25d366' : 'var(--primary-dark)'))}">${garantiaText}</div></div>
                        </div>
                        ${item.observacoes ? `<div class="observacoes-box" style="margin-top: 15px;"><span>Histórico / Observações</span>${item.observacoes}</div>` : ''}
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; border-left: 1px solid var(--border-color); padding-left: 20px;">
                        <button class="btn-secondary" onclick="abrirModalEtiqueta('${item.patrimonio}', '${item.marcaModelo}')">
                            <i class="fa-solid fa-qrcode"></i> Gerar Etiqueta
                        </button>
                    </div>
                </div>
            </td>
        `;
        tabelaInventario.appendChild(trDetalhes);
    });
}

function toggleDetalhes(id) {
    const row = document.getElementById(`detalhes-${id}`);
    if (row) {
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    }
}

// Atualizar Contadores dos Cards
function atualizarCards() {
    const qtdNotebooks = inventario.filter(i => i.tipo === 'Notebook').length;
    const qtdCelulares = inventario.filter(i => i.tipo === 'Celular').length;
    const qtdPCs = inventario.filter(i => i.tipo === 'PC').length;
    const qtdMonitores = inventario.filter(i => i.tipo === 'Monitor').length;
    const qtdImpressoras = inventario.filter(i => i.tipo === 'Impressora').length;
    const qtdFerramentas = inventario.filter(i => i.tipo === 'Ferramenta').length;
    const qtdOutros = inventario.filter(i => i.tipo === 'Outros').length;

    document.querySelector('.card-notebook .stat-number').textContent = qtdNotebooks;
    document.querySelector('.card-celular .stat-number').textContent = qtdCelulares;
    document.querySelector('.card-pc .stat-number').textContent = qtdPCs;
    document.querySelector('.card-monitor .stat-number').textContent = qtdMonitores;
    document.querySelector('.card-impressora .stat-number').textContent = qtdImpressoras;
    document.querySelector('.card-ferramenta .stat-number').textContent = qtdFerramentas;
    document.querySelector('.card-outros .stat-number').textContent = qtdOutros;
}

// Exibir campos de hardware se for PC ou Notebook
const tipoEquipSelect = document.getElementById('tipoEquip');
const camposConfig = document.getElementById('camposConfig');

function toggleHardwareFields() {
    if (tipoEquipSelect.value === 'Notebook' || tipoEquipSelect.value === 'PC') {
        camposConfig.style.display = 'block';
    } else {
        camposConfig.style.display = 'none';
    }
}

tipoEquipSelect.addEventListener('change', toggleHardwareFields);

// Abrir e Fechar Modal
function toggleModal(isEdit = false) {
    modalCadastro.classList.toggle('show');
    if(!modalCadastro.classList.contains('show')){
        formCadastro.reset(); // Limpa o formulário ao fechar
        document.getElementById('equipId').value = '';
        camposConfig.style.display = 'none';
        document.querySelector('.modal-content h2').textContent = 'Cadastrar Novo Equipamento';
    } else {
        if (!isEdit) {
            document.querySelector('.modal-content h2').textContent = 'Cadastrar Novo Equipamento';
        }
    }
}

btnNovoCadastro.addEventListener('click', () => toggleModal(false));
closeBtn.addEventListener('click', toggleModal);
btnCancelar.addEventListener('click', toggleModal);

// Fechar modal clicando fora
window.addEventListener('click', (e) => {
    if (e.target === modalCadastro) {
        toggleModal();
    }
});

// Sidebar Mobile Logic
function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
}

openSidebar.addEventListener('click', toggleSidebar);
closeSidebar.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// Cadastrar / Editar Equipamento
formCadastro.addEventListener('submit', function(e) {
    e.preventDefault();

    const idInput = document.getElementById('equipId').value;
    const tipoValor = document.getElementById('tipoEquip').value;

    const equipamento = {
        tipo: tipoValor,
        patrimonio: document.getElementById('patrimonio').value,
        marcaModelo: document.getElementById('marcaModelo').value,
        sn: document.getElementById('sn').value,
        usuario: document.getElementById('usuario').value,
        setor: document.getElementById('setor').value,
        status: document.getElementById('status').value,
        processador: tipoValor === 'Notebook' || tipoValor === 'PC' ? document.getElementById('processador').value.trim() : '',
        ram: tipoValor === 'Notebook' || tipoValor === 'PC' ? document.getElementById('ram').value.trim() : '',
        armazenamento: tipoValor === 'Notebook' || tipoValor === 'PC' ? document.getElementById('armazenamento').value.trim() : '',
        dataAquisicao: document.getElementById('dataAquisicao').value,
        garantiaMeses: document.getElementById('garantiaMeses').value,
        observacoes: document.getElementById('observacoes').value.trim()
    };

    if (idInput) {
        // Modo Edição
        equipamento.id = parseInt(idInput);
        const index = inventario.findIndex(item => item.id === equipamento.id);
        if (index !== -1) {
            inventario[index] = equipamento;
        }
    } else {
        // Modo Cadastro
        equipamento.id = Date.now();
        inventario.push(equipamento);
    }

    renderizarTabela(inventario);
    atualizarGraficos(inventario);
    toggleModal();
});

// Excluir Equipamento
function excluirEquipamento(id) {
    if(confirm('Tem certeza que deseja excluir este equipamento?')) {
        inventario = inventario.filter(item => item.id !== id);
        renderizarTabela(inventario);
        atualizarGraficos(inventario);
    }
}

// Editar Equipamento
function editarEquipamento(id) {
    const equip = inventario.find(item => item.id === id);
    if (equip) {
        document.getElementById('equipId').value = equip.id;
        document.getElementById('tipoEquip').value = equip.tipo;
        document.getElementById('patrimonio').value = equip.patrimonio;
        document.getElementById('marcaModelo').value = equip.marcaModelo;
        document.getElementById('sn').value = equip.sn;
        document.getElementById('usuario').value = equip.usuario;
        document.getElementById('setor').value = equip.setor;
        document.getElementById('status').value = equip.status;

        document.getElementById('processador').value = equip.processador || '';
        document.getElementById('ram').value = equip.ram || '';
        document.getElementById('armazenamento').value = equip.armazenamento || '';
        document.getElementById('dataAquisicao').value = equip.dataAquisicao || '';
        document.getElementById('garantiaMeses').value = equip.garantiaMeses || '';
        document.getElementById('observacoes').value = equip.observacoes || '';
        
        toggleHardwareFields(); // Atualiza a visibilidade dos campos

        document.querySelector('.modal-content h2').textContent = 'Editar Equipamento';
        toggleModal(true);
    }
}

// Filtrar por Tipo na Tabela
filtroTipo.addEventListener('change', function() {
    const tipo = this.value;
    if (tipo === 'Todos') {
        renderizarTabela(inventario);
    } else {
        const filtrados = inventario.filter(item => item.tipo === tipo);
        renderizarTabela(filtrados);
    }
});

// Variáveis de Filtro Globais
let currentFiltroTipo = 'Todos';
let currentFiltroStatus = 'Todos';

function renderizarComFiltros() {
    let filtrados = inventario;

    // Filtro por Tipo
    if (currentFiltroTipo !== 'Todos') {
        filtrados = filtrados.filter(item => item.tipo === currentFiltroTipo);
    }

    // Filtro por Status
    if (currentFiltroStatus !== 'Todos') {
        filtrados = filtrados.filter(item => item.status === currentFiltroStatus);
    }

    // Filtro por Busca Escrita
    const termo = document.querySelector('.search-bar input').value.toLowerCase();
    if (termo) {
        filtrados = filtrados.filter(item => 
            item.patrimonio.toLowerCase().includes(termo) ||
            item.usuario.toLowerCase().includes(termo) ||
            item.marcaModelo.toLowerCase().includes(termo)
        );
    }

    renderizarTabela(filtrados);
    atualizarGraficos(filtrados);
}

// Busca simples
document.querySelector('.search-bar input').addEventListener('input', function() {
    renderizarComFiltros();
});

// Navegação pelo menu lateral (Filtro de Tipo)
const navItems = document.querySelectorAll('#navMenu li');

navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navItems.forEach(li => li.classList.remove('active'));
        this.classList.add('active');
        
        currentFiltroTipo = this.getAttribute('data-tipo');
        if (filtroTipo) filtroTipo.value = currentFiltroTipo;
        
        renderizarComFiltros();
        
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});

// Select de Tipo (Mobile)
if (filtroTipo) {
    filtroTipo.addEventListener('change', function() {
        currentFiltroTipo = this.value;
        navItems.forEach(li => {
            if (li.getAttribute('data-tipo') === currentFiltroTipo) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
        renderizarComFiltros();
    });
}

// Abas de Status
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        currentFiltroStatus = this.getAttribute('data-status');
        renderizarComFiltros();
    });
});

// ---------------- QR CODE LOGIC ----------------
const modalEtiqueta = document.getElementById('modalEtiqueta');
const closeEtiqueta = document.getElementById('closeEtiqueta');
let qrcodeInstance = null;

function abrirModalEtiqueta(patrimonio, modelo) {
    document.getElementById('etiquetaPatrimonio').textContent = patrimonio;
    document.getElementById('etiquetaModelo').textContent = modelo;
    
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    qrcodeInstance = new QRCode(qrContainer, {
        text: patrimonio,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    modalEtiqueta.classList.add('show');
}

closeEtiqueta.addEventListener('click', () => {
    modalEtiqueta.classList.remove('show');
});

function imprimirEtiqueta() {
    const printArea = document.getElementById('printEtiquetaArea').innerHTML;
    const originalBody = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
            <div style="border: 2px dashed #ccc; padding: 20px; border-radius: 8px; text-align:center;">
                ${printArea}
            </div>
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalBody;
    location.reload(); // Recarrega para restaurar eventos do JS perdidos ao sobrescrever body
}

document.getElementById('btnSair').addEventListener('click', (e) => {
    e.preventDefault();
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        currentUserRole = null;
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        // Limpar dados ou reiniciar estado
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        }
    }
});
