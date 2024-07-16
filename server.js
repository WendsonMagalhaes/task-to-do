const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3055;

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('tasks.db');
const dbCards = new sqlite3.Database('cards.db');


// Criar tabela de cartões se não existir
db.serialize(() => {
    // Criar tabela de tarefas se não existir
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        task TEXT NOT NULL,
        priority INTEGER DEFAULT 3,heroku --version
        completed INTEGER DEFAULT 0
        
    )`);
});
dbCards.serialize(() => {
    dbCards.run(`CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL
    )`);
});


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para obter todos os cartões
app.get('/cards', (req, res) => {
    const sql = `SELECT id, title FROM cards`;

    dbCards.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ cards: rows });
    });
});

// Rota para adicionar um novo cartão
app.post('/cards', (req, res) => {
    const { title } = req.body;

    dbCards.run('INSERT INTO cards (title) VALUES (?)', [title], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            id: this.lastID,
            title
        });
    });
});

// Rota para excluir um cartão
app.delete('/cards/:id', (req, res) => {
    const { id } = req.params;

    dbCards.run('DELETE FROM cards WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deletedID: id });
    });
});
// Rota para obter todas as tarefas
app.get('/tasks', (req, res) => {
    db.all('SELECT id, task, date, priority, completed FROM tasks', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const tasks = rows.map(row => ({
            id: row.id,
            task: row.task,
            date: row.date, // Formata a data aqui conforme necessário
            priority: row.priority,
            completed: row.completed === 1 ? true : false // Converte para booleano se necessário
        }));
        res.json({ tasks });
    });
});



// Rota para adicionar uma nova tarefa
app.post('/tasks', (req, res) => {
    const { task, date,priority, completed } = req.body;

    // Validação se 'date' está no formato correto, como 'YYYY-MM-DD'
    // Inserir no banco de dados
    validateIfExistsNewTask(task, date, (err, exists) => {
        if (err) {
            console.error('Erro ao validar a existência da tarefa:', err);
            res.status(500).json({ error: 'Erro ao validar a existência da tarefa.' });
            return;
        }

        if (exists) {
            console.log('ERRO: Tarefa já existe.');
            res.status(400).json({ error: 'Tarefa já existe.' });
            return;
        }

        // Lógica para adicionar a tarefa se não existir
        console.log('Adicionando a nova tarefa...');
        db.run('INSERT INTO tasks (task, date,priority, completed) VALUES (?, ?, ?,?)', [task, date,priority, completed], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                task: task,
                date: date,
                priority: priority,
                completed: completed
            });
        });
    });
});


app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { completed } = req.body;

    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed, taskId], (err) => {
        if (err) {
            console.error('Erro ao atualizar tarefa:', err);
            res.status(500).json({ error: 'Erro ao atualizar tarefa' });
            return;
        }
        res.json({ message: `Tarefa ${taskId} atualizada com sucesso` });
    });
});

// Rota para obter eventos do calendário
app.get('/events', (req, res) => {
    // Lógica para obter eventos do calendário para o intervalo especificado
    // Exemplo de resposta com eventos
    const events = [
        {
            id: 1,
            title: 'Evento 1',
            start: '2024-07-06T10:00:00',
            end: '2024-07-06T12:00:00'
        },
        {
            id: 2,
            title: 'Evento 2',
            start: '2024-07-07T14:00:00',
            end: '2024-07-07T16:00:00'
        }
        // Adicione mais eventos conforme necessário
    ];

    // Envie os eventos como resposta
    res.json(events);
});





// Rota para excluir uma tarefa
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deletedID: id });
    });
});
// Função para verificar se uma tarefa com mesma task e data já existe no banco de dados
function validateIfExistsNewTask(task, date, callback) {
    // Consulta SQL para verificar se existe uma tarefa com a mesma task e date
    const sql = `SELECT COUNT(*) AS count FROM tasks WHERE task = ? AND date = ?`;
    
    db.get(sql, [task, date], (err, row) => {
        if (err) {
            console.error('Erro ao verificar a existência da tarefa:', err);
            callback(err, null);
        } else {
            const exists = row.count > 0;
            callback(null, exists);
        }
    });
}

// Inicia o servidor
app.listen(process.env.PORT || port, () => {
    console.log('SERVIDOR RODANDO')
});
