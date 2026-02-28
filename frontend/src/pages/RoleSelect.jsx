import { useNavigate, Link } from "react-router-dom";
import AnimatedChat from "../components/AnimatedChat";
import logo from "../assets/your-logo.png";

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
            <img src={logo} alt="Do4U" className="landing__brand-icon" />
          </div>

          <nav className="landing__nav-links">
            <a href="#home" className="landing__nav-link">
              Home
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
              Browse Tasks
            </button>
          </div>
        </header>

        {/* Hero */}
        <main id="home" className="landing__main">
          <section
            className="landing__hero"
            aria-labelledby="landing-hero-title"
          >
            <div className="landing__hero-copy">
              <p className="landing__eyebrow">START GETTING THINGS DONE</p>
              <h1 id="landing-hero-title" className="landing__hero-headline">
                No chores.{" "}
                <span className="landing__hero-headline--accent">
                  Just Do4U.
                </span>
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
                  I Need Help
                </button>
                <button
                  className="btn btn--ghost landing__hero-btn"
                  onClick={() => handleStart("genie")}
                >
                  Meet Genies
                </button>
              </div>
            </div>

            {/* Phone-style preview */}
            <div className="landing__hero-device" aria-hidden="true">
              <div className="landing__device-frame">
                <div className="landing__device-camera"></div>
                <div className="landing__device-header">
                  <span className="landing__device-time">11:11</span>
                  <span className="landing__device-status">
                    <span className="landing__device-wifi">
                      <span className="wifi-arc wifi-arc-1"></span>
                      <span className="wifi-arc wifi-arc-2"></span>
                      <span className="wifi-arc wifi-arc-3"></span>
                      <span className="wifi-dot"></span>
                    </span>
                    <span className="landing__device-battery" />
                  </span>
                </div>
                <AnimatedChat />
              </div>
            </div>
          </section>

          {/* How It Works Flow */}
          <section id="how-it-works" className="landing__flow-section">
            <div className="landing__flow-header">
              <h2 className="landing__flow-heading">
                HOW WE
                <span className="landing__flow-heading-highlight">
                  FIX TASKS
                </span>
              </h2>
              <p className="landing__flow-subheading">
                No more endless scrolling. No more fake ratings.
              </p>
              <p className="landing__flow-subheading">
                Just real people getting real work done.
              </p>
            </div>

            <div className="landing__flow-cards">
              <div className="landing__flow-card landing__flow-card--pink">
                <div className="landing__flow-number">01</div>
                <h3 className="landing__flow-card-title">POST IN 60 SECONDS</h3>
                <p className="landing__flow-card-text">
                  <strong>Your task is urgent. Your time is precious.</strong>{" "}
                  Describe what you need—garden cleanup, furniture assembly,
                  airport pickup, grocery runs—set your budget, and hit post. No
                  forms. No hassle. Just honest work requests.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--yellow">
                <div className="landing__flow-number">02</div>
                <h3 className="landing__flow-card-title">
                  GENIES RESPOND FAST
                </h3>
                <p className="landing__flow-card-text">
                  <strong>Real people, instant offers.</strong> Nearby Genies
                  see your task and make competitive offers. Check their
                  verified profiles, ratings from real users, and past completed
                  jobs. Choose who fits your vibe and budget.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--blue">
                <div className="landing__flow-number">03</div>
                <h3 className="landing__flow-card-title">SECURE PAYMENT</h3>
                <p className="landing__flow-card-text">
                  <strong>Money stays safe until job's done.</strong> Chat
                  directly with your Genie. Confirm details, timing, and
                  requirements. Payment is held in our secure escrow
                  wallet—released only when you approve the completed work.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--orange">
                <div className="landing__flow-number">04</div>
                <h3 className="landing__flow-card-title">RATE & BUILD TRUST</h3>
                <p className="landing__flow-card-text">
                  <strong>Every job builds reputation.</strong> Leave honest
                  ratings and reviews. Reward top Genies with tips and repeat
                  bookings. Find your go-to helpers for regular tasks. Build
                  your trusted crew over time.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>
            </div>
          </section>

          {/* Marquee */}
          <section className="landing__marquee" aria-label="Do4U vibe">
            <div className="landing__marquee-track">
              <span>DO4U GETS IT DONE</span>
              <span>POST IN 60 SECONDS</span>
              <span>VERIFIED GENIES</span>
              <span>SECURE ESCROW</span>
              <span>TRUSTED RATINGS</span>
              <span>REAL TASK MARKETPLACE</span>
              <span>DO4U GETS IT DONE</span>
              <span>POST IN 60 SECONDS</span>
            </div>
          </section>

          {/* Split grid: tiles + how it works */}
          <section className="landing__sections">
            <div className="landing__card-grid">
              <article className="landing__card">
                <div className="landing__card-icon">🎯</div>
                <h3 className="landing__card-title">Your Chaos, Solved</h3>
                <p className="landing__card-text">
                  Last-minute airport run? Garden grass too long? Furniture
                  assembly nightmare? Drop the task with all your details, set
                  what you&apos;ll pay, and watch Genies compete to help you.
                </p>
              </article>

              <article className="landing__card">
                <div className="landing__card-icon">✨</div>
                <h3 className="landing__card-title">Smart Matching</h3>
                <p className="landing__card-text">
                  Filter by location, task type, budget, and timeline. See
                  verified Genies with real ratings, completed jobs, and honest
                  reviews from people just like you.
                </p>
              </article>

              <article className="landing__card">
                <div className="landing__card-icon">💬</div>
                <h3 className="landing__card-title">Clear Communication</h3>
                <p className="landing__card-text">
                  Built-in chat with smart prompts keeps everything smooth.
                  &quot;Need parking info?&quot; &quot;Tools required?&quot;
                  &quot;Where&apos;s the key?&quot; No awkward back-and-forth.
                </p>
              </article>
            </div>

            <aside className="landing__how-card">
              <h2 className="landing__how-title">
                What if you could skip all the chaos?
              </h2>
              <p className="landing__how-text">
                Do4U turns your to-dos into done-dids. No endless scrolling, no
                fake profiles, no payment nightmares. Just honest people doing
                honest work with complete transparency.
              </p>
              <ul className="landing__list">
                <li>
                  <strong>Post once, get real responses in minutes</strong> —
                  Active Genies near you jump on tasks fast
                </li>
                <li>
                  <strong>Secure escrow wallet</strong> — Money held safely
                  until you confirm job completion
                </li>
                <li>
                  <strong>Real ratings & verified profiles</strong> — Trust
                  built through actual completed work
                </li>
                <li>
                  <strong>Direct messaging</strong> — Chat with your Genie,
                  clarify details, track progress
                </li>
                <li>
                  <strong>Reward points & loyalty</strong> — Both users and
                  Genies earn rewards for great service
                </li>
              </ul>
              <button
                className="btn btn--primary landing__how-btn"
                onClick={() => handleStart("user")}
              >
                Start Your First Task →
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
                <figure className="landing__story-card landing__story-card--pink">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;I posted a &apos;please save my moving day&apos; task
                    and had two Genies show up with a van in under an hour.
                    Absolute lifesaver!&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">J</div>
                    <span>— Jess, new in town</span>
                  </figcaption>
                </figure>
                <figure className="landing__story-card landing__story-card--yellow">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;I run errands between classes. It&apos;s flexible,
                    fast, and the wallet makes payouts painless.&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">A</div>
                    <span>— Amir, student &amp; Genie</span>
                  </figcaption>
                </figure>
                <figure className="landing__story-card landing__story-card--blue">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;Found my go-to handyman through Do4U. Fixed my fence,
                    hung shelves, and assembled furniture. Now I just text him
                    directly through the app!&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">M</div>
                    <span>— Maria, homeowner</span>
                  </figcaption>
                </figure>
                <figure className="landing__story-card landing__story-card--orange">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;The escrow system is genius. I don&apos;t worry about
                    getting paid anymore. Job done = instant release.
                    Simple.&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">C</div>
                    <span>— Carlos, delivery Genie</span>
                  </figcaption>
                </figure>
                <figure className="landing__story-card landing__story-card--pink">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;Needed groceries picked up while stuck at work. Posted
                    at 3pm, had them delivered by 4pm. This app is magic.&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">P</div>
                    <span>— Priya, busy professional</span>
                  </figcaption>
                </figure>
                <figure className="landing__story-card landing__story-card--blue">
                  <div className="landing__story-rating">⭐⭐⭐⭐⭐</div>
                  <blockquote className="landing__story-quote">
                    &quot;Made $400 last weekend doing yard cleanups. Love that
                    I can choose which jobs to take and see ratings before
                    accepting.&quot;
                  </blockquote>
                  <figcaption className="landing__story-author">
                    <div className="landing__story-avatar">J</div>
                    <span>— Jake, weekend Genie</span>
                  </figcaption>
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
                  Join Do4U
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
            <div className="landing__footer-grid">
              <div className="landing__footer-section">
                <h3 className="landing__footer-heading">DO4U</h3>
                <p className="landing__footer-tagline">
                  The community platform for people who want real-world help,
                  fast.
                </p>
                <div className="landing__footer-social">
                  <a
                    href="https://github.com/do4u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing__footer-social-link"
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://twitter.com/do4u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing__footer-social-link"
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com/company/do4u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing__footer-social-link"
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/do4u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing__footer-social-link"
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="landing__footer-section">
                <h3 className="landing__footer-heading">Quick Links</h3>
                <div className="landing__footer-links">
                  <a href="#home" className="landing__footer-link">
                    Home
                  </a>
                  <a href="#how-it-works" className="landing__footer-link">
                    How it Works
                  </a>
                  <a href="#stories" className="landing__footer-link">
                    Stories
                  </a>
                  <Link to="/login" className="landing__footer-link">
                    Sign in
                  </Link>
                </div>
              </div>

              <div className="landing__footer-section">
                <h3 className="landing__footer-heading">Get Started</h3>
                <div className="landing__footer-links">
                  <Link to="/login?role=user" className="landing__footer-link">
                    Post a Task
                  </Link>
                  <Link to="/login?role=genie" className="landing__footer-link">
                    Become a Genie
                  </Link>
                  <Link to="/register" className="landing__footer-link">
                    Create Account
                  </Link>
                </div>
              </div>

              <div className="landing__footer-section">
                <h3 className="landing__footer-heading">Contact Us</h3>
                <div className="landing__footer-contact">
                  <p className="landing__footer-contact-item">
                    <strong>📧 Email:</strong>
                    <br />
                    <a
                      href="mailto:hello@do4u.app"
                      className="landing__footer-link"
                    >
                      hello@do4u.app
                    </a>
                  </p>
                  <p className="landing__footer-contact-item">
                    <strong>📞 Phone:</strong>
                    <br />
                    <a href="tel:+15551234567" className="landing__footer-link">
                      +1 (555) 123-4567
                    </a>
                  </p>
                  <p className="landing__footer-contact-item">
                    <strong>📍 Location:</strong>
                    <br />
                    San Francisco, CA
                  </p>
                </div>
              </div>
            </div>

            <div className="landing__footer-bottom">
              <p>&copy; 2026 Do4U. All rights reserved.</p>
              <div className="landing__footer-bottom-links">
                <a href="#privacy" className="landing__footer-link">
                  Privacy Policy
                </a>
                <a href="#terms" className="landing__footer-link">
                  Terms of Service
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
