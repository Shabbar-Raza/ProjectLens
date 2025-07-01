import { ProjectFile } from '../types';

export const sampleProject: ProjectFile = {
  name: 'my-react-app',
  path: 'my-react-app',
  type: 'directory',
  content: '',
  children: [
    {
      name: 'package.json',
      path: 'my-react-app/package.json',
      type: 'file',
      content: JSON.stringify({
        name: 'my-react-app',
        version: '1.0.0',
        description: 'A sample React application with TypeScript',
        main: 'src/index.tsx',
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-router-dom': '^6.8.0',
          axios: '^1.3.0'
        },
        devDependencies: {
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          typescript: '^4.9.0'
        }
      }, null, 2),
      size: 580
    },
    {
      name: 'src',
      path: 'my-react-app/src',
      type: 'directory',
      content: '',
      children: [
        {
          name: 'App.tsx',
          path: 'my-react-app/src/App.tsx',
          type: 'file',
          content: `import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import UserService from './services/UserService';
import './App.css';

/**
 * Main Application Component
 * Handles routing and global state management
 */
function App(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Load users from the API
   */
  const loadUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const userData = await UserService.fetchUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home users={users} loading={loading} />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
          size: 1024
        },
        {
          name: 'components',
          path: 'my-react-app/src/components',
          type: 'directory',
          content: '',
          children: [
            {
              name: 'Home.tsx',
              path: 'my-react-app/src/components/Home.tsx',
              type: 'file',
              content: `import React from 'react';
import UserCard from './UserCard';

interface HomeProps {
  users: User[];
  loading: boolean;
}

/**
 * Home page component displaying user list
 */
const Home: React.FC<HomeProps> = ({ users, loading }) => {
  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="home">
      <h1>Welcome to My React App</h1>
      <div className="user-grid">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};

export default Home;`,
              size: 512
            },
            {
              name: 'UserCard.tsx',
              path: 'my-react-app/src/components/UserCard.tsx',
              type: 'file',
              content: `import React from 'react';

interface UserCardProps {
  user: User;
}

/**
 * Individual user card component
 */
const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const handleClick = (): void => {
    console.log('User clicked:', user.name);
  };

  return (
    <div className="user-card" onClick={handleClick}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <span className="user-role">{user.role}</span>
    </div>
  );
};

export default UserCard;`,
              size: 384
            }
          ]
        },
        {
          name: 'services',
          path: 'my-react-app/src/services',
          type: 'directory',
          content: '',
          children: [
            {
              name: 'UserService.ts',
              path: 'my-react-app/src/services/UserService.ts',
              type: 'file',
              content: `import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Service class for user-related API operations
 */
class UserService {
  private static baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Fetch all users from the API
   */
  static async fetchUsers(): Promise<User[]> {
    try {
      const response = await axios.get(\`\${this.baseURL}/api/users\`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await axios.post(\`\${this.baseURL}/api/users\`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(\`\${this.baseURL}/api/users/\${id}\`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }
}

export default UserService;`,
              size: 1280
            }
          ]
        },
        {
          name: 'types.ts',
          path: 'my-react-app/src/types.ts',
          type: 'file',
          content: `/**
 * Global type definitions for the application
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}`,
          size: 256
        }
      ]
    },
    {
      name: 'README.md',
      path: 'my-react-app/README.md',
      type: 'file',
      content: `# My React App

A sample React application built with TypeScript demonstrating modern development practices.

## Features

- ⚡ Fast development with Vite
- 🎯 TypeScript for type safety
- 🎨 Modern UI components
- 🔄 State management with React hooks
- 📱 Responsive design

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm start\`
3. Build for production: \`npm run build\`

## Project Structure

- \`src/components/\` - React components
- \`src/services/\` - API service classes
- \`src/types.ts\` - TypeScript type definitions

## Contributing

Please read our contributing guidelines before submitting PRs.`,
      size: 640
    }
  ]
};