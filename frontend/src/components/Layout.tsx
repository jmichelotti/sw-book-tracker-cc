import { Link, Outlet, useLocation } from "react-router-dom";
import { Book, Users, Library, Pen, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/books", label: "Books", icon: Book },
  { to: "/characters", label: "Characters", icon: Users },
  { to: "/series", label: "Series", icon: Library },
  { to: "/authors", label: "Authors", icon: Pen },
];

export function Layout() {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="font-bold text-lg">
            SW Book Tracker
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant={location.pathname.startsWith(to) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("gap-1.5")}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="icon" onClick={toggle} className="ml-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
