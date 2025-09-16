'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Shield,
  Globe,
  Database,
  Clock,
  Mail,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  rateLimit: {
    voteLimit: number;
    voteLimitPeriod: string;
    apiRateLimit: number;
    apiRateLimitPeriod: string;
  };
  domains: {
    allowedDomains: string[];
    blockedDomains: string[];
    corsEnabled: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    redisEnabled: boolean;
    redisUrl?: string;
  };
  email: {
    provider: string;
    from: string;
    smtpHost?: string;
    smtpPort?: number;
  };
}

interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: '気になる投票所',
      siteDescription: 'みんなで作る投票プラットフォーム',
      maintenanceMode: false,
      registrationEnabled: true,
    },
    rateLimit: {
      voteLimit: 100,
      voteLimitPeriod: 'hour',
      apiRateLimit: 1000,
      apiRateLimitPeriod: 'hour',
    },
    domains: {
      allowedDomains: [],
      blockedDomains: [],
      corsEnabled: true,
    },
    cache: {
      enabled: true,
      ttl: 3600,
      redisEnabled: false,
      redisUrl: '',
    },
    email: {
      provider: 'smtp',
      from: 'noreply@example.com',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
    },
  });

  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchEnvironmentVariables();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: 'エラー',
        description: '設定の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvironmentVariables = async () => {
    try {
      const response = await fetch('/api/admin/env', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEnvVars(data.variables);
      }
    } catch (error) {
      console.error('Failed to fetch environment variables:', error);
    }
  };

  const handleSaveSettings = async (section: keyof SystemSettings) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          section,
          data: settings[section],
        }),
      });

      if (response.ok) {
        toast({
          title: '保存完了',
          description: '設定を更新しました',
        });
      } else {
        throw new Error('設定の保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = (type: 'allowed' | 'blocked') => {
    const domain = prompt(`${type === 'allowed' ? '許可' : 'ブロック'}するドメインを入力してください`);
    if (domain) {
      setSettings(prev => ({
        ...prev,
        domains: {
          ...prev.domains,
          [`${type}Domains`]: [...prev.domains[`${type}Domains`], domain],
        },
      }));
    }
  };

  const handleRemoveDomain = (type: 'allowed' | 'blocked', domain: string) => {
    setSettings(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        [`${type}Domains`]: prev.domains[`${type}Domains`].filter(d => d !== domain),
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">システム設定</h1>
        <p className="text-gray-600 mt-2">サイト全体の設定とシステムパラメータの管理</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="rateLimit">レート制限</TabsTrigger>
          <TabsTrigger value="domains">ドメイン</TabsTrigger>
          <TabsTrigger value="cache">キャッシュ</TabsTrigger>
          <TabsTrigger value="env">環境変数</TabsTrigger>
        </TabsList>

        {/* 一般設定 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                一般設定
              </CardTitle>
              <CardDescription>
                サイトの基本情報とメンテナンスモードの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">サイト名</Label>
                <Input
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, siteName: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">サイト説明</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, siteDescription: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">メンテナンスモード</Label>
                  <p className="text-sm text-gray-600">有効にするとサイトへのアクセスが制限されます</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, maintenanceMode: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registrationEnabled">新規登録を許可</Label>
                  <p className="text-sm text-gray-600">無効にすると新規ユーザー登録ができなくなります</p>
                </div>
                <Switch
                  id="registrationEnabled"
                  checked={settings.general.registrationEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, registrationEnabled: checked }
                  }))}
                />
              </div>

              <Button
                onClick={() => handleSaveSettings('general')}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    設定を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* レート制限設定 */}
        <TabsContent value="rateLimit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                レート制限設定
              </CardTitle>
              <CardDescription>
                APIとユーザーアクションのレート制限を設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voteLimit">投票制限回数</Label>
                  <Input
                    id="voteLimit"
                    type="number"
                    value={settings.rateLimit.voteLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, voteLimit: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voteLimitPeriod">制限期間</Label>
                  <Select
                    value={settings.rateLimit.voteLimitPeriod}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, voteLimitPeriod: value }
                    }))}
                  >
                    <SelectTrigger id="voteLimitPeriod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">分</SelectItem>
                      <SelectItem value="hour">時間</SelectItem>
                      <SelectItem value="day">日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API制限回数</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={settings.rateLimit.apiRateLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, apiRateLimit: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimitPeriod">制限期間</Label>
                  <Select
                    value={settings.rateLimit.apiRateLimitPeriod}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, apiRateLimitPeriod: value }
                    }))}
                  >
                    <SelectTrigger id="apiRateLimitPeriod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">分</SelectItem>
                      <SelectItem value="hour">時間</SelectItem>
                      <SelectItem value="day">日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900">レート制限について</p>
                    <p className="text-amber-800 mt-1">
                      レート制限を厳しくしすぎると、正常なユーザーの利用に影響が出る可能性があります。
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings('rateLimit')}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    設定を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ドメイン設定 */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                ドメイン設定
              </CardTitle>
              <CardDescription>
                許可・ブロックドメインとCORS設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="corsEnabled">CORS有効化</Label>
                  <p className="text-sm text-gray-600">クロスオリジンリクエストを許可します</p>
                </div>
                <Switch
                  id="corsEnabled"
                  checked={settings.domains.corsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    domains: { ...prev.domains, corsEnabled: checked }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>許可ドメイン</Label>
                  <Button size="sm" variant="outline" onClick={() => handleAddDomain('allowed')}>
                    追加
                  </Button>
                </div>
                <div className="border rounded-lg p-2 min-h-[100px]">
                  {settings.domains.allowedDomains.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      許可ドメインが設定されていません
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {settings.domains.allowedDomains.map((domain) => (
                        <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-mono">{domain}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveDomain('allowed', domain)}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>ブロックドメイン</Label>
                  <Button size="sm" variant="outline" onClick={() => handleAddDomain('blocked')}>
                    追加
                  </Button>
                </div>
                <div className="border rounded-lg p-2 min-h-[100px]">
                  {settings.domains.blockedDomains.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      ブロックドメインが設定されていません
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {settings.domains.blockedDomains.map((domain) => (
                        <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-mono">{domain}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveDomain('blocked', domain)}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings('domains')}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    設定を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* キャッシュ設定 */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                キャッシュ設定
              </CardTitle>
              <CardDescription>
                キャッシュとRedisの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cacheEnabled">キャッシュ有効化</Label>
                  <p className="text-sm text-gray-600">APIレスポンスのキャッシュを有効にします</p>
                </div>
                <Switch
                  id="cacheEnabled"
                  checked={settings.cache.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    cache: { ...prev.cache, enabled: checked }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cacheTtl">キャッシュTTL（秒）</Label>
                <Input
                  id="cacheTtl"
                  type="number"
                  value={settings.cache.ttl}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cache: { ...prev.cache, ttl: parseInt(e.target.value) }
                  }))}
                  disabled={!settings.cache.enabled}
                />
                <p className="text-sm text-gray-600">
                  キャッシュの有効期限（Time To Live）を秒単位で設定
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="redisEnabled">Redis使用</Label>
                  <p className="text-sm text-gray-600">Redisをキャッシュストアとして使用します</p>
                </div>
                <Switch
                  id="redisEnabled"
                  checked={settings.cache.redisEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    cache: { ...prev.cache, redisEnabled: checked }
                  }))}
                  disabled={!settings.cache.enabled}
                />
              </div>

              {settings.cache.redisEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="redisUrl">Redis URL</Label>
                  <Input
                    id="redisUrl"
                    type="text"
                    value={settings.cache.redisUrl || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      cache: { ...prev.cache, redisUrl: e.target.value }
                    }))}
                    placeholder="redis://localhost:6379"
                  />
                </div>
              )}

              <Button
                onClick={() => handleSaveSettings('cache')}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    設定を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 環境変数 */}
        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                環境変数（読み取り専用）
              </CardTitle>
              <CardDescription>
                システムで使用されている環境変数の確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      シークレットを隠す
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      シークレットを表示
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {envVars.map((envVar) => (
                  <div key={envVar.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm font-medium">{envVar.key}</span>
                    <span className="font-mono text-sm text-gray-600">
                      {envVar.isSecret && !showSecrets
                        ? '••••••••'
                        : envVar.value || '(未設定)'}
                    </span>
                  </div>
                ))}
              </div>

              {envVars.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  環境変数が設定されていません
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">環境変数について</p>
                    <p className="text-blue-800 mt-1">
                      環境変数は.envファイルまたはホスティング環境で設定されます。
                      この画面では確認のみ可能で、編集はできません。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}