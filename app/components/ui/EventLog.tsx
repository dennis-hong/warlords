'use client';

import React, { useState } from 'react';
import { HISTORICAL_EVENTS } from '../../constants/events';

interface EventLogProps {
  triggeredEvents: string[];  // 발생한 이벤트 ID 목록
  currentTurn: number;
  onClose: () => void;
}

interface LogEntry {
  eventId: string;
  name: string;
  nameKo: string;
  image: string;
  description: string;
}

export default function EventLog({ triggeredEvents, currentTurn, onClose }: EventLogProps) {
  const [selectedEvent, setSelectedEvent] = useState<LogEntry | null>(null);

  // 발생한 이벤트 정보 가져오기
  const logEntries: LogEntry[] = triggeredEvents
    .map(eventId => {
      const event = HISTORICAL_EVENTS.find(e => e.id === eventId);
      if (!event) return null;
      return {
        eventId: event.id,
        name: event.name,
        nameKo: event.nameKo,
        image: event.image || '📜',
        description: event.description
      };
    })
    .filter((entry): entry is LogEntry => entry !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 rounded-t-xl sm:rounded-xl border-t-2 sm:border-2 border-amber-700 shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        
        {/* 헤더 */}
        <div className="p-4 border-b border-amber-800 bg-gradient-to-r from-amber-900/30 to-transparent flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-amber-200">📜 역사 기록</h2>
            <p className="text-sm text-amber-400/70">턴 {currentTurn} - 발생한 사건들</p>
          </div>
          <button 
            onClick={onClose}
            className="text-amber-500 hover:text-amber-300 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 이벤트 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {logEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-50">📜</div>
              <p className="text-amber-400/60">아직 기록된 역사가 없습니다.</p>
              <p className="text-amber-500/40 text-sm mt-2">게임을 진행하면 역사적 사건이 기록됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logEntries.map((entry, index) => (
                <button
                  key={entry.eventId}
                  onClick={() => setSelectedEvent(selectedEvent?.eventId === entry.eventId ? null : entry)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedEvent?.eventId === entry.eventId
                      ? 'border-amber-500 bg-amber-900/30'
                      : 'border-amber-800/50 bg-stone-800/50 hover:bg-stone-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{entry.image}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-amber-100 truncate">
                        {entry.nameKo}
                      </div>
                      <div className="text-xs text-amber-400/60">
                        {entry.name}
                      </div>
                    </div>
                    <span className="text-amber-500/50 text-sm">
                      #{index + 1}
                    </span>
                  </div>

                  {/* 확장 설명 */}
                  {selectedEvent?.eventId === entry.eventId && (
                    <div className="mt-3 pt-3 border-t border-amber-800/50">
                      <p className="text-sm text-amber-200/80 whitespace-pre-line">
                        {entry.description}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="p-3 border-t border-amber-800 bg-stone-900/50 text-center">
          <p className="text-sm text-amber-400/70">
            총 {logEntries.length}개의 역사적 사건 발생
          </p>
        </div>
      </div>
    </div>
  );
}
