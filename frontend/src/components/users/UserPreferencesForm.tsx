import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateUserPreferences } from '../../features/auth/authSlice';

interface Preferences {
  language: 'en' | 'es' | 'fr' | 'de';
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  newsletter: boolean;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
] as const;

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
] as const;

export default function UserPreferencesForm() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [preferences, setPreferences] = useState<Preferences>({
    language: (user?.preferences?.language as Preferences['language']) || 'en',
    currency: (user?.preferences?.currency as Preferences['currency']) || 'USD',
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? true,
      sms: user?.preferences?.notifications?.sms ?? false,
    },
    newsletter: user?.preferences?.newsletter ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateUserPreferences(preferences));
  };

  const handleNotificationChange = (type: keyof Preferences['notifications']) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Selection */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          Language
        </label>
        <select
          id="language"
          name="language"
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          value={preferences.language}
          onChange={(e) =>
            setPreferences((prev) => ({
              ...prev,
              language: e.target.value as Preferences['language'],
            }))
          }
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Currency Selection */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          value={preferences.currency}
          onChange={(e) =>
            setPreferences((prev) => ({
              ...prev,
              currency: e.target.value as Preferences['currency'],
            }))
          }
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose how you'd like to receive updates.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="email-notifications"
                name="email-notifications"
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={() => handleNotificationChange('email')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="email-notifications"
                className="text-sm font-medium text-gray-700"
              >
                Email notifications
              </label>
              <p className="text-sm text-gray-500">
                Get updates about your bookings and important alerts.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="push-notifications"
                name="push-notifications"
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={() => handleNotificationChange('push')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="push-notifications"
                className="text-sm font-medium text-gray-700"
              >
                Push notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive instant updates on your device.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="sms-notifications"
                name="sms-notifications"
                type="checkbox"
                checked={preferences.notifications.sms}
                onChange={() => handleNotificationChange('sms')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="sms-notifications"
                className="text-sm font-medium text-gray-700"
              >
                SMS notifications
              </label>
              <p className="text-sm text-gray-500">
                Get text messages for critical updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            id="newsletter"
            name="newsletter"
            type="checkbox"
            checked={preferences.newsletter}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                newsletter: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="newsletter" className="text-sm font-medium text-gray-700">
            Newsletter
          </label>
          <p className="text-sm text-gray-500">
            Receive our weekly newsletter with travel tips and special offers.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
