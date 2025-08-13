const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware CORS - Versão Final e Correta
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.send('<h1>API de Chamados LIPPEL - Status: Online ✅</h1>');
});

// Rota GET para buscar chamados - Versão Final com SDK
app.get('/api/chamados', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Usuário não autenticado ou token inválido' });
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('setor_id, eh_admin')
      .eq('id', user.id)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({ error: 'Dados do usuário não encontrados' });
    }

    let query = supabase
      .from('Chamados')
      .select('*, setores(nome), status_chamado(nome)')
      .order('created_at', { ascending: false });

    // Lógica de filtragem
    if (!usuario.eh_admin) {
      console.log(`[FILTRO ATIVADO] Buscando chamados apenas para o setor_id: ${usuario.setor_id}`);
      query = query.eq('setor_id', usuario.setor_id);
    }

    const { data: chamados, error: chamadosError } = await query;
    if (chamadosError) {
      return res.status(500).json({ error: 'Erro ao buscar chamados', details: chamadosError.message });
    }

    res.json(chamados);

  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor', details: err.message });
  }
});

// Rota POST para criar chamado - Versão Final com SDK
app.post('/api/chamados', async (req, res) => {
  try {
    const { nome, setor, problema, prioridade, interferencia, setor_id, status_id } = req.body;
    if (!nome || !setor || !problema || !prioridade || !interferencia || !setor_id || !status_id) {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data, error } = await supabase.from('Chamados')
      .insert([{ nome, setor, problema, prioridade, interferencia, setor_id: parseInt(setor_id), status_id: parseInt(status_id) }])
      .select();
    if (error) { return res.status(500).json({ error: 'Erro ao criar chamado', details: error }); }
    res.status(201).json({ message: 'Chamado criado com sucesso', data: data[0] });
  } catch(err) {
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

// Rota PATCH para atualizar status - Versão Final e Correta
app.patch('/api/chamados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id } = req.body;
    if (!status_id) {
        return res.status(400).json({ error: 'O campo status_id é obrigatório.' });
    }
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Validação de permissão de admin
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Acesso negado' });
    
    const { data: usuario, error: userError } = await supabase.from('usuarios').select('eh_admin').eq('id', user.id).single();
    if (userError || !usuario.eh_admin) {
        return res.status(403).json({ error: 'Ação não permitida. Requer privilégios de administrador.' });
    }

    // Atualização no banco
    const { data, error } = await supabase
        .from('Chamados')
        .update({ status_id: parseInt(status_id) })
        .eq('id', id)
        .select();

    if (error) {
        return res.status(500).json({ error: 'Erro ao atualizar o status do chamado', details: error });
    }
    if (data.length === 0) {
        return res.status(404).json({ error: `Chamado com ID ${id} não encontrado.` });
    }

    res.json({ message: 'Status atualizado com sucesso', data: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});