import { useState } from 'react';

const categories = [
  'All', 'Geopolitics', 'Military', 'Markets', 'Finance',
  'Crypto', 'Oil & Energy', 'Middle East', 'Global Economy', 'Breaking'
];

interface NewsFilterProps {
  onFilterChange?: (filters: { category: string; query: string; sort: string }) => void;
}

export default function NewsFilter({ onFilterChange }: NewsFilterProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    onFilterChange?.({ category, query, sort });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onFilterChange?.({ category: activeCategory, query: value, sort });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onFilterChange?.({ category: activeCategory, query, sort: value });
  };

  return (
    <div className="mb-8">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-lazarus-dark border border-lazarus-border rounded-lg mb-3 touch-target"
      >
        <span className="text-lazarus-body text-sm font-medium">
          Filter: <span className="text-lazarus-gold">{activeCategory}</span>
        </span>
        <svg
          className={`w-5 h-5 text-lazarus-gold transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter bar — always visible on desktop, toggle on mobile */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Category tabs */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 pb-2 md:pb-0 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg whitespace-nowrap transition-all touch-target ${
                    activeCategory === cat
                      ? 'bg-lazarus-gold text-lazarus-black'
                      : 'text-lazarus-muted hover:text-lazarus-gold hover:bg-lazarus-gold/10 border border-lazarus-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lazarus-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search news..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-lazarus-dark border border-lazarus-border rounded-lg text-sm text-lazarus-body placeholder-lazarus-muted focus:outline-none focus:border-lazarus-gold transition-colors w-full md:w-48"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2.5 bg-lazarus-dark border border-lazarus-border rounded-lg text-sm text-lazarus-body focus:outline-none focus:border-lazarus-gold transition-colors touch-target appearance-none cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
