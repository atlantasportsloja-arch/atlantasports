export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4 py-2">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full mt-4" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
          <div className="flex gap-2 mt-6">
            {[1,2,3,4].map(i => <div key={i} className="h-10 w-16 bg-gray-200 rounded-lg" />)}
          </div>
          <div className="h-14 bg-gray-200 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
