import JSZip from 'jszip';
import { ProjectFile, FilterOptions } from '../types';
import { FileFilter } from './fileFilter';

export class FileProcessor {
  static async processFiles(files: FileList, options?: FilterOptions): Promise<ProjectFile> {
    const filterOptions = options || FileFilter.getDefaultOptions();
    
    const rootFile: ProjectFile = {
      name: 'project',
      path: '',
      content: '',
      type: 'directory',
      children: []
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.name.endsWith('.zip')) {
        const zipFiles = await this.processZipFile(file);
        rootFile.children!.push(zipFiles);
      } else {
        const processedFile = await this.processFile(file);
        rootFile.children!.push(processedFile);
      }
    }

    // Apply smart filtering
    const filtered = FileFilter.filterProject(rootFile, filterOptions);
    
    return filtered;
  }

  static async processZipFile(file: File): Promise<ProjectFile> {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);
    
    const rootFile: ProjectFile = {
      name: file.name.replace('.zip', ''),
      path: file.name.replace('.zip', ''),
      content: '',
      type: 'directory',
      children: []
    };

    const processZipEntry = async (relativePath: string, zipObject: JSZip.JSZipObject): Promise<ProjectFile> => {
      const pathParts = relativePath.split('/');
      const name = pathParts[pathParts.length - 1];
      
      if (zipObject.dir) {
        return {
          name,
          path: relativePath,
          content: '',
          type: 'directory',
          children: []
        };
      } else {
        const content = await zipObject.async('text');
        return {
          name,
          path: relativePath,
          content,
          type: 'file',
          size: content.length
        };
      }
    };

    // Build file tree structure
    const fileMap = new Map<string, ProjectFile>();
    
    for (const [relativePath, zipObject] of Object.entries(zipData.files)) {
      if (relativePath.endsWith('/')) continue; // Skip directory entries
      
      const file = await processZipEntry(relativePath, zipObject);
      fileMap.set(relativePath, file);
      
      // Build directory structure
      const pathParts = relativePath.split('/');
      let currentPath = '';
      let currentParent = rootFile;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += (currentPath ? '/' : '') + pathParts[i];
        
        let dir = currentParent.children?.find(child => child.path === currentPath);
        if (!dir) {
          dir = {
            name: pathParts[i],
            path: currentPath,
            content: '',
            type: 'directory',
            children: []
          };
          currentParent.children!.push(dir);
        }
        currentParent = dir;
      }
      
      currentParent.children!.push(file);
    }

    return rootFile;
  }

  static async processFile(file: File): Promise<ProjectFile> {
    const content = await file.text();
    return {
      name: file.name,
      path: file.name,
      content,
      type: 'file',
      size: file.size
    };
  }

  static extractPackageJson(structure: ProjectFile): any {
    const findPackageJson = (node: ProjectFile): ProjectFile | null => {
      if (node.name === 'package.json' && node.type === 'file') {
        return node;
      }
      
      if (node.children) {
        for (const child of node.children) {
          const result = findPackageJson(child);
          if (result) return result;
        }
      }
      
      return null;
    };

    const packageJsonFile = findPackageJson(structure);
    if (packageJsonFile) {
      try {
        return JSON.parse(packageJsonFile.content);
      } catch (error) {
        console.error('Failed to parse package.json:', error);
      }
    }
    
    return null;
  }

  static getFilesByExtension(structure: ProjectFile, extensions: string[]): ProjectFile[] {
    const files: ProjectFile[] = [];
    
    const traverse = (node: ProjectFile) => {
      if (node.type === 'file' && !node.ignored) {
        const ext = node.name.split('.').pop()?.toLowerCase();
        if (ext && extensions.includes(ext)) {
          files.push(node);
        }
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(structure);
    return files;
  }

  static getSourceFiles(structure: ProjectFile): ProjectFile[] {
    const files: ProjectFile[] = [];
    
    const traverse = (node: ProjectFile) => {
      if (node.type === 'file' && !node.ignored && FileFilter.shouldAnalyzeFile(node)) {
        files.push(node);
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(structure);
    return files;
  }

  static detectProjectType(structure: ProjectFile, packageInfo: any): string {
    // Check package.json dependencies
    if (packageInfo) {
      const deps = { ...packageInfo.dependencies, ...packageInfo.devDependencies };
      
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps['@angular/core']) return 'angular';
      if (deps.svelte) return 'svelte';
      if (deps.next) return 'nextjs';
      if (deps.express) return 'express';
      if (deps.fastify || deps.koa) return 'node';
    }
    
    // Check file structure
    const hasPages = this.hasDirectory(structure, 'pages');
    const hasApp = this.hasDirectory(structure, 'app');
    const hasSrc = this.hasDirectory(structure, 'src');
    
    if (hasPages || hasApp) return 'nextjs';
    if (hasSrc && this.hasFile(structure, 'index.html')) return 'react';
    
    return 'other';
  }

  private static hasDirectory(structure: ProjectFile, dirName: string): boolean {
    const traverse = (node: ProjectFile): boolean => {
      if (node.type === 'directory' && node.name === dirName) return true;
      if (node.children) {
        return node.children.some(traverse);
      }
      return false;
    };
    
    return traverse(structure);
  }

  private static hasFile(structure: ProjectFile, fileName: string): boolean {
    const traverse = (node: ProjectFile): boolean => {
      if (node.type === 'file' && node.name === fileName) return true;
      if (node.children) {
        return node.children.some(traverse);
      }
      return false;
    };
    
    return traverse(structure);
  }

  static getProjectStats(structure: ProjectFile): { fileCount: number; totalSize: number; sourceFiles: number } {
    let fileCount = 0;
    let totalSize = 0;
    let sourceFiles = 0;
    
    const traverse = (node: ProjectFile) => {
      if (node.type === 'file' && !node.ignored) {
        fileCount++;
        totalSize += node.size || 0;
        
        if (node.category === 'source') {
          sourceFiles++;
        }
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(structure);
    
    return { fileCount, totalSize, sourceFiles };
  }
}