"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  Database,
  FileJson,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function DataManagementPage() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [exporting, setExporting] = useState(false);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/json") {
        setImportFile(file);
        setImportStatus({ type: null, message: "" });
      } else {
        setImportStatus({
          type: "error",
          message: "JSONファイルを選択してください",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportStatus({
        type: "error",
        message: "ファイルを選択してください",
      });
      return;
    }

    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      // TODO: 実際のAPI呼び出しを実装
      console.log("Importing data:", data);

      // シミュレーション
      setTimeout(() => {
        setImportStatus({
          type: "success",
          message: `${data.polls?.length || 0}件の投票をインポートしました`,
        });
        setImportFile(null);
      }, 1500);
    } catch (error) {
      setImportStatus({
        type: "error",
        message: "インポートに失敗しました。ファイル形式を確認してください",
      });
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      // TODO: 実際のAPI呼び出しを実装
      // const response = await fetch(`/api/admin/export?type=${type}`);
      // const data = await response.json();

      // シミュレーション用のダミーデータ
      const dummyData = {
        polls: [
          {
            id: "1",
            title: "サンプル投票",
            description: "これはサンプルです",
            options: ["選択肢1", "選択肢2"],
          },
        ],
        votes: [],
        exported_at: new Date().toISOString(),
      };

      // ダウンロード処理
      const blob = new Blob([JSON.stringify(dummyData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${type}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: "success",
        message: "エクスポートが完了しました",
      });
    } catch (error) {
      setImportStatus({
        type: "error",
        message: "エクスポートに失敗しました",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">データ管理</h2>

      {/* アラート表示 */}
      {importStatus.type && (
        <Alert className={`mb-6 ${importStatus.type === "error" ? "border-red-500" : "border-green-500"}`}>
          {importStatus.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {importStatus.type === "error" ? "エラー" : "成功"}
          </AlertTitle>
          <AlertDescription>{importStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* インポート */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-6 h-6 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold">データインポート</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            JSON形式のファイルから投票データを一括インポートできます。
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">JSONファイルを選択</Label>
              <Input
                id="import-file"
                type="file"
                accept="application/json"
                onChange={handleImportFileChange}
                className="cursor-pointer"
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">
                  選択ファイル: {importFile.name}
                </p>
              )}
            </div>
            <Button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              インポート実行
            </Button>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              インポート形式の例:
            </p>
            <pre className="text-xs mt-2 overflow-x-auto">
              {JSON.stringify(
                {
                  polls: [
                    {
                      title: "投票タイトル",
                      description: "説明",
                      category: "カテゴリー",
                      options: ["選択肢1", "選択肢2"],
                      deadline: "2025-01-31",
                    },
                  ],
                },
                null,
                2
              )}
            </pre>
          </div>
        </Card>

        {/* エクスポート */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Download className="w-6 h-6 mr-2 text-green-500" />
            <h3 className="text-lg font-semibold">データエクスポート</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            投票データをJSON形式でエクスポートできます。
          </p>
          <div className="space-y-3">
            <Card className="p-4 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">投票データ</p>
                  <p className="text-sm text-gray-500">
                    すべての投票と選択肢
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport("polls")}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">投票結果データ</p>
                  <p className="text-sm text-gray-500">
                    すべての投票履歴と統計
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport("votes")}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">全データ</p>
                  <p className="text-sm text-gray-500">
                    投票、結果、ユーザーすべて
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport("all")}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </div>

      {/* データベース統計 */}
      <Card className="p-6 mt-6">
        <div className="flex items-center mb-4">
          <Database className="w-6 h-6 mr-2 text-purple-500" />
          <h3 className="text-lg font-semibold">データベース統計</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">投票数</p>
            <p className="text-2xl font-bold">24</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">総投票数</p>
            <p className="text-2xl font-bold">15,234</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">ユーザー数</p>
            <p className="text-2xl font-bold">3,456</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">データサイズ</p>
            <p className="text-2xl font-bold">12.3 MB</p>
          </div>
        </div>
      </Card>
    </div>
  );
}