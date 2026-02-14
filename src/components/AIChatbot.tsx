import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatWithGemini, isGeminiChatConfigured, type ChatMessage } from "@/lib/geminiChat";
import { useStudents } from "@/hooks/useStudents";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Bot, Send, X, Sparkles, MessageCircle, Loader2 } from "lucide-react";

interface UIMessage {
  role: "user" | "assistant";
  content: string;
}

const ADMIN_PRESETS = [
  "What's the overall pass rate and how does it compare across departments?",
  "Which departments have the highest absentee rates?",
  "Summarize the coding band distribution and identify weak areas.",
  "What interventions do you recommend for C5/C6 band students?",
  "Compare aptitude vs coding performance across the batch.",
  "Predict how R2 outcomes might look based on R1 trends.",
];

const STUDENT_PRESETS = [
  "How did I perform in R1 compared to the batch average?",
  "What are my strengths and areas for improvement?",
  "What should I focus on to move to a higher band?",
  "Explain my R1 band and what it means for placements.",
];

export default function AIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { students } = useStudents({});
  const analytics = useAnalytics(students);

  const configured = isGeminiChatConfigured();
  const presets = user?.role === "admin" ? ADMIN_PRESETS : STUDENT_PRESETS;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function buildSystemPrompt(): string {
    const { kpis } = analytics;
    const base = `You are the SRM IST Decision Intelligence AI assistant. You analyze student assessment data and provide actionable insights. Be concise, use numbers, and format with markdown.

Current Data Summary:
- Total Students: ${kpis.totalStudents}
- Present (R1): ${kpis.presentCount} (${kpis.attendanceRate}%)
- Absent: ${kpis.absentCount}
- R1 Pass Rate: ${kpis.passRate}% (${kpis.passCount} passed)
- Avg Aptitude: ${kpis.avgAptitudePercentage}%
- Avg Coding: ${kpis.avgCodingPercentage}%
- Departments: ${kpis.uniqueDepartments}
- Specializations: ${kpis.uniqueSpecializations}`;

    if (user?.role === "student") {
      const me = students.find(s => s.registration_number === user.regNumber);
      if (me) {
        return base + `\n\nCurrent Student: ${me.student_name}
Reg: ${me.registration_number} | Dept: ${me.department} | Section: ${me.section}
Aptitude: ${me.aptitude_percentage} (Band ${me.aptitude_band}) | Coding: ${me.coding_percentage} (Band ${me.coding_band})
R1 Band: ${me.r1_band} | R1 Result: ${me.r1_result} | R2 Status: ${me.r2_status || "N/A"}`;
      }
    }

    return base + `\n\nDepartment breakdown: ${analytics.departmentBreakdown.slice(0, 5).map(d => `${d.department}: ${d.total} total, ${d.pass} pass`).join("; ")}`;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: UIMessage = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history: ChatMessage[] = [...messages, userMsg].map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await chatWithGemini(history, buildSystemPrompt());
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="AI Assistant"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
        {configured && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-success border-2 border-card" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] sm:max-w-[calc(100vw-2rem)] h-[100dvh] sm:h-[560px] sm:max-h-[calc(100vh-4rem)] flex flex-col sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
        <Bot className="w-5 h-5" />
        <div className="flex-1">
          <div className="text-sm font-semibold">DI Assistant</div>
          <div className="text-[10px] opacity-80">
            {configured ? "Gemini AI • Multi-key rotation" : "API key required"}
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/20 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium">Quick questions</span>
            </div>
            <div className="space-y-1.5">
              {presets.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={!configured}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-border transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-2 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        {!configured ? (
          <div className="text-xs text-muted-foreground text-center py-2">
            Add <code className="bg-muted px-1 rounded">VITE_GEMINI_API_KEY</code> to enable AI chat
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about student data..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
