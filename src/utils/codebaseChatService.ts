import { ProjectAnalysis, FileAnalysis } from '../types';

interface ChatResponse {
  content: string;
  codeSnippets?: CodeSnippet[];
  relatedFiles?: string[];
  suggestions?: string[];
}

interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

export class CodebaseChatService {
  private analysis: ProjectAnalysis;
  private geminiApiKey: string;

  constructor(analysis: ProjectAnalysis) {
    this.analysis = analysis;
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async processQuery(query: string): Promise<ChatResponse> {
    try {
      console.log('Processing query:', query);
      console.log('Analysis data:', this.analysis);
      
      // First, try to answer with local analysis
      const localResponse = this.processLocalQuery(query);
      if (localResponse) {
        return localResponse;
      }

      // If we have Gemini API key, use AI for complex queries
      if (this.geminiApiKey) {
        return await this.processAIQuery(query);
      }

      // Fallback to pattern-based responses
      return this.processFallbackQuery(query);
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        content: "I encountered an error while processing your question. Please try asking something else about the codebase.",
        suggestions: [
          "What are the main components?",
          "Show me the project structure",
          "What dependencies are used?"
        ]
      };
    }
  }

  private processLocalQuery(query: string): ChatResponse | null {
    const lowerQuery = query.toLowerCase();

    // Component-related queries
    if (lowerQuery.includes('component') || lowerQuery.includes('components')) {
      return this.getComponentsInfo();
    }

    // API/endpoint queries
    if (lowerQuery.includes('api') || lowerQuery.includes('endpoint') || lowerQuery.includes('route')) {
      return this.getAPIInfo();
    }

    // Dependencies queries
    if (lowerQuery.includes('dependenc') || lowerQuery.includes('package') || lowerQuery.includes('library')) {
      return this.getDependenciesInfo();
    }

    // Architecture queries
    if (lowerQuery.includes('architecture') || lowerQuery.includes('structure') || lowerQuery.includes('organization') || lowerQuery.includes('folder')) {
      return this.getArchitectureInfo();
    }

    // File-specific queries
    if (lowerQuery.includes('file') && (lowerQuery.includes('find') || lowerQuery.includes('show') || lowerQuery.includes('where'))) {
      return this.findFiles(query);
    }

    // Function queries
    if (lowerQuery.includes('function') || lowerQuery.includes('method') || lowerQuery.includes('show me a specific')) {
      return this.getFunctionsInfo(query);
    }

    // Authentication queries
    if (lowerQuery.includes('auth') || lowerQuery.includes('login') || lowerQuery.includes('security')) {
      return this.getAuthInfo();
    }

    // Database queries
    if (lowerQuery.includes('database') || lowerQuery.includes('data') || lowerQuery.includes('model')) {
      return this.getDatabaseInfo();
    }

    // HTTP methods query
    if (lowerQuery.includes('http') && lowerQuery.includes('method')) {
      return this.getHTTPMethodsInfo();
    }

    // Specific function request
    if (lowerQuery.includes('show me') && (lowerQuery.includes('function') || lowerQuery.includes('code'))) {
      return this.getSpecificCodeInfo(query);
    }

    return null;
  }

  private getComponentsInfo(): ChatResponse {
    const components = this.analysis.files.filter(f => f.category === 'component');
    
    if (components.length === 0) {
      return {
        content: "## 🧩 Components Analysis\n\nNo React/Vue components were detected in this project. This could mean:\n\n• This is a backend-only project\n• Components are organized differently\n• The project uses a different framework\n\nLet me show you what files I did find...",
        suggestions: [
          "Show me all files in the project",
          "What type of project is this?",
          "Show me the main functions"
        ]
      };
    }

    let content = `## 🧩 Components in ${this.analysis.name}\n\n`;
    content += `Found **${components.length} components** in your project:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    components.slice(0, 6).forEach((component, index) => {
      const mainFunction = component.functions.find(f => f.name.match(/^[A-Z]/)) || component.functions[0];
      
      content += `### ${index + 1}. ${component.path.split('/').pop()}\n`;
      content += `**Path:** \`${component.path}\`\n`;
      
      if (mainFunction) {
        content += `**Main Function:** \`${mainFunction.name}\`\n`;
        content += `**Parameters:** ${mainFunction.parameters.length > 0 ? mainFunction.parameters.join(', ') : 'None'}\n`;
        
        if (mainFunction.returnType) {
          content += `**Returns:** ${mainFunction.returnType}\n`;
        }
        
        if (mainFunction.description) {
          content += `**Description:** ${mainFunction.description}\n`;
        }

        // Add actual code snippet
        if (index < 2 && component.content) {
          const functionCode = this.extractFunctionCode(component.content, mainFunction.name);
          if (functionCode) {
            codeSnippets.push({
              language: component.path.endsWith('.tsx') ? 'typescript' : 'javascript',
              code: functionCode,
              filename: component.path,
              description: `${mainFunction.name} component implementation`
            });
          }
        }
      }
      
      content += `**Functions:** ${component.functions.length}\n`;
      content += `**Complexity:** ${component.complexity || 'Medium'}\n`;
      
      // Show function names
      if (component.functions.length > 1) {
        const otherFunctions = component.functions.filter(f => f !== mainFunction).slice(0, 3);
        if (otherFunctions.length > 0) {
          content += `**Other Functions:** ${otherFunctions.map(f => f.name).join(', ')}\n`;
        }
      }
      
      content += '\n';
      relatedFiles.push(component.path);
    });

    if (components.length > 6) {
      content += `*... and ${components.length - 6} more components*\n\n`;
    }

    return {
      content,
      codeSnippets,
      relatedFiles: relatedFiles.slice(0, 5),
      suggestions: [
        "Show me the code for a specific component",
        "How are components organized?",
        "What props do these components use?",
        "Show me the most complex components"
      ]
    };
  }

  private getAPIInfo(): ChatResponse {
    const serviceFiles = this.analysis.files.filter(f => 
      f.category === 'service' || 
      f.path.includes('api') || 
      f.path.includes('route') ||
      f.path.includes('service') ||
      f.functions.some(func => 
        func.name.includes('api') || 
        func.name.includes('fetch') ||
        func.name.includes('get') ||
        func.name.includes('post') ||
        func.name.includes('create') ||
        func.name.includes('update') ||
        func.name.includes('delete')
      )
    );

    if (serviceFiles.length === 0) {
      // Check if there are any files with HTTP-related functions
      const httpFiles = this.analysis.files.filter(f => 
        f.content && (
          f.content.includes('fetch(') ||
          f.content.includes('axios') ||
          f.content.includes('http') ||
          f.content.includes('api')
        )
      );

      if (httpFiles.length === 0) {
        return {
          content: "## 🔗 API Analysis\n\nNo API endpoints or HTTP services were detected in this project.\n\nThis appears to be:\n• A frontend-only project without API calls\n• A project that uses external APIs differently\n• A backend project with routes organized differently\n\nLet me show you what services I can find...",
          suggestions: [
            "Show me all services",
            "What external libraries are used?",
            "Show me the project structure"
          ]
        };
      }

      return {
        content: `## 🔗 HTTP/API Usage Found\n\nFound **${httpFiles.length} files** with HTTP-related code:\n\n${httpFiles.map((file, i) => `${i + 1}. \`${file.path}\``).join('\n')}\n\nThese files contain HTTP requests or API-related functionality.`,
        relatedFiles: httpFiles.map(f => f.path),
        suggestions: [
          "Show me HTTP request code",
          "How is data fetching handled?",
          "What external APIs are used?"
        ]
      };
    }

    let content = `## 🔗 API & Services in ${this.analysis.name}\n\n`;
    content += `Found **${serviceFiles.length} service files** with API-related functionality:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    serviceFiles.slice(0, 5).forEach((service, index) => {
      content += `### ${index + 1}. ${service.path.split('/').pop()}\n`;
      content += `**Path:** \`${service.path}\`\n`;
      
      const apiFunctions = service.functions.filter(f => 
        f.name.includes('api') || 
        f.name.includes('fetch') || 
        f.name.includes('get') || 
        f.name.includes('post') ||
        f.name.includes('create') ||
        f.name.includes('update') ||
        f.name.includes('delete') ||
        f.name.includes('request')
      );

      if (apiFunctions.length > 0) {
        content += `**API Functions:**\n`;
        apiFunctions.slice(0, 4).forEach(func => {
          content += `• \`${func.name}(${func.parameters.join(', ')})\``;
          if (func.isAsync) content += ' *(async)*';
          if (func.returnType) content += ` → ${func.returnType}`;
          content += '\n';
        });

        // Add actual code snippet for the first service
        if (index === 0 && service.content && apiFunctions[0]) {
          const functionCode = this.extractFunctionCode(service.content, apiFunctions[0].name);
          if (functionCode) {
            codeSnippets.push({
              language: service.path.endsWith('.ts') ? 'typescript' : 'javascript',
              code: functionCode,
              filename: service.path,
              description: `${apiFunctions[0].name} API function implementation`
            });
          }
        }
      } else {
        content += `**All Functions:**\n`;
        service.functions.slice(0, 3).forEach(func => {
          content += `• \`${func.name}(${func.parameters.join(', ')})\`\n`;
        });
      }

      content += `**Total Functions:** ${service.functions.length}\n`;
      content += `**Exports:** ${service.exports.length}\n\n`;
      
      relatedFiles.push(service.path);
    });

    return {
      content,
      codeSnippets,
      relatedFiles,
      suggestions: [
        "Show me a specific API function",
        "How is error handling implemented?",
        "What HTTP methods are used?",
        "Show me authentication code"
      ]
    };
  }

  private getHTTPMethodsInfo(): ChatResponse {
    const allFunctions = this.analysis.files.flatMap(file => 
      file.functions.map(func => ({ ...func, filePath: file.path, fileContent: file.content }))
    );

    const httpMethods = new Set<string>();
    const httpFunctions: any[] = [];

    // Look for HTTP methods in function names and content
    allFunctions.forEach(func => {
      const funcName = func.name.toLowerCase();
      
      if (funcName.includes('get') && !funcName.includes('forget')) {
        httpMethods.add('GET');
        httpFunctions.push({ ...func, method: 'GET' });
      }
      if (funcName.includes('post')) {
        httpMethods.add('POST');
        httpFunctions.push({ ...func, method: 'POST' });
      }
      if (funcName.includes('put')) {
        httpMethods.add('PUT');
        httpFunctions.push({ ...func, method: 'PUT' });
      }
      if (funcName.includes('delete')) {
        httpMethods.add('DELETE');
        httpFunctions.push({ ...func, method: 'DELETE' });
      }
      if (funcName.includes('patch')) {
        httpMethods.add('PATCH');
        httpFunctions.push({ ...func, method: 'PATCH' });
      }
    });

    if (httpMethods.size === 0) {
      return {
        content: "## 🌐 HTTP Methods Analysis\n\nNo specific HTTP methods were detected in function names. This could mean:\n\n• The project doesn't use REST API patterns\n• HTTP methods are handled differently\n• This is a frontend-only project\n\nLet me show you what I found instead...",
        suggestions: [
          "Show me all functions",
          "What API calls are made?",
          "Show me service functions"
        ]
      };
    }

    let content = `## 🌐 HTTP Methods Used\n\n`;
    content += `Found **${httpMethods.size} HTTP methods** in your codebase:\n\n`;

    Array.from(httpMethods).forEach(method => {
      const methodFunctions = httpFunctions.filter(f => f.method === method);
      content += `### ${method} Methods (${methodFunctions.length})\n`;
      
      methodFunctions.slice(0, 3).forEach(func => {
        content += `• \`${func.name}(${func.parameters.join(', ')})\` in \`${func.filePath}\`\n`;
      });
      
      if (methodFunctions.length > 3) {
        content += `• ... and ${methodFunctions.length - 3} more\n`;
      }
      content += '\n';
    });

    const codeSnippets: CodeSnippet[] = [];
    
    // Add code snippet for the first HTTP function
    if (httpFunctions.length > 0 && httpFunctions[0].fileContent) {
      const functionCode = this.extractFunctionCode(httpFunctions[0].fileContent, httpFunctions[0].name);
      if (functionCode) {
        codeSnippets.push({
          language: httpFunctions[0].filePath.endsWith('.ts') ? 'typescript' : 'javascript',
          code: functionCode,
          filename: httpFunctions[0].filePath,
          description: `${httpFunctions[0].name} - ${httpFunctions[0].method} method implementation`
        });
      }
    }

    return {
      content,
      codeSnippets,
      relatedFiles: [...new Set(httpFunctions.map(f => f.filePath))].slice(0, 5),
      suggestions: [
        "Show me GET request implementations",
        "How are POST requests handled?",
        "Show me error handling for HTTP requests",
        "What authentication is used for API calls?"
      ]
    };
  }

  private getSpecificCodeInfo(query: string): ChatResponse {
    const searchTerm = this.extractSearchTerm(query);
    
    // Look for specific functions or components
    const allFunctions = this.analysis.files.flatMap(file => 
      file.functions.map(func => ({ ...func, filePath: file.path, fileContent: file.content }))
    );

    const matchingFunctions = allFunctions.filter(func => 
      func.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matchingFunctions.length === 0) {
      return {
        content: `## 🔍 Code Search Results\n\nNo functions found matching "${searchTerm}". \n\nAvailable functions include:\n${allFunctions.slice(0, 8).map(f => `• \`${f.name}\` in \`${f.filePath}\``).join('\n')}`,
        suggestions: [
          "Show me all functions",
          "Find React components",
          "Show me async functions",
          "What are the main functions?"
        ]
      };
    }

    let content = `## 🔍 Code for "${searchTerm}"\n\n`;
    content += `Found **${matchingFunctions.length} matching functions**:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    matchingFunctions.slice(0, 3).forEach((func, index) => {
      content += `### ${index + 1}. ${func.name}\n`;
      content += `**File:** \`${func.filePath}\`\n`;
      content += `**Parameters:** ${func.parameters.length > 0 ? func.parameters.join(', ') : 'None'}\n`;
      if (func.returnType) content += `**Returns:** ${func.returnType}\n`;
      if (func.isAsync) content += `**Type:** Async function\n`;
      if (func.description) content += `**Description:** ${func.description}\n`;
      content += '\n';

      // Add actual code implementation
      if (func.fileContent) {
        const functionCode = this.extractFunctionCode(func.fileContent, func.name);
        if (functionCode) {
          codeSnippets.push({
            language: func.filePath.endsWith('.ts') || func.filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
            code: functionCode,
            filename: func.filePath,
            description: `${func.name} function implementation`
          });
        }
      }

      relatedFiles.push(func.filePath);
    });

    return {
      content,
      codeSnippets,
      relatedFiles: [...new Set(relatedFiles)],
      suggestions: [
        "Show me how this function is used",
        "What functions call this?",
        "Show me similar functions",
        "Explain what this code does"
      ]
    };
  }

  private getDependenciesInfo(): ChatResponse {
    const { dependencies, devDependencies } = this.analysis;
    
    let content = `## 📦 Dependencies in ${this.analysis.name}\n\n`;
    
    if (dependencies.length > 0) {
      content += `### Production Dependencies (${dependencies.length})\n\n`;
      
      const categorized = this.categorizeDependencies(dependencies);
      
      Object.entries(categorized).forEach(([category, deps]) => {
        if (deps.length > 0) {
          content += `**${category}:**\n`;
          deps.slice(0, 5).forEach(dep => {
            content += `• **${dep.name}** (${dep.version})`;
            if (dep.description) {
              content += ` - ${dep.description}`;
            }
            content += '\n';
          });
          content += '\n';
        }
      });
    }

    if (devDependencies.length > 0) {
      content += `### Development Dependencies (${devDependencies.length})\n\n`;
      devDependencies.slice(0, 8).forEach(dep => {
        content += `• **${dep.name}** (${dep.version}) - ${dep.description || dep.category}\n`;
      });
    }

    if (this.analysis.architecture.buildTool) {
      content += `\n### Build Tool\n**${this.analysis.architecture.buildTool}** is used for building and development.\n`;
    }

    return {
      content,
      suggestions: [
        "What is each dependency used for?",
        "Show me how dependencies are imported",
        "What's the purpose of each library?",
        "How can I update dependencies?"
      ]
    };
  }

  private getArchitectureInfo(): ChatResponse {
    const { architecture, type, files } = this.analysis;
    
    let content = `## 🏗️ Project Structure: ${this.analysis.name}\n\n`;
    
    content += `**Project Type:** ${type.charAt(0).toUpperCase() + type.slice(1)} Application\n\n`;
    
    // File organization
    content += `### 📁 File Organization\n`;
    const filesByCategory = this.groupFilesByCategory();
    
    Object.entries(filesByCategory).forEach(([category, categoryFiles]) => {
      if (categoryFiles.length > 0) {
        content += `**${category.charAt(0).toUpperCase() + category.slice(1)} Files (${categoryFiles.length}):**\n`;
        categoryFiles.slice(0, 5).forEach(file => {
          content += `• \`${file.path}\`\n`;
        });
        if (categoryFiles.length > 5) {
          content += `• ... and ${categoryFiles.length - 5} more\n`;
        }
        content += '\n';
      }
    });
    
    if (architecture.patterns.length > 0) {
      content += `### 🎯 Architecture Patterns\n`;
      architecture.patterns.forEach(pattern => {
        content += `• ${pattern}\n`;
      });
      content += '\n';
    }

    if (architecture.technologies.length > 0) {
      content += `### ⚡ Core Technologies\n`;
      architecture.technologies.forEach(tech => {
        content += `• ${tech}\n`;
      });
      content += '\n';
    }

    content += `### 📊 Project Statistics\n`;
    content += `• **Total files analyzed:** ${files.length}\n`;
    content += `• **Components:** ${files.filter(f => f.category === 'component').length}\n`;
    content += `• **Services:** ${files.filter(f => f.category === 'service').length}\n`;
    content += `• **Utilities:** ${files.filter(f => f.category === 'utility').length}\n`;
    content += `• **Configuration files:** ${files.filter(f => f.category === 'config').length}\n`;
    content += `• **Other files:** ${files.filter(f => f.category === 'other').length}\n\n`;

    if (this.analysis.entryPoints.length > 0) {
      content += `### 🚪 Entry Points\n`;
      this.analysis.entryPoints.forEach(entry => {
        content += `• \`${entry}\`\n`;
      });
    }

    return {
      content,
      suggestions: [
        "Show me files in a specific folder",
        "How are components organized?",
        "What design patterns are used?",
        "Show me the main entry points"
      ]
    };
  }

  private findFiles(query: string): ChatResponse {
    const searchTerm = this.extractSearchTerm(query);
    const matchingFiles = this.analysis.files.filter(file => 
      file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.functions.some(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      file.classes.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (matchingFiles.length === 0) {
      return {
        content: `## 🔍 File Search Results\n\nNo files found matching "${searchTerm}".\n\n**Available files:**\n${this.analysis.files.slice(0, 10).map(f => `• \`${f.path}\``).join('\n')}`,
        suggestions: [
          "Show me all components",
          "List all files",
          "What's in the src folder?"
        ]
      };
    }

    let content = `## 🔍 Files matching "${searchTerm}"\n\n`;
    content += `Found **${matchingFiles.length} files**:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    matchingFiles.slice(0, 6).forEach((file, index) => {
      content += `### ${index + 1}. ${file.path.split('/').pop()}\n`;
      content += `**Path:** \`${file.path}\`\n`;
      content += `**Category:** ${file.category}\n`;
      content += `**Functions:** ${file.functions.length}\n`;
      content += `**Classes:** ${file.classes.length}\n`;
      
      if (file.functions.length > 0) {
        const relevantFunction = file.functions.find(f => 
          f.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || file.functions[0];
        
        content += `**Main Function:** \`${relevantFunction.name}(${relevantFunction.parameters.join(', ')})\`\n`;

        // Add code snippet for first matching file
        if (index === 0 && file.content) {
          const functionCode = this.extractFunctionCode(file.content, relevantFunction.name);
          if (functionCode) {
            codeSnippets.push({
              language: file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 'javascript',
              code: functionCode,
              filename: file.path,
              description: `${relevantFunction.name} function from ${file.path}`
            });
          }
        }
      }
      
      content += '\n';
      relatedFiles.push(file.path);
    });

    return {
      content,
      codeSnippets,
      relatedFiles,
      suggestions: [
        `Show me the code in ${matchingFiles[0]?.path}`,
        "Find functions in this file",
        "What imports does this file use?",
        "Show me similar files"
      ]
    };
  }

  private getFunctionsInfo(query: string): ChatResponse {
    const searchTerm = this.extractSearchTerm(query);
    const allFunctions = this.analysis.files.flatMap(file => 
      file.functions.map(func => ({ ...func, filePath: file.path, fileContent: file.content }))
    );

    let matchingFunctions = allFunctions;
    if (searchTerm) {
      matchingFunctions = allFunctions.filter(func => 
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (matchingFunctions.length === 0) {
      return {
        content: `## ⚡ Function Search\n\nNo functions found matching "${searchTerm}".\n\n**Available functions:**\n${allFunctions.slice(0, 10).map(f => `• \`${f.name}\` in \`${f.filePath}\``).join('\n')}`,
        suggestions: [
          "Show me all functions",
          "Find React components",
          "Show me async functions",
          "What are the main functions?"
        ]
      };
    }

    let content = `## ⚡ Functions${searchTerm ? ` matching "${searchTerm}"` : ''}\n\n`;
    content += `Found **${matchingFunctions.length} functions**:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    matchingFunctions.slice(0, 6).forEach((func, index) => {
      content += `### ${index + 1}. ${func.name}\n`;
      content += `**File:** \`${func.filePath}\`\n`;
      content += `**Parameters:** ${func.parameters.length > 0 ? func.parameters.join(', ') : 'None'}\n`;
      if (func.returnType) content += `**Returns:** ${func.returnType}\n`;
      if (func.isAsync) content += `**Type:** Async function\n`;
      if (func.isExported) content += `**Exported:** Yes\n`;
      if (func.description) content += `**Description:** ${func.description}\n`;
      content += '\n';

      // Add code snippet for first few functions
      if (index < 2 && func.fileContent) {
        const functionCode = this.extractFunctionCode(func.fileContent, func.name);
        if (functionCode) {
          codeSnippets.push({
            language: func.filePath.endsWith('.ts') || func.filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
            code: functionCode,
            filename: func.filePath,
            description: `${func.name} function implementation`
          });
        }
      }

      relatedFiles.push(func.filePath);
    });

    if (matchingFunctions.length > 6) {
      content += `*... and ${matchingFunctions.length - 6} more functions*\n`;
    }

    return {
      content,
      codeSnippets,
      relatedFiles: [...new Set(relatedFiles)].slice(0, 5),
      suggestions: [
        "Show me the implementation of a specific function",
        "Find all async functions",
        "What functions are exported?",
        "Show me React component functions"
      ]
    };
  }

  private getAuthInfo(): ChatResponse {
    const authFiles = this.analysis.files.filter(file => 
      file.path.toLowerCase().includes('auth') ||
      file.functions.some(f => 
        f.name.toLowerCase().includes('auth') ||
        f.name.toLowerCase().includes('login') ||
        f.name.toLowerCase().includes('register') ||
        f.name.toLowerCase().includes('token')
      )
    );

    if (authFiles.length === 0) {
      return {
        content: "## 🔐 Authentication Analysis\n\nNo authentication-related code was detected in this project.\n\nThis might mean:\n• Authentication is handled externally (e.g., Auth0, Firebase)\n• Auth code is in a different location\n• This is a public/non-authenticated application\n• Authentication logic is embedded in other files",
        suggestions: [
          "Show me all services",
          "Find user-related code",
          "What security measures are in place?",
          "Show me login-related functions"
        ]
      };
    }

    let content = `## 🔐 Authentication & Security\n\n`;
    content += `Found **${authFiles.length} files** with authentication logic:\n\n`;

    const codeSnippets: CodeSnippet[] = [];
    const relatedFiles: string[] = [];

    authFiles.forEach((file, index) => {
      content += `### ${index + 1}. ${file.path.split('/').pop()}\n`;
      content += `**Path:** \`${file.path}\`\n`;
      
      const authFunctions = file.functions.filter(f => 
        f.name.toLowerCase().includes('auth') ||
        f.name.toLowerCase().includes('login') ||
        f.name.toLowerCase().includes('register') ||
        f.name.toLowerCase().includes('token') ||
        f.name.toLowerCase().includes('verify') ||
        f.name.toLowerCase().includes('sign')
      );

      if (authFunctions.length > 0) {
        content += `**Auth Functions:**\n`;
        authFunctions.forEach(func => {
          content += `• \`${func.name}(${func.parameters.join(', ')})\``;
          if (func.isAsync) content += ' *(async)*';
          if (func.returnType) content += ` → ${func.returnType}`;
          content += '\n';
        });

        // Add code snippet for main auth file
        if (index === 0 && file.content && authFunctions[0]) {
          const functionCode = this.extractFunctionCode(file.content, authFunctions[0].name);
          if (functionCode) {
            codeSnippets.push({
              language: file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 'javascript',
              code: functionCode,
              filename: file.path,
              description: `${authFunctions[0].name} authentication function`
            });
          }
        }
      } else {
        content += `**All Functions:**\n`;
        file.functions.slice(0, 3).forEach(func => {
          content += `• \`${func.name}(${func.parameters.join(', ')})\`\n`;
        });
      }

      content += `**Total Functions:** ${file.functions.length}\n\n`;
      relatedFiles.push(file.path);
    });

    // Check for auth-related dependencies
    const authDeps = this.analysis.dependencies.filter(dep => 
      dep.name.toLowerCase().includes('auth') ||
      dep.name.toLowerCase().includes('jwt') ||
      dep.name.toLowerCase().includes('passport') ||
      dep.name.toLowerCase().includes('session') ||
      dep.name.toLowerCase().includes('firebase') ||
      dep.name.toLowerCase().includes('supabase')
    );

    if (authDeps.length > 0) {
      content += `### 📦 Authentication Dependencies\n`;
      authDeps.forEach(dep => {
        content += `• **${dep.name}** (${dep.version}) - ${dep.description || 'Authentication library'}\n`;
      });
    }

    return {
      content,
      codeSnippets,
      relatedFiles,
      suggestions: [
        "How does login work?",
        "Show me password validation",
        "What authentication method is used?",
        "How are tokens handled?"
      ]
    };
  }

  private getDatabaseInfo(): ChatResponse {
    const dbFiles = this.analysis.files.filter(file => 
      file.path.toLowerCase().includes('model') ||
      file.path.toLowerCase().includes('schema') ||
      file.path.toLowerCase().includes('database') ||
      file.path.toLowerCase().includes('db') ||
      file.path.toLowerCase().includes('prisma') ||
      file.functions.some(f => 
        f.name.toLowerCase().includes('create') ||
        f.name.toLowerCase().includes('find') ||
        f.name.toLowerCase().includes('update') ||
        f.name.toLowerCase().includes('delete') ||
        f.name.toLowerCase().includes('save') ||
        f.name.toLowerCase().includes('query')
      )
    );

    const dbDeps = this.analysis.dependencies.filter(dep => 
      dep.name.toLowerCase().includes('prisma') ||
      dep.name.toLowerCase().includes('mongoose') ||
      dep.name.toLowerCase().includes('sequelize') ||
      dep.name.toLowerCase().includes('typeorm') ||
      dep.name.toLowerCase().includes('knex') ||
      dep.name.toLowerCase().includes('mysql') ||
      dep.name.toLowerCase().includes('postgres') ||
      dep.name.toLowerCase().includes('mongodb') ||
      dep.name.toLowerCase().includes('sqlite') ||
      dep.name.toLowerCase().includes('supabase')
    );

    if (dbFiles.length === 0 && dbDeps.length === 0) {
      return {
        content: "## 💾 Database Analysis\n\nNo database-related code or dependencies were detected.\n\nThis might be:\n• A frontend-only application\n• Using external database services\n• Database logic in a different location\n• Using a headless CMS or external API",
        suggestions: [
          "Show me all services",
          "What external APIs are used?",
          "How is data managed?",
          "Show me data fetching code"
        ]
      };
    }

    let content = `## 💾 Database & Data Management\n\n`;

    if (dbDeps.length > 0) {
      content += `### 📦 Database Dependencies\n`;
      dbDeps.forEach(dep => {
        content += `• **${dep.name}** (${dep.version}) - ${dep.description || 'Database library'}\n`;
      });
      content += '\n';
    }

    if (dbFiles.length > 0) {
      content += `### 📁 Database Files (${dbFiles.length})\n\n`;

      const codeSnippets: CodeSnippet[] = [];
      const relatedFiles: string[] = [];

      dbFiles.slice(0, 5).forEach((file, index) => {
        content += `#### ${index + 1}. ${file.path.split('/').pop()}\n`;
        content += `**Path:** \`${file.path}\`\n`;
        
        const dbFunctions = file.functions.filter(f => 
          f.name.toLowerCase().includes('create') ||
          f.name.toLowerCase().includes('find') ||
          f.name.toLowerCase().includes('update') ||
          f.name.toLowerCase().includes('delete') ||
          f.name.toLowerCase().includes('save') ||
          f.name.toLowerCase().includes('get') ||
          f.name.toLowerCase().includes('fetch') ||
          f.name.toLowerCase().includes('query')
        );

        if (dbFunctions.length > 0) {
          content += `**Data Operations:**\n`;
          dbFunctions.slice(0, 4).forEach(func => {
            content += `• \`${func.name}(${func.parameters.join(', ')})\``;
            if (func.isAsync) content += ' *(async)*';
            content += '\n';
          });

          // Add code snippet for first database file
          if (index === 0 && file.content && dbFunctions[0]) {
            const functionCode = this.extractFunctionCode(file.content, dbFunctions[0].name);
            if (functionCode) {
              codeSnippets.push({
                language: file.path.endsWith('.ts') ? 'typescript' : 'javascript',
                code: functionCode,
                filename: file.path,
                description: `${dbFunctions[0].name} database operation`
              });
            }
          }
        } else {
          content += `**All Functions:**\n`;
          file.functions.slice(0, 3).forEach(func => {
            content += `• \`${func.name}(${func.parameters.join(', ')})\`\n`;
          });
        }

        content += `**Total Functions:** ${file.functions.length}\n\n`;
        relatedFiles.push(file.path);
      });

      return {
        content,
        codeSnippets,
        relatedFiles,
        suggestions: [
          "Show me database models",
          "How is data validation handled?",
          "What database operations are available?",
          "Show me query examples"
        ]
      };
    }

    return {
      content,
      suggestions: [
        "Show me data-related services",
        "How is external data fetched?",
        "What APIs are used for data?"
      ]
    };
  }

  private async processAIQuery(query: string): Promise<ChatResponse> {
    try {
      const prompt = this.createAIPrompt(query);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return {
        content: content,
        suggestions: [
          "Can you explain this in more detail?",
          "Show me related code examples",
          "What are the best practices for this?",
          "How can I improve this code?"
        ]
      };

    } catch (error) {
      console.error('AI query error:', error);
      return this.processFallbackQuery(query);
    }
  }

  private createAIPrompt(query: string): string {
    const projectSummary = {
      name: this.analysis.name,
      type: this.analysis.type,
      fileCount: this.analysis.files.length,
      components: this.analysis.files.filter(f => f.category === 'component').length,
      services: this.analysis.files.filter(f => f.category === 'service').length,
      dependencies: this.analysis.dependencies.slice(0, 10).map(d => d.name),
      architecture: this.analysis.architecture
    };

    return `
You are a helpful codebase assistant for a ${this.analysis.type} project called "${this.analysis.name}".

Project Summary:
${JSON.stringify(projectSummary, null, 2)}

User Question: ${query}

Please provide a helpful, detailed answer about this codebase. Focus on:
1. Being specific to this project
2. Providing actionable insights
3. Explaining technical concepts clearly
4. Suggesting next steps or related questions

Keep your response concise but informative (under 500 words).
`;
  }

  private processFallbackQuery(query: string): ChatResponse {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
      return {
        content: `## 🤖 How I Can Help\n\nI can help you understand your **${this.analysis.name}** codebase! Here's what I can do:\n\n• 🔍 **Find specific files, functions, or components**\n• 📊 **Explain project architecture and structure**\n• 🔗 **Show API endpoints and services**\n• 📦 **List dependencies and their purposes**\n• 🔐 **Find authentication and security code**\n• 💾 **Explain database operations**\n• ⚡ **Show function implementations**\n• 🧩 **Analyze component relationships**\n\nJust ask me anything about your code!`,
        suggestions: [
          "Show me the main components",
          "What APIs does this project use?",
          "Explain the project structure",
          "Find authentication code"
        ]
      };
    }

    if (lowerQuery.includes('improve') || lowerQuery.includes('optimize') || lowerQuery.includes('best practice')) {
      return {
        content: `## 🚀 Improvement Suggestions for ${this.analysis.name}\n\nBased on your codebase analysis:\n\n• **Code Organization**: ${this.analysis.files.length} files analyzed - consider grouping related functionality\n• **Dependencies**: ${this.analysis.dependencies.length} production dependencies - review for unused packages\n• **Architecture**: Using ${this.analysis.type} - ensure following framework best practices\n• **Testing**: Add comprehensive test coverage for critical components\n• **Documentation**: Keep code comments and README updated\n\nWould you like specific suggestions for any area?`,
        suggestions: [
          "How can I improve performance?",
          "What security improvements can I make?",
          "How should I organize my code better?",
          "What testing strategy should I use?"
        ]
      };
    }

    return {
      content: `## 🤔 I'm not sure about that...\n\nI didn't understand your question about the codebase. Try asking me about:\n\n• **Components**: "Show me the main components"\n• **APIs**: "What API endpoints are available?"\n• **Structure**: "Explain the project organization"\n• **Dependencies**: "What libraries are used?"\n• **Functions**: "Find functions related to [topic]"\n• **Files**: "Show me files containing [term]"\n• **Code**: "Show me the code for [function name]"`,
      suggestions: [
        "Show me the project structure",
        "What are the main components?",
        "List all API endpoints",
        "What dependencies are used?"
      ]
    };
  }

  // Helper methods
  private extractSearchTerm(query: string): string {
    const words = query.toLowerCase().split(' ');
    const stopWords = ['show', 'me', 'the', 'find', 'where', 'is', 'are', 'what', 'how', 'file', 'files', 'function', 'functions', 'a', 'specific'];
    return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ') || '';
  }

  private extractFunctionCode(content: string, functionName: string): string {
    try {
      // Try to find the function definition and extract its code
      const patterns = [
        new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{`, 'i'),
        new RegExp(`const\\s+${functionName}\\s*=\\s*\\([^)]*\\)\\s*=>`, 'i'),
        new RegExp(`${functionName}\\s*:\\s*\\([^)]*\\)\\s*=>`, 'i'),
        new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?function\\s+${functionName}`, 'i'),
        new RegExp(`const\\s+${functionName}\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>`, 'i')
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const startIndex = match.index!;
          
          // Look for JSDoc comments before the function
          const beforeFunction = content.substring(Math.max(0, startIndex - 300), startIndex);
          const commentMatch = beforeFunction.match(/\/\*\*[\s\S]*?\*\/\s*$/);
          const comment = commentMatch ? commentMatch[0] : '';
          
          // Extract function body
          let braceCount = 0;
          let inFunction = false;
          let functionEnd = startIndex;
          
          for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            if (char === '{') {
              braceCount++;
              inFunction = true;
            } else if (char === '}') {
              braceCount--;
              if (inFunction && braceCount === 0) {
                functionEnd = i + 1;
                break;
              }
            }
          }
          
          const functionCode = content.substring(startIndex, functionEnd);
          return comment + functionCode;
        }
      }

      // Fallback: return first 600 characters of content
      return content.substring(0, 600) + (content.length > 600 ? '\n// ... rest of file' : '');
    } catch (error) {
      console.error('Error extracting function code:', error);
      return '';
    }
  }

  private categorizeDependencies(dependencies: any[]) {
    return {
      'Frameworks': dependencies.filter(d => d.category === 'framework'),
      'UI Libraries': dependencies.filter(d => d.category === 'ui'),
      'Utilities': dependencies.filter(d => d.category === 'utility'),
      'Build Tools': dependencies.filter(d => d.category === 'build'),
      'Testing': dependencies.filter(d => d.category === 'testing'),
      'Other': dependencies.filter(d => d.category === 'other')
    };
  }

  private groupFilesByCategory() {
    const grouped: { [key: string]: FileAnalysis[] } = {};
    
    this.analysis.files.forEach(file => {
      const category = file.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(file);
    });
    
    return grouped;
  }
}