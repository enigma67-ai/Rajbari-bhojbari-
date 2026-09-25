import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Leaf, 
  Bell, 
  BellRing,
  Download, 
  Users, 
  Share2 
} from 'lucide-react';
import { FESTIVAL_SCHEDULE, FESTIVAL_INFO } from '../data/festData';
import { ScheduleEvent } from '../types';

export const ScheduleSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedEventIds, setSavedEventIds] = useState<string[]>(['sch-1', 'sch-2']);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [notificationEventId, setNotificationEventId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Sessions' },
    { id: 'Ceremony', label: 'Key Ceremonies & Keynotes' },
    { id: 'Culinary Demo', label: 'Culinary Masterclasses' },
    { id: 'Hospitality Lab', label: 'AI & Sustainability Labs' },
    { id: 'Live Music & Folk', label: 'Folk Baul & Stories' },
  ];

  const toggleSaveEvent = (id: string) => {
    setSavedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSetReminder = (id: string, title: string) => {
    setNotificationEventId(id);
    setTimeout(() => {
      setNotificationEventId(null);
    }, 3500);
  };

  const filteredEvents = FESTIVAL_SCHEDULE.filter((ev) => {
    const matchCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    const matchSaved = activeTab === 'all' || savedEventIds.includes(ev.id);
    return matchCategory && matchSaved;
  });

  const handleExportSchedule = () => {
    const saved = FESTIVAL_SCHEDULE.filter((ev) => savedEventIds.includes(ev.id));
    const textContent = `IAM AI ZERO-WASTE FOOD FEST 2026 - PERSONAL ITINERARY\nDate: ${FESTIVAL_INFO.date}\nVenue: ${FESTIVAL_INFO.venue}\n\n` +
      saved.map((s) => `${s.time} | ${s.title}\nLocation: ${s.location}\nHost: ${s.speakerOrChef}\n${s.description}\n`).join('\n---\n\n');

    const element = document.createElement("a");
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "IAM_AI_Food_Fest_Itinerary_2026.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section id="schedule-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Event Timeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-100">
            Festival Day <span className="text-gradient-cyan">Schedule & AI Labs</span>
          </h2>
          <p className="text-emerald-100/70 text-sm mt-1 max-w-2xl">
            {FESTIVAL_INFO.date} • From 10:00 AM smart induction kickoff to the evening Grand Sustainability & Carbon-Neutral Scorecard release.
          </p>
        </div>

        {/* Tab switcher: All vs My Saved Itinerary */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-stone-900/90 p-1 rounded-xl border border-emerald-900/60">
          <button
            id="schedule-tab-all"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                : 'text-emerald-100/60 hover:text-emerald-200'
            }`}
          >
            All Sessions ({FESTIVAL_SCHEDULE.length})
          </button>
          <button
            id="schedule-tab-saved"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                : 'text-emerald-100/60 hover:text-emerald-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>My Itinerary ({savedEventIds.length})</span>
          </button>
        </div>
      </div>

      {/* Reminder notification toast */}
      {notificationEventId && (
        <div className="my-4 p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>Reminder alert configured! You will receive a notification 15 minutes before the session starts.</span>
          </div>
          <span className="text-[10px] text-emerald-400 uppercase font-bold">Simulated Notification Active</span>
        </div>
      )}

      {/* Category Pills & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {savedEventIds.length > 0 && (
          <button
            id="export-itinerary-btn"
            onClick={handleExportSchedule}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-amber-300 text-xs font-medium whitespace-nowrap transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Saved Itinerary</span>
          </button>
        )}
      </div>

      {/* Events Timeline */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-[#160c08] border border-stone-800 rounded-2xl p-8">
            <p className="text-stone-400 text-sm">No scheduled sessions in this category or no saved bookmarks.</p>
            {activeTab === 'saved' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs"
              >
                Browse All Sessions
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const isSaved = savedEventIds.includes(event.id);

            return (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
                  event.isHighlight
                    ? 'bg-gradient-to-r from-[#1c100a] via-[#160c08] to-[#140a06] border-amber-500/40 shadow-xl'
                    : 'bg-[#150d09] border-stone-800/80 hover:border-amber-500/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Time and Location Badge */}
                  <div className="lg:w-64 space-y-1.5 flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Center: Title, Subtitle, Host, Description */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-emerald-100">
                        {event.title}
                      </h3>
                      <span className="text-xs text-amber-400 font-sans font-semibold">
                        ({event.bengaliSubtitle})
                      </span>
                      {event.isHighlight && (
                        <span className="px-2 py-0.5 rounded-full bg-red-950 text-amber-300 text-[10px] font-bold border border-red-500/40 uppercase">
                          Highlight
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-400">
                      <div className="flex items-center gap-1.5 text-amber-200/90 font-medium">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lead: {event.speakerOrChef}</span>
                      </div>

                      {event.sustainabilityFocus && (
                        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-600/20 text-[11px]">
                          <Leaf className="w-3 h-3 text-emerald-400" />
                          <span>Eco Focus: {event.sustainabilityFocus}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions (Bookmark, Reminder) */}
                  <div className="flex items-center lg:flex-col justify-end gap-2 lg:w-40 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                    <button
                      id={`event-bookmark-btn-${event.id}`}
                      onClick={() => toggleSaveEvent(event.id)}
                      className={`flex-1 lg:w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSaved
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>In My Schedule</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Add to Schedule</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`event-reminder-btn-${event.id}`}
                      onClick={() => handleSetReminder(event.id, event.title)}
                      className="p-2 lg:w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-300 text-xs transition-colors"
                      title="Set Notification Reminder"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline text-[11px]">Notify Me</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </section>
  );
};
