import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Streaks from "@/components/Streaks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0f0e0c;
          --ink-2: #3a3830;
          --ink-3: #7a7770;
          --paper: #faf8f4;
          --paper-2: #f0ede6;
          --paper-3: #e4e0d8;
          --amber: #d97706;
          --amber-light: #fef3c7;
          --teal: #0f766e;
          --border: rgba(15,14,12,0.12);
          --serif: 'DM Serif Display', serif;
          --sans: 'Outfit', sans-serif;
          --mono: 'DM Mono', monospace;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: var(--sans);
          background: var(--paper);
          color: var(--ink);
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        .nav-link {
          font-size: 14px;
          font-weight: 400;
          color: var(--ink-2);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--ink); }

        .nav-cta {
          background: var(--ink);
          color: var(--paper) !important;
          padding: 7px 18px;
          border-radius: 6px;
          font-weight: 500 !important;
          font-size: 13px !important;
          transition: opacity 0.2s !important;
          text-decoration: none;
        }
        .nav-cta:hover { opacity: 0.8; }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--amber);
          animation: pulse 2s infinite;
          display: inline-block;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .board-row {
          display: grid;
          grid-template-columns: 36px 1fr auto auto auto;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border-bottom: 1px solid var(--border);
          animation: rowIn 0.4s ease both;
          transition: background 0.2s;
        }
        .board-row:hover { background: var(--paper-2); }
        .board-row:last-child { border-bottom: none; }

        .feature-cell {
          background: var(--paper);
          padding: 2rem;
          transition: background 0.2s;
          cursor: default;
        }
        .feature-cell:hover { background: var(--paper-2); }

        .step-cell {
          background: var(--ink);
          padding: 2rem 1.5rem;
          position: relative;
        }

        .streak-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .btn-primary {
          background: var(--ink);
          color: var(--paper);
          padding: 13px 28px;
          border-radius: 8px;
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,14,12,0.18); }

        .btn-secondary {
          color: var(--ink-2);
          font-size: 15px;
          font-weight: 400;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .btn-secondary:hover { color: var(--ink); border-color: var(--ink-3); }

        .btn-amber {
          background: var(--amber);
          color: white;
          padding: 13px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-amber:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(217,119,6,0.3); }

        .float-card {
          position: absolute;
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 8px 24px rgba(15,14,12,0.10);
          animation: floatIn 0.6s ease both;
        }

        @media (max-width: 900px) {
          .hero-visual { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .steps-row { grid-template-columns: 1fr 1fr !important; }
          .streak-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Streaks />
      <CTA />
      <Footer />
    </>
  );
}
