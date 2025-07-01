import { ProjectAnalysis, FileAnalysis, WorkflowAnalysisData, RouteInfo, UserInteraction, DataOperation, AuthenticationFlow, BusinessLogic } from '../types';

export class WorkflowAnalyzer {
  private files: FileAnalysis[];
  private projectAnalysis: ProjectAnalysis;

  constructor(projectAnalysis: ProjectAnalysis) {
    this.files = projectAnalysis.files;
    this.projectAnalysis = projectAnalysis;
  }

  async analyzeProject(): Promise<WorkflowAnalysisData> {
    console.log('🔍 Starting comprehensive workflow analysis...');
    
    try {
      // Step 1: Extract all routes and endpoints with full code
      const routes = await this.extractRoutes();
      console.log(`📍 Found ${routes.length} routes/endpoints`);
      
      // Step 2: Analyze frontend components and user interactions with code
      const userInteractions = await this.analyzeUserInteractions();
      console.log(`🎯 Analyzed ${userInteractions.length} user interaction patterns`);
      
      // Step 3: Map database operations and data flow with queries
      const dataOperations = await this.analyzeDataOperations();
      console.log(`💾 Identified ${dataOperations.length} data operations`);
      
      // Step 4: Identify authentication and authorization patterns with code
      const authFlow = await this.analyzeAuthenticationFlow();
      console.log(`🔐 Analyzed authentication flow with ${authFlow.methods.length} methods`);
      
      // Step 5: Extract business logic and validation rules with functions
      const businessLogic = await this.extractBusinessLogic();
      console.log(`⚙️ Extracted business logic from ${businessLogic.length} files`);
      
      return {
        routes,
        userInteractions,
        dataOperations,
        authFlow,
        businessLogic
      };
    } catch (error) {
      console.error('Error in workflow analysis:', error);
      // Return empty structure on error
      return {
        routes: [],
        userInteractions: [],
        dataOperations: [],
        authFlow: { methods: [], providers: [], flows: [], middleware: [] },
        businessLogic: []
      };
    }
  }

  private async extractRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    
    try {
      for (const file of this.files) {
        if (this.isRouteFile(file)) {
          const content = this.getFileContent(file);
          
          // Parse Express.js routes with full handler code
          const expressRoutes = this.parseExpressRoutes(content, file.path);
          
          // Parse Next.js API routes with function implementations
          const nextRoutes = this.parseNextRoutes(content, file.path);
          
          // Parse React Router routes
          const reactRoutes = this.parseReactRoutes(content, file.path);
          
          routes.push(...expressRoutes, ...nextRoutes, ...reactRoutes);
        }
      }
    } catch (error) {
      console.error('Error extracting routes:', error);
    }
    
    return routes;
  }

  private getFileContent(file: FileAnalysis): string {
    try {
      // First try to get content from the file analysis
      if (file.content) {
        return file.content;
      }
      
      // Fallback: try to find the file in project structure
      const projectFile = this.findProjectFile(file.path);
      return projectFile?.content || '';
    } catch (error) {
      console.error(`Error getting content for file ${file.path}:`, error);
      return '';
    }
  }

  private findProjectFile(path: string): any {
    try {
      const findInStructure = (node: any, targetPath: string): any => {
        if (!node) return null;
        
        if (node.path === targetPath && node.type === 'file') {
          return node;
        }
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            const result = findInStructure(child, targetPath);
            if (result) return result;
          }
        }
        return null;
      };
      
      return findInStructure(this.projectAnalysis.structure, path);
    } catch (error) {
      console.error(`Error finding project file ${path}:`, error);
      return null;
    }
  }

  private isRouteFile(file: FileAnalysis): boolean {
    try {
      const path = file.path.toLowerCase();
      const content = this.getFileContent(file).toLowerCase();
      
      return (
        path.includes('/api/') ||
        path.includes('/routes/') ||
        path.includes('router') ||
        path.includes('route') ||
        content.includes('app.get') ||
        content.includes('app.post') ||
        content.includes('router.') ||
        content.includes('route(') ||
        content.includes('createbrowserrouter') ||
        content.includes('userouter') ||
        content.includes('express')
      );
    } catch (error) {
      console.error(`Error checking if file is route file ${file.path}:`, error);
      return false;
    }
  }

  private parseExpressRoutes(content: string, filePath: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    
    try {
      const routePatterns = [
        /app\.(get|post|put|delete|patch)\(['"`](.+?)['"`]/g,
        /router\.(get|post|put|delete|patch)\(['"`](.+?)['"`]/g,
        /\.route\(['"`](.+?)['"`]\)\.(get|post|put|delete|patch)/g
      ];

      routePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const method = (match[1] || match[3]).toUpperCase();
          const path = match[2] || match[1];
          
          routes.push({
            method: method,
            path: path,
            type: 'Express Route',
            middleware: this.extractMiddleware(content, match.index),
            handler: this.extractHandlerLogic(content, match.index),
            fullCode: this.extractFullRouteCode(content, match.index, match[0].length),
            description: this.extractRouteDescription(content, match.index)
          });
        }
      });
    } catch (error) {
      console.error(`Error parsing Express routes in ${filePath}:`, error);
    }

    return routes;
  }

  private parseNextRoutes(content: string, filePath: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    
    try {
      // Next.js API routes with full function code
      if (filePath.includes('/api/')) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        methods.forEach(method => {
          const functionRegex = new RegExp(
            `export\\s+(?:async\\s+)?function\\s+${method}\\s*\\([^)]*\\)\\s*{`
          );
          
          if (functionRegex.test(content)) {
            routes.push({
              method: method,
              path: this.convertNextPathToRoute(filePath),
              type: 'Next.js API',
              handler: this.extractNextHandlerLogic(content, method),
              description: this.extractFunctionDescription(content, method)
            });
          }
        });
      }
    } catch (error) {
      console.error(`Error parsing Next.js routes in ${filePath}:`, error);
    }

    return routes;
  }

  private parseReactRoutes(content: string, filePath: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    
    try {
      // React Router routes with component code
      const routePatterns = [
        /<Route\s+path=['"`]([^'"`]+)['"`]/g,
        /path:\s*['"`]([^'"`]+)['"`]/g
      ];

      routePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          routes.push({
            method: 'GET',
            path: match[1],
            type: 'React Route',
            description: `Frontend route: ${match[1]}`
          });
        }
      });
    } catch (error) {
      console.error(`Error parsing React routes in ${filePath}:`, error);
    }

    return routes;
  }

  private async analyzeUserInteractions(): Promise<UserInteraction[]> {
    const interactions: UserInteraction[] = [];
    
    try {
      for (const file of this.files) {
        if (this.isFrontendFile(file)) {
          const content = this.getFileContent(file);
          
          // Extract React components with full code
          const components = this.parseReactComponents(content);
          
          // Extract form submissions with validation logic
          const forms = this.extractForms(content);
          
          // Extract button clicks and event handlers with full functions
          const events = this.extractEventHandlers(content);
          
          // Extract navigation patterns with routing logic
          const navigation = this.extractNavigation(content);
          
          if (components.length > 0 || forms.length > 0 || events.length > 0 || navigation.length > 0) {
            interactions.push({
              file: file.path,
              components,
              forms,
              events,
              navigation
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing user interactions:', error);
    }
    
    return interactions;
  }

  private isFrontendFile(file: FileAnalysis): boolean {
    try {
      const path = file.path.toLowerCase();
      const content = this.getFileContent(file).toLowerCase();
      
      return (
        file.category === 'component' ||
        path.includes('.tsx') ||
        path.includes('.jsx') ||
        path.includes('component') ||
        content.includes('react') ||
        content.includes('usestate') ||
        content.includes('useeffect') ||
        content.includes('jsx') ||
        (content.includes('return (') && content.includes('<'))
      );
    } catch (error) {
      console.error(`Error checking if file is frontend file ${file.path}:`, error);
      return false;
    }
  }

  private parseReactComponents(content: string): any[] {
    const components: any[] = [];
    
    try {
      // Extract functional components with full implementation
      const functionalComponentRegex = /(?:export\s+(?:default\s+)?)?(?:const|function)\s+(\w+)\s*=?\s*\(([^)]*)\)\s*(?::\s*\w+\s*)?=>/g;
      
      let match;
      while ((match = functionalComponentRegex.exec(content)) !== null) {
        const componentName = match[1];
        if (componentName && componentName[0] === componentName[0].toUpperCase()) {
          components.push({
            name: componentName,
            props: this.parseProps(match[2] || ''),
            jsx: this.extractJSXElements(content),
            hooks: this.extractHooks(content),
            eventHandlers: this.extractComponentEventHandlers(content)
          });
        }
      }
    } catch (error) {
      console.error('Error parsing React components:', error);
    }
    
    return components;
  }

  private extractForms(content: string): any[] {
    const forms: any[] = [];
    
    try {
      const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/g;
      
      let match;
      while ((match = formRegex.exec(content)) !== null) {
        const formContent = match[1];
        forms.push({
          fields: this.extractFormFields(formContent),
          submitHandler: this.extractSubmitHandler(content, match.index),
          validation: this.extractValidation(formContent)
        });
      }
    } catch (error) {
      console.error('Error extracting forms:', error);
    }
    
    return forms;
  }

  private extractEventHandlers(content: string): any[] {
    const events: any[] = [];
    
    try {
      const eventPatterns = [
        /onClick\s*=\s*{([^}]+)}/g,
        /onSubmit\s*=\s*{([^}]+)}/g,
        /onChange\s*=\s*{([^}]+)}/g
      ];

      eventPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const eventType = pattern.source.match(/on(\w+)/)?.[1] || 'unknown';
          events.push({
            name: match[1].trim(),
            type: eventType,
            trigger: `User ${eventType.toLowerCase()}`,
            action: match[1].trim()
          });
        }
      });
    } catch (error) {
      console.error('Error extracting event handlers:', error);
    }

    return events;
  }

  private extractNavigation(content: string): any[] {
    const navigation: any[] = [];
    
    try {
      const navPatterns = [
        /navigate\(['"`]([^'"`]+)['"`]\)/g,
        /router\.push\(['"`]([^'"`]+)['"`]\)/g,
        /Link\s+to=['"`]([^'"`]+)['"`]/g
      ];

      navPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          navigation.push({
            from: 'current_page',
            to: match[1],
            trigger: 'user_click',
            method: pattern.source.includes('navigate') ? 'programmatic' : 'link'
          });
        }
      });
    } catch (error) {
      console.error('Error extracting navigation:', error);
    }

    return navigation;
  }

  private async analyzeDataOperations(): Promise<DataOperation[]> {
    const operations: DataOperation[] = [];
    
    try {
      for (const file of this.files) {
        const content = this.getFileContent(file);
        
        // Extract database queries with full implementation
        if (this.isDatabaseFile(file)) {
          // Prisma operations with full query code
          const prismaOps = this.extractPrismaOperations(content);
          
          // Mongoose operations with full query code
          const mongooseOps = this.extractMongooseOperations(content);
          
          // SQL queries with full statements
          const sqlOps = this.extractSQLOperations(content);
          
          // API calls with full request/response handling
          const apiOps = this.extractAPIOperations(content);
          
          operations.push(...prismaOps, ...mongooseOps, ...sqlOps, ...apiOps);
        }
      }
    } catch (error) {
      console.error('Error analyzing data operations:', error);
    }
    
    return operations;
  }

  private isDatabaseFile(file: FileAnalysis): boolean {
    try {
      const path = file.path.toLowerCase();
      const content = this.getFileContent(file).toLowerCase();
      
      return (
        file.category === 'service' ||
        path.includes('model') ||
        path.includes('schema') ||
        path.includes('database') ||
        path.includes('db') ||
        content.includes('prisma') ||
        content.includes('mongoose') ||
        content.includes('axios') ||
        content.includes('fetch(')
      );
    } catch (error) {
      console.error(`Error checking if file is database file ${file.path}:`, error);
      return false;
    }
  }

  private extractPrismaOperations(content: string): DataOperation[] {
    const operations: DataOperation[] = [];
    
    try {
      const prismaPatterns = [
        /prisma\.(\w+)\.create\(([^)]+)\)/g,
        /prisma\.(\w+)\.findMany\(([^)]*)\)/g,
        /prisma\.(\w+)\.findUnique\(([^)]+)\)/g,
        /prisma\.(\w+)\.update\(([^)]+)\)/g,
        /prisma\.(\w+)\.delete\(([^)]+)\)/g
      ];

      prismaPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const operation = this.getPrismaOperation(pattern.source);
          
          operations.push({
            type: 'Prisma',
            model: match[1],
            operation: operation,
            parameters: match[2] || '',
            description: `${operation} operation on ${match[1]} model`
          });
        }
      });
    } catch (error) {
      console.error('Error extracting Prisma operations:', error);
    }

    return operations;
  }

  private extractMongooseOperations(content: string): DataOperation[] {
    const operations: DataOperation[] = [];
    
    try {
      const mongoosePatterns = [
        /(\w+)\.find\(([^)]*)\)/g,
        /(\w+)\.findOne\(([^)]*)\)/g,
        /(\w+)\.create\(([^)]*)\)/g,
        /(\w+)\.save\(\)/g
      ];

      mongoosePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const operation = this.getMongooseOperation(pattern.source);
          
          operations.push({
            type: 'Mongoose',
            model: match[1],
            operation: operation,
            parameters: match[2] || '',
            description: `${operation} operation on ${match[1]} collection`
          });
        }
      });
    } catch (error) {
      console.error('Error extracting Mongoose operations:', error);
    }

    return operations;
  }

  private extractSQLOperations(content: string): DataOperation[] {
    const operations: DataOperation[] = [];
    
    try {
      const sqlPatterns = [
        /SELECT\s+[\s\S]*?\s+FROM\s+(\w+)/gi,
        /INSERT\s+INTO\s+(\w+)/gi,
        /UPDATE\s+(\w+)\s+SET/gi,
        /DELETE\s+FROM\s+(\w+)/gi
      ];

      sqlPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const operation = this.getSQLOperation(pattern.source);
          
          operations.push({
            type: 'SQL',
            model: match[1],
            operation: operation,
            parameters: '',
            description: `${operation} operation on ${match[1]} table`
          });
        }
      });
    } catch (error) {
      console.error('Error extracting SQL operations:', error);
    }

    return operations;
  }

  private extractAPIOperations(content: string): DataOperation[] {
    const operations: DataOperation[] = [];
    
    try {
      const apiPatterns = [
        /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
        /fetch\(['"`]([^'"`]+)['"`]/g
      ];

      apiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const method = match[1] || 'GET';
          const url = match[2] || match[1];
          
          operations.push({
            type: 'API Call',
            operation: method.toUpperCase(),
            parameters: url,
            description: `${method.toUpperCase()} request to ${url}`
          });
        }
      });
    } catch (error) {
      console.error('Error extracting API operations:', error);
    }

    return operations;
  }

  private async analyzeAuthenticationFlow(): Promise<AuthenticationFlow> {
    const authMethods: string[] = [];
    const providers: string[] = [];
    const flows: string[] = [];
    const middleware: string[] = [];

    try {
      for (const file of this.files) {
        const content = this.getFileContent(file).toLowerCase();
        
        // Detect authentication methods
        if (content.includes('jwt') || content.includes('jsonwebtoken')) {
          authMethods.push('JWT');
        }
        if (content.includes('passport')) {
          authMethods.push('Passport.js');
        }
        if (content.includes('oauth')) {
          authMethods.push('OAuth 2.0');
        }
        if (content.includes('session')) {
          authMethods.push('Session-based');
        }
        if (content.includes('cookie')) {
          authMethods.push('Cookie-based');
        }

        // Detect auth flows
        if (content.includes('login') || content.includes('signin')) {
          flows.push('Login Flow');
        }
        if (content.includes('register') || content.includes('signup')) {
          flows.push('Registration Flow');
        }
        if (content.includes('logout')) {
          flows.push('Logout Flow');
        }
      }
    } catch (error) {
      console.error('Error analyzing authentication flow:', error);
    }

    return {
      methods: [...new Set(authMethods)],
      providers: [...new Set(providers)],
      flows: [...new Set(flows)],
      middleware: [...new Set(middleware)]
    };
  }

  private async extractBusinessLogic(): Promise<BusinessLogic[]> {
    const businessLogic: BusinessLogic[] = [];

    try {
      for (const file of this.files) {
        if (this.isBusinessLogicFile(file)) {
          const content = this.getFileContent(file);
          
          const functions = this.extractBusinessFunctions(content);
          const validations = this.extractValidations(content);
          const calculations = this.extractCalculations(content);
          const workflows = this.extractWorkflows(content);

          if (functions.length > 0 || validations.length > 0 || calculations.length > 0 || workflows.length > 0) {
            businessLogic.push({
              file: file.path,
              functions: functions,
              validations: validations,
              calculations: calculations,
              workflows: workflows
            });
          }
        }
      }
    } catch (error) {
      console.error('Error extracting business logic:', error);
    }

    return businessLogic;
  }

  private isBusinessLogicFile(file: FileAnalysis): boolean {
    try {
      const path = file.path.toLowerCase();
      const content = this.getFileContent(file).toLowerCase();
      
      return (
        file.category === 'service' ||
        file.category === 'utility' ||
        path.includes('service') ||
        path.includes('util') ||
        path.includes('helper') ||
        content.includes('validate') ||
        content.includes('calculate') ||
        file.functions.length > 3
      );
    } catch (error) {
      console.error(`Error checking if file is business logic file ${file.path}:`, error);
      return false;
    }
  }

  // Helper methods with error handling

  private extractMiddleware(content: string, index: number): string[] {
    try {
      const middleware: string[] = [];
      const beforeRoute = content.substring(Math.max(0, index - 200), index);
      
      const middlewarePatterns = [
        /\.use\(([^)]+)\)/g,
        /authenticate/g,
        /authorize/g,
        /cors/g
      ];

      middlewarePatterns.forEach(pattern => {
        const matches = beforeRoute.match(pattern);
        if (matches) {
          middleware.push(...matches);
        }
      });

      return middleware;
    } catch (error) {
      console.error('Error extracting middleware:', error);
      return [];
    }
  }

  private extractHandlerLogic(content: string, index: number): string {
    try {
      const afterRoute = content.substring(index, index + 300);
      const handlerMatch = afterRoute.match(/\(([^)]*)\)\s*=>\s*{([^}]+)}/);
      return handlerMatch ? handlerMatch[2].trim() : '';
    } catch (error) {
      console.error('Error extracting handler logic:', error);
      return '';
    }
  }

  private extractFullRouteCode(content: string, index: number, length: number): string {
    try {
      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + length + 200);
      return content.substring(start, end);
    } catch (error) {
      console.error('Error extracting full route code:', error);
      return '';
    }
  }

  private extractRouteDescription(content: string, index: number): string {
    try {
      const beforeRoute = content.substring(Math.max(0, index - 100), index);
      const commentMatch = beforeRoute.match(/\/\*\*([\s\S]*?)\*\/|\/\/\s*(.+)$/m);
      return commentMatch ? (commentMatch[1] || commentMatch[2]).trim() : '';
    } catch (error) {
      console.error('Error extracting route description:', error);
      return '';
    }
  }

  private convertNextPathToRoute(filePath: string): string {
    try {
      return filePath
        .replace(/.*\/api\//, '/api/')
        .replace(/\[([^\]]+)\]/g, ':$1')
        .replace(/\.ts$|\.js$/, '');
    } catch (error) {
      console.error('Error converting Next.js path to route:', error);
      return filePath;
    }
  }

  private extractNextHandlerLogic(content: string, method: string): string {
    try {
      const handlerRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}[^{]*{([^}]+)}`);
      const match = content.match(handlerRegex);
      return match ? match[1].trim() : '';
    } catch (error) {
      console.error('Error extracting Next.js handler logic:', error);
      return '';
    }
  }

  private extractFunctionDescription(content: string, functionName: string): string {
    try {
      const functionRegex = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}`);
      const match = content.match(functionRegex);
      if (match) {
        const comment = match[0].match(/\/\*\*([\s\S]*?)\*\//);
        return comment ? comment[1].replace(/\*/g, '').trim() : '';
      }
      return '';
    } catch (error) {
      console.error('Error extracting function description:', error);
      return '';
    }
  }

  private parseProps(propsString: string): string[] {
    try {
      if (!propsString.trim()) return [];
      return propsString.split(',').map(p => p.trim()).filter(p => p);
    } catch (error) {
      console.error('Error parsing props:', error);
      return [];
    }
  }

  private extractJSXElements(content: string): string[] {
    try {
      const jsxElements: string[] = [];
      const jsxRegex = /<(\w+)[^>]*>/g;
      let match;
      
      while ((match = jsxRegex.exec(content)) !== null) {
        if (!jsxElements.includes(match[1])) {
          jsxElements.push(match[1]);
        }
      }
      
      return jsxElements;
    } catch (error) {
      console.error('Error extracting JSX elements:', error);
      return [];
    }
  }

  private extractHooks(content: string): string[] {
    try {
      const hooks: string[] = [];
      const hookPatterns = [
        /useState/g,
        /useEffect/g,
        /useContext/g,
        /useReducer/g,
        /useCallback/g,
        /useMemo/g,
        /useRef/g
      ];

      hookPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          hooks.push(...matches);
        }
      });

      return [...new Set(hooks)];
    } catch (error) {
      console.error('Error extracting hooks:', error);
      return [];
    }
  }

  private extractComponentEventHandlers(content: string): string[] {
    try {
      const handlers: string[] = [];
      const handlerRegex = /const\s+(\w*[Hh]andle\w*)\s*=/g;
      let match;
      
      while ((match = handlerRegex.exec(content)) !== null) {
        handlers.push(match[1]);
      }
      
      return handlers;
    } catch (error) {
      console.error('Error extracting component event handlers:', error);
      return [];
    }
  }

  private extractFormFields(formContent: string): any[] {
    try {
      const fields: any[] = [];
      const inputRegex = /<input[^>]*name=['"]([^'"]+)['"][^>]*type=['"]([^'"]+)['"][^>]*>/g;
      let match;
      
      while ((match = inputRegex.exec(formContent)) !== null) {
        fields.push({
          name: match[1],
          type: match[2],
          required: formContent.includes('required')
        });
      }
      
      return fields;
    } catch (error) {
      console.error('Error extracting form fields:', error);
      return [];
    }
  }

  private extractSubmitHandler(content: string, index: number): string {
    try {
      const formArea = content.substring(index, index + 500);
      const handlerMatch = formArea.match(/onSubmit\s*=\s*{([^}]+)}/);
      return handlerMatch ? handlerMatch[1].trim() : '';
    } catch (error) {
      console.error('Error extracting submit handler:', error);
      return '';
    }
  }

  private extractValidation(content: string): string[] {
    try {
      const validations: string[] = [];
      const validationPatterns = [
        /required/g,
        /pattern/g,
        /minLength/g,
        /maxLength/g
      ];

      validationPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          validations.push(pattern.source.replace(/[\/g]/g, ''));
        }
      });

      return validations;
    } catch (error) {
      console.error('Error extracting validation:', error);
      return [];
    }
  }

  private extractBusinessFunctions(content: string): any[] {
    try {
      const functions: any[] = [];
      const functionPatterns = [
        /function\s+(\w+)/g,
        /const\s+(\w+)\s*=\s*\(/g
      ];

      functionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1] && match[1].length > 2) {
            functions.push({
              name: match[1],
              fullCode: match[0]
            });
          }
        }
      });

      return functions;
    } catch (error) {
      console.error('Error extracting business functions:', error);
      return [];
    }
  }

  private extractValidations(content: string): any[] {
    try {
      const validations: any[] = [];
      const validationPatterns = [
        /validate\w*/gi,
        /check\w*/gi,
        /verify\w*/gi
      ];

      validationPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            validations.push({
              name: match,
              fullCode: match
            });
          });
        }
      });

      return validations;
    } catch (error) {
      console.error('Error extracting validations:', error);
      return [];
    }
  }

  private extractCalculations(content: string): any[] {
    try {
      const calculations: any[] = [];
      const calcPatterns = [
        /calculate\w*/gi,
        /compute\w*/gi,
        /sum\w*/gi
      ];

      calcPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            calculations.push({
              name: match,
              fullCode: match
            });
          });
        }
      });

      return calculations;
    } catch (error) {
      console.error('Error extracting calculations:', error);
      return [];
    }
  }

  private extractWorkflows(content: string): any[] {
    try {
      const workflows: any[] = [];
      const workflowPatterns = [
        /process\w*/gi,
        /handle\w*/gi,
        /execute\w*/gi
      ];

      workflowPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            workflows.push({
              name: match,
              fullCode: match
            });
          });
        }
      });

      return workflows;
    } catch (error) {
      console.error('Error extracting workflows:', error);
      return [];
    }
  }

  private getPrismaOperation(patternSource: string): string {
    if (patternSource.includes('create')) return 'CREATE';
    if (patternSource.includes('findMany')) return 'READ_MANY';
    if (patternSource.includes('findUnique')) return 'READ_ONE';
    if (patternSource.includes('update')) return 'UPDATE';
    if (patternSource.includes('delete')) return 'DELETE';
    return 'UNKNOWN';
  }

  private getMongooseOperation(patternSource: string): string {
    if (patternSource.includes('find(')) return 'FIND';
    if (patternSource.includes('findOne')) return 'FIND_ONE';
    if (patternSource.includes('create')) return 'CREATE';
    if (patternSource.includes('save')) return 'SAVE';
    return 'UNKNOWN';
  }

  private getSQLOperation(patternSource: string): string {
    if (patternSource.toLowerCase().includes('select')) return 'SELECT';
    if (patternSource.toLowerCase().includes('insert')) return 'INSERT';
    if (patternSource.toLowerCase().includes('update')) return 'UPDATE';
    if (patternSource.toLowerCase().includes('delete')) return 'DELETE';
    return 'UNKNOWN';
  }
}