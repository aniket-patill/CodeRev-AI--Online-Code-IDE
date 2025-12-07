export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  c: "10.2.0",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
  cpp: "10.2.0",
};

export const CODE_SNIPPETS = {
    javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
    typescript: `\ntype Params = {\n\tname: string;\n}\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
    c: `\n#include <stdio.h>\n\nint main() {\n\tchar name[100];\n\tprintf("Enter your name: ");\n\tscanf("%s", name);\n\tprintf("Hello, %s!\\n", name);\n\treturn 0;\n}\n`,
    python: `\nname = input("Enter your name: ")\nprint("Hello, " + name + "!")\n`,
    java: `\nimport java.util.Scanner;\n\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tScanner scanner = new Scanner(System.in);\n\t\tSystem.out.print("Enter your name: ");\n\t\tString name = scanner.nextLine();\n\t\tSystem.out.println("Hello, " + name + "!");\n\t}\n}\n`,
    csharp:
      'using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.Write("Enter your name: ");\n\t\t\tstring name = Console.ReadLine();\n\t\t\tConsole.WriteLine("Hello, " + name + "!");\n\t\t}\n\t}\n}\n',
    php: "<?php\n\n$name = readline('Enter your name: ');\necho 'Hello, ' . $name . '!';\n",
    cpp: `\n#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n\tstring name;\n\tcout << "Enter your name: ";\n\tgetline(cin, name);\n\tcout << "Hello, " << name << "!" << endl;\n\treturn 0;\n}\n`,

  };