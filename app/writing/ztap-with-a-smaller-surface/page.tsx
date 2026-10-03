import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import ArticleStructuredData from "@/components/ArticleStructuredData";
import RelatedProject from "@/components/RelatedProject";
import { getArticle, getArticleMetadata } from "@/lib/seo";

const slug = "ztap-with-a-smaller-surface";
const article = getArticle(slug);
const repository = "https://github.com/saadshabir/ZTAP";

export const metadata = getArticleMetadata(slug);

export default function BlogPostPage() {
  return (
    <section className="flex w-full max-w-[68ch] flex-col">
      <ArticleStructuredData slug={slug} />
      <div className="mb-10 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
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

      <article className="flex w-full flex-col text-lg leading-relaxed text-foreground/90">
        <header className="mb-2">
          <h1 className="mb-1 text-2xl font-bold tracking-[-0.04em] text-foreground">
            {article.title}
          </h1>
          <time dateTime={article.publishedAt} className="font-medium text-muted-foreground">
            {article.publishedAt}
          </time>
          <div className="mt-3">
            <RelatedProject projectId={article.projectId} showSource />
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-6">
          <p>
            when i wrote{" "}
            <Link href="/writing/building-zero-trust-with-ebpf" className="article-link">
              Building Zero Trust with eBPF
            </Link>
            , i was mostly interested in getting network rules into the kernel and
            changing them safely. ZTAP had its own policy model, several enforcement
            backends, and a fairly broad idea of what it wanted to be.
          </p>

          <p>
            the project looks quite different now. it takes native Kubernetes
            NetworkPolicy objects, resolves the workloads they refer to, and enforces
            the supported rules on a Linux node. i want to walk through that version,
            because the interesting parts are now in the details: what a selector
            means, when a policy becomes active, and what happens to a connection
            when the policy changes.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            one agent, four commands
          </h2>

          <p>
            the current command surface is small enough to fit here:
          </p>

          <pre className="code-block">
            <code>{`ztap agent     # watch and enforce NetworkPolicy on one node
ztap validate  # check policy YAML offline
ztap flows     # stream live eBPF flow decisions
ztap version   # print build metadata`}</code>
          </pre>

          <p>
            the old custom CRD, separate operator, firewall fallbacks, and REST/gRPC
            interfaces are gone. deployment is one binary in a DaemonSet, with
            explicit flags. the eBPF objects are still compiled ahead of time and
            embedded in the binary, so the node doesn’t need a compiler to run it.
          </p>

          <p>
            this also gives local development a clear boundary. on macOS i can
            validate a policy and run portable tests. actually enforcing it needs
            Linux, cgroup v2, bpffs, and the supported containerd layout. passing a
            unit test on my laptop doesn’t tell me whether a kernel hook works.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            what a policy actually selects
          </h2>

          <p>
            let’s use the same small example as before: a web app should be able to
            reach a database on TCP port 5432. here is the web app’s egress policy:
          </p>

          <pre className="code-block">
            <code>{`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-to-db
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: db
      ports:
        - protocol: TCP
          port: 5432`}</code>
          </pre>

          <p>
            the first selector chooses the subjects: web Pods in the default
            namespace. the selector inside the rule chooses the peers: database
            Pods in that same namespace. those are two different jobs, even though
            both fields are called <code className="inline-code">podSelector</code>.
          </p>

          <p>
            if a peer also has a <code className="inline-code">namespaceSelector</code>,
            both selectors must match. putting them in separate peer entries instead
            means either entry can match. this is an easy YAML change to make, and a
            fairly large change in who gets access.
          </p>

          <p>
            the agent watches Pods, Namespaces, Nodes, and NetworkPolicies. it resolves
            peer selectors into IPv4 Pod addresses across the cluster, but only attaches
            programs to the selected containers on its own node. a Pod with multiple
            containers therefore has multiple cgroups to account for.
          </p>

          <pre className="code-block">
            <code>{`NetworkPolicy + cluster objects
              ↓
resolve peers and local container cgroups
              ↓
compile one node-local policy snapshot
              ↓
eBPF ingress / egress hooks on each selected cgroup`}</code>
          </pre>

          <p>
            ingress and egress isolation are independent, and accepted policies add
            their allows together. if the database is isolated for ingress, it needs
            an ingress rule permitting the web app too. the repository’s{" "}
            <a href={`${repository}/blob/main/examples/native/web-to-db.yaml`} className="article-link">
              complete example
            </a>{" "}
            includes both policies. it allows direct database Pod IP traffic; reaching
            a database Service ClusterIP needs an explicit IPv4{" "}
            <code className="inline-code">ipBlock</code> rule for that address and
            its Service port. ZTAP doesn’t expand Pod selectors into Service frontends.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            unsupported should mean unsupported
          </h2>

          <p>
            accepting the Kubernetes object format doesn’t mean implementing every
            NetworkPolicy feature. the current subset is IPv4, TCP/UDP, numeric ports,
            Pod and namespace selectors, and explicit IP blocks with exclusions.
            named ports, port ranges, IPv6 CIDRs, SCTP, and implicit allow-all rules
            are rejected.
          </p>

          <p>
            i can check that boundary before contacting a cluster:
          </p>

          <pre className="code-block">
            <code>{`make build
./bin/ztap validate --file examples/native/web-to-db.yaml`}</code>
          </pre>

          <p>
            validation checks the supported shape of the file. it can’t tell me
            whether a live selector matches anything, whether a container’s cgroup
            exists yet, or whether the expanded rules fit the node’s maps.
          </p>

          <p>
            in the running agent, an unsupported policy quarantines the local
            subjects and directions it selects while unrelated accepted policies
            continue to reconcile. quarantine still has the documented node/self
            traffic exceptions. the exact behavior is in the{" "}
            <a href={`${repository}/blob/main/docs/policies.md`} className="article-link">
              policy guide
            </a>
            ; these limits are part of what the agent supports.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            changing policy without changing programs
          </h2>

          <p>
            the earlier post discussed replacing ingress and egress programs one
            link at a time. the current engine prepares policy data in an inactive
            slot instead. there are two slots, and one active configuration containing
            the slot number and a policy epoch.
          </p>

          <ol className="list-decimal space-y-2 pl-6">
            <li>populate the inactive slot with the next complete snapshot</li>
            <li>attach the programs to any newly selected cgroups</li>
            <li>publish the new slot and epoch together</li>
            <li>wait for readers of the old slot before reclaiming it</li>
          </ol>

          <p>
            a packet registers as a reader and checks the active configuration again
            before touching the policy data. that check matters: a packet could have
            read the old slot just as userspace switched it. the reader guard lets the
            engine wait until that old data is no longer in use.
          </p>

          <p>
            if preparation or attachment fails before publication, the existing
            snapshot remains active for already classified cgroups. a new container
            that hasn’t been classified is a separate case; keeping the old snapshot
            doesn’t give that container an attachment. the{" "}
            <a href={`${repository}/blob/main/internal/enforcer/engine_core.go`} className="article-link">
              apply path
            </a>{" "}
            makes that distinction explicit.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            connections belong to a policy
          </h2>

          <p>
            allowing the web app to send a request is only half the example. the
            database also needs to send a reply. ZTAP keeps bounded connection state
            for traffic admitted by an explicit TCP/UDP rule, so replies don’t need
            a separate reverse rule.
          </p>

          <p>
            that state belongs to the policy epoch. changing the policy invalidates
            the old reply exemption; otherwise, a connection allowed yesterday could
            keep an exception after its rule was removed. state can also expire or
            be evicted, and traffic in an unisolated direction doesn’t create it.
          </p>

          <p>
            there’s a useful detail in the latest changes: an informer event doesn’t
            necessarily mean the policy changed. if the compiled map contents are
            identical, the engine keeps the epoch and existing reply state. an
            unrelated Kubernetes update shouldn’t make an unchanged connection lose
            its reply permission.
          </p>

          <p>
            the same round of fixes requires every new TCP SYN to pass an explicit
            rule, retires closed connection state, and excludes completed or failed
            Pods from selector resolution. the last one is particularly easy to miss:
            an old Pod object can retain an IP after another Pod has started using it.
            that address should no longer authorize traffic on the old Pod’s behalf.
            these changes are recorded in the{" "}
            <a href={`${repository}/blob/main/docs/releases/v0.1.1.md`} className="article-link">
              v0.1.1 notes
            </a>
            .
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            the hook has limits
          </h2>

          <p>
            there is another important constraint in that update. Linux packet sockets
            can bypass <code className="inline-code">cgroup_skb</code> filtering.
            having the expected policy in a map therefore isn’t enough if a workload
            can send through a path the hook doesn’t see.
          </p>

          <p>
            the install manifest now includes a cluster-wide admission guard. non-host-network
            containers must drop <code className="inline-code">NET_RAW</code> or all
            capabilities, disable privilege escalation, and avoid privileged mode or
            added <code className="inline-code">NET_RAW</code> /{" "}
            <code className="inline-code">SYS_ADMIN</code>. the minimum container
            settings look like this:
          </p>

          <pre className="code-block">
            <code>{`securityContext:
  privileged: false
  allowPrivilegeEscalation: false
  capabilities:
    drop: [NET_RAW]`}</code>
          </pre>

          <p>
            the agent also checks existing Pods before applying a snapshot and refuses
            enforcement readiness if unsafe workloads remain. admission only controls
            future requests, so existing Pods have to be recreated with the updated
            settings. host-network Pods remain outside the enforced subject set.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            measuring the pieces
          </h2>

          <p>
            the project now has published Linux evidence, which gives me a more useful
            way to talk about performance. the v0.1.0 reference fixture had 250 Pods,
            25 policies, and 2,500 compiled ordinary rules. here are a few results:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm leading-relaxed">
              <caption className="mb-3 text-left text-muted-foreground">
                v0.1.0 measurements on the documented Linux reference setup
              </caption>
              <thead className="border-b border-[var(--surface-border)] text-foreground">
                <tr>
                  <th scope="col" className="py-3 pr-4 font-semibold">measurement</th>
                  <th scope="col" className="py-3 font-semibold">result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-border)]">
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal">native reconciliation p95</th>
                  <td className="py-3 whitespace-nowrap">146.319 ms</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal">UDP p99 latency increase</th>
                  <td className="py-3 whitespace-nowrap">0.996 µs</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal">maximum sampled TCP throughput regression</th>
                  <td className="py-3 whitespace-nowrap">4.113%</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal">same-node DaemonSet rollout fail-open interval</th>
                  <td className="py-3 whitespace-nowrap">1,652 ms</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            reconciliation used a synchronized fake informer cache and real engine
            apply. it excludes API list latency and the fixed debounce. the packet
            results came from three loopback samples, with 10,000 UDP round trips
            per sample and 8 GiB transfers for each TCP comparison. the rollout was
            measured separately in kind.
          </p>

          <p>
            these are measurements of that release and those fixtures. they don’t
            establish performance for the latest security changes or another cluster.
            the{" "}
            <a href={`${repository}/blob/main/docs/performance.md`} className="article-link">
              performance guide
            </a>{" "}
            links the retained raw evidence, environment, and verification commands.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            when the agent goes away
          </h2>

          <p>
            that last row deserves some attention. the links are process-owned, so
            restarting or replacing the agent temporarily fails open. a newly started
            container can also transmit before the watcher observes its status and
            cgroup. publishing a policy snapshot atomically doesn’t close either gap.
          </p>

          <p>
            the agent exposes process health, enforcement readiness, and Prometheus
            metrics. i can also inspect decisions with{" "}
            <code className="inline-code">ztap flows --action blocked --direction egress</code>.
            flow events are rate-limited, and counters track both rate-limited and
            ring-full drops, so the stream isn’t a record of every packet. readiness
            is useful for diagnosis too, but it doesn’t prevent the fail-open interval
            during replacement. the{" "}
            <a href={`${repository}/blob/main/docs/deployment.md#upgrade`} className="article-link">
              deployment guide
            </a>{" "}
            keeps these boundaries alongside the upgrade procedure.
          </p>

          <h2 className="mt-4 mb-2 text-xl font-semibold text-foreground">
            where it stands
          </h2>

          <p>
            ZTAP is still experimental. the tested cluster profile is Kubernetes
            1.36.4 with containerd using systemd cgroups and no other NetworkPolicy
            enforcer. there are features it deliberately rejects and lifecycle gaps
            it documents rather than claiming to have solved.
          </p>

          <p>
            what i find most useful about the current version is being able to follow
            one policy all the way through: which Pods it selects, which cgroups get
            programs, which snapshot a packet sees, and which measurement supports
            the result. that gives me something concrete to improve next.
          </p>
        </div>
      </article>
    </section>
  );
}
