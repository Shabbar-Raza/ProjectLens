import { ProjectFile, FilterOptions } from '../types';

export class FileFilter {
  private static readonly IGNORED_DIRECTORIES = [
    'node_modules',
    'dist',
    'build',
    '.next',
    'out',
    '.git',
    '.vscode',
    '.idea',
    'coverage',
    '.nyc_output',
    'tmp',
    'temp',
    '.cache',
    '.parcel-cache',
    'public/static',
    'static/js',
    'static/css'
  ];

  private static readonly IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    '.env.local',
    '.env.production',
    '.gitignore',
    '.eslintcache'
  ];

  private static readonly IGNORED_PATTERNS = [
    /\.min\.js$/,
    /\.bundle\.js$/,
    /\.chunk\.js$/,
    /\.map$/,
    /\.d\.ts$/,
    /\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i,
    /^.*\.test\.(js|ts|jsx|tsx)$/,
    /^.*\.spec\.(js|ts|jsx|tsx)$/,
    /^.*\.stories\.(js|ts|jsx|tsx)$/
  ];

  private static readonly SOURCE_EXTENSIONS = [
    'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
    'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb',
    'css', 'scss', 'sass', 'less', 'styl',
    'md', 'json', 'yml', 'yaml', 'toml'
  ];

  static filterProject(structure: ProjectFile, options: FilterOptions = this.getDefaultOptions()): ProjectFile {
    return this.filterNode(structure, options, '');
  }

  private static filterNode(node: ProjectFile, options: FilterOptions, parentPath: string): ProjectFile {
    const filtered: ProjectFile = {
      ...node,
      children: []
    };

    // Skip ignored directories
    if (node.type === 'directory' && this.isIgnoredDirectory(node.name)) {
      filtered.ignored = true;
      return filtered;
    }

    // Skip ignored files
    if (node.type === 'file' && this.isIgnoredFile(node.name, options)) {
      filtered.ignored = true;
      return filtered;
    }

    // Categorize file
    if (node.type === 'file') {
      filtered.category = this.categorizeFile(node.name, node.content || '');
    }

    // Process children
    if (node.children) {
      filtered.children = node.children
        .map(child => this.filterNode(child, options, node.path))
        .filter(child => !child.ignored);
    }

    return filtered;
  }

  private static isIgnoredDirectory(dirName: string): boolean {
    return this.IGNORED_DIRECTORIES.some(ignored => 
      dirName === ignored || dirName.startsWith(ignored)
    );
  }

  private static isIgnoredFile(fileName: string, options: FilterOptions): boolean {
    // Check explicit ignore list
    if (this.IGNORED_FILES.includes(fileName)) return true;

    // Check patterns
    if (this.IGNORED_PATTERNS.some(pattern => pattern.test(fileName))) return true;

    // Check custom ignore patterns
    if (options.customIgnore.some(pattern => fileName.includes(pattern))) return true;

    // Check file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !this.SOURCE_EXTENSIONS.includes(ext)) return true;

    // Skip test files if not included
    if (!options.includeTests && this.isTestFile(fileName)) return true;

    // Skip style files if not included
    if (!options.includeStyles && this.isStyleFile(fileName)) return true;

    // Skip config files if not included
    if (!options.includeConfig && this.isConfigFile(fileName)) return true;

    return false;
  }

  private static isTestFile(fileName: string): boolean {
    return /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(fileName) ||
           fileName.includes('__tests__') ||
           fileName.includes('.test.') ||
           fileName.includes('.spec.');
  }

  private static isStyleFile(fileName: string): boolean {
    return /\.(css|scss|sass|less|styl)$/.test(fileName);
  }

  private static isConfigFile(fileName: string): boolean {
    const configFiles = [
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      'babel.config.js', '.babelrc', 'tsconfig.json', 'jsconfig.json',
      'eslint.config.js', '.eslintrc', 'prettier.config.js',
      'tailwind.config.js', 'postcss.config.js'
    ];
    return configFiles.some(config => fileName.includes(config));
  }

  private static categorizeFile(fileName: string, content: string): ProjectFile['category'] {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (this.isConfigFile(fileName)) return 'config';
    if (fileName.toLowerCase().includes('readme')) return 'documentation';
    if (ext === 'md') return 'documentation';
    
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'vue':
      case 'svelte':
        return 'source';
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return 'source';
      case 'json':
      case 'yml':
      case 'yaml':
        return 'config';
      default:
        return 'source';
    }
  }

  static getDefaultOptions(): FilterOptions {
    return {
      includeTests: false,
      includeStyles: true,
      includeConfig: true,
      maxFileSize: 1024, // 1MB
      customIgnore: []
    };
  }

  static isMinifiedCode(content: string, fileName: string): boolean {
    // Check filename patterns
    if (/\.(min|bundle|chunk)\.js$/.test(fileName)) return true;
    
    // Check content characteristics
    const lines = content.split('\n');
    if (lines.length < 10 && content.length > 1000) return true; // Long single lines
    
    // Check for obfuscated variable names
    const singleCharVars = content.match(/\b[a-z]\b/g);
    if (singleCharVars && singleCharVars.length > 50) return true;
    
    return false;
  }

  static shouldAnalyzeFile(file: ProjectFile): boolean {
    if (file.type !== 'file') return false;
    if (file.ignored) return false;
    if (!file.content) return false;
    
    // Skip empty files
    if (file.content.trim().length === 0) return false;
    
    // Skip very large files (likely generated)
    if (file.size && file.size > 1024 * 1024) return false; // 1MB
    
    // Skip minified code
    if (this.isMinifiedCode(file.content, file.name)) return false;
    
    return true;
  }
}