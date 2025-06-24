
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);  const navItems = [
    { path: '/', label: 'Ranking', icon: '🏆' },
    { path: '/squad-creator', label: 'Squad Creator', icon: '⚽' },
    { path: '/match-tools', label: 'Match Tools', icon: '🔧' },
    { path: '/data-extractor', label: 'Data Extractor', icon: '📊' },
    { path: '/download', label: 'Download', icon: '📥' },
    { path: '/upload', label: 'Upload', icon: '📤' }
  ];

  const NavLink = ({ item, onClick }: { item: typeof navItems[0], onClick?: () => void }) => (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        location.pathname === item.path
          ? 'bg-[#B8CFCE] text-[#333446] font-medium'
          : 'text-[#7F8CAA] hover:bg-[#EAEFEF] hover:text-[#333446]'
      )}
    >
      <span className="text-xl">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-[#333446] text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <h1 className="text-xl font-bold text-[#B8CFCE]">FantaCalcetto</h1>
          </div>
          <div className="flex gap-2">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-[#333446] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <h1 className="text-lg font-bold text-[#B8CFCE]">FantaCalcetto</h1>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <span className="text-xl">☰</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#333446] text-white border-[#7F8CAA]">
              <div className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.path} 
                    item={item} 
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
