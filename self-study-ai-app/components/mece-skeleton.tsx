import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function MECECategorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="border-2 border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-1 w-1 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MECEGeneratingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Categories */}
      <MECECategorySkeleton />
    </div>
  )
} 