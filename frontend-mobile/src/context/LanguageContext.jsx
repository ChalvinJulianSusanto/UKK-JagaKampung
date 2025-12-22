import { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../utils/translations';

// Create Language Context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
    // Get saved language from localStorage, default to 'id' (Indonesian)
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const saved = localStorage.getItem('appLanguage');
        return saved || 'id';
    });

    // Function to change language
    const setLanguage = (lang) => {
        if (lang === 'id' || lang === 'en') {
            setCurrentLanguage(lang);
            localStorage.setItem('appLanguage', lang);
        }
    };

    // Translation helper function
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return value || key;
    };

    const value = {
        currentLanguage,
        setLanguage,
        t,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use language context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
