
import React, { useState } from 'react';
import { PetName, Species, AppState, UserSession } from './types';
import { generatePetNames } from './services/geminiService';
import SwipeCard from './components/SwipeCard';

const speciesMap: Record<Species, string> = {
  'Dog': 'Perro',
  'Cat': 'Gato',
  'Hamster': 'Hámster',
  'Bird': 'Pájaro',
  'Rabbit': 'Conejo',
  'Reptile': 'Reptil',
  'Other': 'Otro'
};

// Utilities for simple encoding/decoding to share state via text
const encodeData = (data: any) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decodeData = (str: string) => JSON.parse(decodeURIComponent(escape(atob(str))));

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: 'landing',
    currentSpecies: 'Dog',
    names: [],
    currentUser: { userId: '1', userName: 'Anfitrión', likes: [] },
    importedSessions: [],
    isHost: true,
    isLoading: false,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputCode, setInputCode] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // --- NAVIGATION ---

  const goToSpeciesSelection = () => {
    setState(prev => ({ ...prev, mode: 'species-selection', isHost: true }));
  };

  const goToJoinSession = () => {
    setState(prev => ({ ...prev, mode: 'join-session', isHost: false }));
  };

  const resetAll = () => {
    setState({
      mode: 'landing',
      currentSpecies: 'Dog',
      names: [],
      currentUser: { userId: '1', userName: 'Anfitrión', likes: [] },
      importedSessions: [],
      isHost: true,
      isLoading: false,
    });
    setCurrentIndex(0);
    setInputCode('');
  };

  // --- HOST FLOW ---

  const startAsHost = async (species: Species) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentSpecies: species,
      currentUser: { ...prev.currentUser, userId: 'host', userName: 'Tú' }
    }));

    try {
      const names = await generatePetNames(species);
      setState(prev => ({ 
        ...prev, 
        names, 
        mode: 'share-session', 
        isLoading: false 
      }));
    } catch (error) {
      console.error("Error generating names:", error);
      setState(prev => ({ ...prev, isLoading: false, mode: 'landing' }));
      alert("No pudimos conectar con la inspiración. Inténtalo de nuevo.");
    }
  };

  // --- GUEST FLOW ---

  const processJoinCode = () => {
    try {
      const data = decodeData(inputCode);
      if (!data.names || !Array.isArray(data.names)) throw new Error("Código inválido");
      
      setState(prev => ({
        ...prev,
        names: data.names,
        currentSpecies: data.species,
        mode: 'swiping',
        currentUser: { ...prev.currentUser, userId: 'guest', userName: 'Tú' }
      }));
      setCurrentIndex(0);
      setInputCode('');
    } catch (e) {
      alert("El código parece incorrecto. Asegúrate de copiarlo completo.");
    }
  };

  // --- SWIPING LOGIC ---

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentName = state.names[currentIndex];
    
    if (direction === 'right') {
      setState(prev => ({
        ...prev,
        currentUser: {
          ...prev.currentUser,
          likes: [...prev.currentUser.likes, currentName.id]
        }
      }));
    }

    if (currentIndex + 1 >= state.names.length) {
      finishSwiping();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const skipRemaining = () => {
    finishSwiping();
  };

  const finishSwiping = () => {
    setState(prev => ({ ...prev, mode: 'share-results' }));
  };

  // --- SYNC RESULTS (PARTY MODE) ---

  const addPartnerResults = () => {
    try {
      const data = decodeData(inputCode);
      if (!Array.isArray(data.likes)) throw new Error("Código de resultados inválido");
      
      // Add these likes to our list of imported sessions
      setState(prev => ({
        ...prev,
        importedSessions: [...prev.importedSessions, data.likes],
      }));
      
      setInputCode(''); // Clear input for the next person
      alert("¡Votos añadidos! Puedes añadir más amigos o ver las coincidencias abajo.");
    } catch (e) {
      alert("Código de resultados inválido. Verifica que copiaste todo el texto.");
    }
  };

  // --- HELPERS ---

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('¡Copiado!');
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  const getSessionCode = () => {
    return encodeData({ names: state.names, species: state.currentSpecies });
  };

  const getResultsCode = () => {
    return encodeData({ likes: state.currentUser.likes });
  };

  // --- RENDERERS ---

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 p-6">
        <div className="w-20 h-20 border-t-4 border-b-4 border-pink-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-3xl font-brand italic text-gray-800 animate-pulse text-center">
          Invocando nombres...
        </h2>
      </div>
    );
  }

  // 1. LANDING SCREEN (Start)
  if (state.mode === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-[-10%] right-[-10%] text-[20rem] opacity-5 text-pink-200 pointer-events-none font-brand italic">N</div>
        <div className="absolute bottom-[-10%] left-[-10%] text-[20rem] opacity-5 text-gray-200 pointer-events-none font-brand italic">C</div>

        <h1 className="text-6xl text-pink-600 mb-2 font-brand italic tracking-wide text-center z-10">ConraNamesIt</h1>
        <p className="text-gray-500 mb-12 text-center font-light z-10 max-w-xs">Donde las mejores decisiones se toman en conjunto.</p>
        
        <div className="w-full max-w-md space-y-6 z-10">
          <button 
            onClick={goToSpeciesSelection}
            className="w-full py-6 bg-pink-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-pink-700 transition-all transform hover:-translate-y-1 flex flex-col items-center"
          >
            <span>Crear Partida</span>
            <span className="text-xs font-normal opacity-80 mt-1">Generar código y ser anfitrión</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-brand italic">o</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button 
            onClick={goToJoinSession}
            className="w-full py-6 bg-white text-gray-800 border-2 border-gray-100 rounded-2xl font-bold text-xl shadow-lg hover:bg-gray-50 transition-all transform hover:-translate-y-1 flex flex-col items-center"
          >
            <span>Unirse a Partida</span>
            <span className="text-xs font-normal text-gray-400 mt-1">Si ya tienes un código de invitación</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. SPECIES SELECTION (Host Step 1)
  if (state.mode === 'species-selection') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center">
        <button onClick={resetAll} className="absolute top-6 left-6 text-gray-400 hover:text-pink-600 transition-colors">← Volver</button>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center font-brand italic">Elige la Musa</h3>
          <p className="text-sm text-gray-400 text-center mb-8">¿Qué tipo de mascota vamos a nombrar?</p>
          <div className="grid grid-cols-2 gap-4">
            {(['Dog', 'Cat', 'Hamster', 'Bird', 'Rabbit', 'Other'] as Species[]).map(s => (
              <button
                key={s}
                onClick={() => startAsHost(s)}
                className="p-4 rounded-xl border border-pink-100 hover:border-pink-400 hover:bg-pink-50 transition-all flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {s === 'Dog' && '🐶'}
                  {s === 'Cat' && '🐱'}
                  {s === 'Hamster' && '🐹'}
                  {s === 'Bird' && '🦜'}
                  {s === 'Rabbit' && '🐰'}
                  {s === 'Other' && '🐾'}
                </span>
                <span className="font-semibold text-gray-600 group-hover:text-pink-600">{speciesMap[s]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. SHARE SESSION (Host Step 2 - The "Generate Code" Screen)
  if (state.mode === 'share-session') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎫</div>
          <h2 className="text-2xl font-brand italic font-bold text-gray-800 mb-2">Código de Fiesta</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Comparte este código con todos los participantes. Todos verán los mismos nombres.
          </p>

          <button 
            onClick={() => copyToClipboard(getSessionCode())}
            className="w-full bg-pink-50 text-pink-700 py-4 rounded-xl font-bold border-2 border-pink-200 mb-2 hover:bg-pink-100 transition-colors relative break-all"
          >
            {copyFeedback || "Copiar Código"}
          </button>
          <p className="text-xs text-gray-400 mb-8">Mándalo por WhatsApp a tu grupo.</p>

          <button 
            onClick={() => setState(prev => ({ ...prev, mode: 'swiping' }))}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-colors"
          >
            Soy el Anfitrión, ¡Empezar!
          </button>
        </div>
      </div>
    );
  }

  // 4. JOIN SESSION (Guest Step 1)
  if (state.mode === 'join-session') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
          <button onClick={resetAll} className="absolute top-6 left-6 text-gray-300 hover:text-gray-600">✕</button>
          <h2 className="text-2xl font-brand italic font-bold text-gray-800 mb-6 text-center mt-4">Unirse a la Fiesta</h2>
          
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Pega aquí el código que te envió el anfitrión..."
            className="w-full h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-pink-500 outline-none resize-none text-xs mb-4 text-gray-600 font-mono"
          />

          <button 
            onClick={processJoinCode}
            disabled={!inputCode}
            className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 hover:bg-pink-700 transition-colors"
          >
            ¡Vamos!
          </button>
        </div>
      </div>
    );
  }

  // 5. SWIPING INTERFACE
  if (state.mode === 'swiping') {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col overflow-hidden">
        <header className="p-4 flex justify-between items-center z-50">
          <button onClick={resetAll} className="text-gray-400 text-sm font-medium hover:text-red-500">Salir</button>
          <span className="font-brand italic font-bold text-xl text-gray-800">ConraNamesIt</span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 relative flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm h-[450px]">
            {state.names.slice(currentIndex, currentIndex + 3).reverse().map((name, idx) => (
              <SwipeCard
                key={name.id}
                petName={name}
                onSwipe={handleSwipe}
                index={idx}
              />
            ))}
          </div>
        </main>

        <footer className="p-6 pb-10 flex justify-center z-50">
           <button 
             onClick={skipRemaining}
             className="px-6 py-3 bg-white text-gray-500 rounded-full text-sm font-bold border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-pink-500 transition-colors flex items-center gap-2"
           >
             <span>⏹</span> Saltar restantes y ver resultados
           </button>
        </footer>
      </div>
    );
  }

  // 6. SHARE RESULTS & MATCHING (Unified Party Screen)
  if (state.mode === 'share-results') {
    // Logic: A name is a match if the current user likes it AND it appears in AT LEAST ONE imported session (or all, depending on rule).
    // Let's go with: Show names that have > 1 vote (Current User + at least one friend).
    
    // Flatten all likes (mine + imported) to count frequency
    const allVotes = [state.currentUser.likes, ...state.importedSessions].flat();
    const voteCounts: Record<string, number> = {};
    allVotes.forEach(id => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });

    // Determine matches (Items with > 1 vote if friends added, otherwise just show my likes)
    const hasFriends = state.importedSessions.length > 0;
    const matches = state.names.filter(name => {
      if (!hasFriends) return false; // No matches until friends added
      return (voteCounts[name.id] || 0) > 1; // At least 2 people liked it
    }).sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)); // Sort by popularity

    return (
      <div className="min-h-screen bg-pink-50 flex flex-col">
         <header className="p-6 bg-white shadow-sm flex justify-between items-center z-10">
          <h1 className="text-xl font-brand italic font-bold text-gray-800">Sala de Resultados</h1>
          <button onClick={resetAll} className="text-gray-400 text-sm">Salir</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-32">
          {/* Section: Matches */}
          {hasFriends ? (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-pink-600 mb-4 flex items-center gap-2">
                <span>🏆</span> Coincidencias de la Fiesta
              </h3>
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {matches.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-lg font-bold">
                          {m.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.meaning}</div>
                        </div>
                      </div>
                      <div className="bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {voteCounts[m.id]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">Aún no hay coincidencias con los amigos añadidos.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-gray-600 font-medium">Esperando a los amigos...</p>
              <p className="text-sm text-gray-400">Añade sus códigos abajo para ver coincidencias.</p>
            </div>
          )}

          {/* Section: My Code */}
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border-l-4 border-pink-500">
            <h4 className="font-bold text-gray-800 mb-2">1. Tu Código de Votos</h4>
            <p className="text-xs text-gray-500 mb-4">Envía esto al grupo para que te añadan.</p>
            <button 
              onClick={() => copyToClipboard(getResultsCode())}
              className="w-full bg-gray-50 text-gray-700 py-3 rounded-lg font-bold border border-gray-200 text-sm hover:bg-gray-100"
            >
              {copyFeedback || "Copiar Mis Votos"}
            </button>
          </div>

          {/* Section: Add Friends */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-gray-800">
            <h4 className="font-bold text-gray-800 mb-2">2. Añadir Amigo</h4>
            <p className="text-xs text-gray-500 mb-4">Pega el código de un amigo aquí.</p>
            <div className="flex gap-2">
              <input 
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Pegar código..."
                className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm"
              />
              <button 
                onClick={addPartnerResults}
                disabled={!inputCode}
                className="bg-gray-800 text-white px-4 rounded-lg font-bold text-sm disabled:opacity-50"
              >
                Añadir
              </button>
            </div>
            {state.importedSessions.length > 0 && (
              <div className="mt-4 text-xs text-gray-400 text-right">
                {state.importedSessions.length} amigos añadidos
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default App;
