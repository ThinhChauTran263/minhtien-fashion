const labels: Record<string, string> = {
  chest: "Ngá»±c",
  length: "DÃ i Ã¡o",
  shoulder: "Vai",
  weight: "CÃ¢n náº·ng",
  height: "Chiá»u cao",
};

const fallback = {
  S: { chest: 96, length: 68, shoulder: 42, weight: "50-58kg", height: "160-165cm" },
  M: { chest: 100, length: 70, shoulder: 44, weight: "58-65kg", height: "165-170cm" },
  L: { chest: 104, length: 72, shoulder: 46, weight: "65-72kg", height: "170-175cm" },
  XL: { chest: 108, length: 74, shoulder: 48, weight: "72-80kg", height: "175-180cm" },
  XXL: { chest: 112, length: 76, shoulder: 50, weight: "80-90kg", height: "180-185cm" },
};

export type SizeGuideData = Record<string, Record<string, string | number>>;

export function getSizeGuideData(data?: SizeGuideData | null) {
  return data && Object.keys(data).length ? data : fallback;
}

export function SizeGuideTable({ data }: { data?: SizeGuideData | null }) {
  const guide: SizeGuideData = getSizeGuideData(data);
  const sizes = ["S", "M", "L", "XL", "XXL"].filter((size) => guide[size]);
  const columns = ["chest", "length", "shoulder", "weight", "height"];

  return (
    <div className="overflow-x-auto rounded-lg border border-primary-100 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-primary-50">
          <tr>
            <th className="p-4 font-semibold">Size</th>
            {columns.map((column) => <th key={column} className="p-4 font-semibold">{labels[column]}</th>)}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-t border-primary-100">
              <td className="p-4 font-semibold">{size}</td>
              {columns.map((column) => <td key={column} className="p-4">{guide[size]?.[column] ?? "-"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

