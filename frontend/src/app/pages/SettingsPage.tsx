import { useState } from 'react';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const s = t.settings;

  const [userSettings, setUserSettings] = useState({
    name: 'Administrateur RH',
    email: localStorage.getItem('userEmail') || '',
    role: 'Administrateur',
    notifications: {
      email: true,
      push: false,
      weekly: true,
    },
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Mock save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setUserSettings({
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        [key]: value,
      },
    });
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
        <p className="text-gray-600 mt-1">{s.subtitle}</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Save className="w-5 h-5" />
          <span>{s.savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7a80020' }}>
              <User className="w-5 h-5" style={{ color: '#f7a800' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.profile}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.fullName}
              </label>
              <input
                type="text"
                value={userSettings.name}
                onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.email}
              </label>
              <input
                type="email"
                value={userSettings.email}
                onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.role}
              </label>
              <select
                value={userSettings.role}
                onChange={(e) => setUserSettings({ ...userSettings, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="Administrateur">Administrateur</option>
                <option value="Manager">Manager</option>
                <option value="RH">RH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.notifications}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{s.emailNotif}</p>
                <p className="text-xs text-gray-500">{s.emailNotifSub}</p>
              </div>
              <button
                onClick={() => handleNotificationChange('email', !userSettings.notifications.email)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.notifications.email ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{s.pushNotif}</p>
                <p className="text-xs text-gray-500">{s.pushNotifSub}</p>
              </div>
              <button
                onClick={() => handleNotificationChange('push', !userSettings.notifications.push)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.notifications.push ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{s.weeklyReport}</p>
                <p className="text-xs text-gray-500">{s.weeklyReportSub}</p>
              </div>
              <button
                onClick={() => handleNotificationChange('weekly', !userSettings.notifications.weekly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.notifications.weekly ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.notifications.weekly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.appearance}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.theme}
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="light">{s.themeLight}</option>
                <option value="dark">{s.themeDark}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.language}
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.security}</h3>
          </div>

          <div className="space-y-4">
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              {s.changePassword}
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              {s.enable2FA}
            </button>
            <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition">
              {s.logoutAll}
            </button>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center p-2" style={{ backgroundColor: '#f7a800' }}>
            <span className="text-white font-bold">ABC</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ABC DIS</h3>
            <p className="text-sm text-gray-600">Système de Gestion RH</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">{s.version}</p>
            <p className="font-semibold text-gray-900">2.5.0</p>
          </div>
          <div>
            <p className="text-gray-600">{s.lastUpdate}</p>
            <p className="font-semibold text-gray-900">27 Mars 2026</p>
          </div>
          <div>
            <p className="text-gray-600">{s.licence}</p>
            <p className="font-semibold text-gray-900">Entreprise</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: '#f7a800' }}
        >
          <Save className="w-5 h-5" />
          {s.saveBtn}
        </button>
      </div>
    </div>
  );
}
