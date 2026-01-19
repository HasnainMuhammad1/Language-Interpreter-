import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to handle multi-language code translation
 * Supports Python, Java, and C with translation between all combinations
 * Manages translation state, API calls, and auto-translate functionality
 */
export function useTranslator(initialCode = '', initialLanguage = 'python', autoTranslate = false) {
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [sourceLanguage, setSourceLanguage] = useState(initialLanguage);
  const [translations, setTranslations] = useState({
    python: '',
    java: '',
    c: ''
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  // Auto-translate effect
  useEffect(() => {
    if (!autoTranslate || !sourceCode.trim()) return;

    const timer = setTimeout(() => {
      translate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [sourceCode, sourceLanguage, autoTranslate]);

  const translate = async () => {
    if (!sourceCode.trim()) {
      setError('Please enter some code');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      // Determine target languages (all except source)
      const allLanguages = ['python', 'java', 'c'];
      const targetLanguages = allLanguages.filter(lang => lang !== sourceLanguage.toLowerCase());

      const response = await axios.post('/api/translate', {
        code: sourceCode,
        sourceLanguage,
        targetLanguages
      });

      if (response.data.success) {
        setTranslations(response.data.translations);
      } else {
        setError(response.data.error || 'Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(
        err.response?.data?.error ||
        'Failed to translate code. Make sure the backend server is running.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const reset = () => {
    setTranslations({
      python: '',
      java: '',
      c: ''
    });
    setError('');
  };

  const changeSourceLanguage = (newLanguage) => {
    setSourceLanguage(newLanguage);
    reset();
  };

  return {
    sourceCode,
    setSourceCode,
    sourceLanguage,
    setSourceLanguage: changeSourceLanguage,
    translations,
    isTranslating,
    error,
    translate,
    reset
  };
}
