# Crossword Puzzle AI

A beautiful, intelligent crossword puzzle game built with HTML, CSS, and JavaScript, featuring AI-powered puzzle generation and hints.

## Features

### 🧩 Core Functionality
- **Interactive Crossword Grid**: Click-to-select cells with intuitive navigation
- **Smart Input Handling**: Type directly into cells or use the word input field
- **Real-time Validation**: Auto-check answers with visual feedback
- **Progress Tracking**: Live progress bar and completion statistics

### 🤖 AI Integration
- **Puzzle Generation**: AI creates custom crosswords based on difficulty and theme
- **Intelligent Hints**: Context-aware hints that guide without spoiling
- **Answer Explanations**: Learn why answers are correct
- **Multiple AI Providers**: Support for LM Studio and OpenAI

### 🎨 Beautiful Design
- **Modern UI**: Clean, elegant interface with smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Multiple theme options for comfortable solving
- **Accessibility**: Full keyboard navigation and screen reader support

### ⚙️ Advanced Features
- **Multiple Difficulty Levels**: Easy, Medium, and Hard puzzles
- **Various Grid Sizes**: 11x11, 15x15, and 21x21 grids
- **Auto-save Progress**: Never lose your solving progress
- **Statistics Tracking**: Track completion times, hints used, and achievements
- **Data Export/Import**: Backup and restore your data

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- For AI features: LM Studio or OpenAI API access

### Installation

1. **Download the files**
   ```bash
   git clone https://github.com/yourusername/crossword-ai.git
   cd crossword-ai
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - No server setup required for basic functionality

3. **Set up AI (Optional)**
   - **For LM Studio**: Install and run LM Studio locally
   - **For OpenAI**: Get an API key from OpenAI

## Usage

### Basic Solving
1. **Select a clue** by clicking on it in the clues panel
2. **Type your answer** in the word input field or directly in the grid
3. **Submit** by pressing Enter or clicking the submit button
4. **Navigate** between words using Tab/Shift+Tab

### AI Features
1. **Generate New Puzzle**: Click "New Puzzle" to create an AI-generated crossword
2. **Get Hints**: Click "Get Hint" when you're stuck on a word
3. **Check Answers**: Use "Check Answers" to validate your solutions

### Settings
- **Difficulty**: Choose from Easy, Medium, or Hard
- **Grid Size**: Select 11x11, 15x15, or 21x21
- **Auto-check**: Enable automatic answer validation
- **Show Mistakes**: Highlight incorrect answers

## Architecture

The application follows a modular architecture inspired by the reference chess application:

### Core Components
- **`main.js`**: Application initialization and coordination
- **`crossword-engine.js`**: Core puzzle logic and state management
- **`crossword-ui.js`**: Main UI coordination and event handling
- **`llm-client.js`**: AI service integration

### UI Modules (`ui/`)
- **`grid-manager.js`**: Crossword grid rendering and interaction
- **`clue-manager.js`**: Clue display and selection management
- **`input-handler.js`**: User input processing and validation
- **`progress-tracker.js`**: Progress monitoring and statistics
- **`settings-manager.js`**: Configuration and preferences

### Utilities (`utils/`)
- **`crossword-utils.js`**: Helper functions for puzzle operations
- **`secure-storage.js`**: Encrypted local storage for sensitive data
- **`llm-prompts.js`**: AI prompt templates and configurations

## AI Integration

### LM Studio Setup
1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a compatible language model (recommended: Gemma 2 9B)
3. Start the local server (default: http://localhost:1234)
4. Test connection in the app settings

### OpenAI Setup
1. Get an API key from [OpenAI](https://openai.com/api/)
2. Enter your API key in the AI settings
3. Select your preferred model (GPT-3.5-turbo or GPT-4)
4. Test connection in the app settings

## Customization

### Adding Custom Puzzles
Puzzles are defined in JSON format:
```javascript
{
  "grid": [
    [null, "", "", null],
    ["", "", "", ""],
    ["", "", "", ""],
    [null, "", "", null]
  ],
  "clues": {
    "across": [
      {
        "number": 1,
        "clue": "Your clue here",
        "answer": "ANSWER",
        "startRow": 1,
        "startCol": 0
      }
    ],
    "down": [
      // Down clues...
    ]
  }
}
```

### Styling
The app uses CSS custom properties for easy theming:
```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --cell-empty: #ffffff;
  /* ... more variables */
}
```

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Responsive design works on all major mobile browsers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- API keys are encrypted before storage using XOR encryption
- No sensitive data is transmitted without user consent
- All AI communications can be disabled if desired

## Performance

- Lazy loading of components for fast initial load
- Efficient grid rendering with minimal DOM updates
- Optimized for smooth animations at 60fps
- Memory-efficient puzzle storage and management

## Accessibility

- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- High contrast mode available
- Customizable font sizes
- Voice announcements for completed words

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by traditional crossword puzzles and modern web design
- Built with modern JavaScript ES6+ features
- Uses Font Awesome icons and Inter font family
- Architecture based on modular component design patterns

## Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the inline code comments for implementation details

---

**Happy solving! 🧩**
