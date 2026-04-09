"use client";

import {fetchJson} from "@/lib/api/client-json";

export interface AdminProposalVersion {
  id: string;
  orderIndex: number;
  tourDate: string | null;
  durationMinutes: number | null;
  title: string;
  description: string | null;
  itineraryDescription: string | null;
  priceAmount: string;
  priceCurrency: string;
  included: string[];
  notIncluded: string[];
  cancellationPolicy: string | null;
  startPoint: { lat: number; lng: number; label?: string } | null;
  endPoint: { lat: number; lng: number; label?: string } | null;
  stripePaymentLink: string | null;
}

export interface AdminProposalMediaItem {
  rowId: string;
  mediaId: string;
  orderIndex: number;
  altText: Record<string, string> | null;
  media: {
    id: string;
    mediaType: string;
    contentType: string;
    originalFilename: string;
    size: number;
  } | null;
}

export interface AdminProposal {
  id: string;
  hash: string;
  name: string | null;
  language: string;
  recipientName: string | null;
  recipientEmail: string | null;
  acceptanceStatus: string;
  publicationStatus: string;
  expiresAt: string | null;
  notes: string | null;
  versionsCount: number;
  versions: AdminProposalVersion[];
  mediaItems: AdminProposalMediaItem[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const PROPOSALS_BASE = "/api/internal/admin/proposals";

export const getAdminProposalsClient = (params?: { search?: string; includeExpired?: boolean }) => {
  const searchParams = new URLSearchParams();
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.includeExpired) searchParams.set("includeExpired", "true");
  const query = searchParams.toString();
  return fetchJson<AdminProposal[]>({
    input: query ? `${PROPOSALS_BASE}?${query}` : PROPOSALS_BASE,
    fallbackMessage: "Unable to load proposals.",
  });
};

export const getAdminProposalClient = (id: string) =>
  fetchJson<AdminProposal | null>({
    input: `${PROPOSALS_BASE}/${id}`,
    fallbackMessage: "Unable to load the proposal.",
    notFoundFallback: null,
  });

export const createProposalClient = (body: Record<string, unknown>) =>
  fetchJson<AdminProposal>({
    input: PROPOSALS_BASE,
    init: {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    },
    fallbackMessage: "Unable to create the proposal.",
  });

export const updateProposalClient = (id: string, body: Record<string, unknown>) =>
  fetchJson<AdminProposal>({
    input: `${PROPOSALS_BASE}/${id}`,
    init: {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    },
    fallbackMessage: "Unable to update the proposal.",
  });

export const deleteProposalClient = async (id: string) => {
  const response = await fetch(`${PROPOSALS_BASE}/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to delete the proposal.");
  }
};

export const createProposalVersionClient = (proposalId: string, body: Record<string, unknown>) =>
  fetchJson<AdminProposal>({
    input: `${PROPOSALS_BASE}/${proposalId}/versions`,
    init: {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    },
    fallbackMessage: "Unable to add the version.",
  });

export const updateProposalVersionClient = (proposalId: string, versionId: string, body: Record<string, unknown>) =>
  fetchJson<AdminProposal>({
    input: `${PROPOSALS_BASE}/${proposalId}/versions/${versionId}`,
    init: {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    },
    fallbackMessage: "Unable to update the version.",
  });

export const deleteProposalVersionClient = async (proposalId: string, versionId: string) => {
  const response = await fetch(`${PROPOSALS_BASE}/${proposalId}/versions/${versionId}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to delete the version.");
  }
};

export const attachProposalMediaClient = (proposalId: string, body: Record<string, unknown>) =>
  fetchJson<AdminProposal>({
    input: `${PROPOSALS_BASE}/${proposalId}/media`,
    init: {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    },
    fallbackMessage: "Unable to attach media.",
  });

export const sendProposalToRecipientClient = (proposalId: string) =>
  fetchJson<{ message: string }>({
    input: `${PROPOSALS_BASE}/${proposalId}/send`,
    init: {
      method: "POST",
      headers: {"Content-Type": "application/json"},
    },
    fallbackMessage: "Unable to send the proposal.",
  });

export const detachProposalMediaClient = async (proposalId: string, rowId: string) => {
  const response = await fetch(`${PROPOSALS_BASE}/${proposalId}/media/${rowId}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to detach media.");
  }
};
