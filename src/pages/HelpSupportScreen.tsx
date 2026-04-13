import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mail, Phone, ChevronDown, ChevronUp, Ticket, PlusCircle, Send, X, Clock, CheckCircle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { getAuth } from '../utils/auth';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

interface SupportTicket {
  id: number;
  issue_type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export function HelpSupportScreen() {
  const auth = getAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Modals
  const [showAiChat, setShowAiChat] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  
  // Create Ticket Form
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', issue_type: 'general' });
  const [ticketLoading, setTicketLoading] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{sender: 'user'|'ai', text: string}[]>([{
    sender: 'ai', text: 'Hello! I am your AI Support Assistant. How can I help you today?'
  }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (auth?.user_id) {
      fetchFaqs();
      fetchTickets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.user_id, auth?.role]);

  useEffect(() => {
    if (showAiChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showAiChat]);

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`/api/support/faqs?role=${auth?.role}`);
      if (res.ok) {
        setFaqs(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/support/my-tickets?user_id=${auth?.user_id}&role=${auth?.role}`);
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.title || !ticketForm.description) return;
    setTicketLoading(true);
    try {
      const payload = {
        user_id: auth?.user_id,
        role: auth?.role,
        ...ticketForm
      };
      const res = await fetch('/api/support/ticket/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setTicketForm({ title: '', description: '', issue_type: 'general' });
        setShowCreateTicket(false);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !auth) return;
    
    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/support/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: auth.user_id, role: auth.role, message: userText })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'Server returned an invalid format. Please verify your backend server is running and returning JSON.' }]);
        return;
      }
      
      if (!res.ok) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data?.reply || 'An internal backend error occurred.' }]);
        return;
      }
      
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);

      if (data.should_create_ticket) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'It looks like this issue might require an agent. Would you like me to raise a formal support ticket for you?' }]);
      }
    } catch (e: any) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: `Connection error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <ScreenContainer title="Help & Support" showBack>
      <div className="px-6 py-6 space-y-6">
        
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            onClick={() => setShowAiChat(true)}
            className="flex flex-col items-center justify-center p-4 gap-2 border border-gray-100 hover:border-primary/50 cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary">
              <MessageSquare size={24} />
            </div>
            <span className="font-bold text-text-primary text-sm">AI Live Chat</span>
          </Card>
          
          <Card 
            onClick={() => setShowCreateTicket(true)}
            className="flex flex-col items-center justify-center p-4 gap-2 border border-gray-100 hover:border-primary/50 cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-success">
              <PlusCircle size={24} />
            </div>
            <span className="font-bold text-text-primary text-sm">Raise Ticket</span>
          </Card>
        </div>

        {/* My Tickets Preview */}
        {tickets.length > 0 && (
          <div>
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Ticket size={18} className="text-primary" />
              My Recent Tickets
            </h3>
            <div className="space-y-3">
              {tickets.slice(0, 3).map((ticket) => (
                <Card key={ticket.id} className="p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-text-primary text-sm line-clamp-1">{ticket.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                      ticket.status === 'Open' ? 'bg-blue-50 text-blue-600' : 
                      ticket.status === 'Resolved' ? 'bg-green-50 text-green-600' : 
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{ticket.description}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <Card 
                key={faq.id} 
                className="p-4 cursor-pointer border border-gray-100 shadow-sm hover:border-gray-200 transition-colors"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-text-primary text-sm pr-4">
                    {faq.question}
                  </h4>
                  {openFaq === faq.id ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </div>
                {openFaq === faq.id && (
                  <p className="text-xs text-text-secondary leading-relaxed mt-3 pt-3 border-t border-gray-50">
                    {faq.answer}
                  </p>
                )}
              </Card>
            ))}
            {faqs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No FAQs available yet.</p>
            )}
          </div>
        </div>

        {/* Call Support */}
        <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between border border-primary/10 mt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-sm">Emergency?</h4>
              <p className="text-xs text-text-secondary">Call our 24/7 support line</p>
            </div>
          </div>
          <Button size="sm" className="h-9 text-xs">Call Now</Button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAiChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-[400px] h-[80vh] sm:h-[600px] sm:rounded-[2rem] rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-4 bg-primary text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Support</h3>
                  <p className="text-[10px] text-white/80 uppercase tracking-widest">Always Online</p>
                </div>
              </div>
              <button onClick={() => setShowAiChat(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type your issue..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="absolute right-1 top-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50 disabled:bg-gray-300"
                >
                  <Send size={16} className="-ml-0.5 mt-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateTicket}
        onClose={() => setShowCreateTicket(false)}
        title="Raise a Support Ticket"
        description="Describe your issue below and our support agents will assist you shortly."
      >
        <div className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary ml-1">Issue Category</label>
            <select 
              value={ticketForm.issue_type}
              onChange={e => setTicketForm({...ticketForm, issue_type: e.target.value})}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-primary"
            >
              <option value="general">General Query</option>
              <option value="appointment_issue">Appointment Issue</option>
              <option value="payment_issue">Payment / Billing</option>
              <option value="consultation_issue">Consultation / Video Call</option>
              <option value="account_issue">Account / Login</option>
              <option value="complaint">Register a Complaint</option>
            </select>
          </div>
          
          <Input 
            label="Subject" 
            placeholder="E.g., Payment deducted but booking failed"
            value={ticketForm.title}
            onChange={(e: any) => setTicketForm({...ticketForm, title: e.target.value})}
          />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary ml-1">Description</label>
            <textarea 
              value={ticketForm.description}
              onChange={e => setTicketForm({...ticketForm, description: e.target.value})}
              placeholder="Please provide details about the issue..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-primary min-h-[120px] resize-none"
            />
          </div>

          <Button 
            fullWidth 
            onClick={handleCreateTicket} 
            isLoading={ticketLoading}
            disabled={!ticketForm.title || !ticketForm.description}
          >
            Submit Ticket
          </Button>
        </div>
      </Modal>

    </ScreenContainer>
  );
}
