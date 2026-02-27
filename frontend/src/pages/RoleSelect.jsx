import { useNavigate, Link } from "react-router-dom";

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleStart = (role) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="landing">
      <div className="landing__inner">
        {/* Top nav */}
        <header className="landing__nav">
          <div className="landing__brand">
            <span className="landing__brand-icon">🚀</span>
            <span className="landing__brand-name">Do4U</span>
          </div>

          <nav className="landing__nav-links">
            <a href="#madness" className="landing__nav-link">
              The Madness
            </a>
            <a href="#how-it-works" className="landing__nav-link">
              How it Works
            </a>
            <a href="#stories" className="landing__nav-link">
              Stories
            </a>
          </nav>

          <div className="landing__nav-cta">
            <button
              className="btn btn--ghost landing__nav-btn"
              onClick={() => handleStart("user")}
            >
              Sign in
            </button>
            <button
              className="btn btn--primary landing__nav-btn"
              onClick={() => handleStart("user")}
            >
              Get Early Access
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="landing__main">
          <section
            className="landing__hero"
            aria-labelledby="landing-hero-title"
          >
            <div className="landing__hero-copy">
              <p className="landing__eyebrow">START GETTING THINGS DONE</p>
              <h1 id="landing-hero-title" className="landing__hero-headline">
                No chores. <span className="landing__hero-headline--accent">Just Do4U.</span>
              </h1>
              <p className="landing__subtitle">
                Skip the endless back-and-forth. Do4U matches you with trusted
                Genies who jump straight into real work &mdash; from errands and
                deliveries to one-off life savers.
              </p>

              <div className="landing__hero-actions">
                <button
                  className="btn btn--primary landing__hero-btn"
                  onClick={() => handleStart("user")}
                >
                  I need something done
                </button>
                <button
                  className="btn btn--ghost landing__hero-btn"
                  onClick={() => handleStart("genie")}
                >
                  I want to be a Genie
                </button>
              </div>

              <div className="landing__hero-meta">
                <span>⚡ Post a task in under 60 seconds</span>
                <span>🧞 Genies earn on their own terms</span>
                <span>🛡️ Backed by ratings &amp; secure wallet</span>
              </div>
            </div>

            {/* Phone-style preview */}
            <div className="landing__hero-device" aria-hidden="true">
              <div className="landing__device-frame">
                <div className="landing__device-header">
                  <span className="landing__device-time">9:41</span>
                  <span className="landing__device-status">
                    <span className="landing__device-signal" />
                    <span className="landing__device-wifi" />
                    <span className="landing__device-battery" />
                  </span>
                </div>
                <div className="landing__device-body">
                  <div className="landing__chat-bubble landing__chat-bubble--you">
                    Hey, I&apos;m way too lazy to cut my garden grass this week.
                  </div>
                  <div className="landing__chat-bubble landing__chat-bubble--tag">
                    New task · 5 mins away
                  </div>
                  <div className="landing__chat-bubble landing__chat-bubble--genie">
                    I&apos;ve got you. I&apos;ll trim the lawn and send you
                    photos once it&apos;s all done.
                  </div>
                  <div className="landing__device-footer">
                    <span className="landing__pill">Real-time updates</span>
                    <span className="landing__pill">In-app wallet</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Marquee */}
          <section className="landing__marquee" aria-label="Do4U vibe">
            <div className="landing__marquee-track">
              <span>NO GHOSTING</span>
              <span>JUST VIBES</span>
              <span>REAL PEOPLE</span>
              <span>INSTANT HELP</span>
              <span>NO GHOSTING</span>
              <span>JUST VIBES</span>
              <span>REAL PEOPLE</span>
              <span>INSTANT HELP</span>
            </div>
          </section>

          {/* Split grid: tiles + how it works */}
          <section id="how-it-works" className="landing__sections">
            <div className="landing__card-grid">
              <article className="landing__card">
                <h3 className="landing__card-title">Flaunt your chaos</h3>
                <p className="landing__card-text">
                  Last-minute airport run? Flat-pack furniture? A line you
                  can&apos;t stand in? Drop the task, add the details, and
                  we&apos;ll find a Genie.
                </p>
              </article>

              <article className="landing__card">
                <h3 className="landing__card-title">Find your vibe</h3>
                <p className="landing__card-text">
                  Filters for time, budget and type of task. You see who&apos;s
                  nearby, what they&apos;ve done before, and what other humans
                  say about them.
                </p>
              </article>

              <article className="landing__card">
                <h3 className="landing__card-title">Awkward silence?</h3>
                <p className="landing__card-text">
                  Built-in prompts and quick replies keep everything clear and
                  human (&quot;Need gate code?&quot; &quot;Where should I leave
                  it?&quot;).
                </p>
              </article>
            </div>

            <aside id="madness" className="landing__how-card">
              <h2 className="landing__how-title">
                What if you could skip all the chaos?
              </h2>
              <p className="landing__how-text">
                Do4U turns your to-dos into done-dids. No spreadsheets, no group
                chats, no faceless marketplaces. Just a clear feed of tasks and
                Genies who can help.
              </p>
              <ul className="landing__list">
                <li>Post once, get real responses in minutes.</li>
                <li>Built-in wallet keeps payments simple and secure.</li>
                <li>Ratings and reviews help you find your go-to Genie.</li>
              </ul>
              <button
                className="btn btn--primary landing__how-btn"
                onClick={() => handleStart("user")}
              >
                Start with your first task
              </button>
            </aside>
          </section>

          {/* Stories / social proof */}
          <section id="stories" className="landing__stories">
            <div className="landing__stories-inner">
              <h2 className="landing__stories-title">
                What Do4U fans are saying
              </h2>
              <div className="landing__stories-grid">
                <figure className="landing__story">
                  <blockquote>
                    &quot;I posted a &apos;please save my moving day&apos; task
                    and had two Genies show up with a van in under an
                    hour.&quot;
                  </blockquote>
                  <figcaption>— Jess, new in town</figcaption>
                </figure>
                <figure className="landing__story">
                  <blockquote>
                    &quot;I run errands between classes. It&apos;s flexible,
                    fast, and the wallet makes payouts painless.&quot;
                  </blockquote>
                  <figcaption>— Amir, student &amp; Genie</figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="landing__cta" id="join">
            <div className="landing__cta-inner">
              <h2 className="landing__cta-title">Ready to join the club?</h2>
              <p className="landing__cta-text">
                Be the first to try Do4U in your city. No spam, just a heads up
                when we&apos;re live and a link to claim early rewards.
              </p>

              <div className="landing__cta-actions">
                <button
                  className="btn btn--primary landing__cta-btn"
                  onClick={() => handleStart("user")}
                >
                  Get early access
                </button>
                <Link
                  to="/login?role=genie"
                  className="btn btn--ghost landing__cta-btn"
                  style={{ textDecoration: "none" }}
                >
                  Become a Genie
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing__footer">
            <div className="landing__footer-left">
              <span className="landing__brand-name">Do4U</span>
              <span className="landing__footer-tagline">
                The community platform for people who want real-world help,
                fast.
              </span>
            </div>
            <div className="landing__footer-links">
              <Link to="/login" className="landing__footer-link">
                Sign in
              </Link>
              <a href="#how-it-works" className="landing__footer-link">
                How it works
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
