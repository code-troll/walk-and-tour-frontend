"use client";

import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState, type ComponentType} from "react";
import {useRouter} from "next/navigation";
import {ES, GB, IT} from "country-flag-icons/react/3x2";
import {
  Check,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {AdminProgressLink, useAdminRouteLoadingBoundary, useAdminRouteProgress} from "@/components/admin/AdminRouteProgress";
import {AdminBackRow, AdminHeaderMeta, AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {controlClassName} from "@/components/ui/control-class";
import {AvailabilityEditor} from "@/components/admin/team-members/AvailabilityEditor";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {
  listAdminMediaAssets,
  type ApiAdminMediaAsset,
  uploadAdminMediaAsset,
} from "@/lib/admin/media-client";
import {getAdminTeamMemberClient} from "@/lib/admin/admin-team-member-client";
import {getAdminLanguagesClient} from "@/lib/admin/admin-client";
import {
  createEmptyFormState,
  createEmptyTranslationFormState,
  createFormStateFromApi,
  mergeFormStateWithApi,
  toCreateBody,
  toCreateTranslationBody,
  toUpdateBody,
  toUpdateTranslationBody,
  type ApiTeamMember,
  type TeamMemberFormState,
} from "@/lib/team-members/admin-team-member-types";
import type {components} from "@/lib/api/generated/backend-types";
import {
  createTeamMemberAction,
  createTeamMemberTranslationAction,
  deleteTeamMemberAction,
  deleteTeamMemberTranslationAction,
  setTeamMemberPhotoAction,
  updateTeamMemberAction,
  updateTeamMemberTranslationAction,
} from "./actions";

const fieldLabelClassName = "text-sm font-medium text-foreground";
const MEDIA_LIBRARY_PAGE_SIZE = 24;

type TranslationCountryCode = "GB" | "ES" | "IT";
const flagByCountryCode: Record<TranslationCountryCode, ComponentType<{className?: string}>> = {GB, ES, IT};

const getTranslationCountryCode = (languageCode: string): TranslationCountryCode | null => {
  const normalized = languageCode.trim().toLowerCase();
  if (normalized === "en" || normalized.startsWith("en-")) return "GB";
  if (normalized === "es" || normalized.startsWith("es-")) return "ES";
  if (normalized === "it" || normalized.startsWith("it-")) return "IT";
  return null;
};

type ApiLanguage = components["schemas"]["LanguageResponseDto"];

type TeamMemberEditorClientProps = {
  accessToken: string;
  backendApiBaseUrl: string;
  memberId?: string;
  mode: "create" | "edit";
};

type FeedbackState = {message: string; tone: "error" | "success"} | null;

export function TeamMemberEditorClient({accessToken, backendApiBaseUrl, memberId, mode}: TeamMemberEditorClientProps) {
  const router = useRouter();
  const {startNavigation} = useAdminRouteProgress();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  const [savedMember, setSavedMember] = useState<ApiTeamMember | null>(null);
  const [formState, setFormState] = useState<TeamMemberFormState>(createEmptyFormState());
  const [selectedPhotoMediaId, setSelectedPhotoMediaId] = useState<string | null>(null);
  const [activeLanguageCode, setActiveLanguageCode] = useState<string | null>(null);
  const [languageToAdd, setLanguageToAdd] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaSearchInput, setMediaSearchInput] = useState("");
  const [appliedMediaSearch, setAppliedMediaSearch] = useState("");
  const [mediaLibraryItems, setMediaLibraryItems] = useState<ApiAdminMediaAsset[]>([]);
  const [mediaLibraryPage, setMediaLibraryPage] = useState(1);
  const [mediaLibraryTotal, setMediaLibraryTotal] = useState(0);
  const [dialogSelectedMediaId, setDialogSelectedMediaId] = useState<string | null>(null);
  const [mediaDialogError, setMediaDialogError] = useState<string | null>(null);
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [pendingDeleteLanguageCode, setPendingDeleteLanguageCode] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useAdminRouteLoadingBoundary(isInitialLoading);

  const enabledLanguages = useMemo(
    () => [...availableLanguages].filter((l) => l.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [availableLanguages],
  );
  const languageNameByCode = useMemo(
    () => Object.fromEntries(enabledLanguages.map((l) => [l.code, l.name])),
    [enabledLanguages],
  );
  const remainingLanguages = enabledLanguages.filter(
    (l) => !formState.translations.some((t) => t.languageCode === l.code),
  );
  const resolvedActiveLanguageCode =
    activeLanguageCode && formState.translations.some((t) => t.languageCode === activeLanguageCode)
      ? activeLanguageCode
      : formState.translations[0]?.languageCode ?? null;
  const selectedLanguageToAdd =
    languageToAdd && remainingLanguages.some((l) => l.code === languageToAdd)
      ? languageToAdd
      : remainingLanguages[0]?.code ?? "";
  const activeTranslation =
    formState.translations.find((t) => t.languageCode === resolvedActiveLanguageCode) ?? null;
  const isCreated = Boolean(savedMember?.id);

  // The effective photo media ID: either the saved one or the one selected in the form
  const effectivePhotoMediaId = selectedPhotoMediaId ?? savedMember?.photoMediaId ?? null;
  const canSave = formState.name.trim().length > 0 && effectivePhotoMediaId !== null;

  useEffect(() => {
    void (async () => {
      setIsInitialLoading(true);
      setInitialLoadError(null);
      try {
        const [languages, member] = await Promise.all([
          getAdminLanguagesClient(),
          mode === "edit" && memberId ? getAdminTeamMemberClient(memberId) : Promise.resolve(null),
        ]);
        setAvailableLanguages(languages);
        if (mode === "edit") {
          if (!member) { setInitialLoadError("The requested team member could not be found."); return; }
          setSavedMember(member);
          setFormState(createFormStateFromApi(member));
          setActiveLanguageCode(Object.keys(member.translations)[0] ?? null);
        }
      } catch (error) {
        setInitialLoadError(error instanceof Error ? error.message : "Unable to load team member data.");
      } finally { setIsInitialLoading(false); }
    })();
  }, [mode, memberId]);

  const showFeedback = useCallback((tone: "error" | "success", message: string) => {
    setFeedback({tone, message});
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const applyMemberResult = useCallback((member: ApiTeamMember) => {
    setSavedMember(member);
    setSelectedPhotoMediaId(null);
    setFormState((current) => mergeFormStateWithApi(current, member));
    setLastSaved(new Date());
  }, []);

  // ── Media dialog ─────────────────────────────────────────────────

  const loadMediaLibrary = useCallback(async (page: number, search: string) => {
    setIsLoadingMediaLibrary(true);
    setMediaDialogError(null);
    const result = await listAdminMediaAssets({accessToken, backendApiBaseUrl, limit: MEDIA_LIBRARY_PAGE_SIZE, page, search});
    if (!result.ok) { setMediaDialogError(result.message); setIsLoadingMediaLibrary(false); return; }
    setMediaLibraryItems(page === 1 ? result.response.items : [...mediaLibraryItems, ...result.response.items]);
    setMediaLibraryTotal(result.response.total);
    setMediaLibraryPage(page);
    setIsLoadingMediaLibrary(false);
  }, [accessToken, backendApiBaseUrl, mediaLibraryItems]);

  const openMediaDialog = () => {
    setIsMediaDialogOpen(true);
    setDialogSelectedMediaId(null);
    setMediaSearchInput("");
    setAppliedMediaSearch("");
    setMediaLibraryItems([]);
    setMediaDialogError(null);
    void loadMediaLibrary(1, "");
  };

  const handleMediaSearch = () => { setAppliedMediaSearch(mediaSearchInput); void loadMediaLibrary(1, mediaSearchInput); };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    const result = await uploadAdminMediaAsset({accessToken, backendApiBaseUrl, file, folder: `team-members/${savedMember?.id ?? "new"}`});
    if (result.ok) { setDialogSelectedMediaId(result.media.id); void loadMediaLibrary(1, appliedMediaSearch); }
    else { setMediaDialogError(result.message); }
    setIsUploadingMedia(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmMediaSelection = () => {
    if (!dialogSelectedMediaId) return;
    setSelectedPhotoMediaId(dialogSelectedMediaId);
    setIsMediaDialogOpen(false);
  };

  // ── Save ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!canSave) return;
    setIsMutating(true);

    try {
      if (!isCreated) {
        const result = await createTeamMemberAction(toCreateBody(formState, effectivePhotoMediaId!));
        if (!result.ok) { showFeedback("error", result.message); return; }
        applyMemberResult(result.member);
        showFeedback("success", "Team member created.");
        startNavigation();
        router.replace(`/team-members/${result.member.id}`);
      } else {
        // If photo changed, update it first
        if (selectedPhotoMediaId && selectedPhotoMediaId !== savedMember!.photoMediaId) {
          const photoResult = await setTeamMemberPhotoAction({id: savedMember!.id, mediaId: selectedPhotoMediaId});
          if (!photoResult.ok) { showFeedback("error", photoResult.message); return; }
        }
        const result = await updateTeamMemberAction({id: savedMember!.id, body: toUpdateBody(formState)});
        if (!result.ok) { showFeedback("error", result.message); return; }
        applyMemberResult(result.member);
        showFeedback("success", "Team member updated.");
      }
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "Unable to save.");
    } finally { setIsMutating(false); }
  };

  // ── Translations ─────────────────────────────────────────────────

  const handleAddTranslation = () => {
    if (!selectedLanguageToAdd) return;
    setFormState((prev) => ({...prev, translations: [...prev.translations, createEmptyTranslationFormState(selectedLanguageToAdd)]}));
    setActiveLanguageCode(selectedLanguageToAdd);
    setLanguageToAdd("");
  };

  const handleSaveTranslation = async () => {
    if (!activeTranslation || !savedMember) return;
    setIsMutating(true);
    try {
      if (!activeTranslation.existsOnServer) {
        const result = await createTeamMemberTranslationAction({id: savedMember.id, body: toCreateTranslationBody(activeTranslation)});
        if (!result.ok) { showFeedback("error", result.message); return; }
        applyMemberResult(result.member);
        showFeedback("success", `Translation "${activeTranslation.languageCode}" created.`);
      } else {
        const result = await updateTeamMemberTranslationAction({id: savedMember.id, languageCode: activeTranslation.languageCode, body: toUpdateTranslationBody(activeTranslation)});
        if (!result.ok) { showFeedback("error", result.message); return; }
        applyMemberResult(result.member);
        showFeedback("success", `Translation "${activeTranslation.languageCode}" updated.`);
      }
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "Unable to save translation.");
    } finally { setIsMutating(false); }
  };

  const handleDeleteTranslation = async (languageCode: string) => {
    if (!savedMember) return;
    const translation = formState.translations.find((t) => t.languageCode === languageCode);
    if (!translation?.existsOnServer) {
      setFormState((prev) => ({...prev, translations: prev.translations.filter((t) => t.languageCode !== languageCode)}));
      setPendingDeleteLanguageCode(null);
      return;
    }
    setIsMutating(true);
    const result = await deleteTeamMemberTranslationAction({id: savedMember.id, languageCode});
    if (result.ok) {
      setFormState((prev) => ({...prev, translations: prev.translations.filter((t) => t.languageCode !== languageCode)}));
      showFeedback("success", `Translation "${languageCode}" deleted.`);
    } else { showFeedback("error", result.message); }
    setPendingDeleteLanguageCode(null);
    setIsMutating(false);
  };

  const handleDeleteMember = async () => {
    if (!savedMember) return;
    setIsMutating(true);
    const result = await deleteTeamMemberAction(savedMember.id);
    if (result.ok) { startNavigation(); router.replace("/team-members"); }
    else { showFeedback("error", result.message); setIsConfirmingDelete(false); }
    setIsMutating(false);
  };

  // ── Render ───────────────────────────────────────────────────────

  if (isInitialLoading) {
    return <AdminNoticeCard eyebrow="Admin API" title="Loading the team member editor." description="Resolving team member data and available languages." />;
  }

  if (initialLoadError) {
    return (
      <AdminNoticeCard eyebrow="Admin API" title="The team member editor could not be loaded." description={initialLoadError}
        actions={<Button asChild variant="outline" className="h-10"><AdminProgressLink href="/team-members">Back to list</AdminProgressLink></Button>}
      />
    );
  }

  // Resolve the photo preview src: use proxy URL for both selected and saved photos
  const photoPreviewSrc = effectivePhotoMediaId
    ? `/api/internal/admin/media/${effectivePhotoMediaId}/content`
    : null;

  return (
    <div className="space-y-6">
      <AdminBackRow href="/team-members" label="Team">
        {lastSaved ? (
          <AdminHeaderMeta>Last saved {lastSaved.toLocaleTimeString()}</AdminHeaderMeta>
        ) : null}
      </AdminBackRow>

      {feedback && (
        <div className={`rounded-[var(--wt-radius-sm)] border px-4 py-3 text-sm ${feedback.tone === "error" ? "border-[var(--wt-danger)] bg-[var(--wt-surface)] text-[var(--wt-danger)]" : "border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]"}`}>
          {feedback.message}
        </div>
      )}

      {/* Details — name, photo, imageAlt, linkedinUrl, orderIndex all in one card */}
      <AdminSectionCard
        title={mode === "create" ? "New Team Member" : "Team Member Details"}
        description="Name and photo are required."
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch checked={formState.isPublished} onCheckedChange={(checked) => setFormState((prev) => ({...prev, isPublished: checked}))} disabled={isMutating} />
            <label className={fieldLabelClassName}>{formState.isPublished ? "Published" : "Draft"}</label>
          </div>

          <div>
            <label className={fieldLabelClassName}>Name *</label>
            <Input value={formState.name} onChange={(e) => setFormState((prev) => ({...prev, name: e.target.value}))} placeholder="Team member name" className="h-10 mt-1.5" disabled={isMutating} />
          </div>

          {/* Photo picker inline */}
          <div>
            <label className={fieldLabelClassName}>Photo *</label>
            <div className="mt-1.5 flex items-start gap-4">
              {photoPreviewSrc ? (
                <Image src={photoPreviewSrc} alt="" width={96} height={96} unoptimized className="size-24 rounded-[var(--wt-radius-sm)] object-cover ring-1 ring-[var(--wt-rule-strong)]" />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-[var(--wt-radius-sm)] bg-[var(--wt-surface-sunk)] text-xs text-muted-foreground ring-1 ring-[var(--wt-rule-strong)]">
                  No photo
                </div>
              )}
              <Button variant="outline" type="button" className="h-10" onClick={openMediaDialog} disabled={isMutating}>
                <Search className="size-4" /> {effectivePhotoMediaId ? "Change Photo" : "Select Photo"}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className={fieldLabelClassName}>Image Alt Text</label>
              <Input value={formState.imageAlt} onChange={(e) => setFormState((prev) => ({...prev, imageAlt: e.target.value}))} placeholder="Photo of..." className="h-10 mt-1.5" disabled={isMutating} />
            </div>
            <div>
              <label className={fieldLabelClassName}>LinkedIn URL</label>
              <Input type="url" placeholder="https://linkedin.com/in/..." value={formState.linkedinUrl} onChange={(e) => setFormState((prev) => ({...prev, linkedinUrl: e.target.value}))} className="h-10 mt-1.5" disabled={isMutating} />
            </div>
          </div>

          {isCreated && (
            <div>
              <label className={fieldLabelClassName}>Display Order</label>
              <Input type="number" min={0} value={formState.orderIndex} onChange={(e) => setFormState((prev) => ({...prev, orderIndex: parseInt(e.target.value, 10) || 0}))} className="h-10 mt-1.5" disabled={isMutating} />
            </div>
          )}

          <div className="flex justify-end">
            <Button className="h-10" onClick={() => void handleSave()} disabled={isMutating || !canSave}>
              {isMutating ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isCreated ? "Save Changes" : "Create Team Member"}
            </Button>
          </div>
        </div>
      </AdminSectionCard>

      {/* Role Translations */}
      {isCreated && (
        <AdminSectionCard title="Role Translations" description="Manage the localized role / title for each language.">
          <div className="space-y-5">
            {formState.translations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formState.translations.map((t) => {
                  const countryCode = getTranslationCountryCode(t.languageCode);
                  const FlagIcon = countryCode ? flagByCountryCode[countryCode] : null;
                  const isActive = t.languageCode === resolvedActiveLanguageCode;
                  return (
                    <button key={t.languageCode} type="button" onClick={() => setActiveLanguageCode(t.languageCode)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? "border-[var(--wt-ink)] bg-[var(--wt-ink)] text-white" : "border-[var(--wt-rule-strong)] bg-white text-foreground hover:border-[var(--wt-rule-strong)]"}`}>
                      {FlagIcon && <FlagIcon className="h-3 w-4" />}
                      {languageNameByCode[t.languageCode] ?? t.languageCode}
                      {t.existsOnServer && <Check className="size-3 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            )}

            {remainingLanguages.length > 0 && (
              <div className="flex items-center gap-2">
                <select value={selectedLanguageToAdd} onChange={(e) => setLanguageToAdd(e.target.value)} className={controlClassName}>
                  {remainingLanguages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <Button variant="outline" className="h-10" onClick={handleAddTranslation}><Plus className="size-4" /> Add</Button>
              </div>
            )}

            {activeTranslation && (
              <div className="space-y-4 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] p-5">
                <div>
                  <label className={fieldLabelClassName}>Role / Title</label>
                  <Input
                    className="h-10"
                    value={activeTranslation.role}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormState((prev) => ({...prev, translations: prev.translations.map((t) => t.languageCode === resolvedActiveLanguageCode ? {...t, role: value} : t)}));
                    }}
                    placeholder="Founder & Director"
                    disabled={isMutating}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPendingDeleteLanguageCode(activeTranslation.languageCode)} disabled={isMutating} className="text-[var(--wt-danger)]">
                    <Trash2 className="size-4" /> Delete Translation
                  </Button>
                  <Button className="h-10" onClick={() => void handleSaveTranslation()} disabled={isMutating}>
                    {isMutating ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {activeTranslation.existsOnServer ? "Save Translation" : "Create Translation"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AdminSectionCard>
      )}

      {/* Availability */}
      {isCreated && savedMember && (
        <AdminSectionCard
          title="Availability"
          description="Block dates and recurring weekly times when this member cannot guide."
        >
          <AvailabilityEditor memberId={savedMember.id} />
        </AdminSectionCard>
      )}

      {/* Delete member */}
      {isCreated && (
        <div className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--wt-danger)]">Danger Zone</h3>
          <p className="mt-1 text-sm text-[var(--wt-danger)]/70">Permanently delete this team member and all its translations.</p>
          <Button variant="outline" size="sm" className="mt-3 border-[var(--wt-danger)] text-[var(--wt-danger)] hover:bg-[var(--wt-surface-sunk)]" onClick={() => setIsConfirmingDelete(true)} disabled={isMutating}>
            <Trash2 className="size-4" /> Delete Team Member
          </Button>
        </div>
      )}

      {/* Media Dialog */}
      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Photo</DialogTitle>
            <DialogDescription>Choose an image from the media library or upload a new one.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input className="h-10" placeholder="Search media..." value={mediaSearchInput} onChange={(e) => setMediaSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleMediaSearch()} />
            <Button variant="outline" className="h-10" onClick={handleMediaSearch}><Search className="size-4" /></Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleMediaUpload(e)} />
            <Button variant="outline" className="h-10" onClick={() => fileInputRef.current?.click()} disabled={isUploadingMedia}>
              {isUploadingMedia ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
            </Button>
          </div>
          {mediaDialogError && <div className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-danger)]">{mediaDialogError}</div>}
          <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto">
            {mediaLibraryItems.map((asset) => (
              <button key={asset.id} type="button" onClick={() => setDialogSelectedMediaId(asset.id)}
                className={`relative overflow-hidden rounded-[var(--wt-radius-sm)] border-2 transition ${dialogSelectedMediaId === asset.id ? "border-[var(--wt-ink)] ring-2 ring-[var(--wt-ink)]/30" : "border-transparent hover:border-[var(--wt-rule-strong)]"}`}>
                <Image src={`${backendApiBaseUrl}/api/admin/media/${asset.id}/content`} alt={asset.originalFilename} width={160} height={120} unoptimized className="h-24 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {dialogSelectedMediaId === asset.id && <div className="absolute inset-0 flex items-center justify-center bg-[var(--wt-ink)]/40"><Check className="size-6 text-white" /></div>}
              </button>
            ))}
          </div>
          {isLoadingMediaLibrary && <div className="flex justify-center py-4"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></div>}
          {!isLoadingMediaLibrary && mediaLibraryItems.length < mediaLibraryTotal && (
            <button type="button" onClick={() => void loadMediaLibrary(mediaLibraryPage + 1, appliedMediaSearch)} className="w-full rounded-[var(--wt-radius-sm)] border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-[var(--wt-rule-strong)]">Load more</button>
          )}
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setIsMediaDialogOpen(false)}>Cancel</Button>
            <Button className="h-10" onClick={handleConfirmMediaSelection} disabled={!dialogSelectedMediaId}>
              <Check className="size-4" /> Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Translation Confirm */}
      <Dialog open={Boolean(pendingDeleteLanguageCode)} onOpenChange={() => setPendingDeleteLanguageCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Translation</DialogTitle>
            <DialogDescription>Are you sure you want to delete the &quot;{pendingDeleteLanguageCode}&quot; translation? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setPendingDeleteLanguageCode(null)}>Cancel</Button>
            <Button className="h-10 bg-[var(--wt-danger)] text-white transition hover:opacity-90" onClick={() => pendingDeleteLanguageCode && void handleDeleteTranslation(pendingDeleteLanguageCode)} disabled={isMutating}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirm */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>Are you sure you want to permanently delete this team member and all its translations? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setIsConfirmingDelete(false)}>Cancel</Button>
            <Button className="h-10 bg-[var(--wt-danger)] text-white transition hover:opacity-90" onClick={() => void handleDeleteMember()} disabled={isMutating}>
              {isMutating ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
