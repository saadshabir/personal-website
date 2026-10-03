import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import ArticleStructuredData from "@/components/ArticleStructuredData";
import { getArticle, getArticleMetadata } from "@/lib/seo";
import RelatedProject from "@/components/RelatedProject";

export const metadata = getArticleMetadata("building-zero-trust-with-ebpf");

export default function BlogPostPage() {
  return (
    <section className="flex flex-col w-full max-w-[68ch]">
      <ArticleStructuredData slug="building-zero-trust-with-ebpf" />
      <div className="mb-10 flex flex-row items-center justify-between w-full">
        <div className="flex flex-row items-center gap-2">
          <Link
            href="/"
            className="font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/writing"
            className="font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            Writing
          </Link>
        </div>
        <ThemeToggle />
      </div>

      <article className="flex flex-col w-full text-lg text-foreground/90 leading-relaxed">
        <header className="mb-2">
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground mb-1">
            Building Zero Trust with eBPF
          </h1>
          <time dateTime="2026-03-28" className="font-medium text-muted-foreground">2026-03-28</time>
          <div className="mt-3">
            <RelatedProject
              projectId={getArticle("building-zero-trust-with-ebpf").projectId}
              showSource
            />
          </div>
        </header>

        <div className="flex flex-col gap-6 mt-6">
          <aside className="border-l-2 border-[var(--surface-border)] pl-4 text-base text-muted-foreground">
            this post describes an earlier version of ZTAP. the commands, policy
            model, and backends have since changed. i wrote about the current agent
            in{" "}
            <Link href="/writing/ztap-with-a-smaller-surface" className="article-link">
              ZTAP, with a smaller surface
            </Link>
            .
          </aside>
          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            the iptables honeymoon (and the crash)
          </h2>

          <p>
            i started working with linux firewalls recently. it was a modest server setup
            for a personal project: a database here, a web app there, and a simple rule
            in my head: <em>the database should only talk to the web app.</em>
          </p>

          <p>
            “iptables is easy,” a tutorial said. “just follow these steps:”
          </p>

          <ol className="list-decimal pl-6 space-y-2">
            <li>create a custom chain</li>
            <li>append rules for incoming traffic</li>
            <li>lock down the default policy to drop</li>
          </ol>

          <p>and it worked on the first try.</p>

          <p>
            that success was intoxicating. i wrote little bash scripts to ship the same
            rules to all my boxes. for a while, it felt like i’d finally found the right
            level of control: explicit rules, a clear deny-by-default posture, and enough
            flexibility to unblock myself when something broke.
          </p>

          <p>
            but as soon as the environment got more dynamic, iptables stopped feeling
            like a foundation and started feeling like a trap.
          </p>

          <p>
            first came scale. once you’re dealing with containerized workloads, “a handful
            of IPs” becomes “a rotating cast of thousands.” the naive version of this story
            is just performance: huge chains, linear traversal, and every packet paying the
            price.
          </p>

          <p>the real problem, though, was correctness under change.</p>

          <p>
            i still remember a friday night where an automated policy sync triggered an{" "}
            <code className="inline-code">
              iptables-restore
            </code>
            . mid-apply, a pod vanished. the restore failed partway through. nothing was{" "}
            <em>totally</em> down; it was just down enough to be confusing: legitimate database
            connections started dropping, and the firewall was left in a fractured state.
          </p>

          <p>that night crystallized what i actually wanted:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>high performance</strong> under lots of rules
            </li>
            <li>
              <strong>safe updates</strong> that don’t leave the node half-configured
            </li>
            <li>
              <strong>a policy model that matches dynamic systems</strong> instead of
              fighting them
            </li>
          </ul>

          <p>that’s when i started taking eBPF seriously.</p>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            compiling without compilers
          </h2>

          <p>i was honestly scared of eBPF at first.</p>

          <p>
            not because the idea was hard to love (running a programmable filter inside the
            kernel is obviously powerful), but because the operational story seemed awful.
            the demos i saw online were impressive, but they usually implied: compile C on
            the target machine, ship toolchains around, install kernel headers, and hope
            nothing subtly mismatches.
          </p>

          <p>
            i didn’t want to install{" "}
            <code className="inline-code">
              clang
            </code>
            ,{" "}
            <code className="inline-code">
              llvm
            </code>
            , and kernel headers on pristine production nodes just to run a firewall.
          </p>

          <p>
            zero trust isn’t only about default deny; it’s also about minimizing what you{" "}
            <em>have to trust</em> on the box. “a compiler toolchain on every node” is a
            bigger surface area than i was willing to accept.
          </p>

          <p>
            then i found{" "}
            <code className="inline-code">
              bpf2go
            </code>
            {" "}(from{" "}
            <code className="inline-code">
              github.com/cilium/ebpf
            </code>
            ), and the whole thing clicked.
          </p>

          <p>
            instead of compiling at runtime, you compile at <strong>build time</strong>,
            embed the resulting eBPF object into the Go binary, and ship a single artifact.
          </p>

          <pre className="code-block">
            <code>
              {
                "//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -no-strip -target bpfel,bpfeb -cc clang bpf ../../bpf/filter.c -- -I../../bpf"
              }
            </code>
          </pre>

          <p>that one line isn’t just convenience; it’s a deployment model.</p>

          <p>at runtime, the node does something like this:</p>

          <pre className="code-block">
            <code>
              {`// userspace (simplified): load embedded programs + attach to cgroup
var objs bpfObjects
if err := loadBpfObjects(&objs, nil); err != nil {
    return fmt.Errorf("load bpf objects: %w", err)
}
defer objs.Close()

egressLink, err := link.AttachCgroup(link.CgroupOptions{
        Path:    "/sys/fs/cgroup",
    Attach:  ebpf.AttachCGroupInetEgress,
    Program: objs.FilterEgress,
})
if err != nil {
    return fmt.Errorf("attach egress: %w", err)
}
defer egressLink.Close()

ingressLink, err := link.AttachCgroup(link.CgroupOptions{
        Path:    "/sys/fs/cgroup",
    Attach:  ebpf.AttachCGroupInetIngress,
    Program: objs.FilterIngress,
})
if err != nil {
    return fmt.Errorf("attach ingress: %w", err)
}
defer ingressLink.Close()`}
            </code>
          </pre>

          <p>
            in ZTAP, it means the “compiler problem” disappears from runtime. if the host
            meets the kernel requirements (linux kernel 5.7+ with cgroup v2 mounted at
            /sys/fs/cgroup),
            ZTAP can load the embedded program and enforce policies without dragging a build
            toolchain onto the node.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            atomic updates, one hook at a time
          </h2>

          <p>what really sold me on eBPF wasn’t just the packaging.</p>

          <p>
            it was the fact that eBPF lets you treat kernel enforcement like a real system
            with a real state transition, instead of a pile of text rules that you repeatedly
            tear down and rebuild.
          </p>

          <p>
            ZTAP’s policy model is intentionally strict: <em>default deny.</em> policies
            describe exactly what is allowed: protocols, ports, and destinations/sources
            (usually expressed as IP blocks once targets are resolved).
          </p>

          <p>the key difference is how updates work.</p>

          <p>
            safe updates depend on knowing the transactional boundary. an
            iptables-restore commit applies changes to one table; coordinating changes
            across tables or with external state still needs recovery handling.
            eBPF has a boundary too: replacing one attached program.
          </p>

          <p>
            with eBPF, the rollout can prepare the next policy before changing enforcement:
          </p>

          <ol className="list-decimal pl-6 space-y-2">
            <li>load a <strong>new</strong> eBPF program and its maps</li>
            <li>populate the policy maps with the <strong>next</strong> policy state</li>
            <li>replace each cgroup attachment with its new program</li>
          </ol>

          <p>
            in this example, each attachment is updated via a{" "}
            <code className="inline-code">
              bpf_link
            </code>
            {" "}update (through{" "}
            <code className="inline-code">
              github.com/cilium/ebpf/link
            </code>
            ). each link update is atomic, but the egress and ingress updates happen
            separately. the pair is not a single transaction:
          </p>

          <pre className="code-block">
            <code>
              {`// simplified from ZTAP's reload path
func (e *eBPFEnforcer) UpdateFrom(old *eBPFEnforcer) error {
    if old.egressLink != nil {
        if err := old.egressLink.Update(e.objs.FilterEgress); err != nil {
            return err
        }
        e.egressLink = old.egressLink
        old.egressLink = nil
    }

    if old.ingressLink != nil {
        if err := old.ingressLink.Update(e.objs.FilterIngress); err != nil {
            // Egress may already use the new policy. The caller must recover.
            return err
        }
        e.ingressLink = old.ingressLink
        old.ingressLink = nil
    }

    return nil
}`}
            </code>
          </pre>

          <p>
            this example leaves recovery to the caller. if egress succeeds and ingress
            fails, egress uses the new policy while ingress still uses the old one.
            the caller also needs to retain both enforcers until it resolves ownership
            of the links.
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>the old programs keep enforcing while the next policy is prepared</li>
            <li>each hook changes atomically, with a mixed-policy interval between updates</li>
            <li>
              a failed second update needs an explicit recovery path: roll the first
              hook back or complete the remaining update, and handle recovery failures
              with a defined fail-closed policy
            </li>
          </ul>

          <p>
            and because ZTAP uses typed data structures in the kernel, policy enforcement
            becomes a map lookup instead of rule traversal.
          </p>

          <p>
            in the current ZTAP implementation, the kernel-side key is designed for fast
            lookups and supports CIDR matching via LPM tries. conceptually, the match space
            looks like:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>direction: egress vs ingress</li>
            <li>protocol: tcp/udp/icmp</li>
            <li>port: l4 port (or 0 for icmp)</li>
            <li>ip prefix: ipv4/ipv6 destination (egress) or source (ingress)</li>
            <li>cgroup id: which cgroup the packet belongs to (and in global mode, a “cgroup_id=0” fallback)</li>
          </ul>

          <p>here’s a simplified version of ZTAP’s LPM-trie key and lookup shape:</p>

          <pre className="code-block">
            <code>
              {`/* kernel-side (simplified): policy_map lookup key (IPv4) */
#define DIRECTION_EGRESS 0
#define DIRECTION_INGRESS 1

// fixed selector bits: meta(32) + cgroup_id(64)
#define LPM_FIXED_BITS 96
#define LPM_LOOKUP_PREFIXLEN_V4 (LPM_FIXED_BITS + 32)

// meta packs: (direction << 24) | (protocol << 16) | port
#define PACK_META(direction, protocol, port) (((__u32)(direction) << 24) | ((__u32)(protocol) << 16) | (__u32)(port))

struct policy_key {
    __u32 prefixlen;
    __u32 meta;
    __u64 cgroup_id; // current cgroup (or 0 for global fallback)
    __u8  ip[4];     // host-order bytes; LPM trie does CIDR matching here
    __u8  _pad[4];
};

struct policy_value { __u8 action; __u8 _pad[3]; }; // 0=block, 1=allow
// policy_map is an LPM trie map: policy_key -> policy_value

// after parsing a packet, ZTAP builds this key and does a lookup:
// - egress uses destination ip/port
// - ingress uses source ip + destination port
__u8  proto = /* parsed protocol */;
__u16 port  = /* parsed port (0 for ICMP) */;
__u32 ip_be = /* parsed IPv4 (network byte order) */;

struct policy_key k = {
    .prefixlen = LPM_LOOKUP_PREFIXLEN_V4,
    .meta      = PACK_META(DIRECTION_EGRESS, proto, port),
    .cgroup_id = bpf_get_current_cgroup_id(),
};

__u32 ip_host = bpf_ntohl(ip_be);
__builtin_memcpy(k.ip, &ip_host, sizeof(k.ip));

struct policy_value *v = bpf_map_lookup_elem(&policy_map, &k);
// in global mode, ZTAP retries with k.cgroup_id = 0 on miss (global fallback)`}
            </code>
          </pre>

          <p>
            that last detail (cgroup identity) ends up being the bridge between “a network
            policy” and “the exact workload that policy applies to.”
          </p>

          <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
            default deny, and the subtlety of ‘selected only’
          </h3>

          <p>
            one subtle thing i didn’t appreciate early on: <em>default deny</em> is simple
            in a static world, but in orchestrated environments you also need to decide{" "}
            <strong>who the policy even applies to</strong>.
          </p>

          <p>
            ZTAP’s eBPF program supports a “selected only” mode: if enabled, only traffic
            from cgroups explicitly selected by policies is evaluated for default-deny
            behavior; everything else is allowed.
          </p>

          <p>in code, it’s basically:</p>

          <pre className="code-block">
            <code>
              {`// selected-only is driven by a small config map + a set of enforced cgroups
struct enforcement_config { __u8 selected_only; __u8 _pad[3]; };

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct enforcement_config);
} enforcement_config_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 200000);
    __type(key, __u64); // cgroup id
    __type(value, __u8);
} enforced_cgroups SEC(".maps");

__u32 cfg_k = 0;
struct enforcement_config *cfg = bpf_map_lookup_elem(&enforcement_config_map, &cfg_k);
__u8 selected_only = cfg ? cfg->selected_only : 0;

__u64 cgid = bpf_get_current_cgroup_id();
if (selected_only) {
    __u8 *present = bpf_map_lookup_elem(&enforced_cgroups, &cgid);
    if (!present) return 1; // not selected => allow
}

// otherwise: selected => enforce allowlist + default deny on miss`}
            </code>
          </pre>

          <p>that sounds like a footnote, but it’s the difference between:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>“this node is now a default-deny firewall for every process”</li>
            <li>“this policy applies to the workloads i selected, and nothing else”</li>
          </ul>

          <p>
            that distinction matters when you’re trying to make enforcement safe to roll
            out.
          </p>

          <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
            flows as a first-class output
          </h3>

          <p>
            another thing i love about this design is that enforcement can emit structured
            flow events.
          </p>

          <p>
            the eBPF program writes{" "}
            <code className="inline-code">
              flow_event
            </code>
            {" "}records into a ring buffer map, and ZTAP can pin that map in bpffs (by
            default at{" "}
            <code className="inline-code">
              /sys/fs/bpf/ztap/flow_events
            </code>
            ) so user-space tools can stream what’s happening.
          </p>

          <p>kernel-side, emitting an event looks like:</p>

          <pre className="code-block">
            <code>
              {`struct flow_event {
    __u64 timestamp_ns;
    __u32 src_ip[4];
    __u32 dest_ip[4];
    __u16 src_port;
    __u16 dest_port;
    __u8  protocol;   // TCP=6, UDP=17, ICMP=1
    __u8  direction;  // 0=egress, 1=ingress
    __u8  action;     // 0=blocked, 1=allowed
    __u8  family;     // 4=IPv4, 6=IPv6
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024); // 256KB
} flow_events SEC(".maps");

static __always_inline void emit_flow_event(/* fields omitted */)
{
    struct flow_event *e = bpf_ringbuf_reserve(&flow_events, sizeof(*e), 0);
    if (!e) return;

    e->timestamp_ns = bpf_ktime_get_ns();
    // fill src/dest ip + ports + protocol + direction + action + family
    bpf_ringbuf_submit(e, 0);
}`}
            </code>
          </pre>

          <p>and user-space can tail the ring buffer with:</p>

          <pre className="code-block">
            <code>
              {`// linux: open the pinned ringbuf map and stream events ('ztap flows --follow')
m, err := ebpf.LoadPinnedMap("/sys/fs/bpf/ztap/flow_events", nil)
if err != nil {
    return fmt.Errorf("no pinned map (run 'ztap enforce' first): %w", err)
}
defer m.Close()

reader, err := flow.CreateFlowReader(m)
if err != nil {
    return fmt.Errorf("create linux flow reader: %w", err)
}

monitor := flow.NewMonitor(reader)
if err := monitor.Start(ctx); err != nil {
    return err
}
defer func() { _ = monitor.Stop() }()

for event := range monitor.Subscribe(ctx) {
    fmt.Printf("%s %s %s:%d -> %s:%d (%s)\n",
        event.Direction, event.Protocol,
        event.SourceIP, event.SourcePort,
        event.DestIP, event.DestPort,
        event.Action,
    )
}`}
            </code>
          </pre>

          <p>
            you don’t have to guess whether something was allowed or blocked; you can observe
            it.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            making it work everywhere
          </h2>

          <p>of course, not every environment is a pristine modern linux kernel.</p>

          <p>
            i wanted ZTAP to be a tool i could use locally just as easily as in production,
            and i didn’t want “no eBPF” to mean “no story.”
          </p>

          <p>so the design is intentionally layered:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>the <strong>policy model</strong> stays the same</li>
            <li>
              a <strong>compiler</strong> stage turns policies into enforceable primitives
              (often concrete IP blocks)
            </li>
            <li>
              an <strong>enforcer backend</strong> applies those primitives using the best
              mechanism available
            </li>
          </ul>

          <p>on linux, the eBPF enforcer is the crown jewel.</p>

          <p>
            but when eBPF isn’t available (kernel constraints, missing cgroup v2, or
            insufficient privileges), ZTAP keeps traditional fallbacks around. on linux
            that can mean an iptables-based path; on macOS, a pf-based path.
          </p>

          <p>
            these fallbacks keep the policy model portable and make it possible to
            iterate across different environments. each backend still needs its own
            update and recovery guarantees.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            closing thoughts
          </h2>

          <p>
            eBPF didn’t just solve my performance issues; it changed how i think about{" "}
            <em>updates</em>.
          </p>

          <p>
            preparing policy state before replacing a program makes updates easier to
            reason about. a safe rollout still has to account for separate hooks,
            partial failures, and recovery; per-link atomicity alone does not make the
            whole policy change transactional.
          </p>

          <p>
            if you’re building something in the zero-trust / microsegmentation space, that’s
            the bar i’d aim for:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>make policy changes safe</li>
            <li>make enforcement observable</li>
            <li>make the runtime surface area boring</li>
          </ul>

          <p>and then, once it’s boring, you can make it fast.</p>
        </div>
      </article>
    </section>
  );
}
