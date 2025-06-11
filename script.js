
/**
 * Sorteador Pro - Lógica da Aplicação
 * Desenvolvido por IA Generativa
 * Stack: Vanilla JavaScript (ES6+), Tailwind CSS, HTML5
 */

// Aguarda o conteúdo do DOM ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // 1. SELETORES DE ELEMENTOS DO DOM
    // Declaração de constantes para todos os elementos interativos da página.
    // =================================================================================
    const participantsTextarea = document.getElementById('participants');
    const modeSecretSantaRadio = document.getElementById('mode-secret-santa');
    const modeGroupsRadio = document.getElementById('mode-groups');
    const groupOptionsDiv = document.getElementById('group-options');
    const groupCountInput = document.getElementById('group-count');
    const drawButton = document.getElementById('draw-button');
    const resultsSection = document.getElementById('results-section');
    const resultsOutput = document.getElementById('results-output');
    const copyResultBtn = document.getElementById('copy-result-btn');
    const redoDrawBtn = document.getElementById('redo-draw-btn');
    const historyList = document.getElementById('history-list');
    
    // A lógica para regras de exclusão será adicionada em uma futura iteração.
    // const addRuleBtn = document.getElementById('add-rule-btn');
    // const rulesContainer = document.getElementById('rules-container');


    // =================================================================================
    // 2. EVENT LISTENERS
    // Configuração dos gatilhos para as ações do usuário.
    // =================================================================================

    // Alterna a visibilidade do campo "Quantidade de grupos"
    modeSecretSantaRadio.addEventListener('change', toggleGroupOptions);
    modeGroupsRadio.addEventListener('change', toggleGroupOptions);

    // Evento principal: clique no botão de sortear
    drawButton.addEventListener('click', handleDraw);

    // Evento para refazer o sorteio (mantendo os mesmos participantes)
    redoDrawBtn.addEventListener('click', handleDraw);

    // Carrega o histórico de sorteios ao iniciar a página
    loadHistory();


    // =================================================================================
    // 3. FUNÇÕES PRINCIPAIS E LÓGICA
    // =================================================================================

    /**
     * Função principal que orquestra o processo de sorteio.
     */
    function handleDraw() {
        // 3.1. Obter e limpar os dados de entrada
        const names = participantsTextarea.value
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        const drawMode = document.querySelector('input[name="draw-mode"]:checked').value;
        const groupCount = parseInt(groupCountInput.value, 10);

        // 3.2. Validação das entradas
        if (names.length < 2) {
            alert('Por favor, insira pelo menos 2 participantes.');
            return;
        }
        if (drawMode === 'grupos' && names.length < groupCount) {
            alert('O número de participantes não pode ser menor que o número de grupos.');
            return;
        }

        // 3.3. Executar o sorteio com base no modo selecionado
        let results;
        if (drawMode === 'amigo_secreto') {
            results = performSecretSantaDraw(names);
        } else {
            results = performGroupDraw(names, groupCount);
        }

        // Se o sorteio falhar por algum motivo (ex: regras complexas no futuro), não continua.
        if (!results) {
            alert('Não foi possível realizar o sorteio com as regras atuais. Tente novamente.');
            return;
        }

        // 3.4. Exibir os resultados na tela
        displayResults(results, drawMode);

        // 3.5. Salvar o resultado no histórico
        saveHistory({ mode: drawMode, participants: names.length, results });
        
        // 3.6. Rastreamento com Google Analytics (REQUISITO CRÍTICO)
        trackGAEvent(drawMode, names.length);
    }

    /**
     * Algoritmo de embaralhamento Fisher-Yates.
     * Garante que cada permutação do array tenha a mesma probabilidade.
     * @param {Array} array O array a ser embaralhado.
     * @returns {Array} O array embaralhado.
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Troca de elementos
        }
        return shuffled;
    }

    /**
     * Realiza o sorteio no modo "Amigo Secreto".
     * Garante que ninguém sorteie a si mesmo.
     * @param {Array<string>} names - Lista de participantes.
     * @returns {Array<Object>} - Array de objetos { giver, receiver }.
     */
    function performSecretSantaDraw(names) {
        let shuffledNames = shuffleArray(names);
        const results = [];
        
        // A abordagem mais simples e segura é criar uma lista de "recebedores" rotacionada.
        // Isso garante matematicamente que ninguém tire a si mesmo.
        const receivers = [...shuffledNames];
        receivers.push(receivers.shift()); // Move o primeiro para o final

        for (let i = 0; i < shuffledNames.length; i++) {
            results.push({
                giver: shuffledNames[i],
                receiver: receivers[i]
            });
        }
        return results;
    }

    /**
     * Realiza o sorteio no modo "Dividir em Grupos".
     * @param {Array<string>} names - Lista de participantes.
     * @param {number} groupCount - Quantidade de grupos a serem formados.
     * @returns {Array<Array<string>>} - Array de grupos, onde cada grupo é um array de nomes.
     */
    function performGroupDraw(names, groupCount) {
        const shuffledNames = shuffleArray(names);
        const groups = Array.from({ length: groupCount }, () => []); // Cria N arrays vazios

        shuffledNames.forEach((name, index) => {
            groups[index % groupCount].push(name); // Distribui os nomes de forma equilibrada
        });

        return groups;
    }

    /**
     * Mostra ou esconde as opções de grupo com base no modo de sorteio.
     */
    function toggleGroupOptions() {
        if (modeGroupsRadio.checked) {
            groupOptionsDiv.classList.remove('hidden');
        } else {
            groupOptionsDiv.classList.add('hidden');
        }
    }

    /**
     * Renderiza o resultado do sorteio na seção de resultados.
     * @param {Object|Array} results - Os dados do resultado.
     * @param {string} mode - O modo de sorteio ('amigo_secreto' ou 'grupos').
     */
    function displayResults(results, mode) {
        resultsOutput.innerHTML = ''; // Limpa resultados anteriores

        if (mode === 'amigo_secreto') {
            const list = document.createElement('div');
            list.className = 'space-y-3';
            results.forEach(pair => {
                const item = document.createElement('div');
                item.className = 'p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center';
                item.innerHTML = `
                    <span class="font-medium">${pair.giver} tirou:</span>
                    <span class="secret-name hidden bg-indigo-200 dark:bg-indigo-800 px-2 py-1 rounded">${pair.receiver}</span>
                    <button class="reveal-btn px-3 py-1 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-md">Revelar</button>
                `;
                list.appendChild(item);
            });
            resultsOutput.appendChild(list);

            // Adiciona evento para os botões de revelar
            document.querySelectorAll('.reveal-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const secretSpan = e.target.previousElementSibling;
                    secretSpan.classList.remove('hidden');
                    e.target.style.display = 'none'; // Esconde o botão após revelar
                });
            });

        } else if (mode === 'grupos') {
            results.forEach((group, index) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'mb-4';
                const title = document.createElement('h3');
                title.className = 'text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400';
                title.textContent = `Grupo ${index + 1}`;
                groupDiv.appendChild(title);

                const memberList = document.createElement('ul');
                memberList.className = 'list-disc list-inside pl-2 space-y-1';
                group.forEach(member => {
                    const listItem = document.createElement('li');
                    listItem.textContent = member;
                    memberList.appendChild(listItem);
                });
                groupDiv.appendChild(memberList);
                resultsOutput.appendChild(groupDiv);
            });
        }

        resultsSection.classList.remove('hidden'); // Mostra a seção de resultados
        resultsSection.scrollIntoView({ behavior: 'smooth' }); // Rola a tela para os resultados
    }

    /**
     * Dispara um evento customizado para o Google Analytics 4.
     * @param {string} mode - O modo de sorteio.
     * @param {number} participantCount - O número de participantes.
     */
    function trackGAEvent(mode, participantCount) {
        // Verifica se a função gtag existe para evitar erros caso o script do GA não carregue.
        if (typeof gtag === 'function') {
            gtag('event', 'evento_sorteio_realizado', {
                'modo_sorteio': mode,
                'numero_participantes': participantCount
            });
            console.log(`GA Event Sent: evento_sorteio_realizado (modo: ${mode}, participantes: ${participantCount})`);
        } else {
            console.log('GA (gtag) não encontrado. Evento não enviado.');
        }
    }


    // =================================================================================
    // 4. LÓGICA DE PERSISTÊNCIA (LocalStorage)
    // =================================================================================

    const HISTORY_KEY = 'sorteadorProHistory';
    const MAX_HISTORY_ITEMS = 3;

    /**
     * Salva o resultado do último sorteio no localStorage.
     * @param {Object} resultData - Dados do sorteio a serem salvos.
     */
    function saveHistory(resultData) {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        
        // Adiciona o novo resultado no início do array
        history.unshift({ ...resultData, date: new Date().toISOString() });
        
        // Mantém o histórico com no máximo MAX_HISTORY_ITEMS
        history = history.slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        loadHistory(); // Atualiza a exibição do histórico
    }

    /**
     * Carrega e exibe o histórico de sorteios a partir do localStorage.
     */
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        
        if (history.length === 0) {
            historyList.innerHTML = '<p>Nenhum sorteio no histórico ainda.</p>';
            return;
        }

        historyList.innerHTML = ''; // Limpa a lista atual
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';

        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'text-gray-600 dark:text-gray-400';
            const date = new Date(item.date).toLocaleString('pt-BR');
            const modeText = item.mode === 'amigo_secreto' ? 'Amigo Secreto' : 'Grupos';
            li.textContent = `${date}: ${modeText} com ${item.participants} participantes.`;
            ul.appendChild(li);
        });
        historyList.appendChild(ul);
    }

});
