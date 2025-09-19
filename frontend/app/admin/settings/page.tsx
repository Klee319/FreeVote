"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Settings,
  Bell,
  Shield,
  Mail,
  User,
  Lock,
  Database,
  Globe
} from "lucide-react";

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "みんなの投票",
    siteDescription: "みんなで作る投票サイト",
    adminEmail: "admin@example.com",
    contactEmail: "contact@example.com",
    maintenanceMode: false,
    registrationEnabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newPollNotifications: true,
    reportNotifications: true,
    systemNotifications: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    loginAttempts: 5
  });

  const handleSaveGeneral = () => {
    toast({
      title: "設定を保存しました",
      description: "一般設定が正常に更新されました。",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "通知設定を保存しました",
      description: "通知設定が正常に更新されました。",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "セキュリティ設定を保存しました",
      description: "セキュリティ設定が正常に更新されました。",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">設定</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
          <TabsTrigger value="advanced">詳細設定</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5" />
                <h2 className="text-xl font-semibold">サイト設定</h2>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">サイト名</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">サイトの説明</Label>
                  <Input
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">管理者メールアドレス</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">お問い合わせメールアドレス</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>メンテナンスモード</Label>
                    <p className="text-sm text-gray-500">サイトを一時的に非公開にします</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>新規登録を許可</Label>
                    <p className="text-sm text-gray-500">新しいユーザーの登録を許可します</p>
                  </div>
                  <Switch
                    checked={generalSettings.registrationEnabled}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, registrationEnabled: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveGeneral} className="w-full">
                設定を保存
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5" />
                <h2 className="text-xl font-semibold">通知設定</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>メール通知</Label>
                    <p className="text-sm text-gray-500">重要な更新をメールで受け取ります</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>新規投票の通知</Label>
                    <p className="text-sm text-gray-500">新しい投票が作成されたときに通知を受け取ります</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newPollNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newPollNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>報告の通知</Label>
                    <p className="text-sm text-gray-500">不適切なコンテンツの報告を受け取ります</p>
                  </div>
                  <Switch
                    checked={notificationSettings.reportNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, reportNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>システム通知</Label>
                    <p className="text-sm text-gray-500">システムの更新や障害情報を受け取ります</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemNotifications: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                通知設定を保存
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl font-semibold">セキュリティ設定</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>二要素認証</Label>
                    <p className="text-sm text-gray-500">ログイン時に追加の認証を要求します</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">セッションタイムアウト（分）</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-gray-500">非アクティブ時に自動ログアウトするまでの時間</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">パスワード有効期限（日）</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-gray-500">パスワードの変更が必要になるまでの日数</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">ログイン試行回数制限</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-gray-500">アカウントがロックされるまでの失敗回数</p>
                </div>
              </div>

              <Button onClick={handleSaveSecurity} className="w-full">
                セキュリティ設定を保存
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5" />
                <h2 className="text-xl font-semibold">詳細設定</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>データベースバックアップ</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      バックアップを作成
                    </Button>
                    <Button variant="outline" className="flex-1">
                      バックアップから復元
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>キャッシュ管理</Label>
                  <Button variant="outline" className="w-full">
                    キャッシュをクリア
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>ログ管理</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      ログをエクスポート
                    </Button>
                    <Button variant="outline" className="flex-1">
                      古いログを削除
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>システム情報</Label>
                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">バージョン:</span> 1.0.0</p>
                      <p><span className="font-medium">最終更新:</span> 2025-01-19</p>
                      <p><span className="font-medium">データベース:</span> SQLite</p>
                      <p><span className="font-medium">環境:</span> Production</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}