import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BarChart3, Map, MapPin, Sprout, Settings, Globe, Users } from 'lucide-react';
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle
}) => {
  const {
    t,
    i18n
  } = useTranslation();
  const location = useLocation();
  const menuItems = [{
    path: '/',
    icon: BarChart3,
    label: t('navigation.dashboard')
  }, {
    path: '/farms',
    icon: MapPin,
    label: t('navigation.farms')
  }, {
    path: '/advanced-map-editor',
    icon: Map,
    label: 'Advanced Map Editor'
  }, {
    path: '/applications',
    icon: Sprout,
    label: t('navigation.applications')
  }, {
    path: '/team',
    icon: Users,
    label: 'Team'
  }, {
    path: '/settings',
    icon: Settings,
    label: t('navigation.settings')
  }];
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };
  return <motion.div initial={false} animate={{
    width: isCollapsed ? 64 : 256
  }} transition={{
    duration: 0.3,
    ease: "easeInOut"
  }} className="bg-white border-r border-gray-200 h-screen flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img alt="YOTE Farmview Logo" className="w-8 h-8 object-contain" src="/lovable-uploads/c525fde2-6439-495b-b9e2-3ed05cb0c2a3.png" />
          </div>
          {!isCollapsed && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2
        }}>
              <h1 className="font-bold text-gray-800">{t('app.title')}</h1>
              <p className="text-xs text-gray-500">{t('app.subtitle')}</p>
            </motion.div>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <li key={item.path}>
                <Link to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <motion.span initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.1
              }} className="font-medium">
                      {item.label}
                    </motion.span>}
                </Link>
              </li>;
        })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button onClick={toggleLanguage} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 w-full transition-colors">
          <Globe className="w-5 h-5" />
          {!isCollapsed && <motion.span initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.1
        }} className="font-medium">
              {i18n.language === 'en' ? 'PT-BR' : 'English'}
            </motion.span>}
        </button>
        
        <button onClick={onToggle} className="mt-2 flex items-center justify-center w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <motion.div animate={{
          rotate: isCollapsed ? 180 : 0
        }} transition={{
          duration: 0.3
        }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
        </button>
      </div>
    </motion.div>;
};
export default Sidebar;