const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir JSON
app.use(express.json());

// Middleware CORS - ESSENCIAL!
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Servir arquivos estáticos da pasta /public
app.use(express.static(path.join(__dirname, 'public')));

// Configurações do Supabase
const supabaseUrl = 'https://izkkozkulgjpejyvcmiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvemt1bGdqcGVqeXZjbWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODcwNzYsImV4cCI6MjA3MDA2MzA3Nn0.oyLHuA3n3ZlMuHWaMF4OEbSWMmhIYzeIE7LuFJFY7MA';

// Rota POST para salvar chamado
app.post('/api/chamados', async (req, res) => {
  const { nome, setor, problema, prioridade } = req.body;

  try {
    console.log('Dados recebidos:', { nome, setor, problema, prioridade });

    // Gerar um ID simples
    const id = Date.now();

    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id,
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
  console.log(`Servidor rodando na porta ${PORT}`);
});
