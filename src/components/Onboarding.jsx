import React, { useState } from 'react';

// Slide 1: Bem-vindo - "Seu lixo tem valor"
const Slide1 = () => (
  <div className="bg-surface text-on-surface overflow-x-hidden min-h-screen flex flex-col" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
    <header className="w-full top-0 px-6 py-4 flex justify-between items-center w-full max-w-screen-xl mx-auto">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-green-700">eco</span>
        <h1 className="text-green-800 font-bold italic text-2xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>EcoArchives</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full bg-primary-container"></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
        </div>
      </div>
    </header>
    <main className="flex-grow flex flex-col justify-center px-6 lg:px-20 max-w-screen-xl mx-auto w-full pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 space-y-8">
          <div className="space-y-4">
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-block" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Bem-vindo
            </span>
            <h2 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Seu lixo tem <span className="text-primary bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">valor</span>.
            </h2>
            <p className="text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-lg" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Transforme o que seria descartado em impacto positivo e recompensas reais. Uma jornada sustentável para você e o planeta.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-lg pr-8">
              <div className="bg-primary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>energy_savings_leaf</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Impacto</p>
                <p className="text-sm text-on-secondary-fixed-variant">Redução de CO2</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-lg pr-8">
              <div className="bg-tertiary-container/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Créditos</p>
                <p className="text-sm text-on-secondary-fixed-variant">Troque por reais</p>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative">
          <div className="absolute inset-0 bg-primary-container/5 rounded-full blur-[100px] -z-10 translate-x-12 translate-y-12"></div>
          <div className="relative w-full max-w-md aspect-square bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden group">
            <img alt="Modern Recycling Bin" className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO69ecJI7OjfKqsCDIxNXcyurpwmgQ-yB0xnMDIQmsF8pCR5aK97JCeTCoWSypZHYU8tUrAKR9cJ1Y5tVHA-C-k_lmJIK-G4a1J9uCaxKqgIz_mAwYB5LFrCCUYFzz3QkWtrsRQtmk3whng6CgYwCP3-YeDhEPTb4fivxbNvI7ZqzXyF6ytHXImpmWOXvgR5gb_aO_bJIowUpWuiaj9DFvjznVPE1rIvKfq9NYyxM0x_GDC0NkKm-E49Be6-MCr_44Xs6Lmmd2GaA" />
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <div className="bg-white/90 backdrop-blur shadow-lg p-3 rounded-2xl flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
              </div>
              <div className="bg-white/90 backdrop-blur shadow-lg p-3 rounded-2xl flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-8">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-bold tracking-wide text-sm">PROJETO SUSTENTÁVEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// Slide 2: Separe e Recicle
const Slide2 = () => (
  <div className="bg-surface text-on-surface min-h-screen flex flex-col" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
    <header className="w-full top-0 px-6 py-4 flex justify-between items-center w-full max-w-screen-xl mx-auto z-40">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-green-700">eco</span>
        <h1 className="text-2xl font-bold tracking-tight text-green-800 italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>EcoArchives</h1>
      </div>
    </header>
    <main className="min-h-[calc(100vh-180px)] px-6 pb-32 max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <div className="md:col-span-7 relative">
        <div className="aspect-[4/5] md:aspect-square rounded-xl overflow-hidden bg-surface-container-low relative group">
          <img alt="Sorting waste" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxIJ5GgfmyQpjBBIYyDPM0cIGp-31C6SFKVAehEMcPlXOdlJMiXJmmh6Lvwa4P83MkX0fRAO66oQQtoS4J0awTcHT-NJUy2-AW1VwgC0l0Upn9thGC5rFEQS5cO7y7Jcn0QOa6c1tFLRInfyNbpnnWnjQek63kj700_jo1OQ-rLBsfvv0gy7jb6oKh5nAR7FAoITF60ZSH16o3avmfpIbQmjPdKBzchEOEWqpaEs8wJ8ZMKHtmVBKGxjTMx6ZKIFGaebKGdX2RukI" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        <div className="absolute -bottom-6 -right-4 bg-surface-container-lowest p-6 rounded-lg shadow-lg flex items-center gap-4 max-w-[240px]">
          <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary-fixed text-2xl">auto_awesome</span>
          </div>
          <div>
            <p className="font-bold text-sm text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Impacto Local</p>
            <p className="text-xs text-on-secondary-container">Sua ação reduz o lixo em até 40%</p>
          </div>
        </div>
      </div>
      <div className="md:col-span-5 flex flex-col gap-8 md:pl-12">
        <div className="space-y-4">
          <span className="font-label uppercase tracking-widest text-xs font-bold text-primary px-4 py-1.5 bg-primary-fixed/30 rounded-full inline-block">Módulo 02</span>
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Separe e <br /><span className="text-primary italic">Recicle</span>.
          </h2>
          <p className="text-body-lg text-secondary leading-relaxed max-w-md">
            O primeiro passo para um futuro sustentável começa em casa. Classificar seus materiais garante que eles retornem ao ciclo produtivo corretamente.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-lowest transition-all hover:bg-white">
            <span className="material-symbols-outlined text-primary-container p-2 bg-primary-fixed/20 rounded-lg">inventory_2</span>
            <div>
              <h4 className="font-bold text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Papel e Papelão</h4>
              <p className="text-sm text-on-secondary-container">Mantenha-os secos e sem restos de comida.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low transition-all hover:bg-white">
            <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-fixed/40 rounded-lg">wine_bar</span>
            <div>
              <h4 className="font-bold text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Vidro e Plástico</h4>
              <p className="text-sm text-on-secondary-container">Enxágue rapidamente para evitar odores e contaminação.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          <div className="w-8 h-3 rounded-full bg-primary-container shadow-sm"></div>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
        </div>
      </div>
    </main>
  </div>
);

// Slide 3: Ganhe Prêmios e Pontos
const Slide3 = () => (
  <div className="flex flex-col min-h-screen overflow-x-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", backgroundColor: '#f8f9fb', color: '#191c1e' }}>
    <header className="w-full top-0 px-6 py-4 flex justify-between items-center w-full max-w-screen-xl mx-auto z-50">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-green-700" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
        <span className="text-2xl font-bold tracking-tight text-green-800 italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>EcoArchives</span>
      </div>
    </header>
    <main className="flex-grow flex flex-col items-center justify-center px-6 pt-4 pb-32">
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6 order-2 md:order-1 relative">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center p-8">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-fixed-dim/20 to-tertiary-fixed/20 opacity-50"></div>
            <div className="relative z-10 w-full h-full bg-white/40 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="w-48 h-48 bg-gradient-to-tr from-primary to-primary-container rounded-full flex items-center justify-center shadow-lg mb-8 relative">
                <span className="material-symbols-outlined text-white text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
                <div className="absolute -top-4 -right-4 bg-tertiary-container text-on-tertiary-container p-3 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-3xl">local_florist</span>
                </div>
                <div className="absolute -bottom-2 -left-6 bg-secondary-container text-on-secondary-container p-4 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-2xl">eco</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="uppercase tracking-widest text-xs font-bold text-primary" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>Nível 3: Guardião Verde</p>
                <h3 className="text-3xl font-bold text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>1,250 Pontos</h3>
                <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden mt-4">
                  <div className="bg-primary h-full w-3/4 rounded-full"></div>
                </div>
                <p className="text-sm text-on-surface-variant pt-2">Faltam 250 pontos para o próximo prêmio</p>
              </div>
            </div>
            <div className="absolute top-12 right-12 bg-white p-4 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
              <div className="w-10 h-10 bg-tertiary-fixed rounded-full flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Novo Selo</p>
                <p className="font-bold text-sm">Reciclador Pro</p>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 -bottom-8 -right-8 w-64 h-64 opacity-10">
            <img className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA976P0fvPTJA0YQSCyaspYpEcbnvQJa2sMg4Z3GGNNijyFVGZEh1yzgjjfdExGlgl1Le14vt99dRhtW4vK_OqR36qywEUVJQQLZW821WMV0XxhJBkmpyhhgDgduquAYJMU-gLEJuD6ecHH6DgRTJAP9UHGIcLw0P4BD44Z8Bs9Xt3nzX0t7O29HnlmPaDSS5JHIswV-aH4pdYNeZ6kl9VJn9yEtkWhG1M966icZ_dS4e3DyGmvQBfLX1p1RuqA2qq12Oeb1Q5zN58" alt="" />
          </div>
        </div>
        <div className="md:col-span-6 order-1 md:order-2 text-left space-y-8">
          <div className="space-y-4">
            <span className="inline-block py-2 px-4 bg-primary-fixed-dim text-on-primary-fixed-variant rounded-full text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>Recompensas Reais</span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ganhe <span className="text-primary italic">Prêmios</span> e Pontos.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-md" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Cada ação sustentável alimenta o seu jardim digital. Transforme suas conquistas em descontos exclusivos e benefícios em marcas parceiras.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-lg space-y-3">
              <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
              <p className="font-bold text-on-background leading-tight">Troque por Cupons</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-lg space-y-3">
              <span className="material-symbols-outlined text-tertiary text-3xl">leaderboard</span>
              <p className="font-bold text-on-background leading-tight">Ranking Global</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
            <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
            <div className="w-8 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
          </div>
        </div>
      </section>
    </main>
  </div>
);

// Slide 4: Junte-se à nossa comunidade
const Slide4 = ({ onComplete }) => (
  <div className="bg-surface text-on-background min-h-screen flex flex-col" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
    <header className="bg-transparent text-green-700 w-full top-0 px-6 py-4 z-50">
      <div className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-green-800" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <h1 className="text-2xl font-bold tracking-tight text-green-800 italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>EcoArchives</h1>
        </div>
      </div>
    </header>
    <main className="flex-grow flex flex-col items-center justify-center px-6 pb-32">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 relative">
          <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative z-10">
            <img alt="Community Garden" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSi-Q0klyQ5xT_Asf-MliZu8DSDOcBSsmn1H9RmXcOJlbw8m3m9Rjzv_LNcrONtFEc7MVIgQoik9nifHnXBeD8fbVe3nVVYh2QRsNKuhIBeQ4eR58hKHocHBOVTgHcataDeP5Uadq85L3DIAWfMt76qviLoyZILafcMrchWEi9Er7rpBqXYgMDuxXeC7oQKLYtgmTTwZFIUgkXG1HUJjl0jHWtYZIh9IPGP6jDUVRYhJAoGROwO-KsMmGD856t15K8jCBELiQq1-w" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-tertiary-fixed rounded-full -z-0 opacity-50 blur-2xl"></div>
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-fixed-dim rounded-full -z-0 opacity-30 blur-3xl"></div>
        </div>
        <div className="lg:col-span-5 flex flex-col space-y-8">
          <div className="space-y-4">
            <span className="text-tertiary uppercase tracking-widest text-sm font-bold" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>Etapa Final</span>
            <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.1] text-on-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Junte-se à nossa comunidade
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Sua jornada rumo a um futuro sustentável começa aqui. Conecte-se com milhares de pessoas que, como você, transformam o mundo um passo de cada vez.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={onComplete}
              className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Começar agora
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <div className="flex gap-3 mt-12 items-center">
              <div className="h-1.5 w-8 bg-surface-container-highest rounded-full"></div>
              <div className="h-1.5 w-8 bg-surface-container-highest rounded-full"></div>
              <div className="h-1.5 w-8 bg-surface-container-highest rounded-full"></div>
              <div className="h-2 w-12 bg-primary rounded-full shadow-sm shadow-primary/30"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const Onboarding = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide === 3) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: return <Slide1 />;
      case 1: return <Slide2 />;
      case 2: return <Slide3 />;
      case 3: return <Slide4 onComplete={onComplete} />;
      default: return <Slide1 />;
    }
  };

  return (
    <div className="relative min-h-screen" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Slide Content */}
      <div style={{ minHeight: '100vh' }}>
        {renderSlide()}
      </div>

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 w-full flex justify-between items-center px-10 py-8 bg-slate-50/80 backdrop-blur-md z-50 rounded-t-[3rem] shadow-[0_-10px_40px_-10px_rgba(52,73,94,0.06)]">
        {/* Skip */}
        <button
          onClick={handleSkip}
          className="flex flex-col items-center justify-center text-slate-400 px-6 py-3 hover:bg-slate-200/50 transition-all active:scale-90 duration-200"
        >
          <span className="material-symbols-outlined mb-1">close</span>
          <span className="uppercase tracking-widest text-xs font-bold" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>Skip</span>
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          className="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-8 py-3 shadow-lg shadow-green-200/50 hover:opacity-80 transition-opacity active:scale-90 duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-widest text-xs font-bold" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {currentSlide === 3 ? 'Começar' : 'Next'}
            </span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </div>
        </button>
      </nav>
    </div>
  );
};

export default Onboarding;
