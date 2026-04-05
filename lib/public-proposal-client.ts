"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {PublicProposal} from "@/lib/public-proposal-model";

export const getPublicProposalByHash = async (hash: string) =>
  fetchJson<PublicProposal | null>({
    input: `/api/internal/public/api/public/proposals/${hash}`,
    fallbackMessage: "Unable to load the proposal.",
    notFoundFallback: null,
  });

export const getProposalMediaUrl = (hash: string, mediaId: string) =>
  `/api/internal/public/api/public/proposals/${hash}/media/${mediaId}`;
