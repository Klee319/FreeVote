'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Download,
  Upload,
  Database,
  FileJson,
  FileSpreadsheet,
  Archive,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ExportStatus {
  isExporting: boolean;
  type: string | null;
}

export default function DataManagementPage() {
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    isExporting: false,
    type: null,
  });
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const handleExport = async (type: 'words' | 'polls' | 'votes' | 'all', fileFormat: 'csv' | 'json') => {
    try {
      setExportStatus({ isExporting: true, type });
      
      const response = await fetch(`/api/admin/export/${type}?format=${fileFormat}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('エクスポートに失敗しました');
      }

      // ファイルのダウンロード処理
      const blob = await response.blob();
      const filename = `${type}_${format(new Date(), 'yyyyMMdd_HHmmss')}.${fileFormat}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'エクスポート完了',
        description: `${filename} をダウンロードしました`,
      });

      if (type === 'all') {
        setLastBackup(new Date());
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'エクスポート失敗',
        description: 'データのエクスポート中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setExportStatus({ isExporting: false, type: null });
    }
  };

  const exportCards = [
    {
      title: '単語データ',
      description: '登録されている単語とアクセント情報をエクスポート',
      icon: FileText,
      type: 'words' as const,
      formats: ['CSV', 'JSON'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '投票データ',
      description: 'すべての投票と選択肢の情報をエクスポート',
      icon: FileSpreadsheet,
      type: 'polls' as const,
      formats: ['CSV', 'JSON'],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '投票結果',
      description: 'ユーザーの投票履歴と統計データをエクスポート',
      icon: Database,
      type: 'votes' as const,
      formats: ['CSV', 'JSON'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '完全バックアップ',
      description: 'すべてのデータを一括エクスポート',
      icon: Archive,
      type: 'all' as const,
      formats: ['JSON'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">データ管理</h1>
        <p className="text-gray-600 mt-2">システムデータのインポート・エクスポート管理</p>
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`p-3 rounded-lg ${lastBackup ? 'bg-green-50' : 'bg-gray-50'}`}>
              {lastBackup ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">最終バックアップ</p>
              <p className="text-lg font-semibold">
                {lastBackup 
                  ? format(lastBackup, 'yyyy/MM/dd HH:mm', { locale: ja })
                  : '未実行'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-blue-50">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">データベースサイズ</p>
              <p className="text-lg font-semibold">約 12.5 MB</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">自動バックアップ</p>
              <p className="text-lg font-semibold">毎日 3:00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* エクスポートセクション */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">データエクスポート</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exportCards.map((card) => (
            <Card key={card.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {card.formats.map((format) => (
                    <Button
                      key={format}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(card.type, format.toLowerCase() as 'csv' | 'json')}
                      disabled={exportStatus.isExporting}
                    >
                      {exportStatus.isExporting && exportStatus.type === card.type ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary-600 border-t-transparent mr-2" />
                          エクスポート中...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {format}形式
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* インポートセクション */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">データインポート</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              一括インポート
            </CardTitle>
            <CardDescription>
              CSV/JSONファイルからデータを一括インポートできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900">インポート時の注意事項</p>
                    <ul className="list-disc list-inside mt-2 text-amber-800 space-y-1">
                      <li>既存のデータは上書きされる可能性があります</li>
                      <li>インポート前に必ずバックアップを取得してください</li>
                      <li>大量のデータをインポートする場合は時間がかかることがあります</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.href = '/admin/import'}
                  className="flex items-center gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  インポート画面へ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'テンプレートダウンロード',
                      description: 'インポート用テンプレートの準備中です',
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  テンプレートをダウンロード
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 自動バックアップ設定 */}
      <Card>
        <CardHeader>
          <CardTitle>自動バックアップ設定</CardTitle>
          <CardDescription>
            定期的な自動バックアップの設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">日次バックアップ</p>
                  <p className="text-sm text-gray-600">毎日 3:00 に自動実行</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                設定変更
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">バックアップ保持期間</p>
                  <p className="text-sm text-gray-600">30日間</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                設定変更
              </Button>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={() => handleExport('all', 'json')}
              disabled={exportStatus.isExporting}
            >
              {exportStatus.isExporting && exportStatus.type === 'all' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  バックアップ中...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  今すぐバックアップを実行
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}