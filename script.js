async function enviarChamado() {
    const nome = document.getElementById('txtname').value;
    const setorSelect = document.getElementById('setor');
    const setorId = setorSelect.value; // Pega o ID (1, 2, 3, etc)
    const setorTexto = setorSelect.options[setorSelect.selectedIndex].text; // Pega o texto (PCP, TI, etc)
    const problema = document.getElementById('problema').value;
    const area = document.getElementById('área').value;
    
    if (!nome || !setorId || !problema || !area) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    console.log('Enviando chamado:', { nome, setorId, setorTexto, problema, area });
    
    const chamado = {
        nome: nome,
        setor: setorTexto,        // Nome do setor para compatibilidade
        setor_id: parseInt(setorId),  // ID do setor (novo campo)
        problema: problema,
        prioridade: area,          // Mapeando 'area' para 'prioridade'
        status_id: 1,             // Status inicial: "Recebido"
        interferencia: 'nenhuma'   // Valor padrão
    };
    
    try {
        // Verificar se o supabaseClient está disponível
        if (typeof window.supabaseClient === 'undefined') {
            throw new Error('Supabase client não está disponível. Recarregue a página.');
        }
        
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            alert('Você precisa estar logado para criar um chamado.');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Usuário autenticado:', user.email);
        
        // Enviar para o backend com token de autenticação
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }
        
        const response = await fetch('https://helpdesklippel-1.onrender.com/api/chamados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chamado)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao enviar chamado');
        }
        
        const data = await response.json();
        console.log('Resposta do servidor:', data);
        
        alert('Chamado enviado com sucesso!');
        document.getElementById('formulario').reset(); // limpa o formulário
        
        // Opcional: redirecionar para a lista de chamados
        // window.location.href = 'chamados.html';
        
    } catch (error) {
        console.error('Erro ao enviar chamado:', error);
        alert('Erro ao enviar chamado: ' + error.message);
    }
}