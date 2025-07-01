import { DependencyInfo } from '../types';

export class DependencyAnalyzer {
  private static readonly DEPENDENCY_CATEGORIES = {
    // Frameworks
    'react': { category: 'framework', description: 'React library for building user interfaces' },
    'vue': { category: 'framework', description: 'Progressive JavaScript framework' },
    '@angular/core': { category: 'framework', description: 'Angular framework core' },
    'svelte': { category: 'framework', description: 'Cybernetically enhanced web apps' },
    'next': { category: 'framework', description: 'React framework for production' },
    'nuxt': { category: 'framework', description: 'Vue.js framework' },
    'express': { category: 'framework', description: 'Fast, unopinionated web framework for Node.js' },
    'fastify': { category: 'framework', description: 'Fast and low overhead web framework for Node.js' },
    
    // UI Libraries
    '@mui/material': { category: 'ui', description: 'Material-UI React components' },
    'antd': { category: 'ui', description: 'Enterprise-class UI design language' },
    'react-bootstrap': { category: 'ui', description: 'Bootstrap components for React' },
    'chakra-ui': { category: 'ui', description: 'Modular and accessible component library' },
    'semantic-ui-react': { category: 'ui', description: 'React integration for Semantic UI' },
    
    // Styling
    'tailwindcss': { category: 'styling', description: 'Utility-first CSS framework' },
    'styled-components': { category: 'styling', description: 'CSS-in-JS library' },
    'emotion': { category: 'styling', description: 'CSS-in-JS library' },
    'sass': { category: 'styling', description: 'CSS extension language' },
    'less': { category: 'styling', description: 'CSS pre-processor' },
    
    // State Management
    'redux': { category: 'utility', description: 'Predictable state container' },
    '@reduxjs/toolkit': { category: 'utility', description: 'Official Redux toolkit' },
    'zustand': { category: 'utility', description: 'Small, fast state management' },
    'mobx': { category: 'utility', description: 'Reactive state management' },
    'recoil': { category: 'utility', description: 'Experimental state management for React' },
    
    // Routing
    'react-router-dom': { category: 'utility', description: 'Declarative routing for React' },
    'vue-router': { category: 'utility', description: 'Official router for Vue.js' },
    '@reach/router': { category: 'utility', description: 'Router for React' },
    
    // HTTP Clients
    'axios': { category: 'api', description: 'Promise-based HTTP client' },
    'fetch': { category: 'api', description: 'Fetch API polyfill' },
    'superagent': { category: 'api', description: 'Ajax API' },
    
    // Utilities
    'lodash': { category: 'utility', description: 'JavaScript utility library' },
    'ramda': { category: 'utility', description: 'Functional programming library' },
    'date-fns': { category: 'utility', description: 'Modern JavaScript date utility library' },
    'moment': { category: 'utility', description: 'Parse, validate, manipulate dates' },
    'uuid': { category: 'utility', description: 'Generate RFC-compliant UUIDs' },
    
    // Build Tools
    'vite': { category: 'build', description: 'Next generation frontend tooling' },
    'webpack': { category: 'build', description: 'Module bundler' },
    'rollup': { category: 'build', description: 'Module bundler for JavaScript' },
    'parcel': { category: 'build', description: 'Zero configuration build tool' },
    'esbuild': { category: 'build', description: 'Extremely fast JavaScript bundler' },
    
    // Testing
    'jest': { category: 'testing', description: 'JavaScript testing framework' },
    'vitest': { category: 'testing', description: 'Blazing fast unit test framework' },
    '@testing-library/react': { category: 'testing', description: 'React testing utilities' },
    'cypress': { category: 'testing', description: 'End-to-end testing framework' },
    'playwright': { category: 'testing', description: 'Cross-browser automation library' },
    
    // Development Tools
    'typescript': { category: 'build', description: 'TypeScript language' },
    'eslint': { category: 'build', description: 'JavaScript linter' },
    'prettier': { category: 'build', description: 'Code formatter' },
    '@types/node': { category: 'build', description: 'TypeScript definitions for Node.js' },
    '@types/react': { category: 'build', description: 'TypeScript definitions for React' }
  };

  static analyzeDependencies(packageJson: any): { dependencies: DependencyInfo[], devDependencies: DependencyInfo[] } {
    const dependencies = this.processDependencies(packageJson.dependencies || {});
    const devDependencies = this.processDependencies(packageJson.devDependencies || {});
    
    return { dependencies, devDependencies };
  }

  private static processDependencies(deps: Record<string, string>): DependencyInfo[] {
    return Object.entries(deps).map(([name, version]) => {
      const info = this.DEPENDENCY_CATEGORIES[name];
      
      return {
        name,
        version,
        category: info?.category || this.inferCategory(name),
        description: info?.description
      };
    });
  }

  private static inferCategory(name: string): DependencyInfo['category'] {
    // Infer category from package name patterns
    if (name.includes('react') || name.includes('vue') || name.includes('angular')) {
      return 'framework';
    }
    
    if (name.includes('ui') || name.includes('component') || name.includes('design')) {
      return 'ui';
    }
    
    if (name.includes('css') || name.includes('style') || name.includes('theme')) {
      return 'styling';
    }
    
    if (name.includes('test') || name.includes('spec') || name.includes('mock')) {
      return 'testing';
    }
    
    if (name.includes('build') || name.includes('webpack') || name.includes('babel') || name.includes('eslint')) {
      return 'build';
    }
    
    if (name.includes('api') || name.includes('http') || name.includes('request')) {
      return 'api';
    }
    
    if (name.startsWith('@types/')) {
      return 'build';
    }
    
    return 'other';
  }

  static detectBuildTool(packageJson: any): string | undefined {
    const scripts = packageJson.scripts || {};
    const devDeps = packageJson.devDependencies || {};
    
    if (devDeps.vite || Object.values(scripts).some(script => script.includes('vite'))) {
      return 'Vite';
    }
    
    if (devDeps.webpack || Object.values(scripts).some(script => script.includes('webpack'))) {
      return 'Webpack';
    }
    
    if (devDeps.rollup || Object.values(scripts).some(script => script.includes('rollup'))) {
      return 'Rollup';
    }
    
    if (devDeps.parcel || Object.values(scripts).some(script => script.includes('parcel'))) {
      return 'Parcel';
    }
    
    if (Object.values(scripts).some(script => script.includes('react-scripts'))) {
      return 'Create React App';
    }
    
    if (Object.values(scripts).some(script => script.includes('next'))) {
      return 'Next.js';
    }
    
    return undefined;
  }

  static detectArchitecturePatterns(dependencies: DependencyInfo[], files: any[]): string[] {
    const patterns: string[] = [];
    
    // State management patterns
    if (dependencies.some(d => ['redux', '@reduxjs/toolkit'].includes(d.name))) {
      patterns.push('Redux Pattern');
    }
    
    if (dependencies.some(d => d.name === 'zustand')) {
      patterns.push('Zustand State Management');
    }
    
    // Component patterns
    if (dependencies.some(d => d.name === 'react')) {
      patterns.push('Component-Based Architecture');
      
      // Check for hooks usage
      const hasHooks = files.some(file => 
        file.functions?.some(func => func.name.startsWith('use'))
      );
      if (hasHooks) {
        patterns.push('React Hooks Pattern');
      }
    }
    
    // API patterns
    if (dependencies.some(d => d.name === 'axios')) {
      patterns.push('HTTP Client Pattern');
    }
    
    // Styling patterns
    if (dependencies.some(d => d.name === 'tailwindcss')) {
      patterns.push('Utility-First CSS');
    }
    
    if (dependencies.some(d => ['styled-components', '@emotion/styled'].includes(d.name))) {
      patterns.push('CSS-in-JS');
    }
    
    // Testing patterns
    if (dependencies.some(d => d.name.includes('testing-library'))) {
      patterns.push('Testing Library Pattern');
    }
    
    return patterns;
  }
}