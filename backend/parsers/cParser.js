/**
 * C Parser - Converts C code into an Abstract Syntax Tree (AST)
 * This is a simplified parser that handles common C constructs
 */

class CParser {
  constructor(code) {
    this.code = code;
    this.lines = code.split('\n');
    this.currentLine = 0;
    this.ast = {
      type: 'Program',
      body: []
    };
  }

  parse() {
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine].trim();

      if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        this.currentLine++;
        continue;
      }

      // Skip preprocessor directives and includes
      if (line.startsWith('#')) {
        const stmt = this.parseInclude(line);
        if (stmt) this.ast.body.push(stmt);
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
    // Struct/typedef definition
    if (line.startsWith('struct ') || line.startsWith('typedef struct')) {
      return this.parseStruct(line);
    }

    // Function definition
    if (this.isFunctionDeclaration(line)) {
      return this.parseFunction(line);
    }

    // If statement
    if (line.startsWith('if ') || line.startsWith('if(')) {
      return this.parseIf(line);
    }

    // For loop
    if (line.startsWith('for ') || line.startsWith('for(')) {
      return this.parseFor(line);
    }

    // While loop
    if (line.startsWith('while ') || line.startsWith('while(')) {
      return this.parseWhile(line);
    }

    // Return statement
    if (line.startsWith('return ')) {
      return this.parseReturn(line);
    }

    // Variable declaration
    if (this.isVariableDeclaration(line)) {
      return this.parseVariableDeclaration(line);
    }

    // Function call
    if (line.includes('(') && line.includes(')')) {
      return this.parseFunctionCall(line);
    }

    return null;
  }

  parseInclude(line) {
    const match = line.match(/#include\s+[<"](.+)[>"]/);
    if (match) {
      return {
        type: 'Import',
        modules: [match[1]]
      };
    }
    return null;
  }

  parseStruct(line) {
    let structName = '';
    const match = line.match(/(?:typedef\s+)?struct\s+(\w+)/);
    if (match) {
      structName = match[1];
    }

    const structNode = {
      type: 'ClassDeclaration',
      name: structName,
      baseClasses: [],
      body: []
    };

    // Skip opening brace
    this.currentLine++;

    // Parse struct body
    while (this.currentLine < this.lines.length) {
      const nextLine = this.lines[this.currentLine];
      const trimmed = nextLine.trim();

      if (trimmed.startsWith('}')) {
        // Check for typedef name after closing brace
        const typedefMatch = trimmed.match(/}\s*(\w+)/);
        if (typedefMatch && !structName) {
          structNode.name = typedefMatch[1];
        }
        break;
      }

      if (trimmed && !trimmed.startsWith('//')) {
        // Parse field declaration
        const fieldMatch = trimmed.match(/(\w+(?:\s*\*)?)\s+(\w+);/);
        if (fieldMatch) {
          structNode.body.push({
            type: 'FieldDeclaration',
            varType: fieldMatch[1],
            name: fieldMatch[2]
          });
        }
      }

      this.currentLine++;
    }

    return structNode;
  }

  isFunctionDeclaration(line) {
    // Check for C function pattern: type name(params) or type* name(params)
    return /\w+(?:\s*\*)?\s+\w+\s*\([^)]*\)\s*{?/.test(line) &&
           !line.includes('=') &&
           !line.includes('if') &&
           !line.includes('while') &&
           !line.includes('for');
  }

  parseFunction(line) {
    const match = line.match(/(\w+(?:\s*\*)?)\s+(\w+)\s*\(([^)]*)\)/);
    if (!match) return null;

    const returnType = match[1].trim();
    const funcName = match[2];
    const paramsStr = match[3];

    const funcNode = {
      type: 'FunctionDeclaration',
      name: funcName,
      returnType,
      params: this.parseParameters(paramsStr),
      body: []
    };

    // Parse function body
    this.currentLine++;
    const funcIndent = this.getIndentLevel(line);

    while (this.currentLine < this.lines.length) {
      const nextLine = this.lines[this.currentLine];
      const trimmed = nextLine.trim();

      if (trimmed === '}' && this.getIndentLevel(nextLine) <= funcIndent) {
        break;
      }

      if (trimmed && !trimmed.startsWith('//')) {
        const stmt = this.parseStatement(trimmed);
        if (stmt) {
          funcNode.body.push(stmt);
        }
      }

      this.currentLine++;
    }

    return funcNode;
  }

  parseParameters(paramsStr) {
    if (!paramsStr.trim() || paramsStr.trim() === 'void') return [];

    return paramsStr.split(',').map(param => {
      const parts = param.trim().split(/\s+/);
      if (parts.length >= 2) {
        return {
          type: parts[0],
          name: parts[parts.length - 1]
        };
      }
      return { name: param.trim() };
    });
  }

  parseIf(line) {
    const match = line.match(/if\s*\(([^)]+)\)/);
    if (!match) return null;

    const condition = match[1];

    const ifNode = {
      type: 'IfStatement',
      condition: this.parseExpression(condition),
      consequent: [],
      alternate: []
    };

    // Parse if body
    this.currentLine++;
    const ifIndent = this.getIndentLevel(line);

    while (this.currentLine < this.lines.length) {
      const nextLine = this.lines[this.currentLine];
      const trimmed = nextLine.trim();

      if (trimmed === '}' || trimmed.startsWith('else')) {
        if (trimmed.startsWith('else')) {
          this.currentLine++;
          // Parse else body
          while (this.currentLine < this.lines.length) {
            const elseLine = this.lines[this.currentLine];
            const elseTrimmed = elseLine.trim();

            if (elseTrimmed === '}') {
              break;
            }

            if (elseTrimmed && !elseTrimmed.startsWith('//')) {
              const stmt = this.parseStatement(elseTrimmed);
              if (stmt) {
                ifNode.alternate.push(stmt);
              }
            }

            this.currentLine++;
          }
        }
        break;
      }

      if (trimmed && !trimmed.startsWith('//')) {
        const stmt = this.parseStatement(trimmed);
        if (stmt) {
          ifNode.consequent.push(stmt);
        }
      }

      this.currentLine++;
    }

    return ifNode;
  }

  parseFor(line) {
    // Traditional for loop: for (init; condition; increment)
    const match = line.match(/for\s*\(([^;]+);([^;]+);([^)]+)\)/);
    if (!match) return null;

    const initStr = match[1].trim();
    const condStr = match[2].trim();
    const incrStr = match[3].trim();

    // Try to extract iterator from init
    const initMatch = initStr.match(/(?:\w+\s+)?(\w+)\s*=\s*(\d+)/);
    const iterator = initMatch ? initMatch[1] : 'i';
    const start = initMatch ? initMatch[2] : '0';

    // Try to extract end from condition
    const condMatch = condStr.match(/\w+\s*<\s*(.+)/);
    const end = condMatch ? condMatch[1] : '10';

    return {
      type: 'ForLoop',
      iterator,
      iterable: {
        type: 'FunctionCall',
        name: 'range',
        arguments: [
          { type: 'Literal', valueType: 'int', value: start },
          this.parseExpression(end)
        ]
      },
      body: this.parseBlockBody()
    };
  }

  parseWhile(line) {
    const match = line.match(/while\s*\(([^)]+)\)/);
    if (!match) return null;

    return {
      type: 'WhileLoop',
      condition: this.parseExpression(match[1]),
      body: this.parseBlockBody()
    };
  }

  parseBlockBody() {
    const body = [];
    this.currentLine++;

    while (this.currentLine < this.lines.length) {
      const nextLine = this.lines[this.currentLine];
      const trimmed = nextLine.trim();

      if (trimmed === '}') {
        break;
      }

      if (trimmed && !trimmed.startsWith('//')) {
        const stmt = this.parseStatement(trimmed);
        if (stmt) {
          body.push(stmt);
        }
      }

      this.currentLine++;
    }

    return body;
  }

  parseReturn(line) {
    const match = line.match(/return\s+([^;]+)/);
    return {
      type: 'ReturnStatement',
      value: match ? this.parseExpression(match[1]) : null
    };
  }

  isVariableDeclaration(line) {
    // Check for type identifier = value pattern
    return /\w+(?:\s*\*)?\s+\w+\s*=/.test(line) && !line.includes('(');
  }

  parseVariableDeclaration(line) {
    const match = line.match(/(\w+(?:\s*\*)?)\s+(\w+)\s*=\s*([^;]+)/);
    if (!match) return null;

    return {
      type: 'Assignment',
      varType: match[1].trim(),
      left: match[2],
      right: this.parseExpression(match[3])
    };
  }

  parseFunctionCall(line) {
    // Remove semicolon if present
    line = line.replace(/;$/, '');

    const match = line.match(/(\w+)\s*\(([^)]*)\)/);
    if (!match) return null;

    const funcName = match[1];
    const argsStr = match[2];

    return {
      type: 'FunctionCall',
      name: funcName,
      arguments: argsStr ? this.parseArguments(argsStr) : []
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

    // Boolean literal (C uses 1/0)
    if (expr === '1' || expr === '0') {
      return {
        type: 'Literal',
        valueType: 'boolean',
        value: expr === '1' ? 'True' : 'False'
      };
    }

    // NULL literal
    if (expr === 'NULL') {
      return {
        type: 'Literal',
        valueType: 'null',
        value: 'None'
      };
    }

    // Function call
    if (expr.includes('(') && expr.endsWith(')')) {
      return this.parseFunctionCall(expr);
    }

    // Binary operation
    const operators = ['==', '!=', '<=', '>=', '<', '>', '&&', '||', '+', '-', '*', '/', '%'];
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

  parseArguments(argsStr) {
    if (!argsStr.trim()) return [];

    const args = [];
    let currentArg = '';
    let depth = 0;

    for (let char of argsStr) {
      if (char === ',' && depth === 0) {
        args.push(this.parseExpression(currentArg.trim()));
        currentArg = '';
      } else {
        if (char === '(' || char === '[' || char === '{') depth++;
        if (char === ')' || char === ']' || char === '}') depth--;
        currentArg += char;
      }
    }

    if (currentArg.trim()) {
      args.push(this.parseExpression(currentArg.trim()));
    }

    return args;
  }

  getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
}

function parseC(code) {
  const parser = new CParser(code);
  return parser.parse();
}

module.exports = { parseC, CParser };
