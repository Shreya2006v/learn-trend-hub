import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Send, Sparkles, GraduationCap, Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type AssistanceType = 'general' | 'academic' | 'opportunities';

const Chatbot = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistanceType, setAssistanceType] = useState<AssistanceType>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      initializeConversation(user.id);
    });
  }, [navigate]);

  const initializeConversation = async (userId: string) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title: 'New Conversation',
        assistance_type: assistanceType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to initialize chat");
      return;
    }

    setConversationId(data.id);
  };

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      const channel = supabase
        .channel(`chat:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data || []).map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at
    })));
  };

  const handleAssistanceTypeChange = async (type: AssistanceType) => {
    setAssistanceType(type);
    if (user && conversationId) {
      await supabase
        .from('chat_conversations')
        .update({ assistance_type: type })
        .eq('id', conversationId);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || !user) return;

    setIsLoading(true);
    const messageText = input;
    setInput("");

    // Optimistically add the user message so UI feels responsive even if realtime is delayed
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data, error } = await supabase.functions.invoke('personalized-chat', {
        body: {
          message: messageText,
          conversationId,
          assistanceType,
          userId: user.id,
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      } else if (data?.response) {
        // Immediately show assistant reply; DB will persist it in background
        const tempAssistantMsg: Message = {
          id: `temp-assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempAssistantMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Learning Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personalized guide to learning and opportunities
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-4 flex gap-2 flex-wrap">
          <Button
            variant={assistanceType === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAssistanceTypeChange('general')}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            General Chat
          </Button>
          <Button
            variant={assistanceType === 'academic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAssistanceTypeChange('academic')}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            Academic Help
          </Button>
          <Button
            variant={assistanceType === 'opportunities' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAssistanceTypeChange('opportunities')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Opportunities
          </Button>
        </div>

        <Card className="h-[calc(100vh-280px)] flex flex-col bg-card/50 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {assistanceType === 'academic' && "Ask me anything about your studies, concepts, or learning paths."}
                  {assistanceType === 'opportunities' && "I can help you find hackathons, internships, and job opportunities based on your interests."}
                  {assistanceType === 'general' && "I'm here to help with your learning journey. What would you like to know?"}
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/50 p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chatbot;
