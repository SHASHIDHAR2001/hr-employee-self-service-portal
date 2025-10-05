import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Send, Paperclip, FileText, TrendingUp, Clock, Award } from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentsUsed?: string[];
}

export default function AIAssistant() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI HR Assistant. I can help you with questions about leave policies, benefits, attendance, salary, and other HR-related topics. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: documents } = useQuery({
    queryKey: ['/api/hr-documents'],
    retry: false,
  });

  const askAIMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest('POST', '/api/ai/ask', { question });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        documentsUsed: data.documentsUsed
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    askAIMutation.mutate(inputMessage.trim());
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the leave encashment rules?",
    "How do I apply for maternity leave?", 
    "What benefits am I eligible for?",
    "How is overtime calculated?",
    "What is the notice period policy?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          {/* Chat Header */}
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI HR Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">Ask me anything about HR policies</p>
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                  message.type === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div 
                  className={`rounded-2xl p-4 max-w-md ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none ml-auto' 
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.documentsUsed && message.documentsUsed.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Referenced documents:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.documentsUsed.map((doc, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
            ))}
            {askAIMutation.isPending && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-border">
            <div className="flex items-end gap-3">
              <Button variant="ghost" size="sm" className="p-3">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about HR policies..."
                  className="resize-none min-h-12 max-h-32 pr-12"
                  rows={1}
                  data-testid="chat-input"
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || askAIMutation.isPending}
                className="px-3"
                data-testid="send-message-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              AI responses are based on uploaded HR documents and may not be 100% accurate. Please verify critical information.
            </p>
          </div>
        </Card>
      </div>

      {/* Suggested Questions & Context */}
      <div className="lg:col-span-1 space-y-6">
        {/* Suggested Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full text-left justify-start p-3 h-auto text-wrap"
                onClick={() => handleSuggestedQuestion(question)}
                data-testid={`suggested-question-${index}`}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">?</span>
                  </div>
                  <span className="text-sm text-left">{question}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Active Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents && documents.length > 0 ? (
              documents.slice(0, 5).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.category} • {doc.vectorCount || 0} vectors
                    </p>
                  </div>
                  {doc.isActive && (
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Stats */}
        <div className="bg-gradient-to-br from-primary to-purple-500 rounded-xl p-6 text-white">
          <h4 className="font-semibold mb-4">AI Assistant Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm opacity-90">Questions Today:</span>
              </div>
              <span className="font-bold">{messages.filter(m => m.type === 'user').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm opacity-90">Avg Response Time:</span>
              </div>
              <span className="font-bold">1.2s</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="text-sm opacity-90">Accuracy Rate:</span>
              </div>
              <span className="font-bold">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
