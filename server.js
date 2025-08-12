const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware CORS - CONFIGURAÇÃO COMPLETA E ROBUSTA
app.use((req, res, next) => {
  // Permitir qualquer origem
  res.header('Access-Control-Allow-Origin', '*');
  
  // Permitir métodos específicos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Permitir cabeçalhos específicos
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Definir tempo de cache para preflight requests
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    return res.status(204).send();
  }
  
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.send(`
    <h1>API de Chamados LIPPEL</h1>
    <h2>Status: Online ✅</h2>
    <p>Rotas disponíveis:</p>
    <ul>
      <li><strong>GET</strong> <a href="/api/test">/api/test</a> - Teste do servidor</li>
      <li><strong>GET</strong> <a href="/api/chamados">/api/chamados</a> - Listar chamados</li>
      <li><strong>POST</strong> /api/chamados - Criar chamado</li>
      <li><strong>POST</strong> /api/chamados/:id/status - Atualizar status do chamado</li>
    </ul>
    <p><em>Servidor rodando na porta: ${PORT}</em></p>
  `);
});

// Rota de teste
app.get('/api/test', (req, res) => {
  console.log('🔍 Rota /api/test acessada');
  res.json({ 
    message: '✅ Servidor está funcionando!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? '✅ Configurado' : '❌ Não configurado'
    }
  });
});

// Rota GET para buscar chamados
app.get('/api/chamados', async (req, res) => {
  try {
    console.log('🔍 Buscando chamados...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: '❌ Variáveis de ambiente não configuradas' });
    }
    
    // Obter token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    
    // Verificar token e obter dados do usuário
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Obter informações do usuário (setor e permissões)
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('setor_id, eh_admin')
      .eq('id', user.id)
      .single();
      
    if (userError || !usuario) {
      return res.status(404).json({ error: 'Dados do usuário não encontrados' });
    }
    
    // Construir query base
    let query = `${supabaseUrl}/rest/v1/Chamados?select=*,setores(nome),status_chamado(nome)`;
    
    // Se não for admin, filtrar por setor
    if (!usuario.eh_admin) {
      query += `&setor_id=eq.${usuario.setor_id}`;
    }
    
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const data = await response.json();
    console.log('📊 Resposta do Supabase:', response.status, data);
    
    if (!response.ok) {
      return res.status(500).json({ 
        error: '❌ Erro ao buscar chamados', 
        details: data,
        status: response.status 
      });
    }
    
    res.json(data);
  } catch (err) {
    console.error('❌ Erro ao buscar chamados:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

// Rota POST para salvar chamado
app.post('/api/chamados', async (req, res) => {
  try {
    console.log('=== INÍCIO DA REQUISIÇÃO POST /api/chamados ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    console.log('🔑 Variáveis de ambiente:');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
    console.log('SUPABASE_KEY:', supabaseKey ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: 'Variáveis de ambiente não configuradas'
      });
    }
    
    // Extrair dados do body
    const { nome, setor, problema, prioridade, interferencia, setor_id, status_id } = req.body;
    
    console.log('📋 Dados recebidos:');
    console.log('  nome:', nome);
    console.log('  setor:', setor);
    console.log('  problema:', problema);
    console.log('  prioridade:', prioridade);
    console.log('  interferencia:', interferencia);
    console.log('  setor_id:', setor_id);
    console.log('  status_id:', status_id);
    
    // Validar campos obrigatórios
    if (!nome || !setor || !problema || !prioridade || !interferencia || !setor_id || !status_id) {
      console.error('❌ Campos obrigatórios não preenchidos');
      return res.status(400).json({ 
        error: 'Campos obrigatórios não preenchidos',
        required: ['nome', 'setor', 'problema', 'prioridade', 'interferencia', 'setor_id', 'status_id'],
        received: { nome, setor, problema, prioridade, interferencia, setor_id, status_id }
      });
    }
    
    // Inserir chamado no Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        nome,
        setor,
        problema,
        prioridade,
        interferencia,
        setor_id: parseInt(setor_id),
        status_id: parseInt(status_id)
      })
    });
    
    const data = await response.json();
    console.log('📊 Resposta do Supabase:', response.status, data);
    
    if (!response.ok) {
      return res.status(500).json({ 
        error: '❌ Erro ao criar chamado', 
        details: data,
        status: response.status 
      });
    }
    
    res.status(201).json({
      message: '✅ Chamado criado com sucesso',
      data: data[0] || data
    });
  } catch (err) {
    console.error('❌ Erro ao criar chamado:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

// Rota POST para atualizar status do chamado (alternativa ao PATCH)
app.post('/api/chamados/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id } = req.body;
    
    console.log('=== INÍCIO DA REQUISIÇÃO POST /api/chamados/:id/status ===');
    console.log('ID do chamado:', id);
    console.log('Novo status:', status_id);
    
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: '❌ Variáveis de ambiente não configuradas' });
    }
    
    // Obter token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    
    // Verificar token e obter dados do usuário
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Verificar se o usuário é admin
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('eh_admin')
      .eq('id', user.id)
      .single();
      
    if (userError || !usuario || !usuario.eh_admin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Atualizar status do chamado
    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status_id })
    });
    
    const data = await response.json();
    console.log('📊 Resposta do Supabase:', response.status, data);
    
    if (!response.ok) {
      return res.status(500).json({ 
        error: '❌ Erro ao atualizar status', 
        details: data,
        status: response.status 
      });
    }
    
    res.json({ message: 'Status atualizado com sucesso', data });
  } catch (err) {
    console.error('❌ Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});