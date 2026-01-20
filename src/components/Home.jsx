"use client";

import React, { useState, useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { motion } from "framer-motion";
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
  MousePointer2,
  FileText,
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
    { label: "Team", href: "/team" }

  ];

  const scrollToSection = (href) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      // Use Lenis for smooth scroll if available
      if (window.lenis) {
        window.lenis.scrollTo(element, { offset: -80 });
      } else {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`relative z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/5"
        : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl font-bold text-white bg-[#0022ff] px-4 py-2 rounded-lg tracking-tight">CodeRev</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            item.href.startsWith('#') ? (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-zinc-900 dark:bg-white transition-all duration-300 group-hover:w-full" />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-zinc-900 dark:bg-white transition-all duration-300 group-hover:w-full" />
              </Link>
            )
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
            item.href.startsWith('#') ? (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-left"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
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

  const code = codeSnippets[activeTab];

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/80 hover:shadow-zinc-300/50 dark:hover:shadow-white/5 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
            {code.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <pre className="text-zinc-700 dark:text-zinc-300 leading-6 overflow-x-auto flex-1 w-0">
            <code>
              {code}
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
    <section className="relative z-10 min-h-screen flex flex-col justify-center py-16 md:py-24 px-6 overflow-hidden bg-[#0022ff]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:14px_14px] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-transparent to-indigo-900/50 mix-blend-overlay" />


      <div className="relative max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white mb-6 backdrop-blur-sm">
              <Code2 className="w-3.5 h-3.5" />
              Language Support
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              Code in Any Language
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed mb-8">
              CodeRev supports almost every major programming language. Several ship in the box, like JavaScript, TypeScript, CSS, and HTML.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {["JS", "TS", "🐍"].map((icon, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white text-blue-600 border-2 border-[#0022ff] flex items-center justify-center text-xs font-bold shadow-lg">
                    {icon}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white">10+ Languages</span>
                <span className="text-xs text-blue-200">Supported out of the box</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {languages.map((lang, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + (i * 0.05) }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative p-4 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 cursor-default"
              >
                <div className="relative text-center">
                  <div className={`text-xl font-bold mb-2 text-white drop-shadow-sm`}>
                    {lang.icon}
                  </div>
                  <div className="text-[10px] text-blue-200 font-medium group-hover:text-white transition-colors">
                    {lang.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
    <section className="relative z-10 hidden py-20 px-6 border-y border-zinc-200 dark:border-white/5">
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
    <section id="howitworks" className="relative z-10 py-24 px-6">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="relative group">
                <div className="relative h-full p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-900/10 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-500">
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
  const [openIndex, setOpenIndex] = useState(null);

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
      q: "Can I collaborate with my team?",
      a: "Absolutely! You can invite unlimited teammates to your workspace. Changes are synced in real-time, just like Google Docs for code."
    },
    {
      q: "Is there a free plan?",
      a: "Yes, our Free plan includes unlimited public projects, 3 private projects, and community support. Perfect for hobbyists and students."
    },
    {
      q: "How secure is my code?",
      a: "Security is our top priority. We use enterprise-grade encryption for all data in transit and at rest. Your code is private and secure."
    }
  ];

  // Simple pixel grid for "FAQs"
  // 1 = solid, 0 = transparent
  const pixelMap = {
    F: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 0, 0],
      [1, 0, 0]
    ],
    A: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1]
    ],
    Q: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1]
    ],
    S: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1]
    ]
  };

  const renderLetter = (letter) => (
    <div className="flex flex-col gap-1">
      {pixelMap[letter].map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((cell, j) => (
            <div
              key={j}
              className={`w-3 h-3 md:w-4 md:h-4 ${cell ? 'bg-zinc-900 dark:bg-white' : 'bg-transparent'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section className="relative z-10 pt-4 pb-24 px-6 bg-[#fcfcfc] dark:bg-black/20">
      {/* Reticle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fcfcfc] dark:from-black to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 md:gap-24">
          {/* Left Column: Title & CTA */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              {/* Pixelated Title */}
              <div className="flex gap-4 md:gap-6 mb-12 select-none hover:scale-[1.02] transition-transform duration-300">
                {renderLetter('F')}
                {renderLetter('A')}
                {renderLetter('Q')}
                {renderLetter('S')}
              </div>
            </div>

            {/* GitHub CTA (Moved here) */}
            <div className="hidden md:block">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                Spotted an issue?
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Help us improve — open it on GitHub.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com/ayaanshilledar/CodeRev--AI-Powered-Online-Code-Editor.git"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-[#5765f2] hover:bg-[#4a58e0] text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </Link>

                <Link
                  href="#newsletter"
                  className="text-xs text-[#5765f2] hover:underline font-medium"
                >
                  Stay in the loop
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Questions */}
          <div className="md:col-span-7">
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="group border-b border-zinc-200 dark:border-white/5 last:border-0"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full text-left py-6 flex items-start justify-between gap-4 select-none"
                  >
                    <span className="text-lg font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {faq.q}
                    </span>
                    <div className={`relative flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${openIndex === i ? 'rotate-45' : ''}`}>
                      <div className="absolute w-4 h-0.5 bg-zinc-400 dark:bg-zinc-600 group-hover:bg-[#5765f2] transition-colors" />
                      <div className="absolute h-4 w-0.5 bg-zinc-400 dark:bg-zinc-600 group-hover:bg-[#5765f2] transition-colors" />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile CTA (shown at bottom on mobile) */}
            <div className="md:hidden mt-12 pt-12 border-t border-zinc-200 dark:border-white/5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                Spotted an issue?
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Help us improve — open it on GitHub.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com/ayaanshilledar/CodeRev--AI-Powered-Online-Code-Editor.git"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-[#5765f2] text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </Link>
                <Link
                  href="#newsletter"
                  className="text-xs text-[#5765f2] hover:underline font-medium"
                >
                  Stay in the loop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------- PAGE ----------------
export default function HomePage() {
  const lenisRef = useRef(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => 1 - Math.pow(1 - t, 3), // Smoother cubic ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0, // Reduced for smoother wheel scrolling
      smoothTouch: true, // Enable smooth touch scrolling
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.lenis = lenis; // Make it globally accessible for scrollToSection

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      if (window.lenis) {
        delete window.lenis;
      }
    };
  }, []);

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
    {
      icon: FileText,
      title: "AI Documentation",
      description: "Auto-generate comprehensive documentation for your code with AI."
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
      {/* Mobile Experience Warning */}
      <div className="fixed md:hidden relative w-full bg-yellow-400 text-black text-xs font-bold text-center py-3 px-4 shadow-sm z-50">
        For better experience use on desktop
      </div>

      <Navbar />

      {/* HERO */}
      {/* HERO */}
      <section className="sticky top-0 z-0 min-h-screen flex flex-col justify-center pt-24 pb-12 md:pt-28 md:pb-20 px-6 bg-gradient-to-b from-white via-blue-50/50 to-white dark:from-black dark:via-blue-950/30 dark:to-black">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-blue-100/20 to-white/50 dark:from-black/50 dark:via-blue-900/20 dark:to-black/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-blue-900/15 rounded-full blur-[60px] md:blur-[100px]" />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">AI-Powered Development Platform</span>
              </div>

              <div className="space-y-4 md:space-y-5">
                <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span className="block text-zinc-900 dark:text-white">Code Smarter,</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 dark:from-white dark:via-blue-100 dark:to-blue-300 bg-clip-text text-transparent">
                    Execute Faster
                  </span>
                </h1>

                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  The next-generation code editor with{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">AI assistance</span>,{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">real-time collaboration</span>, and{" "}
                  <span className="text-zinc-900 dark:text-white font-semibold">instant execution</span>.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="/register">
                  <Button className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-zinc-900/20 dark:hover:shadow-white/20 rounded-xl group">
                    Start Building
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

              </div>

            </div>

            <div className="lg:pl-8 mt-12 lg:mt-0">
              <CodeEditorPreview />
            </div>
          </div>
        </div>
      </section>

      {/* HERO CONTENT CURTAIN WRAPPER */}
      <div className="relative z-10 bg-white dark:bg-black shadow-[0_-30px_80px_rgba(0,0,0,0.3)]">

        {/* LANGUAGE SUPPORT */}
        <LanguageSupport />

        {/* STATS */}
        <Stats />

        {/* FEATURES CAROUSEL */}
        <section id="features" className="relative z-10 py-24 border-b border-zinc-200 dark:border-white/5 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="max-w-4xl">
                <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                  Engineered to perfection
                </h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Every feature is purposefully crafted to enhance your productivity and streamline your digital experience.
                </p>
              </div>

              <div className="flex">
                <button
                  onClick={() => document.getElementById('features-scroll').scrollBy({ left: -400, behavior: 'smooth' })}
                  className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={() => document.getElementById('features-scroll').scrollBy({ left: 400, behavior: 'smooth' })}
                  className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            <div
              id="features-scroll"
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 -mx-6 px-6 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                {
                  title: "AI Code Review",
                  desc: "Get intelligent code suggestions, bug fixes, and performance optimizations powered by Gemini AI.",
                  image: "/Features/fix_feature.png"
                },
                {
                  title: "Workspace Modes",
                  desc: "Customize your environment with flexible workspace modes designed for any coding task.",
                  image: "/Features/modes_workspace.png"
                },
                {
                  title: "Real-time Collaboration",
                  desc: "True multiplayer coding with live cursors, shared terminals, and voice chat.",
                  image: "/Features/File_explorer.png"
                },
                {
                  title: "AI Chat Assistant",
                  desc: "Ask complex coding questions and generate entire features with our context-aware AI assistant.",
                  image: "/Features/Ai_chat.png"
                },
                {
                  title: "GitHub Integration",
                  desc: "Seamlessly push code, manage branches, and sync with your repositories directly from the editor.",
                  image: "/Features/github.png"
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="min-w-[280px] md:min-w-[480px] snap-center group"
                >
                  <div className="mb-4 pr-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed h-[60px]">{feature.desc}</p>
                  </div>

                  <div className="aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-zinc-900 transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/20 relative">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* HOW IT WORKS */}
        <HowItWorks />

        {/* FAQ */}
        <FAQ />


        {/* NEW FOOTER */}
        <footer className="relative bg-[#0022ff] py-24 px-6 overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:14px_14px] opacity-30" />

          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-transparent to-indigo-900/50 mix-blend-overlay" />

          <div className="relative max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-16 md:gap-8">

            {/* Left: Giant Text */}
            <div className="flex-1">
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-[0.9]">
                START<br />
                BUILDING<br />
                NOW
              </h1>
            </div>

            {/* Right: Inspirational Text */}
            <div className="flex-1 md:max-w-xl text-white/90 text-lg md:text-xl font-medium leading-relaxed self-center flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <p className="mb-8">
                  Coding is full of friction worth removing.<br />
                  Now, everything you need is in one place.<br />
                  CodeRev is our gift to the next gen of builders<br />
                  to satisfy their itch and build what's next.
                </p>

                <p className="mb-8">
                  Want to start building?<br />
                  Start with CodeRev.
                </p>
              </div>

              {/* Restored Context: Links */}
              <div className="grid grid-cols-2 gap-8 text-sm md:text-base">
                <div>
                  <h4 className="font-bold text-white mb-4 opacity-50 uppercase tracking-widest text-xs">Product</h4>
                  <ul className="space-y-2">
                    <li><Link href="/login" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all">Sign In</Link></li>
                    <li><Link href="/register" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all">Get Started</Link></li>
                    <li><Link href="#features" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all">Features</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-4 opacity-50 uppercase tracking-widest text-xs">Connect</h4>
                  <ul className="space-y-2">
                    <li><Link href="https://github.com/ayaanshilledar/CodeRev--AI-Powered-Online-Code-Editor.git" target="_blank" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</Link></li>
                    <li><Link href="#" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter</Link></li>
                    <li><Link href="#" className="hover:text-white hover:underline decoration-blue-400 underline-offset-4 transition-all flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</Link></li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </footer>
      </div>
    </div>
  );
}
