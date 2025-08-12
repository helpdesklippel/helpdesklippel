async function enviarChamado() {
    console.log('=== INÍCIO DO ENVIO DE CHAMADO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const nome = document.getElementById('txtname').value;
    const setorSelect = document.getElementById('setor');
    const setorId = setorSelect.value;
    const setorTexto = setorSelect.options[setorSelect.selectedIndex].text;
    const problema = document.getElementById('problema').value;
    const area = document.getElementById('área').value;
    const prioridade = document.getElementById('prioridade').value;
    const interferencia = document.getElementById('interferencia').value;
    
    console.log('📋 Dados do formulário:');
    console.log('  nome:', nome);
    console.log('  setorId:', setorId);
    console.log('  setorTexto:', setorTexto);
    console.log('  problema:', problema);
    console.log('  area:', area);
    console.log('  prioridade:', prioridade);
    console.log('  interferencia:', interferencia);
    
    if (!nome || !setorId || !problema || !area || !prioridade || !interferencia) {
      console.error('❌ Campos obrigatórios não preenchidos');
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    const chamado = {
        nome: nome,
        setor: setorTexto,
        problema: problema,
        prioridade: prioridade,
        interferencia: interferencia,
        setor_id: parseInt(setorId),
        status_id: 1, // Status inicial: "Recebido"
    };
    
    console.log('💾 Chamado a ser enviado:', JSON.stringify(chamado, null, 2));
    
    try {
        // Verificar se o supabaseClient está disponível
        if (typeof window.supabaseClient === 'undefined') {
            throw new Error('Supabase client não está disponível. Recarregue a página.');
        }
        
        console.log('🔍 Verificando autenticação...');
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            console.error('❌ Usuário não autenticado');
            alert('Você precisa estar logado para criar um chamado.');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('✅ Usuário autenticado:', user.email);
        
        // Obter token
        console.log('🔑 Obtendo token de sessão...');
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
            console.error('❌ Token não disponível');
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('✅ Token obtido, tamanho:', token?.length || 0);
        
        // Enviar requisição
        console.log('🌐 Enviando requisição para o backend...');
        console.log('URL: https://helpdesklippel-1.onrender.com/api/chamados');
        
        const response = await fetch('https://helpdesklippel-1.onrender.com/api/chamados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chamado)
        });
        
        console.log('📊 Status da resposta:', response.status);
        console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erro na resposta:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.error || 'Erro ao enviar chamado');
        }
        
        const data = await response.json();
        console.log('✅ Resposta do servidor:', JSON.stringify(data, null, 2));
        
        alert('Chamado enviado com sucesso!');
        document.getElementById('formulario').reset();
        
        // Opcional: redirecionar para a lista de chamados
        // window.location.href = 'chamados.html';
        
    } catch (error) {
        console.error('❌ Erro ao enviar chamado:', error);
        console.error('Stack:', error.stack);
        alert('Erro ao enviar chamado: ' + error.message);
    }
    
    console.log('=== FIM DO ENVIO DE CHAMADO ===');
}