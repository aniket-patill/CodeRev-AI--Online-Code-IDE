"use client";

import React, { useState, useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Github,
    Linkedin,
    Twitter,
    Mail,
    Users,
    Code2,
    Sparkles,
    Target,
    Menu,
    X,
    Cpu,
    Zap,
    Globe,
    MessageSquare,
    Layers,
    Rocket,
    Brain,
    Code,
    Users2,
    Laptop,
    GraduationCap,
    Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Team Member Card Component with Split Layout
// Team Member Card Component with Split Layout
const TeamMemberCard = ({ member }) => {
    return (
        <div className="group relative h-full flex flex-col rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 backdrop-blur-sm overflow-hidden hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 hover:-translate-y-1">
            {/* Top Half - Photo */}
            <div className="relative w-full aspect-square overflow-hidden">
                <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradient overlay at bottom of photo for text contrast if needed, or just style */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Status indicator */}
                <div className="absolute top-4 right-4 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-lg z-10">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
            </div>

            {/* Bottom Half - Info */}
            <div className="flex-1 p-6 flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/0 dark:to-zinc-900/50">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {member.name}
                    </h3>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {member.role}
                    </p>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 flex-1 line-clamp-4">
                    {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-white/10 mt-auto">
                    {member.github && (
                        <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors transform hover:scale-110"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    )}
                    {member.linkedin && (
                        <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors transform hover:scale-110"
                        >
                            <Linkedin className="w-5 h-5" />
                        </a>
                    )}
                    {member.twitter && (
                        <a
                            href={member.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-sky-500 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors transform hover:scale-110"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

// Navbar Component
const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "How It Works", href: "/#howitworks" },
        { label: "Team", href: "/team" },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                ? "bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <Image
                        src="/CodeRev_Logo.png"
                        alt="CodeRev Logo"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain group-hover:scale-110 transition-all duration-300"
                    />
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                        CodeRev
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-zinc-900 dark:bg-white transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/login">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                            Log in
                        </span>
                    </Link>
                    <Link href="/register">
                        <Button className="h-9 px-5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 text-sm font-semibold transition-all duration-300 hover:scale-105 rounded-lg">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-zinc-900 dark:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/5 p-6 flex flex-col gap-4">

                    {navLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="flex flex-col gap-3 mt-2 border-t border-zinc-200 dark:border-white/10 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Switch Theme
                            </span>
                            <ThemeToggle />
                        </div>

                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full h-10 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200">
                                Log in
                            </Button>
                        </Link>

                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full h-10 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default function TeamPage() {
    const lenisRef = useRef(null);

    // Initialize Lenis smooth scroll
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.8,
            easing: (t) => 1 - Math.pow(1 - t, 3),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.8,
            smoothTouch: true,
            touchMultiplier: 1.5,
            infinite: false,
        });

        lenisRef.current = lenis;
        window.lenis = lenis;

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

    const teamMembers = [
        {
            photo: "/teams/ayan.jpg",
            name: "Ayaan Shilledar",
            role: "Co-Founder & Full-Stack Developer",
            bio: "Passionate full-stack developer building cutting-edge AI-powered solutions for the next generation of developers.",
            github: "https://github.com/ayaan",
            linkedin: "https://linkedin.com/in/ayaan",
            twitter: "https://twitter.com/ayaan",
        },
        {
            photo: "/teams/Aniket.jpg",
            name: "Aniket Patil",
            role: "Co-Founder & Lead Developer",
            bio: "Innovative developer focused on creating seamless user experiences and robust backend architectures.",
            github: "https://github.com/aniket",
            linkedin: "https://linkedin.com/in/aniket",
            twitter: "https://twitter.com/aniket",
        },
        {
            photo: "/teams/krutika.jpg",
            name: "Krutika Sambranikar",
            role: "UI/UX Designer & Frontend Developer",
            bio: "Creative designer crafting beautiful, intuitive interfaces with modern design principles.",
            github: "https://github.com/krutika",
            linkedin: "https://linkedin.com/in/krutika",
            twitter: "https://twitter.com/krutika",
        },
        {
            photo: "/teams/prashant.jpg",
            name: "Prashant Chavan",
            role: "Research & CMO",
            bio: "Marketing strategist and researcher driving growth initiatives and exploring innovative market opportunities.",
            github: "https://github.com/prashant",
            linkedin: "https://linkedin.com/in/prashant",
            twitter: "https://twitter.com/prashant",
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 px-6 bg-gradient-to-b from-purple-50/50 via-white to-white dark:from-purple-950/30 dark:via-black dark:to-black overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-6 backdrop-blur-sm">
                           
                            Meet Our Team
                        </div>

                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                            <span className="block text-zinc-900 dark:text-white mb-2">
                                The Minds Behind
                            </span>
                            <span className="block bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 dark:from-white dark:via-purple-100 dark:to-purple-300 bg-clip-text text-transparent">
                                CodeRev AI
                            </span>
                        </h1>

                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            A diverse team of passionate developers, designers, and AI engineers working together to revolutionize the way you code.
                        </p>
                    </div>

                    {/* Group Photo */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="group relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative aspect-[16/9] md:aspect-[18/9]">
                                <Image
                                    src="/teams/Group_photo.jpg"
                                    alt="CodeRev Team Group Photo"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-6">
                                <p className="text-white text-sm md:text-base font-medium text-center">
                                    Our incredible team working together to build the future of coding
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Grid */}
            <section className="relative py-20 px-6">
                <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.map((member, idx) => (
                        <TeamMemberCard key={idx} member={member} />
                    ))}
                </div>
            </section>

            {/* Why We're Building CodeRev */}
            <section className="relative py-24 px-6 bg-zinc-50 dark:bg-zinc-900/30">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-6">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Our Mission
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-8 text-zinc-900 dark:text-white">Why We’re Building CodeRev</h2>
                    <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Coding today is more fragmented than ever — developers constantly jump across tabs for documentation, editors, AI tools, notes, debuggers, and team chats. This constant context switching slows learning, breaks collaboration, and makes even simple tasks unnecessarily complex.
                    </p>
                    <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mt-6">
                        We’re building CodeRev because we believe developers deserve a focused, intelligent environment where everything they need to build, learn, and collaborate exists in one seamless flow. Our mission is to remove friction, simplify the workflow, and make coding feel natural again.
                    </p>
                </div>
            </section>

            {/* How We're Building It */}
            <section className="relative py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-6">
                                <Cpu className="w-3.5 h-3.5" />
                                Our Tech Stack
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-zinc-900 dark:text-white">How We’re Building It</h2>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                                We combine proven engineering tools with cutting-edge AI. CodeRev is built on <span className="font-semibold text-zinc-900 dark:text-white">Next.js 15</span> and powered by the <span className="font-semibold text-zinc-900 dark:text-white">Monaco Editor</span>, the same engine behind VS Code.
                            </p>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                                Real-time collaboration runs on <span className="font-semibold text-zinc-900 dark:text-white">Firebase</span>, enabling instant syncing, live cursors, and multi-user editing in a single workspace. We integrate <span className="font-semibold text-zinc-900 dark:text-white">Google’s Gemini AI</span> directly into the editor to generate documentation, detect errors, suggest improvements, and guide developers through their code.
                            </p>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                With a UI crafted using <span className="font-semibold text-zinc-900 dark:text-white">Chakra UI + Tailwind CSS</span>, the platform delivers a clean, responsive, and intuitive experience designed for both beginners and professionals.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Code, title: "Next.js 15", desc: "Modern Framework" },
                                { icon: Layers, title: "Monaco Editor", desc: "VS Code Engine" },
                                { icon: Zap, title: "Firebase", desc: "Real-time Sync" },
                                { icon: Brain, title: "Gemini AI", desc: "Smart Assistant" }
                            ].map((tech, idx) => (
                                <div key={idx} className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                    <tech.icon className="w-8 h-8 text-purple-600 mb-4" />
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">{tech.title}</h3>
                                    <p className="text-sm text-zinc-500">{tech.desc}</p>
                                </div>
                            ))}
                        </div>
                        
                    </div>
                    
    
                    <div className="my-16 text-center">
                        <p className="text-xl font-medium text-zinc-900 dark:text-white">
                            Whether you're learning your first loop , CodeRev is built to support you.
                        </p>
                    </div> 
                </div>
            </section>

          
        </div>
    );
}
