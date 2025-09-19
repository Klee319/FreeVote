"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VoteRequest {
  id: string;
  title: string;
  description?: string;
  options: string[];
  categories: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: string;
  username?: string;
  likeCount: number;
  adminComment?: string;
  rejectionReason?: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<VoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<VoteRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      // モックデータを表示
      setRequests([
        {
          id: "1",
          title: "最高のプログラミング言語は？",
          description: "開発者の間で人気のプログラミング言語について投票しましょう",
          options: ["JavaScript", "Python", "TypeScript", "Go"],
          categories: ["テクノロジー"],
          status: "pending",
          createdAt: "2024-01-15T10:00:00Z",
          username: "tech_lover",
          likeCount: 42,
        },
        {
          id: "2",
          title: "好きなコーヒーの種類は？",
          description: "みんなが好きなコーヒーを教えてください",
          options: ["エスプレッソ", "カプチーノ", "ラテ", "アメリカーノ"],
          categories: ["グルメ"],
          status: "approved",
          createdAt: "2024-01-14T15:30:00Z",
          username: "coffee_addict",
          likeCount: 28,
          adminComment: "良い投票テーマです。承認しました。",
        },
        {
          id: "3",
          title: "不適切な投票",
          description: "不適切な内容のため却下されました",
          options: ["選択肢1", "選択肢2"],
          categories: ["その他"],
          status: "rejected",
          createdAt: "2024-01-13T09:15:00Z",
          username: "anonymous",
          likeCount: 2,
          rejectionReason: "コミュニティガイドラインに違反しています",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: VoteRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
    setAdminComment("");
    setRejectionReason("");
  };

  const submitAction = async () => {
    if (!selectedRequest) return;

    try {
      const endpoint = actionType === 'approve'
        ? `/api/admin/requests/${selectedRequest.id}/approve`
        : `/api/admin/requests/${selectedRequest.id}/reject`;

      const body = actionType === 'approve'
        ? { adminComment }
        : { rejectionReason, adminComment };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // 成功時の処理
        setActionDialogOpen(false);
        fetchRequests(); // リストを更新
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      alert("処理に失敗しました");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />保留中</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />承認済み</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />却下</Badge>;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">投票リクエスト管理</h2>
        <p className="text-gray-600 mt-2">
          ユーザーから提案された投票のリクエストを管理します
        </p>
      </div>

      {/* フィルターとサーチ */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="タイトルや説明で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="pending">保留中</SelectItem>
              <SelectItem value="approved">承認済み</SelectItem>
              <SelectItem value="rejected">却下</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* リクエスト一覧 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>カテゴリー</TableHead>
              <TableHead>提案者</TableHead>
              <TableHead>いいね数</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>提案日</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  リクエストが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.title}</div>
                      {request.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {request.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{request.username || "匿名"}</TableCell>
                  <TableCell>{request.likeCount}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleAction(request, 'approve')}
                        >
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleAction(request, 'reject')}
                        >
                          却下
                        </Button>
                      </div>
                    )}
                    {request.adminComment && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title={request.adminComment}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* アクションダイアログ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'リクエストを承認' : 'リクエストを却下'}
            </DialogTitle>
            <DialogDescription>
              「{selectedRequest?.title}」を{actionType === 'approve' ? '承認' : '却下'}します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">却下理由 *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="却下理由を入力してください"
                  rows={3}
                />
              </div>
            )}
            <div>
              <Label htmlFor="admin-comment">管理者コメント（任意）</Label>
              <Textarea
                id="admin-comment"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="内部用のコメント"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={submitAction}
              disabled={actionType === 'reject' && !rejectionReason}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionType === 'approve' ? '承認する' : '却下する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}