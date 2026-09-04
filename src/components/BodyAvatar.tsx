import { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Dumbbell, ShieldAlert } from 'lucide-react';

interface BodyAvatarProps {
  gender?: 'male' | 'female' | 'neutral';
  bodyFat?: number; // percentage (e.g. 15)
  muscleMass?: number; // percentage (e.g. 40)
  chest?: number; // cm
  waist?: number; // cm
  bicepLeft?: number; // cm
  bicepRight?: number; // cm
  thighLeft?: number; // cm
  thighRight?: number; // cm
  hip?: number; // cm
  calfLeft?: number; // cm
  calfRight?: number; // cm
}

export default function BodyAvatar({
  gender: initialGender = 'neutral',
  bodyFat = 20,
  muscleMass = 35,
  chest = 95,
  waist = 80,
  bicepLeft = 32,
  bicepRight = 32,
  thighLeft = 55,
  thighRight = 55,
  hip = 95,
  calfLeft = 36,
  calfRight = 36
}: BodyAvatarProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>(initialGender);
  const [view, setView] = useState<'musculo' | 'gordura' | 'medidas'>('medidas');

  // Normalized values for SVG morphing (0.5 is baseline)
  // Base fat level around 15-20% is baseline 1.
  const fatFactor = Math.max(0.6, Math.min(2.0, bodyFat / 20));
  // Base muscle level around 35% is baseline 1.
  const muscleFactor = Math.max(0.7, Math.min(1.8, muscleMass / 35));

  // Individual measurement multipliers
  const chestMult = Math.max(0.8, Math.min(1.5, chest / 95));
  const waistMult = Math.max(0.7, Math.min(1.6, waist / 80));
  const bicepMult = Math.max(0.8, Math.min(1.6, ((bicepLeft + bicepRight) / 2) / 32));
  const thighMult = Math.max(0.8, Math.min(1.5, ((thighLeft + thighRight) / 2) / 55));
  const hipMult = Math.max(0.8, Math.min(1.5, hip / 95));
  const calfMult = Math.max(0.8, Math.min(1.5, ((calfLeft + calfRight) / 2) / 36));

  // Determine silhouette morph widths based on gender and factors
  const isFemale = gender === 'female';
  const isMale = gender === 'male';

  // Base SVG Widths mapped to dynamic proportions
  const headSize = 18;
  const neckWidth = 12 * (isMale ? 1.2 : 0.9) * muscleFactor;
  const shoulderWidth = 56 * (isMale ? 1.15 : 0.85) * chestMult * muscleFactor;
  const chestWidth = 48 * (isMale ? 1.1 : 0.85) * chestMult * muscleFactor;
  const waistWidth = 36 * (isFemale ? 0.8 : 1.0) * waistMult * fatFactor;
  const hipWidth = 44 * (isFemale ? 1.15 : 0.95) * hipMult * fatFactor;
  const armThickness = 12 * bicepMult * muscleFactor;
  const thighThickness = 16 * thighMult * (fatFactor * 0.3 + muscleFactor * 0.7);
  const calfThickness = 10 * calfMult;

  // Render SVG colors based on 'view' heatmap (muscle vs fat)
  const getPartColor = (partType: 'muscle' | 'fat' | 'neutral') => {
    if (view === 'musculo') {
      return partType === 'muscle' 
        ? `rgba(236, 72, 153, ${0.4 + muscleFactor * 0.4})` // Pink intensity for muscle
        : 'rgba(251, 235, 240, 0.5)';
    }
    if (view === 'gordura') {
      return partType === 'fat'
        ? `rgba(212, 175, 55, ${0.3 + fatFactor * 0.4})` // Gold intensity for storage areas
        : 'rgba(251, 235, 240, 0.5)';
    }
    // Default measurement/normal view (sleek rose-50 or select state pink-500)
    return selectedPart === partType ? '#ec4899' : '#fff1f2';
  };

  const getPartStroke = (partType: string) => {
    if (selectedPart === partType) return '#d4af37'; // gold highlight
    return '#fbcfe8'; // pink-200
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-pink-100 flex flex-col items-center gap-6 relative overflow-hidden shadow-sm shadow-pink-100/20">
      {/* Control Buttons */}
      <div className="flex justify-between items-center w-full z-10 flex-wrap gap-2">
        <div className="flex bg-pink-50/50 p-1 rounded-xl border border-pink-100 gap-1 text-[10px]">
          {(['neutral', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                gender === g ? 'bg-pink-500 text-white shadow-sm shadow-pink-200' : 'text-zinc-500 hover:text-pink-600'
              }`}
            >
              {g === 'neutral' ? 'Unissex' : g === 'male' ? 'Masc' : 'Fem'}
            </button>
          ))}
        </div>

        <div className="flex bg-pink-50/50 p-1 rounded-xl border border-pink-100 gap-1 text-[10px]">
          {(['medidas', 'musculo', 'gordura'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                view === v ? 'bg-white text-pink-500 border border-pink-200/50' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {v === 'medidas' ? 'Medidas' : v === 'musculo' ? 'Músculo' : 'Gordura'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-center">
        {/* SVG Representation */}
        <div className="flex justify-center relative">
          <svg
            width="200"
            height="340"
            viewBox="0 0 200 340"
            className="drop-shadow-[0_0_15px_rgba(236,72,153,0.08)]"
          >
            <g transform="translate(100, 10)">
              {/* Head */}
              <circle
                cx="0"
                cy="25"
                r={headSize}
                fill={getPartColor('neutral')}
                stroke={getPartStroke('head')}
                strokeWidth="2"
                onClick={() => setSelectedPart('head')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Neck */}
              <polygon
                points={`-${neckWidth/2},43 ${neckWidth/2},43 ${neckWidth/2*1.2},55 -${neckWidth/2*1.2},55`}
                fill={getPartColor('neutral')}
                stroke={getPartStroke('neck')}
                strokeWidth="2"
                onClick={() => setSelectedPart('neck')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Chest / Shoulders */}
              <path
                d={`M -${shoulderWidth/2} 55 
                    L ${shoulderWidth/2} 55 
                    L ${chestWidth/2} 90 
                    L -${chestWidth/2} 90 Z`}
                fill={getPartColor('muscle')}
                stroke={getPartStroke('chest')}
                strokeWidth="2"
                onClick={() => setSelectedPart('chest')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Abs / Waist */}
              <path
                d={`M -${chestWidth/2} 90 
                    L ${chestWidth/2} 90 
                    L ${waistWidth/2} 130 
                    L -${waistWidth/2} 130 Z`}
                fill={getPartColor('fat')}
                stroke={getPartStroke('waist')}
                strokeWidth="2"
                onClick={() => setSelectedPart('waist')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Hips / Pelvis */}
              <path
                d={`M -${waistWidth/2} 130 
                    L ${waistWidth/2} 130 
                    L ${hipWidth/2} 165 
                    L -${hipWidth/2} 165 Z`}
                fill={getPartColor('fat')}
                stroke={getPartStroke('hip')}
                strokeWidth="2"
                onClick={() => setSelectedPart('hip')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Left Arm (Bicep/Forearm) */}
              <path
                d={`M -${shoulderWidth/2} 55
                    L -${shoulderWidth/2 + armThickness} 90
                    L -${shoulderWidth/2 + armThickness * 0.8} 140
                    L -${shoulderWidth/2 - 4} 140
                    L -${chestWidth/2} 90 Z`}
                fill={getPartColor('muscle')}
                stroke={getPartStroke('arms')}
                strokeWidth="2"
                onClick={() => setSelectedPart('arms')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Right Arm (Bicep/Forearm) */}
              <path
                d={`M ${shoulderWidth/2} 55
                    L ${shoulderWidth/2 + armThickness} 90
                    L ${shoulderWidth/2 + armThickness * 0.8} 140
                    L ${shoulderWidth/2 - 4} 140
                    L ${chestWidth/2} 90 Z`}
                fill={getPartColor('muscle')}
                stroke={getPartStroke('arms')}
                strokeWidth="2"
                onClick={() => setSelectedPart('arms')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Left Leg (Thigh) */}
              <path
                d={`M -${hipWidth/2 - 4} 165
                    L -${hipWidth/2 - 2} 175
                    L -${thighThickness + 10} 240
                    L -12 240
                    L -4 165 Z`}
                fill={getPartColor('muscle')}
                stroke={getPartStroke('thighs')}
                strokeWidth="2"
                onClick={() => setSelectedPart('thighs')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Right Leg (Thigh) */}
              <path
                d={`M 4 165
                    L 12 240
                    L ${thighThickness + 10} 240
                    L ${hipWidth/2 - 2} 175
                    L ${hipWidth/2 - 4} 165 Z`}
                fill={getPartColor('muscle')}
                stroke={getPartStroke('thighs')}
                strokeWidth="2"
                onClick={() => setSelectedPart('thighs')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Left Calf / Lower Leg */}
              <path
                d={`M -${thighThickness + 10} 240
                    L -${calfThickness + 12} 310
                    L -18 315
                    L -12 240 Z`}
                fill={getPartColor('neutral')}
                stroke={getPartStroke('calves')}
                strokeWidth="2"
                onClick={() => setSelectedPart('calves')}
                className="cursor-pointer transition-all duration-300"
              />

              {/* Right Calf / Lower Leg */}
              <path
                d={`M 12 240
                    L 18 315
                    L ${calfThickness + 12} 310
                    L ${thighThickness + 10} 240 Z`}
                fill={getPartColor('neutral')}
                stroke={getPartStroke('calves')}
                strokeWidth="2"
                onClick={() => setSelectedPart('calves')}
                className="cursor-pointer transition-all duration-300"
              />
            </g>
          </svg>
        </div>

        {/* Info & Insights HUD Panel */}
        <div className="bg-[#fff9fc] p-5 rounded-2xl border border-pink-100/50 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <UserIcon size={16} className="text-[#d4af37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">HUD BioForma Feminino</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-zinc-600 mb-1">
                <span>Gordura Corporal</span>
                <span className="font-bold text-[#d4af37]">{bodyFat}%</span>
              </div>
              <div className="w-full bg-pink-100/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, bodyFat * 2.5)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-600 mb-1">
                <span>Massa Magra (Músculo)</span>
                <span className="font-bold text-pink-500">{muscleMass}%</span>
              </div>
              <div className="w-full bg-pink-100/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-pink-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, muscleMass * 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Highlights of selected muscles/measurements */}
          <div className="border-t border-pink-100/60 pt-3 mt-2 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Foco Anatômico</h4>
            {selectedPart ? (
              <div className="p-3 bg-white rounded-xl border border-pink-100 animate-fade-in">
                {selectedPart === 'chest' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Peitoral / Tórax</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1">{chest} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Multiplicador de escala: {chestMult.toFixed(2)}x. Escala de tórax influenciada por massa magra e bioimpedância.</p>
                  </div>
                )}
                {selectedPart === 'waist' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Cintura / Abdômen</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1">{waist} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Multiplicador: {waistMult.toFixed(2)}x. Região impactada diretamente por ingestão calórica e gordura visceral.</p>
                  </div>
                )}
                {selectedPart === 'arms' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Bíceps / Braços</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1">Esq: {bicepLeft} cm | Dir: {bicepRight} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Bíceps e antebraços alargados de acordo com sua massa magra. Mantenha os treinos de força!</p>
                  </div>
                )}
                {selectedPart === 'thighs' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Coxas / Quadríceps</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1 font-mono">Esq: {thighLeft} cm | Dir: {thighRight} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Volume de quadríceps de acordo com medidas e percentual de massa magra de bioimpedância.</p>
                  </div>
                )}
                {selectedPart === 'hip' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Quadril</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1">{hip} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Proporção pélvica de acordo com quadril cadastrado. Importante para o índice de adiposidade corporal.</p>
                  </div>
                )}
                {selectedPart === 'calves' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Panturrilhas</div>
                    <div className="text-lg font-bold text-zinc-800 mt-1 font-mono">Esq: {calfLeft} cm | Dir: {calfRight} cm</div>
                    <p className="text-[10px] text-zinc-400 mt-1">A panturrilha reflete a estabilidade e sustentação do core corporal inferior.</p>
                  </div>
                )}
                {selectedPart === 'head' && (
                  <div>
                    <div className="text-xs font-black text-[#d4af37] uppercase">Mente & Foco</div>
                    <p className="text-[10px] text-zinc-500 mt-1">Mente forte, corpo forte. A disciplina diária nos treinos potencializa a neuroplasticidade e o bem-estar mental!</p>
                  </div>
                )}
                {selectedPart === 'neck' && (
                  <div>
                    <div className="text-xs font-black text-pink-500 uppercase">Pescoço</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Interligação do sistema nervoso central com o core de sustentação de cargas.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-zinc-400 text-[11px] italic flex items-center gap-1.5">
                <Dumbbell size={12} className="text-pink-400" />
                Toque em qualquer parte do avatar para inspecionar métricas de evolução.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
