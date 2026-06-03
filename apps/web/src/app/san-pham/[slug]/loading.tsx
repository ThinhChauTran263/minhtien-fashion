export default function ProductDetailLoading() {
  return (
    <div className="container-page py-8" role="status" aria-label="Đang tải chi tiết sản phẩm">
      <div className="animate-pulse space-y-8">
        <nav className="flex items-center gap-2" aria-hidden="true">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-4" aria-hidden="true">
            <div className="aspect-[4/5] rounded-card bg-gray-200" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-square rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-hidden="true">
            <div className="space-y-3">
              <div className="h-9 w-3/4 rounded bg-gray-200" />
              <div className="h-7 w-36 rounded bg-gray-200" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-10 w-10 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 w-16 rounded bg-gray-200" />
                ))}
              </div>
            </div>

            <div className="h-12 w-full rounded bg-gray-300" />

            <div className="space-y-3 border-t pt-6">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-11/12 rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-8" aria-hidden="true">
          <div className="h-7 w-44 rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[3/4] rounded-card bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Đang tải chi tiết sản phẩm</span>
    </div>
  );
}
