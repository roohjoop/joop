import { saveSupportTicketToFirestore } from '../firebase/services';

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  subject?: string;
  status: 'open' | 'replied' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: SupportChatMessage[];
}

const STORAGE_KEY_SUPPORT_TICKETS = 'shoghl_support_tickets';

/**
 * Loads all tickets from storage (developer/internal use)
 */
export function getAllSupportTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPORT_TICKETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load support tickets:', err);
    return [];
  }
}

/**
 * Saves all tickets to storage and emits change event and syncs to Firestore
 */
function saveSupportTickets(tickets: SupportTicket[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('rooh_support_tickets_updated', { detail: tickets }));

    // Real-time synchronization to Firebase Firestore
    tickets.forEach((ticket) => {
      saveSupportTicketToFirestore(ticket).catch(e => console.warn('Firestore ticket sync error:', e));
    });
  } catch (err) {
    console.error('Failed to save support tickets:', err);
  }
}

/**
 * Strictly returns only tickets belonging to the given user email!
 * Privacy Isolation: No other user can see these tickets.
 */
export function getUserSupportTickets(userEmail?: string): SupportTicket[] {
  if (!userEmail) return [];
  const normalized = userEmail.trim().toLowerCase();
  const all = getAllSupportTickets();
  return all.filter(t => t.userEmail.trim().toLowerCase() === normalized);
}

/**
 * Sends a message from the user to Support.
 * If user already has an open ticket, it appends to it; otherwise creates a new ticket.
 */
export function sendUserSupportMessage(
  userEmail: string,
  userName: string,
  text: string,
  ticketId?: string
): SupportTicket {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const all = getAllSupportTickets();
  const now = new Date().toISOString();

  let targetTicket: SupportTicket | undefined;

  if (ticketId) {
    targetTicket = all.find(t => t.id === ticketId && t.userEmail.trim().toLowerCase() === normalizedEmail);
  }

  if (!targetTicket) {
    // Find latest open ticket for this user
    targetTicket = all.find(t => t.userEmail.trim().toLowerCase() === normalizedEmail && t.status !== 'closed');
  }

  const newMessage: SupportChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender: 'user',
    text: text.trim(),
    timestamp: now
  };

  if (targetTicket) {
    targetTicket.messages.push(newMessage);
    targetTicket.updatedAt = now;
    targetTicket.status = 'open';
  } else {
    targetTicket = {
      id: `ticket-${Date.now()}`,
      userEmail: normalizedEmail,
      userName: userName || 'مستخدم المنصة',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [newMessage]
    };
    all.unshift(targetTicket);
  }

  saveSupportTickets(all);
  return targetTicket;
}

/**
 * Support agent (Developer) sends a reply to a user ticket
 */
export function replyToSupportTicket(ticketId: string, replyText: string): SupportTicket | null {
  const all = getAllSupportTickets();
  const target = all.find(t => t.id === ticketId);
  if (!target) return null;

  const now = new Date().toISOString();
  const replyMessage: SupportChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender: 'support',
    text: replyText.trim(),
    timestamp: now
  };

  target.messages.push(replyMessage);
  target.updatedAt = now;
  target.status = 'replied';

  saveSupportTickets(all);
  return target;
}

/**
 * Changes ticket status (open, replied, closed)
 */
export function updateSupportTicketStatus(ticketId: string, status: 'open' | 'replied' | 'closed') {
  const all = getAllSupportTickets();
  const target = all.find(t => t.id === ticketId);
  if (target) {
    target.status = status;
    target.updatedAt = new Date().toISOString();
    saveSupportTickets(all);
  }
}
