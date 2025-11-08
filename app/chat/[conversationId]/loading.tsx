// app/chat/[conversationId]/loading.tsx
export default function Loading() {
    return (
      <div className="flex h-screen">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-gray-900 p-4">
          <div className="h-10 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
  
        {/* Chat Area Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header Skeleton */}
          <div className="bg-white border-b px-6 py-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
          </div>
  
          {/* Messages Skeleton */}
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div className="w-3/4 h-20 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
  
          {/* Input Skeleton */}
          <div className="border-t bg-white p-4">
            <div className="max-w-4xl mx-auto h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }