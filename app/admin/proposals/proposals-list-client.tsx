"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {LoaderCircle, Plus, ExternalLink, Copy, Check, Trash2, Search, X} from "lucide-react";
import {AdminProgressLink} from "@/components/admin/AdminRouteProgress";
import {AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {ConfirmDeleteDialog} from "@/components/admin/proposals/ConfirmDeleteDialog";
import {
  type AdminProposal,
  getAdminProposalsClient,
  deleteProposalClient,
  updateProposalClient,
} from "@/lib/admin/admin-proposal-client";

const getPublicOrigin = () => {
  if (typeof window === "undefined") return "";
  const {protocol, host} = window.location;
  const publicHost = host.replace(/^admin\./, "");
  return `${protocol}//${publicHost}`;
};

const PUBLICATION_COLORS: Record<string, string> = {
  published: "border-[#cfe4d3] bg-[#f3fbf4] text-[#2f6b3f]",
  unpublished: "border-[#e3d5b4] bg-[#fbf7ea] text-[#8a6029]",
};

const ACCEPTANCE_COLORS: Record<string, string> = {
  pending: "border-[#e3d5b4] bg-[#fbf7ea] text-[#8a6029]",
  accepted: "border-[#b4cde3] bg-[#eaf3fb] text-[#295e8a]",
  expired: "border-[#e8c7c1] bg-[#fbf2f0] text-[#a3483f]",
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const isExpired = (proposal: AdminProposal) =>
  proposal.expiresAt != null && new Date(proposal.expiresAt) < new Date();

const DEBOUNCE_MS = 300;

export function AdminProposalsListClient() {
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpired, setShowExpired] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AdminProposal | null>(null);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProposals = useCallback(async (search: string, includeExpired: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminProposalsClient({
        search: search || undefined,
        includeExpired: includeExpired || undefined,
      });
      setProposals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load proposals.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchProposals("", false);
  }, [fetchProposals]);

  // Refetch on showExpired change (immediate)
  useEffect(() => {
    void fetchProposals(searchQuery, showExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExpired]);

  // Debounced refetch on search change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchProposals(searchQuery, showExpired);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProposalClient(deleteTarget.id);
      setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete.");
    }
  };

  const handleTogglePublish = async (proposal: AdminProposal) => {
    const next = proposal.publicationStatus === "published" ? "unpublished" : "published";
    try {
      const updated = await updateProposalClient(proposal.id, {publicationStatus: next});
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to change publication status.");
    }
  };

  const handleCopyLink = async (hash: string, id: string) => {
    const url = `${getPublicOrigin()}/private-tours/proposal/${hash}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#21343b]">Proposals</h2>
        <AdminProgressLink
          href="/admin/proposals/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#21343b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2a30]"
        >
          <Plus className="h-4 w-4"/>
          New Proposal
        </AdminProgressLink>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8d7e]"/>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-[#eadfce] bg-white py-2.5 pl-9 pr-9 text-sm text-[#21343b] placeholder:text-[#9a8d7e]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8d7e] hover:text-[#21343b]"
            >
              <X className="h-4 w-4"/>
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm text-[#627176] select-none cursor-pointer hover:bg-[#fbf7f0]">
          <input
            type="checkbox"
            checked={showExpired}
            onChange={(e) => setShowExpired(e.target.checked)}
            className="h-4 w-4 rounded border-[#eadfce] accent-[#2b666d]"
          />
          Show expired
        </label>

        {isLoading && (
          <LoaderCircle className="h-4 w-4 animate-spin text-[#9a6a2f]"/>
        )}
      </div>

      {error && (
        <AdminSectionCard title="Proposals">
          <p className="text-sm text-[#a3483f]">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchProposals(searchQuery, showExpired)}>
            Retry
          </Button>
        </AdminSectionCard>
      )}

      {!error && !isLoading && proposals.length === 0 ? (
        <AdminSectionCard title={searchQuery || showExpired ? "No matching proposals" : "No proposals yet"}>
          <p className="text-sm text-[#627176]">
            {searchQuery || showExpired
              ? "Try adjusting your search or filters."
              : "Create your first proposal to get started."}
          </p>
        </AdminSectionCard>
      ) : null}

      {!error && proposals.length > 0 && (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center gap-4 rounded-2xl border border-[#eadfce] bg-white p-5 transition-colors hover:bg-[#fbf7f0]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <AdminProgressLink
                    href={`/admin/proposals/${proposal.id}`}
                    className="text-base font-semibold text-[#21343b] hover:text-[#2b666d]"
                  >
                    {proposal.recipientName || proposal.recipientEmail || "Unnamed Proposal"}
                  </AdminProgressLink>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PUBLICATION_COLORS[proposal.publicationStatus] ?? PUBLICATION_COLORS.unpublished}`}
                  >
                    {proposal.publicationStatus}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACCEPTANCE_COLORS[proposal.acceptanceStatus] ?? ACCEPTANCE_COLORS.pending}`}
                  >
                    {proposal.acceptanceStatus}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-sm text-[#627176]">
                  <span>{proposal.language.toUpperCase()}</span>
                  <span>{proposal.versionsCount} version{proposal.versionsCount !== 1 ? "s" : ""}</span>
                  <span>{formatDate(proposal.createdAt)}</span>
                  {proposal.expiresAt && (
                    <span className={isExpired(proposal) ? "text-[#a3483f]" : "text-[#627176]"}>
                      {isExpired(proposal) ? "Expired" : "Expires"} {formatDate(proposal.expiresAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleTogglePublish(proposal)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    proposal.publicationStatus === "published"
                      ? "border-[#e8c7c1] text-[#a3483f] hover:bg-[#fbf2f0]"
                      : "border-[#cfe4d3] text-[#2f6b3f] hover:bg-[#f3fbf4]"
                  }`}
                  title={proposal.publicationStatus === "published" ? "Unpublish proposal" : "Publish proposal"}
                >
                  {proposal.publicationStatus === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyLink(proposal.hash, proposal.id)}
                  className="rounded-lg border border-[#eadfce] p-2 text-[#627176] transition-colors hover:bg-[#f9f2e7] hover:text-[#21343b]"
                  title="Copy public link"
                >
                  {copiedId === proposal.id ? <Check className="h-4 w-4 text-[#2f6b3f]"/> : <Copy className="h-4 w-4"/>}
                </button>
                <a
                  href={`${getPublicOrigin()}/private-tours/proposal/${proposal.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#eadfce] p-2 text-[#627176] transition-colors hover:bg-[#f9f2e7] hover:text-[#21343b]"
                  title="Open public link"
                >
                  <ExternalLink className="h-4 w-4"/>
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(proposal)}
                  className="rounded-lg border border-[#e8c7c1] p-2 text-[#a3483f] transition-colors hover:bg-[#fbf2f0]"
                  title="Delete proposal"
                >
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => void handleConfirmDelete()}
        proposalName={deleteTarget?.recipientName || deleteTarget?.recipientEmail || "this proposal"}
      />
    </>
  );
}
