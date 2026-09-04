"use client";

import {useCallback, useEffect, useState} from "react";
import {LoaderCircle, Plus, Search} from "lucide-react";

import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {getAdminHotelsClient} from "@/lib/admin/admin-hotel-client";
import {formatAdminDate} from "@/lib/admin/format-date";
import {
  HOTEL_STATUS_LABELS,
  type ApiHotelList,
  type ApiHotelSummary,
} from "@/lib/hotels/admin-hotel-types";

const STATUS_FILTERS = [
  {value: "", label: "All"},
  {value: "active", label: "Active"},
  {value: "disabled", label: "Disabled"},
] as const;

const StatusBadge = ({status}: {status: string}) => {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]"
          : "bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]"
      }`}
    >
      {HOTEL_STATUS_LABELS[status] ?? status}
    </span>
  );
};

export default function HotelsListClient() {
  const [hotels, setHotels] = useState<ApiHotelList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");

  useAdminRouteLoadingBoundary(isLoading);

  const loadHotels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setHotels(
        await getAdminHotelsClient({
          search: appliedSearch || undefined,
          status: status || undefined,
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load hotels.");
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, status]);

  useEffect(() => {
    void loadHotels();
  }, [loadHotels]);

  if (isLoading && !hotels) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading hotels…"
        description="Fetching the registered hotels from the backend."
      />
    );
  }

  if (error) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Hotels could not be loaded."
        description={error}
        actions={
          <Button onClick={() => void loadHotels()} variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  const items: ApiHotelSummary[] = hotels?.items ?? [];

  return (
    <AdminSectionCard
      title="Hotels"
      description="Hotels that sell Walk and Tour tours to their guests. Each hotel is granted the tours it may offer."
      actions={
        <Button asChild>
          <AdminProgressLink href="/hotels/new">
            <Plus className="size-4" />
            Register hotel
          </AdminProgressLink>
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(searchInput.trim());
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--wt-ink-muted)]" />
            <Input
              aria-label="Search hotels by name or CVR number"
              className="pl-9"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or CVR number"
              value={searchInput}
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-5">
          {STATUS_FILTERS.map((filter) => (
            <button
              className={`pb-1 text-sm transition ${
                status === filter.value
                  ? "border-b-2 border-[var(--wt-nav-marker)] font-medium text-[var(--wt-ink)]"
                  : "border-b-2 border-transparent text-[var(--wt-ink-muted)] hover:text-[var(--wt-ink)]"
              }`}
              key={filter.value || "all"}
              onClick={() => setStatus(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-[var(--wt-ink-muted)]">
          <LoaderCircle className="size-4 animate-spin" />
          Loading hotels…
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-[var(--wt-ink-muted)]">
          {appliedSearch || status
            ? "No hotels match these filters."
            : "No hotels are registered yet. Register the first one to get started."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--wt-rule-strong)] text-xs uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
                <th className="py-3 pr-4 font-semibold">Hotel</th>
                <th className="py-3 pr-4 font-semibold">CVR</th>
                <th className="py-3 pr-4 font-semibold">Contact</th>
                <th className="py-3 pr-4 font-semibold">Tours</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Updated</th>
                <th className="py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {items.map((hotel) => (
                <tr className="border-b border-[var(--wt-rule)] last:border-b-0" key={hotel.id}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[var(--wt-ink)]">{hotel.name}</p>
                    <p className="text-xs text-[var(--wt-ink-muted)]">{hotel.address}</p>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--wt-ink-muted)]">{hotel.cvr}</td>
                  <td className="py-3 pr-4 text-xs text-[var(--wt-ink-muted)]">
                    <p>{hotel.email}</p>
                    <p className="text-[var(--wt-ink-muted)]">{hotel.phone}</p>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-[var(--wt-ink-muted)]">{hotel.tourCount}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={hotel.status} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--wt-ink-muted)]">
                    {formatAdminDate(hotel.audit.updatedAt)}
                  </td>
                  <td className="py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <AdminProgressLink href={`/hotels/${hotel.id}`}>Open</AdminProgressLink>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hotels && hotels.total > items.length ? (
            <p className="pt-4 text-xs text-[var(--wt-ink-muted)]">
              Showing {items.length} of {hotels.total} hotels. Narrow the search to see the rest.
            </p>
          ) : null}
        </div>
      )}
    </AdminSectionCard>
  );
}
