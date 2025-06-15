import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Info } from 'lucide-react';
const Settings: React.FC = () => {
  const {
    t,
    i18n
  } = useTranslation();
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };
  const languages = [{
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  }, {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    flag: '🇧🇷'
  }, {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸'
  }];
  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('navigation.settings')}</h1>
        <p className="text-gray-600 mt-2">Manage your application preferences and company information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Information about YOTE Farmview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name</label>
              <p className="text-lg font-semibold text-gray-900">YOTE Farmview</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tax ID (EIN)</label>
              <p className="text-gray-900 font-mono">12-3456789</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Industry</label>
              <p className="text-gray-900">Agricultural Technology</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              <p className="text-gray-900">United States</p>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              System Information
            </CardTitle>
            <CardDescription>
              Application version and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Application Name</label>
              <p className="text-lg font-semibold text-gray-900">{t('app.title')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Version</label>
              <Badge variant="secondary" className="text-sm">v2.1.0</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Build Date</label>
              <p className="text-gray-900">June 2025</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">License</label>
              <p className="text-gray-900">Commercial License</p>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language Settings
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Application Language</label>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(language => <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Changes will be applied immediately
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Settings;