const { createClient } = supabase;
const supabaseUrl = 'https://seuprojeto.supabase.co';
const supabaseKey = 'sua-chave-publica-anonima';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const setor = document.getElementById('setor').value;
    
    try {
        // 1. Criar usuário no Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: {
                    nome: nome,
                    setor_id: setor
                }
            }
        });
        
        if (error) throw error;
        
        alert('Cadastro realizado! Verifique seu e-mail para confirmação.');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Erro ao cadastrar: ' + error.message);
    }
});