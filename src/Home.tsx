/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nexus Gateway — Landing / Home page
 * Aesthetic: Dark industrial-technical. Dense grid, monospace accents,
 * violet/indigo brand on near-black surfaces. Feels like a terminal that grew up.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, Shield, Zap, BarChart2,
  Key, Server, Globe, ChevronRight, Terminal,
  Lock, RefreshCw, Clock
} from 'lucide-react';

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

// ─── Intersection observer hook ───────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated grid background ─────────────────────────────────────────────────

const GridBg = () => (
  <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    {/* dot grid */}
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="rgba(139,92,246,0.18)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
    {/* radial glow centre */}
    <div style={{
      position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
      width: 700, height: 500,
      background: 'radial-gradient(ellipse at center, rgba(109,40,217,0.22) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />
    {/* top edge line */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.5) 40%, rgba(99,102,241,0.5) 60%, transparent 100%)'
    }} />
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

type StatProps = { target: number; suffix?: string; label: string; inView: boolean; delay?: number };
const Stat = ({ target, suffix = '', label, inView, delay = 0 }: StatProps) => {
  const val = useCounter(target, 1600, inView);
  return (
    <div
      className="text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
        {val.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">{label}</p>
    </div>
  );
};

// ─── Feature card ─────────────────────────────────────────────────────────────

type FeatureProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tag?: string;
  delay?: number;
  inView: boolean;
};

const FeatureCard = ({ icon, title, desc, tag, delay = 0, inView }: FeatureProps) => (
  <div
    className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-700/60 transition-all duration-300 overflow-hidden"
    style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(24px)',
      transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
    }}
  >
    {/* hover glow */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(109,40,217,0.12) 0%, transparent 60%)' }} />

    <div className="relative z-10">
      {tag && (
        <span className="inline-block mb-3 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-700/40">
          {tag}
        </span>
      )}
      <div className="w-10 h-10 rounded-xl bg-violet-900/50 border border-violet-700/40 flex items-center justify-center text-violet-400 mb-4 group-hover:bg-violet-800/60 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Terminal mockup ──────────────────────────────────────────────────────────

const TerminalMockup = () => {
  const lines = [
    { t: 0,   text: '$ curl -X POST https://gateway.nexus.io/v1/ai \\', color: 'text-zinc-300' },
    { t: 200, text: '     -H "x-api-key: nxs_k3y_••••••••••••ab3f" \\', color: 'text-zinc-500' },
    { t: 400, text: '     -d \'{"prompt": "Summarize this report"}\'', color: 'text-zinc-500' },
    { t: 700, text: '', color: '' },
    { t: 900, text: '  200 OK  — 138ms', color: 'text-emerald-400' },
    { t: 1000,text: '{', color: 'text-zinc-300' },
    { t: 1100,text: '  "id": "req_01HX9B3M...",', color: 'text-zinc-400' },
    { t: 1200,text: '  "model": "nexus-ai-v2",', color: 'text-zinc-400' },
    { t: 1300,text: '  "result": "The Q3 report highlights..."', color: 'text-violet-300' },
    { t: 1400,text: '}', color: 'text-zinc-300' },
  ];
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    lines.forEach((l, i) => {
      setTimeout(() => setVisible(i + 1), l.t + 600);
    });
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-violet-950/30">
      {/* title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <span className="w-3 h-3 rounded-full bg-rose-500/70" />
        <span className="w-3 h-3 rounded-full bg-amber-400/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-xs text-zinc-500 font-mono">nexus ~ api-test</span>
      </div>
      {/* body */}
      <div className="p-5 font-mono text-sm min-h-56 space-y-0.5">
        {lines.slice(0, visible).map((l, i) => (
          <div key={i} className={l.color} style={{ lineHeight: '1.7' }}>
            {l.text || '\u00A0'}
          </div>
        ))}
        {visible < lines.length && (
          <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
};

// ─── Pricing card ─────────────────────────────────────────────────────────────

type PlanProps = {
  name: string; price: string; period: string;
  features: string[]; cta: string; highlight?: boolean; delay?: number; inView: boolean;
};
const PlanCard = ({ name, price, period, features, cta, highlight, delay = 0, inView }: PlanProps) => (
  <div
    className={`relative rounded-2xl p-6 border transition-all duration-300 flex flex-col ${
      highlight
        ? 'bg-violet-700 border-violet-500 shadow-xl shadow-violet-900/40'
        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
    }`}
    style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(24px)',
      transition: `opacity 0.55s ${delay}ms, transform 0.55s ${delay}ms`,
    }}
  >
    {highlight && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-violet-700 text-xs font-bold rounded-full shadow">
        MOST POPULAR
      </div>
    )}
    <p className={`text-xs uppercase tracking-widest font-semibold mb-3 ${highlight ? 'text-violet-200' : 'text-zinc-500'}`}>{name}</p>
    <div className="flex items-baseline gap-1 mb-1">
      <span className={`text-4xl font-bold ${highlight ? 'text-white' : 'text-white'}`} style={{ fontFamily: "'DM Mono', monospace" }}>{price}</span>
      <span className={`text-sm ${highlight ? 'text-violet-200' : 'text-zinc-500'}`}>{period}</span>
    </div>
    <ul className="mt-5 space-y-2.5 flex-1 mb-6">
      {features.map(f => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-violet-200' : 'text-violet-400'}`} />
          <span className={highlight ? 'text-violet-100' : 'text-zinc-400'}>{f}</span>
        </li>
      ))}
    </ul>
    <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      highlight
        ? 'bg-white text-violet-700 hover:bg-violet-50 active:scale-95'
        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white active:scale-95'
    }`}>
      {cta}
    </button>
  </div>
);

// ─── Main Home component ──────────────────────────────────────────────────────

export default function Home() {
  // Intersection refs
  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.1);
  const pricingSection = useInView(0.1);
  const ctaSection = useInView(0.3);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Nexus Gateway</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            {['Features', 'Analytics', 'Pricing', 'Docs'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="hover:text-white transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </a>
            <a href="/dashboard"
              className="text-sm font-semibold px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors flex items-center gap-1.5">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <GridBg />
        <div className="relative max-w-4xl mx-auto text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-violet-700/40 bg-violet-900/30 text-violet-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v2.4 — Now with real-time analytics
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </div>

          {/* headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            One gateway.<br />
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Every service.
            </span>
          </h1>

          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Route, authenticate, and observe all your internal microservices through a single
            hardened API gateway. Built for teams that move fast and break nothing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-900/50">
              Get started free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#features"
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-medium rounded-xl transition-all active:scale-95">
              <Terminal className="w-4 h-4 text-violet-400" /> View docs
            </a>
          </div>

          {/* terminal mockup */}
          <div className="mt-16 max-w-2xl mx-auto">
            <TerminalMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────── */}
      <section className="py-16 border-y border-zinc-800/60 bg-zinc-900/30" ref={statsSection.ref}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <Stat target={1200000} suffix="+" label="Requests / day"   inView={statsSection.inView} delay={0} />
          <Stat target={99}      suffix=".97%" label="Uptime SLA"     inView={statsSection.inView} delay={100} />
          <Stat target={12}      suffix=" ms"  label="P50 latency"    inView={statsSection.inView} delay={200} />
          <Stat target={8000}    suffix="+"    label="Active API keys" inView={statsSection.inView} delay={300} />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-24 px-6" ref={featuresSection.ref}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Features</p>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Everything you need.<br />Nothing you don't.
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Nexus Gateway handles the infrastructure complexity so your team can focus on building.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Shield className="w-5 h-5" />, title: 'API Key Authentication',
                desc: 'Generate, rotate, and revoke scoped API keys with per-key rate limiting and audit logs.',
                tag: 'Security', delay: 0
              },
              {
                icon: <Zap className="w-5 h-5" />, title: 'Intelligent Routing',
                desc: 'Route requests to any internal microservice with path rewrites, retries, and circuit breakers.',
                tag: 'Performance', delay: 80
              },
              {
                icon: <BarChart2 className="w-5 h-5" />, title: 'Real-time Analytics',
                desc: 'Monitor traffic, latency, error rates, and top consumers from a live dashboard.',
                delay: 160
              },
              {
                icon: <Lock className="w-5 h-5" />, title: 'mTLS & IP Allowlisting',
                desc: 'Mutual TLS termination and IP-based access control for zero-trust internal networks.',
                delay: 240
              },
              {
                icon: <RefreshCw className="w-5 h-5" />, title: 'Automatic Retries',
                desc: 'Configurable exponential backoff, jitter, and upstream health-check failover.',
                delay: 320
              },
              {
                icon: <Clock className="w-5 h-5" />, title: 'Rate Limiting',
                desc: 'Token-bucket and sliding-window rate limits per key, IP, or route — enforced at the edge.',
                delay: 400
              },
            ].map(f => (
              <FeatureCard key={f.title} inView={featuresSection.inView} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Services preview ───────────────────────────── */}
      <section id="analytics" className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/60">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Service Registry</p>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              All your services,<br />one place.
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Register internal microservices and manage them through a unified interface.
              Health checks, latency tracking, and endpoint documentation — all built-in.
            </p>
            <a href="/dashboard"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
              Explore the dashboard <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* mock service list */}
          <div className="flex-1 w-full max-w-md space-y-3">
            {[
              { name: 'Auth Service',    method: 'POST', endpoint: '/gateway/auth',    status: 'healthy',  latency: '12ms'  },
              { name: 'AI Inference',    method: 'POST', endpoint: '/gateway/ai',      status: 'healthy',  latency: '138ms' },
              { name: 'User Service',    method: 'GET',  endpoint: '/gateway/users',   status: 'healthy',  latency: '8ms'   },
              { name: 'Notifications',   method: 'POST', endpoint: '/gateway/notify',  status: 'degraded', latency: '240ms' },
            ].map(s => (
              <div key={s.name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 transition-colors">
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-sm font-medium text-zinc-200 flex-1">{s.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  s.method === 'GET'
                    ? 'bg-emerald-900/60 text-emerald-400 ring-1 ring-emerald-700/40'
                    : 'bg-violet-900/60 text-violet-400 ring-1 ring-violet-700/40'
                }`}>{s.method}</span>
                <code className="text-xs text-zinc-500 font-mono hidden sm:block">{s.endpoint}</code>
                <span className="text-xs text-zinc-600 ml-auto shrink-0">{s.latency}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6" ref={pricingSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Pricing</p>
            <h2 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Start free, scale as you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <PlanCard
              name="Starter" price="Free" period="/mo"
              features={['1M requests / month', '5 API keys', '3 services', '7-day log retention']}
              cta="Start for free" inView={pricingSection.inView} delay={0}
            />
            <PlanCard
              name="Pro" price="$29" period="/mo"
              features={['50M requests / month', 'Unlimited API keys', 'Unlimited services', '90-day log retention', 'Real-time analytics', 'Priority support']}
              cta="Get Pro" highlight inView={pricingSection.inView} delay={100}
            />
            <PlanCard
              name="Enterprise" price="Custom" period=""
              features={['Unlimited requests', 'Dedicated infrastructure', 'mTLS support', 'SLA guarantee', 'SSO / SAML', 'Custom integrations']}
              cta="Contact sales" inView={pricingSection.inView} delay={200}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 px-6" ref={ctaSection.ref}>
        <div
          className="max-w-3xl mx-auto text-center relative"
          style={{
            opacity: ctaSection.inView ? 1 : 0,
            transform: ctaSection.inView ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.6s, transform 0.6s',
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(109,40,217,0.18) 0%, transparent 70%)' }} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-16">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to ship faster?</h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of engineering teams who route their services through Nexus Gateway.
              Free to start — no credit card required.
            </p>
            <a href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-xl shadow-violet-900/40">
              Create your gateway <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Nexus Gateway</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            {['Privacy', 'Terms', 'Status', 'Docs'].map(l => (
              <a key={l} href="#" className="hover:text-zinc-400 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs text-zinc-700">© 2025 Nexus Gateway. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
