import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, BookOpen, Briefcase, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { User } from '@supabase/supabase-js';

type AssistanceType = 'general' | 'academic' | 'opportunities' | 'projects';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [assistanceType, setAssistanceType] = useState<AssistanceType>('general');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      initConversation(user.id);
      loadUserInterests(user.id);
    });
  }, [navigate]);

  const loadUserInterests = async (userId: string) => {
    const { data } = await supabase
      .from('user_interests')
      .select('topic')
      .eq('user_id', userId)
      .order('search_count', { ascending: false })
      .limit(5);
    
    if (data) {
      setUserInterests(data.map(d => d.topic));
    }
  };

  const initConversation = async (userId: string) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert([{ user_id: userId, assistance_type: 'general' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to start conversation");
      return;
    }

    setConversationId(data.id);
  };

  const updateConversationType = async (type: AssistanceType) => {
    if (!conversationId) return;
    
    setAssistanceType(type);
    await supabase
      .from('chat_conversations')
      .update({ assistance_type: type })
      .eq('id', conversationId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('personalized-chat', {
        body: {
          message: userMessage,
          conversationId,
          assistanceType,
          userInterests
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits depleted. Please add more credits.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Learning Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personalized guidance for your learning journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-4 flex gap-2 flex-wrap">
          <Button
            variant={assistanceType === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateConversationType('general')}
          >
            General
          </Button>
          <Button
            variant={assistanceType === 'academic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateConversationType('academic')}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Academic Help
          </Button>
          <Button
            variant={assistanceType === 'opportunities' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateConversationType('opportunities')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Opportunities
          </Button>
          <Button
            variant={assistanceType === 'projects' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateConversationType('projects')}
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Project Ideas
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border/50 shadow-sm h-[calc(100vh-280px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Start a conversation! I'm here to help with your learning journey.
                </p>
                {userInterests.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    I know you're interested in: {userInterests.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
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
                placeholder="Ask me anything..."
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-auto"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
