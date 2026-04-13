import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { getSocket } from '../../utils/socketUtils';
export function WebLayout({ children }: { children: React.ReactNode; }) {
  const { role, userId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize socket connection globally after login
  useEffect(() => {
    if (role && userId) {
      getSocket();
    }
  }, [role, userId]);

  if (!role) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col">{children}</div>);

  }
  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0 h-full z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen &&
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)} />

          <div className="relative flex-1 flex max-w-[260px] w-full bg-white h-full shadow-2xl animate-slide-left">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 z-50">

              <X size={20} />
            </button>
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      }

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 flex-shrink-0 z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">

            <Menu size={24} />
          </button>
          <span className="ml-2 font-bold text-gray-900">TeleHealth+</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>
    </div>);

}
