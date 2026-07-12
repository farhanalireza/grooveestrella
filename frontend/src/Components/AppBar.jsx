import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ListMusic,
  Music,
  Cog,
  Newspaper,
  Bot,
  ChevronDown,
  ChevronUp,
  UserRound,
  Download,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AppBar = ({ selectedSection, setSection }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set section based on route path
  useEffect(() => {
    const path = pathname;

    if (path === "/") setSection("Music");
    else if (path.startsWith("/search")) setSection("Search");
    else if (path.startsWith("/account")) setSection("Account");
    else if (path.startsWith("/feedback")) setSection("Review");
    else if (path.startsWith("/settings")) setSection("Settings");
    else if (path.endsWith("/library")) setSection("Playlist");
    else if (path.startsWith("/library/saved")) setSection("Saved");
    else if (path.startsWith("/chat")) setSection("Chat");
    else setSection("");
  }, [pathname]);

  const navItems = [
    {
      label: "Music",
      icon: <Music size={20} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={20} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Chat",
      icon: <Bot size={20} />, 
      section: "Chat",
      route: "/chat"
    },
    {
      label: "Library",
      icon: <ListMusic size={20} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Settings",
      icon: <Cog size={20} />, 
      section: "Settings",
      route: "/settings"
    },
    {
      label: "Review",
      icon: <Newspaper size={20} />, 
      section: "Review",
      route: "/feedback"
    },
    {
        label: "Account",
        icon: <UserRound size={20} />,
        section: "Account",
        route: "/account"
    }
  ];

  const mobileNavItems = [
    {
      label: "Music",
      icon: <Music size={20} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={20} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Chat",
      icon: <Bot size={20} />, 
      section: "Chat",
      route: "/chat"
    },
    {
        label: "Account",
        icon: <UserRound size={20} />,
        section: "Account",
        route: "/account"
    },
    {
      label: "More",
      icon: showMore ? <ChevronUp size={20} /> : <ChevronDown size={20} />,
      isMoreButton: true
    }
  ];

  const moreItems = [
    {
      label: "Settings",
      icon: <Cog size={18} />, 
      section: "Settings",
      route: "/settings"
    },
    {
      label: "Library",
      icon: <ListMusic size={18} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Review",
      icon: <Newspaper size={18} />, 
      section: "Review",
      route: "/feedback"
    }
  ];

  const handleNavClick = (item) => {
    if (item.isMoreButton) {
      setShowMore(!showMore);
      return;
    }
    
    setSection(item.section);
    router.push(item.route);
    window.scrollTo(0, 0);
    setShowMore(false);
    setSidebarOpen(false); // Close sidebar on navigation
  };

  // Desktop Sidebar Item
  const SidebarItem = ({ item, isActive }) => (
    <motion.button
      onClick={() => handleNavClick(item)}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
        isActive 
          ? "bg-white text-black shadow-lg" 
          : "text-white hover:bg-white/10"
      }`}
    >
      <span className={`transition-colors duration-300 ${isActive ? 'text-black' : 'text-white'}`}>
        {item.icon}
      </span>
      <span className="font-medium text-sm">{item.label}</span>
    </motion.button>
  );

  // Mobile Bottom Nav Item
  const MobileNavItem = ({ item, isActive, className = "" }) => (
    <motion.button
      onClick={() => handleNavClick(item)}
      whileTap={{ scale: 0.9 }}
      className={`w-12 h-14 flex flex-col justify-center items-center gap-1 rounded-xl transition-all duration-300 ${
        isActive ? "bg-white text-black" : "text-white hover:bg-white/10"
      } ${className}`}
    >
      {item.icon}
      <span className="text-xs font-medium leading-none">{item.label}</span>
    </motion.button>
  );

  const DropdownItem = ({ item, isActive }) => (
    <button
      onClick={() => handleNavClick(item)}
      className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-white text-black"
          : "text-white hover:bg-white/10"
      }`}
    >
      {item.icon}
      <span className="font-medium">{item.label}</span>
    </button>
  );

  return (
    <>
      {/* Desktop Top Bar with Menu Button */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 z-[400] h-16">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
            
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <img src="/in.svg" alt="GrooveEstrella" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-white tracking-tight">GrooveEstrella</span>
            </div>
          </div>

          {/* Center search bar placeholder (Desktop only) */}
          <div className="hidden md:flex flex-grow max-w-md mx-4 relative">
            <input
              type="text"
              placeholder="Search songs, playlists..."
              className="w-full bg-zinc-800 text-white rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
              onClick={() => router.push("/search")}
              readOnly
            />
            <Search className="absolute left-3 top-2 text-zinc-400" size={16} />
          </div>

          {/* Right Icons (Desktop only) */}
          <div className="hidden md:flex items-center gap-4">
            <button
              className="p-1.5 rounded-full text-zinc-400 hover:text-white transition"
              onClick={() => router.push("/account")}
            >
              <Search size={18} />
            </button>
            
            <motion.button
              onClick={() => router.push("/account")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                selectedSection === "Account" 
                  ? "bg-white text-black" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <UserRound size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="hidden lg:block fixed inset-0 bg-black/50 backdrop-blur-sm z-[350]"
            />
            
            {/* Sidebar */}
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-xl border-r border-white/20 z-[400] flex-col shadow-2xl"
            >
              {/* Navigation Items */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h2>
                  {navItems.map((item, idx) => (
                    <SidebarItem
                      key={idx}
                      item={item}
                      isActive={selectedSection === item.section}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10">
                <div className="text-center text-gray-400 text-xs">
                  <p>&copy; 2025 GrooveEstrella</p>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation (Unchanged) */}
      <nav className="lg:hidden z-[350] select-none bg-black text-white px-4 py-1 flex justify-center items-center shadow-2xl fixed bottom-0 left-0 w-full">
        <div className="flex items-center gap-2">
          {mobileNavItems.map((item, idx) => {
            if (item.isMoreButton) {
              return (
                <div key={idx} className="relative">
                  <MobileNavItem 
                    item={item}
                    isActive={showMore}
                  />

                  <AnimatePresence>
                    {showMore && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -8, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-15 left-1/2 transform -translate-x-1/2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-2xl min-w-36"
                      >
                        <div className="space-y-1">
                          {moreItems.map((moreItem, moreIdx) => (
                            <DropdownItem
                              key={moreIdx}
                              item={moreItem}
                              isActive={selectedSection === moreItem.section}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <MobileNavItem
                key={idx}
                item={item}
                isActive={selectedSection === item.section}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default AppBar;