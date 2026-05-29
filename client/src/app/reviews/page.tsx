"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ThumbsUp, MessageSquare, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockReviews = [
  { id: "1", customer: "Alice Wanjiku", product: "Laptop Pro 15", rating: 5, comment: "Excellent quality and fast delivery!", status: "approved", date: "2026-05-20" },
  { id: "2", customer: "Bob Kamau", product: "Wireless Mouse", rating: 4, comment: "Good value for money.", status: "approved", date: "2026-05-19" },
  { id: "3", customer: "Carol Mwangi", product: "Mechanical Keyboard", rating: 3, comment: "Decent but could be better.", status: "pending", date: "2026-05-18" },
  { id: "4", customer: "David Ochieng", product: "USB-C Hub", rating: 5, comment: "Works perfectly with my setup!", status: "approved", date: "2026-05-17" },
  { id: "5", customer: "Emily Chebet", product: "Monitor 27\"", rating: 2, comment: "Screen has dead pixels.", status: "pending", date: "2026-05-16" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = mockReviews.filter((r) => {
    const matchSearch = r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-gray-400 text-sm mt-1">Customer reviews and product feedback.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-white font-bold">4.2</CardTitle>
            <CardDescription className="text-gray-400">Average Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <StarRating rating={4} />
          </CardContent>
        </Card>
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-white font-bold">12</CardTitle>
            <CardDescription className="text-gray-400">Total Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ThumbsUp className="h-4 w-4 text-green-400" /> 90% positive
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-white font-bold">2</CardTitle>
            <CardDescription className="text-gray-400">Pending Moderation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4 text-amber-400" /> Awaiting review
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#121A2B] border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">All Reviews</CardTitle>
            <CardDescription className="text-gray-400">Manage customer feedback</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-gray-700 bg-gray-800 pl-10 text-sm text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-white">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-white/10 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Customer</TableHead>
                <TableHead className="text-gray-400">Product</TableHead>
                <TableHead className="text-gray-400">Rating</TableHead>
                <TableHead className="text-gray-400">Comment</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No reviews found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((review) => (
                  <TableRow key={review.id} className="border-white/5">
                    <TableCell className="font-medium text-white">{review.customer}</TableCell>
                    <TableCell className="text-gray-300">{review.product}</TableCell>
                    <TableCell><StarRating rating={review.rating} /></TableCell>
                    <TableCell className="text-gray-400 max-w-[200px] truncate">{review.comment}</TableCell>
                    <TableCell>
                      <Badge variant={review.status === "approved" ? "default" : "warning"}>
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{review.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
