'use client';

import { useState, useEffect } from 'react';
import { User, ChevronDown, Edit3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AnonymousRegistrationModal from '@/components/features/auth/AnonymousRegistrationModal';
import { useCookieAuth } from '@/hooks/useCookieAuth';

// 都道府県マスタデータ
const PREFECTURES_MAP: { [key: string]: string } = {
  '01': '北海道',
  '02': '青森県',
  '03': '岩手県',
  '04': '宮城県',
  '05': '秋田県',
  '06': '山形県',
  '07': '福島県',
  '08': '茨城県',
  '09': '栃木県',
  '10': '群馬県',
  '11': '埼玉県',
  '12': '千葉県',
  '13': '東京都',
  '14': '神奈川県',
  '15': '新潟県',
  '16': '富山県',
  '17': '石川県',
  '18': '福井県',
  '19': '山梨県',
  '20': '長野県',
  '21': '岐阜県',
  '22': '静岡県',
  '23': '愛知県',
  '24': '三重県',
  '25': '滋賀県',
  '26': '京都府',
  '27': '大阪府',
  '28': '兵庫県',
  '29': '奈良県',
  '30': '和歌山県',
  '31': '鳥取県',
  '32': '島根県',
  '33': '岡山県',
  '34': '広島県',
  '35': '山口県',
  '36': '徳島県',
  '37': '香川県',
  '38': '愛媛県',
  '39': '高知県',
  '40': '福岡県',
  '41': '佐賀県',
  '42': '長崎県',
  '43': '熊本県',
  '44': '大分県',
  '45': '宮崎県',
  '46': '鹿児島県',
  '47': '沖縄県',
};

// 年齢層の表示名
const AGE_GROUPS_MAP: { [key: string]: string } = {
  '10s': '10代',
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s': '60代',
  '70s+': '70代以上',
};

// 性別の表示名
const GENDER_MAP: { [key: string]: string } = {
  'male': '男性',
  'female': '女性',
  'other': 'その他',
  'prefer_not_to_say': '未回答',
};

interface UserAttributes {
  age?: string;
  gender?: string;
  prefecture?: string;
}

export default function UserStatusDisplay() {
  const { isRegistered, user, isLoading, verifyCookie } = useCookieAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [attributes, setAttributes] = useState<UserAttributes>({});
  const [modalKey, setModalKey] = useState(0); // モーダルの再マウントを強制するためのキー

  useEffect(() => {
    // useCookieAuthからuser情報を取得して属性を設定
    if (user) {
      setAttributes({
        age: user.ageGroup,
        gender: user.gender,
        prefecture: user.prefectureCode,
      });
    }
  }, [user]);

  const handleEditAttributes = () => {
    setModalKey(prev => prev + 1); // キーを更新してモーダルを再マウント
    setIsEditModalOpen(true);
  };

  const handleModalClose = async () => {
    setIsEditModalOpen(false);
    // モーダルを閉じた後、認証状態を再検証して属性を更新
    await verifyCookie();
  };

  const handleClearData = () => {
    if (confirm('本当にユーザーデータをクリアしますか？投票履歴も削除されます。')) {
      // すべてのCookieをクリア
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      // localStorageもクリア
      localStorage.clear();
      sessionStorage.clear();
      // ページをリロード
      window.location.reload();
    }
  };

  // ローディング中または未登録の場合
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (!isRegistered) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModalKey(prev => prev + 1);
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">登録</span>
        </Button>
        
        {/* 登録モーダル */}
        {isEditModalOpen && (
          <AnonymousRegistrationModal
            key={modalKey}
            isForceOpen={true}
            onForceClose={() => {
              setIsEditModalOpen(false);
              verifyCookie();
            }}
          />
        )}
      </>
    );
  }

  // 属性の表示用文字列を生成
  const ageDisplay = attributes.age ? AGE_GROUPS_MAP[attributes.age] : '未設定';
  const genderDisplay = attributes.gender ? GENDER_MAP[attributes.gender] : '未設定';
  const prefectureDisplay = attributes.prefecture ? PREFECTURES_MAP[attributes.prefecture] : '未設定';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            aria-label="ユーザーメニュー"
          >
            <User className="h-5 w-5" />
            <ChevronDown className="h-3 w-3 absolute -bottom-0.5 -right-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 z-[200]">
          <DropdownMenuLabel>ユーザー情報</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="px-2 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">年齢層</span>
              <Badge variant="secondary" className="text-xs">
                {ageDisplay}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">性別</span>
              <Badge variant="secondary" className="text-xs">
                {genderDisplay}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">都道府県</span>
              <Badge variant="secondary" className="text-xs">
                {prefectureDisplay}
              </Badge>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleEditAttributes}>
            <Edit3 className="h-4 w-4 mr-2" />
            属性を編集
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleClearData}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            データをクリア
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 属性編集モーダル */}
      {isEditModalOpen && (
        <AnonymousRegistrationModal
          key={modalKey}
          isForceOpen={true}
          onForceClose={handleModalClose}
        />
      )}
    </>
  );
}