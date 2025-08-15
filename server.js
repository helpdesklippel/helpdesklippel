const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Função auxiliar para criar um cliente Supabase no contexto do usuário
const createSupabaseClientForUser = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token não fornecido');
    }
    const token = authHeader.split(' ')[1];
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
};

// Rota GET para buscar chamados
app.get('/api/chamados', async (req, res) => {
  try {
    const supabase = createSupabaseClientForUser(req);
    const { data: chamados, error } = await supabase
        .from('Chamados')
        .select('*, setores(nome), status_chamado(nome), usuarios(nome)') // Adicionado usuarios(nome)
        .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(chamados);
  } catch (err) {
    res.status(401).json({ error: 'Erro de autenticação ou permissão', details: err.message });
  }
});

// Rota POST para criar chamado
app.post('/api/chamados', async (req, res) => {
  try {
    const supabase = createSupabaseClientForUser(req);
    const { nome, setor, problema, prioridade, interferencia, setor_id, status_id } = req.body;
    const { data, error } = await supabase.from('Chamados').insert([{ nome, setor, problema, prioridade, interferencia, setor_id, status_id }]).select();
    if (error) throw error;
    res.status(201).json({ message: 'Chamado criado com sucesso', data: data[0] });
  } catch(err) {
    res.status(401).json({ error: 'Erro de autenticação ou permissão ao criar chamado', details: err.message });
  }
});

// Rota PATCH para atualizar status
app.patch('/api/chamados/:id', async (req, res) => {
  try {
    const supabaseUserClient = createSupabaseClientForUser(req);
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Usuário não autenticado.' });

    const { data: perfil } = await supabaseUserClient.from('usuarios').select('eh_admin').eq('id', user.id).single();
    if (!perfil || !perfil.eh_admin) {
        return res.status(403).json({ error: 'Ação não permitida. Requer privilégios de administrador.' });
    }
    
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);
    const { id } = req.params;
    const { status_id } = req.body;
    const { data, error } = await supabaseAdmin.from('Chamados').update({ status_id: parseInt(status_id) }).eq('id', id).select();
    
    if (error) throw error;
    res.json({ message: 'Status atualizado com sucesso', data: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar status', details: err.message });
  }
});

// ==========================================================
// ROTA "KEEP-ALIVE" ADICIONADA
// ==========================================================
// Esta rota serve para ser chamada por um serviço externo (como o UptimeRobot)
// para impedir que o servidor do Render entre em modo de espera.
app.get('/api/ping', (req, res) => {
  console.log('Ping recebido! O servidor está acordado.');
  res.status(200).json({ message: 'pong' });
});
// ==========================================================


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});