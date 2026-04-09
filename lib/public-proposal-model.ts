export interface ProposalPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface PublicProposalVersion {
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
  startPoint: ProposalPoint | null;
  endPoint: ProposalPoint | null;
  stripePaymentLink: string | null;
}

export interface PublicProposalMediaItem {
  mediaId: string;
  orderIndex: number;
  altText: string | null;
  contentType: string | null;
}

export interface PublicProposal {
  name: string | null;
  language: string;
  recipientName: string | null;
  expiresAt: string | null;
  mediaItems: PublicProposalMediaItem[];
  versions: PublicProposalVersion[];
}
