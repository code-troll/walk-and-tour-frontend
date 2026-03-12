"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Globe, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

// Types
type TagItem = {
  key: string;
  labels: Record<string, string>;
};

type Language = {
  code: string;
  name: string;
  isEnabled: boolean;
  sortOrder: number;
};

// Mock data - replace with API calls
const initialTags: TagItem[] = [
  {key: "adventure", labels: {en: "Adventure", es: "Aventura", fr: "Aventure"}},
  {key: "culture", labels: {en: "Culture", es: "Cultura", fr: "Culture"}},
  {key: "nature", labels: {en: "Nature", es: "Naturaleza", fr: "Nature"}},
  {key: "gastronomy", labels: {en: "Gastronomy", es: "Gastronomía", fr: "Gastronomie"}},
];

const initialLanguages: Language[] = [
  {code: "en", name: "English", isEnabled: true, sortOrder: 1},
  {code: "es", name: "Spanish", isEnabled: true, sortOrder: 2},
  {code: "fr", name: "French", isEnabled: true, sortOrder: 3},
  {code: "de", name: "German", isEnabled: false, sortOrder: 4},
];

export default function AdminTaxonomyPage() {
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [languages, setLanguages] = useState<Language[]>(initialLanguages);

  // Tag dialog state
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagForm, setTagForm] = useState<{ key: string; labels: Record<string, string> }>({
    key: "",
    labels: {},
  });

  // Language dialog state
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [languageForm, setLanguageForm] = useState<Language>({
    code: "",
    name: "",
    isEnabled: true,
    sortOrder: 0,
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "tag" | "language"; id: string } | null>(null);

  // Tag handlers
  const openTagDialog = (tag?: TagItem) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({key: tag.key, labels: {...tag.labels}});
    } else {
      setEditingTag(null);
      const defaultLabels: Record<string, string> = {};
      languages.filter(l => l.isEnabled).forEach(l => {
        defaultLabels[l.code] = "";
      });
      setTagForm({key: "", labels: defaultLabels});
    }
    setIsTagDialogOpen(true);
  };

  const saveTag = () => {
    if (!tagForm.key.trim()) return;

    if (editingTag) {
      setTags(tags.map(t => (t.key === editingTag.key ? {...tagForm} : t)));
    } else {
      setTags([...tags, {...tagForm}]);
    }
    setIsTagDialogOpen(false);
    setEditingTag(null);
  };

  const deleteTag = (key: string) => {
    setTags(tags.filter(t => t.key !== key));
    setDeleteConfirm(null);
  };

  // Language handlers
  const openLanguageDialog = (language?: Language) => {
    if (language) {
      setEditingLanguage(language);
      setLanguageForm({...language});
    } else {
      setEditingLanguage(null);
      setLanguageForm({
        code: "",
        name: "",
        isEnabled: true,
        sortOrder: languages.length + 1,
      });
    }
    setIsLanguageDialogOpen(true);
  };

  const saveLanguage = () => {
    if (!languageForm.code.trim() || !languageForm.name.trim()) return;

    if (editingLanguage) {
      setLanguages(languages.map(l => (l.code === editingLanguage.code ? {...languageForm} : l)));
    } else {
      setLanguages([...languages, {...languageForm}]);
    }
    setIsLanguageDialogOpen(false);
    setEditingLanguage(null);
  };

  const deleteLanguage = (code: string) => {
    setLanguages(languages.filter(l => l.code !== code));
    // Also remove this language from all tags
    setTags(tags.map(tag => {
      const newLabels = {...tag.labels};
      delete newLabels[code];
      return {...tag, labels: newLabels};
    }));
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Tags Section */ }
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Tag className="size-5 text-primary"/>
              Tags
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage labels used by tours and blog posts across locales.
            </p>
          </div>
          <Button onClick={ () => openTagDialog() } size="sm">
            <Plus className="size-4"/>
            Add Tag
          </Button>
        </div>
        <div className="pt-5">
          { tags.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Tag className="mx-auto size-12 opacity-30"/>
              <p className="mt-4">No tags created yet.</p>
              <Button onClick={ () => openTagDialog() } variant="outline" className="mt-4">
                <Plus className="size-4"/>
                Create your first tag
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              { tags.map(tag => (
                <div
                  key={ tag.key }
                  className="group rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-foreground">{ tag.key }</h3>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={ () => openTagDialog(tag) }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-4"/>
                        <span className="sr-only">Edit tag</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={ () => setDeleteConfirm({type: "tag", id: tag.key}) }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4"/>
                        <span className="sr-only">Delete tag</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    { Object.entries(tag.labels).map(([locale, label]) => (
                      <span
                        key={ locale }
                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                      >
                        { locale }: { label }
                      </span>
                    )) }
                  </div>
                </div>
              )) }
            </div>
          ) }
        </div>
      </section>

      {/* Languages Section */ }
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Globe className="size-5 text-primary"/>
              Locales
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage enabled locales for your content.
            </p>
          </div>
          <Button onClick={ () => openLanguageDialog() } size="sm">
            <Plus className="size-4"/>
            Add Locale
          </Button>
        </div>
        <div className="pt-5">
          { languages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Globe className="mx-auto size-12 opacity-30"/>
              <p className="mt-4">No locales configured yet.</p>
              <Button onClick={ () => openLanguageDialog() } variant="outline" className="mt-4">
                <Plus className="size-4"/>
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
                { languages
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(language => (
                    <tr key={ language.code } className="group border-b border-border/50 text-foreground">
                      <td className="py-4 pr-4 font-mono text-sm">{ language.code }</td>
                      <td className="py-4 pr-4">{ language.name }</td>
                      <td className="py-4 pr-4">
                          <span
                            className={ `rounded-lg px-2 py-1 text-xs font-semibold ${
                              language.isEnabled
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }` }
                          >
                            { language.isEnabled ? "Yes" : "No" }
                          </span>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{ language.sortOrder }</td>
                      <td className="py-4 pr-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={ () => openLanguageDialog(language) }
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-4"/>
                            <span className="sr-only">Edit locale</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={ () => setDeleteConfirm({type: "language", id: language.code}) }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4"/>
                            <span className="sr-only">Delete locale</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) }
                </tbody>
              </table>
            </div>
          ) }
        </div>
      </section>

      {/* Tag Dialog */ }
      <Dialog open={ isTagDialogOpen } onOpenChange={ setIsTagDialogOpen }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ editingTag ? "Edit Tag" : "Add New Tag" }</DialogTitle>
            <DialogDescription>
              { editingTag
                ? "Update the tag key and labels for each locale."
                : "Create a new tag with labels for each enabled locale." }
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Tag Key</FieldLabel>
              <Input
                placeholder="e.g., adventure"
                value={ tagForm.key }
                onChange={ e => setTagForm({...tagForm, key: e.target.value}) }
                disabled={ !!editingTag }
              />
            </Field>
            <div className="space-y-3">
              <FieldLabel>Labels by Locale</FieldLabel>
              { languages.filter(l => l.isEnabled).map(lang => (
                <Field key={ lang.code } orientation="horizontal" className="items-center">
                  <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">
                    { lang.code }
                  </span>
                  <Input
                    placeholder={ `Label in ${ lang.name }` }
                    value={ tagForm.labels[lang.code] || "" }
                    onChange={ e =>
                      setTagForm({
                        ...tagForm,
                        labels: {...tagForm.labels, [lang.code]: e.target.value},
                      })
                    }
                  />
                </Field>
              )) }
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsTagDialogOpen(false) }>
              Cancel
            </Button>
            <Button onClick={ saveTag }>
              <Check className="size-4"/>
              { editingTag ? "Save Changes" : "Create Tag" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */ }
      <Dialog open={ isLanguageDialogOpen } onOpenChange={ setIsLanguageDialogOpen }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ editingLanguage ? "Edit Locale" : "Add New Locale" }</DialogTitle>
            <DialogDescription>
              { editingLanguage
                ? "Update the locale configuration."
                : "Add a new locale to your site." }
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input
                placeholder="e.g., en, es, fr"
                value={ languageForm.code }
                onChange={ e => setLanguageForm({...languageForm, code: e.target.value}) }
                disabled={ !!editingLanguage }
              />
            </Field>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g., English, Spanish"
                value={ languageForm.name }
                onChange={ e => setLanguageForm({...languageForm, name: e.target.value}) }
              />
            </Field>
            <Field>
              <FieldLabel>Sort Order</FieldLabel>
              <Input
                type="number"
                min={ 1 }
                value={ languageForm.sortOrder }
                onChange={ e => setLanguageForm({...languageForm, sortOrder: parseInt(e.target.value) || 0}) }
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel className="flex-1">Enabled</FieldLabel>
              <Switch
                checked={ languageForm.isEnabled }
                onCheckedChange={ checked => setLanguageForm({...languageForm, isEnabled: checked}) }
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsLanguageDialogOpen(false) }>
              Cancel
            </Button>
            <Button onClick={ saveLanguage }>
              <Check className="size-4"/>
              { editingLanguage ? "Save Changes" : "Create Locale" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */ }
      <Dialog open={ !!deleteConfirm } onOpenChange={ () => setDeleteConfirm(null) }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              { deleteConfirm?.type === "tag"
                ? `Are you sure you want to delete the tag "${ deleteConfirm.id }"? This action cannot be undone.`
                : `Are you sure you want to delete the locale "${ deleteConfirm?.id }"? This will also remove all labels for this locale from existing tags.` }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={ () => setDeleteConfirm(null) }>
              <X className="size-4"/>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={ () => {
                if (deleteConfirm?.type === "tag") {
                  deleteTag(deleteConfirm.id);
                } else if (deleteConfirm?.type === "language") {
                  deleteLanguage(deleteConfirm.id);
                }
              } }
            >
              <Trash2 className="size-4"/>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
