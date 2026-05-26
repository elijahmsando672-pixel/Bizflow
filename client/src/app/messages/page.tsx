"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Mail, Phone, Tag, Inbox, Send, CheckCircle, Archive } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const mockMessages = [
  { id: "1", from: "Alice Wanjiku", email: "alice@example.com", subject: "Order #1234 status", message: "Hi, I'd like to check the status of my recent order.", status: "unread", priority: "high", date: "2026-05-20" },
  { id: "2", from: "Bob Kamau", email: "bob@example.com", subject: "Product inquiry", message: "Do you have the wireless mouse in stock?", status: "read", priority: "normal", date: "2026-05-19" },
  { id: "3", from: "Carol Mwangi", email: "carol@example.com", subject: "Return request", message: "I received a damaged item and would like to return it.", status: "unread", priority: "high", date: "2026-05-18" },
  { id: "4", from: "David Ochieng", email: "david@example.com", subject: "Billing question", message: "I was charged twice for my last order.", status: "read", priority: "normal", date: "2026-05-17" },
  { id: "5", from: "Emily Chebet", email: "emily@example.com", subject: "New order placed", message: "Just placed a new order, please confirm.", status: "replied", priority: "low", date: "2026-05-16" },
];

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = mockMessages.filter((m) => {
    const matchSearch = m.from.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  const selectedMessage = mockMessages.find((m) => m.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-gray-400 text-sm mt-1">Customer messages and inquiries.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Inbox", value: "5", icon: Inbox, color: "text-blue-400" },
          { label: "Unread", value: "2", icon: Mail, color: "text-red-400" },
          { label: "Replied", value: "1", icon: Send, color: "text-green-400" },
          { label: "Archived", value: "0", icon: Archive, color: "text-gray-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#121A2B] border-white/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl text-white font-bold">{stat.value}</CardTitle>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400">{stat.label}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#121A2B] border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">All Messages</CardTitle>
            <CardDescription className="text-gray-400">Manage customer inquiries</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-gray-700 bg-gray-800 pl-10 text-sm text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-white/10 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No messages found
              </div>
            ) : (
              filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelected(selected === msg.id ? null : msg.id)}
                  className={cn(
                    "w-full text-left p-4 transition hover:bg-white/5",
                    msg.status === "unread" && "bg-indigo-500/5",
                    selected === msg.id && "bg-white/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                        msg.status === "unread"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-gray-700 text-gray-400"
                      )}>
                        {msg.from.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          msg.status === "unread" ? "text-white font-medium" : "text-gray-300"
                        )}>
                          {msg.from}
                        </p>
                        <p className={cn(
                          "text-xs truncate",
                          msg.status === "unread" ? "text-gray-300" : "text-gray-500"
                        )}>
                          {msg.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {msg.priority === "high" && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">High</Badge>
                      )}
                      <span className="text-xs text-gray-500">{msg.date}</span>
                    </div>
                  </div>
                  {selected === msg.id && (
                    <div className="mt-4 pl-12 pr-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                          <Mail className="h-3.5 w-3.5" />
                          {msg.email}
                          <span className="mx-2">|</span>
                          <Phone className="h-3.5 w-3.5" />
                          ---
                        </div>
                        <p className="text-sm text-gray-300">{msg.message}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            <Send className="h-3.5 w-3.5 mr-1.5" /> Reply
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400">
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Mark Read
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
