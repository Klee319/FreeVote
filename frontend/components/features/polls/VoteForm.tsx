'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePolls } from '@/hooks/usePolls';
import { useAuthStore } from '@/stores/authStore';
import { Poll } from '@/types';
import { Volume2 } from 'lucide-react';
import { PREFECTURES } from '@/lib/constants';

interface VoteFormProps {
  poll: Poll;
  onVoteComplete: (optionIndex: number) => void;
}

export function VoteForm({ poll, onVoteComplete }: VoteFormProps) {
  const { submitVote } = usePolls();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [userAttributes, setUserAttributes] = useState({
    prefecture: user?.prefecture || '',
    ageGroup: user?.ageGroup || '',
    gender: user?.gender || '',
  });
  const [showAttributeForm, setShowAttributeForm] = useState(!isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('選択肢を選んでください');
      return;
    }

    if (!isAuthenticated && !userAttributes.prefecture) {
      setError('都道府県を選択してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const optionIndex = parseInt(selectedOption);
    const voteData = {
      option: optionIndex,
      prefecture: userAttributes.prefecture,
      ageGroup: userAttributes.ageGroup || undefined,
      gender: userAttributes.gender || undefined,
    };

    const result = await submitVote(poll.id, voteData);

    if (result.success) {
      onVoteComplete(optionIndex);
    } else {
      setError(result.error || '投票に失敗しました');
      setIsSubmitting(false);
    }
  };

  const playAccentSample = (voiceSampleUrl?: string) => {
    if (voiceSampleUrl) {
      const audio = new Audio(voiceSampleUrl);
      audio.play();
    }
  };

  const renderAccentPattern = (pitchPattern?: number[]) => {
    if (!pitchPattern || pitchPattern.length === 0) return null;

    const maxHeight = 40;
    return (
      <div className="flex items-end gap-1 h-12">
        {pitchPattern.map((pitch, index) => (
          <div
            key={index}
            className="w-6 bg-primary rounded-t"
            style={{ height: `${pitch * maxHeight}px` }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>投票する</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Options */}
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          <div className="space-y-4">
            {poll.options.map((option, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`option-${index}`}
                      className="text-base font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>

                    {option.thumbnailUrl && (
                      <img
                        src={option.thumbnailUrl}
                        alt={option.label}
                        className="mt-2 w-full max-w-xs rounded"
                      />
                    )}

                    {/* Accent Mode Features */}
                    {poll.isAccentMode && (
                      <div className="mt-3 space-y-2">
                        {option.pitchPattern && (
                          <div>
                            <span className="text-sm text-muted-foreground">音高パターン</span>
                            {renderAccentPattern(option.pitchPattern)}
                          </div>
                        )}
                        {option.voiceSampleUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => playAccentSample(option.voiceSampleUrl)}
                          >
                            <Volume2 className="h-4 w-4 mr-2" />
                            発音を聞く
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Guest Attribute Form */}
        {!isAuthenticated && showAttributeForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">投票者情報（ゲスト）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prefecture">都道府県 *</Label>
                <Select
                  value={userAttributes.prefecture}
                  onValueChange={(value) =>
                    setUserAttributes({ ...userAttributes, prefecture: value })
                  }
                >
                  <SelectTrigger id="prefecture">
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((pref) => (
                      <SelectItem key={pref.value} value={pref.value}>
                        {pref.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ageGroup">年代（任意）</Label>
                <Select
                  value={userAttributes.ageGroup}
                  onValueChange={(value) =>
                    setUserAttributes({ ...userAttributes, ageGroup: value })
                  }
                >
                  <SelectTrigger id="ageGroup">
                    <SelectValue placeholder="年代を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10代">10代</SelectItem>
                    <SelectItem value="20代">20代</SelectItem>
                    <SelectItem value="30代">30代</SelectItem>
                    <SelectItem value="40代">40代</SelectItem>
                    <SelectItem value="50代">50代</SelectItem>
                    <SelectItem value="60代">60代</SelectItem>
                    <SelectItem value="70代以上">70代以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">性別（任意）</Label>
                <Select
                  value={userAttributes.gender}
                  onValueChange={(value) =>
                    setUserAttributes({ ...userAttributes, gender: value })
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男性">男性</SelectItem>
                    <SelectItem value="女性">女性</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOption}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? '投票中...' : '投票する'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}