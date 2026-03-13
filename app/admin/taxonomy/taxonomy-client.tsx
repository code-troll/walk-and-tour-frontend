"use client";

import {useState} from "react";
import type {components} from "@/lib/api/generated/backend-types";
import {
  createLanguageAction,
  createTagAction,
  deleteTagAction,
  fetchTaxonomyAction,
  updateLanguageAction,
  updateTagAction,
} from "@/app/admin/taxonomy/actions";
import {Plus, Pencil, Trash2, X, Check, Globe, Tag} from "lucide-react";
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
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Switch} from "@/components/ui/switch";

type ApiTag = components["schemas"]["Tag"];
type ApiLanguage = components["schemas"]["Language"];

const TAG_KEY_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
const LANGUAGE_CODE_PATTERN = "^[a-z]{2}(?:-[A-Z]{2})?$";
const TAG_KEY_MAX_LENGTH = 100;
const TAG_LABEL_MAX_LENGTH = 100;
const LANGUAGE_NAME_MAX_LENGTH = 100;

type TaxonomyClientProps = {
  initialTags: ApiTag[];
  initialLanguages: ApiLanguage[];
  canManageLanguages: boolean;
};

type TagFormState = {
  key: string;
  labels: Record<string, string>;
};

type LanguageFormState = {
  code: string;
  name: string;
  isEnabled: boolean;
  sortOrder: string;
};

type DeleteConfirmState =
  | {
      type: "tag" | "language";
      id: string;
    }
  | null;

type TagFormErrors = {
  key?: string;
  labels?: string;
};

type LanguageFormErrors = {
  code?: string;
  name?: string;
  sortOrder?: string;
};

const sortLanguages = (languages: ApiLanguage[]) =>
  [...languages].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );

const getFallbackLocaleCodes = (tags: ApiTag[]) =>
  [...new Set(tags.flatMap((tag) => Object.keys(tag.labels)))].sort((left, right) =>
    left.localeCompare(right),
  );

const sanitizeLabels = (labels: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(labels)
      .map(([locale, label]) => [locale, label.trim()])
      .filter((entry): entry is [string, string] => entry[1].length > 0),
  );

const getErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage;

const getLanguageFormState = (language?: ApiLanguage): LanguageFormState => ({
  code: language?.code ?? "",
  name: language?.name ?? "",
  isEnabled: language?.isEnabled ?? true,
  sortOrder: String(language?.sortOrder ?? 0),
});

const getDefaultTagLabels = ({
  languages,
  tags,
}: {
  languages: ApiLanguage[];
  tags: ApiTag[];
}) => {
  const defaultLocaleCodes =
    languages.filter((language) => language.isEnabled).map((language) => language.code) ??
    getFallbackLocaleCodes(tags);

  return Object.fromEntries(defaultLocaleCodes.map((code) => [code, ""]));
};

export function TaxonomyClient({
  initialTags,
  initialLanguages,
  canManageLanguages,
}: TaxonomyClientProps) {
  const [tags, setTags] = useState<ApiTag[]>(initialTags);
  const [languages, setLanguages] = useState<ApiLanguage[]>(sortLanguages(initialLanguages));
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ApiTag | null>(null);
  const [tagForm, setTagForm] = useState<TagFormState>({
    key: "",
    labels: {},
  });
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<ApiLanguage | null>(null);
  const [languageForm, setLanguageForm] = useState<LanguageFormState>(getLanguageFormState());
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [tagDialogError, setTagDialogError] = useState<string | null>(null);
  const [languageDialogError, setLanguageDialogError] = useState<string | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null);
  const [tagFormErrors, setTagFormErrors] = useState<TagFormErrors>({});
  const [languageFormErrors, setLanguageFormErrors] = useState<LanguageFormErrors>({});

  const enabledLanguages = languages.filter((language) => language.isEnabled);
  const languageNameByCode = Object.fromEntries(
    languages.map((language) => [language.code, language.name]),
  );
  const fallbackLocaleCodes = getFallbackLocaleCodes(tags);
  const createTagLocaleCodes =
    enabledLanguages.length > 0
      ? enabledLanguages.map((language) => language.code)
      : fallbackLocaleCodes;
  const createTagLocales = createTagLocaleCodes.map((code) => ({
    code,
    name: languageNameByCode[code] ?? code,
  }));
  const editTagLocaleCodes = editingTag
    ? [
        ...new Set([
          ...enabledLanguages.map((language) => language.code),
          ...Object.keys(editingTag.labels),
        ]),
      ].sort((left, right) => {
        const leftIndex = languages.findIndex((language) => language.code === left);
        const rightIndex = languages.findIndex((language) => language.code === right);

        if (leftIndex !== -1 && rightIndex !== -1) {
          return leftIndex - rightIndex;
        }

        if (leftIndex !== -1) {
          return -1;
        }

        if (rightIndex !== -1) {
          return 1;
        }

        return left.localeCompare(right);
      })
    : createTagLocaleCodes;
  const visibleTagLocales = editTagLocaleCodes.map((code) => ({
    code,
    name: languageNameByCode[code] ?? code,
  }));

  const refreshTaxonomy = async () => {
    const {languages: nextLanguages, tags: nextTags} = await fetchTaxonomyAction();

    setTags(nextTags);
    if (canManageLanguages) {
      setLanguages(sortLanguages(nextLanguages));
    }
  };

  const openTagDialog = (tag?: ApiTag) => {
    setTagDialogError(null);
    setTagFormErrors({});

    if (tag) {
      setEditingTag(tag);
      setTagForm({
        key: tag.key,
        labels: {...tag.labels},
      });
    } else {
      setEditingTag(null);
      setTagForm({
        key: "",
        labels: getDefaultTagLabels({
          languages,
          tags,
        }),
      });
    }

    setIsTagDialogOpen(true);
  };

  const closeTagDialog = () => {
    setIsTagDialogOpen(false);
    setEditingTag(null);
    setTagDialogError(null);
    setTagFormErrors({});
  };

  const openLanguageDialog = (language?: ApiLanguage) => {
    setLanguageDialogError(null);
    setLanguageFormErrors({});
    setEditingLanguage(language ?? null);
    setLanguageForm(getLanguageFormState(language));
    setIsLanguageDialogOpen(true);
  };

  const closeLanguageDialog = () => {
    setIsLanguageDialogOpen(false);
    setEditingLanguage(null);
    setLanguageDialogError(null);
    setLanguageFormErrors({});
  };

  const validateTagForm = (formState: TagFormState): TagFormErrors => {
    const normalizedKey = formState.key.trim();
    const labels = sanitizeLabels(formState.labels);
    const nextErrors: TagFormErrors = {};

    if (!normalizedKey) {
      nextErrors.key = "Tag key is required.";
    } else if (normalizedKey.length > TAG_KEY_MAX_LENGTH) {
      nextErrors.key = `Tag key must be ${ TAG_KEY_MAX_LENGTH } characters or less.`;
    } else if (!new RegExp(TAG_KEY_PATTERN).test(normalizedKey)) {
      nextErrors.key = "Use lowercase letters, numbers, and hyphens only.";
    }

    if (Object.keys(labels).length === 0) {
      nextErrors.labels = "At least one locale label is required.";
    } else {
      const invalidLabelEntry = Object.entries(labels).find(
        ([, label]) => label.length > TAG_LABEL_MAX_LENGTH,
      );

      if (invalidLabelEntry) {
        nextErrors.labels = `Label for ${ invalidLabelEntry[0] } must be ${ TAG_LABEL_MAX_LENGTH } characters or less.`;
      }
    }

    return nextErrors;
  };

  const validateLanguageForm = (formState: LanguageFormState): LanguageFormErrors => {
    const code = formState.code.trim();
    const name = formState.name.trim();
    const nextErrors: LanguageFormErrors = {};

    if (!code) {
      nextErrors.code = "Locale code is required.";
    } else if (!new RegExp(LANGUAGE_CODE_PATTERN).test(code)) {
      nextErrors.code = "Use locale codes like en or en-US.";
    }

    if (!name) {
      nextErrors.name = "Locale name is required.";
    } else if (name.length > LANGUAGE_NAME_MAX_LENGTH) {
      nextErrors.name = `Locale name must be ${ LANGUAGE_NAME_MAX_LENGTH } characters or less.`;
    }

    if (!formState.sortOrder.trim()) {
      nextErrors.sortOrder = "Sort order is required.";
    } else if (!/^\d+$/.test(formState.sortOrder.trim())) {
      nextErrors.sortOrder = "Sort order must be a whole number.";
    }

    return nextErrors;
  };

  const saveTag = async () => {
    const normalizedKey = tagForm.key.trim();
    const labels = sanitizeLabels(tagForm.labels);
    const nextErrors = validateTagForm(tagForm);

    if (Object.keys(nextErrors).length > 0) {
      setTagFormErrors(nextErrors);
      setTagDialogError(null);
      return;
    }

    setIsMutating(true);
    setTagDialogError(null);
    setTagFormErrors({});

    try {
      if (editingTag) {
        await updateTagAction({
          key: editingTag.key,
          body: {labels},
        });
      } else {
        await createTagAction({
            key: normalizedKey,
            labels,
        });
      }

      await refreshTaxonomy();
      closeTagDialog();
    } catch (error) {
      setTagDialogError(getErrorMessage(error, "Unable to save the tag."));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteTag = async (key: string) => {
    setIsMutating(true);
    setDeleteDialogError(null);

    try {
      await deleteTagAction(key);
      await refreshTaxonomy();
      setDeleteConfirm(null);
    } catch (error) {
      setDeleteDialogError(getErrorMessage(error, "Unable to delete the tag."));
    } finally {
      setIsMutating(false);
    }
  };

  const saveLanguage = async () => {
    const code = languageForm.code.trim();
    const name = languageForm.name.trim();
    const nextErrors = validateLanguageForm(languageForm);

    if (Object.keys(nextErrors).length > 0) {
      setLanguageFormErrors(nextErrors);
      setLanguageDialogError(null);
      return;
    }

    setIsMutating(true);
    setLanguageDialogError(null);
    setLanguageFormErrors({});

    try {
      if (editingLanguage) {
        await updateLanguageAction({
          code: editingLanguage.code,
          body: {
            name,
            isEnabled: languageForm.isEnabled,
            sortOrder: Number.parseInt(languageForm.sortOrder, 10),
          },
        });
      } else {
        await createLanguageAction({
            code,
            name,
            isEnabled: languageForm.isEnabled,
            sortOrder: Number.parseInt(languageForm.sortOrder, 10),
        });
      }

      await refreshTaxonomy();
      closeLanguageDialog();
    } catch (error) {
      setLanguageDialogError(getErrorMessage(error, "Unable to save the locale."));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteLanguage = async (code: string) => {
    setIsMutating(true);
    setDeleteDialogError(null);

    try {
      await updateLanguageAction({
        code,
        body: {
          isEnabled: false,
        },
      });

      await refreshTaxonomy();
      setDeleteConfirm(null);
    } catch (error) {
      setDeleteDialogError(getErrorMessage(error, "Unable to disable the locale."));
      await refreshTaxonomy();
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Tag className="size-5 text-primary" />
              Tags
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage labels used by tours and blog posts across locales.
            </p>
          </div>
          <Button
            onClick={() => openTagDialog()}
            size="sm"
            disabled={createTagLocales.length === 0 || isMutating}
          >
            <Plus className="size-4" />
            Add Tag
          </Button>
        </div>
        <div className="pt-5">
          {createTagLocales.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">
              No locale inputs are available for new tags yet.
            </p>
          ) : null}

          {tags.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Tag className="mx-auto size-12 opacity-30" />
              <p className="mt-4">No tags created yet.</p>
              <Button
                onClick={() => openTagDialog()}
                variant="outline"
                className="mt-4"
                disabled={createTagLocales.length === 0 || isMutating}
              >
                <Plus className="size-4" />
                Create your first tag
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tags.map((tag) => (
                <div
                  key={tag.key}
                  className="group rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-foreground">{tag.key}</h3>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openTagDialog(tag)}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isMutating}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit tag</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setDeleteDialogError(null);
                          setDeleteConfirm({type: "tag", id: tag.key});
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isMutating}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete tag</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(tag.labels).map(([locale, label]) => (
                      <span
                        key={locale}
                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                      >
                        {locale}: {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {canManageLanguages ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Globe className="size-5 text-primary" />
                Locales
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage enabled locales for your content.
              </p>
            </div>
            <Button onClick={() => openLanguageDialog()} size="sm" disabled={isMutating}>
              <Plus className="size-4" />
              Add Locale
            </Button>
          </div>
          <div className="pt-5">
            {languages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Globe className="mx-auto size-12 opacity-30" />
                <p className="mt-4">No locales configured yet.</p>
                <Button onClick={() => openLanguageDialog()} variant="outline" className="mt-4">
                  <Plus className="size-4" />
                  Add your first locale
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-3 pr-4 font-semibold">Code</th>
                      <th className="py-3 pr-4 font-semibold">Name</th>
                      <th className="py-3 pr-4 font-semibold">Enabled</th>
                      <th className="py-3 pr-4 font-semibold">Sort Order</th>
                      <th className="py-3 pr-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((language) => (
                      <tr
                        key={language.code}
                        className="group border-b border-border/50 text-foreground"
                      >
                        <td className="py-4 pr-4 font-mono text-sm">{language.code}</td>
                        <td className="py-4 pr-4">{language.name}</td>
                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                              language.isEnabled
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {language.isEnabled ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">{language.sortOrder}</td>
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openLanguageDialog(language)}
                              className="text-muted-foreground hover:text-foreground"
                              disabled={isMutating}
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit locale</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setDeleteDialogError(null);
                                setDeleteConfirm({type: "language", id: language.code});
                              }}
                              className="text-muted-foreground hover:text-destructive"
                              disabled={isMutating}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Disable locale</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <Dialog open={isTagDialogOpen} onOpenChange={(open) => (!open ? closeTagDialog() : setIsTagDialogOpen(true))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add New Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Update the tag labels for each locale."
                : "Create a new tag with labels for the available locales."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Tag Key</FieldLabel>
              <Input
                placeholder="e.g., adventure"
                value={tagForm.key}
                pattern={TAG_KEY_PATTERN}
                maxLength={TAG_KEY_MAX_LENGTH}
                aria-invalid={Boolean(tagFormErrors.key)}
                onChange={(event) =>
                  setTagForm({
                    ...tagForm,
                    key: event.target.value,
                  })
                }
                disabled={Boolean(editingTag) || isMutating}
              />
              <FieldError>{tagFormErrors.key}</FieldError>
            </Field>
            <div className="space-y-3">
              <FieldLabel>Labels by Locale</FieldLabel>
              {visibleTagLocales.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No locale labels are available for this tag yet.
                </p>
              ) : (
                visibleTagLocales.map((locale) => (
                  <Field key={locale.code} orientation="horizontal" className="items-center">
                    <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">
                      {locale.code}
                    </span>
                    <Input
                      placeholder={`Label in ${ locale.name }`}
                      value={tagForm.labels[locale.code] ?? ""}
                      maxLength={TAG_LABEL_MAX_LENGTH}
                      aria-invalid={Boolean(tagFormErrors.labels)}
                      onChange={(event) =>
                        setTagForm({
                          ...tagForm,
                          labels: {
                            ...tagForm.labels,
                            [locale.code]: event.target.value,
                          },
                        })
                      }
                      disabled={isMutating}
                    />
                  </Field>
                ))
              )}
              <FieldError>{tagFormErrors.labels}</FieldError>
            </div>
            {tagDialogError ? (
              <p className="text-sm font-medium text-destructive">{tagDialogError}</p>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={closeTagDialog} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={saveTag} disabled={isMutating || visibleTagLocales.length === 0}>
              <Check className="size-4" />
              {editingTag ? "Save Changes" : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isLanguageDialogOpen}
        onOpenChange={(open) => (!open ? closeLanguageDialog() : setIsLanguageDialogOpen(true))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLanguage ? "Edit Locale" : "Add New Locale"}</DialogTitle>
            <DialogDescription>
              {editingLanguage
                ? "Update the locale configuration."
                : "Add a new locale to your site."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input
                placeholder="e.g., en, es, fr"
                value={languageForm.code}
                pattern={LANGUAGE_CODE_PATTERN}
                aria-invalid={Boolean(languageFormErrors.code)}
                onChange={(event) =>
                  setLanguageForm({
                    ...languageForm,
                    code: event.target.value,
                  })
                }
                disabled={Boolean(editingLanguage) || isMutating}
              />
              <FieldError>{languageFormErrors.code}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g., English, Spanish"
                value={languageForm.name}
                maxLength={LANGUAGE_NAME_MAX_LENGTH}
                aria-invalid={Boolean(languageFormErrors.name)}
                onChange={(event) =>
                  setLanguageForm({
                    ...languageForm,
                    name: event.target.value,
                  })
                }
                disabled={isMutating}
              />
              <FieldError>{languageFormErrors.name}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Sort Order</FieldLabel>
              <Input
                type="number"
                min={0}
                step={1}
                value={languageForm.sortOrder}
                aria-invalid={Boolean(languageFormErrors.sortOrder)}
                onChange={(event) =>
                  setLanguageForm({
                    ...languageForm,
                    sortOrder: event.target.value,
                  })
                }
                disabled={isMutating}
              />
              <FieldError>{languageFormErrors.sortOrder}</FieldError>
            </Field>
            <Field orientation="horizontal">
              <FieldLabel className="flex-1">Enabled</FieldLabel>
              <Switch
                checked={languageForm.isEnabled}
                onCheckedChange={(checked) =>
                  setLanguageForm({
                    ...languageForm,
                    isEnabled: checked,
                  })
                }
                disabled={isMutating}
              />
            </Field>
            {languageDialogError ? (
              <p className="text-sm font-medium text-destructive">{languageDialogError}</p>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={closeLanguageDialog} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={saveLanguage} disabled={isMutating}>
              <Check className="size-4" />
              {editingLanguage ? "Save Changes" : "Create Locale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteConfirm)}
        onOpenChange={() => {
          if (isMutating) {
            return;
          }

          setDeleteConfirm(null);
          setDeleteDialogError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.type === "language" ? "Disable Locale" : "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "tag"
                ? `Are you sure you want to delete the tag "${ deleteConfirm.id }"? This action cannot be undone.`
                : `This will disable the locale "${ deleteConfirm?.id }". Existing tag labels for that locale will be kept.`}
            </DialogDescription>
          </DialogHeader>
          {deleteDialogError ? (
            <p className="text-sm font-medium text-destructive">{deleteDialogError}</p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteDialogError(null);
              }}
              disabled={isMutating}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteConfirm) {
                  return;
                }

                if (deleteConfirm.type === "tag") {
                  void deleteTag(deleteConfirm.id);
                  return;
                }

                void deleteLanguage(deleteConfirm.id);
              }}
              disabled={isMutating}
            >
              <Trash2 className="size-4" />
              {deleteConfirm?.type === "language" ? "Disable Locale" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
