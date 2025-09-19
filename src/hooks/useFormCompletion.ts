import { useState, useEffect } from 'react';
import { ApiService, FormCompletionData } from '@/services/apiService';

export const useFormCompletion = (formId?: string) => {
  const [formData, setFormData] = useState<FormCompletionData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ApiService.getFormCompletionData(formId);
        setFormData(data);
      } catch (err) {
        setError('Failed to load form completion data');
        console.error('Error loading form completion data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [formId]);

  const saveFormCompletion = async (data: FormCompletionData, templateId: string) => {
    try {
      const result = await ApiService.saveFormCompletion(data, templateId);
      return result;
    } catch (err) {
      console.error('Error saving form completion:', err);
      throw err;
    }
  };

  return { formData, loading, error, saveFormCompletion };
};