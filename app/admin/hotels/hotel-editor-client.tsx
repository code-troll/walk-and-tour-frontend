"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, LoaderCircle} from "lucide-react";

import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {getAdminHotelClient} from "@/lib/admin/admin-hotel-client";
import {getAdminToursClient} from "@/lib/admin/admin-client";
import {formatAdminDate} from "@/lib/admin/format-date";
import type {components} from "@/lib/api/generated/backend-types";
import {
  createEmptyHotelFormState,
  createHotelFormStateFromApi,
  HOTEL_STATUSES,
  HOTEL_STATUS_LABELS,
  toCreateHotelBody,
  toUpdateHotelBody,
  validateHotelForm,
  type ApiHotel,
  type HotelFormErrors,
  type HotelFormState,
  type HotelStatus,
} from "@/lib/hotels/admin-hotel-types";
import {createHotelAction, setHotelToursAction, updateHotelAction} from "./actions";

type TourSummary = components["schemas"]["TourAdminListResponseDto"];

type HotelEditorClientProps = {
  mode: "create" | "edit";
  hotelId?: string;
};

const FEEDBACK_TIMEOUT_MS = 5000;

export default function HotelEditorClient({mode, hotelId}: HotelEditorClientProps) {
  const router = useRouter();

  const [form, setForm] = useState<HotelFormState>(createEmptyHotelFormState);
  const [errors, setErrors] = useState<HotelFormErrors>({});
  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [grantedTourIds, setGrantedTourIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTours, setIsSavingTours] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useAdminRouteLoadingBoundary(isLoading);

  const announce = useCallback((message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), FEEDBACK_TIMEOUT_MS);
  }, []);

  const applyHotel = useCallback((loaded: ApiHotel) => {
    setHotel(loaded);
    setForm(createHotelFormStateFromApi(loaded));
    setGrantedTourIds(loaded.tours.map((grant) => grant.tourId));
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [loadedTours, loadedHotel] = await Promise.all([
        getAdminToursClient(),
        mode === "edit" && hotelId ? getAdminHotelClient(hotelId) : Promise.resolve(null),
      ]);

      setTours(loadedTours);

      if (mode === "edit") {
        if (!loadedHotel) {
          setLoadError("This hotel was not found. It may have been removed.");
          return;
        }

        applyHotel(loadedHotel);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the hotel.");
    } finally {
      setIsLoading(false);
    }
  }, [applyHotel, hotelId, mode]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const grantedSet = useMemo(() => new Set(grantedTourIds), [grantedTourIds]);

  const savedGrantIds = useMemo(
    () => new Set((hotel?.tours ?? []).map((grant) => grant.tourId)),
    [hotel],
  );

  const hasTourChanges = useMemo(() => {
    if (savedGrantIds.size !== grantedSet.size) {
      return true;
    }

    for (const tourId of grantedSet) {
      if (!savedGrantIds.has(tourId)) {
        return true;
      }
    }

    return false;
  }, [grantedSet, savedGrantIds]);

  const updateField = <K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) => {
    setForm((current) => ({...current, [key]: value}));
    setErrors((current) => ({...current, [key]: undefined}));
  };

  const handleSubmit = async () => {
    const validation = validateHotelForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (mode === "create") {
        const result = await createHotelAction(toCreateHotelBody(form));

        if (!result.ok) {
          setFormError(result.message);
          return;
        }

        router.push(`/hotels/${result.hotel.id}`);
        return;
      }

      if (!hotelId) {
        return;
      }

      const result = await updateHotelAction({id: hotelId, body: toUpdateHotelBody(form)});

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      applyHotel(result.hotel);
      announce("Hotel details saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTours = async () => {
    if (!hotelId) {
      return;
    }

    setIsSavingTours(true);
    setFormError(null);

    try {
      const result = await setHotelToursAction({id: hotelId, tourIds: grantedTourIds});

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      applyHotel(result.hotel);
      announce("Tour grants updated.");
    } finally {
      setIsSavingTours(false);
    }
  };

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading…"
        description="Fetching the hotel and the tour catalogue."
      />
    );
  }

  if (loadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="This hotel could not be loaded."
        description={loadError}
        actions={
          <>
            <Button onClick={() => void loadWorkspace()} variant="outline">
              Retry
            </Button>
            <Button asChild variant="ghost">
              <AdminProgressLink href="/hotels">Back to hotels</AdminProgressLink>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild size="sm" variant="ghost">
          <AdminProgressLink href="/hotels">
            <ArrowLeft className="size-4" />
            Hotels
          </AdminProgressLink>
        </Button>

        {hotel ? (
          <p className="text-xs text-[#8a8477]">
            Last updated {formatAdminDate(hotel.audit.updatedAt)}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-xl border border-[#cfe4d3] bg-[#f3fbf4] px-4 py-3 text-sm text-[#2f6b3f]">
          {successMessage}
        </p>
      ) : null}

      <AdminSectionCard
        title={mode === "create" ? "Register a hotel" : hotel?.name ?? "Hotel"}
        description="These details identify the hotel for invoicing and correspondence. The hotel's own access user is registered separately."
        actions={
          <Button disabled={isSaving} onClick={() => void handleSubmit()}>
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Register hotel" : "Save details"}
          </Button>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="hotel-name">Name</Label>
            <Input
              id="hotel-name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Copenhagen Admiral Hotel"
              value={form.name}
            />
            {errors.name ? <FieldError message={errors.name} /> : null}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="hotel-address">Address</Label>
            <Input
              id="hotel-address"
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Toldbodgade 24-28, 1253 København K"
              value={form.address}
            />
            {errors.address ? <FieldError message={errors.address} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-phone">Telephone</Label>
            <Input
              id="hotel-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+45 33 74 14 14"
              value={form.phone}
            />
            {errors.phone ? <FieldError message={errors.phone} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-email">Contact email</Label>
            <Input
              id="hotel-email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="reception@example.com"
              type="email"
              value={form.email}
            />
            {errors.email ? <FieldError message={errors.email} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-cvr">CVR number</Label>
            <Input
              id="hotel-cvr"
              onChange={(event) => updateField("cvr", event.target.value)}
              placeholder="12345678"
              value={form.cvr}
            />
            <p className="mt-1 text-xs text-[#8a8477]">
              Eight digits. Spaces and a leading DK are removed automatically.
            </p>
            {errors.cvr ? <FieldError message={errors.cvr} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-status">Status</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-[#e2d9c9] bg-white px-3 text-sm text-[#21343b]"
              id="hotel-status"
              onChange={(event) => updateField("status", event.target.value as HotelStatus)}
              value={form.status}
            >
              {HOTEL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {HOTEL_STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminSectionCard>

      {mode === "edit" ? (
        <AdminSectionCard
          title="Tours this hotel may sell"
          description="Removing a tour revokes the grant. The grant stays on record, and existing bookings for it are unaffected."
          actions={
            <Button
              disabled={!hasTourChanges || isSavingTours}
              onClick={() => void handleSaveTours()}
            >
              {isSavingTours ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Save tours
            </Button>
          }
        >
          {tours.length === 0 ? (
            <p className="py-6 text-sm text-[#627176]">
              There are no tours in the catalogue yet.
            </p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {tours.map((tour) => {
                const isGranted = grantedSet.has(tour.id);

                return (
                  <li key={tour.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadfce] bg-[#fffcf7] px-4 py-3 transition hover:border-[#d8c5a8]">
                      <Checkbox
                        checked={isGranted}
                        className="mt-0.5"
                        onCheckedChange={(checked) =>
                          setGrantedTourIds((current) =>
                            checked === true
                              ? [...current, tour.id]
                              : current.filter((id) => id !== tour.id),
                          )
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#21343b]">{tour.name}</span>
                        <span className="block text-xs text-[#8a8477]">{tour.tourType}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {hasTourChanges ? (
            <p className="mt-4 text-xs text-[#9a6a2f]">
              You have unsaved changes to the tour grants.
            </p>
          ) : null}
        </AdminSectionCard>
      ) : null}
    </div>
  );
}

const FieldError = ({message}: {message: string}) => (
  <p className="mt-1 text-xs text-[#a3483f]">{message}</p>
);
