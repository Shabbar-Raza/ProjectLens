import { WorkflowAnalysisData, WorkflowGenerationResult, ProjectAnalysis } from '../types';

export class GeminiWorkflowGenerator {
  private apiKey: string;
  private geminiEndpoint: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro/generateContent';
  }

  async generateWorkflowsAndStories(
    analysisData: WorkflowAnalysisData, 
    projectAnalysis: ProjectAnalysis
  ): Promise<WorkflowGenerationResult> {
    const prompt = this.createComprehensivePrompt(analysisData, projectAnalysis);
    
    try {
      console.log('🤖 Sending comprehensive code analysis to Gemini AI...');
      
      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
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
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Received comprehensive response from Gemini AI');
      
      return this.parseGeminiResponse(result);
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return this.generateFallbackWorkflows(analysisData, projectAnalysis);
    }
  }

  private createComprehensivePrompt(analysisData: WorkflowAnalysisData, projectAnalysis: ProjectAnalysis): string {
    return `
# COMPREHENSIVE CODE ANALYSIS FOR AI WORKFLOW & USER STORIES GENERATION

You are an expert Product Manager, Business Analyst, and Software Architect. Based on the following detailed technical analysis of a software project, generate comprehensive workflows, user stories, and project capabilities documentation.

## PROJECT INFORMATION:
- **Name**: ${projectAnalysis.name}
- **Type**: ${projectAnalysis.type}
- **Description**: ${projectAnalysis.packageInfo?.description || 'No description available'}
- **Build Tool**: ${projectAnalysis.architecture.buildTool || 'Not specified'}
- **Architecture Patterns**: ${projectAnalysis.architecture.patterns.join(', ')}

## DETAILED CODE ANALYSIS:

### 🛣️ API ROUTES & ENDPOINTS (${analysisData.routes.length} found):
${this.formatRoutesForPrompt(analysisData.routes)}

### 🎯 USER INTERFACE COMPONENTS (${analysisData.userInteractions.length} files analyzed):
${this.formatUserInteractionsForPrompt(analysisData.userInteractions)}

### 💾 DATABASE OPERATIONS (${analysisData.dataOperations.length} operations):
${this.formatDataOperationsForPrompt(analysisData.dataOperations)}

### 🔐 AUTHENTICATION & AUTHORIZATION:
${this.formatAuthFlowForPrompt(analysisData.authFlow)}

### ⚙️ BUSINESS LOGIC (${analysisData.businessLogic.length} files):
${this.formatBusinessLogicForPrompt(analysisData.businessLogic)}

### 📦 DEPENDENCIES & TECHNOLOGIES:
${this.formatDependenciesForPrompt(projectAnalysis)}

## REQUIRED OUTPUT (JSON format):

Please analyze this comprehensive codebase data and generate the following in a structured JSON format. Be extremely detailed and professional:

\`\`\`json
{
  "projectOverview": {
    "name": "${projectAnalysis.name}",
    "description": "Detailed description of what this application does based on comprehensive code analysis",
    "primaryUsers": ["User Type 1", "User Type 2", "User Type 3"],
    "coreCapabilities": ["Capability 1", "Capability 2", "Capability 3"],
    "applicationTypes": ["Web Application", "API", "Dashboard", etc.],
    "businessDomain": "e.g., E-commerce, Social Media, Enterprise, etc."
  },
  
  "userWorkflows": [
    {
      "workflowName": "Descriptive workflow name based on actual code functionality",
      "description": "What this workflow accomplishes based on the actual implementation",
      "userTypes": ["Primary User", "Secondary User"],
      "estimatedDuration": "5-10 minutes",
      "steps": [
        {
          "stepNumber": 1,
          "action": "User performs specific action (based on actual UI components)",
          "trigger": "What causes this step (based on event handlers)",
          "systemResponse": "How system responds (based on API endpoints)",
          "dataInvolved": "What data is processed (based on database operations)",
          "userInterface": "Component or page involved (from actual component analysis)",
          "technicalEndpoint": "API endpoint if applicable (from actual routes)"
        }
      ],
      "preconditions": ["What must be true before workflow starts"],
      "postconditions": ["What is true after workflow completes"],
      "alternativeFlows": ["Alternative paths through the workflow"],
      "errorHandling": ["How errors are handled based on actual error handling code"]
    }
  ],
  
  "userStories": [
    {
      "id": "US001",
      "title": "Concise story title based on actual functionality",
      "description": "As a [user type], I want to [action based on actual code] so that [benefit based on business logic]",
      "acceptanceCriteria": [
        "Given [context from actual code], when [action from actual handlers], then [outcome from actual responses]",
        "System validates input correctly (based on actual validation code)",
        "Error messages are clear and helpful (based on actual error handling)"
      ],
      "priority": "High|Medium|Low",
      "estimatedEffort": "X story points",
      "complexity": "High|Medium|Low",
      "relatedWorkflow": "Name of related workflow",
      "technicalImplementation": {
        "endpoints": ["POST /api/endpoint1", "GET /api/endpoint2"],
        "components": ["ComponentName1", "ComponentName2"],
        "database": ["Table/Model operations"]
      },
      "testScenarios": [
        "Happy path test based on actual code flow",
        "Error condition test based on actual error handling",
        "Edge case test based on actual validation logic"
      ]
    }
  ],
  
  "capabilities": [
    {
      "category": "User Management",
      "features": [
        {
          "name": "Feature name based on actual implementation",
          "description": "What the feature does based on actual code analysis",
          "technicalEndpoint": "API endpoint from actual routes",
          "userBenefit": "Why users need this based on business logic analysis"
        }
      ]
    }
  ],
  
  "dataEntities": [
    {
      "entityName": "EntityName from actual database operations",
      "description": "What this entity represents based on actual usage",
      "attributes": ["attribute1", "attribute2", "attribute3"],
      "relationships": ["Relationship to other entities based on actual code"]
    }
  ]
}
\`\`\`

## ANALYSIS GUIDELINES:

1. **Code-Based Analysis**: Base ALL analysis on the actual code provided, not assumptions
2. **User-Centric Approach**: Focus on what users can accomplish based on actual UI components and workflows
3. **Business Value**: Explain the business value of each capability based on actual business logic
4. **Complete Workflows**: Map end-to-end user journeys based on actual component interactions and API calls
5. **Professional Format**: Use standard product management terminology
6. **Technical Accuracy**: Ensure stories align with actual code implementation, endpoints, and data operations
7. **Prioritization**: Indicate priority levels based on code complexity, dependencies, and authentication requirements
8. **Realistic Estimation**: Provide realistic effort estimates based on technical complexity of actual implementations
9. **Comprehensive Coverage**: Cover all major functionality found in the codebase analysis
10. **Error Handling**: Include error scenarios and edge cases based on actual error handling code

Please provide a comprehensive analysis that a Product Manager could use for project planning, stakeholder communication, and development roadmap creation.
    `;
  }

  private formatRoutesForPrompt(routes: any[]): string {
    if (routes.length === 0) {
      return 'No routes detected in the codebase.';
    }

    return routes.slice(0, 15).map(route => `
**${route.method} ${route.path}** (${route.type})
- Handler Logic: ${route.handler || 'Not specified'}
- Description: ${route.description || 'No description'}
- Middleware: ${route.middleware?.join(', ') || 'None'}
`).join('\n');
  }

  private formatUserInteractionsForPrompt(interactions: any[]): string {
    if (interactions.length === 0) {
      return 'No user interactions detected in the codebase.';
    }

    return interactions.slice(0, 8).map(interaction => `
**File: ${interaction.file}**

**Components:**
${interaction.components.map(comp => `
- **${comp.name}**
  - Props: ${comp.props?.join(', ') || 'None'}
  - Hooks: ${comp.hooks?.join(', ') || 'None'}
  - Event Handlers: ${comp.eventHandlers?.join(', ') || 'None'}
`).join('\n')}

**Forms:**
${interaction.forms.map(form => `
- Fields: ${form.fields?.map(f => `${f.name} (${f.type})`).join(', ') || 'None'}
- Submit Handler: ${form.submitHandler || 'None'}
- Validation: ${form.validation?.join(', ') || 'None'}
`).join('\n')}

**Event Handlers:**
${interaction.events.map(event => `
- **${event.name}** (${event.type})
  - Trigger: ${event.trigger}
  - Action: ${event.action}
`).join('\n')}

**Navigation Patterns:**
${interaction.navigation.map(nav => `
- From: ${nav.from} → To: ${nav.to} (${nav.method})
`).join('\n')}
`).join('\n');
  }

  private formatDataOperationsForPrompt(operations: any[]): string {
    if (operations.length === 0) {
      return 'No data operations detected in the codebase.';
    }

    return operations.slice(0, 12).map(op => `
**${op.type} - ${op.operation}** ${op.model ? `on ${op.model}` : ''}
- Parameters: ${op.parameters || 'None'}
- Description: ${op.description || 'No description'}
`).join('\n');
  }

  private formatAuthFlowForPrompt(authFlow: any): string {
    return `
**Authentication Methods:** ${authFlow.methods?.join(', ') || 'None detected'}
**Providers:** ${authFlow.providers?.join(', ') || 'None detected'}
**Flows:** ${authFlow.flows?.join(', ') || 'None detected'}
**Middleware:** ${authFlow.middleware?.join(', ') || 'None detected'}
`;
  }

  private formatBusinessLogicForPrompt(businessLogic: any[]): string {
    if (businessLogic.length === 0) {
      return 'No business logic files detected in the codebase.';
    }

    return businessLogic.slice(0, 8).map(logic => `
**File: ${logic.file}**

**Functions:**
${logic.functions.map(func => `
- **${func.name}**
`).join('\n')}

**Validations:**
${logic.validations.map(val => `
- **${val.name}**
`).join('\n')}

**Calculations:**
${logic.calculations.map(calc => `
- **${calc.name}**
`).join('\n')}

**Workflows:**
${logic.workflows.map(workflow => `
- **${workflow.name}**
`).join('\n')}
`).join('\n');
  }

  private formatDependenciesForPrompt(projectAnalysis: ProjectAnalysis): string {
    return `
**Production Dependencies:**
${projectAnalysis.dependencies.slice(0, 8).map(dep => `- ${dep.name} (${dep.version}): ${dep.description || dep.category}`).join('\n')}

**Development Dependencies:**
${projectAnalysis.devDependencies.slice(0, 8).map(dep => `- ${dep.name} (${dep.version}): ${dep.description || dep.category}`).join('\n')}

**Architecture Technologies:** ${projectAnalysis.architecture.technologies.join(', ')}
**Build Tool:** ${projectAnalysis.architecture.buildTool || 'Not specified'}
**Entry Points:** ${projectAnalysis.entryPoints.join(', ')}
`;
  }

  private parseGeminiResponse(response: any): WorkflowGenerationResult {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      console.log('📝 Parsing comprehensive Gemini response...');
      
      // Extract JSON from Gemini response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('✅ Successfully parsed comprehensive Gemini response');
        return this.validateAndEnhanceResponse(parsed);
      }
      
      // Fallback: try to parse entire response as JSON
      try {
        const parsed = JSON.parse(content);
        return this.validateAndEnhanceResponse(parsed);
      } catch (parseError) {
        console.error('Failed to parse JSON from Gemini response');
        throw new Error('Invalid JSON response from Gemini API');
      }
      
    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      return this.generateFallbackResponse();
    }
  }

  private validateAndEnhanceResponse(response: any): WorkflowGenerationResult {
    try {
      // Ensure all required fields exist with defaults
      const validated: WorkflowGenerationResult = {
        projectOverview: {
          name: response.projectOverview?.name || 'Unknown Project',
          description: response.projectOverview?.description || 'Project description not available',
          primaryUsers: response.projectOverview?.primaryUsers || ['End Users', 'Administrators'],
          coreCapabilities: response.projectOverview?.coreCapabilities || ['Core Functionality'],
          applicationTypes: response.projectOverview?.applicationTypes || ['Web Application'],
          businessDomain: response.projectOverview?.businessDomain || 'General Purpose'
        },
        userWorkflows: response.userWorkflows || [],
        userStories: response.userStories || [],
        capabilities: response.capabilities || [],
        dataEntities: response.dataEntities || []
      };

      // Enhance user stories with IDs if missing
      validated.userStories = validated.userStories.map((story: any, index: number) => ({
        ...story,
        id: story.id || `US${String(index + 1).padStart(3, '0')}`,
        priority: story.priority || 'Medium',
        estimatedEffort: story.estimatedEffort || '3 story points',
        complexity: story.complexity || 'Medium',
        technicalImplementation: story.technicalImplementation || {
          endpoints: [],
          components: [],
          database: []
        },
        testScenarios: story.testScenarios || [],
        acceptanceCriteria: story.acceptanceCriteria || []
      }));

      // Enhance workflows with step numbers
      validated.userWorkflows = validated.userWorkflows.map((workflow: any) => ({
        ...workflow,
        steps: workflow.steps?.map((step: any, index: number) => ({
          ...step,
          stepNumber: step.stepNumber || index + 1
        })) || [],
        preconditions: workflow.preconditions || [],
        postconditions: workflow.postconditions || [],
        alternativeFlows: workflow.alternativeFlows || [],
        errorHandling: workflow.errorHandling || []
      }));

      // Enhance capabilities
      validated.capabilities = validated.capabilities.map((capability: any) => ({
        ...capability,
        features: capability.features?.map((feature: any) => ({
          ...feature,
          technicalEndpoint: feature.technicalEndpoint || '',
          userBenefit: feature.userBenefit || 'Provides value to users'
        })) || []
      }));

      // Enhance data entities
      validated.dataEntities = validated.dataEntities.map((entity: any) => ({
        ...entity,
        attributes: entity.attributes || ['id', 'createdAt', 'updatedAt'],
        relationships: entity.relationships || ['May relate to other entities']
      }));

      return validated;
    } catch (error) {
      console.error('Error validating response:', error);
      return this.generateFallbackResponse();
    }
  }

  private generateFallbackWorkflows(
    analysisData: WorkflowAnalysisData, 
    projectAnalysis: ProjectAnalysis
  ): WorkflowGenerationResult {
    console.log('🔄 Generating enhanced fallback workflows based on code analysis...');
    
    const projectType = this.detectApplicationType(analysisData, projectAnalysis);
    
    return {
      projectOverview: {
        name: projectAnalysis.name,
        description: `A ${projectAnalysis.type} application with ${analysisData.routes.length} endpoints and ${analysisData.userInteractions.length} user interface components. Based on code analysis, this appears to be a ${projectType}.`,
        primaryUsers: this.inferPrimaryUsers(projectType),
        coreCapabilities: this.inferCoreCapabilities(analysisData),
        applicationTypes: [projectType],
        businessDomain: this.inferBusinessDomain(projectType)
      },
      userWorkflows: this.generateBasicWorkflows(analysisData, projectType),
      userStories: this.generateBasicUserStories(analysisData, projectType),
      capabilities: this.generateBasicCapabilities(analysisData),
      dataEntities: this.generateBasicDataEntities(analysisData)
    };
  }

  private detectApplicationType(analysisData: WorkflowAnalysisData, projectAnalysis: ProjectAnalysis): string {
    const routes = analysisData.routes.map(r => r.path.toLowerCase()).join(' ');
    const dependencies = projectAnalysis.dependencies.map(d => d.name.toLowerCase()).join(' ');
    
    if (routes.includes('cart') || routes.includes('product') || routes.includes('order') || routes.includes('payment')) {
      return 'E-commerce Platform';
    }
    if (routes.includes('post') || routes.includes('comment') || routes.includes('like') || routes.includes('follow')) {
      return 'Social Media Application';
    }
    if (routes.includes('dashboard') || routes.includes('analytics') || routes.includes('report')) {
      return 'Dashboard/Analytics Tool';
    }
    if (routes.includes('user') || routes.includes('auth') || dependencies.includes('express')) {
      return 'Web Application';
    }
    
    return 'Web Application';
  }

  private inferPrimaryUsers(projectType: string): string[] {
    const userMap: Record<string, string[]> = {
      'E-commerce Platform': ['Customers', 'Store Administrators', 'Vendors'],
      'Social Media Application': ['Users', 'Content Creators', 'Moderators'],
      'Dashboard/Analytics Tool': ['Analysts', 'Managers', 'Data Scientists'],
      'Web Application': ['End Users', 'Administrators', 'Moderators']
    };
    
    return userMap[projectType] || ['End Users', 'Administrators'];
  }

  private inferCoreCapabilities(analysisData: WorkflowAnalysisData): string[] {
    const capabilities: string[] = [];
    
    if (analysisData.authFlow.methods.length > 0) {
      capabilities.push('User Authentication & Authorization');
    }
    if (analysisData.dataOperations.some(op => op.operation.includes('CREATE'))) {
      capabilities.push('Data Creation & Management');
    }
    if (analysisData.routes.some(r => r.method === 'GET')) {
      capabilities.push('Data Retrieval & Display');
    }
    if (analysisData.userInteractions.some(ui => ui.forms.length > 0)) {
      capabilities.push('Form Processing & Validation');
    }
    if (analysisData.routes.length > 5) {
      capabilities.push('API Integration & Services');
    }
    
    return capabilities.length > 0 ? capabilities : ['Core Application Functionality'];
  }

  private inferBusinessDomain(projectType: string): string {
    const domainMap: Record<string, string> = {
      'E-commerce Platform': 'E-commerce & Retail',
      'Social Media Application': 'Social Networking & Communication',
      'Dashboard/Analytics Tool': 'Business Intelligence & Analytics',
      'Web Application': 'General Purpose Software'
    };
    
    return domainMap[projectType] || 'General Purpose Software';
  }

  private generateBasicWorkflows(analysisData: WorkflowAnalysisData, projectType: string): any[] {
    const workflows: any[] = [];
    
    // Authentication workflow
    if (analysisData.authFlow.methods.length > 0) {
      workflows.push({
        workflowName: 'User Authentication',
        description: 'User registration and login process',
        userTypes: ['New Users', 'Returning Users'],
        estimatedDuration: '2-5 minutes',
        steps: [
          {
            stepNumber: 1,
            action: 'User navigates to login page',
            trigger: 'User clicks login button',
            systemResponse: 'Display login form',
            dataInvolved: 'User credentials',
            userInterface: 'Login Component',
            technicalEndpoint: '/api/auth/login'
          }
        ],
        preconditions: ['User has internet access'],
        postconditions: ['User is authenticated'],
        alternativeFlows: ['Registration for new users'],
        errorHandling: ['Invalid credentials handling']
      });
    }
    
    // Data management workflow
    if (analysisData.dataOperations.length > 0) {
      workflows.push({
        workflowName: 'Data Management',
        description: 'Create, read, update, and delete data',
        userTypes: ['Authenticated Users'],
        estimatedDuration: '3-10 minutes',
        steps: [
          {
            stepNumber: 1,
            action: 'User accesses data management interface',
            trigger: 'User navigates to data section',
            systemResponse: 'Display data list',
            dataInvolved: 'Application data',
            userInterface: 'Data Management Component'
          }
        ],
        preconditions: ['User is authenticated'],
        postconditions: ['Data is updated'],
        alternativeFlows: ['Bulk operations'],
        errorHandling: ['Validation errors', 'Permission errors']
      });
    }
    
    return workflows;
  }

  private generateBasicUserStories(analysisData: WorkflowAnalysisData, projectType: string): any[] {
    const stories: any[] = [];
    let storyCounter = 1;
    
    // Authentication stories
    if (analysisData.authFlow.methods.length > 0) {
      stories.push({
        id: `US${String(storyCounter++).padStart(3, '0')}`,
        title: 'User Registration',
        description: 'As a new user, I want to create an account so that I can access the application',
        acceptanceCriteria: [
          'User can enter email and password',
          'System validates email format',
          'System creates user account on successful validation',
          'User receives confirmation of registration'
        ],
        priority: 'High',
        estimatedEffort: '5 story points',
        complexity: 'Medium',
        relatedWorkflow: 'User Authentication',
        technicalImplementation: {
          endpoints: ['/api/auth/register'],
          components: ['RegistrationForm'],
          database: ['User creation']
        },
        testScenarios: [
          'Valid registration flow',
          'Duplicate email handling',
          'Password validation'
        ]
      });
      
      stories.push({
        id: `US${String(storyCounter++).padStart(3, '0')}`,
        title: 'User Login',
        description: 'As a returning user, I want to log in so that I can access my account',
        acceptanceCriteria: [
          'User can enter credentials',
          'System validates credentials',
          'User is redirected to dashboard on success',
          'Error message shown for invalid credentials'
        ],
        priority: 'High',
        estimatedEffort: '3 story points',
        complexity: 'Low',
        relatedWorkflow: 'User Authentication',
        technicalImplementation: {
          endpoints: ['/api/auth/login'],
          components: ['LoginForm'],
          database: ['User authentication']
        },
        testScenarios: [
          'Valid login flow',
          'Invalid credentials handling',
          'Account lockout after failed attempts'
        ]
      });
    }
    
    // Data operation stories
    analysisData.dataOperations.slice(0, 3).forEach((operation, index) => {
      stories.push({
        id: `US${String(storyCounter++).padStart(3, '0')}`,
        title: `${operation.operation} ${operation.model || 'Data'}`,
        description: `As a user, I want to ${operation.operation.toLowerCase()} ${operation.model || 'data'} so that I can manage my information`,
        acceptanceCriteria: [
          `User can ${operation.operation.toLowerCase()} ${operation.model || 'data'}`,
          'System validates input data',
          'Success message is displayed',
          'Data is persisted correctly'
        ],
        priority: 'Medium',
        estimatedEffort: '3 story points',
        complexity: 'Medium',
        relatedWorkflow: 'Data Management',
        technicalImplementation: {
          endpoints: [`/api/${operation.model?.toLowerCase() || 'data'}`],
          components: [`${operation.model || 'Data'}Form`],
          database: [`${operation.model || 'Data'} ${operation.operation.toLowerCase()}`]
        },
        testScenarios: [
          'Valid data operation',
          'Invalid data handling',
          'Permission validation'
        ]
      });
    });
    
    return stories;
  }

  private generateBasicCapabilities(analysisData: WorkflowAnalysisData): any[] {
    const capabilities: any[] = [];
    
    if (analysisData.authFlow.methods.length > 0) {
      capabilities.push({
        category: 'Authentication & Security',
        features: [
          {
            name: 'User Authentication',
            description: 'Secure user login and registration',
            technicalEndpoint: '/api/auth',
            userBenefit: 'Secure access to personalized features'
          }
        ]
      });
    }
    
    if (analysisData.dataOperations.length > 0) {
      capabilities.push({
        category: 'Data Management',
        features: [
          {
            name: 'Data Operations',
            description: 'Create, read, update, and delete data',
            technicalEndpoint: '/api/data',
            userBenefit: 'Manage and organize information effectively'
          }
        ]
      });
    }
    
    if (analysisData.routes.length > 0) {
      capabilities.push({
        category: 'API Services',
        features: [
          {
            name: 'RESTful API',
            description: 'Comprehensive API for data access',
            technicalEndpoint: '/api/*',
            userBenefit: 'Programmatic access to application features'
          }
        ]
      });
    }
    
    return capabilities;
  }

  private generateBasicDataEntities(analysisData: WorkflowAnalysisData): any[] {
    const entities: any[] = [];
    const models = new Set<string>();
    
    // Extract unique models from data operations
    analysisData.dataOperations.forEach(op => {
      if (op.model) {
        models.add(op.model);
      }
    });
    
    models.forEach(model => {
      entities.push({
        entityName: model,
        description: `Represents ${model.toLowerCase()} data in the system`,
        attributes: ['id', 'createdAt', 'updatedAt'],
        relationships: ['May relate to other entities']
      });
    });
    
    // Add User entity if authentication is present
    if (analysisData.authFlow.methods.length > 0 && !models.has('User')) {
      entities.push({
        entityName: 'User',
        description: 'Represents a system user',
        attributes: ['id', 'email', 'password', 'profile', 'createdAt'],
        relationships: ['May have associated data records']
      });
    }
    
    return entities;
  }

  private generateFallbackResponse(): WorkflowGenerationResult {
    return {
      projectOverview: {
        name: 'Unknown Project',
        description: 'Unable to analyze project structure',
        primaryUsers: ['Users'],
        coreCapabilities: ['Basic Functionality'],
        applicationTypes: ['Web Application'],
        businessDomain: 'General Purpose'
      },
      userWorkflows: [],
      userStories: [],
      capabilities: [],
      dataEntities: []
    };
  }
}