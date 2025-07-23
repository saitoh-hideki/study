import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUp, Mic, BookOpen, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="container max-w-6xl mx-auto p-4 py-12 space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          AIと対話しながら学ぶ、新しい学習体験
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          資料をアップロードして、AIインタビュアーと音声で対話。
          あなたの理解度に合わせて質問が深まり、効果的な学習をサポートします。
        </p>
        <div className="pt-4">
          <Button asChild size="lg">
            <Link href="/upload">
              <Sparkles className="mr-2 h-5 w-5" />
              学習を始める
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <FileUp className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>簡単アップロード</CardTitle>
            <CardDescription>
              PDF、Word、テキストファイル、URLなど様々な形式に対応
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              学習したい資料をドラッグ＆ドロップするだけで、AIが内容を理解し、最適な質問を生成します。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Mic className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>音声インタビュー</CardTitle>
            <CardDescription>
              AIと自然な会話で理解を深める
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              音声認識と音声合成により、まるで講師と対話しているような学習体験を実現します。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>学習記録</CardTitle>
            <CardDescription>
              会話ログで復習も効率的に
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              すべての会話が記録され、いつでも振り返ることができます。苦手な部分を重点的に復習できます。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="bg-secondary rounded-lg p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">使い方</h2>
        <ol className="text-left max-w-2xl mx-auto space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium">資料をアップロード</p>
              <p className="text-sm text-muted-foreground">
                学習したいPDFや記事のURLを読み込みます
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium">AIとインタビュー</p>
              <p className="text-sm text-muted-foreground">
                音声でAIの質問に答えながら理解を深めます
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium">復習と定着</p>
              <p className="text-sm text-muted-foreground">
                会話ログを見返して、学習内容を定着させます
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  )
}