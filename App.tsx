
import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { Page } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { getAIResponse } from './services/aiService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ChatModal from './components/ChatModal';

import HomePage from './pages/HomePage';
import NavigationPage from './pages/NavigationPage';
import BookingPage from './pages/BookingPage';
import EmergencyPage from './pages/EmergencyPage';
import ReportPage from './pages/ReportPage';
import GalleryPage from './pages/GalleryPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import { I18nProvider } from './i18n';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

interface PageContext {
  initialTab?: string;
}

const App: React.FC = () => {
  console.log('App component is loading...');
  
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [selectedRole, setSelectedRole] = useState('visitor');
  
  // Add missing state variables
  const [auth, setAuth] = useState<{role: string | null, token: string | null}>({role: null, token: null});
  const [activePage, setActivePage] = useState<Page>('home');
  const [pageContext, setPageContext] = useState<any>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  
  const { transcript, isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();

  useEffect(() => {
    const storedAuth = localStorage.getItem('ujjain360Auth');
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
    }
  }, [transcript, isListening]);

  const handleLogin = (role: 'user' | 'admin', token: string) => {
    const authData = { role, token };
    setAuth(authData);
    localStorage.setItem('ujjain360Auth', JSON.stringify(authData));
    setActivePage(role === 'admin' ? Page.Analytics : Page.Home);
  };
  
  const handleLogout = () => {
    setAuth({ role: null, token: null });
    localStorage.removeItem('ujjain360Auth');
    setActivePage(Page.Home);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setIsAiResponding(true);

    const aiResponseText = await getAIResponse(text);
    const aiMessage: Message = { text: aiResponseText, sender: 'ai' };
    setMessages(prev => [...prev, aiMessage]);
    setIsAiResponding(false);
  };

  const handleSetActivePage = (page: Page, context?: PageContext) => {
    setActivePage(page);
    setPageContext(context);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case Page.Home:
        return <HomePage setChatOpen={setChatOpen} setActivePage={handleSetActivePage} />;
      case Page.Navigation:
        return <NavigationPage />;
      case Page.Booking:
        return <BookingPage initialTab={pageContext?.initialTab as any} />;
      case Page.Emergency:
        return <EmergencyPage />;
      case Page.Report:
        return <ReportPage />;
      case Page.Gallery:
        return <GalleryPage />;
      case Page.Settings:
        return <SettingsPage onLogout={handleLogout} />;
      case Page.About:
        return <AboutPage />;
      case Page.Analytics:
        return auth.role === 'admin' && auth.token ? <AnalyticsPage token={auth.token} /> : <HomePage setChatOpen={setChatOpen} setActivePage={handleSetActivePage} />;
      default:
        return <HomePage setChatOpen={setChatOpen} setActivePage={handleSetActivePage} />;
    }
  };

  if (!auth.token) {
    return (
      <I18nProvider>
        <LoginPage onLogin={handleLogin} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
        <Sidebar 
          activePage={activePage} 
          setActivePage={handleSetActivePage}
          isMenuOpen={isMenuOpen}
          setMenuOpen={setMenuOpen}
          userRole={auth.role}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            setMenuOpen={setMenuOpen} 
            onVoiceSearch={() => setChatOpen(true)}
            onToggleNotifications={() => alert('Notifications panel not yet implemented.')}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
            {renderPage()}
          </main>
        </div>
        <BottomNav activePage={activePage} setActivePage={handleSetActivePage} />
        
        {/* Floating Chat Button */}
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-200"
          aria-label="Open AI Assistant Chat"
        >
          <Bot size={24} />
        </button>
        
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
          currentLang={currentLanguage}
          setLang={setCurrentLanguage}
        />
      </div>
    </I18nProvider>
  );
};

export default App;