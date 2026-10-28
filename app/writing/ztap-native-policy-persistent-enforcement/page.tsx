import Link from "next/link";
import ArticleHeader from "@/components/ArticleHeader";
import ArticleStructuredData from "@/components/ArticleStructuredData";
import { getArticleMetadata } from "@/lib/seo";

const slug = "ztap-native-policy-persistent-enforcement";
const revision = "ce4ecfe1c0e9aeca176b39aa1a10af590f447008";
const repository = "https://github.com/saadshabir/ZTAP";
const source = `${repository}/blob/${revision}`;
const evidence = `${repository}/tree/${revision}/docs/evidence/restart-continuity-2026-10-09`;
const reconciliationEvidence = `${source}/docs/evidence/reconciliation-2026-10-10`;

export const metadata = getArticleMetadata(slug);

export default function NativePolicyPersistentEnforcementPage() {
  return (
    <section className="article-page">
      <ArticleStructuredData slug={slug} />
      <ArticleHeader slug={slug} />

      <article className="article-prose">
        <div className="article-body">
          <p>
            when i wrote{" "}
            <Link href="/writing/building-zero-trust-with-ebpf" className="article-link">
              Building Zero Trust with eBPF
            </Link>
            , ZTAP had its own policy model, several enforcement backends, and a
            fairly broad idea of what it wanted to be. the current project has a
            narrower job: take native Kubernetes NetworkPolicy objects, resolve
            the workloads they refer to, and enforce the supported rules on a
            Linux node.
          </p>
          <p>
            narrowing the scope made another problem harder to ignore. in the
            earlier implementation, the eBPF links belonged to the agent process.
            replacing it removed enforcement until the replacement applied policy
            again. the historical same-node rollout recorded a 1,652 ms fail-open
            interval. the current design keeps committed policy in the kernel and
            makes new containers wait for classification.
          </p>
          <p>
            this article brings the policy model, restart work, and recent
            reconciliation changes together. i checked the implementation against
            the latest published main on October 28, 2026, at{" "}
            <a href={`${repository}/commit/${revision}`} className="article-link">
              commit ce4ecfe
            </a>
            , merged on October 27. the measurements below keep their original
            dates and scope.
          </p>

          <h2>one binary, two DaemonSets</h2>
          <p>
            the custom CRD, separate operator, firewall fallbacks, and REST/gRPC
            interfaces are gone. one binary exposes six commands:
          </p>
          <pre className="code-block"><code>{`ztap agent     # reconcile and enforce policy on one Linux node
ztap node-init # authenticate node bootstrap identities and API endpoints
ztap cleanup   # intentionally remove owned enforcement under the node lock
ztap validate  # check native policy YAML offline
ztap flows     # stream live eBPF flow decisions
ztap version   # print build metadata`}</code></pre>
          <p>
            deployment uses an agent DaemonSet and a node-initializer DaemonSet
            built from the same scratch image. the initializer authenticates node
            and host-network identities and writes protected bootstrap metadata.
            the agent uses that metadata to grant the initializer’s exact verified
            cgroup access to the API endpoints it needs before classification.
          </p>
          <p>
            source builds now require Go 1.26.10 or a compatible newer toolchain
            with current security patches. eBPF objects are compiled ahead of
            time and embedded in the binary.
            enforcement needs Linux, cgroup v2, bpffs, and the supported containerd
            systemd-cgroup layout. on macOS i can validate policy files and run
            portable tests; those checks cannot establish what a kernel hook does.
            the tested cluster profile is Kubernetes 1.36.4 with no other
            NetworkPolicy enforcer.
          </p>

          <h2>follow one policy to its containers</h2>
          <p>
            suppose a web app should reach a database on TCP port 5432. this policy
            allows that traffic in the web app’s egress direction:
          </p>
          <pre className="code-block"><code>{`apiVersion: networking.k8s.io/v1
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
          port: 5432`}</code></pre>
          <p>
            the first selector chooses the subjects: web Pods in the default
            namespace. the selector inside the rule chooses the peers: database
            Pods in that same namespace. adding a namespace selector to that peer
            requires both selectors to match. separate peer entries mean either
            can match.
          </p>
          <p>
            the agent watches Pods, Namespaces, and NetworkPolicies across the
            cluster, plus its own Node object. it resolves peer selectors into
            IPv4 Pod addresses across the cluster, then attaches ingress and
            egress programs to selected container cgroups on its own node.
            multiple containers in a Pod mean multiple cgroups to account for.
          </p>
          <pre className="code-block"><code>{`NetworkPolicy + cluster objects
              ↓
resolve peers and local container identities
              ↓
compile a node-local policy and classification snapshot
              ↓
commit the snapshot for the eBPF ingress / egress hooks`}</code></pre>
          <p>
            isolation is independent in each direction, and accepted policies add
            their allows together. an ingress-isolated database also needs a rule
            admitting the web app. the{" "}
            <a href={`${source}/examples/native/web-to-db.yaml`} className="article-link">
              complete example
            </a>{" "}
            includes both policies. it permits direct Pod IP traffic; a database
            Service ClusterIP needs an explicit IPv4{" "}
            <code className="inline-code">ipBlock</code> and numeric Service port.
            ZTAP does not expand Pod selectors into Service frontends.
          </p>

          <h2>reject what the hooks cannot enforce</h2>
          <p>
            the supported subset is IPv4 TCP/UDP, numeric ports, Pod and namespace
            selectors, and explicit IP blocks with exclusions. named ports, port
            ranges, IPv6 CIDRs, SCTP, and peerless or portless allow-all rules are
            rejected. a rejected policy quarantines the local subjects and
            directions it selects while unrelated accepted policies continue to
            reconcile. selected IPv6 or dual-stack Pods are quarantined too.
          </p>
          <p>
            valid IPv4 TCP/UDP traffic to or from observed local Node IPs, and
            traffic whose source and destination both equal the subject’s own Pod
            IP, have explicit exceptions that also precede quarantine.
            host-network Pods are outside the subject set. the{" "}
            <a href={`${source}/docs/policies.md`} className="article-link">
              policy guide
            </a>{" "}
            records the exact boundary.
          </p>
          <pre className="code-block"><code>{`make build
./bin/ztap validate --file examples/native/web-to-db.yaml`}</code></pre>
          <p>
            offline validation checks the file’s supported shape. it cannot check
            live selector matches, cgroup identities, or whether an expanded
            snapshot fits the node’s maps.
          </p>
          <p>
            there is a deployment prerequisite too: Linux packet sockets can
            bypass <code className="inline-code">cgroup_skb</code> filtering.
            non-host-network containers must explicitly drop NET_RAW or all
            capabilities, disable privilege escalation, avoid privileged mode,
            and avoid adding NET_RAW or SYS_ADMIN. the manifest enforces this
            through a cluster-wide admission policy; the agent audits existing
            Pods and refuses enforcement readiness while unsafe ones remain.
            existing Pods need recreation, and static Pod manifests need the same
            restrictions. readiness alone cannot prevent their traffic.
          </p>

          <h2>publish policy as one snapshot</h2>
          <p>
            ordinary policy changes update map data. the engine has two slots and
            an active configuration containing a slot number and policy epoch.
            it fills the inactive slot, attaches any required new subject links,
            then publishes the slot and epoch together. readers register against
            a slot and recheck the active configuration before using its data.
            the engine waits for old readers before reclaiming that slot.
          </p>
          <p>
            preparation, capacity, or attachment failures retain the last
            committed snapshot. missing or inconsistent identity facts for a
            committed live container defer the whole candidate. the{" "}
            <a href={`${source}/internal/enforcer/engine_core.go`} className="article-link">
              apply path
            </a>{" "}
            also compares compiled map contents: an unchanged snapshot preserves
            its epoch, even when an informer reports unrelated updates.
          </p>
          <p>
            that epoch matters to connections. traffic admitted by an explicit
            TCP/UDP rule creates bounded reply state, so a database response does
            not need a separate reverse rule. changing policy invalidates that
            exemption. state can expire or be evicted, and every new TCP SYN must
            pass an explicit rule in its initiating direction. terminal Pods are
            excluded from resolution so their old addresses cannot authorize a
            new Pod reusing the IP.
          </p>

          <h2>do less work before publishing</h2>
          <p>
            an unchanged snapshot already avoided a kernel update, but getting
            to that decision still took work. the latest changes start earlier:
            informer updates compare the facts used by policy resolution,
            workload identity, and packet-socket checks. a Pod readiness change
            or resource-version bump alone no longer queues reconciliation.
            labels, IPs, container identities, running transitions, and relevant
            security settings still do. additions and deletions also trigger it.
            the{" "}
            <a href={`${source}/internal/cli/native_updates_linux.go`} className="article-link">
              update comparisons
            </a>{" "}
            make those choices explicit.
          </p>
          <p>
            snapshot construction now reads immutable informer objects directly
            and copies the facts the compiler needs, instead of cloning whole
            Pods, Namespaces, and the Node. workload identities are indexed by
            cgroup ID in a map owned by the candidate snapshot. lookup no longer
            scans the entire cgroup cache; filesystem identity checks remain,
            and conflicting identities reject publication. a relevant update
            still builds a complete candidate before engine apply.
          </p>
          <p>
            the binary also constructs only the core and networking Kubernetes
            clients it uses, with four explicit shared informers. client-go
            still handles authentication, transport, watch recovery, relists,
            and cache synchronization. Pod and Namespace watches stay
            cluster-wide for peer resolution; the Node watch is filtered to the
            local node. this removes broad production clientset and informer
            factory imports, although the module graph remains unchanged.
          </p>

          <h2>keep enforcement through an agent outage</h2>
          <p>
            an atomic policy update still needs enforcement to outlive the process
            publishing it. committed maps and both directional links now stay
            pinned in bpffs after normal exit, cancellation, SIGKILL, or a stale
            userspace heartbeat. the kernel keeps enforcing the last committed
            policy while userspace is unavailable.
          </p>
          <p>
            the replacement takes the node lock and validates boot identity,
            durable ABI, packet semantics, kernel object references, link targets,
            and workload ownership before adopting that state. compatible program
            changes replace pinned links in place. the tested images shared
            durable ABI 3 and packet semantics 2. incompatible state preserves
            surviving enforcement and stops unsafe mutation.
          </p>
          <p>
            existing links cannot classify a container born during the outage.
            an inherited parent guard blocks new descendants in both directions,
            subject to the documented node and self-traffic exceptions, until
            verified identity, classification, and required links are committed.
            even an unisolated container waits for classification; afterward its
            normal default-allow behavior resumes.
          </p>
          <p>
            the node initializer’s bootstrap access is deliberately narrow. it
            permits the verified initializer cgroup to reach authenticated API
            endpoints without granting a namespace-wide workload bypass. the{" "}
            <a href={`${source}/docs/deployment.md`} className="article-link">
              deployment guide
            </a>{" "}
            explains why both DaemonSets are needed.
          </p>

          <h2>what the restart tests observed</h2>
          <p>
            the October 9, 2026 evidence used arm64 Linux kernel{" "}
            <code className="inline-code">7.0.14-orbstack-00380-ga7e0a2dc9535</code>,
            containerd 2.3.4, Kubernetes 1.36.4, and Go 1.26.9. the capability-only
            kind deployment exercised a three-second pause, a kill with replacement
            delayed under the node lock, compatible image replacement, and rollback.
          </p>
          <div className="table-scroll">
            <table className="measurement-table">
              <caption>
                October 9, 2026: existing-workload restart observations
              </caption>
              <thead>
                <tr>
                  <th scope="col">observation</th>
                  <th scope="col">result</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">observation interval</th><td className="measurement-value">52.232 seconds</td></tr>
                <tr><th scope="row">prohibited TCP connections</th><td>0</td></tr>
                <tr><th scope="row">allowed ingress responses</th><td>5,423</td></tr>
                <tr><th scope="row">allowed egress responses</th><td>5,424</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            the allowed responses show that permitted traffic kept progressing
            while prohibited connections were blocked. new selected Pods were
            also created during pause, termination, kill, and API disconnection.
            each had at least 3.065 seconds of sustained observation before
            recovery, with zero premature TCP connections and zero prohibited
            connections in both directions. allowed controls worked after
            classification.
          </p>
          <p>
            privileged Linux tests separately covered interrupted directional and
            parent-guard updates, incomplete identities, capacity and partial-pin
            failures, duplicate locks, and cleanup. the{" "}
            <a href={evidence} className="article-link">retained evidence bundle</a>{" "}
            binds results to full Pod/container identities, actual cgroup IDs,
            directional kernel counters, and source image identities. its verifier
            reads the recorded data; it does not rerun enforcement:
          </p>
          <pre className="code-block"><code>{`go run ./tools/phase5verify \\
  -restart-dir=docs/evidence/restart-continuity-2026-10-09`}</code></pre>

          <h2>what the reconciliation changes measured</h2>
          <p>
            the latest merge includes an{" "}
            <a href={`${reconciliationEvidence}/README.md`} className="article-link">
              October 10 local comparison
            </a>{" "}
            against commit <code className="inline-code">3657d9f</code>. its
            candidate is captured as a runtime patch and added-source archive.
            both sides used Go 1.26.9 on the same arm64 Linux kernel as the
            restart tests, with GOMAXPROCS=2 and CPU affinity 0,1. builds and
            benchmarks ran sequentially. these measurements predate the current
            Go 1.26.10 build requirement.
          </p>
          <div className="table-scroll">
            <table className="measurement-table">
              <caption>October 10, 2026: local before-and-after comparison</caption>
              <thead>
                <tr>
                  <th scope="col">measurement</th>
                  <th scope="col">before</th>
                  <th scope="col">after</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">stripped Linux binary</th><td className="measurement-value">54.63 MiB</td><td className="measurement-value">38.31 MiB</td></tr>
                <tr><th scope="row">cold build median</th><td className="measurement-value">39.81 s</td><td className="measurement-value">24.69 s</td></tr>
                <tr><th scope="row">binary dependency packages</th><td>776</td><td>553</td></tr>
                <tr><th scope="row">unchanged snapshot / compile median</th><td className="measurement-value">1.915 ms</td><td className="measurement-value">1.624 ms</td></tr>
                <tr><th scope="row">allocated bytes per unchanged snapshot</th><td className="measurement-value">1,874,406 B</td><td className="measurement-value">1,203,984 B</td></tr>
                <tr><th scope="row">allocations per unchanged snapshot</th><td>10,913</td><td>7,908</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            the stripped binary was 29.9% smaller, and the median of three cold
            builds fell by 38.0%. unchanged snapshots used 35.8% fewer allocated
            bytes. the snapshot results are medians of five 500-ms benchmark
            runs with 250 local Pods, 25 policies, and 2,500 compiled rules.
            they include cache reads, filesystem identity checks, and compilation
            with a no-op engine; kernel map writes, API delivery, and debounce
            are excluded. changing policies, Pod IP churn, and selector-heavy
            fixtures are recorded in the same bundle.
          </p>
          <p>
            the real-engine comparison was more modest: reconciliation p95 went
            from 89.714 to 87.579 ms, while event-to-active-epoch p95 increased
            from 104.506 to 105.762 ms. each reported p95 is the maximum of just
            three samples using a fake Kubernetes client and real containerd
            cgroups. that does not establish a material kernel or event-latency
            improvement. maximum quiet helper RSS fell from 55.508 to 52.805 MiB;
            this excludes kernel maps and is not the deployed agent’s cgroup
            memory. the{" "}
            <a href={`${reconciliationEvidence}/summary.json`} className="article-link">
              raw summary
            </a>{" "}
            retains the samples and provenance.
          </p>
          <p>
            this change leaves the compiler, packet encoding, map-write path,
            and generated eBPF bindings alone. it also extracts shared CI scripts,
            removes duplicate checks, and splits the evidence verifier into
            focused files. the retained validation covers portable and Linux
            tests, privileged integration, and kind lifecycle checks. hosted CI
            duration was not measured, and this local comparison does not
            replace the full hosted performance evidence.
          </p>

          <h2>keep historical performance in context</h2>
          <p>
            the September 24 reference run used commit{" "}
            <code className="inline-code">1b196c0</code> and a fixture of 250 Pods,
            25 policies, and 2,500 compiled rules. native reconciliation p95 was
            146.319 ms with a synchronized fake informer cache and real engine
            apply, excluding API list latency and fixed debounce. three loopback
            samples measured a 0.996 µs UDP p99 increase and a maximum sampled
            TCP throughput regression of 4.113%.
          </p>
          <p>
            the 1,652 ms rollout gap belongs to that older process-owned design.
            neither the restart bundle nor the local reconciliation comparison
            reran the full hosted performance fixture, so the September latency,
            throughput, and resource numbers remain historical.
            the{" "}
            <a href={`${source}/docs/performance.md`} className="article-link">
              performance guide
            </a>{" "}
            keeps the fixtures, raw evidence, and verification commands together.
            live flow events are rate-limited too: counters distinguish suppressed
            events and ring-full drops, so the flow stream is a diagnostic sample.
          </p>

          <h2>where the contract stops</h2>
          <p>
            persistence covers the last committed snapshot within one kernel boot.
            policy, label, and peer changes the agent has not observed cannot take
            effect during an outage. the recorded tests are finite observations
            of specific images and failure schedules.
          </p>
          <p>
            fresh installation requires gating workload traffic until the guard
            and classification are ready. migration from the process-owned version
            requires drained workloads or a traffic gate because the old process
            still detaches on exit. reboot destroys the pinned objects and needs
            a separate startup gate and reboot test; this release does not provide
            that continuity.
          </p>
          <p>
            deleting the DaemonSets intentionally leaves committed enforcement in
            place. removal uses the locked cleanup command described in the{" "}
            <a href={`${source}/docs/deployment.md#removal-and-rollback`} className="article-link">
              removal procedure
            </a>
            . ZTAP remains experimental, with its supported policy subset, Linux
            prerequisites, and lifecycle limits part of the design.
          </p>
        </div>
      </article>
    </section>
  );
}
