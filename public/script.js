function enviarChamado() {
    const nome = document.getElementById('txtname').value;
    const setor = document.getElementById('setor').value;
    const problema = document.getElementById('problema').value;
    const area = document.getElementById('área').value;
    
    if (!nome || !setor || !problema || !area) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const chamado = {
        nome: nome,
        setor: setor,
        problema: problema,
        prioridade: area
    };
    
    // URL CORRETA - Render
    fetch('https://helpdesklippel-1.onrender.com/api/chamados', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(chamado)
    })
    .then(response => {
        console.log('Status:', response.status);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta:', data);
        alert('Chamado enviado com sucesso!');
        document.getElementById('formulario').reset();
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar chamado: ' + error.message);
    });
}

