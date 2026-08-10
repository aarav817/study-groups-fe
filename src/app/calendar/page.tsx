'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  group_title?: string;
  creator_name?: string;
  attendee_count?: number;
  is_attending?: boolean;
}

interface UserGroup {
  id: string;
  title: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Month navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Modal State
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDesc, setEventDesc] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventStartTime, setEventStartTime] = useState<string>('');
  const [eventError, setEventError] = useState<string>('');
  const [creatingEvent, setCreatingEvent] = useState<boolean>(false);

  const loadEventsAndGroups = async () => {
    try {
      setLoading(true);
      const [eRes, gRes] = await Promise.allSettled([
        api.events.getMyEvents(),
        api.groups.list(),
      ]);

      if (eRes.status === 'fulfilled' && eRes.value?.success && eRes.value.data?.events) {
        setEvents(eRes.value.data.events);
      }
      if (gRes.status === 'fulfilled' && gRes.value?.success && gRes.value.data?.groups) {
        setUserGroups(gRes.value.data.groups);
        if (gRes.value.data.groups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(gRes.value.data.groups[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsAndGroups();
  }, []);

  const handleRsvp = async (eventId: string) => {
    try {
      const res = await api.events.rsvp(eventId);
      if (res.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_attending: res.data?.is_attending } : e))
        );
      }
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError('');

    if (!selectedGroupId || !eventTitle.trim() || !eventStartTime) {
      setEventError('Please select a group and fill in title and start time.');
      return;
    }

    try {
      setCreatingEvent(true);
      const res = await api.events.create(selectedGroupId, {
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        location: eventLocation.trim(),
        start_time: eventStartTime,
      });

      if (res.success) {
        setShowEventModal(false);
        setEventTitle('');
        setEventDesc('');
        setEventLocation('');
        setEventStartTime('');
        loadEventsAndGroups();
      } else {
        setEventError(res.error?.message || 'Failed to schedule event.');
      }
    } catch (err: any) {
      setEventError(err.message || 'Failed to schedule event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDateCellClick = (dayNum: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    setEventStartTime(`${year}-${month}-${dayStr}T14:00`);
    setShowEventModal(true);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: { dayNum: number; isCurrentMonth: boolean; fullDateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ dayNum: prevMonthDays - i, isCurrentMonth: false, fullDateStr: '' });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    days.push({ dayNum: i, isCurrentMonth: true, fullDateStr: `${year}-${mStr}-${dStr}` });
  }

  // Remaining days to fill grid cells
  const totalGridCells = days.length > 35 ? 42 : 35;
  const remainingCells = totalGridCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ dayNum: i, isCurrentMonth: false, fullDateStr: '' });
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format ISO date string to YYYY-MM-DD for exact date matching
  const getFormattedDate = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return isoStr.slice(0, 10);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactive Study Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            View and schedule group study sessions, exam reviews, and lab hours.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            📅 Grid Calendar
          </button>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          {userGroups.length > 0 && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-primary">
              + Schedule Event
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading study calendar...</p>
      ) : viewMode === 'grid' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Calendar Month Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{monthName}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => changeMonth(-1)} className="btn btn-secondary btn-sm">&larr; Prev Month</button>
              <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary btn-sm">Today</button>
              <button onClick={() => changeMonth(1)} className="btn btn-secondary btn-sm">Next Month &rarr;</button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}

            {days.map((item, idx) => {
              // STRICT DATE MATCHING: Only match events if cell is in current month and has a valid date string
              const dayEvents = (item.isCurrentMonth && item.fullDateStr)
                ? events.filter((e) => getFormattedDate(e.start_time) === item.fullDateStr)
                : [];

              const isToday = item.isCurrentMonth && item.fullDateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => item.isCurrentMonth && handleDateCellClick(item.dayNum)}
                >
                  <div className="cell-day-num">{item.dayNum}</div>
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="cell-event-badge" title={`${ev.title} (${ev.group_title || ''})`}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Upcoming Events</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Events and review sessions scheduled in your study groups will appear here.
          </p>
          {userGroups.length > 0 && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-primary">
              + Schedule New Event
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((event) => (
            <div key={event.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                  {event.group_title || 'Study Group Event'}
                </span>
                <h3 className="card-title" style={{ fontSize: '1.15rem', fontWeight: 600 }}>{event.title}</h3>
                {event.description && <p className="card-description" style={{ margin: '0.5rem 0' }}>{event.description}</p>}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span>📅 {new Date(event.start_time).toLocaleString()}</span>
                  {event.location && <span>📍 {event.location}</span>}
                  <span>👥 {event.attendee_count || 1} Attending</span>
                </div>
              </div>
              <button
                onClick={() => handleRsvp(event.id)}
                className={`btn ${event.is_attending ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              >
                {event.is_attending ? '✓ Attending' : 'RSVP Now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Schedule Study Event</h2>
            {eventError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{eventError}</div>}
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Select Study Group</label>
                <select className="form-control" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" className="form-control" placeholder="e.g. Midterm 1 Practice Session" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} className="form-control" placeholder="Topics covered, problem sets..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location / Zoom Link</label>
                <input type="text" className="form-control" placeholder="e.g. Science Library Room 102 or Zoom Link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Start Date & Time</label>
                <input type="datetime-local" className="form-control" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingEvent}>{creatingEvent ? 'Scheduling...' : 'Schedule Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
