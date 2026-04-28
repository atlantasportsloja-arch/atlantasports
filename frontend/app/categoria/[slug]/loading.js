function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex justify-between items-center mt-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
