
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { ThemeToggle } from '../theme-toggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      <motion.main
        animate={{ marginLeft: 0 }}
        className="flex-1 overflow-hidden"
      >
        <div className="h-full overflow-y-auto">
          {/* Header com botão de tema */}
          <div className="flex justify-end p-4 border-b border-border">
            <ThemeToggle />
          </div>
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;
