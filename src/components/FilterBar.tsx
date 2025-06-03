
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterBar = ({ selectedFilter, onFilterChange }: FilterBarProps) => {
  const filters = [
    { id: 'all', label: 'Todos', color: 'text-dark-300' },
    { id: 'sem-discrepancia', label: 'Sem Discrepância', color: 'text-green-400' },
    { id: 'compra-sem-nota', label: 'Compra sem Nota', color: 'text-red-400' },
    { id: 'venda-sem-nota', label: 'Venda sem Nota', color: 'text-yellow-400' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
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
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterBar;
