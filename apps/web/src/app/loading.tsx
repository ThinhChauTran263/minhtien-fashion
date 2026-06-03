export default function Loading() {
  return (
    <div className="container-page py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 bg-primary-100 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-primary-100 rounded-lg" />
              <div className="h-4 bg-primary-100 rounded w-3/4" />
              <div className="h-4 bg-primary-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

