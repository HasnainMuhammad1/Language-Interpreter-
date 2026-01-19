/**
 * Java Translator - Converts Python AST to Java code
 * This translator handles Python to Java conversion
 */

class JavaTranslator {
  constructor() {
    this.indentLevel = 0;
    this.imports = new Set();
    this.hasMain = false;
  }

  translate(ast) {
    let code = '';

    // Add imports
    this.imports.add('import java.util.*;');

    // Check if we need a main wrapper
    const needsMainWrapper = !ast.body.some(node =>
      node.type === 'FunctionDeclaration' && node.name === 'main'
    );

    if (needsMainWrapper) {
      this.hasMain = true;
      code += 'public class Program {\n';
      this.indentLevel++;
      code += this.indent() + 'public static void main(String[] args) {\n';
      this.indentLevel++;
    }

    // Translate body
    for (const node of ast.body) {
      code += this.translateNode(node);
    }

    if (needsMainWrapper) {
      this.indentLevel--;
      code += this.indent() + '}\n';
      this.indentLevel--;
      code += '}\n';
    }

    // Add imports at the beginning
    let finalCode = '';
    for (const imp of this.imports) {
      finalCode += imp + '\n';
    }
    finalCode += '\n' + code;

    return finalCode;
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
    let code = this.indent();

    // Determine return type
    let returnType = 'void';
    for (const stmt of node.body) {
      if (stmt.type === 'ReturnStatement' && stmt.value) {
        returnType = this.inferType(stmt.value);
        break;
      }
    }

    // Function signature
    code += `public static ${returnType} ${node.name}(`;

    // Parameters
    const params = node.params.map((param, idx) => {
      const paramType = param.type || this.inferParamType(param, node.body);
      return `${paramType} ${param.name}`;
    });
    code += params.join(', ');
    code += ') {\n';

    this.indentLevel++;

    // Function body
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }

    this.indentLevel--;
    code += this.indent() + '}\n\n';

    return code;
  }

  translateClass(node) {
    let code = this.indent();
    code += `public class ${node.name}`;

    if (node.baseClasses && node.baseClasses.length > 0) {
      code += ` extends ${node.baseClasses[0]}`;
    }

    code += ' {\n';
    this.indentLevel++;

    // Class body
    for (const stmt of node.body) {
      if (stmt.type === 'FunctionDeclaration') {
        if (stmt.name === '__init__') {
          code += this.translateConstructor(node.name, stmt);
        } else {
          code += this.translateMethod(stmt);
        }
      } else {
        code += this.translateNode(stmt);
      }
    }

    this.indentLevel--;
    code += this.indent() + '}\n\n';

    return code;
  }

  translateConstructor(className, node) {
    let code = this.indent();
    code += `public ${className}(`;

    // Parameters (skip 'self')
    const params = node.params.filter(p => p.name !== 'self').map((param, idx) => {
      const paramType = param.type || 'Object';
      return `${paramType} ${param.name}`;
    });
    code += params.join(', ');
    code += ') {\n';

    this.indentLevel++;

    // Constructor body
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }

    this.indentLevel--;
    code += this.indent() + '}\n\n';

    return code;
  }

  translateMethod(node) {
    let code = this.indent();

    // Determine return type
    let returnType = 'void';
    for (const stmt of node.body) {
      if (stmt.type === 'ReturnStatement' && stmt.value) {
        returnType = this.inferType(stmt.value);
        break;
      }
    }

    // Method signature
    code += `public ${returnType} ${node.name}(`;

    // Parameters (skip 'self')
    const params = node.params.filter(p => p.name !== 'self').map((param, idx) => {
      const paramType = param.type || 'Object';
      return `${paramType} ${param.name}`;
    });
    code += params.join(', ');
    code += ') {\n';

    this.indentLevel++;

    // Method body
    for (const stmt of node.body) {
      code += this.translateNode(stmt);
    }

    this.indentLevel--;
    code += this.indent() + '}\n\n';

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
      // Enhanced for loop
      const iterableType = this.inferIterableType(node.iterable);
      code += `for (${iterableType} ${node.iterator} : ${this.translateExpression(node.iterable)}) {\n`;
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

    // Infer type from right side
    const varType = this.inferType(node.right);

    code += `${varType} ${node.left} = ${this.translateExpression(node.right)};\n`;

    return code;
  }

  translateFunctionCall(node) {
    // Map Python built-in functions to Java equivalents
    const functionMap = {
      'print': 'System.out.println',
      'len': 'length',
      'str': 'String.valueOf',
      'int': 'Integer.parseInt',
      'float': 'Float.parseFloat',
      'input': 'scanner.nextLine'
    };

    let funcName = functionMap[node.name] || node.name;
    let code = '';

    if (node.name === 'len' && node.arguments.length > 0) {
      code += this.translateExpression(node.arguments[0]) + '.length()';
    } else if (node.name === 'range') {
      // Range should not appear as standalone
      code += '/* range */';
    } else {
      code += funcName + '(';
      code += node.arguments.map(arg => this.translateExpression(arg)).join(', ');
      code += ')';
    }

    return code;
  }

  translateImport(node) {
    // Most Python imports don't have direct Java equivalents
    // We'll add common ones as needed
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
        return node.value.toLowerCase();
      case 'null':
        return 'null';
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
    this.imports.add('import java.util.Arrays;');

    const items = node.items.map(item => this.translateExpression(item)).join(', ');
    return `Arrays.asList(${items})`;
  }

  translateDictLiteral(node) {
    this.imports.add('import java.util.HashMap;');
    return `new HashMap<>() /* ${node.value} */`;
  }

  inferType(node) {
    if (!node) return 'void';

    switch (node.type) {
      case 'Literal':
        switch (node.valueType) {
          case 'string': return 'String';
          case 'int': return 'int';
          case 'float': return 'double';
          case 'boolean': return 'boolean';
          default: return 'Object';
        }
      case 'ListLiteral':
        return 'List';
      case 'DictLiteral':
        return 'Map';
      case 'BinaryExpression':
        if (['==', '!=', '<', '>', '<=', '>=', 'and', 'or'].includes(node.operator)) {
          return 'boolean';
        }
        return this.inferType(node.left);
      case 'FunctionCall':
        // Type inference for common functions
        if (node.name === 'len') return 'int';
        if (node.name === 'str') return 'String';
        if (node.name === 'int') return 'int';
        if (node.name === 'float') return 'double';
        return 'Object';
      default:
        return 'Object';
    }
  }

  inferParamType(param, body) {
    // Try to infer parameter type from usage in function body
    return 'Object';
  }

  inferIterableType(node) {
    if (node.type === 'ListLiteral') {
      if (node.items.length > 0) {
        const firstType = this.inferType(node.items[0]);
        return firstType;
      }
    }
    return 'Object';
  }

  indent() {
    return '    '.repeat(this.indentLevel);
  }
}

function translateToJava(ast) {
  const translator = new JavaTranslator();
  return translator.translate(ast);
}

module.exports = { translateToJava, JavaTranslator };
