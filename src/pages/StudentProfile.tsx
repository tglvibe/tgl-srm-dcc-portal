import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BandBadge from "@/components/BandBadge";
import StatusBadge from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Building, Calendar, Award, Briefcase, BookOpen,
  Plus, Star, TrendingUp, GraduationCap, Pencil, Save, X,
} from "lucide-react";

const STUDENT_SKILLS = [
  { name: "Java", rating: 4, category: "Backend" },
  { name: "Spring Boot", rating: 4, category: "Backend" },
  { name: "Python", rating: 3, category: "Backend" },
  { name: "React", rating: 3, category: "Frontend" },
  { name: "SQL", rating: 4, category: "Database" },
  { name: "Docker", rating: 2, category: "DevOps" },
  { name: "AWS", rating: 2, category: "Cloud" },
  { name: "Git", rating: 5, category: "Tools" },
];

const ASSESSMENTS = [
  { round: "Round 1A (Aptitude)", band: "C2", date: "2025-11-15", status: "Completed" },
  { round: "Round 1B (Coding)", band: "C1", date: "2025-12-10", status: "Completed" },
  { round: "Round 1 Overall", band: "C2", date: "2025-12-15", status: "Completed" },
  { round: "Round 2 (In-person)", band: "—", date: "—", status: "Pending" },
];

const PLACEMENTS = [
  { company: "Infosys", status: "Applied", date: "2026-01-10", package: null },
  { company: "TCS", status: "Recommended", date: "2026-01-15", package: null },
  { company: "Wipro", status: "Offer Received", date: "2026-02-01", package: 8.5 },
  { company: "Cognizant", status: "Placed", date: "2026-02-08", package: 12.5 },
];

const SCORE_BREAKDOWN = [
  { param: "Bootcamp Attendance", weight: 15, score: 75, contribution: 11.25 },
  { param: "Virtual Class", weight: 15, score: 80, contribution: 12 },
  { param: "Workshop", weight: 10, score: 60, contribution: 6 },
  { param: "Assessment Band", weight: 30, score: 80, contribution: 24 },
  { param: "CGPA", weight: 15, score: 75, contribution: 11.25 },
  { param: "SHL Score", weight: 5, score: 68, contribution: 3.4 },
  { param: "Certifications", weight: 5, score: 100, contribution: 5 },
  { param: "Hackathons", weight: 5, score: 60, contribution: 3 },
];

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"skills" | "assessments" | "placements" | "employability">("skills");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    phone: "+91 98765 43210",
    personalEmail: "arjun.personal@gmail.com",
    linkedIn: "linkedin.com/in/arjunsharma",
    github: "github.com/arjunsharma",
    address: "Chennai, Tamil Nadu",
    bio: "Passionate about full-stack development and cloud computing.",
  });
  const [editForm, setEditForm] = useState(profile);

  const totalScore = SCORE_BREAKDOWN.reduce((sum, s) => sum + s.contribution, 0);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const tabs = [
    { id: "skills" as const, label: "Skills", icon: Award },
    { id: "assessments" as const, label: "Assessments", icon: BookOpen },
    { id: "placements" as const, label: "Placements", icon: Briefcase },
    { id: "employability" as const, label: "Employability", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="kpi-card !p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {user?.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
                <p className="text-sm text-muted-foreground font-mono">{user?.regNumber}</p>
              </div>
              {!isEditing ? (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleSave}>
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleCancel}>
                    <X className="w-3.5 h-3.5" /> Cancel
                  </Button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>
                  <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{user?.department}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Year 3</span>
                </div>
                {profile.bio && <p className="text-sm text-muted-foreground italic">{profile.bio}</p>}
                <div className="flex gap-3 items-center">
                  <StatusBadge status="Placed" />
                  <BandBadge band="C1" />
                  <span className="text-sm font-semibold text-accent">Score: {totalScore.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Personal Email</Label>
                  <Input value={editForm.personalEmail} onChange={e => setEditForm({ ...editForm, personalEmail: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">LinkedIn</Label>
                  <Input value={editForm.linkedIn} onChange={e => setEditForm({ ...editForm, linkedIn: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">GitHub</Label>
                  <Input value={editForm.github} onChange={e => setEditForm({ ...editForm, github: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Address</Label>
                  <Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Bio</Label>
                  <Input value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="text-right space-y-1 shrink-0">
              <div className="text-xs text-muted-foreground">Profile Completeness</div>
              <div className="text-lg font-bold text-foreground">85%</div>
              <Progress value={85} className="w-32 h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "skills" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Technology Skills</h2>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Skill
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STUDENT_SKILLS.map((skill) => (
              <div key={skill.name} className="kpi-card !p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground text-sm">{skill.name}</div>
                  <div className="text-xs text-muted-foreground">{skill.category}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= skill.rating ? "fill-warning text-warning" : "text-border"}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="kpi-card">
            <h3 className="text-sm font-semibold mb-3">Tech Stack Bands</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { stack: "Java Backend", band: "C1" },
                { stack: "Full Stack", band: "C2" },
                { stack: "Cloud & DevOps", band: "D1" },
              ].map((tb) => (
                <div key={tb.stack} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-foreground">{tb.stack}</span>
                  <BandBadge band={tb.band} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "assessments" && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="text-lg font-semibold">Talent Discovery Assessments</h2>
          {ASSESSMENTS.map((a) => (
            <div key={a.round} className="kpi-card !p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground text-sm">{a.round}</div>
                <div className="text-xs text-muted-foreground">{a.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.band !== "—" && <BandBadge band={a.band} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "placements" && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="text-lg font-semibold">Placement Journey</h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            {PLACEMENTS.map((p, i) => (
              <div key={p.company} className="relative kpi-card !p-4">
                <div className={`absolute -left-[22px] top-4 w-3 h-3 rounded-full border-2 ${
                  i === PLACEMENTS.length - 1 ? "bg-success border-success" : "bg-card border-accent"
                }`} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground text-sm">{p.company}</div>
                    <div className="text-xs text-muted-foreground">{p.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.package && <span className="text-sm font-semibold text-success">₹{p.package} LPA</span>}
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "employability" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Employability Score Breakdown</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-accent">{totalScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
          </div>
          <div className="space-y-2">
            {SCORE_BREAKDOWN.map((item) => (
              <div key={item.param} className="kpi-card !p-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">{item.param}</span>
                    <span className="text-xs text-muted-foreground">Weight: {item.weight}%</span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
                <div className="text-right shrink-0 w-16">
                  <div className="text-sm font-semibold text-foreground">{item.contribution.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground">pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
