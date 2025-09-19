"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUploadWithCrop } from "./ImageUploadWithCrop";

const pollFormSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().min(1, "説明は必須です"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  thumbnailUrl: z.string().optional(),
  isAccentMode: z.boolean(),
  options: z.array(z.object({
    label: z.string().min(1, "選択肢は必須です"),
    thumbnailUrl: z.string().optional(),
    pitchPattern: z.string().optional(),
  })).min(2, "最低2つの選択肢が必要です").max(4, "選択肢は最大4つまでです"),
  deadline: z.date({
    message: "締切日を選択してください",
  }),
  shareMessage: z.string().optional(),
  shareHashtags: z.string().optional(),
});

type PollFormData = z.infer<typeof pollFormSchema>;

interface PollFormProps {
  initialData?: Partial<PollFormData>;
  onSubmit: (data: PollFormData) => Promise<void>;
  loading?: boolean;
}

export default function PollForm({ initialData, onSubmit, loading }: PollFormProps) {
  const [isAccentMode, setIsAccentMode] = useState(initialData?.isAccentMode || false);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl || "");
  const [options, setOptions] = useState(
    initialData?.options || [
      { label: "", thumbnailUrl: "", pitchPattern: "" },
      { label: "", thumbnailUrl: "", pitchPattern: "" },
    ]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      thumbnailUrl: initialData?.thumbnailUrl || "",
      isAccentMode: initialData?.isAccentMode || false,
      options: options,
      deadline: initialData?.deadline || undefined,
      shareMessage: initialData?.shareMessage || "",
      shareHashtags: initialData?.shareHashtags || "",
    },
  });

  const deadline = watch("deadline");

  const addOption = () => {
    if (options.length < 4) {
      const newOptions = [...options, { label: "", thumbnailUrl: "", pitchPattern: "" }];
      setOptions(newOptions);
      setValue("options", newOptions);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      setValue("options", newOptions);
    }
  };

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
    setValue("options", newOptions);
  };

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">基本情報</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="例: 好きなラーメンの種類は？"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">説明 *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="投票の説明を入力してください"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">カテゴリー *</Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={initialData?.category}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="アクセント">アクセント</SelectItem>
                  <SelectItem value="グルメ">グルメ</SelectItem>
                  <SelectItem value="エンタメ">エンタメ</SelectItem>
                  <SelectItem value="ニュース">ニュース</SelectItem>
                  <SelectItem value="雑学">雑学</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="deadline">締切日 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground",
                      errors.deadline && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => setValue("deadline", date as Date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.deadline && (
                <p className="text-red-500 text-sm mt-1">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="accent-mode"
              checked={isAccentMode}
              onCheckedChange={(checked) => {
                setIsAccentMode(checked);
                setValue("isAccentMode", checked);
              }}
            />
            <Label htmlFor="accent-mode" className="cursor-pointer">
              アクセントモードを有効にする
            </Label>
          </div>

          {/* サムネイル画像アップロード */}
          <div>
            <Label>投票サムネイル画像（任意）</Label>
            <p className="text-sm text-muted-foreground mb-2">
              投票一覧に表示される画像を設定できます
            </p>
            <ImageUploadWithCrop
              value={thumbnailUrl}
              onChange={(url) => {
                setThumbnailUrl(url);
                setValue("thumbnailUrl", url);
              }}
              aspectRatio={16 / 9}
              maxWidth={1600}
              maxHeight={900}
            />
          </div>
        </div>
      </Card>

      {/* 選択肢 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">選択肢</h3>
          {options.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="w-4 h-4 mr-2" />
              選択肢を追加
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    placeholder={`選択肢 ${index + 1}`}
                    value={option.label}
                    onChange={(e) => updateOption(index, "label", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="サムネイルURL（任意）"
                    value={option.thumbnailUrl}
                    onChange={(e) => updateOption(index, "thumbnailUrl", e.target.value)}
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {/* アクセントモード時の音高設定 */}
              {isAccentMode && (
                <div className="ml-4">
                  <Input
                    placeholder="音高パターン（例: LHHH、HLL など）"
                    value={option.pitchPattern || ""}
                    onChange={(e) => updateOption(index, "pitchPattern", e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    H: 高音、L: 低音で音高パターンを入力してください
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.options && (
          <p className="text-red-500 text-sm mt-2">{errors.options.message}</p>
        )}
      </Card>

      {/* シェア設定 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">シェア設定（任意）</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shareMessage">シェア用メッセージ</Label>
            <Textarea
              id="shareMessage"
              {...register("shareMessage")}
              placeholder="SNSシェア時のメッセージテンプレート"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="shareHashtags">ハッシュタグ</Label>
            <Input
              id="shareHashtags"
              {...register("shareHashtags")}
              placeholder="例: #みんなの投票 #アンケート"
            />
          </div>
        </div>
      </Card>

      {/* 送信ボタン */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={loading}>
          キャンセル
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "作成中..." : initialData ? "更新する" : "作成する"}
        </Button>
      </div>
    </form>
  );
}