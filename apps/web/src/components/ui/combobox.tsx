"use client";

import { useState, useRef, useEffect } from "react";

interface ComboboxProps {
  placeholder: string;
  items: { id: string | number; label: string; [key: string]: any }[];
  value: string | number | undefined;
  onChange: (item: any) => void;
  disabled?: boolean;
}

export function Combobox({ placeholder, items, value, onChange, disabled }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((i) => i.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems =
    query === ""
      ? items
      : items.filter((item) =>
          item.label
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`input flex items-center justify-between cursor-text bg-white ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
        onClick={() => !disabled && setOpen(true)}
      >
        {!open ? (
          <span className={selectedItem ? "text-gray-900" : "text-gray-400"}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        ) : (
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent outline-none p-0 border-none ring-0 h-full text-gray-900"
            placeholder="Gõ để tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-slideDown border border-gray-100">
          {filteredItems.length === 0 ? (
            <li className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Không tìm thấy kết quả.
            </li>
          ) : (
            filteredItems.map((item) => (
              <li
                key={item.id}
                className={`relative cursor-pointer select-none py-2 px-4 hover:bg-primary-50 ${
                  item.id === value ? "bg-primary-50 text-primary-900 font-medium" : "text-gray-900"
                }`}
                onClick={() => {
                  onChange(item);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="block truncate">{item.label}</span>
                {item.subLabel && <span className="block truncate text-xs text-gray-500 mt-0.5">{item.subLabel}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
