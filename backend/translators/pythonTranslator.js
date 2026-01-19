/**
 * Python Translator - Converts AST (from Java/C) to Python code
 */

class PythonTranslator {
  constructor() {
    this.indentLevel = 0;
  }

  translate(ast) {
    let code = '';

    // Translate body
    for (const node of ast.body) {
      code += this.translateNode(node);
    }

    return code;
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
      case 'FieldDeclaration':
        return ''; // Fields handled in class __init__
      default:
        return this.translateExpression(node);
    }
  }

  translateFunction(node) {
    // Skip main function, just translate its contents
    if (node.name === 'main') {
      let code = '';
      for (const stmt of node.body) {
        code += this.translateNode(stmt);
      }
      return code + '\n';
    }

    let code = this.indent();
    code += `def ${node.name}(`;

    // Parameters
    const params = node.params.map(p => p.name).join(', ');
    code += params;
    code += '):\n';

    this.indentLevel++;

    // Function body
    if (node.body.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const stmt of node.body) {
        code += this.translateNode(stmt);
      }
    }

    this.indentLevel--;
    code += '\n';

    return code;
  }

  translateClass(node) {
    let code = this.indent();
    code += `class ${node.name}`;

    if (node.baseClasses && node.baseClasses.length > 0) {
      code += `(${node.baseClasses.join(', ')})`;
    }

    code += ':\n';
    this.indentLevel++;

    // Check if there are fields to create __init__
    const fields = node.body.filter(n => n.type === 'FieldDeclaration');
    if (fields.length > 0) {
      code += this.indent() + 'def __init__(self';
      fields.forEach(field => {
        code += `, ${field.name}`;
      });
      code += '):\n';
      this.indentLevel++;
      fields.forEach(field => {
        code += this.indent() + `self.${field.name} = ${field.name}\n`;
      });
      this.indentLevel--;
      code += '\n';
    }

    // Translate methods
    const methods = node.body.filter(n => n.type === 'FunctionDeclaration');
    if (methods.length === 0 && fields.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const method of methods) {
        code += this.translateMethod(method);
      }
    }

    this.indentLevel--;
    code += '\n';

    return code;
  }

  translateMethod(node) {
    let code = this.indent();
    code += `def ${node.name}(self`;

    // Parameters
    if (node.params.length > 0) {
      code += ', ' + node.params.map(p => p.name).join(', ');
    }

    code += '):\n';

    this.indentLevel++;

    // Method body
    if (node.body.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const stmt of node.body) {
        code += this.translateNode(stmt);
      }
    }

    this.indentLevel--;
    code += '\n';

    return code;
  }

  translateIf(node) {
    let code = this.indent();
    code += 'if ';
    code += this.translateExpression(node.condition);
    code += ':\n';

    this.indentLevel++;
    if (node.consequent.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const stmt of node.consequent) {
        code += this.translateNode(stmt);
      }
    }
    this.indentLevel--;

    if (node.alternate && node.alternate.length > 0) {
      code += this.indent() + 'else:\n';
      this.indentLevel++;
      for (const stmt of node.alternate) {
        code += this.translateNode(stmt);
      }
      this.indentLevel--;
    }

    return code;
  }

  translateFor(node) {
    let code = this.indent();
    code += `for ${node.iterator} in `;
    code += this.translateExpression(node.iterable);
    code += ':\n';

    this.indentLevel++;
    if (node.body.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const stmt of node.body) {
        code += this.translateNode(stmt);
      }
    }
    this.indentLevel--;

    return code;
  }

  translateWhile(node) {
    let code = this.indent();
    code += 'while ';
    code += this.translateExpression(node.condition);
    code += ':\n';

    this.indentLevel++;
    if (node.body.length === 0) {
      code += this.indent() + 'pass\n';
    } else {
      for (const stmt of node.body) {
        code += this.translateNode(stmt);
      }
    }
    this.indentLevel--;

    return code;
  }

  translateReturn(node) {
    let code = this.indent();
    code += 'return';
    if (node.value) {
      code += ' ' + this.translateExpression(node.value);
    }
    code += '\n';
    return code;
  }

  translateAssignment(node) {
    let code = this.indent();
    code += `${node.left} = ${this.translateExpression(node.right)}\n`;
    return code;
  }

  translateFunctionCall(node) {
    // Map Java/C functions to Python equivalents
    const functionMap = {
      'System.out.println': 'print',
      'System.out.print': 'print',
      'printf': 'print',
      'length': 'len',
      'Integer.parseInt': 'int',
      'Float.parseFloat': 'float',
      'String.valueOf': 'str',
      'strlen': 'len',
      'atoi': 'int',
      'atof': 'float'
    };

    let funcName = functionMap[node.name] || node.name;

    // Handle special printf case - extract format string
    if (node.name === 'printf' && node.arguments.length > 0) {
      const formatStr = node.arguments[0];
      if (formatStr.type === 'Literal' && formatStr.valueType === 'string') {
        // Simple handling - just print the value if there's a second argument
        if (node.arguments.length > 1) {
          return `print(${this.translateExpression(node.arguments[1])})`;
        }
        // Remove format specifiers and newline
        const cleanStr = formatStr.value.replace(/%[sdif]/g, '{}').replace(/\\n/g, '');
        return `print("${cleanStr}")`;
      }
    }

    let code = funcName + '(';
    code += node.arguments.map(arg => this.translateExpression(arg)).join(', ');
    code += ')';

    return code;
  }

  translateImport(node) {
    return this.indent() + `# Import: ${node.modules || node.module}\n`;
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
        // Convert from Java/C boolean to Python
        if (node.value === 'true' || node.value === '1') return 'True';
        if (node.value === 'false' || node.value === '0') return 'False';
        return node.value;
      case 'null':
        return 'None';
      default:
        return node.value;
    }
  }

  translateBinaryExpression(node) {
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
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
    return `[${items}]`;
  }

  translateDictLiteral(node) {
    return `{}`;
  }

  indent() {
    return '    '.repeat(this.indentLevel);
  }
}

function translateToPython(ast) {
  const translator = new PythonTranslator();
  return translator.translate(ast);
}

module.exports = { translateToPython, PythonTranslator };
