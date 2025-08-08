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
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados?select=*,setores(nome),status_chamado(nome)`, {
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

// Rota POST para salvar chamado - VERSÃO DEFINITIVA
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
    const { nome, setor, problema, prioridade, setor_id, status_id, interferencia } = req.body;
    
    console.log('📋 Dados recebidos:');
    console.log('  nome:', nome);
    console.log('  setor:', setor);
    console.log('  problema:', problema);
    console.log('  prioridade:', prioridade);
    console.log('  setor_id:', setor_id);
    console.log('  status_id:', status_id);
    console.log('  interferencia:', interferencia);
    
    // Validar campos obrigatórios
    if (!nome || !setor || !problema || !prioridade || !setor_id) {
      console.error('❌ Campos obrigatórios não preenchidos');
      return res.status(400).json({ 
        error: 'Campos obrigatórios não preenchidos',
        required: ['nome', 'setor', 'problema', 'prioridade', 'setor_id'],
        received: { nome, setor, problema, prioridade, setor_id }
      });
    }
    
    // Preparar objeto para inserção
    const chamadoParaInserir = {
      nome,
      setor,
      problema,
      prioridade,
      setor_id: parseInt(setor_id),
      created_at: new Date().toISOString()
    };
    
    // Adicionar campos opcionais se existirem
    if (status_id) chamadoParaInserir.status_id = status_id;
    if (interferencia) chamadoParaInserir.interferencia = interferencia;
    
    console.log('💾 Chamado para inserir:', JSON.stringify(chamadoParaInserir, null, 2));
    
    // Enviar para o Supabase
    console.log('🌐 Enviando requisição para o Supabase...');
    console.log('URL:', `${supabaseUrl}/rest/v1/Chamados`);
    
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
    
    console.log('📊 Status da resposta do Supabase:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📄 Resposta do Supabase:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Erro na resposta do Supabase');
      
      // Tratar diferentes tipos de erro
      if (data.code === '42501') {
        console.error('🚫 Erro de RLS (Row Level Security)');
        return res.status(403).json({ 
          error: 'Erro de permissão',
          details: 'Você não tem permissão para criar chamados. Verifique suas permissões de usuário.',
          supabase_error: data,
          suggestion: 'Verifique se seu usuário está com eh_admin=true ou tem setor_id válido'
        });
      }
      
      if (data.code === '23505') {
        console.error('🚫 Erro de chave única');
        return res.status(409).json({ 
          error: 'Chamado duplicado',
          details: 'Já existe um chamado com estas informações.',
          supabase_error: data
        });
      }
      
      if (data.code === '23503') {
        console.error('🚫 Erro de chave estrangeira');
        return res.status(400).json({ 
          error: 'Referência inválida',
          details: 'O setor_id informado não existe.',
          supabase_error: data
        });
      }
      
      // Erro genérico
      return res.status(500).json({ 
        error: 'Erro ao salvar chamado', 
        details: data,
        status: response.status,
        suggestion: 'Verifique os logs do servidor para mais detalhes'
      });
    }
    
    console.log('✅ Chamado salvo com sucesso!');
    
    res.status(201).json({ 
      message: 'Chamado salvo com sucesso!', 
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ === ERRO NO SERVIDOR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Mensagem:', err.message);
    console.error('Stack:', err.stack);
    
    res.status(500).json({ 
      error: 'Erro no servidor', 
      details: err.message,
      timestamp: new Date().toISOString(),
      stack: err.stack
    });
  }
});

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 === SERVIDOR INICIADO ===');
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log('🔑 Variáveis de ambiente:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ OK' : '❌ NÃO DEFINIDO'}`);
  console.log(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✅ OK' : '❌ NÃO DEFINIDO'}`);
  console.log('🛣️  Rotas disponíveis:');
  console.log(`   GET  /           - Página de status`);
  console.log(`   GET  /api/test   - Teste do servidor`);
  console.log(`   GET  /api/chamados - Listar chamados`);
  console.log(`   POST /api/chamados - Criar chamado`);
  console.log(`   GET  /health      - Health check`);
  console.log('====================================');
});