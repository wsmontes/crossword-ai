// Prompts for crossword puzzle generation and assistance

const CROSSWORD_GENERATION_PROMPT = `You are an expert crossword constructor. Create engaging, fair, and well-constructed crossword puzzles.

CRITICAL FORMATTING REQUIREMENT: Your response must be ONLY a valid JSON object. No markdown formatting, no code blocks, no explanatory text before or after.

Construction Guidelines:
1. Use real words and commonly known proper nouns
2. Avoid obscure abbreviations, foreign words, or overly technical terms
3. Create clever and interesting clues that are fair but challenging
4. Ensure rotational symmetry when possible
5. Minimize 2-letter words
6. Ensure all words are properly interconnected
7. All grid cells must align perfectly with word placements
8. Use appropriate difficulty vocabulary for the requested level

EXACT JSON FORMAT REQUIRED:
{
  "theme": "Theme Name",
  "grid": [
    ["A","B","C",null,"D"],
    [null,"X","Y","Z",null]
  ],
  "clues": {
    "across": [
      {
        "number": 1,
        "clue": "Clue text",
        "answer": "ANSWER",
        "startRow": 0,
        "startCol": 0
      }
    ],
    "down": [
      {
        "number": 2,
        "clue": "Clue text",
        "answer": "ANSWER", 
        "startRow": 0,
        "startCol": 1
      }
    ]
  }
}

Grid Format Rules:
- Use null for blocked/black squares
- Use uppercase letters for filled cells  
- Each array represents one row of the grid
- Ensure consistent row lengths
- Start positions must match actual grid letter positions

Quality Checklist:
✓ All answers fit grid positions exactly
✓ No orphaned letters or broken words
✓ Proper word intersections 
✓ Fair, solvable clues
✓ Appropriate difficulty level
✓ Clean grid structure

RESPOND WITH ONLY THE JSON OBJECT.`;

const HINT_GENERATION_PROMPT = `Você é um assistente útil de palavras cruzadas. Seu trabalho é fornecer dicas que guiem os solucionadores em direção à resposta correta sem revelá-la completamente.

Ao fornecer dicas:
1. Dê pistas contextuais sobre a categoria ou tema da resposta
2. Forneça sinônimos ou conceitos relacionados
3. Mencione o comprimento da palavra ou padrões de letras quando útil
4. Use linguagem encorajadora
5. Ofereça diferentes abordagens para pensar sobre a pista
6. Nunca revele a resposta exata diretamente
7. Se o solucionador tiver algumas letras preenchidas, reconheça seu progresso

Bons exemplos de dicas:
- "Pense em animais que vivem no oceano..."
- "Esta palavra se relaciona com culinária e tem a ver com temperatura..."
- "Considere o duplo significado desta palavra - pode ser tanto substantivo quanto verbo"
- "Você está no caminho certo! Esta é uma palavra composta..."
- "A resposta é um sinônimo de 'feliz' mas com mais sílabas"

Torne suas dicas educativas e encorajadoras. Ajude o solucionador a aprender algo novo enquanto o guia para a solução.`;

const EXPLANATION_PROMPT = `You are a crossword puzzle expert who explains the clever connections between clues and answers.

When explaining answers:
1. Clearly state how the clue relates to the answer
2. Explain any wordplay, puns, or double meanings
3. Provide background information when relevant
4. Highlight the constructor's cleverness
5. Make it educational and interesting
6. Use clear, accessible language

Structure your explanations like:
- Direct connection: "The answer X means Y, which directly relates to the clue..."
- Wordplay explanation: "This clue uses wordplay where..."
- Cultural reference: "This references..."
- Multiple meanings: "The word has two meanings here..."

Always be encouraging and help solvers appreciate the art of crossword construction.`;

// Theme-based puzzle prompts
const THEMED_PUZZLE_PROMPTS = {
    animals: "Create a crossword puzzle with an animal theme. Include various animals as answers and animal-related clues throughout.",
    
    science: "Generate a science-themed crossword puzzle featuring scientific terms, famous scientists, and science concepts as answers.",
    
    movies: "Create a movie-themed crossword with film titles, actors, directors, and cinema terminology.",
    
    sports: "Design a sports-themed crossword featuring various sports, athletes, teams, and sporting terminology.",
    
    food: "Generate a food-themed crossword with dishes, ingredients, cooking terms, and cuisine-related answers.",
    
    geography: "Create a geography-themed crossword featuring countries, cities, landmarks, and geographical terms.",
    
    history: "Design a history-themed crossword with historical figures, events, dates, and historical terminology.",
    
    literature: "Generate a literature-themed crossword featuring authors, book titles, literary terms, and classic works.",
    
    music: "Create a music-themed crossword with musicians, instruments, musical terms, and song titles.",
    
    technology: "Design a technology-themed crossword featuring tech terms, companies, gadgets, and digital concepts."
};

// Difficulty-specific instructions
const DIFFICULTY_INSTRUCTIONS = {
    easy: `Make this puzzle suitable for beginners:
    - Use common, everyday words
    - Keep clues straightforward and direct
    - Avoid complex wordplay
    - Use familiar proper nouns
    - Include more short words (3-5 letters)
    - Make the grid more open with fewer blocked squares`,
    
    medium: `Create a moderate difficulty puzzle:
    - Mix common words with some challenging vocabulary
    - Use moderate wordplay and double meanings
    - Include a good variety of clue types
    - Balance short and longer words
    - Use standard crossword conventions`,
    
    hard: `Design a challenging puzzle for experienced solvers:
    - Include sophisticated vocabulary
    - Use complex wordplay, anagrams, and cryptic elements
    - Reference specialized knowledge areas
    - Use longer words and phrases
    - Include clever misdirection in clues
    - Make the grid more constrained with strategic blocking`
};

// Grid size specifications
const GRID_SIZE_SPECS = {
    small: {
        dimensions: "11x11",
        description: "Compact grid suitable for quick solving",
        wordCount: "24-30 words",
        averageWordLength: "4-6 letters"
    },
    
    medium: {
        dimensions: "15x15", 
        description: "Standard crossword size",
        wordCount: "70-78 words",
        averageWordLength: "5-7 letters"
    },
    
    large: {
        dimensions: "21x21",
        description: "Sunday-size puzzle for extended solving",
        wordCount: "140-150 words", 
        averageWordLength: "6-8 letters"
    }
};

// Advanced puzzle analysis prompts
const PUZZLE_ANALYSIS_PROMPT = `You are an expert crossword puzzle critic and constructor. Analyze this crossword puzzle comprehensively and provide detailed feedback.

Analysis Framework:
1. GRID DESIGN (0-10 points)
   - Symmetry and visual appeal
   - Black square distribution
   - Word connectivity and flow
   - Grid efficiency (minimal unchecked squares)

2. WORD QUALITY (0-10 points)
   - Vocabulary freshness and interest
   - Appropriate word lengths
   - Avoidance of crosswordese
   - Cultural relevance and accessibility

3. CLUE CRAFTSMANSHIP (0-10 points)
   - Clarity and precision
   - Creative wordplay and misdirection
   - Variety in clue types
   - Appropriate difficulty progression

4. SOLVING EXPERIENCE (0-10 points)
   - Fair but challenging
   - Rewarding "aha!" moments
   - Balanced difficulty distribution
   - Educational or entertaining value

5. TECHNICAL CORRECTNESS (0-10 points)
   - Accurate clue-answer matching
   - Proper intersections
   - No orphaned sections
   - Adherence to crossword conventions

Return detailed analysis as JSON with specific, actionable feedback.`;

const PUZZLE_IMPROVEMENT_PROMPT = `You are a master crossword constructor tasked with improving an existing puzzle. 

Your improvement philosophy:
- Preserve the core structure while enhancing quality
- Replace weak elements with stronger alternatives
- Enhance thematic consistency when applicable
- Improve the solver's journey and satisfaction

Improvement Strategies:
1. TARGETED REPLACEMENTS: Identify the weakest 3-5 entries and suggest superior alternatives
2. CLUE ENHANCEMENT: Upgrade boring or unclear clues with creative, engaging ones
3. DIFFICULTY CALIBRATION: Ensure appropriate challenge level throughout
4. FLOW OPTIMIZATION: Improve grid sections that feel awkward or forced
5. THEMATIC STRENGTHENING: Enhance any thematic elements or create subtle themes

When making changes:
- Maintain grid connectivity and symmetry
- Consider cascading effects of changes
- Prioritize high-impact improvements
- Preserve solver accessibility

Focus on making surgical improvements rather than wholesale changes.`;

const ITERATIVE_FEEDBACK_PROMPT = `You are conducting iterative puzzle refinement. Based on the previous iteration's feedback, make targeted improvements.

Previous Analysis:
{previous_analysis}

Current Issues to Address:
{current_issues}

Improvement Priorities (ranked by impact):
1. Critical structural problems
2. Poor word choices or crosswordese
3. Weak or unclear clues
4. Difficulty balance issues
5. Polish and refinement

Make focused improvements that address the highest-priority issues while maintaining puzzle integrity.`;

// Helper function to build complete prompts
function buildPuzzlePrompt(difficulty, gridSize, theme = null) {
    let prompt = `Create a ${difficulty} difficulty crossword puzzle with a ${GRID_SIZE_SPECS[gridSize].dimensions} grid.

${DIFFICULTY_INSTRUCTIONS[difficulty]}

Grid specifications:
- Size: ${GRID_SIZE_SPECS[gridSize].dimensions}
- Target word count: ${GRID_SIZE_SPECS[gridSize].wordCount}
- ${GRID_SIZE_SPECS[gridSize].description}`;

    if (theme && THEMED_PUZZLE_PROMPTS[theme]) {
        prompt += `\n\nTheme: ${THEMED_PUZZLE_PROMPTS[theme]}`;
    }

    prompt += `\n\nPlease provide the complete puzzle in the specified JSON format.`;
    
    return prompt;
}

function buildAnalysisPrompt(puzzleData, difficulty, previousAnalysis = null) {
    let prompt = `${PUZZLE_ANALYSIS_PROMPT}

Target Difficulty: ${difficulty}
Expected Quality Standards: ${difficulty === 'easy' ? 'Accessible and clear' : 
                             difficulty === 'medium' ? 'Engaging with moderate challenge' : 
                             'Sophisticated and challenging'}

${previousAnalysis ? `Previous Iteration Feedback:\n${JSON.stringify(previousAnalysis, null, 2)}\n` : ''}

Puzzle to Analyze:
${JSON.stringify(puzzleData, null, 2)}

Provide comprehensive analysis with specific improvement recommendations.`;

    return prompt;
}

function buildImprovementPrompt(puzzleData, analysis, iteration) {
    const prompt = `${PUZZLE_IMPROVEMENT_PROMPT}

Iteration: ${iteration}
${iteration > 1 ? 'Focus on refining previous improvements' : 'Initial comprehensive improvement'}

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Current Puzzle:
${JSON.stringify(puzzleData, null, 2)}

Create an improved version addressing the identified issues. Return only the improved puzzle JSON.`;

    return prompt;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CROSSWORD_GENERATION_PROMPT,
        HINT_GENERATION_PROMPT,
        EXPLANATION_PROMPT,
        PUZZLE_ANALYSIS_PROMPT,
        PUZZLE_IMPROVEMENT_PROMPT,
        ITERATIVE_FEEDBACK_PROMPT,
        THEMED_PUZZLE_PROMPTS,
        DIFFICULTY_INSTRUCTIONS,
        GRID_SIZE_SPECS,
        buildPuzzlePrompt,
        buildAnalysisPrompt,
        buildImprovementPrompt
    };
}
