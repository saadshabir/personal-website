export const SITE_CONFIG = {
  name: "Muhammad Saad Shabir",
  url: "https://saadshabir.vercel.app",
  email: "saad.shabir@hotmail.com",
  github: "https://github.com/saadshabir",
  linkedin: "https://www.linkedin.com/in/saadshabir/",
  resume: "/MuhammadSaad-Shabir_Resume.pdf",
  location: "Ottawa, Canada",
  description:
    "Focusing on network architecture, protocol analysis, and system programming.",
  jobTitle: "Network Technician & Software Developer",
  school: "Carleton University",
  schoolUrl: "https://carleton.ca/",
  status: "Currently exploring new experiences.",
} as const;

type ProjectCategory = "active" | "past" | "earlier-experiments";

type Project = {
  id: string;
  name: string;
  displayTitle?: string;
  url: string;
  description: string;
  tags: readonly string[];
  category: ProjectCategory;
};

export const PROJECT_CATEGORIES: readonly {
  id: ProjectCategory;
  title: string;
}[] = [
  { id: "active", title: "Active Projects" },
  { id: "past", title: "Past Projects" },
  { id: "earlier-experiments", title: "Earlier Experiments" },
];

type WritingEntry = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
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
    displayTitle: "ZTAP: Controls the network",
    category: "active",
    url: "https://github.com/saadshabir/ZTAP",
    description:
      "Linux Kubernetes node agent that enforces NetworkPolicy with per-container eBPF programs and streams flow decisions.",
    tags: ["ebpf", "kubernetes", "network-policy"],
  },
  {
    id: "002",
    name: "NetScope",
    displayTitle: "NetScope: Observes the network",
    category: "active",
    url: "https://github.com/saadshabir/NetScope",
    description:
      "Rust packet and flow analyzer with offline PCAP analysis, live capture, TCP/UDP flow tracking, anomaly heuristics, and a local dashboard.",
    tags: ["rust", "flow-analysis", "packet-capture"],
  },
  {
    id: "007",
    name: "RouteProof",
    displayTitle: "RouteProof: Predicts and verifies the network",
    category: "active",
    url: "https://github.com/saadshabir/RouteProof",
    description:
      "C++20 routing tool in progress; current phases validate scenarios and model an interface-aware topology. SPF/ECMP analysis, failure replay, reachability checks, FRRouting comparisons, and benchmarks are planned.",
    tags: ["cpp20", "ospf", "routing"],
  },
  {
    id: "003",
    name: "pci-segment",
    category: "past",
    url: "https://github.com/saadshabir/pci-segment",
    description:
      "Go CLI for PCI-DSS network segmentation with YAML policies, Linux eBPF enforcement, AWS/Azure security group syncing, and HTML/JSON audit reports.",
    tags: ["pci-dss", "network-segmentation", "ebpf"],
  },
  {
    id: "004",
    name: "cloud-netmapper",
    category: "past",
    url: "https://github.com/saadshabir/cloud-netmapper",
    description:
      "Go CLI that maps AWS networks, generates topology diagrams, flags security risks, and tracks infrastructure drift.",
    tags: ["aws", "network-topology", "drift-detection"],
  },
  {
    id: "005",
    name: "net-guardian",
    category: "earlier-experiments",
    url: "https://github.com/saadshabir/net-guardian",
    description:
      "Python network auditor with ARP device discovery, Nmap port and service scanning, risk checks, anomaly detection, scan history, and JSON/CSV/HTML reports.",
    tags: ["python", "nmap", "anomaly-detection"],
  },
  {
    id: "008",
    name: "CloudChat",
    category: "earlier-experiments",
    url: "https://github.com/saadshabir/CloudChat",
    description:
      "Microblogging platform built with Next.js, TypeScript, and PostgreSQL, with Clerk authentication, live feed updates, likes, replies, and reposts.",
    tags: ["nextjs", "postgresql", "microblogging"],
  },
  {
    id: "006",
    name: "personal-ai-cli",
    category: "earlier-experiments",
    url: "https://github.com/saadshabir/personal-ai-cli",
    description:
      "Self-hosted AI chatbot for the terminal that answers questions about your documents using Ollama, LangChain, and ChromaDB, with source citations.",
    tags: ["local-llm", "rag", "ollama"],
  },
] as const;

export const WRITING: readonly WritingEntry[] = [
  {
    id: "002",
    title: "Using a Computer to Prove a + b = b + a",
    description:
      "A step-by-step proof that natural-number addition is commutative, using Peano axioms, induction, and the Lean 4 proof assistant.",
    publishedAt: "2026-07-18",
    url: "/writing/add-commutative",
  },
  {
    id: "001",
    title: "Building Zero Trust with eBPF",
    description:
      "A practical look at moving from iptables to eBPF for identity-based network policy, safe policy updates, and observable zero-trust enforcement.",
    publishedAt: "2026-03-28",
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
      "Configured and supported Cisco network infrastructure, maintained 99.9% uptime, and used Python to cut setup time by 30%.",
    ],
    link: "#",
  },
] as const;
