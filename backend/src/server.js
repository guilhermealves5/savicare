const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão com o XAMPP MySQL

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Necessário para o Render aceitar o certificado SSL do Aiven
    }
});

async function criarTabelas() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Usuario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'colaborador'
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS RegistroEmocional (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                emocao VARCHAR(50) NOT NULL,
                nota INT DEFAULT 3,
                comentario TEXT,
                data_registro DATETIME,
                FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE SET NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Clinica (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(150) NOT NULL,
                endereco VARCHAR(255) NOT NULL,
                cidade VARCHAR(100),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                telefone VARCHAR(30)
            );
        `);
        console.log("Tabelas verificadas/criadas com sucesso no Aiven!");
    } catch (erro) {
        console.error("Erro ao criar tabelas:", erro);
    }
}

// Chamar a função ao iniciar o servidor
criarTabelas();

// --- ROTA DE LOGIN CORRIGIDA ---
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [linhas] = await pool.execute(
            'SELECT id, nome, email, role FROM Usuario WHERE email = ? AND senha = ?',
            [email, senha]
        );

        if (linhas.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const usuario = linhas[0];
        
        // Garante que se o campo role estiver NULL no MySQL, assume 'empresa' ou 'colaborador'
        const roleDefinida = usuario.role ? usuario.role.toString().toLowerCase().trim() : 'empresa';

        res.json({
            message: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: roleDefinida
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE CADASTRO DE USUÁRIO ---
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, senha, role } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    try {
        // Verifica se o e-mail já existe
        const [existente] = await pool.execute('SELECT id FROM Usuario WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está registado.' });
        }

        const cargoFinal = role || 'colaborador';

        // Insere o novo utilizador na base de dados do Aiven
        const [resultado] = await pool.execute(
            'INSERT INTO Usuario (nome, email, senha, role) VALUES (?, ?, ?, ?)',
            [nome, email, senha, cargoFinal]
        );

        res.status(201).json({
            message: 'Utilizador criado com sucesso!',
            usuario: {
                id: resultado.insertId,
                nome,
                email,
                role: cargoFinal
            }
        });
    } catch (error) {
        console.error('Erro ao registar utilizador:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE MÉTRICAS DO DASHBOARD ---
app.get('/api/dashboard/metricas', async (req, res) => {
    try {
        const [rowsColab] = await pool.execute('SELECT COUNT(*) as total FROM Usuario WHERE role = "colaborador"');
        const colaboradoresAtivos = rowsColab[0].total || 0;

        const [registros] = await pool.execute('SELECT * FROM RegistroEmocional');
        const totalRegistros = registros.length;

        if (totalRegistros === 0) {
            return res.json({
                colaboradoresAtivos,
                totalRegistros: 0,
                porcentagemEquilibrio: 0,
                porcentagemAtencao: 0,
                porcentagemRisco: 0,
                historico: { labels: ['Hoje'], equilibrio: [0], atencao: [0], risco: [0] }
            });
        }

        let eq = 0, at = 0, ri = 0;

        registros.forEach(r => {
            const emocao = (r.emocao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            if (emocao.includes('feliz') || emocao.includes('tranquil')) {
                eq++;
            } else if (emocao.includes('ansios') || emocao.includes('irritad')) {
                at++;
            } else if (emocao.includes('estress') || emocao.includes('trist')) {
                ri++;
            } else {
                at++;
            }
        });

        const pctEq = Math.round((eq / totalRegistros) * 100);
        const pctAt = Math.round((at / totalRegistros) * 100);
        const pctRi = Math.round((ri / totalRegistros) * 100);

        res.json({
            colaboradoresAtivos,
            totalRegistros,
            porcentagemEquilibrio: pctEq,
            porcentagemAtencao: pctAt,
            porcentagemRisco: pctRi,
            historico: {
                labels: ['Início', 'Hoje'],
                equilibrio: [pctEq, pctEq],
                atencao: [pctAt, pctAt],
                risco: [pctRi, pctRi]
            }
        });
    } catch (error) {
        console.error("Erro ao calcular métricas:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
