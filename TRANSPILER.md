# Production Transpiler Documentation

## Overview

This is a **production-quality transpiler** that converts code between Python, Java, and C. It's not just a syntax translator - it includes type inference, validation, compilation, and execution verification.

## Architecture

### Core Components

```
backend/
├── core/
│   ├── typeSystem.js       # Type inference and conversion
│   ├── standardLibrary.js  # Function mappings across languages
│   ├── validator.js        # Pre-translation validation
│   ├── executor.js         # Compile and run code
│   └── memoryManager.js    # C memory allocation/deallocation
├── parsers/
│   ├── pythonParser.js     # Python → AST
│   ├── javaParser.js       # Java → AST
│   └── cParser.js          # C → AST
└── translators/
    ├── pythonTranslator.js # AST → Python
    ├── javaTranslator.js   # AST → Java
    └── cTranslator.js      # AST → C
```

## Features

### ✅ Type System
- **Type Inference**: Automatically determines variable types
- **Cross-Language Mapping**: Python `str` ↔ Java `String` ↔ C `char*`
- **Type Validation**: Ensures type-safe assignments
- **Default Values**: Generates language-appropriate defaults

### ✅ Standard Library
- **150+ Function Mappings**
  - I/O: `print` ↔ `System.out.println` ↔ `printf`
  - Strings: `len()` ↔ `.length()` ↔ `strlen()`
  - Math: `abs`, `pow`, `sqrt` across all languages
  - Collections: List/Array operations

### ✅ Validation
- Pre-translation code checking
- Type compatibility verification
- Function existence validation
- Warning system for potential issues

### ✅ Execution & Verification
- Compiles generated code (Python3, javac, gcc)
- Runs and captures output
- Verifies original and translated outputs match
- Automatic cleanup and timeout protection

### ✅ Memory Management (C)
- Automatic `malloc`/`free` insertion
- String memory handling
- Dynamic array management
- Leak detection
- Scope-based cleanup

## API Endpoints

### 1. Translation (with Validation)
```http
POST /api/translate
Content-Type: application/json

{
  "code": "def greet(name):\n    return 'Hello, ' + name",
  "sourceLanguage": "python",
  "targetLanguages": ["java", "c"],
  "validate": true
}
```

**Response:**
```json
{
  "success": true,
  "translations": {
    "java": "public static String greet(String name) { ... }",
    "c": "char* greet(char* name) { ... }"
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

### 2. Code Validation
```http
POST /api/validate
Content-Type: application/json

{
  "code": "x = 10\nprint(x)",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "warnings": [],
  "message": "✅ No issues found"
}
```

### 3. Code Execution
```http
POST /api/execute
Content-Type: application/json

{
  "code": "print('Hello World')",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello World",
  "errors": "",
  "exitCode": 0
}
```

### 4. Transpile & Verify
```http
POST /api/transpile-verify
Content-Type: application/json

{
  "code": "for i in range(5):\n    print(i)",
  "sourceLanguage": "python",
  "targetLanguage": "java"
}
```

**Response:**
```json
{
  "success": true,
  "translatedCode": "for (int i = 0; i < 5; i++) { ... }",
  "verification": {
    "outputsMatch": true,
    "original": { "stdout": "0\n1\n2\n3\n4" },
    "translated": { "stdout": "0\n1\n2\n3\n4" }
  }
}
```

## Translation Examples

### Python → Java

**Input (Python):**
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))
```

**Output (Java):**
```java
import java.util.*;

public class Program {
    public static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            System.out.println(fibonacci(i));
        }
    }
}
```

### Python → C (with Memory Management)

**Input (Python):**
```python
name = "Alice"
greeting = "Hello, " + name
print(greeting)
```

**Output (C):**
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Memory allocations
    char* name = (char*)malloc(6 * sizeof(char));
    strcpy(name, "Alice");

    char* greeting = (char*)malloc((strlen("Hello, ") + strlen(name) + 1) * sizeof(char));
    strcpy(greeting, "Hello, ");
    strcat(greeting, name);

    printf("%s\n", greeting);

    // Memory cleanup
    free(name);
    free(greeting);

    return 0;
}
```

### Java → Python

**Input (Java):**
```java
public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(5, 3);
        System.out.println(result);
    }
}
```

**Output (Python):**
```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)
```

## Type Mappings

| Python | Java | C |
|--------|------|---|
| `int` | `int` | `int` |
| `float` | `double` | `double` |
| `str` | `String` | `char*` |
| `bool` | `boolean` | `int` |
| `list` | `ArrayList` | `array` + malloc |
| `dict` | `HashMap` | `struct` |
| `None` | `null` | `NULL` |

## Function Mappings

### I/O Operations
- Python `print()` → Java `System.out.println()` → C `printf()`
- Python `input()` → Java `Scanner.nextLine()` → C `scanf()`

### String Operations
- Python `len(s)` → Java `s.length()` → C `strlen(s)`
- Python `str(x)` → Java `String.valueOf(x)` → C `sprintf()`

### Math Operations
- Python `abs(x)` → Java `Math.abs(x)` → C `abs(x)`
- Python `pow(x, y)` → Java `Math.pow(x, y)` → C `pow(x, y)`
- Python `sqrt(x)` → Java `Math.sqrt(x)` → C `sqrt(x)`

### Collection Operations
- Python `list.append(x)` → Java `list.add(x)` → C `realloc + assign`
- Python `len(list)` → Java `list.size()` → C `array_size`

## Memory Management (C Translations)

### Automatic Allocation
```c
// Python: my_list = [1, 2, 3]
// C with memory management:
int* my_list = (int*)malloc(3 * sizeof(int));
my_list[0] = 1;
my_list[1] = 2;
my_list[2] = 3;
```

### Automatic Deallocation
```c
// Automatically inserted at end of scope
free(my_list);
```

### Leak Detection
The system warns if memory is allocated but not freed:
```
⚠️  Warning: Variable 'my_string' allocated but never freed (scope: func_main)
```

## Validation System

### Error Types
1. **Type Mismatch**: `cannot assign float to int`
2. **Undefined Function**: `Function 'foo' may not be defined`
3. **Invalid Operation**: `Condition should be boolean, got int`

### Warning Types
1. **Missing Return**: `Function 'foo' may not return a value`
2. **Redefinition**: `Function 'bar' is redefined`
3. **Memory Leak**: `Variable 'x' allocated but not freed`

## Execution & Verification

### Safety Features
- **Timeout Protection**: 10-second execution limit
- **Sandboxing**: Code runs in temporary directory
- **Output Limits**: 1MB buffer maximum
- **Automatic Cleanup**: Temp files removed after execution

### Supported Compilers
- Python: `python3`
- Java: `javac` + `java`
- C: `gcc -lm`

## Testing

The transpiler includes automated tests to verify:
1. Syntax correctness
2. Type preservation
3. Output equivalence
4. Memory safety (C)
5. Edge cases

## Limitations

### Current Limitations
- Simplified parsers (not full language support)
- Limited exception handling translation
- Basic class/struct conversion
- No advanced features (decorators, generators, etc.)

### Future Enhancements
- Full language feature support
- Optimization passes
- Better error messages with line numbers
- IDE integration
- Performance profiling

## Usage Example

```javascript
// Client-side usage
const response = await fetch('/api/transpile-verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'def greet(name):\n    return "Hello, " + name',
    sourceLanguage: 'python',
    targetLanguage: 'java'
  })
});

const result = await response.json();
console.log(result.translatedCode);
console.log('Outputs match:', result.verification.outputsMatch);
```

## Contributing

To add new language features:
1. Update parser (`backend/parsers/`)
2. Add type mappings (`backend/core/typeSystem.js`)
3. Add function mappings (`backend/core/standardLibrary.js`)
4. Update translator (`backend/translators/`)
5. Add tests
6. Verify with execution

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/HasnainMuhammad1/Language-Interpreter-
- Documentation: This file
- Examples: See `frontend/src/constants/examples.js`
