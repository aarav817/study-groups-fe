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
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    setEventStartTime(`${y}-${m}-${dayStr}T14:00`);
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

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ dayNum: prevMonthDays - i, isCurrentMonth: false, fullDateStr: '' });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    days.push({ dayNum: i, isCurrentMonth: true, fullDateStr: `${year}-${mStr}-${dStr}` });
  }

  const totalGridCells = days.length > 35 ? 42 : 35;
  const remainingCells = totalGridCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ dayNum: i, isCurrentMonth: false, fullDateStr: '' });
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

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
          <h1 className="page-title">Study Sessions Calendar</h1>
          <p className="page-subtitle">
            Scheduled study sessions and group events across your enrolled courses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="segmented-control">
            <button
              className={`segmented-item ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Month Grid
            </button>
            <button
              className={`segmented-item ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>

          {userGroups.length > 0 && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-navy btn-sm">
              + Schedule Session
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Loading calendar...</p>
      ) : viewMode === 'grid' ? (
        <div className="card" style={{ padding: '1rem' }}>
          {/* Calendar Month Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>{monthName}</h2>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button onClick={() => changeMonth(-1)} className="btn btn-secondary btn-xs">
                &larr; Previous
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary btn-xs">
                Today
              </button>
              <button onClick={() => changeMonth(1)} className="btn btn-secondary btn-xs">
                Next &rarr;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}

            {days.map((item, idx) => {
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
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', maxWidth: '480px', margin: '1.5rem auto' }}>
          <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Upcoming Events</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            Events scheduled in your enrolled study groups will appear here.
          </p>
          {userGroups.length > 0 && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-navy btn-sm">
              + Schedule New Event
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((event) => (
            <div key={event.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-navy" style={{ marginBottom: '0.35rem' }}>
                  {event.group_title || 'Study Group'}
                </span>
                <h3 className="card-title" style={{ fontSize: '1.05rem', margin: '0.15rem 0' }}>{event.title}</h3>
                {event.description && <p className="card-description" style={{ margin: '0.25rem 0' }}>{event.description}</p>}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <span>Time: {new Date(event.start_time).toLocaleString()}</span>
                  {event.location && <span>Location: {event.location}</span>}
                  <span>{event.attendee_count || 1} Attending</span>
                </div>
              </div>
              <button
                onClick={() => handleRsvp(event.id)}
                className={`btn ${event.is_attending ? 'btn-secondary' : 'btn-navy'} btn-xs`}
              >
                {event.is_attending ? 'Attending' : 'RSVP'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Schedule Event</h2>
            <p className="modal-subtitle">Add an event to the calendar in a specific group.</p>
            {eventError && <div className="alert-banner alert-danger"><span>{eventError}</span></div>}
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Study Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" placeholder="e.g. Midterm 1 Working Group" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} placeholder="Topics covered, room number, or problem sets..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location / Meeting Link</label>
                <input type="text" placeholder="e.g. Green Library 204 or Zoom Link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Start Date & Time</label>
                <input type="datetime-local" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={creatingEvent}>{creatingEvent ? 'Scheduling...' : 'Schedule Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
