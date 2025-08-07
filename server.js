const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware CORS COMPLETO
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400');
        return res.status(204).send();
    }
    
    next();
});

// Configurações do Supabase
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Rota POST para salvar chamado
app.post('/api/chamados', async (req, res) => {
    const { nome, setor, problema, prioridade } = req.body;
    try {
        console.log('Dados recebidos:', { nome, setor, problema, prioridade });
        
        const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: Date.now(),
                nome,
                setor,
                problema,
                prioridade
            })
        });
        
        const data = await response.json();
        console.log('Resposta do Supabase:', data);
        
        if (!response.ok) {
            return res.status(500).json({ error: 'Erro ao salvar chamado', details: data });
        }
        
        res.status(201).json({ message: 'Chamado salvo com sucesso!', data });
    } catch (err) {
        console.error('Erro no servidor:', err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Rota GET para buscar chamados
app.get('/api/chamados', async (req, res) => {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const data = await response.json();
        console.log('Chamados encontrados:', data);
        
        if (!response.ok) {
            return res.status(500).json({ error: 'Erro ao buscar chamados', details: data });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Erro no servidor:', err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});