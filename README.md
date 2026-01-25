# Python Language Interpreter

A modern web-based language interpreter that translates Python code to Java and C with a beautiful React frontend.

## Features

- **Code Editor with Syntax Highlighting**: Monaco Editor integration for a VSCode-like experience
- **Live Translation Preview**: Translate Python code to Java and C in real-time
- **Download Translated Code**: Export your translated code as `.java` or `.c` files
- **Example Code Templates**: Pre-built Python examples to get you started quickly
- **Auto-translate Mode**: Automatically translates as you type
- **Beautiful UI**: Modern, responsive design with gradient backgrounds

## Tech Stack

### Backend
- Node.js
- Express.js
- Custom Python Parser (AST-based)
- Java Translator
- C Translator

### Frontend
- React 18
- Vite
- Monaco Editor
- Axios

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Application

**Development mode (runs both frontend and backend):**
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:3000`

**Run backend only:**
```bash
npm run dev:backend
```

**Run frontend only:**
```bash
npm run dev:frontend
```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
Language-Interpreter-/
├── backend/
│   ├── parsers/
│   │   └── pythonParser.js       # Python AST parser
│   ├── translators/
│   │   ├── javaTranslator.js     # Python to Java translator
│   │   └── cTranslator.js        # Python to C translator
│   ├── server.js                 # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main React component
│   │   ├── App.css               # Styling
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json                  # Root package with scripts
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/translate/java` - Translate Python to Java
- `POST /api/translate/c` - Translate Python to C
- `POST /api/translate/all` - Translate Python to both Java and C

## Supported Python Features

- Variables and assignments
- Functions with parameters and return values
- Classes with constructors and methods
- Control flow (if/else, for, while)
- Loops with range()
- Print statements
- Basic data types (int, float, string, boolean, lists)
- Binary operations
- Function calls

## Examples

The application includes several built-in examples:
- Hello World
- Variables and Math
- For Loop
- Function Definition
- Fibonacci Sequence
- Class Example

## Future Enhancements

- Support for more advanced Python features (decorators, generators, etc.)
- Error highlighting in code editor
- Syntax validation before translation
- Support for more target languages
- Code optimization suggestions
- Export to multiple files for complex programs

## Security (public repo)

- **No secrets in code**: The app uses no API keys or external services. Backend is self-contained (parsers, translators, local execution).
- **Environment**: Optional `PORT` via `process.env.PORT`. Never commit `.env`—it’s in `.gitignore` along with `.env.local`, `*.pem`, etc.

## License

MIT
