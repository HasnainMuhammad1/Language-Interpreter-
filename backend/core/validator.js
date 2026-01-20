/**
 * Code Validator
 * Validates code before translation to catch errors early
 */

const { TypeSystem } = require('./typeSystem');

class Validator {
  constructor() {
    this.typeSystem = new TypeSystem();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate AST before translation
   */
  validate(ast, sourceLanguage) {
    this.errors = [];
    this.warnings = [];

    // Build type context
    const context = this.typeSystem.buildTypeContext(ast, sourceLanguage);

    // Validate each node
    for (const node of ast.body) {
      this.validateNode(node, context, sourceLanguage);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Validate individual AST node
   */
  validateNode(node, context, language) {
    if (!node) return;

    switch (node.type) {
      case 'FunctionDeclaration':
        this.validateFunction(node, context, language);
        break;

      case 'ClassDeclaration':
        this.validateClass(node, context, language);
        break;

      case 'Assignment':
        this.validateAssignment(node, context, language);
        break;

      case 'FunctionCall':
        this.validateFunctionCall(node, context, language);
        break;

      case 'IfStatement':
      case 'WhileLoop':
        this.validateConditional(node, context, language);
        break;

      case 'ForLoop':
        this.validateForLoop(node, context, language);
        break;

      case 'ReturnStatement':
        this.validateReturn(node, context, language);
        break;
    }
  }

  /**
   * Validate function declaration
   */
  validateFunction(node, context, language) {
    // Check for duplicate function names
    if (context[`func_${node.name}`]) {
      this.addWarning(`Function '${node.name}' is redefined`, node);
    }

    // Validate function body
    for (const stmt of node.body) {
      this.validateNode(stmt, context, language);
    }

    // Check for return statement if function has return type
    if (node.returnType && node.returnType !== 'void') {
      const hasReturn = node.body.some(stmt => stmt.type === 'ReturnStatement');
      if (!hasReturn) {
        this.addWarning(`Function '${node.name}' may not return a value`, node);
      }
    }
  }

  /**
   * Validate class declaration
   */
  validateClass(node, context, language) {
    // Check for duplicate class names
    if (context[node.name]) {
      this.addError(`Class '${node.name}' is already defined`, node);
    }

    // Validate class body
    for (const stmt of node.body) {
      this.validateNode(stmt, context, language);
    }
  }

  /**
   * Validate variable assignment
   */
  validateAssignment(node, context, language) {
    // Validate right side expression
    if (node.right) {
      const rightType = this.typeSystem.inferType(node.right, context);

      // Type compatibility check (for statically typed languages)
      if (language === 'java' || language === 'c') {
        if (node.varType && rightType !== 'unknown') {
          if (!this.typeSystem.isCompatible(node.varType, rightType)) {
            this.addError(
              `Type mismatch: cannot assign ${rightType} to ${node.varType}`,
              node
            );
          }
        }
      }
    }

    // Update context with new variable
    context[node.left] = node.varType || this.typeSystem.inferType(node.right, context);
  }

  /**
   * Validate function call
   */
  validateFunctionCall(node, context, language) {
    // Check if function exists in context
    if (!this.isBuiltinFunction(node.name) && !context[`func_${node.name}`]) {
      this.addWarning(`Function '${node.name}' may not be defined`, node);
    }

    // Validate arguments
    for (const arg of node.arguments || []) {
      if (arg.type) {
        this.typeSystem.inferType(arg, context);
      }
    }
  }

  /**
   * Validate conditional statements
   */
  validateConditional(node, context, language) {
    // Validate condition
    if (node.condition) {
      const condType = this.typeSystem.inferType(node.condition, context);
      if (condType !== 'bool' && condType !== 'unknown') {
        this.addWarning(`Condition should be boolean, got ${condType}`, node);
      }
    }

    // Validate consequent
    for (const stmt of node.consequent || []) {
      this.validateNode(stmt, context, language);
    }

    // Validate alternate
    for (const stmt of node.alternate || []) {
      this.validateNode(stmt, context, language);
    }
  }

  /**
   * Validate for loop
   */
  validateForLoop(node, context, language) {
    // Validate iterable
    if (node.iterable) {
      const iterType = this.typeSystem.inferType(node.iterable, context);
      if (iterType !== 'list' && iterType !== 'unknown') {
        // Could be range() or other iterable
        if (node.iterable.type !== 'FunctionCall' || node.iterable.name !== 'range') {
          this.addWarning(`For loop expects iterable, got ${iterType}`, node);
        }
      }
    }

    // Validate body
    for (const stmt of node.body || []) {
      this.validateNode(stmt, context, language);
    }
  }

  /**
   * Validate return statement
   */
  validateReturn(node, context, language) {
    // Validate return value type if present
    if (node.value) {
      this.typeSystem.inferType(node.value, context);
    }
  }

  /**
   * Check if function is built-in
   */
  isBuiltinFunction(name) {
    const builtins = [
      'print', 'println', 'printf', 'scanf',
      'len', 'str', 'int', 'float', 'bool',
      'list', 'dict', 'range',
      'abs', 'pow', 'sqrt',
      'input', 'upper', 'lower',
      'append', 'pop', 'insert',
      'System.out.println', 'System.out.print',
      'Integer.parseInt', 'Float.parseFloat',
      'Math.abs', 'Math.pow', 'Math.sqrt'
    ];

    return builtins.includes(name);
  }

  /**
   * Add error message
   */
  addError(message, node) {
    this.errors.push({
      type: 'error',
      message,
      node: node ? node.type : 'unknown'
    });
  }

  /**
   * Add warning message
   */
  addWarning(message, node) {
    this.warnings.push({
      type: 'warning',
      message,
      node: node ? node.type : 'unknown'
    });
  }

  /**
   * Format validation results for display
   */
  formatResults() {
    let output = '';

    if (this.errors.length > 0) {
      output += '❌ Errors:\n';
      this.errors.forEach((err, idx) => {
        output += `  ${idx + 1}. ${err.message} (${err.node})\n`;
      });
    }

    if (this.warnings.length > 0) {
      output += '\n⚠️  Warnings:\n';
      this.warnings.forEach((warn, idx) => {
        output += `  ${idx + 1}. ${warn.message} (${warn.node})\n`;
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      output = '✅ No issues found';
    }

    return output;
  }
}

module.exports = { Validator };
