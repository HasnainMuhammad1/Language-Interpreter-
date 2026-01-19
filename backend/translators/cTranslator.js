/**
 * C Translator - Converts Python AST to C code
 * This translator handles Python to C conversion
 */

class CTranslator {
  constructor() {
    this.indentLevel = 0;
    this.includes = new Set();
    this.hasMain = false;
    this.functionDeclarations = [];
  }

  translate(ast) {
    let code = '';

    // Add standard includes
    this.includes.add('#include <stdio.h>');
    this.includes.add('#include <stdlib.h>');
    this.includes.add('#include <string.h>');

    // First pass: collect function declarations
    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        this.functionDeclarations.push(node);
      }
    }

    // Check if we need a main function
    const hasMainFunction = ast.body.some(node =>
      node.type === 'FunctionDeclaration' && node.name === 'main'
    );

    // Add includes
    for (const inc of this.includes) {
      code += inc + '\n';
    }
    code += '\n';

    // Add function prototypes
    for (const funcNode of this.functionDeclarations) {
      if (funcNode.name !== 'main') {
        code += this.generateFunctionPrototype(funcNode) + ';\n';
      }
    }

    if (this.functionDeclarations.length > 0) {
      code += '\n';
    }

    // Translate body
    let mainCode = '';
    let otherCode = '';

    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        otherCode += this.translateNode(node);
      } else {
        mainCode += this.translateNode(node);
      }
    }

    // If there's non-function code, wrap it in main
    if (mainCode && !hasMainFunction) {
      code += 'int main() {\n';
      this.indentLevel++;
      code += mainCode;
      this.indentLevel--;
      code += '    return 0;\n}\n\n';
    }

    code += otherCode;

    return code;
  }

  generateFunctionPrototype(node) {
    let returnType = 'void';

    // Check if function returns a value
    for (const stmt of node.body) {
      if (stmt.type === 'ReturnStatement' && stmt.value) {
        returnType = this.inferCType(stmt.value);
        break;
      }
    }

    let proto = `${returnType} ${node.name}(`;

    // Parameters
    const params = node.params.map((param, idx) => {
      const paramType = this.inferCType({ type: 'Identifier', name: param.name });
      return `${paramType} ${param.name}`;
    });

    proto += params.length > 0 ? params.join(', ') : 'void';
    proto += ')';

    return proto;
  }

  translateNode(node) {
    if (!node) return '';

    switch (node.type) {
      case 'FunctionDeclaration':
        return this.translateFunction(node);
      case 'ClassDeclaration':
        return this.translateClass(node);
      case 'IfStatement':
        return this.translateIf(node);
      case 'ForLoop':
        return this.translateFor(node);
      case 'WhileLoop':
        return this.translateWhile(node);
      case 'ReturnStatement':
        return this.translateReturn(node);
      case 'Assignment':
        return this.translateAssignment(node);
      case 'FunctionCall':
        return this.translateFunctionCall(node);
      case 'Import':
      case 'ImportFrom':
        return this.translateImport(node);
      default:
        return this.translateExpression(node);
    }
  }

  translateFunction(node) {
    let code = '';
    let returnType = 'void';

    // Check if function returns a value
    for (const stmt of node.body) {
      if (stmt.type === 'ReturnStatement' && stmt.value) {
        returnType = this.inferCType(stmt.value);
        break;
      }
    }

    // Special handling for main function
    if (node.name === 'main') {
      returnType = 'int';
    }

    // Function signature
    code += `${returnType} ${node.name}(`;

    // Parameters
    const params = node.params.map((param, idx) => {
      const paramType = this.inferCType({ type: 'Identifier', name: param.name });
      return `${paramType} ${param.name}`;
    });

    code += params.length > 0 ? params.join(', ') : 'void';
    code += ') {\n';

    this.indentLevel++;

    // Function body
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }

    // Add return 0 for main if not present
    if (node.name === 'main') {
      const hasReturn = node.body.some(stmt => stmt.type === 'ReturnStatement');
      if (!hasReturn) {
        code += this.indent() + 'return 0;\n';
      }
    }

    this.indentLevel--;
    code += '}\n\n';

    return code;
  }

  translateClass(node) {
    // C doesn't have classes, so we'll create a struct
    let code = '';

    code += `typedef struct ${node.name} {\n`;
    this.indentLevel++;

    // Extract member variables from __init__ if present
    const initMethod = node.body.find(stmt =>
      stmt.type === 'FunctionDeclaration' && stmt.name === '__init__'
    );

    if (initMethod) {
      for (const param of initMethod.params) {
        if (param.name !== 'self') {
          const paramType = this.inferCType({ type: 'Identifier', name: param.name });
          code += this.indent() + `${paramType} ${param.name};\n`;
        }
      }
    }

    this.indentLevel--;
    code += `} ${node.name};\n\n`;

    // Create constructor-like function
    if (initMethod) {
      code += `${node.name}* create_${node.name}(`;
      const params = initMethod.params.filter(p => p.name !== 'self').map(param => {
        const paramType = this.inferCType({ type: 'Identifier', name: param.name });
        return `${paramType} ${param.name}`;
      });
      code += params.join(', ');
      code += `) {\n`;
      this.indentLevel++;
      code += this.indent() + `${node.name}* obj = (${node.name}*)malloc(sizeof(${node.name}));\n`;

      for (const param of initMethod.params) {
        if (param.name !== 'self') {
          code += this.indent() + `obj->${param.name} = ${param.name};\n`;
        }
      }

      code += this.indent() + 'return obj;\n';
      this.indentLevel--;
      code += '}\n\n';
    }

    // Translate methods as functions
    for (const stmt of node.body) {
      if (stmt.type === 'FunctionDeclaration' && stmt.name !== '__init__') {
        code += this.translateMethod(node.name, stmt);
      }
    }

    return code;
  }

  translateMethod(className, node) {
    let code = '';
    let returnType = 'void';

    for (const stmt of node.body) {
      if (stmt.type === 'ReturnStatement' && stmt.value) {
        returnType = this.inferCType(stmt.value);
        break;
      }
    }

    code += `${returnType} ${className}_${node.name}(${className}* self`;

    const params = node.params.filter(p => p.name !== 'self').map(param => {
      const paramType = this.inferCType({ type: 'Identifier', name: param.name });
      return `${paramType} ${param.name}`;
    });

    if (params.length > 0) {
      code += ', ' + params.join(', ');
    }

    code += ') {\n';

    this.indentLevel++;

    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }

    this.indentLevel--;
    code += '}\n\n';

    return code;
  }

  translateIf(node) {
    let code = this.indent();
    code += 'if (';
    code += this.translateExpression(node.condition);
    code += ') {\n';

    this.indentLevel++;
    for (const stmt of node.consequent) {
      code += this.translateNode(stmt);
    }
    this.indentLevel--;

    if (node.alternate && node.alternate.length > 0) {
      code += this.indent() + '} else {\n';
      this.indentLevel++;
      for (const stmt of node.alternate) {
        code += this.translateNode(stmt);
      }
      this.indentLevel--;
    }

    code += this.indent() + '}\n';

    return code;
  }

  translateFor(node) {
    let code = this.indent();

    // Check if it's range-based
    if (node.iterable.type === 'FunctionCall' && node.iterable.name === 'range') {
      const args = node.iterable.arguments;
      let start = '0';
      let end = '0';
      let step = '1';

      if (args.length === 1) {
        end = this.translateExpression(args[0]);
      } else if (args.length === 2) {
        start = this.translateExpression(args[0]);
        end = this.translateExpression(args[1]);
      } else if (args.length === 3) {
        start = this.translateExpression(args[0]);
        end = this.translateExpression(args[1]);
        step = this.translateExpression(args[2]);
      }

      code += `for (int ${node.iterator} = ${start}; ${node.iterator} < ${end}; ${node.iterator} += ${step}) {\n`;
    } else {
      // Generic iteration (more complex in C)
      code += `/* for ${node.iterator} in ${this.translateExpression(node.iterable)} */ {\n`;
    }

    this.indentLevel++;
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }
    this.indentLevel--;

    code += this.indent() + '}\n';

    return code;
  }

  translateWhile(node) {
    let code = this.indent();
    code += 'while (';
    code += this.translateExpression(node.condition);
    code += ') {\n';

    this.indentLevel++;
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }
    this.indentLevel--;

    code += this.indent() + '}\n';

    return code;
  }

  translateReturn(node) {
    let code = this.indent();
    code += 'return';
    if (node.value) {
      code += ' ' + this.translateExpression(node.value);
    }
    code += ';\n';
    return code;
  }

  translateAssignment(node) {
    let code = this.indent();

    const varType = this.inferCType(node.right);
    code += `${varType} ${node.left} = ${this.translateExpression(node.right)};\n`;

    return code;
  }

  translateFunctionCall(node) {
    const functionMap = {
      'print': 'printf',
      'len': 'strlen',
      'str': 'sprintf',
      'int': 'atoi',
      'float': 'atof'
    };

    let funcName = functionMap[node.name] || node.name;
    let code = '';

    if (node.name === 'print') {
      // Special handling for print
      if (node.arguments.length > 0) {
        const arg = node.arguments[0];
        const argExpr = this.translateExpression(arg);

        if (arg.type === 'Literal' && arg.valueType === 'string') {
          code += `printf("%s\\n", ${argExpr})`;
        } else if (arg.type === 'Literal' && arg.valueType === 'int') {
          code += `printf("%d\\n", ${argExpr})`;
        } else if (arg.type === 'Literal' && arg.valueType === 'float') {
          code += `printf("%f\\n", ${argExpr})`;
        } else {
          code += `printf("%s\\n", ${argExpr})`;
        }
      } else {
        code += 'printf("\\n")';
      }
    } else if (node.name === 'len') {
      if (node.arguments.length > 0) {
        code += `strlen(${this.translateExpression(node.arguments[0])})`;
      }
    } else {
      code += funcName + '(';
      code += node.arguments.map(arg => this.translateExpression(arg)).join(', ');
      code += ')';
    }

    return code;
  }

  translateImport(node) {
    return this.indent() + `// Python import: ${node.modules || node.module}\n`;
  }

  translateExpression(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Literal':
        return this.translateLiteral(node);
      case 'Identifier':
        return node.name;
      case 'BinaryExpression':
        return this.translateBinaryExpression(node);
      case 'FunctionCall':
        return this.translateFunctionCall(node);
      case 'ListLiteral':
        return this.translateListLiteral(node);
      case 'DictLiteral':
        return this.translateDictLiteral(node);
      default:
        return '';
    }
  }

  translateLiteral(node) {
    switch (node.valueType) {
      case 'string':
        return `"${node.value}"`;
      case 'int':
      case 'float':
        return node.value;
      case 'boolean':
        return node.value === 'True' ? '1' : '0';
      case 'null':
        return 'NULL';
      default:
        return node.value;
    }
  }

  translateBinaryExpression(node) {
    const operatorMap = {
      'and': '&&',
      'or': '||',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    };

    const op = operatorMap[node.operator] || node.operator;
    const left = this.translateExpression(node.left);
    const right = this.translateExpression(node.right);

    return `${left} ${op} ${right}`;
  }

  translateListLiteral(node) {
    const items = node.items.map(item => this.translateExpression(item)).join(', ');
    return `{${items}}`;
  }

  translateDictLiteral(node) {
    return `/* dict ${node.value} */`;
  }

  inferCType(node) {
    if (!node) return 'void';

    switch (node.type) {
      case 'Literal':
        switch (node.valueType) {
          case 'string': return 'char*';
          case 'int': return 'int';
          case 'float': return 'double';
          case 'boolean': return 'int';
          default: return 'void*';
        }
      case 'ListLiteral':
        return 'int*';
      case 'BinaryExpression':
        if (['==', '!=', '<', '>', '<=', '>=', 'and', 'or'].includes(node.operator)) {
          return 'int';
        }
        return this.inferCType(node.left);
      case 'FunctionCall':
        if (node.name === 'len') return 'int';
        if (node.name === 'str') return 'char*';
        if (node.name === 'int') return 'int';
        if (node.name === 'float') return 'double';
        return 'void*';
      default:
        return 'int';
    }
  }

  indent() {
    return '    '.repeat(this.indentLevel);
  }
}

function translateToC(ast) {
  const translator = new CTranslator();
  return translator.translate(ast);
}

module.exports = { translateToC, CTranslator };
