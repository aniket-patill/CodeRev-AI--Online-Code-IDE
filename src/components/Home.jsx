"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Terminal,
  Menu,
  X,
  Code2,
  Mic,
  Users,
  Play,
  Sparkles,
  ArrowRight,
  Check,
  Github,
  MessageSquare,
  Star,
  TrendingUp,
  Globe,
  Twitter,
  Linkedin,
  Youtube,
  ChevronDown,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ---------------- NAVBAR ----------------
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#howitworks" },
    { label: "Testimonials", href: "#testimonials" },
  ];

  const scrollToSection = (href) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5" : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/CodeRev_Logo.png"
            alt="CodeRev Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain group-hover:scale-110 transition-all duration-300"
          />
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">CodeRev</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-zinc-900 dark:bg-white transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
              Log in
            </span>
          </Link>
          <Link href="/register">
            <Button className="h-9 px-5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-zinc-500/10 dark:shadow-white/10 rounded-lg">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-zinc-900 dark:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/5 p-6 flex flex-col gap-4">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-left"
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col gap-3 mt-2 border-t border-zinc-200 dark:border-white/10 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Switch Theme</span>
              <ThemeToggle />
            </div>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full h-10 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full h-10 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// ---------------- CODE EDITOR PREVIEW ----------------
const CodeEditorPreview = () => {
  const [activeTab, setActiveTab] = useState("main.py");
  const [typedCode, setTypedCode] = useState("");

  const codeSnippets = {
    "main.py": `# AI-powered code completion
def fibonacci(n: int) -> int:
    """Calculate fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# CodeRev suggests optimization
@cache
def fibonacci_optimized(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_optimized(n-1) + fibonacci_optimized(n-2)

print(fibonacci_optimized(40))  # Instant result!`,
    "app.js": `// Real-time collaboration enabled
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from CodeRev! 🚀');
});

server.listen(3000, () => {
  console.log('Server running!');
});`,
  };

  useEffect(() => {
    const code = codeSnippets[activeTab];
    let index = 0;
    setTypedCode("");

    const interval = setInterval(() => {
      if (index < code.length) {
        setTypedCode(code.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/80 hover:shadow-zinc-300/50 dark:hover:shadow-white/5 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/40 dark:bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Mic className="w-3 h-3" />
            Voice
          </div>
        </div>
      </div>

      <div className="relative flex border-b border-zinc-200 dark:border-white/10 bg-zinc-50/20 dark:bg-zinc-900/20 backdrop-blur-sm">
        {Object.keys(codeSnippets).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2.5 text-xs font-semibold transition-all duration-300 ${activeTab === tab
              ? "text-zinc-900 dark:text-white bg-zinc-200/60 dark:bg-zinc-800/60"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30"
              }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      <div className="relative p-4 font-mono text-xs min-h-[300px]">
        <div className="flex">
          <div className="text-zinc-600 text-right pr-4 select-none leading-6 font-medium">
            {typedCode.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <pre className="text-zinc-700 dark:text-zinc-300 leading-6 overflow-hidden flex-1">
            <code>
              {typedCode}
              <span className="inline-block w-2 h-4 bg-zinc-900 dark:bg-white/90 animate-pulse ml-0.5" />
            </code>
          </pre>
        </div>

        <div className="absolute bottom-4 right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 max-w-[260px] shadow-2xl shadow-black/50 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span className="font-semibold">AI Suggestion</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-2.5">Add @cache decorator for 1000x performance boost</p>
          <div className="flex gap-2">
            <button className="flex-1 text-xs px-2.5 py-1.5 bg-white text-black rounded-md font-semibold hover:bg-zinc-200 transition-colors">
              Accept
            </button>
            <button className="text-xs px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <div className="relative border-t border-zinc-200 dark:border-white/10 bg-zinc-50/20 dark:bg-zinc-900/20 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2 font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          Output
        </div>
        <div className="font-mono text-xs leading-relaxed">
          <span className="text-zinc-500">{">"}</span>{" "}
          <span className="text-green-400">Execution complete</span>{" "}
          <span className="text-zinc-600">(0.23s)</span>
          <br />
          <span className="text-zinc-900 dark:text-white font-semibold">102334155</span>
        </div>
      </div>
    </div>
  );
};

// ---------------- FEATURE CARD ----------------
const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="group relative p-6 rounded-xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-900/10 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-500">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zinc-900/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/10 backdrop-blur-sm border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-zinc-200 dark:group-hover:bg-white/15 transition-all duration-500">
          <Icon className="w-5 h-5 text-zinc-900 dark:text-white" />
        </div>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// ---------------- LANGUAGE SUPPORT ----------------
const LanguageSupport = () => {
  const languages = [
    { name: "JavaScript", icon: "JS", color: "text-yellow-400" },
    { name: "TypeScript", icon: "TS", color: "text-blue-400" },
    { name: "Python", icon: "🐍", color: "text-green-400" },
    { name: "C#", icon: "C#", color: "text-purple-400" },
    { name: "C++", icon: "C++", color: "text-blue-300" },
    { name: "HTML", icon: "</>", color: "text-orange-400" },
    { name: "Java", icon: "☕", color: "text-red-400" },
    { name: "JSON", icon: "{}", color: "text-yellow-300" },
    { name: "PHP", icon: "🐘", color: "text-indigo-400" },
    { name: "Markdown", icon: "MD", color: "text-zinc-400" },
    { name: "PowerShell", icon: ">_", color: "text-blue-400" },
    { name: "YAML", icon: "YML", color: "text-red-300" },
  ];

  return (
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 mb-6">
              <Code2 className="w-3.5 h-3.5" />
              Language Support
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-5 tracking-tight">
              Code in Any Language
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              CodeRev supports almost every major programming language. Several ship in the box, like JavaScript, TypeScript, CSS, and HTML.
            </p>
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {["JS", "TS", "🐍"].map((icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-white">
                    {icon}
                  </div>
                ))}
              </div>
              <span className="text-sm text-zinc-600 dark:text-zinc-500 font-medium">20+ Languages</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {languages.map((lang, i) => (
              <div
                key={i}
                className="group relative p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/30 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-500"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zinc-900/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative text-center">
                  <div className={`text-xl font-bold mb-1.5 ${lang.color} group-hover:scale-110 transition-transform duration-300`}>
                    {lang.icon}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    {lang.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------- STATS ----------------
const Stats = () => {
  const stats = [
    { icon: Users, value: "10K+", label: "Active Users" },
    { icon: Code2, value: "1M+", label: "Lines of Code" },
    { icon: Globe, value: "150+", label: "Countries" },
    { icon: Star, value: "4.9/5", label: "User Rating" },
  ];

  return (
    <section className="relative hidden py-20 px-6 border-y border-zinc-200 dark:border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-3 group-hover:scale-110 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-all duration-500">
                <stat.icon className="w-5 h-5 text-zinc-900 dark:text-white" />
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1.5">{stat.value}</div>
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------- CTA SECTION ----------------
const CTASection = () => {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-100/50 dark:via-zinc-900/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-[100px]" />

      <div className="relative max-w-4xl mx-auto">
        <div className="relative rounded-3xl border border-zinc-200 dark:border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20 backdrop-blur-xl p-12 md:p-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/5 dark:from-white/5 via-transparent to-transparent" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white mb-6 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
              Limited Time Offer
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
              Ready to Transform Your Coding?
            </h2>

            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of developers already shipping faster with AI-powered collaboration.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-zinc-900/20 dark:hover:shadow-white/20 rounded-xl">
                  Start Coding Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>

              <Button className="h-12 px-8 border border-zinc-200 dark:border-white/20 bg-white/50 dark:bg-white/5 text-zinc-900 dark:text-white font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300">
                <Github className="mr-2 w-4 h-4" />
                View on GitHub
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400" />
                Free forever
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------- TESTIMONIALS ----------------
const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Full Stack Developer",
      company: "@TechCorp",
      avatar: "SC",
      rating: 5,
      text: "CodeRev has completely transformed how I collaborate with my team. The AI suggestions are incredibly accurate, and the real-time collaboration feels seamless."
    },
    {
      name: "Marcus Johnson",
      role: "Software Engineer",
      company: "@StartupHub",
      avatar: "MJ",
      rating: 5,
      text: "The voice chat feature is a game-changer! Being able to discuss code while seeing changes in real-time makes pair programming so much more effective."
    },
    {
      name: "Priya Patel",
      role: "Senior Developer",
      company: "@DevStudio",
      avatar: "PP",
      rating: 5,
      text: "I've tried many online editors, but CodeRev's instant execution and Monaco integration make it the best. It's now my go-to tool for quick prototyping."
    }
  ];

  return (
    <section id="testimonials" className="relative py-24 px-6 border-t border-zinc-200 dark:border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-6">
            <Star className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
            Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
            Loved by Developers
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            See what developers are saying about CodeRev
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="group relative p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-900/10 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-900/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-white/20 dark:to-white/5 flex items-center justify-center text-zinc-900 dark:text-white text-sm font-bold border border-zinc-200 dark:border-white/10">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-xs text-zinc-500">{testimonial.role} {testimonial.company}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------- HOW IT WORKS ----------------
const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Sign Up Free",
      description: "Create your account in seconds with email or GitHub",
      icon: Users
    },
    {
      step: "02",
      title: "Create Project",
      description: "Choose your language and start a new project or import existing code",
      icon: Code2
    },
    {
      step: "03",
      title: "Collaborate Live",
      description: "Invite teammates and code together in real-time with voice chat",
      icon: Mic
    },
    {
      step: "04",
      title: "Deploy & Share",
      description: "Execute code instantly and share your work with the world",
      icon: Zap
    }
  ];

  return (
    <section id="howitworks" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-6">
            <Play className="w-3.5 h-3.5" />
            How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
            Start Coding in Seconds
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            No installation required. Just open, code, and collaborate.
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="relative group">
                <div className="relative p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-900/10 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-500">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-900/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500">
                      <item.icon className="w-6 h-6 text-zinc-900 dark:text-white" />
                    </div>

                    <div className="text-3xl font-bold text-zinc-200 dark:text-white/20 mb-2">{item.step}</div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------- FAQ ----------------
const FAQ = () => {
  const faqs = [
    {
      q: "Do I need to install anything?",
      a: "No! CodeRev is completely browser-based. Just sign up and start coding immediately. No downloads, no setup required."
    },
    {
      q: "What programming languages are supported?",
      a: "We support 20+ languages including JavaScript, Python, Java, C++, TypeScript, and many more. All with syntax highlighting and IntelliSense."
    },
    {
      q: "Is my code private and secure?",
      a: "Absolutely. Your code is encrypted and stored securely. You have full control over who can access your projects. We never share your code without permission."
    },
    {
      q: "Can I use CodeRev offline?",
      a: "CodeRev requires an internet connection for real-time collaboration and AI features. However, you can work on your code and it will sync when you're back online."
    },
    {
      q: "Is CodeRev really free?",
      a: "Yes! CodeRev is free forever for individual developers. We offer premium features for teams and enterprises, but the core features remain free."
    },
    {
      q: "How does real-time collaboration work?",
      a: "Multiple developers can edit the same file simultaneously with live cursors showing who's editing what. Changes appear instantly for all collaborators."
    }
  ];

  return (
    <section className="relative py-24 px-6 border-t border-zinc-200 dark:border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-6">
            <MessageSquare className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Everything you need to know about CodeRev
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group p-6 rounded-xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-900/10 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-base font-semibold text-zinc-900 dark:text-white">{faq.q}</span>
                <ChevronDown className="w-5 h-5 text-zinc-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------- PAGE ----------------
export default function HomePage() {
  const features = [
    {
      icon: Code2,
      title: "Monaco Editor",
      description: "Industry-standard code editor with IntelliSense and syntax highlighting."
    },
    {
      icon: Sparkles,
      title: "AI Code Review",
      description: "Get intelligent suggestions and optimizations powered by Gemini AI."
    },
    {
      icon: Mic,
      title: "Voice Chat",
      description: "Discuss code with teammates in real-time voice communication."
    },
    {
      icon: Play,
      title: "Instant Execution",
      description: "Run Python, JavaScript, Java, C++ instantly in your browser."
    },
    {
      icon: Users,
      title: "Real-time Collab",
      description: "True multiplayer coding with live cursors and editing."
    },
    {
      icon: MessageSquare,
      title: "AI Chat Assistant",
      description: "Get code explanations and generate solutions with AI."
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 pb-20 px-6 bg-gradient-to-b from-white via-purple-50/50 to-white dark:from-black dark:via-purple-950/30 dark:to-black">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-purple-100/20 to-white/50 dark:from-black/50 dark:via-purple-900/20 dark:to-black/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">AI-Powered Development Platform</span>
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span className="block text-zinc-900 dark:text-white">Code Smarter,</span>
                  <span className="block bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 dark:from-white dark:via-purple-100 dark:to-purple-300 bg-clip-text text-transparent">
                    Execute Faster
                  </span>
                </h1>

                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  The next-generation code editor with{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">AI assistance</span>,{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">real-time collaboration</span>, and{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">instant execution</span>.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-zinc-900/20 dark:hover:shadow-white/20 rounded-xl group">
                    Start Building Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Button className="h-12 px-8 border border-zinc-200 dark:border-white/20 bg-white/50 dark:bg-transparent text-zinc-900 dark:text-white font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300">
                  <Github className="mr-2 w-4 h-4" />
                  Star on GitHub
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="font-medium">Free forever</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="font-medium">No credit card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="font-medium">10K+ developers</span>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <CodeEditorPreview />
            </div>
          </div>
        </div>
      </section>

      {/* LANGUAGE SUPPORT */}
      <LanguageSupport />

      {/* STATS */}
      <Stats />

      {/* FEATURES */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-zinc-500 tracking-widest uppercase font-semibold mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
              Everything You Need to Code
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              AI assistance, multiplayer collaboration, and instant execution—all seamlessly integrated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* FAQ */}
      <FAQ />
      {/* CTA */}
      <CTASection />

      {/* ENHANCED FOOTER */}
      <footer className="relative py-16 px-6 border-t border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/CodeRev_Logo.png"
                  alt="CodeRev Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">CodeRev</span>
              </div>
              <p className="text-sm text-zinc-500 mb-6">
                The next-generation collaborative code editor for modern developers.
              </p>
              <div className="flex items-center gap-3">
                <Link href="#" className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                  <Twitter className="w-4 h-4 text-zinc-400" />
                </Link>
                <Link href="#" className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                  <Github className="w-4 h-4 text-zinc-400" />
                </Link>
                <Link href="#" className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                  <Linkedin className="w-4 h-4 text-zinc-400" />
                </Link>
                <Link href="#" className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                  <Youtube className="w-4 h-4 text-zinc-400" />
                </Link>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {["Features", "Pricing", "Security", "Roadmap", "Changelog"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                {["Documentation", "API Reference", "Blog", "Tutorials", "Community"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {["About", "Careers", "Contact", "Privacy", "Terms"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-zinc-200 dark:border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-zinc-500">
                © 2025 CodeRev. All rights reserved. Empowering developers worldwide.
              </div>

              <div className="flex items-center gap-6">
                <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Status
                </Link>
                <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
