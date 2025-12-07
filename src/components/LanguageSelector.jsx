"use client";
import { LANGUAGE_VERSIONS } from "../constants";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const languages = Object.entries(LANGUAGE_VERSIONS);

const LanguageSelector = ({ language, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-all min-w-[120px] justify-between"
      >
        <span className="capitalize">{language}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1 z-50 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {languages.map(([lang, version]) => (
            <button
              key={lang}
              onClick={() => {
                onSelect(lang);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${lang === language
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium capitalize">{lang}</span>
                <span className={`text-[10px] ${lang === language ? "text-zinc-500" : "text-zinc-600"}`}>
                  {version}
                </span>
              </div>
              {lang === language && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
