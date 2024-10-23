// Configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBq50uNgIdie6FjmDCnVejKzAzUtNBkqC0",
    authDomain: "organograma-56a58.firebaseapp.com",
    projectId: "organograma-56a58",
    storageBucket: "organograma-56a58.appspot.com",
    messagingSenderId: "279150438139",
    appId: "1:279150438139:web:4f3b28559238aa3029b25e",
    measurementId: "G-87Q7G72S9H"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let squads = {};
let modoEdicao = false;
let editSquadIndex = null;
let editCardIndex = null;

// Carregar squads do Firebase ao iniciar
document.addEventListener("DOMContentLoaded", () => {
    // criarBotaoAdicionarSquad();
    carregarSquads();
});

// Função para alternar o modo de edição
function alternarModoEdicao() {
    modoEdicao = !modoEdicao;
    const lockButton = document.getElementById('lock-button');
    lockButton.textContent = modoEdicao ? '🔓' : '🔒';

    const squadHeaders = document.querySelectorAll('.squad-header');
    squadHeaders.forEach(header => {
        if (modoEdicao) {
            header.classList.remove('locked');
        } else {
            header.classList.add('locked');
        }
    });

    const buttons = document.querySelectorAll('.squad-header button, .card button');
    buttons.forEach(button => {
        button.style.display = modoEdicao ? 'inline-block' : 'none';
    });

    const squadNames = document.querySelectorAll('.squad-header .squad-name');
    squadNames.forEach(name => {
        name.style.display = modoEdicao ? 'none' : 'block';
    });

    const squadInputs = document.querySelectorAll('.squad-header input[type="text"]');
    squadInputs.forEach(input => {
        input.style.display = modoEdicao ? 'block' : 'none';
    });

    const addSquadButton = document.getElementById('add-squad-button');
    addSquadButton.style.display = modoEdicao ? 'inline-block' : 'none';
}

// Função para colar uma imagem da área de transferência
function colarImagem(event) {
    const clipboardItems = event.clipboardData.items;
    for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewContainer = document.getElementById('preview-container');
                previewContainer.style.backgroundImage = `url(${e.target.result})`;
                previewContainer.setAttribute('data-image', e.target.result); // Salva a imagem como base64
                previewContainer.textContent = '';
                previewContainer.style.backgroundSize = 'cover';
                previewContainer.style.backgroundPosition = 'center';
            };
            reader.readAsDataURL(file);
        }
    }
}

// Função para visualizar a imagem antes de salvar
function previewImagem(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewContainer = document.getElementById('preview-container');
            previewContainer.style.backgroundImage = `url(${e.target.result})`;
            previewContainer.setAttribute('data-image', e.target.result); // Salva a imagem como base64
            previewContainer.textContent = '';
            previewContainer.style.backgroundSize = 'cover';
            previewContainer.style.backgroundPosition = 'center';
        };
        reader.readAsDataURL(file);
    }
}

// Função para carregar squads do Firebase
function carregarSquads() {
    const squadsRef = database.ref('squads');
    squadsRef.on('value', (snapshot) => {
        squads = snapshot.val() || {};
        renderizarSquads();
    });
}

// Função para renderizar squads na tela
function renderizarSquads() {
    const container = document.getElementById('squads-container');
    container.innerHTML = '';

    Object.keys(squads).forEach((squadId) => {
        const squadDiv = criarSquadDiv(squads[squadId], `squads/${squadId}`);
        container.appendChild(squadDiv);
    });
}

// Função para criar o botão de adicionar squads
function criarBotaoAdicionarSquad() {
    const container = document.getElementById('squads-container');
    const addSquadButton = document.createElement('button');
    addSquadButton.id = 'add-squad-button';
    addSquadButton.textContent = 'Adicionar Squad';
    addSquadButton.onclick = () => criarSquad();
    container.prepend(addSquadButton);
}

// Função para criar um novo squad
function criarSquad(parentSquadPath = null) {
    if (!modoEdicao) return;

    const nome = prompt("Nome do Squad:");
    if (nome) {
        const novoSquad = {
            nome,
            squads: {},
            cards: {},
            color: '#ffffff',
            layout: 'horizontal'
        };

        const squadsRef = parentSquadPath ? database.ref(`${parentSquadPath}/squads`) : database.ref('squads');
        squadsRef.push(novoSquad);
    }
}

// Função para criar a div do squad
function criarSquadDiv(squad, squadPath) {
    const squadDiv = document.createElement('div');
    squadDiv.className = 'squad';
    squadDiv.setAttribute('data-squad-path', squadPath);
    squadDiv.style.backgroundColor = squad.color || '#ffffff';

    const layoutAtual = squad.layout || 'horizontal';
    const layoutTexto = layoutAtual === 'horizontal' ? 'Vertical' : 'Horizontal';

    squadDiv.innerHTML = `
        <div class="squad-header ${modoEdicao ? '' : 'locked'}">
            <span class="squad-name" style="display: ${modoEdicao ? 'none' : 'block'};">${squad.nome}</span>
            <input type="text" value="${squad.nome}" style="display: ${modoEdicao ? 'block' : 'none'};" 
                   onblur="atualizarNomeSquad('${squadPath}', this.value)" />
            <input type="color" value="${squad.color || '#ffffff'}" ${modoEdicao ? '' : 'disabled'} 
                   onchange="mudarCor('${squadPath}', this.value)">
            <button onclick="criarCard('${squadPath}')" ${modoEdicao ? '' : 'style="display:none;"'}>Adicionar Card</button>
            <button onclick="criarSquad('${squadPath}')" ${modoEdicao ? '' : 'style="display:none;"'}>Adicionar Sub-Squad</button>
            <button onclick="excluirSquad('${squadPath}')" ${modoEdicao ? '' : 'style="display:none;"'}>Excluir Squad</button>
            <button onclick="alternarLayout('${squadPath}', '${layoutAtual}')" ${modoEdicao ? '' : 'style="display:none;"'}>Organizar Cards: ${layoutTexto}</button>
        </div>
        <div class="cards-container ${layoutAtual}"></div>
        <div class="sub-squads-container" style="display: flex; flex-direction: row;"></div>
    `;

    const cardsContainer = squadDiv.querySelector('.cards-container');
    const subSquadsContainer = squadDiv.querySelector('.sub-squads-container');

    // Renderizar cards
    if (squad.cards) {
        Object.keys(squad.cards).forEach((cardId) => {
            const card = squad.cards[cardId];
            const cardDiv = criarCardDiv(card, squadPath, cardId);
            cardsContainer.appendChild(cardDiv);
        });
    }

    // Renderizar sub-squads
    if (squad.squads) {
        Object.keys(squad.squads).forEach((subSquadId) => {
            const subSquad = squad.squads[subSquadId];
            const subSquadDiv = criarSquadDiv(subSquad, `${squadPath}/squads/${subSquadId}`);
            subSquadsContainer.appendChild(subSquadDiv);
        });
    }

    return squadDiv;
}

// Função para criar um novo card dentro de um squad específico
function criarCard(squadPath) {
    if (!modoEdicao) return;

    const novoCard = {
        nome: 'Sem nome',
        cargo: 'Sem cargo',
        consultoria: 'Sem consultoria',
        foto: '',
        color: '#e0e0e0'
    };

    const cardsRef = database.ref(`${squadPath}/cards`);
    cardsRef.push(novoCard);
}

// Função para criar a div do card
function criarCardDiv(card, squadPath, cardId) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.style.backgroundColor = card.color || '#e0e0e0';

    const imageUrl = card.foto || 'https://via.placeholder.com/30';
    cardDiv.innerHTML = `
        <img src="${imageUrl}" alt="${card.nome || 'Card sem nome'}" style="width: 50px; height: 50px;">
        <div class="card-info">
             <!-- Nome como link para o LinkedIn -->
            <p class="name">
                <a href="${card.linkedin || '#'}" target="_blank" style="color: inherit; text-decoration: none;">
                    ${card.nome || 'Sem nome'}
                </a>
            </p>
            <p class="cargo">${card.cargo || 'Sem cargo'}</p>
            <p class="consultoria">${card.consultoria || 'Sem consultoria'}</p>
             </div>
        <div class="link-bolinha">
            <a href="${card.linkCliente}" target="_blank" class="bolinha azul" title="Link Cliente"></a>
            <a href="${card.linkDetalhe}" target="_blank" class="bolinha vermelha" title="Link Detalhe"></a>
        </div>
        </div>
        <button onclick="editarCard('${squadPath}', '${cardId}')" ${modoEdicao ? '' : 'style="display:none;"'}>Editar</button>
        <button onclick="excluirCard('${squadPath}', '${cardId}')" ${modoEdicao ? '' : 'style="display:none;"'}>Excluir</button>
    `;

    return cardDiv;
}

// Função para editar um card existente
function editarCard(squadPath, cardId) {
    if (!modoEdicao) return;

    editSquadIndex = squadPath;
    editCardIndex = cardId;
    const pathArray = squadPath.split('/');
    let currentSquad = squads;

    for (let i = 1; i < pathArray.length; i++) {
        currentSquad = currentSquad[pathArray[i]];
    }

    const card = currentSquad.cards[cardId];
    if (card) {
        document.getElementById('edit-nome').value = card.nome || '';
        document.getElementById('edit-cargo').value = card.cargo || '';
        document.getElementById('edit-consultoria').value = card.consultoria || '';
        document.getElementById('edit-linkedin').value = card.linkedin || ''; // Novo campo
        document.getElementById('edit-senioridade').value = card.senioridade || '';
        document.getElementById('edit-proximo-cargo').value = card.proximoCargo || '';
        document.getElementById('edit-distancia-cargo').value = card.distanciaCargo || '';
        document.getElementById('edit-email').value = card.email || '';
        document.getElementById('edit-celular').value = card.celular || '';
        document.getElementById('edit-principal-stack').value = card.principalStack || '';
        document.getElementById('edit-stack-secundaria').value = card.stackSecundaria || '';
        document.getElementById('edit-conhecimento').value = card.conhecimento || '';
        document.getElementById('edit-link-detalhe').value = card.linkDetalhe || '';
        document.getElementById('edit-link-cliente').value = card.linkCliente || '';
        document.getElementById('edit-foto').value = '';

        const previewContainer = document.getElementById('preview-container');
        if (card.foto) {
            previewContainer.style.backgroundImage = `url(${card.foto})`;
            previewContainer.setAttribute('data-image', card.foto);
        } else {
            previewContainer.style.backgroundImage = '';
            previewContainer.removeAttribute('data-image');
        }

        document.getElementById('edit-modal').style.display = 'flex';
    }
}

// Função para salvar edição do card
function salvarEdicao() {
    const nome = document.getElementById('edit-nome').value;
    const cargo = document.getElementById('edit-cargo').value;
    const consultoria = document.getElementById('edit-consultoria').value;
    const linkedin = document.getElementById('edit-linkedin').value; // Novo campo
    const senioridade = document.getElementById('edit-senioridade').value;
    const proximoCargo = document.getElementById('edit-proximo-cargo').value;
    const distanciaCargo = document.getElementById('edit-distancia-cargo').value;
    const email = document.getElementById('edit-email').value;
    const celular = document.getElementById('edit-celular').value;
    const principalStack = document.getElementById('edit-principal-stack').value;
    const stackSecundaria = document.getElementById('edit-stack-secundaria').value;
    const conhecimento = document.getElementById('edit-conhecimento').value;
    const linkDetalhe = document.getElementById('edit-link-detalhe').value;
    const linkCliente = document.getElementById('edit-link-cliente').value;
    const previewContainer = document.getElementById('preview-container');
    const fotoBase64 = previewContainer.getAttribute('data-image'); // Captura a imagem colada ou selecionada

    const cardRef = database.ref(`${editSquadIndex}/cards/${editCardIndex}`);
    cardRef.once('value', (snapshot) => {
        const card = snapshot.val() || {};
        card.nome = nome;
        card.cargo = cargo;
        card.consultoria = consultoria;
        card.linkedin = linkedin; // Salva o LinkedIn
        card.senioridade = senioridade;
        card.proximoCargo = proximoCargo;
        card.distanciaCargo = distanciaCargo;
        card.email = email;
        card.celular = celular;
        card.principalStack = principalStack;
        card.stackSecundaria = stackSecundaria;
        card.conhecimento = conhecimento;
        card.linkDetalhe = linkDetalhe;
        card.linkCliente = linkCliente;

        if (fotoBase64) {
            card.foto = fotoBase64; // Salva a imagem em base64
        }

        cardRef.set(card).then(() => {
            fecharModal();
            renderizarSquads();
        });
    });
}

// Associa a função salvarEdicao ao botão de salvar
//document.getElementById('salvar-button').addEventListener('click', salvarEdicao);

// Função para fechar o modal de edição
function fecharModal() {
    document.getElementById('edit-modal').style.display = 'none';
    const previewContainer = document.getElementById('preview-container');
    previewContainer.style.backgroundImage = '';
    previewContainer.removeAttribute('data-image');
}

// Função para excluir um card específico
function excluirCard(squadPath, cardId) {
    if (!modoEdicao) return;

    const cardRef = database.ref(`${squadPath}/cards/${cardId}`);
    cardRef.remove();
}

// Função para excluir um squad específico
function excluirSquad(squadPath) {
    if (!modoEdicao) return;

    const squadRef = database.ref(squadPath);
    squadRef.remove();
    renderizarSquads();
}

// Função para atualizar o nome do squad
function atualizarNomeSquad(squadPath, novoNome) {
    const squadRef = database.ref(squadPath);
    squadRef.update({ nome: novoNome });
}

// Função para mudar a cor do squad
function mudarCor(squadPath, novaCor) {
    const squadRef = database.ref(squadPath);
    squadRef.update({ color: novaCor });
}

// Função para alternar o layout dos cards
function alternarLayout(squadPath, currentLayout) {
    if (!modoEdicao) return;

    const novoLayout = currentLayout === 'horizontal' ? 'vertical' : 'horizontal';
    const squadRef = database.ref(squadPath);
    squadRef.update({ layout: novoLayout });

    const squadDiv = document.querySelector(`[data-squad-path="${squadPath}"] .cards-container`);
    if (squadDiv) {
        squadDiv.classList.remove('horizontal', 'vertical');
        squadDiv.classList.add(novoLayout);
    }
}


// Função para mostrar o progresso de carregamento
function mostrarCarregamento() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'inline';
        loadingIndicator.textContent = 'Carregando Aguarde...';
    }
}

// Função para ocultar o progresso de carregamento
function ocultarCarregamento() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Exemplo de uso ao carregar squads do Firebase
function carregarSquads() {
    mostrarCarregamento(); // Mostrar indicador de carregamento

    const squadsRef = database.ref('squads');
    squadsRef.on('value', (snapshot) => {
        squads = snapshot.val() || {};
        renderizarSquads();
        ocultarCarregamento(); // Ocultar indicador de carregamento após carregar os squads
    });
}


// Função para abrir o modal de relatório
function abrirModalRelatorio() {
    document.getElementById('report-modal').style.display = 'flex';
    gerarRelatorio(); // Chama a função para gerar o relatório
}

// Função para fechar o modal de relatório
function fecharModalRelatorio() {
    document.getElementById('report-modal').style.display = 'none';
}

let relatorioDados = []; // Variável para armazenar os dados do relatório

// Função para gerar o relatório a partir do Firebase
function gerarRelatorio() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; // Limpar o conteúdo existente
    relatorioDados = []; // Limpar os dados do relatório

    const pessoas = {}; // Objeto para armazenar dados agrupados

    // Itera sobre todos os squads e seus cards
    Object.keys(squads).forEach(squadId => {
        const squad = squads[squadId];
        const squadNome = squad.nome || 'Sem nome';

        if (squad.cards) {
            Object.keys(squad.cards).forEach(cardId => {
                const card = squad.cards[cardId];
                const nome = card.nome || 'Sem nome';
                const cargo = card.cargo || 'Sem cargo';
                const consultoria = card.consultoria || 'Sem consultoria';

                // Chave única para agrupar pessoas
                const key = `${nome}|${cargo}|${consultoria}`;

                // Se não existe, cria um novo objeto para a pessoa
                if (!pessoas[key]) {
                    pessoas[key] = { nome, cargo, consultoria, squads: [] };
                }

                // Adiciona o nome do squad se ainda não foi adicionado
                if (!pessoas[key].squads.includes(squadNome)) {
                    pessoas[key].squads.push(squadNome);
                }
            });
        }

        // Itera sobre os sub-squads
        if (squad.squads) {
            Object.keys(squad.squads).forEach(subSquadId => {
                const subSquad = squad.squads[subSquadId];
                percorrerSquads(subSquad, pessoas);
            });
        }
    });

    // Converte os dados agrupados para um array
    relatorioDados = Object.values(pessoas);
    renderizarTabela(relatorioDados);
}

// Função para renderizar a tabela no modal
function renderizarTabela(dados) {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; // Limpar o conteúdo existente

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Cabeçalho da tabela com opções de classificação
    const headerRow = document.createElement('tr');
    ['Nome', 'Cargo', 'Consultoria', 'Squads'].forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid #ccc';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f4f4f4';
        th.style.cursor = 'pointer';
        th.onclick = () => classificarTabela(index);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Linhas de dados
    dados.forEach(pessoa => {
        const row = document.createElement('tr');

        // Adiciona as colunas de dados
        [pessoa.nome, pessoa.cargo, pessoa.consultoria, pessoa.squads.join(', ')].forEach(data => {
            const td = document.createElement('td');
            td.textContent = data;
            td.style.border = '1px solid #ccc';
            td.style.padding = '8px';
            row.appendChild(td);
        });

        table.appendChild(row);
    });

    reportContent.appendChild(table);
}

// Função para classificar a tabela
function classificarTabela(colunaIndex) {
    const colunas = ['nome', 'cargo', 'consultoria', 'squads'];
    const coluna = colunas[colunaIndex];

    relatorioDados.sort((a, b) => {
        if (coluna === 'squads') {
            return a[coluna].join(', ').localeCompare(b[coluna].join(', '));
        } else {
            return a[coluna].localeCompare(b[coluna]);
        }
    });

    renderizarTabela(relatorioDados); // Re-renderiza a tabela
}

// Função para filtrar o relatório conforme o usuário digita
function filtrarRelatorio() {
    const termoBusca = document.getElementById('search-input').value.toLowerCase();
    const dadosFiltrados = relatorioDados.filter(pessoa =>
        pessoa.nome.toLowerCase().includes(termoBusca)
    );

    renderizarTabela(dadosFiltrados); // Re-renderiza a tabela com os dados filtrados
}

// Função auxiliar para percorrer squads e sub-squads recursivamente
function percorrerSquads(squad, pessoas) {
    const squadNome = squad.nome || 'Sem nome';

    // Itera sobre os cards de cada squad
    if (squad.cards) {
        Object.keys(squad.cards).forEach(cardId => {
            const card = squad.cards[cardId];
            const nome = card.nome || 'Sem nome';
            const cargo = card.cargo || 'Sem cargo';
            const consultoria = card.consultoria || 'Sem consultoria';

            // Chave única para agrupar pessoas
            const key = `${nome}|${cargo}|${consultoria}`;

            // Se não existe, cria um novo objeto para a pessoa
            if (!pessoas[key]) {
                pessoas[key] = { nome, cargo, consultoria, squads: [] };
            }

            // Adiciona o nome do squad se ainda não estiver presente
            if (!pessoas[key].squads.includes(squadNome)) {
                pessoas[key].squads.push(squadNome);
            }
        });
    }

    // Itera sobre os sub-squads de cada squad
    if (squad.squads) {
        Object.keys(squad.squads).forEach(subSquadId => {
            const subSquad = squad.squads[subSquadId];
            percorrerSquads(subSquad, pessoas);
        });
    }
}
