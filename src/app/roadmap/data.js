import { FileCode2, Cpu, FileJson, Terminal } from "lucide-react";

export const roadmaps = [
    {
        slug: "cpp",
        title: "C++ Roadmap",
        description: "Master C++ from basics to advanced concepts including STL, memory management, and system programming.",
        icon: Terminal,
        pdf: "/Roadmaps/cpp.pdf",
        color: "from-blue-600 to-blue-400",
        gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/5",
        border: "border-blue-500/20",
        textData: {
            intro: "C++ is a powerful general-purpose programming language available for diverse platforms.",
           
        }
    },
    {
        slug: "python",
        title: "Python Roadmap",
        description: "Learn Python for web development, automation, data science, and AI/ML applications.",
        icon: FileCode2,
        pdf: "/Roadmaps/python.pdf",
        color: "from-yellow-400 to-yellow-600",
        gradient: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/5",
        border: "border-yellow-500/20",
        textData: {
            intro: "Python is a high-level, interpreted programming language known for its readability.",
          
        }
    },
    {
        slug: "javascript",
        title: "JavaScript Roadmap",
        description: "Become a full-stack developer with JavaScript, covering DOM, React, Node.js, and modern frameworks.",
        icon: FileJson,
        pdf: "/Roadmaps/javascript.pdf",
        color: "from-yellow-300 to-orange-400",
        gradient: "bg-gradient-to-br from-yellow-400/20 to-orange-500/5",
        border: "border-yellow-400/20",
        textData: {
            intro: "JavaScript is the programming language of the Web, used for frontend and backend.",
           
        }
    },
    {
        slug: "ai-engineer",
        title: "AI Engineer Roadmap",
        description: "Dive into Artificial Intelligence, Deep Learning, and Neural Networks with practical applications.",
        icon: Cpu,
        pdf: "/Roadmaps/ai-engineer.pdf",
        color: "from-purple-500 to-pink-500",
        gradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/5",
        border: "border-purple-500/20",
        textData: {
            intro: "AI Engineering combines software engineering with data science to build AI systems.",
           
        }
    }
];
