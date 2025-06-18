const pt = {
    // Main UI
    title: "Palavras Cruzadas AI",
    subtitle: "Você",
    assistant: "Assistente AI",
    
    // Buttons
    newPuzzle: "Nova Palavra Cruzada",
    getHint: "Obter Dica",
    checkAnswers: "Verificar Respostas",
    playAgain: "Jogar Novamente",
    
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
    openaiApiKey: "Chave API OpenAI",
    testConnection: "Testar Conexão",
    connected: "Conectado ao LM Studio",
    notConnected: "Não conectado",
    
    // Advanced Settings
    advancedSettings: "Configurações Avançadas",
    
    // Language
    language: "Idioma:",
    portuguese: "Português",
    english: "Inglês",
    
    // Modal actions
    save: "Salvar",
    cancel: "Cancelar",
    saving: "Salvando...",
    saved: "Salvo",
    settingsSaved: "Configurações salvas com sucesso!",
    
    // Messages
    generating: "Gerando palavra cruzada...",
    aiGenerating: "A IA está criando seu quebra-cabeça...",
    readyToPlay: "Pronto para jogar!",
    pleasewait: "Por favor, aguarde enquanto criamos sua palavra cruzada personalizada.",
    puzzleComplete: "Parabéns! Você completou a palavra cruzada!",
    connectionError: "Erro de conexão com o servidor de IA",
    generationError: "Erro ao gerar palavra cruzada",
    
    // Hints
    hintFor: "Dica para",
    noHintAvailable: "Nenhuma dica disponível para esta palavra",
    
    // Validation
    correct: "Correto!",
    incorrect: "Incorreto",
    
    // UI Messages
    pleaseComplete: "Por favor, complete a palavra antes de enviar",
    incorrectTryAgain: "Incorreto. Tente novamente!",
    
    // Notification Messages
    failedToInitialize: "Falha ao inicializar aplicação. Por favor, atualize a página.",
    newPuzzleGenerated: "Nova palavra cruzada gerada com sucesso!",
    aiGenerationFailed: "Falha na geração de IA: {error}. Usando palavra cruzada padrão.",
    failedToGenerate: "Falha ao gerar palavra cruzada. Por favor, tente novamente.",
    pleaseSelectWord: "Por favor, selecione uma palavra primeiro",
    unexpectedError: "Ocorreu um erro inesperado. Por favor, tente novamente.",
    
    // AI Connection Messages
    lmStudioNotAvailable: "LM Studio não disponível. Conectado automaticamente ao OpenAI.",
    invalidOpenAIKey: "Chave da OpenAI inválida. Verifique sua chave nas configurações de IA.",
    noAIConnection: "Nenhuma conexão de IA disponível. Adicione uma chave da OpenAI nas configurações de IA para gerar quebra-cabeças personalizados.",
    openaiConnected: "Conectado com sucesso ao OpenAI!",
    connectionFailed: "Falha na conexão. Verifique sua chave API.",
    connectionError: "Erro ao testar conexão. Verifique sua chave API.",
    
    // Input placeholders
    typeAnswer: "Digite sua resposta...",
    enterApiKey: "Digite sua chave API",
    
    // Loading screen
    connectingAI: "Conectando à IA",
    generatingTheme: "Gerando Tema", 
    buildingGrid: "Construindo Grade",
    
    // Completion modal
    time: "Tempo",
    
    // Aria Labels
    settingsAriaLabel: "Configurações",
    aiSettingsAriaLabel: "Configurações de IA",
    toggleThemeAriaLabel: "Alternar modo escuro",
    gameStatusAriaLabel: "Status do Jogo",
    gameProgressAriaLabel: "Progresso do jogo",
    getHintAriaLabel: "Obter dica para palavra atual",
    checkAnswersAriaLabel: "Verificar respostas atuais",
    generatePuzzleAriaLabel: "Gerar nova palavra cruzada",
    crosswordPuzzleAriaLabel: "Palavra cruzada",
    crosswordGridAriaLabel: "Grade da palavra cruzada",
    currentWordInputAriaLabel: "Entrada da palavra atual",
    enterAnswerAriaLabel: "Digite sua resposta",
    submitWordAriaLabel: "Enviar palavra",
    crosswordCluesAriaLabel: "Pistas da palavra cruzada",
    quickNewPuzzleAriaLabel: "Nova palavra cruzada rápida",
    closeAriaLabel: "Fechar",
    
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