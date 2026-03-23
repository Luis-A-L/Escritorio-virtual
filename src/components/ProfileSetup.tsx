import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Gender, EducationLevel, Team, Player } from '../types';

interface ProfileSetupProps {
  currentUser: User;
  existingProfile?: Player | null;
  onComplete: () => void;
}

const TEAMS: Team[] = ['Triagem Cível', 'Triagem Crime', 'Retorno Crime', 'Retorno Cível', 'Controle', 'I.A.'];
const EDUCATION_LEVELS: EducationLevel[] = ['Ensino Médio', 'Graduação', 'Pós-graduação'];

export default function ProfileSetup({ currentUser, existingProfile, onComplete }: ProfileSetupProps) {
  const [name, setName] = useState(existingProfile?.name || currentUser.displayName || '');
  const [gender, setGender] = useState<Gender>(existingProfile?.gender || 'male');
  const [education, setEducation] = useState<EducationLevel>(existingProfile?.education || 'Graduação');
  const [team, setTeam] = useState<Team>(existingProfile?.team || 'Triagem Cível');
  const [avatar, setAvatar] = useState(existingProfile?.avatar || 'm1');
  const [loading, setLoading] = useState(false);

  const avatars = gender === 'male' ? ['m1', 'm2', 'm3'] : ['f1', 'f2', 'f3'];

  // Ensure avatar matches gender if gender changes
  React.useEffect(() => {
    if (gender === 'male' && avatar.startsWith('f')) setAvatar('m1');
    if (gender === 'female' && avatar.startsWith('m')) setAvatar('f1');
  }, [gender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (existingProfile) {
        await updateDoc(userRef, {
          name,
          gender,
          education,
          team,
          avatar
        });
      } else {
        await setDoc(userRef, {
          uid: currentUser.uid,
          name,
          email: currentUser.email || '',
          avatar,
          x: 500,
          y: 500,
          direction: 'down',
          isOnline: true,
          lastActive: Date.now(),
          gender,
          education,
          team
        });
      }
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 font-mono">
      <div className="bg-[#1a1a2e] border-4 border-[#00ff88] rounded-xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(0,255,136,0.3)]">
        <h2 className="text-2xl font-bold text-[#00ff88] mb-6 text-center">
          {existingProfile ? 'EDITAR PERFIL' : 'CRIAR PERSONAGEM'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">NOME</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1">SEXO</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-xs mb-1">ESCOLARIDADE</label>
              <select 
                value={education}
                onChange={(e) => setEducation(e.target.value as EducationLevel)}
                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
              >
                {EDUCATION_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">ÁREA DE TRABALHO</label>
            <select 
              value={team}
              onChange={(e) => setTeam(e.target.value as Team)}
              className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            >
              {TEAMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-2">APARÊNCIA</label>
            <div className="flex gap-4 justify-center">
              {avatars.map(a => (
                <div 
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-12 h-12 rounded cursor-pointer border-2 flex items-center justify-center text-2xl ${avatar === a ? 'border-[#00ff88] bg-[#00ff88]/20' : 'border-gray-600 bg-black hover:border-gray-400'}`}
                >
                  {a === 'm1' ? '👨' : a === 'm2' ? '👨🏻' : a === 'm3' ? '👨🏽' : a === 'f1' ? '👩' : a === 'f2' ? '👩🏻' : '👩🏽'}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="w-full bg-[#00ff88] text-black font-bold py-3 px-4 rounded hover:bg-[#00cc6a] transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'SALVANDO...' : 'ENTRAR NO ESCRITÓRIO'}
          </button>
        </form>
      </div>
    </div>
  );
}
