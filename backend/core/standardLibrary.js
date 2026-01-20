/**
 * Standard Library Mappings
 * Maps standard library functions and methods across Python, Java, and C
 */

class StandardLibrary {
  constructor() {
    this.mappings = {
      // Python → Other languages
      python: {
        // I/O Functions
        print: {
          java: 'System.out.println',
          c: 'printf',
          transform: {
            c: (args) => {
              if (args.length === 1 && args[0].type === 'Literal' && args[0].valueType === 'string') {
                return [`"${args[0].value}\\n"`];
              }
              return ['"' + args.map(() => '%s').join(' ') + '\\n"', ...args];
            }
          }
        },
        input: {
          java: 'scanner.nextLine',
          c: 'scanf',
          requiresImport: {
            java: 'java.util.Scanner',
            c: 'stdio.h'
          }
        },

        // String Functions
        len: {
          java: {
            method: 'length',
            usage: 'object.length()'
          },
          c: 'strlen',
          requiresImport: {
            c: 'string.h'
          }
        },
        str: {
          java: 'String.valueOf',
          c: 'sprintf'
        },
        upper: {
          java: {
            method: 'toUpperCase',
            usage: 'string.toUpperCase()'
          },
          c: 'custom_toupper'
        },
        lower: {
          java: {
            method: 'toLowerCase',
            usage: 'string.toLowerCase()'
          },
          c: 'custom_tolower'
        },

        // Numeric Functions
        int: {
          java: 'Integer.parseInt',
          c: 'atoi',
          requiresImport: {
            c: 'stdlib.h'
          }
        },
        float: {
          java: 'Float.parseFloat',
          c: 'atof',
          requiresImport: {
            c: 'stdlib.h'
          }
        },
        abs: {
          java: 'Math.abs',
          c: 'abs',
          requiresImport: {
            c: 'stdlib.h'
          }
        },
        pow: {
          java: 'Math.pow',
          c: 'pow',
          requiresImport: {
            c: 'math.h'
          }
        },
        sqrt: {
          java: 'Math.sqrt',
          c: 'sqrt',
          requiresImport: {
            c: 'math.h'
          }
        },

        // List Functions
        append: {
          java: {
            method: 'add',
            usage: 'list.add(item)'
          },
          c: 'custom_append'
        },
        pop: {
          java: {
            method: 'remove',
            usage: 'list.remove(list.size()-1)'
          },
          c: 'custom_pop'
        },
        insert: {
          java: {
            method: 'add',
            usage: 'list.add(index, item)'
          },
          c: 'custom_insert'
        },

        // Type Checking
        isinstance: {
          java: 'instanceof',
          c: 'custom_isinstance'
        },
        type: {
          java: 'getClass',
          c: 'typeof'
        },

        // Range
        range: {
          java: 'IntStream.range',
          c: 'for_loop',
          requiresImport: {
            java: 'java.util.stream.IntStream'
          }
        }
      },

      // Java → Other languages
      java: {
        'System.out.println': {
          python: 'print',
          c: 'printf'
        },
        'System.out.print': {
          python: 'print',
          c: 'printf',
          transform: {
            python: (args) => [...args, { end: '""' }]
          }
        },
        'Integer.parseInt': {
          python: 'int',
          c: 'atoi'
        },
        'Float.parseFloat': {
          python: 'float',
          c: 'atof'
        },
        'String.valueOf': {
          python: 'str',
          c: 'sprintf'
        },
        'Math.abs': {
          python: 'abs',
          c: 'abs'
        },
        'Math.pow': {
          python: 'pow',
          c: 'pow'
        },
        'Math.sqrt': {
          python: 'sqrt',
          c: 'sqrt'
        },
        'length': {
          python: 'len',
          c: 'strlen',
          isMethod: true
        },
        'size': {
          python: 'len',
          c: 'sizeof',
          isMethod: true
        },
        'add': {
          python: 'append',
          c: 'custom_add',
          isMethod: true
        },
        'get': {
          python: '__getitem__',
          c: 'array_access',
          isMethod: true
        }
      },

      // C → Other languages
      c: {
        printf: {
          python: 'print',
          java: 'System.out.println',
          transform: {
            python: (args) => {
              // Extract format string and values
              if (args.length > 0) {
                return args.slice(1); // Remove format string, keep values
              }
              return args;
            }
          }
        },
        scanf: {
          python: 'input',
          java: 'scanner.nextLine'
        },
        strlen: {
          python: 'len',
          java: {
            method: 'length',
            usage: 'string.length()'
          }
        },
        atoi: {
          python: 'int',
          java: 'Integer.parseInt'
        },
        atof: {
          python: 'float',
          java: 'Float.parseFloat'
        },
        malloc: {
          python: 'list' ,
          java: 'new',
          specialHandling: true
        },
        free: {
          python: 'del',
          java: 'null',
          specialHandling: true
        },
        abs: {
          python: 'abs',
          java: 'Math.abs'
        },
        pow: {
          python: 'pow',
          java: 'Math.pow'
        },
        sqrt: {
          python: 'sqrt',
          java: 'Math.sqrt'
        }
      }
    };

    // Required imports for each language
    this.requiredImports = {
      python: {
        math: ['sqrt', 'pow', 'abs'],
        sys: ['argv', 'exit']
      },
      java: {
        'java.util.Scanner': ['input'],
        'java.util.ArrayList': ['list operations'],
        'java.util.HashMap': ['dict operations'],
        'java.lang.Math': ['sqrt', 'pow', 'abs'],
        'java.util.stream.IntStream': ['range']
      },
      c: {
        'stdio.h': ['printf', 'scanf'],
        'stdlib.h': ['malloc', 'free', 'atoi', 'atof', 'abs'],
        'string.h': ['strlen', 'strcpy', 'strcat'],
        'math.h': ['sqrt', 'pow']
      }
    };
  }

  /**
   * Get function mapping from source to target language
   */
  getMapping(functionName, fromLang, toLang) {
    const langMappings = this.mappings[fromLang.toLowerCase()];
    if (!langMappings || !langMappings[functionName]) {
      return null;
    }

    const mapping = langMappings[functionName];
    return mapping[toLang.toLowerCase()] || null;
  }

  /**
   * Check if function requires transformation
   */
  requiresTransform(functionName, fromLang, toLang) {
    const mapping = this.getMapping(functionName, fromLang, toLang);
    if (!mapping) return false;

    const langMappings = this.mappings[fromLang.toLowerCase()];
    const fullMapping = langMappings[functionName];

    return fullMapping.transform && fullMapping.transform[toLang.toLowerCase()];
  }

  /**
   * Transform function arguments
   */
  transformArguments(functionName, args, fromLang, toLang) {
    const langMappings = this.mappings[fromLang.toLowerCase()];
    if (!langMappings || !langMappings[functionName]) {
      return args;
    }

    const mapping = langMappings[functionName];
    if (mapping.transform && mapping.transform[toLang.toLowerCase()]) {
      return mapping.transform[toLang.toLowerCase()](args);
    }

    return args;
  }

  /**
   * Get required imports for a function
   */
  getRequiredImports(functionName, language) {
    const langMappings = this.mappings.python; // Check all source languages
    const cMappings = this.mappings.c;
    const javaMappings = this.mappings.java;

    const allMappings = { ...langMappings, ...cMappings, ...javaMappings };

    if (allMappings[functionName] && allMappings[functionName].requiresImport) {
      return allMappings[functionName].requiresImport[language.toLowerCase()];
    }

    return null;
  }

  /**
   * Check if function is a method call
   */
  isMethod(functionName, fromLang) {
    const langMappings = this.mappings[fromLang.toLowerCase()];
    if (!langMappings || !langMappings[functionName]) {
      return false;
    }

    return langMappings[functionName].isMethod || false;
  }

  /**
   * Get all required imports for a list of functions
   */
  collectImports(functions, language) {
    const imports = new Set();

    for (const func of functions) {
      const requiredImport = this.getRequiredImports(func, language);
      if (requiredImport) {
        imports.add(requiredImport);
      }
    }

    return Array.from(imports);
  }
}

module.exports = { StandardLibrary };
