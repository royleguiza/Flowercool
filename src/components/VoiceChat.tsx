import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Users, MessageSquare, Send, Radio } from 'lucide-react';
import { VoiceMessage } from '../types';

interface VoiceChatProps {
  username: string;
  onSendChat?: (text: string) => void;
  chatMessages: VoiceMessage[];
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  username,
  onSendChat,
  chatMessages,
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('Alpha Team (Multiplayer)');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [simulatedSpeakers, setSimulatedSpeakers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Strategic pre-recorded quick triggers
  const strategicTriggers = [
    { text: "Protect the Weed core! 🌸", label: "Defend" },
    { text: "Unite to attack the Mega Boss Weed! ⚔️", label: "Boss Attack" },
    { text: "Sharing nectar! Come heal here! ❤️", label: "Heal Spot" },
    { text: "Watch out, he is in RAGE mode! 😡", label: "Rage Danger" },
    { text: "Apocalipto Gaming is streaming! Let's team! 🎥", label: "Live support" },
  ];

  // Auto-scroll chat board
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Periodic simulated voice bubble decibel-wave audio visualizations
  useEffect(() => {
    const speakerNames = ['RoyalRose-99', 'SolarBloom', 'ShadowNectar', 'apocalipto-gaming'];
    
    const interval = setInterval(() => {
      if (isDeafened) {
        setSimulatedSpeakers([]);
        return;
      }
      
      // Select 1 or 2 random players to show active "speaking" waveforms
      if (Math.random() > 0.4) {
        const activeCount = Math.floor(Math.random() * 2) + 1;
        const activeSpeakers: string[] = [];
        for (let i = 0; i < activeCount; i++) {
          const randSpeaker = speakerNames[Math.floor(Math.random() * speakerNames.length)];
          if (!activeSpeakers.includes(randSpeaker)) {
            activeSpeakers.push(randSpeaker);
          }
        }
        setSimulatedSpeakers(activeSpeakers);
      } else {
        setSimulatedSpeakers([]);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isDeafened]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    if (onSendChat) {
      onSendChat(inputText.trim());
    }
    setInputText('');
  };

  const handleTriggerClick = (text: string) => {
    if (onSendChat) {
      onSendChat(text);
    }
  };

  return (
    <div id="voice-chat-dashboard" className="bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl text-slate-100">
      {/* Header Panel */}
      <div className="bg-slate-950/70 py-3.5 px-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Strategic Voice Hub
            </h3>
            <span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">
              {activeChannel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {simulatedSpeakers.length + 1} speaking
          </span>
        </div>
      </div>

      {/* Live Audio Speaking Nodes Grid */}
      <div className="bg-slate-950/30 px-4 py-3 border-b border-slate-800/40 flex flex-wrap gap-3 items-center">
        {/* Local Player State */}
        <div className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          !isMuted ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300' : 'bg-slate-800/20 border-slate-800/50 text-slate-500'
        }`}>
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>You (Host)</span>
          {!isMuted && (
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3.5 rounded-full bg-indigo-400 animate-[bounce_0.6s_infinite] inline-block" />
              <span className="w-1 h-2 rounded-full bg-indigo-400 animate-[bounce_0.6s_infinite_0.15s] inline-block" />
              <span className="w-1.5 h-4 rounded-full bg-indigo-400 animate-[bounce_0.6s_infinite_0.3s] inline-block" />
            </div>
          )}
        </div>

        {/* Remote simulated speaking states */}
        {['RoyalRose', 'apocalipto-gaming', 'LoverOfPetals'].map((speaker) => {
          const isSpeaking = simulatedSpeakers.includes(speaker);
          return (
            <div key={speaker} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
              isSpeaking 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-850/15 border-slate-800/30 text-slate-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span>{speaker}</span>
              {isSpeaking && (
                <div className="flex items-end gap-0.5 ml-1 h-4">
                  <span className="w-[3px] h-2.5 rounded-full bg-emerald-400 animate-[bounce_0.5s_infinite] inline-block" />
                  <span className="w-[3px] h-4 rounded-full bg-emerald-400 animate-[bounce_0.5s_infinite_0.1s] inline-block" />
                  <span className="w-[3px] h-1.5 rounded-full bg-emerald-400 animate-[bounce_0.5s_infinite_0.2s] inline-block" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Strategic Board Quick Triggers */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800/40 flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">Quick Strategic Voice Macros (TTS)</span>
        <div className="flex flex-wrap gap-1.5">
          {strategicTriggers.map((trig, idx) => (
            <button
              key={idx}
              id={`voice-macro-${idx}`}
              onClick={() => handleTriggerClick(trig.text)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/40 hover:border-indigo-500/30 text-[11px] font-medium text-slate-300 hover:text-indigo-200 transition-all text-left"
            >
              {trig.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice / Strategy Chat Box Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[160px] bg-slate-950/20">
        {chatMessages.length === 0 ? (
          <div className="my-auto text-center flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <p className="text-slate-500 text-xs">Voice channel quiet. Broadcast tactical advice now!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5 max-w-[90%]">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold ${
                  msg.senderName === username ? 'text-indigo-400' : 'text-emerald-300'
                }`}>{msg.senderName}</span>
                <span className="text-[9px] font-mono text-slate-500">{msg.timestamp}</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/20 px-3.5 py-2 rounded-xl rounded-tl-none text-xs text-slate-200 shadow-sm leading-relaxed">
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mic controls & Text submission footer */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/60 border-t border-slate-800/60 flex gap-2 items-center">
        <button
          type="button"
          id="mic-toggle"
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2.5 rounded-xl border transition-all ${
            !isMuted 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20' 
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
          }`}
          title={!isMuted ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          id="sound-toggle"
          onClick={() => setIsDeafened(!isDeafened)}
          className={`p-2.5 rounded-xl border transition-all ${
            !isDeafened 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20' 
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
          }`}
          title={!isDeafened ? 'Deafen Audio' : 'Undeafen Audio'}
        >
          {!isDeafened ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak to team (Simulate Mic)..."
          className="flex-1 bg-slate-800 hover:bg-slate-750 focus:bg-slate-900 border border-slate-700/50 focus:border-indigo-500 py-2 px-3.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
        />

        <button
          type="submit"
          id="submit-voice-chat"
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md focus:outline-none transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
