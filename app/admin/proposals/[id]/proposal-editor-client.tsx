"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronUp,
  Copy,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {AdminProgressLink} from "@/components/admin/AdminRouteProgress";
import {AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AdminProposal,
  attachProposalMediaClient,
  createProposalClient,
  createProposalVersionClient,
  deleteProposalVersionClient,
  detachProposalMediaClient,
  getAdminProposalClient,
  sendProposalToRecipientClient,
  updateProposalClient,
  updateProposalVersionClient,
} from "@/lib/admin/admin-proposal-client";
import {
  type ApiAdminMediaAsset,
  type ApiAdminMediaAssetListResponse,
  listAdminMediaAssets,
  uploadAdminMediaAsset,
} from "@/lib/admin/media-client";

const getPublicOrigin = () => {
  if (typeof window === "undefined") return "";
  const {protocol, host} = window.location;
  const publicHost = host.replace(/^admin\./, "");
  return `${protocol}//${publicHost}`;
};

const toLocalDatetimeString = (isoString: string): string => {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ACCEPTANCE_STATUSES = ["pending", "accepted", "expired"] as const;
const PUBLICATION_STATUSES = ["published", "unpublished"] as const;
const LANGUAGES: { code: string; name: string }[] = [
  {code: "en", name: "English"},
  {code: "es", name: "Spanish"},
  {code: "it", name: "Italian"},
];
const MEDIA_PAGE_SIZE = 24;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

type VersionFormData = {
  tourDate: string;
  durationMinutes: string;
  title: string;
  description: string;
  itineraryDescription: string;
  priceAmount: string;
  priceCurrency: string;
  included: string;
  notIncluded: string;
  cancellationPolicy: string;
  stripePaymentLink: string;
  startPointLabel: string;
  endPointLabel: string;
};

type LocalVersion = VersionFormData & {
  localId: string;
  serverId: string | null;
  savedSnapshot: VersionFormData | null;
};

const isVersionDirty = (v: LocalVersion): boolean => {
  if (!v.savedSnapshot) return true;
  const keys = Object.keys(v.savedSnapshot) as (keyof VersionFormData)[];
  return keys.some((k) => v[k] !== v.savedSnapshot![k]);
};

let nextLocalId = 1;
const generateLocalId = () => `local-${nextLocalId++}`;

const emptyVersionForm = (): VersionFormData => ({
  tourDate: "",
  durationMinutes: "",
  title: "",
  description: "",
  itineraryDescription: "",
  priceAmount: "",
  priceCurrency: "EUR",
  included: "",
  notIncluded: "",
  cancellationPolicy: "",
  stripePaymentLink: "",
  startPointLabel: "",
  endPointLabel: "",
});

const serverVersionToLocal = (v: { id: string; tourDate: string | null; durationMinutes: number | null; title: string; description: string | null; itineraryDescription: string | null; priceAmount: string; priceCurrency: string; included: string[]; notIncluded: string[]; cancellationPolicy: string | null; stripePaymentLink: string | null; startPoint: { label?: string } | null; endPoint: { label?: string } | null }): LocalVersion => {
  const formData: VersionFormData = {
    tourDate: v.tourDate ? toLocalDatetimeString(v.tourDate) : "",
    durationMinutes: v.durationMinutes != null ? String(v.durationMinutes) : "",
    title: v.title,
    description: v.description ?? "",
    itineraryDescription: v.itineraryDescription ?? "",
    priceAmount: v.priceAmount,
    priceCurrency: v.priceCurrency,
    included: v.included.join("\n"),
    notIncluded: v.notIncluded.join("\n"),
    cancellationPolicy: v.cancellationPolicy ?? "",
    stripePaymentLink: v.stripePaymentLink ?? "",
    startPointLabel: v.startPoint?.label ?? "",
    endPointLabel: v.endPoint?.label ?? "",
  };
  return {...formData, localId: generateLocalId(), serverId: v.id, savedSnapshot: {...formData}};
};

const buildVersionBody = (v: VersionFormData, orderIndex: number): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    orderIndex,
    title: v.title,
    priceAmount: Number(v.priceAmount),
    priceCurrency: v.priceCurrency,
    included: v.included.split("\n").map((s) => s.trim()).filter(Boolean),
    notIncluded: v.notIncluded.split("\n").map((s) => s.trim()).filter(Boolean),
  };
  if (v.tourDate) body.tourDate = new Date(v.tourDate).toISOString();
  if (v.durationMinutes !== "") body.durationMinutes = Number(v.durationMinutes);
  if (v.description) body.description = v.description;
  if (v.itineraryDescription) body.itineraryDescription = v.itineraryDescription;
  if (v.cancellationPolicy) body.cancellationPolicy = v.cancellationPolicy;
  if (v.stripePaymentLink) body.stripePaymentLink = v.stripePaymentLink;
  if (v.startPointLabel) body.startPoint = {lat: 0, lng: 0, label: v.startPointLabel};
  if (v.endPointLabel) body.endPoint = {lat: 0, lng: 0, label: v.endPointLabel};
  return body;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type ProposalEditorClientProps = {
  proposalId: string | null;
  accessToken: string;
  backendApiBaseUrl: string;
};

export function ProposalEditorClient({proposalId, accessToken, backendApiBaseUrl}: ProposalEditorClientProps) {
  const router = useRouter();
  const isNew = proposalId === null;

  const [proposal, setProposal] = useState<AdminProposal | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentDialogEmail, setSentDialogEmail] = useState<string | null>(null);
  const [versionFormErrors, setVersionFormErrors] = useState<string[]>([]);
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<LocalVersion | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  // Metadata form state
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [acceptanceStatus, setAcceptanceStatus] = useState("pending");
  const [publicationStatus, setPublicationStatus] = useState("unpublished");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  // Local versions (in-memory until Save All)
  const [localVersions, setLocalVersions] = useState<LocalVersion[]>([]);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState<VersionFormData>(emptyVersionForm());

  // Media dialog state
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaSearchInput, setMediaSearchInput] = useState("");
  const [appliedMediaSearch, setAppliedMediaSearch] = useState("");
  const [mediaLibraryItems, setMediaLibraryItems] = useState<ApiAdminMediaAsset[]>([]);
  const [mediaLibraryPage, setMediaLibraryPage] = useState(1);
  const [mediaLibraryTotal, setMediaLibraryTotal] = useState(0);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaDialogError, setMediaDialogError] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewLoadingRef = useRef(new Set<string>());

  // Current attached image
  const currentMedia = proposal?.mediaItems?.[0] ?? null;
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!proposalId) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await getAdminProposalClient(proposalId);
      if (!data) {
        setError("Proposal not found.");
        return;
      }
      setProposal(data);
      setName(data.name ?? "");
      setLanguage(data.language);
      setRecipientName(data.recipientName ?? "");
      setRecipientEmail(data.recipientEmail ?? "");
      setAcceptanceStatus(data.acceptanceStatus);
      setPublicationStatus(data.publicationStatus);
      setExpiresAt(data.expiresAt ? toLocalDatetimeString(data.expiresAt) : "");
      setNotes(data.notes ?? "");
      setLocalVersions(data.versions.map(serverVersionToLocal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load proposal.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Load preview for current attached image
  useEffect(() => {
    if (!currentMedia?.media) {
      setCurrentImagePreview(null);
      return;
    }
    const contentUrl = `${backendApiBaseUrl.replace(/\/$/, "")}/api/admin/media/${currentMedia.mediaId}/content`;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(contentUrl, {headers: {Authorization: `Bearer ${accessToken}`}, cache: "no-store"});
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        setCurrentImagePreview(URL.createObjectURL(blob));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [currentMedia?.mediaId, accessToken, backendApiBaseUrl, currentMedia?.media]);

  // ─── Media dialog helpers ──────────────────────────────────

  const loadMediaPage = async ({page, search, append}: { page: number; search: string; append: boolean }) => {
    setIsLoadingMedia(true);
    setMediaDialogError(null);
    const result = await listAdminMediaAssets({accessToken, backendApiBaseUrl, page, limit: MEDIA_PAGE_SIZE, search});
    if (result.ok) {
      setMediaLibraryItems((prev) => append ? [...prev, ...result.response.items] : result.response.items);
      setMediaLibraryPage(page);
      setMediaLibraryTotal(result.response.total);
      // Load previews
      for (const asset of result.response.items) {
        void loadAssetPreview(asset);
      }
    } else {
      setMediaDialogError(result.message);
    }
    setIsLoadingMedia(false);
  };

  const loadAssetPreview = async (asset: ApiAdminMediaAsset) => {
    if (previewLoadingRef.current.has(asset.id) || mediaPreviewUrls[asset.id]) return;
    previewLoadingRef.current.add(asset.id);
    try {
      const res = await fetch(asset.adminContentUrl, {headers: {Authorization: `Bearer ${accessToken}`}, cache: "no-store"});
      if (!res.ok) return;
      const blob = await res.blob();
      setMediaPreviewUrls((prev) => ({...prev, [asset.id]: URL.createObjectURL(blob)}));
    } catch { /* ignore */ }
  };

  const openMediaDialog = () => {
    setIsMediaDialogOpen(true);
    setMediaSearchInput("");
    setAppliedMediaSearch("");
    setSelectedMediaId(null);
    setMediaDialogError(null);
    void loadMediaPage({page: 1, search: "", append: false});
  };

  const handleMediaSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedMediaSearch(mediaSearchInput);
    void loadMediaPage({page: 1, search: mediaSearchInput, append: false});
  };

  const handleUploadInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMediaDialogError("Only image files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setMediaDialogError(`File exceeds the ${formatFileSize(MAX_UPLOAD_SIZE)} limit.`);
      return;
    }

    setIsUploadingMedia(true);
    setMediaDialogError(null);
    const result = await uploadAdminMediaAsset({
      accessToken,
      backendApiBaseUrl,
      file,
      folder: proposalId ? `proposals/${proposalId}` : "proposals/new",
    });

    if (result.ok) {
      const newAsset = {
        id: result.media.id,
        originalFilename: result.media.originalFilename,
        storagePath: result.media.storagePath,
        contentType: result.media.contentType,
        mediaType: result.media.mediaType,
        adminContentUrl: result.media.adminContentUrl,
        publicContentUrl: result.media.adminContentUrl,
        size: result.media.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ApiAdminMediaAsset;
      setMediaLibraryItems((prev) => [newAsset, ...prev]);
      setSelectedMediaId(newAsset.id);
      void loadAssetPreview(newAsset);
    } else {
      setMediaDialogError(result.message);
    }
    setIsUploadingMedia(false);
  };

  const handleAttachSelectedImage = async () => {
    if (!proposalId || !selectedMediaId) return;

    setIsLoadingMedia(true);
    try {
      // Detach current image if exists
      if (currentMedia) {
        await detachProposalMediaClient(proposalId, currentMedia.rowId);
      }
      // Attach new image
      const updated = await attachProposalMediaClient(proposalId, {mediaId: selectedMediaId, orderIndex: 0});
      setProposal(updated);
      setIsMediaDialogOpen(false);
      setSelectedMediaId(null);
    } catch (err) {
      setMediaDialogError(err instanceof Error ? err.message : "Unable to attach image.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!proposalId || !currentMedia) return;
    try {
      await detachProposalMediaClient(proposalId, currentMedia.rowId);
      setProposal((prev) => prev ? {...prev, mediaItems: []} : prev);
      setCurrentImagePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove image.");
    }
  };

  // ─── Local version management ──────────────────────────────

  const validateVersionForm = (): string[] => {
    const errors: string[] = [];
    if (!versionForm.title.trim()) errors.push("Title is required.");
    if (!versionForm.tourDate) errors.push("Tour date & time is required.");
    if (!versionForm.durationMinutes) errors.push("Duration is required.");
    if (!versionForm.priceAmount) errors.push("Price amount is required.");
    if (!versionForm.priceCurrency.trim()) errors.push("Currency is required.");
    if (!versionForm.description.trim()) errors.push("Description is required.");
    if (!versionForm.itineraryDescription.trim()) errors.push("Itinerary description is required.");
    if (!versionForm.included.trim()) errors.push("At least one included item is required.");
    if (!versionForm.notIncluded.trim()) errors.push("At least one not-included item is required.");
    if (!versionForm.cancellationPolicy.trim()) errors.push("Cancellation policy is required.");
    if (!versionForm.startPointLabel.trim()) errors.push("Start point is required.");
    if (!versionForm.endPointLabel.trim()) errors.push("End point is required.");
    if (!versionForm.stripePaymentLink.trim()) {
      errors.push("Stripe payment link is required.");
    } else {
      try {
        const url = new URL(versionForm.stripePaymentLink.trim());
        if (!url.protocol.startsWith("http")) errors.push("Stripe payment link must be a valid URL starting with http:// or https://.");
      } catch {
        errors.push("Stripe payment link must be a valid URL (e.g. https://buy.stripe.com/...).");
      }
    }
    if (versionForm.priceAmount && Number(versionForm.priceAmount) < 0) errors.push("Price must be zero or positive.");
    if (versionForm.durationMinutes && Number(versionForm.durationMinutes) < 0) errors.push("Duration must be zero or positive.");
    return errors;
  };

  const handleAddVersion = () => {
    const errors = validateVersionForm();
    if (errors.length > 0) { setVersionFormErrors(errors); return; }
    setVersionFormErrors([]);
    const newLocalId = generateLocalId();
    setLocalVersions((prev) => [
      ...prev,
      {...versionForm, localId: newLocalId, serverId: null, savedSnapshot: null},
    ]);
    setEditingLocalId(newLocalId);
  };

  const handleUpdateLocalVersion = () => {
    if (!editingLocalId) return;
    const errors = validateVersionForm();
    if (errors.length > 0) { setVersionFormErrors(errors); return; }
    setVersionFormErrors([]);
    setLocalVersions((prev) =>
      prev.map((v) =>
        v.localId === editingLocalId ? {...v, ...versionForm} : v,
      ),
    );
  };

  const handleConfirmDeleteVersion = async () => {
    if (!deleteVersionTarget) return;
    const {localId, serverId} = deleteVersionTarget;

    // If saved on server, delete from backend
    if (serverId && proposalId) {
      try {
        await deleteProposalVersionClient(proposalId, serverId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete the version.");
        setDeleteVersionTarget(null);
        return;
      }
    }

    // Remove from local state
    setLocalVersions((prev) => prev.filter((v) => v.localId !== localId));
    if (editingLocalId === localId) {
      setEditingLocalId(null);
      setVersionForm(emptyVersionForm());
    }
    setDeleteVersionTarget(null);

    // Reload to get updated publication status
    if (serverId && proposalId) {
      await load(true);
    }
  };

  const startEditLocalVersion = (version: LocalVersion) => {
    setEditingLocalId(version.localId);
    setVersionForm({
      tourDate: version.tourDate,
      durationMinutes: version.durationMinutes,
      title: version.title,
      description: version.description,
      itineraryDescription: version.itineraryDescription,
      priceAmount: version.priceAmount,
      priceCurrency: version.priceCurrency,
      included: version.included,
      notIncluded: version.notIncluded,
      cancellationPolicy: version.cancellationPolicy,
      stripePaymentLink: version.stripePaymentLink,
      startPointLabel: version.startPointLabel,
      endPointLabel: version.endPointLabel,
    });
  };

  // ─── Save All ──────────────────────────────────────────────

  const validateVersionData = (v: VersionFormData): string[] => {
    const errors: string[] = [];
    if (!v.title.trim()) errors.push("Title");
    if (!v.tourDate) errors.push("Tour date & time");
    if (!v.durationMinutes) errors.push("Duration");
    if (!v.priceAmount) errors.push("Price amount");
    if (!v.priceCurrency.trim()) errors.push("Currency");
    if (!v.description.trim()) errors.push("Description");
    if (!v.itineraryDescription.trim()) errors.push("Itinerary description");
    if (!v.included.trim()) errors.push("Included items");
    if (!v.notIncluded.trim()) errors.push("Not-included items");
    if (!v.cancellationPolicy.trim()) errors.push("Cancellation policy");
    if (!v.startPointLabel.trim()) errors.push("Start point");
    if (!v.endPointLabel.trim()) errors.push("End point");
    if (!v.stripePaymentLink.trim()) {
      errors.push("Stripe payment link");
    } else {
      try {
        const url = new URL(v.stripePaymentLink.trim());
        if (!url.protocol.startsWith("http")) errors.push("Stripe payment link (invalid URL)");
      } catch {
        errors.push("Stripe payment link (invalid URL)");
      }
    }
    return errors;
  };

  const handleSaveAll = async () => {
    // Auto-apply any pending version form edits before saving
    let versionsToSave = localVersions;
    if (editingLocalId) {
      const formErrors = validateVersionForm();
      if (formErrors.length > 0) {
        setVersionFormErrors(formErrors);
        return;
      }
      setVersionFormErrors([]);
      versionsToSave = localVersions.map((v) =>
        v.localId === editingLocalId ? {...v, ...versionForm} : v,
      );
      setLocalVersions(versionsToSave);
    }

    // Validate all versions have complete data
    for (let i = 0; i < versionsToSave.length; i++) {
      const missing = validateVersionData(versionsToSave[i]);
      if (missing.length > 0) {
        setError(`Proposal ${i + 1} ("${versionsToSave[i].title || "Untitled"}") is missing: ${missing.join(", ")}.`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      let currentProposalId = proposalId;

      if (isNew) {
        const metadataBody: Record<string, unknown> = {
          name: name || undefined,
          language,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          notes: notes || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        };
        const created = await createProposalClient(metadataBody);
        currentProposalId = created.id;
      }

      if (!currentProposalId) return;

      // Create or update versions (deletions are handled immediately via the delete button)
      for (let i = 0; i < versionsToSave.length; i++) {
        const lv = versionsToSave[i];
        const body = buildVersionBody(lv, i);
        if (lv.serverId) {
          await updateProposalVersionClient(currentProposalId, lv.serverId, body);
        } else {
          await createProposalVersionClient(currentProposalId, body);
        }
      }

      // Save metadata last (so auto-unpublish from version deletion isn't overwritten)
      if (!isNew) {
        await updateProposalClient(currentProposalId, {
          name: name || undefined,
          language,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          notes: notes || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          acceptanceStatus,
          // Never send publicationStatus here — it's controlled only via the Publish/Unpublish button
        });
      }

      if (isNew) {
        router.push(`/admin/proposals/${currentProposalId}`);
      } else {
        await load(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!proposalId || !proposal) return;
    const next = proposal.publicationStatus === "published" ? "unpublished" : "published";
    if (next === "published") {
      const savedVersionCount = localVersions.filter((v) => v.serverId).length;
      if (savedVersionCount === 0) {
        setError("Cannot publish a proposal without at least one saved version. Save your changes first.");
        return;
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateProposalClient(proposalId, {publicationStatus: next});
      setProposal(updated);
      setPublicationStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change publication status.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestSend = () => {
    if (!proposalId || !proposal) return;
    if (proposal.publicationStatus !== "published") {
      setError("The proposal must be published before sending it to the recipient.");
      return;
    }
    if (!proposal.recipientEmail) {
      setError("The proposal does not have a recipient email address. Add one and save first.");
      return;
    }
    setShowSendConfirm(true);
  };

  const handleConfirmSend = async () => {
    if (!proposalId || !proposal?.recipientEmail) return;
    setShowSendConfirm(false);
    setIsSending(true);
    setError(null);
    try {
      await sendProposalToRecipientClient(proposalId);
      setSentDialogEmail(proposal.recipientEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the proposal.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(`${getPublicOrigin()}/private-tours/proposal/${proposal.hash}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#9a6a2f]"/>
      </div>
    );
  }

  const attachedMediaId = currentMedia?.mediaId ?? null;

  return (
    <>
      <div className="flex items-center justify-between">
        <AdminProgressLink
          href="/admin/proposals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#627176] hover:text-[#21343b]"
        >
          <ArrowLeft className="h-4 w-4"/>
          Back to Proposals
        </AdminProgressLink>

        {!isNew && proposal && (
          <div className="flex items-center gap-2">
            {proposal.publicationStatus === "published" && (
              <Button
                onClick={handleRequestSend}
                disabled={isSending || !proposal.recipientEmail}
                variant="outline"
                className="inline-flex items-center gap-2"
                title={!proposal.recipientEmail ? "Add a recipient email first" : "Send proposal link via email"}
              >
                {isSending ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Mail className="h-4 w-4"/>}
                Send to Recipient
              </Button>
            )}
            <Button
              onClick={() => void handleTogglePublish()}
              disabled={isSaving}
              variant={proposal.publicationStatus === "published" ? "outline" : "default"}
              className={
                proposal.publicationStatus === "published"
                  ? "inline-flex items-center gap-2 border-[#e8c7c1] text-[#a3483f] hover:bg-[#fbf2f0]"
                  : "inline-flex items-center gap-2 bg-[#2f6b3f] hover:bg-[#265832]"
              }
            >
              {proposal.publicationStatus === "published" ? "Unpublish" : "Publish"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[#e8c7c1] bg-[#fbf2f0] p-4 text-sm text-[#a3483f]">
          {error}
        </div>
      )}

      {/* Public Link */}
      {proposal && (() => {
        const isPublished = proposal.publicationStatus === "published";
        const fullUrl = `${getPublicOrigin()}/private-tours/proposal/${proposal.hash}`;
        const maskedUrl = `${getPublicOrigin()}/private-tours/proposal/${"*".repeat(proposal.hash.length)}`;
        return (
          <AdminSectionCard title="Public Link">
            <div className="flex items-center gap-3">
              <code className={`flex-1 truncate rounded-lg px-3 py-2 text-sm ${isPublished ? "bg-[#f6f1e7] text-[#21343b]" : "bg-[#f6f1e7] text-[#9a8d7e] select-none"}`}>
                {isPublished ? fullUrl : maskedUrl}
              </code>
              {isPublished ? (
                <>
                  <button type="button" onClick={() => void handleCopyLink()} className="rounded-lg border border-[#eadfce] p-2 text-[#627176] hover:bg-[#f9f2e7]">
                    {copiedLink ? <Check className="h-4 w-4 text-[#2f6b3f]"/> : <Copy className="h-4 w-4"/>}
                  </button>
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#eadfce] p-2 text-[#627176] hover:bg-[#f9f2e7]">
                    <ExternalLink className="h-4 w-4"/>
                  </a>
                </>
              ) : (
                <span className="text-xs text-[#9a8d7e]">Publish to reveal link</span>
              )}
            </div>
          </AdminSectionCard>
        );
      })()}

      {/* Metadata */}
      <AdminSectionCard title={isNew ? "New Proposal" : "Proposal Details"}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Proposal Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="Rome Highlights Private Tour"/>
            <p className="mt-1 text-xs text-[#9a8d7e]">General name shown as the main title of the proposal in the public page.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm">
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.name} ({l.code})</option>))}
            </select>
          </div>
          {!isNew && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#21343b]">Acceptance</label>
              <select value={acceptanceStatus} onChange={(e) => setAcceptanceStatus(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm">
                {ACCEPTANCE_STATUSES.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Recipient Name</label>
            <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="John Doe"/>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Recipient Email</label>
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="john@example.com"/>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Expires At</label>
            <input type="datetime-local" value={expiresAt} min={toLocalDatetimeString(new Date().toISOString())} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-[#21343b]">Admin Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="Internal notes..."/>
          </div>
        </div>
      </AdminSectionCard>

      {/* Image */}
      {!isNew && (
        <AdminSectionCard title="Proposal Image">
          {currentMedia ? (
            <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#f9f5ef]">
              <div className="relative aspect-video w-full bg-[#f3ede4]">
                {currentImagePreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImagePreview}
                      alt={currentMedia.media?.originalFilename ?? "Proposal image"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <LoaderCircle className="h-6 w-6 animate-spin text-[#9a8d7e]"/>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#21343b]">
                    {currentMedia.media?.originalFilename ?? "Image"}
                  </p>
                  {currentMedia.media && (
                    <p className="mt-0.5 text-xs text-[#9a8d7e]">
                      {formatFileSize(currentMedia.media.size)} &middot; {currentMedia.media.contentType}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openMediaDialog}>
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5"/>
                    Replace
                  </Button>
                  <button
                    type="button"
                    onClick={() => void handleRemoveImage()}
                    className="rounded-lg border border-[#e8c7c1] p-2 text-[#a3483f] transition-colors hover:bg-[#fbf2f0]"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openMediaDialog}
              className="group flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#d8c5a8] bg-[#fcfaf6] px-8 py-12 transition-colors hover:border-[#c4a87a] hover:bg-[#f9f2e7]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efe4d5] transition-colors group-hover:bg-[#e4d5be]">
                <ImageIcon className="h-7 w-7 text-[#9a8d7e]"/>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#21343b]">Add an image</p>
                <p className="mt-1 text-xs text-[#9a8d7e]">Select from the media library or upload a new one</p>
              </div>
            </button>
          )}
        </AdminSectionCard>
      )}

      {/* Media Picker Dialog */}
      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="border border-[#eadfce] bg-[#fffdfa] shadow-[0_30px_80px_rgba(61,45,27,0.14)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
            <DialogDescription>Search the media library or upload a new image.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleMediaSearchSubmit}>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/>
                <Input value={mediaSearchInput} onChange={(e) => setMediaSearchInput(e.target.value)} placeholder="Search by filename or path" className="h-10 pl-9"/>
              </div>
              <Button type="submit" variant="outline" disabled={isLoadingMedia || isUploadingMedia}>
                {isLoadingMedia ? <LoaderCircle className="size-4 animate-spin"/> : <Search className="size-4"/>}
                Search
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingMedia}>
                {isUploadingMedia ? <LoaderCircle className="size-4 animate-spin"/> : <Upload className="size-4"/>}
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleUploadInputChange(e); }}/>
            </form>

            {mediaDialogError && (
              <div className="rounded-[1rem] border border-[#e8c7c1] bg-[#fbf2f0] px-3 py-2 text-sm text-[#a3483f]">
                {mediaDialogError}
              </div>
            )}

            <div className="grid max-h-105 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {mediaLibraryItems.map((asset) => {
                const isAttached = asset.id === attachedMediaId;
                const isSelected = asset.id === selectedMediaId;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={isAttached}
                    onClick={() => setSelectedMediaId(isSelected ? null : asset.id)}
                    className={[
                      "overflow-hidden rounded-lg border text-left transition-colors",
                      isSelected ? "border-[#d5b588] ring-2 ring-[#ead7b8]" : "border-[#efe4d5] bg-[#fffcf7]",
                      isAttached ? "cursor-not-allowed opacity-60" : "hover:bg-[#fcf7ef]",
                    ].join(" ")}
                  >
                    <div className="relative aspect-4/3 bg-[#f3ede4]">
                      {mediaPreviewUrls[asset.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaPreviewUrls[asset.id]} alt={asset.originalFilename} className="h-full w-full object-cover"/>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="size-8 text-[#9b8a73]"/>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-2">
                        {isAttached && <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#21343b]">Current</span>}
                        {isSelected && <span className="rounded-full bg-[#9a6a2f] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">Selected</span>}
                      </div>
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-medium text-foreground">{asset.originalFilename}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(asset.size)}</span>
                        <span>{asset.contentType}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!isLoadingMedia && mediaLibraryItems.length === 0 && (
              <div className="rounded-[1.25rem] border border-dashed border-[#d8c5a8] bg-[#fcfaf6] px-6 py-10 text-center text-[#627176]">
                No images found.
              </div>
            )}

            {mediaLibraryItems.length < mediaLibraryTotal && (
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => void loadMediaPage({page: mediaLibraryPage + 1, search: appliedMediaSearch, append: true})} disabled={isLoadingMedia}>
                  {isLoadingMedia ? <LoaderCircle className="size-4 animate-spin"/> : null}
                  Load more
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void handleAttachSelectedImage()} disabled={!selectedMediaId || selectedMediaId === attachedMediaId || isLoadingMedia}>
              Use selected image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Versions */}
      <AdminSectionCard title="Proposals">
        <div className="space-y-3">
          {localVersions.map((version, vIndex) => {
            const isOpen = editingLocalId === version.localId;
            return (
              <div key={version.localId} className="rounded-xl border border-[#eadfce] bg-white overflow-hidden">
                {/* Collapsed header */}
                <div className="flex items-center justify-between p-4 bg-[#fbf7f0]">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-[#21343b]">{version.title || `Proposal ${vIndex + 1}`}</p>
                      {isVersionDirty(version) ? (
                        <span className="inline-flex rounded-full border border-[#e3d5b4] bg-[#fbf7ea] px-2.5 py-0.5 text-xs font-semibold text-[#8a6029]">Unsaved</span>
                      ) : (
                        <span className="inline-flex rounded-full border border-[#cfe4d3] bg-[#f3fbf4] px-2.5 py-0.5 text-xs font-semibold text-[#2f6b3f]">Saved</span>
                      )}
                    </div>
                    {!isOpen && (
                      <p className="mt-1 text-sm text-[#627176]">
                        {version.priceAmount} {version.priceCurrency}
                        {version.tourDate && ` \u00b7 ${version.tourDate.replace("T", " ").slice(0, 16)}`}
                        {version.durationMinutes && ` \u00b7 ${version.durationMinutes} min`}
                        {version.stripePaymentLink && " \u00b7 Payment link set"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isOpen) {
                          // Close: apply current form to local version
                          if (editingLocalId) {
                            setLocalVersions((prev) => prev.map((v) => v.localId === editingLocalId ? {...v, ...versionForm} : v));
                          }
                          setEditingLocalId(null);
                          setVersionForm(emptyVersionForm());
                          setVersionFormErrors([]);
                        } else {
                          // Open: if another is open, apply its form first
                          if (editingLocalId) {
                            setLocalVersions((prev) => prev.map((v) => v.localId === editingLocalId ? {...v, ...versionForm} : v));
                          }
                          startEditLocalVersion(version);
                          setVersionFormErrors([]);
                        }
                      }}
                    >
                      {isOpen ? <><ChevronUp className="mr-1 h-3 w-3"/>Close</> : <><Pencil className="mr-1 h-3 w-3"/>Edit</>}
                    </Button>
                    <button type="button" onClick={() => setDeleteVersionTarget(version)} className="rounded-lg border border-[#e8c7c1] p-1.5 text-[#a3483f] hover:bg-[#fbf2f0]">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                </div>

                {/* Expanded form */}
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{gridTemplateRows: isOpen ? "1fr" : "0fr"}}
                >
                  <div className="overflow-hidden">
                  <div className={`border-t border-[#eadfce] p-5 space-y-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Title</label>
                        <input type="text" value={versionForm.title} onChange={(e) => setVersionForm({...versionForm, title: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="Classic Walking Tour"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Tour Date &amp; Time</label>
                        <input type="datetime-local" value={versionForm.tourDate} min={toLocalDatetimeString(new Date().toISOString())} onChange={(e) => setVersionForm({...versionForm, tourDate: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Duration (minutes)</label>
                        <input type="number" min="0" value={versionForm.durationMinutes} onChange={(e) => setVersionForm({...versionForm, durationMinutes: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="180"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Price Amount</label>
                        <input type="number" step="0.01" min="0" value={versionForm.priceAmount} onChange={(e) => setVersionForm({...versionForm, priceAmount: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Currency</label>
                        <select value={versionForm.priceCurrency} onChange={(e) => setVersionForm({...versionForm, priceCurrency: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm">
                          <option value="EUR">EUR</option>
                          <option value="DKK">DKK</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Description</label>
                        <textarea value={versionForm.description} onChange={(e) => setVersionForm({...versionForm, description: e.target.value})} rows={3} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Itinerary Description</label>
                        <textarea value={versionForm.itineraryDescription} onChange={(e) => setVersionForm({...versionForm, itineraryDescription: e.target.value})} rows={3} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Included (one per line)</label>
                        <textarea value={versionForm.included} onChange={(e) => setVersionForm({...versionForm, included: e.target.value})} rows={3} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder={"Professional guide\nMuseum tickets\nSnacks"}/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Not Included (one per line)</label>
                        <textarea value={versionForm.notIncluded} onChange={(e) => setVersionForm({...versionForm, notIncluded: e.target.value})} rows={3} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder={"Transport\nLunch"}/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Cancellation Policy</label>
                        <textarea value={versionForm.cancellationPolicy} onChange={(e) => setVersionForm({...versionForm, cancellationPolicy: e.target.value})} rows={2} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Start Point Label</label>
                        <input type="text" value={versionForm.startPointLabel} onChange={(e) => setVersionForm({...versionForm, startPointLabel: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="Placa Catalunya"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">End Point Label</label>
                        <input type="text" value={versionForm.endPointLabel} onChange={(e) => setVersionForm({...versionForm, endPointLabel: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="La Sagrada Familia"/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-[#21343b]">Stripe Payment Link</label>
                        <input type="url" value={versionForm.stripePaymentLink} onChange={(e) => setVersionForm({...versionForm, stripePaymentLink: e.target.value})} className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2.5 text-sm" placeholder="https://buy.stripe.com/..."/>
                      </div>
                    </div>
                    {versionFormErrors.length > 0 && (
                      <div className="rounded-xl border border-[#e8c7c1] bg-[#fbf2f0] p-3">
                        <ul className="list-disc pl-4 text-sm text-[#a3483f] space-y-1">
                          {versionFormErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new version button */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              // Apply current form if editing
              if (editingLocalId) {
                setLocalVersions((prev) => prev.map((v) => v.localId === editingLocalId ? {...v, ...versionForm} : v));
              }
              setVersionFormErrors([]);
              const newLocalId = generateLocalId();
              const newForm = emptyVersionForm();
              setLocalVersions((prev) => [...prev, {...newForm, localId: newLocalId, serverId: null, savedSnapshot: null}]);
              setEditingLocalId(newLocalId);
              setVersionForm(newForm);
            }}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4"/>Add Proposal
          </Button>
        </div>
      </AdminSectionCard>

      {/* Save All */}
      <div className="flex justify-end">
        <Button onClick={() => void handleSaveAll()} disabled={isSaving} className="inline-flex items-center gap-2">
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
          {isNew ? "Create Proposal" : "Save All Changes"}
        </Button>
      </div>

      <Dialog open={sentDialogEmail !== null} onOpenChange={(open) => { if (!open) setSentDialogEmail(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposal sent</DialogTitle>
            <DialogDescription>
              The proposal link has been sent to <strong>{sentDialogEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSentDialogEmail(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteVersionTarget !== null} onOpenChange={(open) => { if (!open) setDeleteVersionTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete proposal version</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteVersionTarget?.title || "this version"}</strong>?{" "}
              {deleteVersionTarget?.serverId ? "This will be deleted from the server immediately and cannot be undone." : "This version has not been saved yet."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVersionTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void handleConfirmDeleteVersion()}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send proposal to recipient</DialogTitle>
            <DialogDescription>
              This will send an email with the proposal link to <strong>{proposal?.recipientEmail}</strong>.
              {localVersions.some((v) => isVersionDirty(v)) && (
                <span className="mt-2 block text-[#8a6029]">
                  Some versions have unsaved changes. The recipient will see the last saved version.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
            <Button onClick={() => void handleConfirmSend()}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
