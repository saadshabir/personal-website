export const SITE_CONFIG = {
  name: "Muhammad Saad Shabir",
  url: "https://msaadshabir.vercel.app",
  email: "saad.shabir@hotmail.com",
  github: "https://github.com/saadshabir",
  linkedin: "https://www.linkedin.com/in/saadshabir/",
  resume: "/MuhammadSaad_Shabir_Resume.pdf",
  location: "Ottawa, Canada",
  description:
    "Focusing on network architecture, protocol analysis, and system programming.",
  jobTitle: "Network Technician & Software Developer",
  school: "Carleton University",
  schoolUrl: "https://carleton.ca/",
  status: "Currently exploring new experiences.",
} as const;

type Project = {
  id: string;
  name: string;
  url: string;
  description: string;
  tags: readonly string[];
};

type WritingEntry = {
  id: string;
  title: string;
  publishedAt: string;
  description: string;
  url: string;
};

type Experience = {
  position: string;
  company: string;
  dates: string;
  description: readonly string[];
  link: string;
};

// Projects data
export const PROJECTS: readonly Project[] = [
  {
    id: "001",
    name: "ZTAP",
    url: "https://github.com/saadshabir/ZTAP",
    description:
      "Cross-platform zero-trust microsegmentation engine enforcing network policies at the kernel level (eBPF, WFP, pf) with etcd-backed policy distribution and hybrid cloud security orchestration (AWS/GCP/Azure).",
    tags: [
      "Go",
      "eBPF (CO-RE)",
      "Windows Filtering Platform (WFP)",
      "etcd",
      "gRPC",
      "Prometheus",
      "AWS/Azure/GCP",
      "Kubernetes",
    ],
  },
  {
    id: "002",
    name: "NetScope",
    url: "https://github.com/saadshabir/NetScope",
    description:
      "A high-performance, zero-copy network packet capture and protocol analysis tool written in Rust, featuring kernel-level BPF filtering and real-time flow tracking.",
    tags: ["Rust", "libpcap", "BPF", "Zero-Copy Parsing", "WebAssembly"],
  },
  {
    id: "003",
    name: "pci-segment",
    url: "https://github.com/saadshabir/pci-segment",
    description:
      "Go CLI for PCI-DSS network segmentation. Validates YAML policies, enforces via eBPF (Linux) or pf (macOS), syncs to AWS/Azure, and generates compliance reports.",
    tags: [
      "Go",
      "eBPF",
      "Cloud Security (AWS/Azure)",
      "Network Segmentation",
      "CLI",
      "Prometheus",
    ],
  },
  {
    id: "004",
    name: "cloud-netmapper",
    url: "https://github.com/saadshabir/cloud-netmapper",
    description:
      "A Go-based CLI tool that automatically discovers, visualizes, and analyzes AWS cloud infrastructure. It generates interactive network topology maps across multiple AWS services and performs real-time security checks to detect misconfigurations and infrastructure drift.",
    tags: [
      "Go",
      "AWS SDK",
      "Network Visualization",
      "Security Analysis",
      "CLI",
    ],
  },
  {
    id: "005",
    name: "net-guardian",
    url: "https://github.com/saadshabir/net-guardian",
    description:
      "An automated network health and security auditor that combines ARP/port scanning, machine learning-based anomaly detection, and CVE vulnerability matching to continuously monitor local networks.",
    tags: ["Python", "Scapy", "Nmap", "Scikit-Learn", "SQLite", "Webhooks"],
  },
  {
    id: "006",
    name: "personal-ai-cli",
    url: "https://github.com/saadshabir/personal-ai-cli",
    description:
      "A self-hosted, terminal-based RAG chatbot that lets you securely query your personal documents using local LLMs via Ollama and ChromaDB, ensuring 100% privacy with zero cloud dependencies.",
    tags: ["Python", "Local LLM (Ollama)", "RAG", "CLI"],
  },
  {
    id: "007",
    name: "CloudChat",
    url: "https://github.com/saadshabir/CloudChat",
    description:
      "A modern Twitter/X clone built with Next.js 15, React 19, and TypeScript. Features real-time updates, infinite scroll, optimistic UI, and Clerk authentication.",
    tags: ["Next.js", "React", "TypeScript", "Clerk", "Full-stack"],
  },
] as const;

export const WRITING: readonly WritingEntry[] = [
  {
    id: "002",
    title: "Using a Computer to Prove a + b = b + a",
    publishedAt: "2026-07-18",
    description: "Proving commutativity of addition over the natural numbers using the Lean 4 proof assistant.",
    url: "/writing/add-commutative",
  },
  {
    id: "001",
    title: "Building Zero Trust with eBPF",
    publishedAt: "2026-03-28",
    description: "My journey moving from iptables to eBPF for dynamic containerized workloads.",
    url: "/writing/building-zero-trust-with-ebpf",
  },
];

// Experience data
export const EXPERIENCE: readonly Experience[] = [
  {
    position: "Network Technician",
    company: "AriesTECH",
    dates: "January 2024 - April 2025",
    description: [
      "Maintained 99% uptime for Cisco infrastructure through advanced routing and monitoring, while implementing Python automation to reduce manual configuration time by 30%.",
    ],
    link: "#",
  },
] as const;
