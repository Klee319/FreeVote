"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, BarChart } from "lucide-react";

interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voteCount: number;
  createdAt: string;
  deadline: string;
  isAccentMode: boolean;
}

interface PollTableProps {
  polls: Poll[];
  onDelete: (id: string) => void;
}

export default function PollTable({ polls, onDelete }: PollTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">実施中</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">終了</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">下書き</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string, isAccentMode: boolean) => {
    if (isAccentMode) {
      return <Badge className="bg-purple-100 text-purple-800">アクセント</Badge>;
    }
    return <Badge variant="outline">{category}</Badge>;
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>カテゴリー</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="text-right">投票数</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead>締切</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {polls.map((poll) => (
            <TableRow key={poll.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{poll.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {poll.description}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {getCategoryBadge(poll.category, poll.isAccentMode)}
              </TableCell>
              <TableCell>{getStatusBadge(poll.status)}</TableCell>
              <TableCell className="text-right font-medium">
                {poll.voteCount.toLocaleString()}
              </TableCell>
              <TableCell>{poll.createdAt}</TableCell>
              <TableCell>{poll.deadline}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Link href={`/polls/${poll.id}`}>
                    <Button variant="ghost" size="icon" title="表示">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/polls/${poll.id}/results`}>
                    <Button variant="ghost" size="icon" title="統計">
                      <BarChart className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/polls/${poll.id}/edit`}>
                    <Button variant="ghost" size="icon" title="編集">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(poll.id)}
                    title="削除"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}