"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {LoaderCircle, Plus, ExternalLink, Copy, Check, Trash2, Search} from "lucide-react";
import {AdminProgressLink} from "@/components/admin/AdminRouteProgress";
import {AdminIconButton, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ConfirmDeleteDialog} from "@/components/admin/proposals/ConfirmDeleteDialog";
import {
  type AdminProposal,
  getAdminProposalsClient,
  deleteProposalClient,
  updateProposalClient,
} from "@/lib/admin/admin-proposal-client";
import {getLocalizedPath} from "@/i18n/locale-path";
import type {AppLocale} from "@/i18n/routing";

const getPublicOrigin = () => {
  if (typeof window === "undefined") return "";
  const {protocol, host} = window.location;
  const publicHost = host.replace(/^admin\./, "");
  return `${protocol}//${publicHost}`;
};

const PUBLICATION_COLORS: Record<string, string> = {
  published: "border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]",
  unpublished: "border-[var(--wt-status-pending)] bg-[var(--wt-status-pending-bg)] text-[var(--wt-ink)]",
};

const ACCEPTANCE_COLORS: Record<string, string> = {
  pending: "border-[var(--wt-status-pending)] bg-[var(--wt-status-pending-bg)] text-[var(--wt-ink)]",
  accepted: "border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]",
  expired: "border-[var(--wt-status-cancelled)] bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]",
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

  const handleCopyLink = async (hash: string, id: string, language: string) => {
    const path = getLocalizedPath({locale: language as AppLocale, pathname: `/private-tours/proposal/${hash}`});
    const url = `${getPublicOrigin()}${path}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <AdminSectionCard
        title="Proposals"
        description="Private tour proposals sent to a recipient, each with its own versions and public link."
        actions={
          <Button asChild>
            <AdminProgressLink href="/admin/proposals/new">
              <Plus className="size-4"/>
              New proposal
            </AdminProgressLink>
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--wt-ink-muted)]"/>
            <Input
              aria-label="Search proposals by recipient name or email"
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              value={searchQuery}
            />
          </div>

          <button
            className={`pb-1 text-sm transition ${
              showExpired
                ? "border-b-2 border-[var(--wt-nav-marker)] font-medium text-[var(--wt-ink)]"
                : "border-b-2 border-transparent text-[var(--wt-ink-muted)] hover:text-[var(--wt-ink)]"
            }`}
            onClick={() => setShowExpired(!showExpired)}
            type="button"
          >
            Show expired
          </button>

          {isLoading && (
            <LoaderCircle className="size-4 animate-spin text-[var(--wt-ink-muted)]"/>
          )}
        </div>

        {error && (
          <div className="pt-5">
            <p className="text-sm text-[var(--wt-danger)]">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchProposals(searchQuery, showExpired)}>
              Retry
            </Button>
          </div>
        )}

        {!error && !isLoading && proposals.length === 0 ? (
          <p className="pt-5 text-sm text-[var(--wt-ink-muted)]">
            {searchQuery || showExpired
              ? "No proposals match this search."
              : "Create your first proposal to get started."}
          </p>
        ) : null}

        {!error && proposals.length > 0 && (
          <div className="space-y-3 pt-5">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center gap-4 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white p-5 transition-colors hover:bg-[var(--wt-surface)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <AdminProgressLink
                    href={`/admin/proposals/${proposal.id}`}
                    className="text-base font-semibold text-[var(--wt-ink)] hover:text-[var(--wt-accent)]"
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
                <div className="mt-1.5 flex items-center gap-4 text-sm text-[var(--wt-ink-muted)]">
                  <span>{proposal.language.toUpperCase()}</span>
                  <span>{proposal.versionsCount} version{proposal.versionsCount !== 1 ? "s" : ""}</span>
                  <span>{formatDate(proposal.createdAt)}</span>
                  {proposal.expiresAt && (
                    <span className={isExpired(proposal) ? "text-[var(--wt-danger)]" : "text-[var(--wt-ink-muted)]"}>
                      {isExpired(proposal) ? "Expired" : "Expires"} {formatDate(proposal.expiresAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                  {/*
                    The same shared Button the tours list uses, so a row of
                    actions has one height and one border everywhere. These were
                    four hand-written elements with their own padding and text
                    size, which is why they never matched.
                  */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleTogglePublish(proposal)}
                  >
                    {proposal.publicationStatus === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <AdminIconButton
                    label="Copy public link"
                    onClick={() => void handleCopyLink(proposal.hash, proposal.id, proposal.language)}
                  >
                    {copiedId === proposal.id
                      ? <Check className="size-4 text-[var(--wt-status-confirmed)]"/>
                      : <Copy className="size-4"/>}
                  </AdminIconButton>
                  <AdminIconButton
                    href={`${getPublicOrigin()}${getLocalizedPath({locale: proposal.language as AppLocale, pathname: `/private-tours/proposal/${proposal.hash}`})}`}
                    label="Open public link"
                  >
                    <ExternalLink className="size-4"/>
                  </AdminIconButton>
                  <AdminIconButton
                    label="Delete proposal"
                    onClick={() => setDeleteTarget(proposal)}
                    tone="danger"
                  >
                    <Trash2 className="size-4"/>
                  </AdminIconButton>
              </div>
            </div>
          ))}
          </div>
        )}
      </AdminSectionCard>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => void handleConfirmDelete()}
        proposalName={deleteTarget?.recipientName || deleteTarget?.recipientEmail || "this proposal"}
      />
    </>
  );
}
