/**
 * Python Parser - Converts Python code into an Abstract Syntax Tree (AST)
 * This is a simplified parser that handles common Python constructs
 */

class PythonParser {
  constructor(code) {
    this.code = code;
    this.lines = code.split('\n');
    this.position = 0;
    this.currentLine = 0;
    this.ast = {
      type: 'Program',
      body: []
    };
  }

  parse() {
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine].trim();

      if (line === '' || line.startsWith('#')) {
        this.currentLine++;
        continue;
      }

      const statement = this.parseStatement(line);
      if (statement) {
        this.ast.body.push(statement);
      }

      this.currentLine++;
    }

    return this.ast;
  }

  parseStatement(line) {
    // Import statements
    if (line.startsWith('import ') || line.startsWith('from ')) {
      return this.parseImport(line);
    }

    // Function definition
    if (line.startsWith('def ')) {
      return this.parseFunction(line);
    }

    // Class definition
    if (line.startsWith('class ')) {
      return this.parseClass(line);
    }

    // If statement
    if (line.startsWith('if ')) {
      return this.parseIf(line);
    }

    // For loop
    if (line.startsWith('for ')) {
      return this.parseFor(line);
    }

    // While loop
    if (line.startsWith('while ')) {
      return this.parseWhile(line);
    }

    // Return statement
    if (line.startsWith('return ')) {
      return this.parseReturn(line);
    }

    // Variable assignment
    if (line.includes('=') && !line.includes('==')) {
      return this.parseAssignment(line);
    }

    // Function call or expression
    return this.parseExpression(line);
  }

  parseImport(line) {
    if (line.startsWith('from ')) {
      const match = line.match(/from\s+(\w+)\s+import\s+(.+)/);
      if (match) {
        return {
          type: 'ImportFrom',
          module: match[1],
          names: match[2].split(',').map(n => n.trim())
        };
      }
    } else {
      const match = line.match(/import\s+(.+)/);
      if (match) {
        return {
          type: 'Import',
          modules: match[1].split(',').map(m => m.trim())
        };
      }
    }
    return null;
  }

  parseFunction(line) {
    const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*(.*)/);
    if (!match) return null;

    const functionName = match[1];
    const params = match[2] ? match[2].split(',').map(p => p.trim()) : [];
    const inlineBody = match[3];

    const functionNode = {
      type: 'FunctionDeclaration',
      name: functionName,
      params: params.map(p => this.parseParameter(p)),
      body: []
    };

    if (inlineBody) {
      functionNode.body.push(this.parseStatement(inlineBody));
    } else {
      // Multi-line function body
      const bodyIndent = this.getIndentLevel(this.lines[this.currentLine + 1] || '');
      this.currentLine++;

      while (this.currentLine < this.lines.length) {
        const nextLine = this.lines[this.currentLine];
        const nextIndent = this.getIndentLevel(nextLine);

        if (nextIndent <= this.getIndentLevel(line) && nextLine.trim() !== '') {
          this.currentLine--;
          break;
        }

        const stmt = this.parseStatement(nextLine.trim());
        if (stmt) {
          functionNode.body.push(stmt);
        }

        this.currentLine++;
      }
    }

    return functionNode;
  }

  parseParameter(param) {
    // Handle default parameters
    if (param.includes('=')) {
      const [name, defaultValue] = param.split('=').map(s => s.trim());
      return {
        name,
        defaultValue: this.parseValue(defaultValue)
      };
    }

    // Handle type annotations
    if (param.includes(':')) {
      const [name, type] = param.split(':').map(s => s.trim());
      return { name, type };
    }

    return { name: param };
  }

  parseClass(line) {
    const match = line.match(/class\s+(\w+)(?:\(([^)]*)\))?\s*:/);
    if (!match) return null;

    const className = match[1];
    const baseClasses = match[2] ? match[2].split(',').map(b => b.trim()) : [];

    const classNode = {
      type: 'ClassDeclaration',
      name: className,
      baseClasses,
      body: []
    };

    // Parse class body
    const classIndent = this.getIndentLevel(line);
    this.currentLine++;

    while (this.currentLine < this.lines.length) {
      const nextLine = this.lines[this.currentLine];
      const nextIndent = this.getIndentLevel(nextLine);

      if (nextIndent <= classIndent && nextLine.trim() !== '') {
        this.currentLine--;
        break;
      }

      const stmt = this.parseStatement(nextLine.trim());
      if (stmt) {
        classNode.body.push(stmt);
      }

      this.currentLine++;
    }

    return classNode;
  }

  parseIf(line) {
    const match = line.match(/if\s+(.+):\s*(.*)/);
    if (!match) return null;

    const condition = match[1];
    const inlineBody = match[2];

    const ifNode = {
      type: 'IfStatement',
      condition: this.parseExpression(condition),
      consequent: [],
      alternate: []
    };

    if (inlineBody) {
      ifNode.consequent.push(this.parseStatement(inlineBody));
    } else {
      const ifIndent = this.getIndentLevel(line);
      this.currentLine++;

      while (this.currentLine < this.lines.length) {
        const nextLine = this.lines[this.currentLine];
        const nextIndent = this.getIndentLevel(nextLine);
        const trimmedLine = nextLine.trim();

        if (nextIndent <= ifIndent && trimmedLine !== '') {
          if (trimmedLine.startsWith('elif ') || trimmedLine.startsWith('else:')) {
            break;
          }
          this.currentLine--;
          break;
        }

        const stmt = this.parseStatement(trimmedLine);
        if (stmt) {
          ifNode.consequent.push(stmt);
        }

        this.currentLine++;
      }

      // Handle elif/else
      if (this.currentLine < this.lines.length) {
        const nextLine = this.lines[this.currentLine].trim();
        if (nextLine.startsWith('elif ') || nextLine.startsWith('else:')) {
          const elseStmt = this.parseStatement(nextLine);
          if (elseStmt) {
            ifNode.alternate.push(elseStmt);
          }
        }
      }
    }

    return ifNode;
  }

  parseFor(line) {
    const match = line.match(/for\s+(\w+)\s+in\s+(.+):\s*(.*)/);
    if (!match) return null;

    const iterator = match[1];
    const iterable = match[2];
    const inlineBody = match[3];

    const forNode = {
      type: 'ForLoop',
      iterator,
      iterable: this.parseExpression(iterable),
      body: []
    };

    if (inlineBody) {
      forNode.body.push(this.parseStatement(inlineBody));
    } else {
      const forIndent = this.getIndentLevel(line);
      this.currentLine++;

      while (this.currentLine < this.lines.length) {
        const nextLine = this.lines[this.currentLine];
        const nextIndent = this.getIndentLevel(nextLine);

        if (nextIndent <= forIndent && nextLine.trim() !== '') {
          this.currentLine--;
          break;
        }

        const stmt = this.parseStatement(nextLine.trim());
        if (stmt) {
          forNode.body.push(stmt);
        }

        this.currentLine++;
      }
    }

    return forNode;
  }

  parseWhile(line) {
    const match = line.match(/while\s+(.+):\s*(.*)/);
    if (!match) return null;

    const condition = match[1];
    const inlineBody = match[2];

    const whileNode = {
      type: 'WhileLoop',
      condition: this.parseExpression(condition),
      body: []
    };

    if (inlineBody) {
      whileNode.body.push(this.parseStatement(inlineBody));
    } else {
      const whileIndent = this.getIndentLevel(line);
      this.currentLine++;

      while (this.currentLine < this.lines.length) {
        const nextLine = this.lines[this.currentLine];
        const nextIndent = this.getIndentLevel(nextLine);

        if (nextIndent <= whileIndent && nextLine.trim() !== '') {
          this.currentLine--;
          break;
        }

        const stmt = this.parseStatement(nextLine.trim());
        if (stmt) {
          whileNode.body.push(stmt);
        }

        this.currentLine++;
      }
    }

    return whileNode;
  }

  parseReturn(line) {
    const match = line.match(/return\s+(.*)/);
    return {
      type: 'ReturnStatement',
      value: match && match[1] ? this.parseExpression(match[1]) : null
    };
  }

  parseAssignment(line) {
    const [left, right] = line.split('=').map(s => s.trim());

    return {
      type: 'Assignment',
      left: left,
      right: this.parseExpression(right)
    };
  }

  parseExpression(expr) {
    if (!expr) return null;

    expr = expr.trim();

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) ||
        (expr.startsWith("'") && expr.endsWith("'"))) {
      return {
        type: 'Literal',
        valueType: 'string',
        value: expr.slice(1, -1)
      };
    }

    // Number literal
    if (!isNaN(expr) && expr !== '') {
      return {
        type: 'Literal',
        valueType: expr.includes('.') ? 'float' : 'int',
        value: expr
      };
    }

    // Boolean literal
    if (expr === 'True' || expr === 'False') {
      return {
        type: 'Literal',
        valueType: 'boolean',
        value: expr
      };
    }

    // None literal
    if (expr === 'None') {
      return {
        type: 'Literal',
        valueType: 'null',
        value: 'None'
      };
    }

    // List literal
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const items = this.parseListItems(expr.slice(1, -1));
      return {
        type: 'ListLiteral',
        items
      };
    }

    // Dict literal
    if (expr.startsWith('{') && expr.endsWith('}')) {
      return {
        type: 'DictLiteral',
        value: expr
      };
    }

    // Function call
    if (expr.includes('(') && expr.endsWith(')')) {
      const funcMatch = expr.match(/(\w+)\(([^)]*)\)/);
      if (funcMatch) {
        return {
          type: 'FunctionCall',
          name: funcMatch[1],
          arguments: funcMatch[2] ? this.parseArguments(funcMatch[2]) : []
        };
      }
    }

    // Binary operation
    const operators = ['==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '%', 'and', 'or'];
    for (const op of operators) {
      if (expr.includes(` ${op} `)) {
        const parts = expr.split(` ${op} `);
        return {
          type: 'BinaryExpression',
          operator: op,
          left: this.parseExpression(parts[0].trim()),
          right: this.parseExpression(parts.slice(1).join(` ${op} `).trim())
        };
      }
    }

    // Identifier
    return {
      type: 'Identifier',
      name: expr
    };
  }

  parseValue(value) {
    return this.parseExpression(value);
  }

  parseListItems(itemsStr) {
    if (!itemsStr.trim()) return [];

    const items = [];
    let currentItem = '';
    let depth = 0;

    for (let char of itemsStr) {
      if (char === ',' && depth === 0) {
        items.push(this.parseExpression(currentItem.trim()));
        currentItem = '';
      } else {
        if (char === '(' || char === '[' || char === '{') depth++;
        if (char === ')' || char === ']' || char === '}') depth--;
        currentItem += char;
      }
    }

    if (currentItem.trim()) {
      items.push(this.parseExpression(currentItem.trim()));
    }

    return items;
  }

  parseArguments(argsStr) {
    return this.parseListItems(argsStr);
  }

  getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
}

function parsePython(code) {
  const parser = new PythonParser(code);
  return parser.parse();
}

module.exports = { parsePython, PythonParser };
