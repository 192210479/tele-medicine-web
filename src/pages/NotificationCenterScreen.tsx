import { useState } from 'react';
import {
  Bell,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useNotifications } from '../context/NotificationContext';

export function NotificationCenterScreen() {
  const { notifications, isLoading, markAsRead, markAllRead } = useNotifications();  const [activeFilter, setActiveFilter] = useState('All');

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'appointment': return Calendar;
      case 'prescription': return FileText;
      case 'message': return MessageSquare;
      case 'payment': return CreditCard;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'appointment': return 'text-blue-500 bg-blue-50';
      case 'prescription': return 'text-green-500 bg-green-50';
      case 'message': return 'text-teal-500 bg-teal-50';
      case 'payment': return 'text-orange-500 bg-orange-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const filteredNotifications = activeFilter === 'All' 
    ? notifications 
    : notifications.filter(n => n.type?.toLowerCase().includes(activeFilter.toLowerCase().slice(0, -3)));

  return (
    <ScreenContainer
      title="Notifications"
      showBack
      actions={
        <button
          onClick={markAllRead}
          className="text-sm font-bold text-primary px-2 py-1 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Mark all read
        </button>
      }
    >
      <div className="flex flex-col h-full">
        <div className="px-6 py-4">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {['All', 'Appointments', 'Prescriptions', 'Messages', 'Payments'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  activeFilter === filter 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4 mt-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const colorClass = getColor(notification.type);
                
                return (
                  <Card
                    key={notification.id}
                    className={`flex items-start gap-4 p-5 transition-all duration-200 border-l-4 ${
                      !notification.is_read 
                        ? 'bg-blue-50/40 border-l-primary shadow-md' 
                        : 'bg-white border-l-transparent'
                    } cursor-pointer hover:shadow-lg`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass} shadow-sm`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-base ${!notification.is_read ? 'font-bold text-text-primary' : 'font-medium text-text-primary'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter whitespace-nowrap ml-2 bg-gray-100 px-2 py-0.5 rounded">
                          {notification.created_at ? new Date(notification.created_at).toLocaleTimeString() : 'Recently'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {notification.description}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0 animate-pulse" />
                    )}
                  </Card>
                );
              })
            ) : (
              <EmptyState
                title="No Notifications"
                description={`You don't have any ${activeFilter.toLowerCase() === 'all' ? '' : activeFilter.toLowerCase()} notifications at the moment.`}
                illustrationType="empty"
              />
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}