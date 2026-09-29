import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BlogPostPage() {
  return (
    <section className="flex flex-col w-full max-w-[68ch]">
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
            using a computer to prove a + b = b + a
          </h1>
          <time className="font-medium text-muted-foreground">2026-07-18</time>
        </header>

        <div className="flex flex-col gap-6 mt-6">
          <p>
            In this post I&apos;ll prove the seemingly trivial fact that addition over the
            natural numbers is commutative. That is, a + b = b + a, for all a, b in N.
          </p>

          <p>
            The proof will be by the Peano axioms, and its structure is actually very
            simple. To make things more interesting, I&apos;ll be doing the proof using the
            proof assistant{" "}
            <a
              href="https://lean-lang.org/"
              className="article-link"
            >
              Lean 4
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            Peano axioms
          </h2>

          <p>
            The first step is to formalize the{" "}
            <a
              href="https://en.wikipedia.org/wiki/Peano_axioms"
              className="article-link"
            >
              Peano axioms
            </a>{" "}
            for addition in Lean. Using these axioms, we recursively define the natural
            numbers (including 0):
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>0 is a natural number,</li>
            <li>
              define the successor function S, then for every natural number n, we have
              S(n) is a natural number.
            </li>
          </ul>

          <p>
            Informally, S(n) = n + 1 for all n in N. In Lean, this looks like:
          </p>

          <pre className="code-block">
            <code>
              {`inductive nat where
  | zero : nat
  | succ : nat -> nat`}
            </code>
          </pre>

          <p>Using this definition of the natural numbers, we can define addition as:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>a + 0 = a,</li>
            <li>a + S(b) = S(a + b).</li>
          </ul>

          <pre className="code-block">
            <code>
              {`def add : nat -> nat -> nat
  | a, zero => a
  | a, succ b => succ (add a b)

-- use + symbol
instance : Add nat where
  add := nat.add`}
            </code>
          </pre>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            first two results
          </h2>

          <p>
            With this, we have our first two results. First,{" "}
            <code className="inline-code">
              add_zero
            </code>
            , a proof of n + 0 = n for all n in N. This follows by the first part in the
            definition of addition. We can use the{" "}
            <code className="inline-code">
              rfl
            </code>{" "}
            tactic, which stands for reflexivity, to directly prove by definition.
          </p>

          <pre className="code-block">
            <code>
              {`theorem add_zero (n : nat) : n + zero = n := by
  rfl`}
            </code>
          </pre>

          <p>
            Next, we have{" "}
            <code className="inline-code">
              add_succ
            </code>
            , a proof of a + S(b) = S(a + b) for all a, b in N. Similar to above, this
            follows by the second part of our definition of addition. Once again we use the{" "}
            <code className="inline-code">
              rfl
            </code>{" "}
            tactic.
          </p>

          <pre className="code-block">
            <code>
              {`theorem add_succ (a b : nat) : a + succ b = succ (a + b) := by
  rfl`}
            </code>
          </pre>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            towards commutativity
          </h2>

          <p>
            A good step towards commutativity would be to prove commutativity of addition
            with zero first. That is,{" "}
            <code className="inline-code">
              zero_add
            </code>
            , a proof of 0 + n = n for all n in N. Note that this is not directly given by
            our definitions, so we have to do a bit more work for it. We will use induction
            on n, so let&apos;s tell Lean about this plan. Note that the{" "}
            <code className="inline-code">
              sorry
            </code>{" "}
            tactic magically proves anything, but does not count as a formal proof.
            It&apos;s simply there to prevent Lean from complaining about syntax errors.
          </p>

          <pre className="code-block">
            <code>
              {`theorem zero_add (n : nat) : zero + n = n := by
  induction n with
  | zero => sorry
  | succ n ih => sorry`}
            </code>
          </pre>

          <p>
            We&apos;ve split the proof into two cases: the base case and the induction
            step. The base case is when n = 0, indicated by the{" "}
            <code className="inline-code">
              | zero
            </code>{" "}
            pattern match. Here our goal is to prove zero + zero = zero. Let&apos;s rewrite
            the left hand side to just 0 using{" "}
            <code className="inline-code">
              add_zero
            </code>
            :
          </p>

          <pre className="code-block">
            <code>
              {`theorem zero_add (n : nat) : zero + n = n := by
  induction n with
  | zero => rw [add_zero]
  | succ n ih => sorry`}
            </code>
          </pre>

          <p>
            At this point, we&apos;ve reduced the goal to zero = zero, which Lean is smart
            enough to figure out is true. Let&apos;s move on to the induction step. Here,
            we pattern match{" "}
            <code className="inline-code">
              | succ n ih
            </code>
            , where{" "}
            <code className="inline-code">
              ih
            </code>{" "}
            is the induction hypothesis, or a proof of zero + n = n. Our goal is to prove
            zero + succ n = succ n. We can rewrite the left hand side with{" "}
            <code className="inline-code">
              add_succ
            </code>{" "}
            to get{" "}
            <code className="inline-code">
              succ (zero + n)
            </code>
            , then rewrite with{" "}
            <code className="inline-code">
              ih
            </code>{" "}
            to get{" "}
            <code className="inline-code">
              succ n
            </code>
            , equating the right hand side and thus finishing the proof.
          </p>

          <pre className="code-block">
            <code>
              {`theorem zero_add (n : nat) : zero + n = n := by
  induction n with
  | zero => rw [add_zero]
  | succ n ih => rw [add_succ, ih]`}
            </code>
          </pre>

          <p>
            In a similar way, we prove{" "}
            <code className="inline-code">
              succ_add
            </code>
            , that S(a) + b = S(a + b) for all a, b in N. For this, we use induction on b.
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              The base case is{" "}
              <code className="inline-code">
                succ a + 0 = succ (a + 0)
              </code>
              . First rewrite with{" "}
              <code className="inline-code">
                add_zero
              </code>{" "}
              to{" "}
              <code className="inline-code">
                succ a = succ (a + 0)
              </code>
              , then rewrite again with{" "}
              <code className="inline-code">
                add_zero
              </code>{" "}
              to{" "}
              <code className="inline-code">
                succ a = succ a
              </code>
              .
            </li>
            <li>
              For the induction step we have{" "}
              <code className="inline-code">
                ih: succ a + b = succ (a + b)
              </code>{" "}
              and we wish to prove{" "}
              <code className="inline-code">
                succ a + succ b = succ (a + succ b)
              </code>
              . First rewrite with{" "}
              <code className="inline-code">
                add_succ
              </code>{" "}
              to get{" "}
              <code className="inline-code">
                succ (succ a + b) = succ (a + succ b)
              </code>
              , then with{" "}
              <code className="inline-code">
                ih
              </code>{" "}
              to get{" "}
              <code className="inline-code">
                succ (succ (a + b)) = succ (a + succ b)
              </code>
              , and finally with{" "}
              <code className="inline-code">
                add_succ
              </code>{" "}
              again to get{" "}
              <code className="inline-code">
                succ (succ (a + b)) = succ (succ (a + b))
              </code>
              .
            </li>
          </ul>

          <pre className="code-block">
            <code>
              {`theorem succ_add (a b : nat) : succ a + b = succ (a + b) := by
  induction b with
  | zero => repeat rw [add_zero]
  | succ b ih => rw [add_succ, ih, add_succ]`}
            </code>
          </pre>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            putting it all together
          </h2>

          <p>
            Finally, we have all the ingredients needed to prove a + b = b + a for all a,
            b in N. This will be done by induction on b.
          </p>

          <pre className="code-block">
            <code>
              {`theorem add_comm (a b : nat) : a + b = b + a := by
  induction b with
  | zero =>
    rw [zero_add]
    rfl
  | succ b ih =>
    rw [add_succ, ih, succ_add]`}
            </code>
          </pre>

          <h2 className="text-xl font-semibold text-foreground mt-4 mb-2">
            why all this work?
          </h2>

          <p>
            I&apos;ve been meaning to teach myself Lean for a while now, but never found
            the time to get around to it. This language is definitely the most prerequisite
            heavy one I&apos;ve looked at to date. Not only do I need to know the basics of
            mathematical proofs, but also some first-order logic to be able to understand
            what the assistant is telling me, and also why the prover works.
          </p>

          <p>
            Writing this was my excuse to finally dip my toes in the world of computer
            assisted proofs. I&apos;ve always thought of mathematical proofs as a form of
            art, as there typically isn&apos;t an algorithmic way to go about them. But
            having seen Lean, although it can&apos;t (yet) write an entire proof by itself,
            it amazes me to see a computer program be able to validate a proof. I will
            definitely be spending more time with this language in my future studies.
          </p>
        </div>
      </article>
    </section>
  );
}
