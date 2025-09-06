'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield,
  Lock,
  AlertTriangle,
  Activity,
  Globe,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Key,
  UserX,
  Clock,
  MapPin
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'IP_BLOCKED' | 'RATE_LIMIT_EXCEEDED';
  ipAddress: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt: string | null;
  autoBlocked: boolean;
}

interface AuthSettings {
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    requireEmailVerification: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    twoFactorEnabled: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [newIPDialog, setNewIPDialog] = useState(false);
  const [newIP, setNewIP] = useState({ address: '', reason: '' });
  const [selectedIP, setSelectedIP] = useState<BlockedIP | null>(null);
  const [removeIPDialog, setRemoveIPDialog] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, [logFilter, severityFilter]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // セキュリティログを取得
      const logsParams = new URLSearchParams({
        ...(logFilter !== 'ALL' && { eventType: logFilter }),
        ...(severityFilter !== 'ALL' && { severity: severityFilter }),
      });
      
      const [logsRes, ipsRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/security/logs?${logsParams}`, { credentials: 'include' }),
        fetch('/api/admin/security/blocked-ips', { credentials: 'include' }),
        fetch('/api/admin/security/auth-settings', { credentials: 'include' }),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (ipsRes.ok) {
        const ipsData = await ipsRes.json();
        setBlockedIPs(ipsData.blockedIPs || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setAuthSettings(settingsData.settings || authSettings);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast({
        title: 'エラー',
        description: 'セキュリティデータの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP.address || !newIP.reason) {
      toast({
        title: 'エラー',
        description: 'IPアドレスと理由を入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ipAddress: newIP.address,
          reason: newIP.reason,
        }),
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: 'IPアドレスをブロックしました',
        });
        setNewIPDialog(false);
        setNewIP({ address: '', reason: '' });
        fetchSecurityData();
      } else {
        throw new Error('IPアドレスのブロックに失敗しました');
      }
    } catch (error) {
      console.error('Failed to block IP:', error);
      toast({
        title: 'エラー',
        description: 'IPアドレスのブロックに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleUnblockIP = async () => {
    if (!selectedIP) return;

    try {
      const response = await fetch(`/api/admin/security/unblock-ip/${selectedIP.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: 'IPアドレスのブロックを解除しました',
        });
        setRemoveIPDialog(false);
        setSelectedIP(null);
        fetchSecurityData();
      } else {
        throw new Error('ブロック解除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to unblock IP:', error);
      toast({
        title: 'エラー',
        description: 'ブロック解除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAuthSettings = async () => {
    try {
      const response = await fetch('/api/admin/security/auth-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(authSettings),
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: '認証設定を更新しました',
        });
      } else {
        throw new Error('認証設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save auth settings:', error);
      toast({
        title: 'エラー',
        description: '認証設定の更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'warning',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[severity]}>{severity}</Badge>;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LOGIN_FAILURE':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'IP_BLOCKED':
        return <Ban className="h-4 w-4 text-red-600" />;
      case 'RATE_LIMIT_EXCEEDED':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
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
        <h1 className="text-3xl font-bold text-gray-900">セキュリティ設定</h1>
        <p className="text-gray-600 mt-2">システムのセキュリティ監視と設定管理</p>
      </div>

      {/* セキュリティステータス */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-green-50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">セキュリティステータス</p>
              <p className="text-lg font-semibold text-green-600">正常</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">不審なアクティビティ</p>
              <p className="text-lg font-semibold">{logs.filter(l => l.eventType === 'SUSPICIOUS_ACTIVITY').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-orange-50">
              <Ban className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ブロック中のIP</p>
              <p className="text-lg font-semibold">{blockedIPs.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-blue-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24時間のイベント</p>
              <p className="text-lg font-semibold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">セキュリティログ</TabsTrigger>
          <TabsTrigger value="ip-restrictions">IP制限</TabsTrigger>
          <TabsTrigger value="auth-settings">認証設定</TabsTrigger>
        </TabsList>

        {/* セキュリティログ */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティログ</CardTitle>
              <CardDescription>
                システムのセキュリティイベントログ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* フィルター */}
              <div className="flex gap-4 mb-4">
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="イベントタイプ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">すべてのイベント</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">ログイン成功</SelectItem>
                    <SelectItem value="LOGIN_FAILURE">ログイン失敗</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">不審なアクティビティ</SelectItem>
                    <SelectItem value="IP_BLOCKED">IPブロック</SelectItem>
                    <SelectItem value="RATE_LIMIT_EXCEEDED">レート制限超過</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="重要度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">すべて</SelectItem>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="CRITICAL">重大</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSecurityData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新
                </Button>
              </div>

              {/* ログテーブル */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>時刻</TableHead>
                      <TableHead>イベント</TableHead>
                      <TableHead>IPアドレス</TableHead>
                      <TableHead>ユーザー</TableHead>
                      <TableHead>詳細</TableHead>
                      <TableHead>重要度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          ログが見つかりません
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventIcon(log.eventType)}
                              <span className="text-sm">{log.eventType.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{log.ipAddress}</span>
                          </TableCell>
                          <TableCell>
                            {log.userEmail || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.details}
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(log.severity)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP制限 */}
        <TabsContent value="ip-restrictions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IP制限設定</CardTitle>
                  <CardDescription>
                    特定のIPアドレスからのアクセスを制限
                  </CardDescription>
                </div>
                <Button onClick={() => setNewIPDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  IPを追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IPアドレス</TableHead>
                    <TableHead>理由</TableHead>
                    <TableHead>ブロック日時</TableHead>
                    <TableHead>有効期限</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead className="text-center">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIPs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        ブロック中のIPアドレスはありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-mono">{ip.ipAddress}</span>
                          </div>
                        </TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>{formatDate(ip.blockedAt)}</TableCell>
                        <TableCell>
                          {ip.expiresAt ? formatDate(ip.expiresAt) : '無期限'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ip.autoBlocked ? 'destructive' : 'secondary'}>
                            {ip.autoBlocked ? '自動' : '手動'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedIP(ip);
                              setRemoveIPDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 認証設定 */}
        <TabsContent value="auth-settings">
          <Card>
            <CardHeader>
              <CardTitle>認証設定</CardTitle>
              <CardDescription>
                ユーザー認証とパスワードポリシーの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* セッション設定 */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  セッション設定
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">セッションタイムアウト（秒）</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={authSettings.sessionTimeout}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* ログイン設定 */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  ログイン設定
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">最大ログイン試行回数</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={authSettings.maxLoginAttempts}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        maxLoginAttempts: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">ロックアウト期間（秒）</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={authSettings.lockoutDuration}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        lockoutDuration: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* パスワードポリシー */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  パスワードポリシー
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordMinLength">最小文字数</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      className="w-24"
                      value={authSettings.passwordMinLength}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        passwordMinLength: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordRequireUppercase">大文字を必須にする</Label>
                    <input
                      id="passwordRequireUppercase"
                      type="checkbox"
                      checked={authSettings.passwordRequireUppercase}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        passwordRequireUppercase: e.target.checked
                      }))}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordRequireNumbers">数字を必須にする</Label>
                    <input
                      id="passwordRequireNumbers"
                      type="checkbox"
                      checked={authSettings.passwordRequireNumbers}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        passwordRequireNumbers: e.target.checked
                      }))}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordRequireSpecialChars">特殊文字を必須にする</Label>
                    <input
                      id="passwordRequireSpecialChars"
                      type="checkbox"
                      checked={authSettings.passwordRequireSpecialChars}
                      onChange={(e) => setAuthSettings(prev => ({
                        ...prev,
                        passwordRequireSpecialChars: e.target.checked
                      }))}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveAuthSettings}
                className="w-full"
              >
                設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* IP追加ダイアログ */}
      <AlertDialog open={newIPDialog} onOpenChange={setNewIPDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>IPアドレスをブロック</AlertDialogTitle>
            <AlertDialogDescription>
              ブロックするIPアドレスと理由を入力してください
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">IPアドレス</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1"
                value={newIP.address}
                onChange={(e) => setNewIP(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-reason">ブロック理由</Label>
              <Input
                id="block-reason"
                placeholder="不審なアクセスパターン"
                value={newIP.reason}
                onChange={(e) => setNewIP(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockIP}>
              ブロック
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IP削除確認ダイアログ */}
      <AlertDialog open={removeIPDialog} onOpenChange={setRemoveIPDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ブロック解除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIP && (
                <>
                  IPアドレス <span className="font-mono font-bold">{selectedIP.ipAddress}</span> のブロックを解除しますか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockIP}>
              ブロック解除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}