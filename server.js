const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }
    next();
});

// Rota de teste para verificar se o servidor está no ar
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Servidor está funcionando!',
        timestamp: new Date().toISOString(),
        env: {
            SUPABASE_URL: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
            SUPABASE_KEY: process.env.SUPABASE_KEY ? 'Configurado' : 'Não configurado'
        }
    });
});

// Rota POST para salvar chamado
app.post('/api/chamados', async (req, res) => {
    try {
        console.log('=== Nova requisição POST /api/chamados ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        
        // Verificar variáveis de ambiente
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        console.log('Variáveis de ambiente:');
        console.log('SUPABASE_URL:', supabaseUrl ? 'OK' : 'NÃO DEFINIDO');
        console.log('SUPABASE_KEY:', supabaseKey ? 'OK' : 'NÃO DEFINIDO');
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('Variáveis de ambiente não configuradas');
            return res.status(500).json({ 
                error: 'Configuração do servidor incompleta',
                details: 'Variáveis de ambiente não configuradas'
            });
        }
        
        const { nome, setor, problema, prioridade, setor_id, status_id, interferencia } = req.body;
        
        console.log('Dados do chamado:', { nome, setor, setor_id, status_id });
        
        // Montar objeto para inserção
        const chamadoParaInserir = {
            nome,
            setor,
            problema,
            prioridade,
            created_at: new Date().toISOString()
        };
        
        // Adicionar campos opcionais se existirem
        if (setor_id) chamadoParaInserir.setor_id = setor_id;
        if (status_id) chamadoParaInserir.status_id = status_id;
        if (interferencia) chamadoParaInserir.interferencia = interferencia;
        
        console.log('Chamado para inserir:', chamadoParaInserir);
        
        const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(chamadoParaInserir)
        });
        
        const data = await response.json();
        console.log('Resposta do Supabase:', response.status, data);
        
        if (!response.ok) {
            console.error('Erro do Supabase:', data);
            return res.status(500).json({ 
                error: 'Erro ao salvar chamado', 
                details: data,
                status: response.status
            });
        }
        
        res.status(201).json({ 
            message: 'Chamado salvo com sucesso!', 
            data,
            timestamp: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('=== ERRO NO SERVIDOR ===');
        console.error('Mensagem:', err.message);
        console.error('Stack:', err.stack);
        
        res.status(500).json({ 
            error: 'Erro no servidor', 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`=== SERVIDOR INICIADO ===`);
    console.log(`Porta: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Variáveis de ambiente:`);
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'OK' : 'NÃO DEFINIDO'}`);
    console.log(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? 'OK' : 'NÃO DEFINIDO'}`);
    console.log(`========================`);
});