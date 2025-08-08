// Rota POST para salvar chamado - VERSÃO CORRIGIDA
app.post('/api/chamados', async (req, res) => {
    try {
        console.log('📝 === Nova requisição POST /api/chamados ===');
        console.log('📋 Headers:', req.headers);
        console.log('📋 Body:', req.body);
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        console.log('🔑 Variáveis de ambiente:');
        console.log('SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ NÃO DEFINIDO');
        console.log('SUPABASE_KEY:', supabaseKey ? '✅ OK' : '❌ NÃO DEFINIDO');
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Variáveis de ambiente não configuradas');
            return res.status(500).json({ 
                error: '❌ Configuração do servidor incompleta',
                details: 'Variáveis de ambiente não configuradas'
            });
        }
        
        const { nome, setor, problema, prioridade, setor_id, status_id, interferencia } = req.body;
        
        console.log('📝 Dados do chamado:', { nome, setor, setor_id, status_id });
        
        // Garantir que temos o setor_id
        if (!setor_id) {
            return res.status(400).json({ 
                error: '❌ setor_id é obrigatório',
                details: 'O campo setor_id é obrigatório para criar um chamado'
            });
        }
        
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
        
        console.log('💾 Chamado para inserir:', chamadoParaInserir);
        
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
        console.log('📤 Resposta do Supabase:', response.status, data);
        
        if (!response.ok) {
            console.error('❌ Erro do Supabase:', data);
            
            // Tratar erros específicos de RLS
            if (data.code === '42501') {
                return res.status(403).json({ 
                    error: '❌ Erro de permissão',
                    details: 'Você não tem permissão para criar chamados. Verifique suas permissões de usuário.',
                    supabase_error: data
                });
            }
            
            return res.status(500).json({ 
                error: '❌ Erro ao salvar chamado', 
                details: data,
                status: response.status 
            });
        }
        
        res.status(201).json({ 
            message: '✅ Chamado salvo com sucesso!', 
            data,
            timestamp: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('❌ === ERRO NO SERVIDOR ===');
        console.error('❌ Mensagem:', err.message);
        console.error('❌ Stack:', err.stack);
        
        res.status(500).json({ 
            error: '❌ Erro no servidor', 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});