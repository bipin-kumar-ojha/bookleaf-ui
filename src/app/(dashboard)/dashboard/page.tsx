"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  PenTool,
  ChevronRight,
  BookOpen,
  AlertCircle,
  UserRound,
  Tags,
} from "lucide-react";
import {
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Globe,
  Hash,
  Barcode,
  Layers3,
  CheckCircle2,
  Store,
  CreditCard,
  Banknote,
  PackageCheck,
} from "lucide-react";

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  replies?: TicketReply[];
  aiPriority?: "Critical" | "High" | "Medium" | "Low" | "Unassigned";
  aiClassification?: string;
  aiDraftResponse?: string;
  author?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
  book?: {
    _id: string;
    title?: string;
    book_id?: string;
    isbn?: string;
  } | null;
}

interface TicketReply {
  _id?: string;
  sender: string | { _id?: string; name?: string; email?: string };
  senderRole: "admin" | "author";
  message: string;
  createdAt?: string;
}

interface Book {
  _id: string;
  author: string;
  book_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string;
  status: string;
  mrp: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  available_on: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AuthorDashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");

  // 1. Function ko useCallback mein wrap kiya taaki re-renders na ho
  const fetchMyTickets = useCallback(async () => {
    try {
      const response = await apiClient.get("/tickets");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }, []);

  const fetchMyBooks = useCallback(async () => {
    try {
      const response = await apiClient.get("/books");
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  }, []);

  // 2. Dependency array mein fetchMyTickets add kiya

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    // 1. Initial Load Functions
    const loadTickets = async () => {
      try {
        const response = await apiClient.get("/tickets");
        if (!cancelled) setTickets(response.data);
      } catch (error) {
        if (!cancelled) console.error("Error fetching tickets:", error);
      }
    };

    const loadBooks = async () => {
      try {
        const response = await apiClient.get("/books");
        if (!cancelled) setBooks(response.data);
      } catch (error) {
        if (!cancelled) console.error("Error fetching books:", error);
      }
    };

    void loadBooks();
    void loadTickets();

    // 2. Short Polling for Real-Time Updates (Every 5 seconds)
    const intervalId = setInterval(async () => {
      try {
        const response = await apiClient.get("/tickets");
        // State update tabhi hoga agar naya data purane se match nahi karega 
        // (React automatically re-renders optimize kar leta hai)
        if (!cancelled) setTickets(response.data);
      } catch (error) {
        console.error("Silent polling error:", error);
      }
    }, 5000); // 5000 milliseconds = 5 seconds

    // 3. Cleanup function
    return () => {
      cancelled = true;
      clearInterval(intervalId); // Page change hone par interval stop ho jayega
    };
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/tickets", {
        subject,
        description,
        bookId: selectedBook || null,
      });
      setSubject("");
      setDescription("");
      setSelectedBook("");

      await fetchMyTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-sans tracking-wide">
        Loading Author Space...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans pb-16">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://static.wixstatic.com/media/6d2cdc_fbad8eb25d304d57be46e9c494a1a355~mv2.jpg/v1/fill/w_360,h_162,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/book%20background%20white.jpg"
              alt="BookLeaf Publishing"
              className="h-12 object-contain"
            />
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-l-2 border-slate-200 pl-3 ml-1 hidden sm:block">
              Author Space
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-rose-600 rounded-full transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Banner */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 mb-8 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/5 transform rotate-12 pointer-events-none">
            <BookOpen className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Author"}!
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Manage your publishing journey, track your book&apos;s progress,
              and connect with our support team seamlessly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Col: Sticky New Request Form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-t-4 border-t-slate-900 border-x border-b border-slate-100 sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    New Request
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    We usually respond within 24 hours.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Related To
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-transparent text-black bg-slate-50"
                  >
                    <option value="">General / Account Level</option>

                    {books.map((book) => (
                      <option key={book._id} value={book._id}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Issue Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g., Missing royalty payout"
                    className="w-full px-4 py-3.5 rounded-xl border-transparent bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm shadow-inner text-slate-900 font-medium placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain your request or issue in detail..."
                    className="w-full px-4 py-3.5 rounded-xl border-transparent bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm resize-none shadow-inner text-slate-900 font-medium placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Attachment (Optional)
                  </label>
                  <input
                    type="file"
                    className="w-full px-4 py-2.5 rounded-xl border-transparent bg-slate-50 outline-none transition-all text-sm shadow-inner text-slate-500 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    "Sending Request..."
                  ) : (
                    <>
                      Send Support Request
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Col: Ticket History */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-px">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`pb-4 px-2 text-lg font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === "tickets" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <MessageSquare className="w-5 h-5" /> Support History
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">
                  {tickets.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("books")}
                className={`pb-4 px-2 text-lg font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === "books" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <BookOpen className="w-5 h-5" /> My Books
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">
                  {books.length}
                </span>
              </button>
            </div>

            <div className="space-y-4">
              {/* TAB CONTENT: TICKETS */}
              {/* TAB CONTENT: TICKETS */}
{activeTab === "tickets" && (
  <>
    {tickets.length > 0 ? (
      tickets.map((ticket) => (
        <article
          key={ticket._id}
          className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-y border-r border-slate-200 ${
            ticket.status === "Closed"
              ? "border-l-4 border-l-emerald-500"
              : ticket.status === "In Progress"
                ? "border-l-4 border-l-amber-500"
                : "border-l-4 border-l-slate-400"
          }`}
        >
          {/* Ticket Subject and Status */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
            <h3 className="font-bold text-slate-900 text-lg leading-tight break-words">
              {ticket.subject}
            </h3>

            <span
              className={`flex w-fit shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                ticket.status === "Closed"
                  ? "bg-emerald-50 text-emerald-700"
                  : ticket.status === "In Progress"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {ticket.status === "Closed" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : ticket.status === "In Progress" ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {ticket.status}
            </span>
          </div>

          {/* Author, Book, AI Priority and Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {/* Author */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                <UserRound className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Author
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-1">
                  {ticket.author?.name || user?.name || "Unknown Author"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {ticket.author?.email || user?.email || "No email available"}
                </p>
              </div>
            </div>

            {/* Related Book */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  Related Book
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-1">
                  {ticket.book?.title || "General / Account Level"}
                </p>
              </div>
            </div>

            {/* AI Priority */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                AI Priority
              </p>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                  ticket.aiPriority === "Critical"
                    ? "bg-rose-100 text-rose-700"
                    : ticket.aiPriority === "High"
                      ? "bg-orange-100 text-orange-700"
                      : ticket.aiPriority === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : ticket.aiPriority === "Low"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {ticket.aiPriority &&
                ticket.aiPriority !== "Unassigned"
                  ? ticket.aiPriority
                  : "Pending"}
              </span>
            </div>

            {/* AI Classification */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                AI Classification
              </p>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                <Tags className="w-3.5 h-3.5" />
                {ticket.aiClassification || "Pending"}
              </span>
            </div>
          </div>

          {/* Ticket Description */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
              {ticket.description}
            </p>
          </div>

          {ticket.replies && ticket.replies.length > 0 && (
            <section
              aria-label="Conversation replies"
              className="mt-5 border-t border-slate-100 pt-5"
            >
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MessageSquare className="h-4 w-4" />
                Replies
              </h4>
              <div className="space-y-3">
                {ticket.replies.map((reply, index) => {
                  const replyDate = reply.createdAt
                    ? new Date(reply.createdAt)
                    : null;
                  const replyDateLabel =
                    replyDate && !Number.isNaN(replyDate.getTime())
                      ? replyDate.toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : null;

                  return (
                    <article
                      key={reply._id || `${reply.createdAt || "reply"}-${index}`}
                      className={`rounded-xl border p-4 ${
                        reply.senderRole === "admin"
                          ? "border-indigo-100 bg-indigo-50/60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700">
                          {reply.senderRole === "admin" ? "BookLeaf Support" : "You"}
                        </p>
                        {replyDateLabel && (
                          <time className="text-xs text-slate-400">
                            {replyDateLabel}
                          </time>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                        {reply.message}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Submission Date */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 pt-4 border-t border-slate-100">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              Submitted:{" "}
              {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </article>
      ))
    ) : (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-6 border border-slate-100">
          <MessageSquare className="w-8 h-8 text-slate-300" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          No requests yet
        </h3>

        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          If you face any issues with publishing, formatting, or
          royalties, feel free to drop a request here.
        </p>
      </div>
    )}
  </>
)}

              {/* TAB CONTENT: MY BOOKS */}
              {activeTab === "books" && (
                <div className="space-y-6">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        My Books
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Manage your published titles and track your royalty
                        earnings.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start px-3 py-2 rounded-xl bg-white border border-slate-200">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        {books.length} {books.length === 1 ? "Book" : "Books"}
                      </span>
                    </div>
                  </div>

                  {/* Book List */}
                  {books.length > 0 ? (
                    <div className="space-y-5">
                      {books.map((book: Book) => {
                        const status = book.status?.trim() || "Unknown";
                        const normalizedStatus = status.toLowerCase();

                        const statusClasses =
                          normalizedStatus === "published"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : normalizedStatus === "pending"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : normalizedStatus === "draft"
                                ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                                : normalizedStatus === "rejected"
                                  ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                                  : "bg-indigo-50 text-indigo-700 ring-indigo-600/20";

                        const formatDate = (date: string) => {
                          if (!date) return "Not provided";

                          const parsedDate = new Date(date);

                          return Number.isNaN(parsedDate.getTime())
                            ? "Not provided"
                            : parsedDate.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              });
                        };

                        const formatCurrency = (amount: number) =>
                          `₹${(Number.isFinite(Number(amount))
                            ? Number(amount)
                            : 0
                          ).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}`;

                        const copiesSold = Number(book.total_copies_sold) || 0;
                        const totalEarned =
                          Number(book.total_royalty_earned) || 0;
                        const royaltyPaid = Number(book.royalty_paid) || 0;
                        const royaltyPending =
                          Number(book.royalty_pending) || 0;

                        return (
                          <article
                            key={book._id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                          >
                            {/* Book Header */}
                            <div className="p-5 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                  <div className="shrink-0 w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <BookOpen className="w-7 h-7 text-indigo-600" />
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                                      {book.title || "Untitled Book"}
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-1">
                                      By {user?.name || "Author"}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses}`}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {status}
                                      </span>

                                      {book.genre && (
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                          {book.genre}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="sm:text-right shrink-0">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    MRP
                                  </p>
                                  <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(Number(book.mrp) || 0)}
                                  </p>
                                </div>
                              </div>

                              {/* Book Information */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-slate-50">
                                    <Barcode className="w-4 h-4 text-slate-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs text-slate-400 font-medium">
                                      ISBN
                                    </p>
                                    <p className="text-sm font-semibold text-slate-800 mt-1 break-all">
                                      {book.isbn || "Not provided"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-slate-50">
                                    <CalendarDays className="w-4 h-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 font-medium">
                                      Publication Date
                                    </p>
                                    <p className="text-sm font-semibold text-slate-800 mt-1">
                                      {formatDate(book.publication_date)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-slate-50">
                                    <Layers3 className="w-4 h-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 font-medium">
                                      Copies Sold
                                    </p>
                                    <p className="text-sm font-semibold text-slate-800 mt-1">
                                      {copiesSold.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Royalty Summary */}
                              <div className="mt-6">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">
                                  Royalty Summary
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                      <TrendingUp className="w-4 h-4" />
                                      <p className="text-xs font-semibold">
                                        Total Earned
                                      </p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-700 mt-2">
                                      {formatCurrency(totalEarned)}
                                    </p>
                                  </div>

                                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <p className="text-xs font-semibold">
                                        Royalty Paid
                                      </p>
                                    </div>
                                    <p className="text-xl font-bold text-blue-700 mt-2">
                                      {formatCurrency(royaltyPaid)}
                                    </p>
                                  </div>

                                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                                    <div className="flex items-center gap-2 text-amber-700">
                                      <Wallet className="w-4 h-4" />
                                      <p className="text-xs font-semibold">
                                        Royalty Pending
                                      </p>
                                    </div>
                                    <p className="text-xl font-bold text-amber-700 mt-2">
                                      {formatCurrency(royaltyPending)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Availability */}
                              <div className="mt-6 pt-5 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <Globe className="w-4 h-4 text-slate-500" />
                                  <h4 className="text-sm font-bold text-slate-800">
                                    Available On
                                  </h4>
                                </div>

                                {book.available_on?.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {book.available_on.map(
                                      (platform, index) => (
                                        <span
                                          key={`${platform}-${index}`}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600"
                                        >
                                          <Store className="w-3.5 h-3.5 text-slate-400" />
                                          {platform}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400">
                                    No availability platforms listed.
                                  </p>
                                )}
                              </div>

                              {/* Record Timestamps */}
                              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-slate-400">
                                <p>Added: {formatDate(book.createdAt)}</p>
                                <p>
                                  Last updated: {formatDate(book.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-16 sm:py-24 px-6 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mb-5">
                        <BookOpen className="w-8 h-8 text-indigo-500" />
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        No books found
                      </h3>

                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                        Your published titles, sales figures, and royalty
                        details will appear here once books have been added to
                        your account.
                      </p>
                    </div>
                  )}
                </div>
              )}

             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
