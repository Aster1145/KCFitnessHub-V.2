"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Sparkles, Clock, MapPin, ExternalLink } from "lucide-react";
import { KcLogo, InstagramIcon } from "@/components/kc-logo";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Memberships", href: "#pricing" },
  { label: "Programs", href: "#programs" },
  { label: "Gallery", href: "#gallery" },
  { label: "The System", href: "#system" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function AppleHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 sm:top-5 z-50 flex flex-col items-center px-3 sm:px-6 pointer-events-none transition-all duration-300">
      {/* ---------------- APPLE GLASS TABLET OVAL ---------------- */}
      <div
        className={`pointer-events-auto relative flex w-full max-w-5xl items-center justify-between rounded-full border px-4 py-2 sm:px-6 sm:py-2.5 transition-all duration-500 ease-out ${
          scrolled
            ? "border-white/25 bg-gradient-to-b from-white/[0.14] via-zinc-950/[0.82] to-black/[0.92] shadow-[0_24px_50px_rgba(0,0,0,0.75),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.6)] backdrop-blur-3xl backdrop-saturate-200"
            : "border-white/20 bg-gradient-to-b from-white/[0.12] via-zinc-950/[0.7] to-zinc-950/[0.85] shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150 hover:border-white/30"
        }`}
      >
        {/* Specular Light Reflection Streak on Top Rim */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />

        {/* Apple Gloss Glaze (Upper curvature highlight) */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent opacity-80" />

        {/* Brand Logo - strictly "KC" */}
        <Link
          href="/"
          className="relative z-10 flex items-center transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-label="KC Fitness Hub Home"
        >
          <KcLogo className="size-8 sm:size-9 drop-shadow-[0_0_14px_rgba(216,255,62,0.35)]" />
        </Link>

        {/* Desktop Navigation Links - Apple Segmented Glass Hover */}
        <nav className="relative z-10 hidden items-center gap-1 text-[12px] font-medium tracking-wide text-zinc-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-zinc-300/90 transition-all duration-200 hover:bg-white/[0.12] hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-95 active:bg-white/20"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action: Member Access (Desktop) + Mobile Menu Toggle */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
          {/* Join Online Button */}
          <Link
            href="/join"
            className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-volt px-3.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-black tracking-wider text-carbon uppercase shadow-[0_0_22px_rgba(216,255,62,0.4)] transition-all duration-300 hover:bg-volt-dim hover:scale-105 active:scale-95"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/60" />
            <span className="relative z-10">Join Now</span>
            <ArrowRight
              size={12}
              className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>

          {/* Member Portal Button */}
          <Link
            href="/login"
            className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider text-zinc-300 uppercase hover:text-white hover:border-white/40 transition-colors"
          >
            Sign In
          </Link>


          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-xl transition-all duration-200 hover:bg-white/15 active:scale-95 lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ---------------- MOBILE GLASS ISLAND DROPDOWN ---------------- */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
            aria-hidden="true"
          />

          <div className="pointer-events-auto relative z-50 mt-2.5 w-full max-w-md animate-in fade-in slide-in-from-top-3 duration-300 lg:hidden">
            <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-b from-white/[0.14] via-zinc-950/[0.92] to-black/[0.98] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.35)] backdrop-blur-3xl backdrop-saturate-200">
              {/* Top specular glaze line */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              {/* Links Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-zinc-200 transition-all hover:border-volt/40 hover:bg-white/10 hover:text-volt active:scale-95"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={12} className="opacity-40" />
                  </a>
                ))}
              </div>

              {/* Quick Info & Social */}
              <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4 text-[11px] text-zinc-400">
                <a
                  href="https://maps.app.goo.gl/VGuwWfWVLtorK6FY7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-medium text-zinc-300 transition-colors hover:text-volt"
                >
                  <MapPin size={13} className="text-volt shrink-0" />
                  <span className="truncate">Near Brigade Meadows, Kaggalipura (Google Maps)</span>
                  <ExternalLink size={10} className="opacity-60 shrink-0" />
                </a>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-volt shrink-0" />
                  <span className="truncate">Mon-Sat 5:30 AM – 10:00 PM | Sun 7 AM – 2 PM</span>
                </div>
                <a
                  href="https://www.instagram.com/kcfitnesshub?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[36px] items-center gap-2 font-medium text-pink-400 transition-colors hover:text-pink-300"
                >
                  <InstagramIcon className="size-3.5 shrink-0" />
                  <span className="truncate">Follow @kcfitnesshub on Instagram</span>
                  <ExternalLink size={10} className="opacity-60 shrink-0" />
                </a>
              </div>

              {/* Mobile Full CTA */}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-volt py-3 text-xs font-bold tracking-wider text-carbon uppercase shadow-[0_0_20px_rgba(216,255,62,0.4)] transition-all hover:bg-volt-dim active:scale-95"
              >
                <span>Enter Portal</span>
                <ArrowRight size={14} />
              </Link>

            </div>
          </div>
        </>
      )}

    </header>
  );
}
