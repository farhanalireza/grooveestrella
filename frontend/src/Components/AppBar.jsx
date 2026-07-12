import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ListMusic,
  Music,
  Cog,
  Newspaper,
  Bot,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";

const AppBar = ({ selectedSection, setSection }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Set section based on route path
  useEffect(() => {
    const path = pathname || "";

    if (path === "/") setSection("Music");
    else if (path.startsWith("/search")) setSection("Search");
    else if (path.startsWith("/account")) setSection("Account");
    else if (path.startsWith("/feedback")) setSection("Review");
    else if (path.startsWith("/settings")) setSection("Settings");
    else if (path.startsWith("/library")) setSection("Playlist");
    else if (path.startsWith("/chat")) setSection("Chat");
    else setSection("");
  }, [pathname]);

  const navItems = [
    {
      label: "Music",
      icon: <Music size={18} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={18} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Chat",
      icon: <Bot size={18} />, 
      section: "Chat",
      route: "/chat"
    },
    {
      label: "Library",
      icon: <ListMusic size={18} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Settings",
      icon: <Cog size={18} />, 
      section: "Settings",
      route: "/settings"
    },
    {
      label: "Review",
      icon: <Newspaper size={18} />, 
      section: "Review",
      route: "/feedback"
    },
    {
      label: "Account",
      icon: <UserRound size={18} />,
      section: "Account",
      route: "/account"
    }
  ];

  const mobileNavItems = [
    {
      label: "Music",
      icon: <Music size={18} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={18} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Chat",
      icon: <Bot size={18} />, 
      section: "Chat",
      route: "/chat"
    },
    {
      label: "Library",
      icon: <ListMusic size={18} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Settings",
      icon: <Cog size={18} />, 
      section: "Settings",
      route: "/settings"
    }
  ];

  const handleNavClick = (item) => {
    setSection(item.section);
    router.push(item.route);
  };

  const isSharePage = pathname?.startsWith("/s/");
  const brandName = isSharePage ? "GrooveLink" : "GrooveEstrella";

  return (
    <>
      {/* Desktop Top Header Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-[#07090F]/90 backdrop-blur-md border-b border-white/10 z-[400] h-16">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition duration-200" 
            onClick={() => router.push("/")}
          >
            <img src="/in.svg" alt={brandName} className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-white tracking-tight font-display">{brandName}</span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="flex items-center gap-2">
            {navItems.map((item, idx) => {
              const isActive = selectedSection === item.section;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 border ${
                    isActive
                      ? "bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/25 shadow-md shadow-[#2563EB]/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden z-[350] select-none bg-black/95 backdrop-blur-xl border-t border-white/10 text-white px-4 py-1 flex justify-around items-center shadow-2xl fixed bottom-0 left-0 w-full h-16">
        {mobileNavItems.map((item, idx) => {
          const isActive = selectedSection === item.section;
          return (
            <button
              key={idx}
              onClick={() => handleNavClick(item)}
              className={`flex-1 h-full flex flex-col justify-center items-center gap-1 transition-all duration-300 ${
                isActive ? "text-[#60A5FA] scale-105" : "text-zinc-400 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-bold tracking-wide uppercase leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default AppBar;