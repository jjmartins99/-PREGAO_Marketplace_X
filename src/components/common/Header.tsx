
import React, { useState, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { ShoppingCartIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Only show search bar on Landing Page (home) or relevant pages
  const showSearchBar = location.pathname === '/';

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="text-2xl font-bold text-primary">
            PREGÃO
          </Link>
        </div>

        {/* Search Bar - Center */}
        {showSearchBar ? (
             <div className="order-last md:order-none w-full md:w-auto md:flex-1 md:max-w-xl mx-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Pesquisar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        ) : (
            <div className="flex-1"></div> /* Spacer if search is hidden */
        )}

        {/* Navigation & Actions - Right */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 ml-auto md:ml-0">
            <div className="hidden lg:flex items-center space-x-4 text-gray-600 mr-2">
                <NavLink to="/" className={({ isActive }) => (isActive ? 'text-primary font-semibold' : 'hover:text-primary')}>
                    Início
                </NavLink>
                {isAuthenticated && (
                    <>
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'text-primary font-semibold' : 'hover:text-primary')}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/pos" className={({ isActive }) => (isActive ? 'text-primary font-semibold' : 'hover:text-primary')}>
                        POS
                    </NavLink>
                    <NavLink to="/delivery" className={({ isActive }) => (isActive ? 'text-primary font-semibold' : 'hover:text-primary')}>
                        Delivery
                    </NavLink>
                    {user?.role === 'Admin' && (
                        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'text-primary font-semibold' : 'hover:text-primary')}>
                            Admin
                        </NavLink>
                    )}
                    </>
                )}
            </div>

            <div className="h-6 w-px bg-gray-300 hidden lg:block"></div>

            <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <ShoppingCartIcon className="h-6 w-6 text-gray-600"/>
            </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
                {/* Avatar Display */}
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex-shrink-0">
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-full w-full text-gray-500 p-0.5" />
                    )}
                </div>

                <span className="text-gray-700 font-medium hidden xl:block text-sm">{user?.name}</span>
                
                {/* Upload Button */}
                <button 
                    onClick={triggerFileInput}
                    className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                    title="Alterar foto de perfil"
                >
                    <CameraIcon className="h-5 w-5" />
                </button>
                
                {/* Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />

                <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors" title="Terminar Sessão">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6"/>
                </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 text-gray-600 hover:text-primary whitespace-nowrap">
                <UserCircleIcon className="h-6 w-6"/>
                <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;