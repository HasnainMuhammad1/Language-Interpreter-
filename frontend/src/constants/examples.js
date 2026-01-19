/**
 * Python code examples for the language interpreter
 */

export const EXAMPLES = [
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
