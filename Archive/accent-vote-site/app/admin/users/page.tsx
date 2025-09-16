'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { toast } from '@/components/ui/use-toast';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  lastLoginAt: string | null;
  voteCount: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast({
          title: 'エラー',
          description: 'ユーザー一覧の取得に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'エラー',
        description: 'ユーザー一覧の取得中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: 'ユーザーロールを更新しました',
        });
        fetchUsers();
        setShowRoleDialog(false);
      } else {
        toast({
          title: 'エラー',
          description: 'ロールの更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'エラー',
        description: 'ロールの更新中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
    }
  };

  const handleBanToggle = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const action = selectedUser.status === 'BANNED' ? 'unban' : 'ban';
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: action === 'ban' ? 'ユーザーをBANしました' : 'BANを解除しました',
        });
        fetchUsers();
        setShowBanDialog(false);
      } else {
        toast({
          title: 'エラー',
          description: 'ステータスの更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update ban status:', error);
      toast({
        title: 'エラー',
        description: 'ステータスの更新中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-600 mt-2">システムユーザーの管理とロール設定</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary-600" />
          <span className="text-2xl font-bold">{pagination.totalItems}</span>
          <span className="text-gray-600">ユーザー</span>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="名前・メールで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="ロールフィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">すべてのロール</SelectItem>
                <SelectItem value="USER">一般ユーザー</SelectItem>
                <SelectItem value="ADMIN">管理者</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="ステータスフィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">すべてのステータス</SelectItem>
                <SelectItem value="ACTIVE">アクティブ</SelectItem>
                <SelectItem value="BANNED">BAN済み</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={fetchUsers}
              variant="outline"
              className="w-full"
            >
              フィルター適用
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ユーザーテーブル */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>名前</TableHead>
                    <TableHead>メール</TableHead>
                    <TableHead>ロール</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>投票数</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead>最終ログイン</TableHead>
                    <TableHead className="text-center">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        ユーザーが見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">
                          {user.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role === 'ADMIN' ? (
                              <><Shield className="h-3 w-3 mr-1" /> 管理者</>
                            ) : (
                              '一般ユーザー'
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'}>
                            {user.status === 'ACTIVE' ? (
                              <><UserCheck className="h-3 w-3 mr-1" /> アクティブ</>
                            ) : (
                              <><UserX className="h-3 w-3 mr-1" /> BAN済み</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.voteCount}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleDialog(true);
                              }}
                            >
                              ロール変更
                            </Button>
                            <Button
                              size="sm"
                              variant={user.status === 'BANNED' ? 'default' : 'destructive'}
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanDialog(true);
                              }}
                            >
                              {user.status === 'BANNED' ? 'BAN解除' : 'BAN'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* ページネーション */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-600">
                    {pagination.totalItems} 件中 {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 件を表示
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前へ
                    </Button>
                    <span className="text-sm">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      次へ
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ロール変更ダイアログ */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ロール変更の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  ユーザー「{selectedUser.name || selectedUser.email}」のロールを
                  <span className="font-bold">
                    {selectedUser.role === 'ADMIN' ? '一般ユーザー' : '管理者'}
                  </span>
                  に変更しますか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={actionLoading}
            >
              {actionLoading ? '処理中...' : '変更する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BAN/BAN解除ダイアログ */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === 'BANNED' ? 'BAN解除の確認' : 'BAN確認'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  ユーザー「{selectedUser.name || selectedUser.email}」を
                  <span className="font-bold">
                    {selectedUser.status === 'BANNED' ? 'BAN解除' : 'BAN'}
                  </span>
                  しますか？
                  {selectedUser.status !== 'BANNED' && (
                    <span className="block mt-2 text-red-600">
                      BANされたユーザーはログインできなくなります。
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              disabled={actionLoading}
              className={selectedUser?.status === 'BANNED' ? '' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionLoading ? '処理中...' : (selectedUser?.status === 'BANNED' ? 'BAN解除する' : 'BANする')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}