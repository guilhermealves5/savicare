const mysql = require('mysql2/promise');

async function criarTabelas() {
    try {
        // Conecta ao MySQL do XAMPP (porta 3306 padrão)
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        console.log('🔄 Criando banco de dados savicare_db...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS savicare_db;`);
        await connection.query(`USE savicare_db;`);

        console.log('🔄 Criando tabela Usuario...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Usuario (
                id VARCHAR(191) PRIMARY KEY,
                nome VARCHAR(191) NOT NULL,
                email VARCHAR(191) UNIQUE NOT NULL,
                senha VARCHAR(191) NOT NULL,
                role VARCHAR(191) DEFAULT 'colaborador',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('🔄 Criando tabela RegistroEmocional...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS RegistroEmocional (
                id VARCHAR(191) PRIMARY KEY,
                emocao VARCHAR(191) NOT NULL,
                intensidade INT NOT NULL,
                observacao TEXT,
                usuarioId VARCHAR(191) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuarioId) REFERENCES Usuario(id) ON DELETE CASCADE
            );
        `);

        console.log('🔄 Criando tabela Clinica...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Clinica (
                id VARCHAR(191) PRIMARY KEY,
                nome VARCHAR(191) NOT NULL,
                nota VARCHAR(191),
                distancia VARCHAR(191),
                especialidades VARCHAR(191),
                endereco VARCHAR(191),
                telefone VARCHAR(191)
            );
        `);

        console.log('✅ Banco de dados e tabelas criados com sucesso!');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro ao criar banco:', error.message);
    }
}

criarTabelas();