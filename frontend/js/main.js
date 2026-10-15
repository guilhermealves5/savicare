/* ==========================================================================
   CONFIGURAÇÕES GLOBAIS E ENDPOINT DA API
   ========================================================================== */
const API_URL = 'http://localhost:3000/api';

/* ==========================================================================
   NAVBAR & MENU MOBILE
   ========================================================================== */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

/* ==========================================================================
   AUTENTICAÇÃO (pages/login.html)
   ========================================================================== */

// Alternar entre as abas de Entrar e Criar Conta
function alternarAba(aba) {
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    const btnLogin = document.getElementById('btn-login');
    const btnCadastro = document.getElementById('btn-cadastro');

    if (!formLogin || !formCadastro) return;

    if (aba === 'login') {
        formLogin.classList.remove('hidden');
        formCadastro.classList.add('hidden');

        if (btnLogin) btnLogin.className = "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-emerald-600 shadow-sm";
        if (btnCadastro) btnCadastro.className = "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:text-slate-800";
    } else {
        formLogin.classList.add('hidden');
        formCadastro.classList.remove('hidden');

        if (btnCadastro) btnCadastro.className = "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-emerald-600 shadow-sm";
        if (btnLogin) btnLogin.className = "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:text-slate-800";
    }
}

// Variável para armazenar o perfil selecionado no cadastro
let perfilSelecionado = 'colaborador';

function selecionarPerfil(perfil) {
    const btnColab = document.getElementById('perfil-colaborador');
    const btnEmpresa = document.getElementById('perfil-empresa');

    perfilSelecionado = perfil;

    if (!btnColab || !btnEmpresa) return;

    if (perfil === 'colaborador') {
        btnColab.className = "py-2.5 px-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2";
        btnEmpresa.className = "py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-2";
    } else {
        btnEmpresa.className = "py-2.5 px-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2";
        btnColab.className = "py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-2";
    }
}

// Comunicação com a API: Fazer Login
async function fazerLoginAPI(email, senha) {
    try {
        const resposta = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // Salva dados da sessão do usuário
            localStorage.setItem('usuarioId', dados.usuario.id);
            localStorage.setItem('usuarioNome', dados.usuario.nome);
            localStorage.setItem('usuarioRole', dados.usuario.role);
            
            alert('Login realizado com sucesso!');
            window.location.href = '../index.html';
        } else {
            alert(dados.error || 'Falha ao autenticar.');
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
        alert('Servidor indisponível no momento.');
    }
}

// Comunicação com a API: Cadastrar Novo Usuário
async function cadastrarUsuarioAPI(nome, email, senha) {
    try {
        const resposta = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome,
                email,
                senha,
                role: perfilSelecionado
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Conta criada com sucesso! Faça login para continuar.');
            alternarAba('login');
        } else {
            alert(dados.error || 'Erro ao criar conta.');
        }
    } catch (error) {
        console.error('Erro na requisição de cadastro:', error);
        alert('Servidor indisponível no momento.');
    }
}

/* ==========================================================================
   REGISTRO EMOCIONAL (pages/registro.html)
   ========================================================================== */

let emocaoSelecionada = null;

function selecionarEmocao(btn, emocao) {
    document.querySelectorAll('.btn-emocao').forEach(b => {
        b.className = "btn-emocao flex flex-col items-center p-3 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition group";
    });

    btn.className = "btn-emocao flex flex-col items-center p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 shadow-md transition group";
    emocaoSelecionada = emocao;
}

function atualizarIntensidade(valor) {
    const elementoValor = document.getElementById('valor-intensidade');
    if (elementoValor) {
        elementoValor.innerText = `${valor} / 10`;
    }
}

function atualizarContador(textarea) {
    const contador = document.getElementById('contador-char');
    if (contador) {
        contador.innerText = textarea.value.length;
    }
}

// Comunicação com a API: Salvar Registro Emocional
async function salvarRegistro() {
    if (!emocaoSelecionada) {
        alert('Por favor, selecione como você está se sentindo.');
        return;
    }

    const intensidade = document.getElementById('range-intensidade').value;
    const observacao = document.getElementById('texto-observacao').value;
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        alert('Você precisa estar logado para enviar um registro.');
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emocao: emocaoSelecionada,
                intensidade: Number(intensidade),
                observacao: observacao,
                usuarioId: usuarioId
            })
        });

        if (resposta.ok) {
            const alerta = document.getElementById('alerta-sucesso');
            if (alerta) {
                alerta.classList.remove('hidden');
                setTimeout(() => alerta.classList.add('hidden'), 4000);
            }
        } else {
            alert('Erro ao salvar o registro no banco de dados.');
        }
    } catch (error) {
        console.error('Erro na conexão com a API de registros:', error);
        alert('Não foi possível conectar ao servidor.');
    }
}

/* ==========================================================================
   MAPA DE CLÍNICAS (pages/mapa.html)
   ========================================================================== */

// Carregar Clínicas do Banco de Dados via API
async function carregarClinicasAPI() {
    try {
        const resposta = await fetch(`${API_URL}/clinicas`);
        if (resposta.ok) {
            const clinicas = await resposta.json();
            return clinicas;
        }
    } catch (error) {
        console.error('Erro ao buscar clínicas da API:', error);
    }
    return [];
}

/* ==========================================================================
   DASHBOARD EMPRESARIAL (pages/dashboard.html)
   ========================================================================== */

// Carregar Métricas do Dashboard via API
async function carregarMetricasDashboard() {
    try {
        const resposta = await fetch(`${API_URL}/dashboard/metricas`);
        if (resposta.ok) {
            const metricas = await resposta.json();
            
            // Atualiza os indicadores na tela
            const elAtivos = document.getElementById('kpi-colaboradores');
            if (elAtivos) elAtivos.innerText = metricas.colaboradoresAtivos;
        }
    } catch (error) {
        console.error('Erro ao carregar métricas do dashboard:', error);
    }
}
/* ==========================================================================
   GESTÃO DE SESSÃO E NAVBAR DINÂMICA
   ========================================================================== */
function verificarSessao() {
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioNome = localStorage.getItem('usuarioNome');
    const usuarioRole = (localStorage.getItem('usuarioRole') || '').toLowerCase().trim();

    // Mostrar/Ocultar links e cards do Dashboard Empresarial mantendo a estrutura Flexbox
    const linksDashboard = document.querySelectorAll('a[href*="dashboard.html"]');
    linksDashboard.forEach(link => {
        if (usuarioRole === 'empresa' || usuarioRole === 'admin' || usuarioRole === 'gestor') {
            // FORÇA 'flex' PARA NÃO QUEBRAR O LAYOUT HORIZONTAL
            link.style.display = 'flex'; 
        } else {
            link.style.display = 'none'; // Esconde para colaboradores ou não logados
        }
    });

    // Atualizar área do usuário na Navbar
    const navBotoesDesktop = document.querySelector('header .hidden.md\\:flex.items-center.gap-3');

    if (usuarioId && usuarioNome && navBotoesDesktop) {
        const iniciais = usuarioNome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        navBotoesDesktop.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-700 text-xs shadow-sm">
                        ${iniciais}
                    </div>
                    <span class="text-xs font-bold text-slate-700 hidden lg:inline">${usuarioNome}</span>
                </div>
                <button onclick="fazerLogout()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition border border-slate-200">
                    Sair
                </button>
            </div>
        `;
    }
}

function fazerLogout() {
    localStorage.clear();
    window.location.href = window.location.pathname.includes('pages') ? '../index.html' : 'index.html';
}

document.addEventListener('DOMContentLoaded', verificarSessao);