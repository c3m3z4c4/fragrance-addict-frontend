import { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { brands, genders, families } from '@/data/perfumes';
import { cn } from '@/lib/utils';

export interface Filters {
  brands: string[];
  genders: string[];
  families: string[];
  priceRange: [number, number];
  minRating: number;
}

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FilterSidebar({ filters, onFiltersChange, isOpen, onClose }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['brands', 'gender', 'family']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleBrandChange = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const handleGenderChange = (gender: string) => {
    const newGenders = filters.genders.includes(gender)
      ? filters.genders.filter(g => g !== gender)
      : [...filters.genders, gender];
    onFiltersChange({ ...filters, genders: newGenders });
  };

  const handleFamilyChange = (family: string) => {
    const newFamilies = filters.families.includes(family)
      ? filters.families.filter(f => f !== family)
      : [...filters.families, family];
    onFiltersChange({ ...filters, families: newFamilies });
  };

  const clearFilters = () => {
    onFiltersChange({
      brands: [],
      genders: [],
      families: [],
      priceRange: [0, 600],
      minRating: 0
    });
  };

  const activeFiltersCount =
    filters.brands.length +
    filters.genders.length +
    filters.families.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 600 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  const FilterSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium uppercase tracking-wider"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            expandedSections.includes(id) && "rotate-180"
          )}
        />
      </button>
      {expandedSections.includes(id) && (
        <div className="pt-2 space-y-2 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-80 lg:w-64 bg-background lg:bg-transparent",
          "transform transition-transform duration-300 lg:transform-none",
          "overflow-y-auto p-6 lg:p-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            <h2 className="font-display text-lg">Filters</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear all
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="space-y-4">
          <FilterSection id="brands" title="Brands">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => handleBrandChange(brand)}
                />
                <span className="text-sm group-hover:text-accent transition-colors">{brand}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection id="gender" title="Gender">
            {genders.map((gender) => (
              <label key={gender} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filters.genders.includes(gender)}
                  onCheckedChange={() => handleGenderChange(gender)}
                />
                <span className="text-sm capitalize group-hover:text-accent transition-colors">{gender}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection id="family" title="Fragrance Family">
            {families.map((family) => (
              <label key={family} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filters.families.includes(family)}
                  onCheckedChange={() => handleFamilyChange(family)}
                />
                <span className="text-sm group-hover:text-accent transition-colors">{family}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection id="price" title="Price Range">
            <div className="px-2 pt-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
                min={0}
                max={600}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>€{filters.priceRange[0]}</span>
                <span>€{filters.priceRange[1]}</span>
              </div>
            </div>
          </FilterSection>

          <FilterSection id="rating" title="Minimum Rating">
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.7].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onFiltersChange({ ...filters, minRating: rating })}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    filters.minRating === rating
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted hover:bg-secondary"
                  )}
                >
                  {rating === 0 ? 'All' : `${rating}+`}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  );
}
