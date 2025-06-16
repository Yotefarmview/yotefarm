
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Globe, Info, Edit, Save, X } from 'lucide-react';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  
  // Company information state
  const [companyInfo, setCompanyInfo] = useState({
    name: 'YOTE Farmview',
    taxId: '33-4462377',
    industry: 'Agricultural Technology',
    location: 'United States'
  });
  
  const [editedInfo, setEditedInfo] = useState(companyInfo);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo(companyInfo);
  };

  const handleSave = () => {
    setCompanyInfo(editedInfo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo(companyInfo);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('navigation.settings')}</h1>
        <p className="text-gray-600 mt-2">Manage your application preferences and company information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              Information about your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Company Name</Label>
              {isEditing ? (
                <Input
                  value={editedInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{companyInfo.name}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tax ID (EIN)</Label>
              {isEditing ? (
                <Input
                  value={editedInfo.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="mt-1 font-mono"
                />
              ) : (
                <p className="text-gray-900 font-mono">{companyInfo.taxId}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Industry</Label>
              {isEditing ? (
                <Input
                  value={editedInfo.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.industry}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Location</Label>
              {isEditing ? (
                <Input
                  value={editedInfo.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.location}</p>
              )}
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
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-gray-700">Application Language</label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(language => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{language.flag}</span>
                          <span>{language.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Changes will be applied immediately
                </p>
              </div>
              <div className="ml-8">
                <img 
                  src="/lovable-uploads/94965d98-6374-44c6-bcf3-e20ed2a15c77.png" 
                  alt="YOTE Farmview Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
