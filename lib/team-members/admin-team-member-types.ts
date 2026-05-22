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
  orderIndex: number;
  photoMediaId: string | null;
  photoMedia: ApiTeamMemberMedia | null;
  linkedinUrl: string | null;
  isPublished: boolean;
  translations: Record<string, { name: string; role: string; imageAlt: string | null }>;
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
  orderIndex: number;
  linkedinUrl: string | null;
  name: string;
  role: string;
  imageAlt: string | null;
  photoMedia: {
    id: string;
    contentUrl: string;
    contentType: string;
    originalFilename: string;
  } | null;
};

export type CreateTeamMemberBody = {
  orderIndex?: number;
  linkedinUrl?: string;
  isPublished?: boolean;
};

export type UpdateTeamMemberBody = {
  orderIndex?: number;
  linkedinUrl?: string | null;
  isPublished?: boolean;
};

export type CreateTeamMemberTranslationBody = {
  languageCode: string;
  name: string;
  role: string;
  imageAlt?: string;
};

export type UpdateTeamMemberTranslationBody = {
  name?: string;
  role?: string;
  imageAlt?: string | null;
};

export type TeamMemberTranslationFormState = {
  languageCode: string;
  name: string;
  role: string;
  imageAlt: string;
  existsOnServer: boolean;
};

export type TeamMemberFormState = {
  orderIndex: number;
  linkedinUrl: string;
  isPublished: boolean;
  translations: TeamMemberTranslationFormState[];
};

export const createEmptyFormState = (): TeamMemberFormState => ({
  orderIndex: 0,
  linkedinUrl: "",
  isPublished: false,
  translations: [],
});

export const createFormStateFromApi = (member: ApiTeamMember): TeamMemberFormState => ({
  orderIndex: member.orderIndex,
  linkedinUrl: member.linkedinUrl ?? "",
  isPublished: member.isPublished,
  translations: Object.entries(member.translations).map(([languageCode, t]) => ({
    languageCode,
    name: t.name,
    role: t.role,
    imageAlt: t.imageAlt ?? "",
    existsOnServer: true,
  })),
});

export const createEmptyTranslationFormState = (languageCode: string): TeamMemberTranslationFormState => ({
  languageCode,
  name: "",
  role: "",
  imageAlt: "",
  existsOnServer: false,
});

export const toCreateBody = (state: TeamMemberFormState): CreateTeamMemberBody => ({
  linkedinUrl: state.linkedinUrl.trim() || undefined,
  isPublished: state.isPublished,
});

export const toUpdateBody = (state: TeamMemberFormState): UpdateTeamMemberBody => ({
  orderIndex: state.orderIndex,
  linkedinUrl: state.linkedinUrl.trim() || null,
  isPublished: state.isPublished,
});

export const toCreateTranslationBody = (t: TeamMemberTranslationFormState): CreateTeamMemberTranslationBody => ({
  languageCode: t.languageCode,
  name: t.name.trim(),
  role: t.role.trim(),
  imageAlt: t.imageAlt.trim() || undefined,
});

export const toUpdateTranslationBody = (t: TeamMemberTranslationFormState): UpdateTeamMemberTranslationBody => ({
  name: t.name.trim(),
  role: t.role.trim(),
  imageAlt: t.imageAlt.trim() || null,
});

export const mergeFormStateWithApi = (
  current: TeamMemberFormState,
  member: ApiTeamMember,
): TeamMemberFormState => ({
  orderIndex: member.orderIndex,
  linkedinUrl: member.linkedinUrl ?? "",
  isPublished: member.isPublished,
  translations: Object.entries(member.translations).map(([languageCode, t]) => {
    const existing = current.translations.find((tr) => tr.languageCode === languageCode);
    return existing
      ? { ...existing, existsOnServer: true }
      : {
          languageCode,
          name: t.name,
          role: t.role,
          imageAlt: t.imageAlt ?? "",
          existsOnServer: true,
        };
  }),
});
