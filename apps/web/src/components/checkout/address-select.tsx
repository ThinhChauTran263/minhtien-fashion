"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { userApi } from "@/lib/api";
import { useDebounce } from "use-debounce";

interface AddressSelectProps {
  initialText?: string;
  onChange: (data: {
    provinceId: number | null;
    provinceName: string;
    districtId: number | null;
    districtName: string;
    wardCode: string;
    wardName: string;
  }) => void;
}

export function AddressSelect({ initialText = "", onChange }: AddressSelectProps) {
  const t = useTranslations("addressSelect");
  const [searchQ, setSearchQ] = useState(initialText);
  const [debouncedSearch] = useDebounce(searchQ, 300);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      userApi.searchLocations(debouncedSearch).then((res) => {
        setSuggestions(res.data?.data || []);
        setShowSuggestions(true);
      }).catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  const handleSelect = (loc: any) => {
    setSearchQ(loc.fullAddress);
    setShowSuggestions(false);
    onChange({
      provinceId: loc.provinceId,
      provinceName: loc.provinceName,
      districtId: loc.districtId,
      districtName: loc.districtName,
      wardCode: loc.wardCode,
      wardName: loc.wardName,
    });
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Nhập Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
        value={searchQ}
        onChange={(e) => {
          setSearchQ(e.target.value);
          if (!e.target.value) setShowSuggestions(false);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        className="input w-full"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {suggestions.map((loc, i) => (
            <li
              key={i}
              onClick={() => handleSelect(loc)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
            >
              {loc.fullAddress}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
