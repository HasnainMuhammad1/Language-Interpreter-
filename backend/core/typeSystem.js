/**
 * Type System for Multi-Language Transpiler
 * Handles type inference, conversion, and validation across Python, Java, and C
 */

class TypeSystem {
  constructor() {
    // Type mapping between languages
    this.typeMap = {
      python: {
        int: { java: 'int', c: 'int' },
        float: { java: 'double', c: 'double' },
        str: { java: 'String', c: 'char*' },
        bool: { java: 'boolean', c: 'int' },
        list: { java: 'ArrayList', c: 'array' },
        dict: { java: 'HashMap', c: 'struct' },
        None: { java: 'null', c: 'NULL' },
        object: { java: 'Object', c: 'void*' }
      },
      java: {
        int: { python: 'int', c: 'int' },
        long: { python: 'int', c: 'long' },
        double: { python: 'float', c: 'double' },
        float: { python: 'float', c: 'float' },
        String: { python: 'str', c: 'char*' },
        boolean: { python: 'bool', c: 'int' },
        ArrayList: { python: 'list', c: 'array' },
        HashMap: { python: 'dict', c: 'struct' },
        Object: { python: 'object', c: 'void*' }
      },
      c: {
        int: { python: 'int', java: 'int' },
        long: { python: 'int', java: 'long' },
        double: { python: 'float', java: 'double' },
        float: { python: 'float', java: 'float' },
        'char*': { python: 'str', java: 'String' },
        'void*': { python: 'object', java: 'Object' }
      }
    };
  }

  /**
   * Infer type from AST node
   */
  inferType(node, context = {}) {
    if (!node) return 'unknown';

    switch (node.type) {
      case 'Literal':
        return this.inferLiteralType(node);

      case 'Identifier':
        return context[node.name] || 'unknown';

      case 'BinaryExpression':
        return this.inferBinaryExpressionType(node, context);

      case 'FunctionCall':
        return this.inferFunctionCallType(node, context);

      case 'ListLiteral':
        return 'list';

      case 'DictLiteral':
        return 'dict';

      default:
        return 'unknown';
    }
  }

  /**
   * Infer type from literal value
   */
  inferLiteralType(node) {
    switch (node.valueType) {
      case 'int':
        return 'int';
      case 'float':
      case 'double':
        return 'float';
      case 'string':
        return 'str';
      case 'boolean':
        return 'bool';
      case 'null':
        return 'None';
      default:
        return 'unknown';
    }
  }

  /**
   * Infer type from binary expression
   */
  inferBinaryExpressionType(node, context) {
    const leftType = this.inferType(node.left, context);
    const rightType = this.inferType(node.right, context);

    // Comparison operators return boolean
    if (['==', '!=', '<', '>', '<=', '>=', '&&', '||', 'and', 'or'].includes(node.operator)) {
      return 'bool';
    }

    // Arithmetic operators - use widest type
    if (['+', '-', '*', '/', '%'].includes(node.operator)) {
      if (leftType === 'float' || rightType === 'float') return 'float';
      if (leftType === 'int' && rightType === 'int') return 'int';
      if (leftType === 'str' || rightType === 'str') return 'str';
    }

    return leftType !== 'unknown' ? leftType : rightType;
  }

  /**
   * Infer return type from function call
   */
  inferFunctionCallType(node, context) {
    // Built-in functions
    const builtinTypes = {
      len: 'int',
      str: 'str',
      int: 'int',
      float: 'float',
      bool: 'bool',
      list: 'list',
      dict: 'dict',
      range: 'list',
      print: 'None',
      println: 'None',
      printf: 'None'
    };

    if (builtinTypes[node.name]) {
      return builtinTypes[node.name];
    }

    // User-defined functions from context
    return context[`func_${node.name}`] || 'unknown';
  }

  /**
   * Convert type from source language to target language
   */
  convertType(type, fromLang, toLang) {
    const langMap = this.typeMap[fromLang.toLowerCase()];
    if (!langMap || !langMap[type]) {
      return type; // Return as-is if no mapping
    }
    return langMap[type][toLang.toLowerCase()] || type;
  }

  /**
   * Build type context from function/class declarations
   */
  buildTypeContext(ast, language) {
    const context = {};

    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        // Store function return type
        if (node.returnType) {
          context[`func_${node.name}`] = node.returnType;
        }

        // Store parameter types
        for (const param of node.params || []) {
          if (param.type) {
            context[param.name] = param.type;
          }
        }
      }

      if (node.type === 'Assignment' && node.varType) {
        context[node.left] = node.varType;
      }
    }

    return context;
  }

  /**
   * Validate type compatibility
   */
  isCompatible(type1, type2) {
    if (type1 === type2) return true;
    if (type1 === 'unknown' || type2 === 'unknown') return true;

    // Numeric compatibility
    const numericTypes = ['int', 'float', 'double', 'long'];
    if (numericTypes.includes(type1) && numericTypes.includes(type2)) {
      return true;
    }

    return false;
  }

  /**
   * Get default value for a type
   */
  getDefaultValue(type, language) {
    const defaults = {
      python: {
        int: '0',
        float: '0.0',
        str: '""',
        bool: 'False',
        list: '[]',
        dict: '{}',
        None: 'None'
      },
      java: {
        int: '0',
        double: '0.0',
        float: '0.0f',
        String: 'null',
        boolean: 'false',
        ArrayList: 'new ArrayList<>()',
        HashMap: 'new HashMap<>()',
        Object: 'null'
      },
      c: {
        int: '0',
        double: '0.0',
        float: '0.0f',
        'char*': 'NULL',
        'void*': 'NULL'
      }
    };

    return defaults[language]?.[type] || 'null';
  }
}

module.exports = { TypeSystem };
