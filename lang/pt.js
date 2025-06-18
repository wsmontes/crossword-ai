const pt = {
    // Main UI
    title: "Palavras Cruzadas AI",
    subtitle: "Você",
    assistant: "Assistente AI",
    
    // Buttons
    newPuzzle: "Nova Palavra Cruzada",
    getHint: "Obter Dica",
    checkAnswers: "Verificar Respostas",
    
    // Grid and clues
    clickClueToStart: "Clique em uma pista para começar a resolver",
    across: "Horizontais",
    down: "Verticais",
    
    // Progress
    progress: "Progresso",
    wordsCompleted: "Palavras Completadas",
    totalWords: "Total de Palavras",
    hintsUsed: "Dicas Usadas",
    
    // Settings
    settings: "Configurações",
    difficulty: "Dificuldade:",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    gridSize: "Tamanho da Grade:",
    small: "Pequeno",
    large: "Grande",
    autoCheck: "Verificação automática das respostas",
    highlightMistakes: "Destacar erros",
    
    // AI Settings
    aiSettings: "Configurações de IA",
    aiProvider: "Provedor de IA:",
    lmStudioEndpoint: "Endpoint do LM Studio:",
    testConnection: "Testar Conexão",
    connected: "Conectado ao LM Studio",
    notConnected: "Não conectado",
    
    // Advanced Settings
    advancedSettings: "Configurações Avançadas",
    
    // Language
    language: "Idioma:",
    portuguese: "Português",
    english: "Inglês",
    
    // Messages
    generating: "Gerando palavra cruzada...",
    pleasewait: "Por favor, aguarde enquanto criamos sua palavra cruzada personalizada.",
    puzzleComplete: "Parabéns! Você completou a palavra cruzada!",
    connectionError: "Erro de conexão com o servidor de IA",
    generationError: "Erro ao gerar a palavra cruzada",
    
    // Hints
    hintFor: "Dica para",
    noHintAvailable: "Nenhuma dica disponível para esta palavra",
    
    // Validation
    correct: "Correto!",
    incorrect: "Incorreto",
    
    // Themes (for AI generation)
    themes: {
        garden: "Jardinagem",
        cooking: "Culinária", 
        sports: "Esportes",
        science: "Ciência",
        history: "História",
        nature: "Natureza",
        technology: "Tecnologia",
        arts: "Artes",
        travel: "Viagem",
        animals: "Animais"
    },
    
    // Error messages
    errors: {
        failedToLoad: "Falha ao carregar a palavra cruzada",
        invalidPuzzle: "Dados da palavra cruzada inválidos",
        connectionTimeout: "Tempo limite de conexão esgotado",
        aiNotAvailable: "Serviço de IA não disponível",
        parseError: "Erro ao processar resposta da IA"
    },
    
    // Prompts for AI (in Portuguese)
    aiPrompts: {
        themeGeneration: "Gere um tema para uma palavra cruzada em português com palavras relacionadas. O tema deve ser interessante e ter pelo menos 30 palavras relacionadas. Responda em JSON com o formato: {\"theme\": \"nome do tema\", \"description\": \"descrição breve\", \"words\": [\"PALAVRA1 - explicação\", \"PALAVRA2 - explicação\", ...]}",
        
        wordSelection: "Selecione as melhores palavras da lista fornecida para criar uma palavra cruzada em português. Escolha palavras que se intersectem bem e tenham pistas interessantes. Responda em JSON com o formato: {\"selectedWords\": [{\"word\": \"PALAVRA\", \"clue\": \"pista inteligente\", \"length\": número, \"reason\": \"por que esta palavra funciona bem\"}], \"explanation\": \"explicação breve\"}",
        
        clueGeneration: "Gere pistas criativas e inteligentes em português para as palavras fornecidas. As pistas devem ser desafiadoras mas justas. Responda em JSON.",
        
        hintGeneration: "Gere uma dica útil em português para a palavra '{word}' com a pista '{clue}'. A dica deve ajudar sem dar a resposta completa."
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pt;
} else {
    window.pt = pt;
} 