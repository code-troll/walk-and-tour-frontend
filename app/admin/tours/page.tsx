import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { getAdminViewerState } from "@/lib/admin/session";
import { loadToursListData } from "./loaders";

export default async function AdminToursPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Tour administration is not available for the marketing role."
        description="Tours are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const toursData = await loadToursListData(viewerState.accessToken);

  if ("errorMessage" in toursData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The tours workspace could not be loaded."
        description={ toursData.errorMessage ?? "Unable to load tours." }
      />
    );
  }

  const languageNameByCode = Object.fromEntries(
    toursData.languages.map((language) => [language.code, language.name]),
  );

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Tours"
        description="Create, edit, and validate the shared tour data, localized translations, and itinerary structure from one place."
        actions={
          <Button asChild>
            <Link href="/tours/new">
              <Plus className="size-4"/>
              Create Tour
            </Link>
          </Button>
        }
      >
        <div className="space-y-4">
          { toursData.tours.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              <p>No tours have been created yet.</p>
              <Button asChild className="mt-4">
                <Link href="/tours/new">
                  <Plus className="size-4"/>
                  Create your first tour
                </Link>
              </Button>
            </div>
          ) : (
            toursData.tours.map((tour) => (
              <article
                key={ tour.id }
                className="rounded-2xl border border-[#f0e6d8] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-foreground">{ tour.name }</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="truncate">Slug: { tour.slug }</span>
                      <span>
                        Duration: { typeof tour.durationMinutes === "number"
                        ? `${ tour.durationMinutes } min`
                        : "Not set" }
                      </span>
                      <span>{ Object.keys(tour.translations).length } translations</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={ `/tours/${ tour.id }` }>
                        <Pencil className="size-4"/>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  { tour.translationAvailability.map((availability) => (
                    <span
                      key={ availability.languageCode }
                      className="rounded-full border border-[#eadfce] px-3 py-1 text-xs text-muted-foreground"
                    >
                      { languageNameByCode[availability.languageCode] ?? availability.languageCode }
                      { ": " }
                      { availability.isPublished ? "Published" : "Not Published" }
                    </span>
                  )) }
                </div>
              </article>
            ))
          ) }
        </div>
      </AdminSectionCard>
    </div>
  );
}
