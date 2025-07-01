import { FileAnalysis, ParsedFunction, ParsedClass, ParsedImport, ParsedExport, ParsedInterface, ParsedProperty } from '../types';

export class CodeParser {
  static parseJavaScriptFile(content: string, path: string): FileAnalysis {
    const analysis: FileAnalysis = {
      path,
      category: this.categorizeFile(path, content),
      functions: [],
      classes: [],
      interfaces: [],
      imports: [],
      exports: [],
      comments: [],
      framework: this.detectFramework(content, path),
      isEntryPoint: this.isEntryPoint(path, content),
      complexity: this.assessComplexity(content)
    };

    // Parse functions with better detection
    this.parseFunctions(content, analysis);
    
    // Parse classes
    this.parseClasses(content, analysis);
    
    // Parse imports/exports
    this.parseImportsExports(content, analysis);
    
    // Parse meaningful comments
    this.parseComments(content, analysis);

    return analysis;
  }

  static parseTypeScriptFile(content: string, path: string): FileAnalysis {
    const analysis = this.parseJavaScriptFile(content, path);
    
    // Enhanced TypeScript parsing
    this.parseInterfaces(content, analysis);
    this.parseTypeDefinitions(content, analysis);
    this.enhanceWithTypeInfo(content, analysis);
    
    return analysis;
  }

  private static parseFunctions(content: string, analysis: FileAnalysis): void {
    // Regular function declarations
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      
      // Skip single-letter functions (likely minified)
      if (name.length === 1) continue;
      
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const params = this.parseParameters(match[2]);
      const returnType = match[3]?.trim();
      
      analysis.functions.push({
        name,
        parameters: params,
        returnType,
        line: lineNumber,
        isExported: match[0].includes('export'),
        isAsync: match[0].includes('async'),
        description: this.extractFunctionDescription(content, match.index)
      });
    }

    // Arrow functions
    const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+?))?\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const name = match[1];
      if (name.length === 1) continue;
      
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const params = this.parseParameters(match[2]);
      const returnType = match[3]?.trim();
      
      analysis.functions.push({
        name,
        parameters: params,
        returnType,
        line: lineNumber,
        isExported: match[0].includes('export'),
        isAsync: match[0].includes('async'),
        description: this.extractFunctionDescription(content, match.index)
      });
    }

    // React component functions
    if (analysis.framework === 'react') {
      this.parseReactComponents(content, analysis);
    }
  }

  private static parseClasses(content: string, analysis: FileAnalysis): void {
    const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*{/g;
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2];
      const implementsInterfaces = match[3]?.split(',').map(i => i.trim());
      
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const classContent = this.extractClassContent(content, match.index);
      const methods = this.parseClassMethods(classContent);
      const properties = this.parseClassProperties(classContent);
      
      analysis.classes.push({
        name: className,
        methods,
        properties,
        line: lineNumber,
        extends: extendsClass,
        implements: implementsInterfaces,
        description: this.extractClassDescription(content, match.index)
      });
    }
  }

  private static parseInterfaces(content: string, analysis: FileAnalysis): void {
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*{([^}]*)}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      const extendsInterfaces = match[2]?.split(',').map(i => i.trim());
      const body = match[3];
      
      const properties = this.parseInterfaceProperties(body);
      const methods = this.parseInterfaceMethods(body);
      
      analysis.interfaces.push({
        name,
        properties,
        methods,
        extends: extendsInterfaces
      });
    }
  }

  private static parseImportsExports(content: string, analysis: FileAnalysis): void {
    // ES6 imports
    const importRegex = /import\s+(?:(\w+)|{([^}]+)}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const defaultImport = match[1];
      const namedImports = match[2]?.split(',').map(i => i.trim());
      const namespaceImport = match[3];
      const source = match[4];
      
      let imports: string[] = [];
      if (defaultImport) imports.push(defaultImport);
      if (namedImports) imports.push(...namedImports);
      if (namespaceImport) imports.push(namespaceImport);
      
      analysis.imports.push({
        source,
        imports,
        type: 'import',
        isDefault: !!defaultImport,
        isNamespace: !!namespaceImport
      });
    }

    // Exports
    const exportRegex = /export\s+(?:(default)\s+)?(?:(function|class|const|let|var|interface|type)\s+)?(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const isDefault = !!match[1];
      const type = match[2] || 'variable';
      const name = match[3];
      
      analysis.exports.push({
        name,
        type: type as any,
        isDefault
      });
    }
  }

  private static parseComments(content: string, analysis: FileAnalysis): void {
    // JSDoc comments
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    let match;
    
    while ((match = jsdocRegex.exec(content)) !== null) {
      const comment = match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line.length > 0)
        .join(' ');
      
      if (comment.length > 20) {
        analysis.comments.push(comment);
      }
    }

    // Single line comments with meaningful content
    const singleLineRegex = /\/\/\s*(.+)/g;
    while ((match = singleLineRegex.exec(content)) !== null) {
      const comment = match[1].trim();
      if (comment.length > 20 && !comment.startsWith('TODO') && !comment.startsWith('FIXME')) {
        analysis.comments.push(comment);
      }
    }
  }

  private static parseReactComponents(content: string, analysis: FileAnalysis): void {
    // React functional components
    const componentRegex = /(?:export\s+)?(?:const|function)\s+([A-Z]\w+)\s*(?:=\s*)?(?:\([^)]*\))?\s*(?::\s*[^=]+)?\s*(?:=>|{)/g;
    let match;
    
    while ((match = componentRegex.exec(content)) !== null) {
      const name = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Check if it's actually a React component
      const componentContent = content.substring(match.index, match.index + 500);
      if (componentContent.includes('return') && (componentContent.includes('<') || componentContent.includes('jsx'))) {
        analysis.functions.push({
          name,
          parameters: ['props'],
          returnType: 'JSX.Element',
          line: lineNumber,
          isExported: match[0].includes('export'),
          description: `React component: ${name}`
        });
      }
    }
  }

  private static categorizeFile(path: string, content: string): FileAnalysis['category'] {
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    
    // Component files
    if (fileName.includes('component') || /\.(jsx|tsx)$/.test(fileName)) {
      return 'component';
    }
    
    // Service files
    if (fileName.includes('service') || fileName.includes('api') || fileName.includes('client')) {
      return 'service';
    }
    
    // Utility files
    if (fileName.includes('util') || fileName.includes('helper') || fileName.includes('lib')) {
      return 'utility';
    }
    
    // Type definition files
    if (fileName.includes('type') || fileName.includes('interface') || fileName.endsWith('.d.ts')) {
      return 'type';
    }
    
    // Style files
    if (/\.(css|scss|sass|less)$/.test(fileName)) {
      return 'style';
    }
    
    // Config files
    if (fileName.includes('config') || fileName.includes('setting')) {
      return 'config';
    }
    
    // Test files
    if (fileName.includes('test') || fileName.includes('spec')) {
      return 'test';
    }
    
    return 'other';
  }

  private static detectFramework(content: string, path: string): FileAnalysis['framework'] {
    if (content.includes('from \'react\'') || content.includes('from "react"')) return 'react';
    if (content.includes('from \'vue\'') || content.includes('<template>')) return 'vue';
    if (content.includes('@angular/') || content.includes('@Component')) return 'angular';
    if (content.includes('from \'svelte\'') || path.includes('.svelte')) return 'svelte';
    if (content.includes('express') || content.includes('app.listen')) return 'express';
    if (content.includes('next/') || path.includes('pages/') || path.includes('app/')) return 'nextjs';
    if (content.includes('require(') && !content.includes('import ')) return 'node';
    
    return undefined;
  }

  private static isEntryPoint(path: string, content: string): boolean {
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    
    // Common entry point files
    if (['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js'].includes(fileName)) {
      return true;
    }
    
    // Check for main function or app initialization
    if (content.includes('ReactDOM.render') || content.includes('createRoot') || content.includes('app.listen')) {
      return true;
    }
    
    return false;
  }

  private static assessComplexity(content: string): 'low' | 'medium' | 'high' {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*=\s*\(/g) || []).length;
    const conditionals = (content.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length;
    
    const complexityScore = lines * 0.1 + functions * 2 + conditionals * 1.5;
    
    if (complexityScore < 50) return 'low';
    if (complexityScore < 150) return 'medium';
    return 'high';
  }

  // Helper methods
  private static parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    return paramString.split(',').map(p => p.trim()).filter(p => p);
  }

  private static extractFunctionDescription(content: string, functionIndex: number): string {
    // Look for JSDoc comment before function
    const beforeFunction = content.substring(Math.max(0, functionIndex - 500), functionIndex);
    const jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
    
    if (jsdocMatch) {
      return jsdocMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line.length > 0)
        .join(' ')
        .substring(0, 100);
    }
    
    return '';
  }

  private static extractClassDescription(content: string, classIndex: number): string {
    return this.extractFunctionDescription(content, classIndex);
  }

  private static extractClassContent(content: string, startIndex: number): string {
    let braceCount = 0;
    let i = startIndex;
    
    while (i < content.length && content[i] !== '{') i++;
    const start = i;
    braceCount = 1;
    i++;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      else if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(start, i);
  }

  private static parseClassMethods(classContent: string): ParsedFunction[] {
    const methods: ParsedFunction[] = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;
    
    while ((match = methodRegex.exec(classContent)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push({
          name: match[1],
          parameters: this.parseParameters(match[2]),
          returnType: match[3]?.trim(),
          line: 0,
          isAsync: match[0].includes('async')
        });
      }
    }
    
    return methods;
  }

  private static parseClassProperties(classContent: string): ParsedProperty[] {
    const properties: ParsedProperty[] = [];
    const propertyRegex = /(?:(public|private|protected)\s+)?(?:(static)\s+)?(\w+)(?:\s*:\s*([^=;]+))?/g;
    let match;
    
    while ((match = propertyRegex.exec(classContent)) !== null) {
      properties.push({
        name: match[3],
        type: match[4]?.trim(),
        visibility: match[1] as any || 'public',
        isStatic: !!match[2]
      });
    }
    
    return properties;
  }

  private static parseInterfaceProperties(body: string): ParsedProperty[] {
    const properties: ParsedProperty[] = [];
    const lines = body.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.includes('(')) { // Not a method
        const match = trimmed.match(/(\w+)(?:\?)?:\s*([^;,]+)/);
        if (match) {
          properties.push({
            name: match[1],
            type: match[2].trim()
          });
        }
      }
    }
    
    return properties;
  }

  private static parseInterfaceMethods(body: string): ParsedFunction[] {
    const methods: ParsedFunction[] = [];
    const methodRegex = /(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^;,]+))?/g;
    let match;
    
    while ((match = methodRegex.exec(body)) !== null) {
      methods.push({
        name: match[1],
        parameters: this.parseParameters(match[2]),
        returnType: match[3]?.trim(),
        line: 0
      });
    }
    
    return methods;
  }

  private static parseTypeDefinitions(content: string, analysis: FileAnalysis): void {
    // Type aliases
    const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*([^;]+);/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      analysis.exports.push({
        name: match[1],
        type: 'type',
        isDefault: false
      });
    }
  }

  private static enhanceWithTypeInfo(content: string, analysis: FileAnalysis): void {
    // Enhance existing functions with better type information
    analysis.functions.forEach(func => {
      if (!func.returnType) {
        // Try to infer return type from function body
        const funcRegex = new RegExp(`function\\s+${func.name}\\s*\\([^)]*\\)\\s*{([^}]*)}`, 's');
        const match = content.match(funcRegex);
        if (match) {
          const body = match[1];
          if (body.includes('return ')) {
            // Simple return type inference
            if (body.includes('return true') || body.includes('return false')) {
              func.returnType = 'boolean';
            } else if (body.includes('return []') || body.includes('return [')) {
              func.returnType = 'array';
            } else if (body.includes('return {}') || body.includes('return {')) {
              func.returnType = 'object';
            }
          }
        }
      }
    });
  }
}