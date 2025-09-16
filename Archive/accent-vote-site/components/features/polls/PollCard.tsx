'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, ChevronRight, BarChart3, Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Poll, PollStatus } from '@/types/poll';
import { formatNumber } from '@/lib/utils';

interface PollCardProps {
  poll: Poll;
  onClick?: () => void;
  showStatistics?: boolean;
  className?: string;
}

const statusConfig: Record<PollStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: React.ElementType }> = {
  active: { label: '実施中', variant: 'default', icon: Clock },
  closed: { label: '終了', variant: 'secondary', icon: Lock },
  draft: { label: '下書き', variant: 'outline', icon: Eye },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const isExpired = (endDate?: string) => {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
};

export function PollCard({
  poll,
  onClick,
  showStatistics = true,
  className,
}: PollCardProps) {
  const status = isExpired(poll.endDate) ? 'closed' : poll.status;
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          className
        )}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="article"
        tabIndex={0}
        aria-label={`投票: ${poll.title}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                {poll.type === 'multiple' && (
                  <Badge variant="outline" className="text-xs">
                    複数選択可
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold line-clamp-2">
                {poll.title}
              </h3>
            </div>
            {poll.thumbnail && (
              <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={poll.thumbnail}
                  alt={poll.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
          </div>
          {poll.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {poll.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {showStatistics && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>{formatNumber(poll.totalVotes)}票</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{formatNumber(poll.uniqueVoters)}人</span>
              </div>
            </div>
          )}

          {(poll.startDate || poll.endDate) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
              <Calendar className="h-3 w-3" />
              <span>
                {poll.startDate && formatDate(poll.startDate)}
                {poll.startDate && poll.endDate && ' ~ '}
                {poll.endDate && formatDate(poll.endDate)}
              </span>
            </div>
          )}

          {poll.options && poll.options.length > 0 && (
            <div className="mt-3 space-y-1">
              {poll.options.slice(0, 3).map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm truncate">
                        {option.text}
                      </span>
                    </div>
                  </div>
                  {showStatistics && status === 'closed' && (
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-primary-500"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {option.percentage.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {poll.options.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  他{poll.options.length - 3}個の選択肢
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            aria-label={`${poll.title}の詳細を見る`}
          >
            <span>詳細を見る</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}