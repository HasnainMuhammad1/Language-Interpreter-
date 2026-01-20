/**
 * Memory Management System
 * Handles automatic memory allocation and deallocation for C translations
 * Tracks variables that need malloc/free
 */

class MemoryManager {
  constructor() {
    this.allocatedVariables = new Map(); // Track allocated memory
    this.scopeStack = []; // Track variable scopes
    this.currentScope = 0;
  }

  /**
   * Analyze AST and determine what needs memory management
   */
  analyze(ast) {
    const needsManagement = {
      strings: [],
      arrays: [],
      structs: [],
      dynamicAllocations: []
    };

    this.traverseAST(ast, needsManagement);
    return needsManagement;
  }

  /**
   * Traverse AST to find memory allocation needs
   */
  traverseAST(node, needsManagement, scope = 'global') {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(n => this.traverseAST(n, needsManagement, scope));
      return;
    }

    switch (node.type) {
      case 'Assignment':
        this.analyzeAssignment(node, needsManagement, scope);
        break;

      case 'FunctionDeclaration':
        // New scope for function
        this.traverseAST(node.body, needsManagement, `func_${node.name}`);
        break;

      case 'ClassDeclaration':
        // Structs need memory management
        needsManagement.structs.push({
          name: node.name,
          scope,
          fields: node.body.filter(n => n.type === 'FieldDeclaration')
        });
        break;

      case 'ForLoop':
      case 'WhileLoop':
      case 'IfStatement':
        this.traverseAST(node.body || node.consequent, needsManagement, scope);
        this.traverseAST(node.alternate, needsManagement, scope);
        break;
    }

    // Traverse nested structures
    if (node.body) this.traverseAST(node.body, needsManagement, scope);
    if (node.consequent) this.traverseAST(node.consequent, needsManagement, scope);
    if (node.alternate) this.traverseAST(node.alternate, needsManagement, scope);
  }

  /**
   * Analyze variable assignment for memory needs
   */
  analyzeAssignment(node, needsManagement, scope) {
    if (!node.right) return;

    // String literals need allocation
    if (node.right.type === 'Literal' && node.right.valueType === 'string') {
      needsManagement.strings.push({
        name: node.left,
        value: node.right.value,
        scope,
        length: node.right.value.length + 1 // +1 for null terminator
      });
    }

    // List literals need dynamic allocation
    if (node.right.type === 'ListLiteral') {
      needsManagement.arrays.push({
        name: node.left,
        size: node.right.items.length,
        scope,
        items: node.right.items
      });
    }

    // Function calls that return dynamic data
    if (node.right.type === 'FunctionCall') {
      const dynamicFunctions = ['input', 'str', 'list', 'dict'];
      if (dynamicFunctions.includes(node.right.name)) {
        needsManagement.dynamicAllocations.push({
          name: node.left,
          functionCall: node.right.name,
          scope
        });
      }
    }
  }

  /**
   * Generate C code for memory allocation
   */
  generateAllocation(variable, type) {
    switch (type) {
      case 'string':
        return `char* ${variable.name} = (char*)malloc(${variable.length} * sizeof(char));`;

      case 'array':
        const elementType = this.inferArrayElementType(variable.items);
        return `${elementType}* ${variable.name} = (${elementType}*)malloc(${variable.size} * sizeof(${elementType}));`;

      case 'struct':
        return `${variable.name}* ${variable.name}_ptr = (${variable.name}*)malloc(sizeof(${variable.name}));`;

      case 'dynamic':
        return `void* ${variable.name} = malloc(256);  // Dynamic allocation`;

      default:
        return '';
    }
  }

  /**
   * Generate C code for memory deallocation
   */
  generateDeallocation(variableName) {
    return `free(${variableName});`;
  }

  /**
   * Generate all cleanup code for a scope
   */
  generateScopeCleanup(scope, needsManagement) {
    const cleanup = [];

    // Free strings in this scope
    needsManagement.strings
      .filter(s => s.scope === scope)
      .forEach(s => {
        cleanup.push(this.generateDeallocation(s.name));
      });

    // Free arrays in this scope
    needsManagement.arrays
      .filter(a => a.scope === scope)
      .forEach(a => {
        cleanup.push(this.generateDeallocation(a.name));
      });

    // Free dynamic allocations
    needsManagement.dynamicAllocations
      .filter(d => d.scope === scope)
      .forEach(d => {
        cleanup.push(this.generateDeallocation(d.name));
      });

    return cleanup;
  }

  /**
   * Infer element type from array items
   */
  inferArrayElementType(items) {
    if (!items || items.length === 0) return 'int';

    const firstItem = items[0];
    if (firstItem.type === 'Literal') {
      switch (firstItem.valueType) {
        case 'int': return 'int';
        case 'float': return 'double';
        case 'string': return 'char*';
        default: return 'int';
      }
    }

    return 'int';
  }

  /**
   * Insert memory management into C AST
   */
  insertMemoryManagement(cCode, needsManagement) {
    let managedCode = cCode;
    const lines = cCode.split('\n');
    const result = [];
    let inFunction = false;
    let functionScope = '';
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track function entry
      if (line.match(/^\w+\s+\w+\s*\([^)]*\)\s*{/)) {
        inFunction = true;
        const match = line.match(/\w+\s+(\w+)\s*\(/);
        functionScope = match ? `func_${match[1]}` : 'unknown';
        braceCount = 1;
      } else if (inFunction && line.includes('{')) {
        braceCount += (line.match(/{/g) || []).length;
      }

      result.push(lines[i]);

      // Track function exit and insert cleanup
      if (inFunction && line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0) {
          // Insert cleanup before closing brace
          const cleanup = this.generateScopeCleanup(functionScope, needsManagement);
          if (cleanup.length > 0) {
            result.splice(result.length - 1, 0, '    // Memory cleanup');
            cleanup.forEach(clean => {
              result.splice(result.length - 1, 0, `    ${clean}`);
            });
          }
          inFunction = false;
        }
      }

      // Insert cleanup for main function before return
      if (line.includes('return 0;') && functionScope === 'func_main') {
        const cleanup = this.generateScopeCleanup('global', needsManagement);
        if (cleanup.length > 0) {
          result.splice(result.length - 1, 0, '    // Global cleanup');
          cleanup.forEach(clean => {
            result.splice(result.length - 1, 0, `    ${clean}`);
          });
        }
      }
    }

    return result.join('\n');
  }

  /**
   * Generate string operations with proper memory handling
   */
  generateStringOperation(operation, args) {
    switch (operation) {
      case 'concat':
        return {
          allocation: `char* result = (char*)malloc((strlen(${args[0]}) + strlen(${args[1]}) + 1) * sizeof(char));`,
          operation: `strcpy(result, ${args[0]}); strcat(result, ${args[1]});`,
          cleanup: `free(result);`
        };

      case 'copy':
        return {
          allocation: `char* ${args[1]} = (char*)malloc((strlen(${args[0]}) + 1) * sizeof(char));`,
          operation: `strcpy(${args[1]}, ${args[0]});`,
          cleanup: `free(${args[1]});`
        };

      default:
        return null;
    }
  }

  /**
   * Generate array operations with proper memory handling
   */
  generateArrayOperation(operation, arrayName, elementType = 'int') {
    switch (operation) {
      case 'resize':
        return {
          operation: `${arrayName} = (${elementType}*)realloc(${arrayName}, new_size * sizeof(${elementType}));`,
          check: `if (${arrayName} == NULL) { fprintf(stderr, "Memory reallocation failed\\n"); exit(1); }`
        };

      case 'append':
        return {
          operation: `${arrayName} = (${elementType}*)realloc(${arrayName}, (size + 1) * sizeof(${elementType}));
    ${arrayName}[size] = new_element;
    size++;`
        };

      default:
        return null;
    }
  }

  /**
   * Check for memory leaks
   */
  detectLeaks(needsManagement, cCode) {
    const leaks = [];

    // Check if all allocations have corresponding frees
    needsManagement.strings.forEach(str => {
      if (!cCode.includes(`free(${str.name})`)) {
        leaks.push({
          variable: str.name,
          type: 'string',
          scope: str.scope
        });
      }
    });

    needsManagement.arrays.forEach(arr => {
      if (!cCode.includes(`free(${arr.name})`)) {
        leaks.push({
          variable: arr.name,
          type: 'array',
          scope: arr.scope
        });
      }
    });

    return leaks;
  }
}

module.exports = { MemoryManager };
