"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
  LogOut,
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  Sparkles,
  AlertCircle,
  User,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  CalendarDays,
  ChevronDown,
  Send,
  MessageSquareText,
  UserRoundCheck,
  PencilLine,
} from "lucide-react";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

interface TicketAuthor {
  _id: string;
  name?: string;
  email?: string;
}

interface TicketBook {
  _id: string;
  book_id?: string;
  title?: string;
  isbn?: string;
}

interface TicketInternalNote {
  _id?: string;
  author?:
    | string
    | { _id?: string; id?: string; name?: string; email?: string }
    | null;
  message: string;
  createdAt?: string;
}


interface TicketReply {
  _id?: string;
  sender: string | { _id?: string; name?: string; email?: string };
  senderRole: "admin" | "author";
  message: string;
  createdAt?: string;
}


interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  author?: TicketAuthor | null;
  book?: TicketBook | null;
  aiPriority?: string | null;
  aiClassification?: string | null;
  aiDraftResponse?: string | null;
  internalNotes?: TicketInternalNote[];
  createdAt?: string;
  updatedAt?: string;
  replies?: TicketReply[];
  assignedTo?: string | { _id?: string; id?: string; name?: string } | null;
}

interface AdminUser {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
}

export default function AdminDashboard() {
  const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');
  const [internalNoteDrafts, setInternalNoteDrafts] = useState<
    Record<string, string>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [editAIClassification, setEditAIClassification] = useState("");
  const [editAIPriority, setEditAIPriority] = useState("");
  const [savingAI, setSavingAI] = useState(false);
  const [aiEditError, setAIEditError] = useState("");
  const [aiEditSuccess, setAIEditSuccess] = useState("");
    
  const [noteFeedback, setNoteFeedback] = useState<{
    ticketId: string;
    message: string;
    isError: boolean;
  } | null>(null);
  const [savingNoteTicketId, setSavingNoteTicketId] = useState<string | null>(
    null,
  );
  const [draftEdits, setDraftEdits] = useState<
  Record<string, string>
>({});

  const aiCategories = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "Legal & Copyright",
    "Marketing & Promotions",
    "Formatting Issues",
    "General Inquiry",
  ];

  const aiPriorities = [
    "Critical",
    "High",
    "Medium",
    "Low",
    "Unassigned",
  ];

  // Fetch tickets when requested, including after a status update.
  const fetchTickets = useCallback(async () => {
    try {
      setLoadError(null);

      const response = await apiClient.get<Ticket[]>("/tickets");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoadError("Unable to load tickets. Please try again.");
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const response = await apiClient.get<AdminUser[]>("/users");
      if (!Array.isArray(response.data)) {
        throw new Error("The users endpoint returned an invalid response.");
      }
      setAdminUsers(
        response.data.filter((admin) => admin.role === "admin"),
      );
      setAssignmentError(null);
    } catch (error) {
      console.error("Error fetching users for ticket assignment:", error);
      setAssignmentError(
        "Unable to load active admins. Check that the users list endpoint is available, then retry.",
      );
    }
  }, []);

  // Handle authentication and initial ticket loading.
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (user?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;

    const loadTickets = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await apiClient.get<Ticket[]>("/tickets");

        if (!cancelled) {
          setTickets(response.data);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);

        if (!cancelled) {
          setLoadError("Unable to load tickets. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTickets();
    const loadAdmins = async () => {
      await Promise.resolve();
      await fetchAdminUsers();
    };
    void loadAdmins();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, user?.role, router, fetchAdminUsers]);

  const handleStatusChange = async (
    ticketId: string,
    newStatus: TicketStatus,
  ) => {
    setUpdatingTicketId(ticketId);

    try {
      await apiClient.put(`/tickets/${ticketId}`, {
        status: newStatus,
      });

      await fetchTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      setLoadError("Unable to update the ticket status. Please try again.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleAssigneeChange = async (ticketId: string, assigneeId: string) => {
    setUpdatingTicketId(ticketId);
    try {
      await apiClient.put(`/tickets/${ticketId}`, {
        assignedTo: assigneeId || null,
      });
      await fetchTickets();
    } catch (error) {
      console.error("Error assigning ticket:", error);
      setLoadError("Unable to assign the ticket. Please try again.");
    } finally {
      setUpdatingTicketId(null);
    }
  };
  const handleEditAI = () => {
  if (!selectedTicket) return;

  setEditAIClassification(
    selectedTicket.aiClassification || "",
  );

  setEditAIPriority(
    selectedTicket.aiPriority || "Unassigned",
  );

  setAIEditError("");
  setAIEditSuccess("");
  setIsEditingAI(true);
};

const handleCancelAIEdit = () => {
  setIsEditingAI(false);
  setAIEditError("");
};

const handleSaveAI = async () => {
  if (!selectedTicket) return;

  if (!editAIClassification.trim()) {
    setAIEditError("Please select a classification.");
    return;
  }

  if (!aiCategories.includes(editAIClassification)) {
    setAIEditError("Please select a valid classification.");
    return;
  }

  if (!aiPriorities.includes(editAIPriority)) {
    setAIEditError("Please select a valid priority.");
    return;
  }

  setSavingAI(true);
  setAIEditError("");
  setAIEditSuccess("");

  try {
    const response = await apiClient.put<Ticket>(
      `/tickets/${selectedTicket._id}`,
      {
        aiClassification: editAIClassification,
        aiPriority: editAIPriority,
      },
    );

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket._id === response.data._id
          ? response.data
          : ticket,
      ),
    );

    setIsEditingAI(false);
    setAIEditSuccess("AI classification and priority updated.");
  } catch (error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "response" in error
        ? (
            error as {
              response?: {
                data?: { error?: string };
              };
            }
          ).response?.data?.error
        : undefined;

    setAIEditError(
      message || "Unable to update AI details. Please try again.",
    );
  } finally {
    setSavingAI(false);
  }
};

  const handleSaveInternalNote = async (ticketId: string) => {
    const internalNote = internalNoteDrafts[ticketId]?.trim();
    if (!internalNote) return;

    setSavingNoteTicketId(ticketId);
    setNoteFeedback(null);
    try {
      const response = await apiClient.put<Ticket>(`/tickets/${ticketId}`, {
        internalNote,
      });
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === ticketId ? response.data : ticket,
        ),
      );
      setInternalNoteDrafts((currentDrafts) => ({
        ...currentDrafts,
        [ticketId]: "",
      }));
      setNoteFeedback({
        ticketId,
        message: "Internal note saved.",
        isError: false,
      });
    } catch (error) {
      console.error("Error saving internal note:", error);
      setNoteFeedback({
        ticketId,
        message: "Unable to save the note. Please try again.",
        isError: true,
      });
    } finally {
      setSavingNoteTicketId(null);
    }
  };

  const handleCopyDraft = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setCopyError(null);

      window.setTimeout(() => {
        setCopiedId((currentId) => (currentId === id ? null : currentId));
      }, 2000);
    } catch (error) {
      console.error("Error copying draft:", error);
      setCopyError("Unable to copy the draft. Check your browser permissions.");
    }
  };

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open",
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress",
  ).length;

  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved" || ticket.status === "Closed",
  ).length;
  const priorityRank: Record<string, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  const queueTickets = [...tickets].sort((first, second) => {
    const firstClosed =
      first.status === "Resolved" || first.status === "Closed" ? 1 : 0;
    const secondClosed =
      second.status === "Resolved" || second.status === "Closed" ? 1 : 0;
    const statusOrder = firstClosed - secondClosed;

    if (statusOrder !== 0) {
      return statusOrder;
    }

    const priorityOrder =
      (priorityRank[first.aiPriority || ""] ?? 4) -
      (priorityRank[second.aiPriority || ""] ?? 4);

    if (priorityOrder !== 0) {
      return priorityOrder;
    }

    return (
      new Date(first.createdAt || 0).getTime() -
      new Date(second.createdAt || 0).getTime()
    );
  });
  const filteredTickets = queueTickets.filter((ticket) => {
    const query = searchQuery.trim().toLowerCase();

    // Search across ticket and author information.
    const searchableText = [
      ticket.subject,
      ticket.description,
      ticket.author?.name,
      ticket.author?.email,
      ticket.book?.title,
      ticket.book?.isbn,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchableText.includes(query)) {
      return false;
    }

    // Status filter.
    if (statusFilter && ticket.status !== statusFilter) {
      return false;
    }

    // Category filter.
    if (
      categoryFilter &&
      ticket.aiClassification !== categoryFilter
    ) {
      return false;
    }

    // Priority filter.
    if (
      priorityFilter &&
      ticket.aiPriority !== priorityFilter
    ) {
      return false;
    }

    // Date range filter: inclusive of both selected calendar dates.
    if (startDate || endDate) {
      if (!ticket.createdAt) {
        return false;
      }

      const createdAt = new Date(ticket.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      const ticketDate =
        `${createdAt.getFullYear()}-${String(
          createdAt.getMonth() + 1,
        ).padStart(2, "0")}-${String(
          createdAt.getDate(),
        ).padStart(2, "0")}`;

      if (startDate && ticketDate < startDate) {
        return false;
      }

      if (endDate && ticketDate > endDate) {
        return false;
      }
    }

    return true;
  });
  const selectedTicket =
    tickets.find((ticket) => ticket._id === selectedTicketId) ||
    queueTickets[0];
  const selectedAssigneeId =
    typeof selectedTicket?.assignedTo === "string"
      ? selectedTicket.assignedTo
      : selectedTicket?.assignedTo?._id ||
        selectedTicket?.assignedTo?.id ||
        "";
  const activeAdminUsers = adminUsers.filter(
    (admin) => admin.status !== "inactive",
  );
  const selectedAssigneeIsActive = activeAdminUsers.some(
    (admin) => (admin._id || admin.id) === selectedAssigneeId,
  );

  const draftResponse = selectedTicket
  ? draftEdits[selectedTicket._id] ??
    selectedTicket.aiDraftResponse ??
    ""
  : "";

  const priorityStyles: Record<string, string> = {
    Critical: "border-rose-200 bg-rose-50 text-rose-700",
    High: "border-orange-200 bg-orange-50 text-orange-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-sky-200 bg-sky-50 text-sky-700",
  };

  
const handleSendReply = async (
  ticketId: string,
  message: string,
) => {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    setReplyError("Please enter a reply before sending.");
    setReplySuccess("");
    return;
  }

  setSendingReply(true);
  setReplyError("");
  setReplySuccess("");

  try {
    const response = await apiClient.post<{
      message: string;
      ticket: Ticket;
    }>(`/tickets/${ticketId}/replies`, {
      message: trimmedMessage,
    });

    const updatedTicket = response.data.ticket;

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket._id === updatedTicket._id
          ? updatedTicket
          : ticket,
      ),
    );

    setSelectedTicketId(updatedTicket._id);

    // Clear the local editor only after the server confirms success.
    setDraftEdits((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[ticketId];
      return updatedDrafts;
    });

    setReplySuccess("Reply sent successfully.");
  } catch (error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "response" in error
        ? (
            error as {
              response?: {
                data?: { error?: string };
              };
            }
          ).response?.data?.error
        : undefined;

    setReplyError(
      message || "Failed to send reply. Please try again.",
    );
  } finally {
    setSendingReply(false);
  }
};


  if (
    isAuthLoading ||
    !isAuthenticated ||
    !user ||
    user.role !== "admin" ||
    isLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-sans tracking-wide">
        Loading BookLeaf Portal...
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-[#F7F7F8] font-sans text-slate-900 pb-16">
      {/* 1. Ultra-Clean Editorial Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-6">
            {/* Logo - Kept on pure white for perfect visibility */}
            <div className="flex h-12 items-center bg-white">
              <img
                src="https://static.wixstatic.com/media/6d2cdc_fbad8eb25d304d57be46e9c494a1a355~mv2.jpg/v1/fill/w_360,h_162,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/book%20background%20white.jpg"
                alt="BookLeaf Publishing"
                className="h-12 w-auto object-contain mix-blend-multiply sm:h-14"
              />
            </div>
            <div className="hidden h-5 w-px bg-slate-200 sm:block"></div>
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:block">
              Support Admin
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Admin Workspace
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10">
        <AdminSidebar />
        <div className="min-w-0">
          {/* 2. Sophisticated Page Header */}
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Ticket Queue
              </h1>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                Manage author communications, review AI-generated responses, and
                ensure publishing excellence across all open inquiries.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              System Active
            </div>
          </div>

          {loadError && (
            <div className="mb-8 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                {loadError}
              </div>
              <button
                onClick={() => void fetchTickets()}
                className="cursor-pointer font-bold text-rose-700 underline underline-offset-4 hover:text-rose-950"
              >
                Retry
              </button>
            </div>
          )}

          {/* 3. Minimalist Stats Grid */}
          <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Total Volume",
                value: tickets.length,
                color: "text-slate-900",
              },
              {
                label: "Requires Attention",
                value: openTickets,
                color: "text-rose-600",
              },
              {
                label: "In Progress",
                value: inProgressTickets,
                color: "text-amber-600",
              },
              {
                label: "Successfully Resolved",
                value: closedTickets,
                color: "text-emerald-600",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {stat.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold tracking-tight ${stat.color}`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          {/* 4. Clean Filter Bar */}
          
<section className="mb-8 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <label className="relative block md:col-span-2">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search tickets, authors, books..."
        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-slate-900"
      />
    </label>

    <label className="block">
      <span className="sr-only">Filter by status</span>
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-900"
      >
        <option value="">All Statuses</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
        <option value="Closed">Closed</option>
      </select>
    </label>

    <label className="block">
      <span className="sr-only">Filter by category</span>
      <select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-900"
      >
        <option value="">All Categories</option>
        {Array.from(
          new Set(
            tickets
              .map((ticket) => ticket.aiClassification)
              .filter(
                (category): category is string =>
                  Boolean(category?.trim()),
              ),
          ),
        )
          .sort()
          .map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
      </select>
    </label>

    <label className="block">
      <span className="sr-only">Filter by priority</span>
      <select
        value={priorityFilter}
        onChange={(event) => setPriorityFilter(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-900"
      >
        <option value="">All Priorities</option>
        <option value="Critical">Critical</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </label>

    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">
        From date
      </span>
      <input
        type="date"
        value={startDate}
        max={endDate || undefined}
        onChange={(event) => setStartDate(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
      />
    </label>

    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">
        To date
      </span>
      <input
        type="date"
        value={endDate}
        min={startDate || undefined}
        onChange={(event) => setEndDate(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
      />
    </label>

    <div className="flex items-end">
      <button
        type="button"
        onClick={() => {
          setSearchQuery("");
          setStatusFilter("");
          setCategoryFilter("");
          setPriorityFilter("");
          setStartDate("");
          setEndDate("");
        }}
        className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Reset Filters
      </button>
    </div>
  </div>

  <p className="mt-3 px-1 text-xs font-medium text-slate-500">
    Showing {filteredTickets.length} of {tickets.length} tickets
  </p>
</section>


          {copyError && (
            <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {copyError}
            </div>
          )}

          {/* 5. Main Content Area */}
          {filteredTickets.length === 0 && !loadError ? (
            <div className="rounded-xl border border-slate-200 bg-white py-32 text-center shadow-sm">
              <TicketIcon className="mx-auto h-12 w-12 text-slate-200" />
              <h3 className="mt-4 text-base font-bold text-slate-900">
                No matching tickets
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
              {/* Left Col: Refined Ticket List */}
              {/* Left Col: Refined Ticket List */}
              <section className="flex h-[800px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">
                    Incoming Queue
                  </h2>
                  <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                    {filteredTickets.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredTickets.map((ticket, index) => {
                    const isSelected = selectedTicket?._id === ticket._id;

                    // HIGHLIGHT LOGIC: Sabse upar wala (Index 0) ticket jo closed nahi hai,
                    // wahi sabse urgent aur oldest hai sorting ke hisaab se.
                    const isMostUrgent =
                      index === 0 &&
                      ticket.status !== "Resolved" &&
                      ticket.status !== "Closed";

                    // Clean Priority Styling
                    let priorityColor = "text-slate-500";
                    if (ticket.aiPriority === "Critical")
                      priorityColor = "text-rose-600 font-extrabold";
                    else if (ticket.aiPriority === "High")
                      priorityColor = "text-orange-600 font-bold";
                    else if (ticket.aiPriority === "Medium")
                      priorityColor = "text-amber-600 font-bold";

                    const createdDate = ticket.createdAt
                      ? new Date(ticket.createdAt)
                      : null;
                    const dateLabel =
                      createdDate && !Number.isNaN(createdDate.getTime())
                        ? createdDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "";

                    return (
                      <button
                        key={ticket._id}
                        type="button"
                        onClick={() => setSelectedTicketId(ticket._id)}
                        className={`block w-full cursor-pointer border-l-4 p-5 text-left transition-colors ${
                          isSelected
                            ? "border-l-slate-900 bg-slate-50"
                            : isMostUrgent
                              ? "border-l-rose-500 bg-rose-50/40 hover:bg-rose-50/80"
                              : "border-l-transparent bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        {isMostUrgent && (
                          <div className="mb-3 inline-flex items-center gap-1.5 rounded-sm bg-rose-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Urgent Action Required
                          </div>
                        )}

                        {/* Priority and Status */}
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] uppercase tracking-widest ${priorityColor}`}
                          >
                            {ticket.aiPriority &&
                            ticket.aiPriority !== "Unassigned"
                              ? `${ticket.aiPriority} Priority`
                              : "Priority Pending"}
                          </span>

                          <span
                            className={`rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                              ticket.status === "Open"
                                ? "bg-slate-200 text-slate-800"
                                : ticket.status === "In Progress"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>

                        {/* Subject */}
                        <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                          {ticket.subject}
                        </h3>

                        {/* Author */}
                        <div className="mt-3 flex items-start gap-2">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {ticket.author?.name || "Unknown Author"}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {ticket.author?.email || "Email unavailable"}
                            </p>
                          </div>
                        </div>

                        {/* Related Book */}
                        <div className="mt-3 rounded-lg border border-slate-100 bg-white/80 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            Related Book
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800">
                            {ticket.book?.title || "General / Account Level"}
                          </p>
                        </div>

                        {/* AI Classification */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            {ticket.aiClassification ||
                              "Classification Pending"}
                          </span>

                          <span
                            className={`rounded-md border px-2.5 py-1.5 text-[10px] font-bold ${
                              priorityStyles[ticket.aiPriority || ""] ||
                              "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            {ticket.aiPriority === "Unassigned"
                              ? "Not Scored"
                              : ticket.aiPriority || "Not Scored"}
                          </span>
                        </div>

                        {/* Description Preview */}
                        <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-slate-500">
                          {ticket.description}
                        </p>

                        {/* Submission date */}
                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                          <span className="shrink-0 text-xs font-semibold text-slate-400">
                            {dateLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Right Col: High-End Details View */}
              {selectedTicket ? (
                <section className="min-w-0 space-y-6">
                  {/* Master Details */}
                  <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                    {/* Ticket Header */}
                    <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-100 pb-6">
                      <div className="min-w-0 flex-1">
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          <span>
                            {selectedTicket.aiClassification ||
                              "Classification Pending"}
                          </span>
                        </div>

                        <h2 className="break-words text-2xl font-black text-slate-900 sm:text-3xl">
                          {selectedTicket.subject}
                        </h2>
                      </div>

                      <div className="shrink-0">
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <UserRoundCheck
                              aria-hidden="true"
                              className="h-4 w-4 text-slate-400"
                            />
                            <select
                              aria-label="Assign ticket to admin"
                              value={selectedAssigneeId}
                              disabled={
                                updatingTicketId === selectedTicket._id ||
                                (adminUsers.length === 0 &&
                                  !selectedTicket.assignedTo)
                              }
                              onChange={(event) =>
                                void handleAssigneeChange(
                                  selectedTicket._id,
                                  event.target.value,
                                )
                              }
                              className="h-11 min-w-48 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50"
                            >
                              <option value="">Unassigned</option>
                              {!selectedAssigneeIsActive &&
                                selectedAssigneeId && (
                                  <option value={selectedAssigneeId}>
                                    {typeof selectedTicket.assignedTo ===
                                      "object" &&
                                    selectedTicket.assignedTo?.name
                                      ? `${selectedTicket.assignedTo.name}${
                                          assignmentError
                                            ? ""
                                            : " (inactive)"
                                        }`
                                      : assignmentError
                                        ? "Current assignment"
                                        : "Current assignee (inactive)"}
                                  </option>
                                )}
                              {activeAdminUsers.map((admin, index) => {
                                const id = admin._id || admin.id;
                                return id ? (
                                  <option key={id} value={id}>
                                    {admin.name}
                                  </option>
                                ) : (
                                  <option key={`admin-${index}`} disabled>
                                    {admin.name} (unavailable)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <select
                            aria-label="Ticket status"
                            value={selectedTicket.status}
                            disabled={updatingTicketId === selectedTicket._id}
                            onChange={(event) =>
                              void handleStatusChange(
                                selectedTicket._id,
                                event.target.value as TicketStatus,
                              )
                            }
                            className="h-11 w-44 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50"
                          >
                            <option value="Open">Status: Open</option>
                            <option value="In Progress">
                              Status: In Progress
                            </option>
                            <option value="Resolved">Status: Resolved</option>
                            <option value="Closed">Status: Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {assignmentError && (
                      <div
                        role="alert"
                        className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      >
                        <span>{assignmentError}</span>
                        <button
                          type="button"
                          onClick={() => void fetchAdminUsers()}
                          className="shrink-0 font-bold underline underline-offset-2"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Author and Book Information */}
                    <div className="grid gap-4 border-b border-slate-100 py-6 sm:grid-cols-2">
                      {/* Author Details */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Author Information
                          </h3>
                        </div>

                        <p className="text-base font-bold text-slate-900">
                          {selectedTicket.author?.name || "Unknown Author"}
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-600">
                          {selectedTicket.author?.email || "Email unavailable"}
                        </p>

                      </div>

                      {/* Book Details */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <TicketIcon className="h-4 w-4 text-violet-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Related Book
                          </h3>
                        </div>

                        <p className="text-base font-bold text-slate-900">
                          {selectedTicket.book?.title ||
                            "General / Account Level"}
                        </p>

                        <div className="mt-3 space-y-2 text-sm">
                          <p className="break-all text-slate-600">
                            <span className="font-semibold text-slate-500">
                              ISBN:{" "}
                            </span>
                            {selectedTicket.book?.isbn || "Not available"}
                          </p>

                        </div>
                      </div>
                    </div>

                    {/* Ticket Description */}
                    <div className="py-6">
                      <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                        Author Inquiry
                      </h3>

                      <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700">
                        {selectedTicket.description}
                      </p>

                      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <CalendarDays className="h-4 w-4" />
                        Submitted:{" "}
                        {selectedTicket.createdAt
                          ? new Date(selectedTicket.createdAt).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "Date unavailable"}
                      </p>
                    </div>

                    {/* AI Analysis */}
                    
{/* AI Analysis */}
<div className="border-t border-slate-100 pt-6">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-sm font-extrabold text-slate-900">
      AI Analysis
    </h3>

    {!isEditingAI && (
      <button
        type="button"
        onClick={handleEditAI}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <PencilLine className="h-4 w-4" />
        Edit Details
      </button>
    )}
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    {/* AI Classification */}
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
      <div className="mb-3 flex items-center gap-2 text-indigo-700">
        <Sparkles className="h-4 w-4" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider">
          AI Classification
        </h3>
      </div>

      {isEditingAI ? (
        <select
          aria-label="AI Classification"
          value={editAIClassification}
          onChange={(event) =>
            setEditAIClassification(event.target.value)
          }
          className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
        >
          <option value="">Select classification</option>
          {aiCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      ) : (
        <p className="break-words text-base font-bold text-slate-900">
          {selectedTicket.aiClassification || "Pending"}
        </p>
      )}
    </div>

    {/* AI Priority */}
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-600">
        <AlertCircle className="h-4 w-4" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider">
          AI Priority
        </h3>
      </div>

      {isEditingAI ? (
        <select
          aria-label="AI Priority"
          value={editAIPriority}
          onChange={(event) =>
            setEditAIPriority(event.target.value)
          }
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
        >
          {aiPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority === "Unassigned"
                ? "Not Scored"
                : priority}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`inline-flex rounded-lg border px-3 py-2 text-sm font-bold ${
            priorityStyles[selectedTicket.aiPriority || ""] ||
            "border-slate-200 bg-white text-slate-500"
          }`}
        >
          {selectedTicket.aiPriority === "Unassigned"
            ? "Not Scored"
            : selectedTicket.aiPriority || "Pending"}
        </span>
      )}
    </div>
  </div>

  {isEditingAI && (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleCancelAIEdit}
        disabled={savingAI}
        className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() => void handleSaveAI()}
        disabled={savingAI}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {savingAI ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )}

  {aiEditError && (
    <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
      {aiEditError}
    </p>
  )}

  {aiEditSuccess && !isEditingAI && (
    <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
      {aiEditSuccess}
    </p>
  )}
</div>

                  </article>

                  {/* AI Draft - Sophisticated Dark Mode Editorial Look */}
                  <article className="rounded-xl bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-8 py-5">
                      <h3 className="flex items-center gap-2.5 text-sm font-bold text-white">
                        <Sparkles className="h-4 w-4 text-slate-400" />
                        AI Drafted Response
                      </h3>
                      {draftResponse && (
                        <button
                          onClick={() =>
                          void handleCopyDraft(
                            draftResponse,
                            selectedTicket._id,
                          )
                        }
                          className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                        >
                          {copiedId === selectedTicket._id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy Text
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="p-8">
                      
                      <textarea
                        key={selectedTicket._id}
                        aria-label="Edit AI response draft"
                        value={draftResponse}
                        onChange={(event) =>
                          setDraftEdits((previous) => ({
                            ...previous,
                            [selectedTicket._id]: event.target.value,
                          }))
                        }
                        placeholder="No AI draft available for this ticket."
                        className="min-h-[160px] w-full resize-y bg-transparent text-base font-medium leading-relaxed text-slate-300 outline-none placeholder:text-slate-600 focus:text-white"
                      />

                      <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                          Review carefully before sending
                        </p>
                        
                        <button
                          type="button"
                          onClick={() =>
                            void handleSendReply(
                              selectedTicket._id,
                              draftResponse,
                            )
                          }
                          disabled={sendingReply || !draftResponse.trim()}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-extrabold text-slate-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send className="h-4 w-4" />
                          {sendingReply ? "Sending..." : "Send Reply"}
                        </button>

                      </div>

                      {replyError && (
                        <p role="alert" className="mt-3 text-sm text-rose-400">
                          {replyError}
                        </p>
                      )}

                      {replySuccess && (
                        <p role="status" className="mt-3 text-sm text-emerald-400">
                          {replySuccess}
                        </p>
                      )}

                    </div>
                  </article>
                  
                  {/* Public Reply History */}
                  <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Reply History
                      </h3>
                    </div>

                    {selectedTicket.replies?.length ? (
                      <div className="space-y-4">
                        {selectedTicket.replies.map((reply, index) => (
                          <div
                            key={reply._id || `${reply.createdAt}-${index}`}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-800">
                                {reply.senderRole === "admin"
                                  ? "BookLeaf Support"
                                  : typeof reply.sender === "object"
                                    ? reply.sender.name || "Author"
                                    : "Author"}
                              </p>

                              <time className="text-xs text-slate-400">
                                {reply.createdAt
                                  ? new Date(reply.createdAt).toLocaleString("en-IN")
                                  : ""}
                              </time>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                        No replies have been sent for this ticket yet.
                      </p>
                    )}
                  </article>

                  {/* Internal Notes */}
                  <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <MessageSquareText className="h-4 w-4 text-slate-500" />
                        Internal Notes
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Team Only
                      </span>
                    </div>
                    <div className="mb-5 space-y-3">
                      {(selectedTicket.internalNotes || []).length ? (
                        selectedTicket.internalNotes?.map((note, index) => {
                          const populatedAuthor =
                            typeof note.author === "object"
                              ? note.author?.name || note.author?.email
                              : undefined;
                          const authorId =
                            typeof note.author === "string"
                              ? note.author
                              : note.author?._id || note.author?.id;
                          const authorName =
                            populatedAuthor ||
                            adminUsers.find(
                              (admin) =>
                                authorId &&
                                (admin._id || admin.id) === authorId,
                            )?.name ||
                            "Team member";
                          const createdDate = note.createdAt
                            ? new Date(note.createdAt)
                            : null;
                          const dateLabel =
                            createdDate &&
                            !Number.isNaN(createdDate.getTime())
                              ? createdDate.toLocaleString()
                              : null;

                          return (
                            <div
                              key={note._id || `${selectedTicket._id}-${index}`}
                              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                            >
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-700">
                                  {authorName}
                                </span>
                                {dateLabel && (
                                  <time className="text-slate-400">
                                    {dateLabel}
                                  </time>
                                )}
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                {note.message}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          No internal notes yet.
                        </p>
                      )}
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveInternalNote(selectedTicket._id);
                      }}
                    >
                      <label className="sr-only" htmlFor="internal-note">
                        Add an internal note
                      </label>
                      <textarea
                        id="internal-note"
                        value={internalNoteDrafts[selectedTicket._id] || ""}
                        onChange={(event) => {
                          setInternalNoteDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [selectedTicket._id]: event.target.value,
                          }));
                          setNoteFeedback(null);
                        }}
                        placeholder="Add context for your team..."
                        rows={4}
                        className="min-h-[100px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                      />
                      {noteFeedback?.ticketId === selectedTicket._id && (
                        <p
                          role={noteFeedback.isError ? "alert" : "status"}
                          className={`mt-2 text-sm ${
                            noteFeedback.isError
                              ? "text-rose-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {noteFeedback.message}
                        </p>
                      )}
                      <div className="mt-4 text-right">
                        <button
                          type="submit"
                          disabled={
                            savingNoteTicketId === selectedTicket._id ||
                            !internalNoteDrafts[selectedTicket._id]?.trim()
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          {savingNoteTicketId === selectedTicket._id
                            ? "Saving..."
                            : "Save Note"}
                        </button>
                      </div>
                    </form>
                  </article>
                </section>
              ) : (
                <div className="flex h-[800px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                  <TicketIcon className="mx-auto h-12 w-12 text-slate-200" />
                  <h2 className="mt-6 text-xl font-extrabold text-slate-900">
                    Select a Ticket
                  </h2>
                  <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                    Choose a request from the queue to view full details and
                    access the AI drafting engine.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
