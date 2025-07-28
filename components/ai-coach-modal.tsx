'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Brain, Layers, BookOpen, Image } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewContent: string;
  reviewId: string;
  onStartBookBuilder?: (data: any) => void;
  onStartThinkingImage?: (data: any) => void;
}

interface Suggestion {
  suggested: boolean;
  reason: string;
  topic: string;
}

interface Suggestions {
  fiveWhys: Suggestion;
  mece: Suggestion;
  bookBuilder: Suggestion;
  thinkingImage: Suggestion;
}

export default function AICoachModal({
  isOpen,
  onClose,
  reviewContent,
  reviewId,
  onStartBookBuilder,
  onStartThinkingImage
}: AICoachModalProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && reviewContent) {
      generateSuggestions();
    }
  }, [isOpen, reviewContent]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-coach-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewContent,
          reviewId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      setSuggestions({
        fiveWhys: {
          suggested: true,
          reason: 'レビュー内容から課題や疑問点が見つかりました。根本原因を深掘りしてみましょう。',
          topic: '学習内容の課題'
        },
        mece: {
          suggested: true,
          reason: '複数の概念や観点について学ばれています。体系的に整理してみましょう。',
          topic: '学習内容の整理'
        },
        bookBuilder: {
          suggested: true,
          reason: '深い理解を深められました。この知識を本として体系化してみましょう。',
          topic: '学習内容の体系化'
        },
        thinkingImage: {
          suggested: true,
          reason: '抽象的な概念について理解されました。視覚的に表現してみましょう。',
          topic: '概念の可視化'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const start5WhysAnalysis = () => {
    if (suggestions?.fiveWhys.topic) {
      router.push(`/five-why/new?topic=${encodeURIComponent(suggestions.fiveWhys.topic)}`);
      onClose();
    }
  };

  const startMECEAnalysis = () => {
    if (suggestions?.mece.topic) {
      router.push(`/mece/new?topic=${encodeURIComponent(suggestions.mece.topic)}`);
      onClose();
    }
  };

  const startBookBuilder = () => {
    if (onStartBookBuilder && suggestions?.bookBuilder.topic) {
      const bookData = {
        title: suggestions.bookBuilder.topic,
        introduction: `このトピックについて学んだ内容を整理します。`,
        chapters: []
      };
      onStartBookBuilder(bookData);
      onClose();
    }
  };

  const startThinkingImage = () => {
    if (onStartThinkingImage && suggestions?.thinkingImage.topic) {
      const imageData = {
        theme: suggestions.thinkingImage.topic,
        concept: `この概念について視覚的に表現してみましょう。`
      };
      onStartThinkingImage(imageData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sky-600">AIコーチの提案</h2>
              <p className="text-gray-500">レビュー内容を分析して、次の学習ステップを提案します</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <span className="ml-3 text-gray-600">AIコーチが分析中...</span>
            </div>
          ) : suggestions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 5 Whys Analysis */}
              <Card className="border-2 hover:border-sky-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sky-600">
                    <Brain className="h-5 w-5" />
                    5 Whys Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {suggestions.fiveWhys.reason}
                  </p>
                  <Button 
                    onClick={start5WhysAnalysis}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    開始する
                  </Button>
                </CardContent>
              </Card>

              {/* MECE Analysis */}
              <Card className="border-2 hover:border-sky-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sky-600">
                    <Layers className="h-5 w-5" />
                    MECE Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {suggestions.mece.reason}
                  </p>
                  <Button 
                    onClick={startMECEAnalysis}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    開始する
                  </Button>
                </CardContent>
              </Card>

              {/* Book Builder */}
              <Card className="border-2 hover:border-sky-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sky-600">
                    <BookOpen className="h-5 w-5" />
                    Book Builder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {suggestions.bookBuilder.reason}
                  </p>
                  <Button 
                    onClick={startBookBuilder}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    開始する
                  </Button>
                </CardContent>
              </Card>

              {/* Thinking Image */}
              <Card className="border-2 hover:border-sky-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sky-600">
                    <Image className="h-5 w-5" />
                    Thinking Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {suggestions.thinkingImage.reason}
                  </p>
                  <Button 
                    onClick={startThinkingImage}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    開始する
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              提案の生成に失敗しました。もう一度お試しください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 