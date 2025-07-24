import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUp, Mic, BookOpen, Sparkles, ArrowRight, Play, CheckCircle, Zap, Brain, Target } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-medium border border-primary/10">
                <Zap className="h-4 w-4" />
                AI × 自学習
              </div>
              
              <div className="space-y-6">
                <h1 className="heading-xl text-foreground">
                  あなたの資料で、
                  <br />
                  <span className="text-primary">対話しながら深く学ぶ</span>
                </h1>
                
                <p className="body-lg text-muted-foreground max-w-lg">
                  PDFや記事をアップロードするだけ。AIが質問を投げかけ、理解を深め、記録まで残します。
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="btn-primary">
                  <Link href="/upload" className="flex items-center gap-2">
                    学習をはじめる
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="btn-secondary">
                  <Link href="#demo" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    デモを見る
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  無料で始められる
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  3分でセットアップ
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  プライバシー保護
                </div>
              </div>
            </div>
            
            {/* Right Content - Mock UI */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-border/50">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1"></div>
                    <div className="text-xs text-muted-foreground">AI Interview</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-border/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm font-medium">AI アシスタント</div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        「生成AIの社会的影響について、どのような観点から考えていますか？」
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-sm font-medium text-primary">あなた</div>
                      </div>
                      <p className="text-sm text-foreground">
                        「生産性向上と雇用への影響の両面から考える必要がありますね...」
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">学習中</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-border/30">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">PDF アップロード済み</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50/50">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-lg text-foreground mb-4">
              3つのステップで完結
            </h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              シンプルな流れで、誰でも効果的な学習ができます
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all duration-300 border border-border/30 bg-white">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                  <FileUp className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="heading-md">学習素材アップロード</CardTitle>
                <CardDescription className="body-md">
                  PDF・URLなど様々な素材に対応
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  AIが自動で読み込み、学習設計を最適化します。
                  ドラッグ＆ドロップで簡単にアップロードできます。
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border border-border/30 bg-white">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-100 transition-colors">
                  <Mic className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="heading-md">音声インタビュー</CardTitle>
                <CardDescription className="body-md">
                  AIとの音声対話で理解を深める
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  音声認識と音声合成により、まるで講師と対話しているような
                  学習体験を実現します。
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border border-border/30 bg-white">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-100 transition-colors">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="heading-md">学習ログ記録</CardTitle>
                <CardDescription className="body-md">
                  すべての対話が自動で保存
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  すべての会話が記録され、あとから効率的に復習できます。
                  苦手な部分を重点的に確認できます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-lg text-foreground mb-4">
              使い方
            </h2>
            <p className="body-lg text-muted-foreground">
              3つのステップで学習を開始できます
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-border/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="heading-md text-foreground mb-3">学習素材をアップロード</h3>
                <p className="text-muted-foreground leading-relaxed">
                  学びたいPDFや記事を読み込ませます。AIが内容を分析し、
                  最適な学習プランを自動生成します。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-border/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="heading-md text-foreground mb-3">AIと対話スタート</h3>
                <p className="text-muted-foreground leading-relaxed">
                  音声・テキストで質問しながら理解を深めます。
                  あなたの理解度に合わせて質問が変化します。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-border/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="heading-md text-foreground mb-3">会話ログで復習</h3>
                <p className="text-muted-foreground leading-relaxed">
                  すべてのやり取りは保存され、あとから確認できます。
                  学習の進捗や理解度を可視化します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary/80">
        <div className="container max-w-4xl mx-auto text-center text-white">
          <h2 className="heading-lg mb-6">
            Ready to dive into AI-powered learning?
          </h2>
          <p className="body-lg mb-10 opacity-90 max-w-2xl mx-auto">
            It's free, fast, and truly personalized. Start your learning journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-white text-primary hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg">
              <Link href="/upload" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                無料で始める
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl">
              <Link href="#demo" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                デモを見る
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}