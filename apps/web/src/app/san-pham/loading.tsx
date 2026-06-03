export default function ProductsLoading() {
  return (
    <div className="container-page py-8" role="status" aria-label="Đang tải danh sách sản phẩm">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-9 w-36 rounded bg-gray-200" />
        </div>

        <div className="flex gap-8">
          <aside className="hidden w-60 shrink-0 space-y-6 md:block" aria-hidden="true">
            <div className="space-y-3">
              <div className="h-5 w-24 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-8 w-12 rounded bg-gray-200" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-8 w-8 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
          </aside>

          <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3" aria-hidden="true">
                <div className="aspect-[3/4] rounded-card bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="flex gap-2 pt-1">
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Đang tải danh sách sản phẩm</span>
    </div>
  );
}
