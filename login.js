const { createClient } = supabase;
const supabaseUrl = 'https://seuprojeto.supabase.co';
const supabaseKey = 'sua-chave-publica-anonima';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: senha
        });
        
        if (error) throw error;
        
        // Salvar dados do usuário no localStorage
        localStorage.setItem('usuario', JSON.stringify(data.user));
        
        // Redirecionar para a página de chamados
        window.location.href = 'chamados.html';
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});