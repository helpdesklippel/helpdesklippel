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

// Rota POST para salvar chamado com debug detalhado
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
    
    // Adicionar campos opcionais
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

// Manter as outras rotas existentes...

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
});