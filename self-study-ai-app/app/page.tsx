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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium border border-sky-200">
                <Zap className="h-4 w-4" />
                AI × Self-Learning
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Learn Deeply with
                  <br />
                  <span className="text-sky-600">Your Own Material</span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Upload PDFs and articles. AI asks questions, deepens understanding, and keeps records.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl">
                  <Link href="/upload" className="flex items-center gap-2">
                    Start Learning
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200">
                  <Link href="#demo" className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  3-min setup
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Privacy protected
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
                    <div className="text-xs text-gray-500">AI Interview</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-sky-50 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">AI Assistant</div>
                      </div>
                      <p className="text-sm text-gray-600">
                        "What perspectives do you consider when thinking about the social impact of generative AI?"
                      </p>
                    </div>
                    
                    <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-sm font-medium text-sky-600">You</div>
                      </div>
                      <p className="text-sm text-gray-900">
                        "I think we need to consider both productivity improvement and employment impact..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-900">Learning</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-medium text-gray-900">PDF Uploaded</span>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A simple flow that enables effective learning for everyone
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 px-8 pt-8">
                <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-100 transition-all duration-300 group-hover:scale-110">
                  <FileUp className="h-10 w-10 text-sky-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Upload Materials</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Supports PDF, URL, and various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 leading-relaxed">
                  AI automatically reads and optimizes learning design.
                  Simple drag & drop upload.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 px-8 pt-8">
                <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-100 transition-all duration-300 group-hover:scale-110">
                  <Mic className="h-10 w-10 text-sky-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Voice Interview</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Deepen understanding through AI dialogue
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 leading-relaxed">
                  Speech recognition and synthesis create a learning experience
                  like talking with a tutor.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 px-8 pt-8">
                <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-100 transition-all duration-300 group-hover:scale-110">
                  <BookOpen className="h-10 w-10 text-sky-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Learning Log</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  All conversations automatically saved
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 leading-relaxed">
                  All conversations are recorded for efficient review later.
                  Focus on areas that need improvement.
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Start learning in 3 simple steps
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex-shrink-0 w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-sky-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload Learning Materials</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Load PDFs or articles you want to learn. AI analyzes the content
                  and automatically generates the optimal learning plan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex-shrink-0 w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-sky-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Start AI Dialogue</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Deepen understanding through voice and text questions.
                  Questions adapt to your comprehension level.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex-shrink-0 w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-sky-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Review with Chat Logs</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  All interactions are saved and can be reviewed later.
                  Visualize learning progress and understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-sky-600 to-sky-700">
        <div className="container max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to dive into AI-powered learning?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
            It's free, fast, and truly personalized. Start your learning journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-white text-sky-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <Link href="/upload" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200">
              <Link href="#demo" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}