'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Brain, Layers, BookOpen, Image, Sparkles } from 'lucide-react';
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
  topics: string[];
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
          topics: [
            '学習内容の理解度の課題',
            '学習方法の改善点',
            '知識の応用における課題'
          ]
        },
        mece: {
          suggested: true,
          reason: '複数の概念や観点について学ばれています。体系的に整理してみましょう。',
          topics: [
            '学習内容の分類整理',
            '概念間の関係性分析',
            '知識の階層構造化'
          ]
        },
        bookBuilder: {
          suggested: true,
          reason: '深い理解を深められました。この知識を本として体系化してみましょう。',
          topics: [
            '学習内容の体系化',
            '実践的な知識の整理',
            '学習成果のまとめ'
          ]
        },
        thinkingImage: {
          suggested: true,
          reason: '抽象的な概念について理解されました。視覚的に表現してみましょう。',
          topics: [
            '概念の可視化',
            '学習プロセスの図解',
            '知識構造の視覚表現'
          ]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const start5WhysAnalysis = (topic: string) => {
    router.push(`/five-why/new?topic=${encodeURIComponent(topic)}`);
    onClose();
  };

  const startMECEAnalysis = (topic: string) => {
    router.push(`/mece/new?topic=${encodeURIComponent(topic)}`);
    onClose();
  };

  const startBookBuilder = (topic: string) => {
    if (onStartBookBuilder) {
      const bookData = {
        title: topic,
        introduction: `このトピックについて学んだ内容を整理します。`,
        chapters: []
      };
      onStartBookBuilder(bookData);
      onClose();
    }
  };

  const startThinkingImage = (topic: string) => {
    if (onStartThinkingImage) {
      const imageData = {
        theme: topic,
        concept: `この概念について視覚的に表現してみましょう。`
      };
      onStartThinkingImage(imageData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sky-600">Reflecta Coach</h2>
              <p className="text-gray-500">Analyze your review and suggest next learning steps</p>
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
              <span className="ml-3 text-gray-600">Reflecta Coach is analyzing...</span>
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
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={suggestions.fiveWhys.reason}>
                    {suggestions.fiveWhys.reason}
                  </p>
                  <div className="space-y-2">
                    {(suggestions.fiveWhys.topics || []).map((topic, index) => {
                      const truncatedTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
                      return (
                        <Button 
                          key={index}
                          onClick={() => start5WhysAnalysis(topic)}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2 px-3 group"
                          title={topic.length > 50 ? topic : undefined}
                        >
                          <span className="text-sm">{truncatedTopic}</span>
                        </Button>
                      );
                    })}
                  </div>
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
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={suggestions.mece.reason}>
                    {suggestions.mece.reason}
                  </p>
                  <div className="space-y-2">
                    {(suggestions.mece.topics || []).map((topic, index) => {
                      const truncatedTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
                      return (
                        <Button 
                          key={index}
                          onClick={() => startMECEAnalysis(topic)}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2 px-3 group"
                          title={topic.length > 50 ? topic : undefined}
                        >
                          <span className="text-sm">{truncatedTopic}</span>
                        </Button>
                      );
                    })}
                  </div>
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
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={suggestions.bookBuilder.reason}>
                    {suggestions.bookBuilder.reason}
                  </p>
                  <div className="space-y-2">
                    {(suggestions.bookBuilder.topics || []).map((topic, index) => {
                      const truncatedTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
                      return (
                        <Button 
                          key={index}
                          onClick={() => startBookBuilder(topic)}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2 px-3 group"
                          title={topic.length > 50 ? topic : undefined}
                        >
                          <span className="text-sm">{truncatedTopic}</span>
                        </Button>
                      );
                    })}
                  </div>
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
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={suggestions.thinkingImage.reason}>
                    {suggestions.thinkingImage.reason}
                  </p>
                  <div className="space-y-2">
                    {(suggestions.thinkingImage.topics || []).map((topic, index) => {
                      const truncatedTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
                      return (
                        <Button 
                          key={index}
                          onClick={() => startThinkingImage(topic)}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2 px-3 group"
                          title={topic.length > 50 ? topic : undefined}
                        >
                          <span className="text-sm">{truncatedTopic}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Failed to generate suggestions. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
