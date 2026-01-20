/**
 * Code examples for the multi-language interpreter
 * Organized by programming language
 */

export const PYTHON_EXAMPLES = [
  {
    name: 'Hello World',
    code: `# Hello World Example
print("Hello, World!")`
  },
  {
    name: 'Variables and Math',
    code: `# Variables and basic math
x = 10
y = 20
sum = x + y
print(sum)`
  },
  {
    name: 'For Loop',
    code: `# For loop example
for i in range(5):
    print(i)`
  },
  {
    name: 'Function',
    code: `# Function example
def greet(name):
    return "Hello, " + name

result = greet("Alice")
print(result)`
  },
  {
    name: 'Fibonacci',
    code: `# Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))`
  },
  {
    name: 'Class Example',
    code: `# Class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return "Hello, I'm " + self.name`
  }
];

export const JAVA_EXAMPLES = [
  {
    name: 'Hello World',
    code: `// Hello World Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
  },
  {
    name: 'Variables and Math',
    code: `// Variables and basic math
public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = x + y;
        System.out.println(sum);
    }
}`
  },
  {
    name: 'For Loop',
    code: `// For loop example
public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println(i);
        }
    }
}`
  },
  {
    name: 'Function',
    code: `// Function example
public class Main {
    public static String greet(String name) {
        return "Hello, " + name;
    }

    public static void main(String[] args) {
        String result = greet("Alice");
        System.out.println(result);
    }
}`
  },
  {
    name: 'Fibonacci',
    code: `// Fibonacci sequence
public class Main {
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
}`
  },
  {
    name: 'Class Example',
    code: `// Class example
public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String greet() {
        return "Hello, I'm " + this.name;
    }
}`
  }
];

export const C_EXAMPLES = [
  {
    name: 'Hello World',
    code: `// Hello World Example
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
  },
  {
    name: 'Variables and Math',
    code: `// Variables and basic math
#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;
    printf("%d\\n", sum);
    return 0;
}`
  },
  {
    name: 'For Loop',
    code: `// For loop example
#include <stdio.h>

int main() {
    for (int i = 0; i < 5; i++) {
        printf("%d\\n", i);
    }
    return 0;
}`
  },
  {
    name: 'Function',
    code: `// Function example
#include <stdio.h>
#include <string.h>

char* greet(char* name) {
    static char result[100];
    strcpy(result, "Hello, ");
    strcat(result, name);
    return result;
}

int main() {
    char* result = greet("Alice");
    printf("%s\\n", result);
    return 0;
}`
  },
  {
    name: 'Fibonacci',
    code: `// Fibonacci sequence
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    for (int i = 0; i < 10; i++) {
        printf("%d\\n", fibonacci(i));
    }
    return 0;
}`
  },
  {
    name: 'Struct Example',
    code: `// Struct example
#include <stdio.h>
#include <string.h>

typedef struct Person {
    char name[50];
    int age;
} Person;

Person createPerson(char* name, int age) {
    Person p;
    strcpy(p.name, name);
    p.age = age;
    return p;
}

int main() {
    Person p = createPerson("Alice", 25);
    printf("Hello, I'm %s\\n", p.name);
    return 0;
}`
  }
];

// Helper function to get examples based on language
export function getExamplesByLanguage(language) {
  switch (language.toLowerCase()) {
    case 'python':
      return PYTHON_EXAMPLES;
    case 'java':
      return JAVA_EXAMPLES;
    case 'c':
      return C_EXAMPLES;
    default:
      return PYTHON_EXAMPLES;
  }
}

// Backward compatibility
export const EXAMPLES = PYTHON_EXAMPLES;
