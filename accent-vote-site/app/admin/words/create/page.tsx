'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface AccentOption {
  accentTypeId: number;
  pattern: number[];
  dropPosition?: number;
}

export default function CreateWord() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    headword: '',
    reading: '',
    category: 'general',
    moraSegments: [''],
    accentOptions: [] as AccentOption[],
  });

  const handleMoraSegmentsChange = (index: number, value: string) => {
    const newSegments = [...formData.moraSegments];
    newSegments[index] = value;
    setFormData({ ...formData, moraSegments: newSegments });
  };

  const addMoraSegment = () => {
    setFormData({ 
      ...formData, 
      moraSegments: [...formData.moraSegments, ''] 
    });
  };

  const removeMoraSegment = (index: number) => {
    const newSegments = formData.moraSegments.filter((_, i) => i !== index);
    setFormData({ ...formData, moraSegments: newSegments });
  };

  const addAccentOption = () => {
    const moraCount = formData.moraSegments.filter(s => s).length;
    setFormData({
      ...formData,
      accentOptions: [
        ...formData.accentOptions,
        {
          accentTypeId: 1, // デフォルトは頭高型
          pattern: new Array(moraCount).fill(0),
          dropPosition: undefined,
        },
      ],
    });
  };

  const removeAccentOption = (index: number) => {
    const newOptions = formData.accentOptions.filter((_, i) => i !== index);
    setFormData({ ...formData, accentOptions: newOptions });
  };

  const updateAccentOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.accentOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, accentOptions: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.headword || !formData.reading) {
      alert('見出し語と読みは必須です');
      return;
    }

    const moraSegments = formData.moraSegments.filter(s => s);
    if (moraSegments.length === 0) {
      alert('モーラ分割を入力してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          headword: formData.headword,
          reading: formData.reading,
          category: formData.category,
          moraCount: moraSegments.length,
          moraSegments: moraSegments,
          accentOptions: formData.accentOptions,
        }),
      });

      if (response.ok) {
        router.push('/admin/words');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.message || '単語の作成に失敗しました'}`);
      }
    } catch (error) {
      console.error('Failed to create word:', error);
      alert('単語の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/admin/words">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">単語を追加</h1>
          <p className="text-gray-600 mt-2">新しい単語を登録します</p>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headword">見出し語 *</Label>
                <Input
                  id="headword"
                  value={formData.headword}
                  onChange={(e) => setFormData({ ...formData, headword: e.target.value })}
                  placeholder="例: 東京"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reading">読み *</Label>
                <Input
                  id="reading"
                  value={formData.reading}
                  onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                  placeholder="例: とうきょう"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">カテゴリ</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">一般</SelectItem>
                  <SelectItem value="technical">専門用語</SelectItem>
                  <SelectItem value="dialect">方言</SelectItem>
                  <SelectItem value="proper_noun">固有名詞</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>モーラ分割</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {formData.moraSegments.map((segment, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={segment}
                    onChange={(e) => handleMoraSegmentsChange(index, e.target.value)}
                    placeholder={`モーラ ${index + 1}`}
                  />
                  {formData.moraSegments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMoraSegment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMoraSegment}
            >
              <Plus className="h-4 w-4 mr-2" />
              モーラを追加
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アクセントパターン</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.accentOptions.map((option, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">パターン {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccentOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>アクセント型</Label>
                    <Select
                      value={option.accentTypeId.toString()}
                      onValueChange={(value) => 
                        updateAccentOption(index, 'accentTypeId', parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">頭高型</SelectItem>
                        <SelectItem value="2">平板型</SelectItem>
                        <SelectItem value="3">中高型</SelectItem>
                        <SelectItem value="4">尾高型</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>下がり位置（オプション）</Label>
                    <Input
                      type="number"
                      value={option.dropPosition || ''}
                      onChange={(e) => 
                        updateAccentOption(index, 'dropPosition', 
                          e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      placeholder="数値"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addAccentOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              アクセントパターンを追加
            </Button>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/words">
            <Button variant="outline" type="button">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? '作成中...' : '単語を作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}