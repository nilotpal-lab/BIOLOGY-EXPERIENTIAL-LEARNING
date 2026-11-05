import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock,
  FileText,
  FlaskConical,
  GitCompareArrows,
  Globe2,
  Network,
  Settings2,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import type { RouteId } from '../components/layout/routes'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { BotanicalCorner } from '../components/layout/BotanicalLeaves'

interface FeaturesPageProps {
  onNavigate: (route: RouteId) => void
  onOpenImport?: () => void
}

export function FeaturesPage({ onNavigate, onOpenImport: _onOpenImport }: FeaturesPageProps) {
  return (
    <div className="relative min-h-screen bg-[#F7F6EF] text-[#202B27] overflow-x-hidden select-none">
      {/* Delicate watercolor corner branch illustrations framing the page */}
      <div className="pointer-events-none absolute -top-4 -left-6 z-0 w-28 sm:w-36 lg:w-44 opacity-75">
        <BotanicalCorner position="top-left" className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute -bottom-4 -left-6 z-0 w-28 sm:w-36 lg:w-44 opacity-75">
        <BotanicalCorner position="bottom-left" className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute -bottom-4 -right-6 z-0 w-28 sm:w-36 lg:w-44 opacity-75">
        <BotanicalCorner position="bottom-right" className="w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-6 sm:px-10 lg:px-14 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10">
        {/* =====================================================================
            HERO SECTION: Features Heading + Natural History Freshwater Artwork
            ===================================================================== */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8">
            {/* Left Header Text */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-3 pt-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#35563B]">
                FEATURES
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-serif font-normal tracking-tight text-[#202B27] leading-[1.14]">
                All the tools you need <br />
                to explore <span className="text-[#35563B] font-medium">food webs</span>
              </h1>
              <p className="text-sm sm:text-[15px] text-[#68716B] max-w-2xl leading-relaxed">
                From interactive visualisation to simulations and comparative analysis, FoodWebGuard provides a complete set of tools to study real ecosystems.
              </p>
            </div>

            {/* Right Hero Banner Artwork with Smooth Fade */}
            <div className="lg:col-span-5 xl:col-span-5 relative h-36 sm:h-44 lg:h-48 w-full rounded-2xl overflow-hidden shadow-2xs">
              <img
                src="/hero-freshwater-artwork.png"
                alt="Freshwater ecosystem with heron, carp fish, pond snails and water lilies"
                className="h-full w-full object-cover object-center"
              />
              {/* Natural gradient blend to warm ivory */}
              <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#F7F6EF] via-[#F7F6EF]/70 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#F7F6EF] to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#F7F6EF]/40 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* =====================================================================
            THE 8 CAPABILITIES: 2-Column Responsive Grid matching 02_Features_Page.png
            ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
          {/* -------------------------------------------------------------------
              1. Interactive Explorer
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EDE0] text-[#35563B]">
                    <Network size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Interactive Explorer
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Explorer"
                  aria-label="Open Explorer"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Visualise real food webs with beautiful organism illustrations. Explore species, feeding links and ecological structure.
              </p>
            </div>

            {/* Visual Preview: Multi-trophic Network with Organism Illustrations */}
            <div
              onClick={() => onNavigate('explore')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 cursor-pointer relative overflow-hidden"
              title="Click to launch Explorer"
            >
              <div className="relative h-48 w-full">
                {/* SVG Feeding Link Arrows */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#899B78" />
                    </marker>
                  </defs>
                  {/* Macrophytes -> Roach */}
                  <line x1="25%" y1="78%" x2="25%" y2="58%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Macrophytes -> Rudd */}
                  <line x1="28%" y1="78%" x2="46%" y2="58%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Snail -> Carp */}
                  <line x1="72%" y1="78%" x2="54%" y2="56%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Roach -> Pike */}
                  <line x1="25%" y1="46%" x2="33%" y2="34%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Rudd -> Heron */}
                  <line x1="48%" y1="46%" x2="48%" y2="28%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Carp -> Heron */}
                  <line x1="50%" y1="44%" x2="50%" y2="28%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                  {/* Perch -> Heron */}
                  <line x1="72%" y1="46%" x2="56%" y2="26%" stroke="#899B78" strokeWidth="1.2" markerEnd="url(#arrow-green)" />
                </svg>

                {/* Heron (Top Center - Coral) */}
                <div className="absolute top-[4%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-11 w-11 rounded-full border-2 border-[#EF9A88] bg-[#FDEEEB] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="heron" size={26} />
                  </div>
                </div>

                {/* Pike (Mid-Left) */}
                <div className="absolute top-[32%] left-[30%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full border border-[#EF9A88] bg-[#FDEEEB] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="pike" size={24} />
                  </div>
                </div>

                {/* Carp (Mid-Center - Highlighted) */}
                <div className="absolute top-[44%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full border-2 border-[#35563B] bg-white shadow-xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="carp" size={30} />
                  </div>
                </div>

                {/* Perch (Mid-Right) */}
                <div className="absolute top-[32%] left-[70%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full border border-[#F1B36F] bg-[#FEF4E8] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="perch" size={24} />
                  </div>
                </div>

                {/* Roach (Lower-Left) */}
                <div className="absolute top-[52%] left-[22%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-9 w-9 rounded-full border border-[#F3D98B] bg-[#FFFBEA] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="minnow" size={20} />
                  </div>
                </div>

                {/* Macrophytes (Bottom Left - Green) */}
                <div className="absolute bottom-[4%] left-[22%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-9 w-9 rounded-full border border-[#B5D39A] bg-[#EDF5E8] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="aquatic-plant" size={20} />
                  </div>
                </div>

                {/* Plant / Weed (Bottom Center) */}
                <div className="absolute bottom-[4%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-9 w-9 rounded-full border border-[#B5D39A] bg-[#EDF5E8] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="algae" size={20} />
                  </div>
                </div>

                {/* Snail (Bottom Right) */}
                <div className="absolute bottom-[4%] left-[74%] -translate-x-1/2 flex flex-col items-center">
                  <div className="h-9 w-9 rounded-full border border-[#899B78] bg-[#E8EDE0] shadow-2xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="snail" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              2. Simulation Laboratory
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDEEEB] text-[#D96B50]">
                    <FlaskConical size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Simulation Laboratory
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('simulation')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Simulation Laboratory"
                  aria-label="Open Simulation Laboratory"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Remove species and observe cascading effects. Test how ecosystems respond to different disturbances.
              </p>
            </div>

            {/* Visual Preview: Carp with Red Cross Removal Badge & Red Arrows */}
            <div
              onClick={() => onNavigate('simulation')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 cursor-pointer relative overflow-hidden"
              title="Click to simulate species removal"
            >
              <div className="relative h-48 w-full flex items-center justify-center">
                {/* Radial Disruption Arrows */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrow-red-sim" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#EF9A88" />
                    </marker>
                  </defs>
                  <line x1="45%" y1="42%" x2="28%" y2="26%" stroke="#EF9A88" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-red-sim)" />
                  <line x1="55%" y1="42%" x2="72%" y2="26%" stroke="#EF9A88" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-red-sim)" />
                  <line x1="44%" y1="56%" x2="28%" y2="70%" stroke="#EF9A88" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-red-sim)" />
                  <line x1="56%" y1="56%" x2="72%" y2="70%" stroke="#EF9A88" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-red-sim)" />
                  <line x1="50%" y1="38%" x2="50%" y2="18%" stroke="#EF9A88" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-red-sim)" />
                </svg>

                {/* Central Removed Organism (Carp) with Red Cross Badge */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative h-14 w-14 rounded-full border-2 border-dashed border-[#EF9A88] bg-white shadow-xs flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="carp" size={36} className="opacity-75" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[10.5px] font-bold shadow-xs">
                      ✕
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#D96B50] mt-1">Carp Removed</span>
                </div>

                {/* Surrounding Affected Species */}
                <div className="absolute top-2 left-8 flex items-center gap-1.5 opacity-80">
                  <div className="h-8 w-8 rounded-full border border-[#E5E6DC] bg-white flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="beetle" size={20} />
                  </div>
                </div>
                <div className="absolute top-2 right-8 flex items-center gap-1.5 opacity-80">
                  <div className="h-8 w-8 rounded-full border border-[#E5E6DC] bg-white flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="perch" size={20} />
                  </div>
                </div>
                <div className="absolute bottom-2 left-8 flex items-center gap-1.5 opacity-80">
                  <div className="h-8 w-8 rounded-full border border-[#E5E6DC] bg-white flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="minnow" size={20} />
                  </div>
                </div>
                <div className="absolute bottom-2 right-8 flex items-center gap-1.5 opacity-80">
                  <div className="h-8 w-8 rounded-full border border-[#E5E6DC] bg-white flex items-center justify-center p-1">
                    <SpeciesIcon iconKey="pike" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              3. Cascade Timeline
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF9E7] text-[#D8933B]">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Cascade Timeline
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('timeline')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Timeline"
                  aria-label="Open Timeline"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                See how effects spread through the food web over time. Track population changes round by round.
              </p>
            </div>

            {/* Visual Preview: Round Progression + Time-Series Population Curves */}
            <div
              onClick={() => onNavigate('timeline')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3.5 sm:p-4 cursor-pointer space-y-3"
              title="Click to view Cascade Timeline"
            >
              {/* Step Flow */}
              <div className="flex items-center justify-between text-center border-b border-[#E5E6DC] pb-2.5">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#68716B] uppercase">Initial</p>
                  <div className="h-6 w-6 mx-auto rounded-full bg-white border border-[#35563B] flex items-center justify-center">
                    <SpeciesIcon iconKey="carp" size={14} />
                  </div>
                </div>
                <ArrowRight size={12} className="text-[#899B78]" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#68716B] uppercase">Round 1</p>
                  <div className="h-6 w-6 mx-auto rounded-full bg-white border border-[#EF9A88] flex items-center justify-center">
                    <SpeciesIcon iconKey="minnow" size={14} />
                  </div>
                </div>
                <ArrowRight size={12} className="text-[#899B78]" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#68716B] uppercase">Round 2</p>
                  <div className="h-6 w-6 mx-auto rounded-full bg-white border border-[#F1B36F] flex items-center justify-center">
                    <SpeciesIcon iconKey="snail" size={14} />
                  </div>
                </div>
                <ArrowRight size={12} className="text-[#899B78]" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#68716B] uppercase">Round 3</p>
                  <div className="h-6 w-6 mx-auto rounded-full bg-white border border-[#91BFE0] flex items-center justify-center">
                    <SpeciesIcon iconKey="heron" size={14} />
                  </div>
                </div>
              </div>

              {/* Multi-line Trend Chart */}
              <div className="relative h-24 w-full pt-1">
                <svg className="h-full w-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#E5E6DC" strokeWidth="0.8" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#E5E6DC" strokeWidth="0.8" strokeDasharray="3,3" />

                  {/* Predator line (Red/Coral) starts high, drops */}
                  <path d="M 10,18 C 70,22 150,48 290,65" fill="none" stroke="#EF9A88" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="10" cy="18" r="3" fill="#EF9A88" />
                  <circle cx="100" cy="28" r="3" fill="#EF9A88" />
                  <circle cx="200" cy="56" r="3" fill="#EF9A88" />
                  <circle cx="290" cy="65" r="3" fill="#EF9A88" />

                  {/* Intermediate line (Blue) */}
                  <path d="M 10,48 C 80,32 160,62 290,52" fill="none" stroke="#91BFE0" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="10" cy="48" r="3" fill="#91BFE0" />
                  <circle cx="100" cy="36" r="3" fill="#91BFE0" />
                  <circle cx="200" cy="58" r="3" fill="#91BFE0" />
                  <circle cx="290" cy="52" r="3" fill="#91BFE0" />

                  {/* Prey line (Green) */}
                  <path d="M 10,68 C 90,65 170,38 290,32" fill="none" stroke="#899B78" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="10" cy="68" r="3" fill="#899B78" />
                  <circle cx="100" cy="62" r="3" fill="#899B78" />
                  <circle cx="200" cy="42" r="3" fill="#899B78" />
                  <circle cx="290" cy="32" r="3" fill="#899B78" />
                </svg>

                {/* Legend Chips */}
                <div className="flex items-center justify-end gap-3 text-[10px] text-[#68716B] mt-1">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EF9A88]" /> Predator</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#91BFE0]" /> Intermediate</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#899B78]" /> Prey</span>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              4. Experiment Studio
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF4FA] text-[#4288B8]">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Experiment Studio
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('experiment')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Experiment Studio"
                  aria-label="Open Experiment Studio"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Analyse all species automatically. Identify keystone species, critical nodes and ecosystem vulnerability.
              </p>
            </div>

            {/* Visual Preview: Sensitivity Analysis Bar Chart + Pike Illustration */}
            <div
              onClick={() => onNavigate('experiment')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 cursor-pointer grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              title="Click to launch Experiment Studio"
            >
              <div className="sm:col-span-8 space-y-2">
                <p className="text-[11px] font-bold text-[#202B27]">Sensitivity Analysis</p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-16 text-[#68716B]">Pike</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E5E6DC] overflow-hidden">
                      <div className="h-full bg-[#EF9A88] rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-16 text-[#68716B]">Perch</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E5E6DC] overflow-hidden">
                      <div className="h-full bg-[#F1B36F] rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-16 text-[#68716B]">Carp</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E5E6DC] overflow-hidden">
                      <div className="h-full bg-[#F3D98B] rounded-full" style={{ width: '52%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-16 text-[#68716B]">Snail</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E5E6DC] overflow-hidden">
                      <div className="h-full bg-[#B5D39A] rounded-full" style={{ width: '38%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-16 text-[#68716B]">Zooplankton</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E5E6DC] overflow-hidden">
                      <div className="h-full bg-[#A0A8A3] rounded-full" style={{ width: '22%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fish Illustration Accent */}
              <div className="sm:col-span-4 flex items-center justify-center p-2">
                <SpeciesIcon iconKey="pike" size={72} className="drop-shadow-xs" />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              5. Ecosystem Comparison
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4EFF9] text-[#865DAF]">
                    <GitCompareArrows size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Ecosystem Comparison
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Comparison"
                  aria-label="Open Comparison"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Compare structure, diversity and resilience across different ecosystems (freshwater, terrestrial, marine).
              </p>
            </div>

            {/* Visual Preview: 3 Biome Comparison Columns */}
            <div
              onClick={() => onNavigate('compare')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3.5 sm:p-4 cursor-pointer grid grid-cols-3 gap-2.5 text-center"
              title="Click to compare ecosystems"
            >
              {/* Freshwater */}
              <div className="space-y-2 p-2 rounded-lg bg-white border border-[#E5E6DC] shadow-2xs">
                <div className="h-12 w-full rounded overflow-hidden">
                  <img src="/hero-freshwater-artwork.png" alt="Freshwater" className="h-full w-full object-cover" />
                </div>
                <p className="text-[10.5px] font-bold text-[#202B27]">Freshwater</p>
                <div className="flex justify-center items-center gap-1 text-[9.5px] text-[#35563B] font-medium">
                  <span>15 Taxa</span> · <span>46 Links</span>
                </div>
              </div>

              {/* Terrestrial */}
              <div className="space-y-2 p-2 rounded-lg bg-white border border-[#E5E6DC] shadow-2xs">
                <div className="h-12 w-full rounded bg-gradient-to-br from-[#B5D39A] to-[#899B78] flex items-center justify-center text-white text-[10.5px] font-bold">
                  Terrestrial
                </div>
                <p className="text-[10.5px] font-bold text-[#202B27]">Grassland</p>
                <div className="flex justify-center items-center gap-1 text-[9.5px] text-[#C06918] font-medium">
                  <span>52 Taxa</span> · <span>248 Links</span>
                </div>
              </div>

              {/* Marine */}
              <div className="space-y-2 p-2 rounded-lg bg-white border border-[#E5E6DC] shadow-2xs">
                <div className="h-12 w-full rounded bg-gradient-to-br from-[#91BFE0] to-[#35563B] flex items-center justify-center text-white text-[10.5px] font-bold">
                  Marine
                </div>
                <p className="text-[10.5px] font-bold text-[#202B27]">Ythan</p>
                <div className="flex justify-center items-center gap-1 text-[9.5px] text-[#1B7285] font-medium">
                  <span>38 Taxa</span> · <span>142 Links</span>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              6. Conservation Atlas
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2F1] text-[#00796B]">
                    <Globe2 size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Conservation Atlas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('conservation')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Conservation Atlas"
                  aria-label="Open Conservation Atlas"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Explore empirical biomes, documented trophic layer distributions and peer-reviewed research profiles across ecological domains.
              </p>
            </div>

            {/* Visual Preview: 3 Biome Summary Badges & Research Cards */}
            <div
              onClick={() => onNavigate('conservation')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3.5 sm:p-4 cursor-pointer space-y-2.5"
              title="Click to view Conservation Atlas"
            >
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-cyan-50/70 border border-cyan-200">
                  <p className="font-bold text-[#202B27] text-[11px]">Marine</p>
                  <p className="text-[10px] text-cyan-800">High connectance</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <p className="font-bold text-[#202B27] text-[11px]">Freshwater</p>
                  <p className="text-[10px] text-emerald-800">Trophic cascades</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                  <p className="font-bold text-[#202B27] text-[11px]">Terrestrial</p>
                  <p className="text-[10px] text-amber-800">High richness</p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#E5E6DC] flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#202B27]">Dryad & Peer-Reviewed Sources</span>
                <span className="text-[#35563B] font-bold text-[10px] uppercase tracking-wider">CC0 1.0 Verified</span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              7. Research Library
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF5E8] text-[#35563B]">
                    <BookOpenCheck size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Research Library
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Research Library"
                  aria-label="Open Research Library"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Explore 6 real-world ecosystems with verified datasets from scientific literature.
              </p>
            </div>

            {/* Visual Preview: 6 Verified Research Datasets Grid */}
            <div
              onClick={() => onNavigate('library')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3 cursor-pointer grid grid-cols-2 sm:grid-cols-3 gap-2"
              title="Click to browse Research Library"
            >
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Pond 47</p>
                <span className="inline-block rounded bg-[#E8EDE0] px-1.5 py-0.5 text-[9px] font-medium text-[#35563B]">
                  Freshwater
                </span>
              </div>
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Ythan Estuary</p>
                <span className="inline-block rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-medium text-[#1B7285]">
                  Marine
                </span>
              </div>
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Chesapeake Bay</p>
                <span className="inline-block rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-medium text-[#1B7285]">
                  Marine
                </span>
              </div>
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Grassland</p>
                <span className="inline-block rounded bg-[#FEF4E8] px-1.5 py-0.5 text-[9px] font-medium text-[#C06918]">
                  Terrestrial
                </span>
              </div>
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Silwood Park</p>
                <span className="inline-block rounded bg-[#FEF4E8] px-1.5 py-0.5 text-[9px] font-medium text-[#C06918]">
                  Terrestrial
                </span>
              </div>
              <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[#202B27] truncate">Little Rock Lake</p>
                <span className="inline-block rounded bg-[#E8EDE0] px-1.5 py-0.5 text-[9px] font-medium text-[#35563B]">
                  Freshwater
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              8. Dataset Import
              ------------------------------------------------------------------- */}
          <div className="group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2E7] text-[#D87D3B]">
                    <Upload size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Dataset Import
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('import')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Import dataset"
                  aria-label="Import dataset"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Use your own food web data (CSV / JSON) to build and analyse custom ecosystems.
              </p>
            </div>

            {/* Visual Preview: Drag & Drop Area + Example CSV Table */}
            <div
              onClick={() => onNavigate('import')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3.5 cursor-pointer grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              title="Click to import your custom dataset"
            >
              <div className="sm:col-span-5 border-2 border-dashed border-[#E5E6DC] rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white shadow-2xs">
                <Upload size={22} className="text-[#35563B] mb-1" />
                <p className="text-[11px] font-bold text-[#202B27]">Upload Dataset</p>
                <p className="text-[9.5px] text-[#68716B]">CSV or JSON</p>
              </div>

              <div className="sm:col-span-7 bg-white rounded-xl border border-[#E5E6DC] p-2.5 shadow-2xs">
                <p className="text-[10px] font-bold text-[#68716B] uppercase mb-1">Example Format (CSV)</p>
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-[#E5E6DC] text-[#35563B]">
                      <th className="pb-1">Predator</th>
                      <th className="pb-1">Prey</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#68716B] divide-y divide-[#E5E6DC]/60">
                    <tr>
                      <td className="py-0.5 font-medium text-[#202B27]">Pike</td>
                      <td className="py-0.5">Carp</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-[#202B27]">Carp</td>
                      <td className="py-0.5">Snail</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-[#202B27]">Heron</td>
                      <td className="py-0.5">Pike</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-[#202B27]">Perch</td>
                      <td className="py-0.5">Zooplankton</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              9. Methodology & Validation
              ------------------------------------------------------------------- */}
          <div className="md:col-span-2 group rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-6 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFEA] text-[#263D2D]">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#202B27] group-hover:text-[#35563B] transition-colors">
                    Methodology & Validation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('methodology')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
                  title="Open Methodology"
                  aria-label="Open Methodology"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                Learn about the models, formulas, assumptions and validation tests used in the platform.
              </p>
            </div>

            {/* Visual Preview: Population Update Formula + Interactive Test Chips */}
            <div
              onClick={() => onNavigate('methodology')}
              className="mt-5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 cursor-pointer space-y-3"
              title="Click to view mathematical models and live test runner"
            >
              <div className="bg-white rounded-lg border border-[#E5E6DC] p-3 text-center shadow-2xs">
                <p className="text-[10px] font-bold text-[#68716B] uppercase mb-1">Population Update Formulation</p>
                <div className="font-mono text-xs sm:text-[13px] text-[#202B27] tracking-tight overflow-x-auto py-1">
                  N<sub>i</sub>(t+1) = N<sub>i</sub>(t) + r<sub>i</sub>N<sub>i</sub>(t)(1 - N<sub>i</sub>(t)/K<sub>i</sub>) - &Sigma;<sub>j</sub> &alpha;<sub>ij</sub>N<sub>i</sub>(t)N<sub>j</sub>(t)
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
                <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 flex flex-col items-center gap-1 hover:border-[#35563B] transition-colors shadow-2xs">
                  <Settings2 size={14} className="text-[#35563B]" />
                  <span className="font-semibold text-[#202B27]">Model Assumptions</span>
                </div>
                <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 flex flex-col items-center gap-1 hover:border-[#35563B] transition-colors shadow-2xs">
                  <BarChart3 size={14} className="text-[#35563B]" />
                  <span className="font-semibold text-[#202B27]">Validation Tests</span>
                </div>
                <div className="rounded-lg bg-white border border-[#E5E6DC] p-2 flex flex-col items-center gap-1 hover:border-[#35563B] transition-colors shadow-2xs">
                  <FileText size={14} className="text-[#35563B]" />
                  <span className="font-semibold text-[#202B27]">References</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
