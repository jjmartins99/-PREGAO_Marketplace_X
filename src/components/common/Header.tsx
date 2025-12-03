
import React, { useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCartIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, CameraIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          PREGÃO
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-gray-600">
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
        <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
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

                <span className="text-gray-700 font-medium hidden sm:block">{user?.name}</span>
                
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

                <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

                <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors" title="Terminar Sessão">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6"/>
                </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 text-gray-600 hover:text-primary">
                <UserCircleIcon className="h-6 w-6"/>
                <span>Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
