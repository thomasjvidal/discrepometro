import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onSearch: (term: string) => void;
  onYearChange: (year: string) => void;
}

const FilterBar = ({ selectedFilter, onFilterChange, onSearch, onYearChange }: FilterBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterOptions = [
    { id: 'all', label: 'Todos', color: 'text-dark-400' },
    { id: 'sem-discrepancia', label: 'Sem Discrepância', color: 'text-green-400' },
    { id: 'estoque-excedente', label: 'Estoque Excedente', color: 'text-yellow-400' },
    { id: 'estoque-faltante', label: 'Estoque Faltante', color: 'text-red-400' }
  ];

  const years = ['2024', '2023', '2022', '2021'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por produto ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-800 border-dark-700"
            />
          </div>
        </form>

        <Select onValueChange={onYearChange} defaultValue="2024">
          <SelectTrigger className="w-[120px] bg-dark-800 border-dark-700">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => (
        <Button
          key={filter.id}
          variant={selectedFilter === filter.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`
            transition-all duration-200
            ${selectedFilter === filter.id 
              ? 'bg-golden-500 text-dark-900 hover:bg-golden-600' 
              : `hover:bg-dark-800 ${filter.color}`
            }
          `}
        >
            <Filter className="w-4 h-4 mr-2" />
          {filter.label}
        </Button>
      ))}
      </div>
    </div>
  );
};

export default FilterBar;
