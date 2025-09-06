'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  FileJson,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Database,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import Papa from 'papaparse';

interface ImportFile {
  file: File;
  type: 'words' | 'polls' | 'votes';
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'importing' | 'imported' | 'error';
  data?: any[];
  errors?: string[];
  preview?: any[];
}

export default function ImportPage() {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ImportFile | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: ImportFile[] = acceptedFiles.map(file => {
      const type = detectFileType(file.name);
      return {
        file,
        type,
        status: 'pending',
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // 自動的にファイルを検証
    newFiles.forEach(importFile => {
      validateFile(importFile);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const detectFileType = (filename: string): 'words' | 'polls' | 'votes' => {
    const lower = filename.toLowerCase();
    if (lower.includes('word')) return 'words';
    if (lower.includes('poll')) return 'polls';
    if (lower.includes('vote')) return 'votes';
    return 'words'; // デフォルト
  };

  const validateFile = async (importFile: ImportFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.file === importFile.file 
          ? { ...f, status: 'validating' } 
          : f
      ));

      const text = await importFile.file.text();
      let data: any[] = [];
      let errors: string[] = [];

      if (importFile.file.name.endsWith('.json')) {
        try {
          data = JSON.parse(text);
          if (!Array.isArray(data)) {
            errors.push('JSONファイルは配列形式である必要があります');
          }
        } catch (e) {
          errors.push('無効なJSONフォーマットです');
        }
      } else if (importFile.file.name.endsWith('.csv')) {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        
        if (result.errors.length > 0) {
          errors = result.errors.map(e => e.message);
        } else {
          data = result.data;
        }
      }

      // データ検証
      if (data.length > 0 && errors.length === 0) {
        const validationErrors = validateDataStructure(data, importFile.type);
        errors.push(...validationErrors);
      }

      setFiles(prev => prev.map(f => 
        f.file === importFile.file 
          ? {
              ...f,
              status: errors.length > 0 ? 'invalid' : 'valid',
              data,
              errors: errors.length > 0 ? errors : undefined,
              preview: data.slice(0, 5), // プレビュー用に最初の5件を保存
            }
          : f
      ));
    } catch (error) {
      console.error('File validation error:', error);
      setFiles(prev => prev.map(f => 
        f.file === importFile.file 
          ? {
              ...f,
              status: 'error',
              errors: ['ファイルの読み込みに失敗しました'],
            }
          : f
      ));
    }
  };

  const validateDataStructure = (data: any[], type: string): string[] => {
    const errors: string[] = [];

    if (type === 'words') {
      const requiredFields = ['word', 'accentType'];
      data.forEach((item, index) => {
        requiredFields.forEach(field => {
          if (!item[field]) {
            errors.push(`行 ${index + 1}: ${field} フィールドが必要です`);
          }
        });
      });
    } else if (type === 'polls') {
      const requiredFields = ['title', 'options'];
      data.forEach((item, index) => {
        requiredFields.forEach(field => {
          if (!item[field]) {
            errors.push(`行 ${index + 1}: ${field} フィールドが必要です`);
          }
        });
      });
    }

    return errors.slice(0, 5); // 最初の5件のエラーのみ表示
  };

  const handleImport = async (file: ImportFile) => {
    setSelectedFile(file);
    setShowConfirmDialog(true);
  };

  const confirmImport = async () => {
    if (!selectedFile || !selectedFile.data) return;

    try {
      setImporting(true);
      setShowConfirmDialog(false);

      setFiles(prev => prev.map(f => 
        f.file === selectedFile.file 
          ? { ...f, status: 'importing' } 
          : f
      ));

      const response = await fetch(`/api/admin/import/${selectedFile.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ data: selectedFile.data }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setFiles(prev => prev.map(f => 
          f.file === selectedFile.file 
            ? { ...f, status: 'imported' } 
            : f
        ));

        toast({
          title: 'インポート完了',
          description: `${result.count}件のデータをインポートしました`,
        });

        setActiveTab('results');
      } else {
        throw new Error('インポートに失敗しました');
      }
    } catch (error) {
      console.error('Import error:', error);
      
      setFiles(prev => prev.map(f => 
        f.file === selectedFile.file 
          ? { ...f, status: 'error', errors: ['インポートに失敗しました'] } 
          : f
      ));

      toast({
        title: 'インポート失敗',
        description: 'データのインポート中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      setSelectedFile(null);
    }
  };

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  const getStatusIcon = (status: ImportFile['status']) => {
    switch (status) {
      case 'valid':
      case 'imported':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'invalid':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'validating':
      case 'importing':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ImportFile['status']) => {
    const variants: Record<ImportFile['status'], any> = {
      pending: 'secondary',
      validating: 'secondary',
      valid: 'success',
      invalid: 'destructive',
      importing: 'default',
      imported: 'success',
      error: 'destructive',
    };

    const labels: Record<ImportFile['status'], string> = {
      pending: '待機中',
      validating: '検証中',
      valid: '有効',
      invalid: '無効',
      importing: 'インポート中',
      imported: '完了',
      error: 'エラー',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">データインポート</h1>
        <p className="text-gray-600 mt-2">CSV/JSONファイルからデータを一括インポート</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">アップロード</TabsTrigger>
          <TabsTrigger value="preview">プレビュー</TabsTrigger>
          <TabsTrigger value="results">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* ドロップゾーン */}
          <Card>
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? 'ファイルをドロップしてください'
                    : 'ファイルをドラッグ&ドロップ'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  または<span className="text-primary-600 font-medium">クリックして選択</span>
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  対応フォーマット: JSON, CSV
                </p>
              </div>
            </CardContent>
          </Card>

          {/* アップロードファイル一覧 */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>アップロードファイル</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ファイル名</TableHead>
                      <TableHead>タイプ</TableHead>
                      <TableHead>サイズ</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead className="text-center">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((importFile) => (
                      <TableRow key={importFile.file.name}>
                        <TableCell className="flex items-center gap-2">
                          {getStatusIcon(importFile.status)}
                          <span className="font-medium">{importFile.file.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {importFile.type === 'words' && '単語データ'}
                            {importFile.type === 'polls' && '投票データ'}
                            {importFile.type === 'votes' && '投票結果'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(importFile.file.size / 1024).toFixed(2)} KB
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(importFile.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {importFile.status === 'valid' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFile(importFile);
                                    setActiveTab('preview');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleImport(importFile)}
                                  disabled={importing}
                                >
                                  インポート
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(importFile.file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* エラー表示 */}
                {files.some(f => f.errors && f.errors.length > 0) && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">検証エラー</h4>
                    {files.filter(f => f.errors).map((file) => (
                      <div key={file.file.name} className="mb-2">
                        <p className="font-medium text-sm text-red-800">{file.file.name}:</p>
                        <ul className="list-disc list-inside text-sm text-red-700 ml-2">
                          {file.errors?.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {selectedFile && selectedFile.preview && (
            <Card>
              <CardHeader>
                <CardTitle>データプレビュー: {selectedFile.file.name}</CardTitle>
                <CardDescription>
                  最初の5件を表示しています（合計: {selectedFile.data?.length}件）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm">
                    {JSON.stringify(selectedFile.preview, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleImport(selectedFile)}
                    disabled={importing}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    インポート実行
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                  >
                    戻る
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>インポート結果</CardTitle>
            </CardHeader>
            <CardContent>
              {files.filter(f => f.status === 'imported').length > 0 ? (
                <div className="space-y-4">
                  {files.filter(f => f.status === 'imported').map((file) => (
                    <div key={file.file.name} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{file.file.name}</p>
                          <p className="text-sm text-green-700">
                            {file.data?.length}件のデータを正常にインポートしました
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  インポート結果がありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* テンプレートダウンロード */}
      <Card>
        <CardHeader>
          <CardTitle>インポートテンプレート</CardTitle>
          <CardDescription>
            データフォーマットの参考にテンプレートファイルをダウンロードできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              単語データテンプレート
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              投票データテンプレート
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              投票結果テンプレート
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>インポートの確認</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedFile && (
                <>
                  <span className="font-bold">{selectedFile.file.name}</span> から
                  <span className="font-bold"> {selectedFile.data?.length} 件</span>のデータをインポートします。
                  <br />
                  この操作は取り消すことができません。続行しますか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} disabled={importing}>
              {importing ? 'インポート中...' : 'インポート実行'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}