export type ApiTeamMemberMedia = {
  id: string;
  mediaType: "image" | "video";
  storagePath: string;
  contentUrl: string;
  contentType: string;
  size: number;
  originalFilename: string;
};

export type ApiTeamMember = {
  id: string;
  name: string;
  orderIndex: number;
  photoMediaId: string;
  photoMedia: ApiTeamMemberMedia;
  imageAlt: string | null;
  linkedinUrl: string | null;
  isPublished: boolean;
  translations: Record<string, { role: string }>;
  translationAvailability: Array<{ languageCode: string }>;
  audit: {
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type PublicTeamMember = {
  id: string;
  name: string;
  orderIndex: number;
  linkedinUrl: string | null;
  role: string | null;
  imageAlt: string | null;
  photoMedia: {
    id: string;
    contentUrl: string;
    contentType: string;
    originalFilename: string;
  } | null;
};

export type CreateTeamMemberBody = {
  name: string;
  mediaId: string;
  imageAlt?: string;
  orderIndex?: number;
  linkedinUrl?: string;
  isPublished?: boolean;
};

export type UpdateTeamMemberBody = {
  name?: string;
  imageAlt?: string | null;
  orderIndex?: number;
  linkedinUrl?: string | null;
  isPublished?: boolean;
};

export type CreateTeamMemberTranslationBody = {
  languageCode: string;
  role: string;
};

export type UpdateTeamMemberTranslationBody = {
  role?: string;
};

export type TeamMemberTranslationFormState = {
  languageCode: string;
  role: string;
  existsOnServer: boolean;
};

export type TeamMemberFormState = {
  name: string;
  imageAlt: string;
  orderIndex: number;
  linkedinUrl: string;
  isPublished: boolean;
  translations: TeamMemberTranslationFormState[];
};

export const createEmptyFormState = (): TeamMemberFormState => ({
  name: "",
  imageAlt: "",
  orderIndex: 0,
  linkedinUrl: "",
  isPublished: false,
  translations: [],
});

export const createFormStateFromApi = (member: ApiTeamMember): TeamMemberFormState => ({
  name: member.name,
  imageAlt: member.imageAlt ?? "",
  orderIndex: member.orderIndex,
  linkedinUrl: member.linkedinUrl ?? "",
  isPublished: member.isPublished,
  translations: Object.entries(member.translations).map(([languageCode, t]) => ({
    languageCode,
    role: t.role,
    existsOnServer: true,
  })),
});

export const createEmptyTranslationFormState = (languageCode: string): TeamMemberTranslationFormState => ({
  languageCode,
  role: "",
  existsOnServer: false,
});

export const toCreateBody = (state: TeamMemberFormState, mediaId: string): CreateTeamMemberBody => ({
  name: state.name.trim(),
  mediaId,
  imageAlt: state.imageAlt.trim() || undefined,
  linkedinUrl: state.linkedinUrl.trim() || undefined,
  isPublished: state.isPublished,
});

export const toUpdateBody = (state: TeamMemberFormState): UpdateTeamMemberBody => ({
  name: state.name.trim(),
  imageAlt: state.imageAlt.trim() || null,
  orderIndex: state.orderIndex,
  linkedinUrl: state.linkedinUrl.trim() || null,
  isPublished: state.isPublished,
});

export const toCreateTranslationBody = (t: TeamMemberTranslationFormState): CreateTeamMemberTranslationBody => ({
  languageCode: t.languageCode,
  role: t.role.trim(),
});

export const toUpdateTranslationBody = (t: TeamMemberTranslationFormState): UpdateTeamMemberTranslationBody => ({
  role: t.role.trim(),
});

export const mergeFormStateWithApi = (
  current: TeamMemberFormState,
  member: ApiTeamMember,
): TeamMemberFormState => ({
  name: member.name,
  imageAlt: member.imageAlt ?? "",
  orderIndex: member.orderIndex,
  linkedinUrl: member.linkedinUrl ?? "",
  isPublished: member.isPublished,
  translations: Object.entries(member.translations).map(([languageCode, t]) => {
    const existing = current.translations.find((tr) => tr.languageCode === languageCode);
    return existing
      ? { ...existing, existsOnServer: true }
      : {
          languageCode,
          role: t.role,
          existsOnServer: true,
        };
  }),
});
