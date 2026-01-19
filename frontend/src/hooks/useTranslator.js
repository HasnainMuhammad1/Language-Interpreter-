import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to handle Python code translation to Java and C
 * Manages translation state, API calls, and auto-translate functionality
 */
export function useTranslator(initialCode = '', autoTranslate = false) {
  const [pythonCode, setPythonCode] = useState(initialCode);
  const [javaCode, setJavaCode] = useState('');
  const [cCode, setCCode] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  // Auto-translate effect
  useEffect(() => {
    if (!autoTranslate || !pythonCode) return;

    const timer = setTimeout(() => {
      translate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [pythonCode, autoTranslate]);

  const translate = async () => {
    if (!pythonCode.trim()) {
      setError('Please enter some Python code');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const response = await axios.post('/api/translate/all', {
        code: pythonCode
      });

      if (response.data.success) {
        setJavaCode(response.data.translations.java);
        setCCode(response.data.translations.c);
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
    setJavaCode('');
    setCCode('');
    setError('');
  };

  return {
    pythonCode,
    setPythonCode,
    javaCode,
    cCode,
    isTranslating,
    error,
    translate,
    reset
  };
}
