
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Block = Tables<'blocos_fazenda'>;

export const useBlocks = (farmId?: string) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async () => {
    if (!farmId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocos_fazenda')
        .select('*')
        .eq('fazenda_id', farmId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setBlocks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar blocos');
    } finally {
      setLoading(false);
    }
  };

  const createBlock = async (blockData: Omit<Block, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const { data, error } = await supabase
        .from('blocos_fazenda')
        .insert([blockData])
        .select()
        .single();

      if (error) throw error;
      setBlocks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar bloco');
      throw err;
    }
  };

  const updateBlock = async (id: string, updates: Partial<Block>) => {
    try {
      const { data, error } = await supabase
        .from('blocos_fazenda')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBlocks(prev => prev.map(block => block.id === id ? data : block));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar bloco');
      throw err;
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocos_fazenda')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlocks(prev => prev.filter(block => block.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar bloco');
      throw err;
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [farmId]);

  return {
    blocks,
    loading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch: fetchBlocks
  };
};
