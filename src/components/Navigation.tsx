import { Link, useLocation } from 'react-router-dom';
import { Upload, BarChart2, FileText, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/',
      label: 'Upload',
      icon: Upload,
      description: 'Envie seus arquivos para análise'
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: BarChart2,
      description: 'Visualize estatísticas e resultados'
    },
    {
      path: '/discrepometro',
      label: 'Discrepômetro',
      icon: FileText,
      description: 'Analise discrepâncias em detalhes'
    }
  ];

  return (
    <nav className="bg-dark-900/50 backdrop-blur-sm border-b border-dark-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
                  Discrepômetro
                </span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      isActive(item.path)
                        ? 'bg-dark-800 text-golden-400'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-golden-400'
                  }`}
                >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-golden-400">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link to="/ajuda" className="flex items-center gap-2 w-full">
                    <HelpCircle className="w-4 h-4" />
                    <span>Central de Ajuda</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/configuracoes" className="flex items-center gap-2 w-full">
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 