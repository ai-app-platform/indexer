import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useProjectStore, ChatMessage } from '../stores/projectStore';
import { generateId } from '../lib/utils';

const aiResponses = [
  "Based on the project analysis, this is a Spring Boot 4.1 application using Java 21 with a layered architecture. The main modules are:\n\n1. **Patient Management** - Handles patient CRUD operations\n2. **Dental Orders** - Manages order lifecycle with state machine\n3. **Lab Work** - Laboratory task tracking\n4. **Billing** - Invoice processing\n\nThe project uses JPA/Hibernate for ORM with PostgreSQL as the database.",
  "The `PatientService` class has the following dependencies:\n\n- **PatientRepository** - For database operations (injected via constructor)\n- **PatientMapper** - For DTO mapping (injected via constructor)\n\nKey business rules enforced:\n1. National ID must be unique\n2. Phone must follow Iranian format (09XXXXXXXXX)\n3. Cannot delete patients with active orders",
  "The main methods in PatientController are:\n\n| Method | HTTP | Path | Description |\n|--------|------|------|-------------|\n| createPatient | POST | /api/v1/patients | Create new patient |\n| getPatientById | GET | /api/v1/patients/{id} | Get patient by ID |\n| getAllPatients | GET | /api/v1/patients | List all patients |\n| updatePatient | PUT | /api/v1/patients/{id} | Update patient |\n| deletePatient | DELETE | /api/v1/patients/{id} | Delete patient |",
  "The project tech stack:\n\n- **Language**: Java 21\n- **Framework**: Spring Boot 4.1\n- **Database**: PostgreSQL\n- **Build**: Maven\n- **ORM**: JPA / Hibernate\n- **Validation**: Jakarta Bean Validation\n- **Architecture**: Layered (Controller → Service → Repository)\n\nThe project follows SOLID principles with clear separation of concerns.",
];

export function Chat() {
  const { t } = useTranslation();
  const { chatMessages, addChatMessage, clearChat } = useProjectStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiResponses[responseIndex.current % aiResponses.length],
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMessage);
      setIsTyping(false);
      responseIndex.current++;
    }, 1500);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('chat.title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions about your indexed project
            </p>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 card p-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              {t('chat.suggestions')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
              {[
                t('chat.suggestion1'),
                t('chat.suggestion2'),
                t('chat.suggestion3'),
                t('chat.suggestion4'),
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-xs text-start p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-slate-600 dark:text-slate-400"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-teal-100 dark:bg-teal-900/30'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                ) : (
                  <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('chat.thinking')}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder={t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="!px-4"
        >
          <Send className="h-4 w-4" />
          {t('chat.send')}
        </Button>
      </div>
    </div>
  );
}
