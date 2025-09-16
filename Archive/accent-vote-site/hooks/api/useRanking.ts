import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  RankingResult, 
  RankingParams, 
  ComparisonResult 
} from '@/types/ranking';

/**
 * ランキングデータ取得フック
 */
export const useRanking = (
  params: RankingParams,
  options?: UseQueryOptions<RankingResult>
) => {
  return useQuery<RankingResult>({
    queryKey: ['ranking', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (params.prefectureCode) queryParams.append('prefectureCode', params.prefectureCode);
      if (params.period) queryParams.append('period', params.period);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.ageGroup) queryParams.append('ageGroup', params.ageGroup);
      if (params.gender) queryParams.append('gender', params.gender);
      
      const response = await api.get(`/api/ranking?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 30 * 60 * 1000, // 30分間保持
    ...options
  });
};

/**
 * 都道府県比較データ取得フック
 */
export const useComparisonData = (
  prefectureCodes: string[],
  options?: UseQueryOptions<ComparisonResult>
) => {
  return useQuery<ComparisonResult>({
    queryKey: ['ranking-comparison', prefectureCodes],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      prefectureCodes.forEach(code => queryParams.append('prefectures', code));
      
      const response = await api.get(`/api/ranking/comparison?${queryParams.toString()}`);
      return response.data;
    },
    enabled: prefectureCodes.length >= 2 && prefectureCodes.length <= 3,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
    gcTime: 30 * 60 * 1000, // 30分間保持
    ...options
  });
};

/**
 * CSVエクスポート関数
 */
export const exportRankingCSV = async (params: RankingParams): Promise<void> => {
  const queryParams = new URLSearchParams();
  
  if (params.prefectureCode) queryParams.append('prefectureCode', params.prefectureCode);
  if (params.period) queryParams.append('period', params.period);
  if (params.ageGroup) queryParams.append('ageGroup', params.ageGroup);
  if (params.gender) queryParams.append('gender', params.gender);
  
  const response = await fetch(`/api/ranking/export?${queryParams.toString()}`, {
    method: 'GET',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('CSVエクスポートに失敗しました');
  }
  
  const csvData = await response.text();
  
  // ダウンロード処理
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // ファイル名生成
  const filename = `ranking_${params.prefectureCode || 'all'}_${params.period || '30d'}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', filename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};