import { useState, useEffect } from 'react';
import { PreDefinedFieldsConfig } from '@/components/pdf-builder/PDFBuilder';
import { ApiService } from '@/services/apiService';

export const usePreDefinedFields = () => {
  const [preDefinedFields, setPreDefinedFields] = useState<PreDefinedFieldsConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreDefinedFields = async () => {
      try {
        setLoading(true);
        setError(null);
        const fields = await ApiService.getPreDefinedFields();
        setPreDefinedFields(fields);
      } catch (err) {
        setError('Failed to load pre-defined fields');
        console.error('Error loading pre-defined fields:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreDefinedFields();
  }, []);

  return { preDefinedFields, loading, error };
};