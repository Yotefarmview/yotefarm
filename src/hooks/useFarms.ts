
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Farm = Tables<'fazendas'>;

export const useFarms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fazendas');
    } finally {
      setLoading(false);
    }
  };

  const createFarm = async (farmData: Omit<Farm, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const { data, error } = await supabase
        .from('fazendas')
        .insert([farmData])
        .select()
        .single();

      if (error) throw error;
      setFarms(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fazenda');
      throw err;
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  return {
    farms,
    loading,
    error,
    createFarm,
    refetch: fetchFarms
  };
};
