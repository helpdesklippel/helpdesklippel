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

    fetch('/api/chamados', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(chamado)
    })
    .then(response => response.json())
    .then(data => {
        alert('Chamado enviado com sucesso!');
        document.getElementById('formulario').reset();
    })
    .catch(error => {
        console.error('Erro ao enviar chamado:', error);
        alert('Erro ao enviar chamado. Verifique se o servidor está online.');
    });
}

