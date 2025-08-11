// ROTA GET para buscar chamados
app.get('/api/chamados', async (req, res) => {
  try {
    console.log('🔍 Buscando chamados...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: '❌ Variáveis de ambiente não configuradas' });
    }
    
    // Extrair token do header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Buscar chamados com JOIN para setores e status
    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados?select=*,setores(nome),status_chamado(nome)&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
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

// ROTA POST PARA SALVAR CHAMADO - VERSÃO CORRIGIDA
app.post('/api/chamados', async (req, res) => {
  try {
    console.log('=== INÍCIO DA REQUISIÇÃO POST /api/chamados ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: 'Variáveis de ambiente não configuradas'
      });
    }
    
    // EXTRAIR TOKEN DO HEADER
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('❌ Token não fornecido no header Authorization');
      return res.status(401).json({ 
        error: 'Token não fornecido',
        details: 'O header Authorization está ausente ou mal formatado'
      });
    }
    
    console.log('✅ Token recebido (primeiros 20 chars):', token.substring(0, 20) + '...');
    
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
    
    // Preparar objeto para inserção - VERSÃO CORRIGIDA
    const chamadoParaInserir = {
      nome,
      setor,
      problema,
      prioridade,
      setor_id: parseInt(setor_id),
      status_id: status_id ? parseInt(status_id) : null, // Garante conversão para número
      interferencia: interferencia || null, // Garante que seja enviado mesmo que vazio
      created_at: new Date().toISOString()
    };
    
    console.log('💾 Chamado para inserir:', JSON.stringify(chamadoParaInserir, null, 2));
    
    // ENVIAR PARA O SUPABASE
    console.log('🌐 Enviando requisição para o Supabase...');
    console.log('URL:', `${supabaseUrl}/rest/v1/Chamados`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Chamados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(chamadoParaInserir)
    });
    
    console.log('📊 Status da resposta do Supabase:', response.status);
    
    const data = await response.json();
    console.log('📄 Resposta do Supabase:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Erro na resposta do Supabase');
      
      // Tratar diferentes tipos de erro
      if (data.code === '42501') {
        return res.status(403).json({ 
          error: 'Erro de permissão',
          details: 'Você não tem permissão para criar chamados.',
          supabase_error: data
        });
      }
      
      if (data.code === '23505') {
        return res.status(409).json({ 
          error: 'Chamado duplicado',
          details: 'Já existe um chamado com estas informações.',
          supabase_error: data
        });
      }
      
      if (data.code === '23503') {
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
        status: response.status
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